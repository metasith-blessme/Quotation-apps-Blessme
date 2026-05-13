import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateRCNumber } from "@/lib/rc-number";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && invoice.createdById !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if already converted
    const existingReceipt = await prisma.receipt.findFirst({
      where: { invoiceId: id },
    });
    if (existingReceipt) {
      return NextResponse.json({ id: existingReceipt.id }, { status: 200 });
    }

    const rcNumber = await generateRCNumber();

    // SECURITY: Recompute totals server-side
    const itemsWithComputedTotals = invoice.items.map((item) => ({
      ...item,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const subtotal = itemsWithComputedTotals.reduce((sum, item) => sum + item.lineTotal, 0);
    const vatAmount = (subtotal * invoice.vatRate) / 100;
    const grandTotal = subtotal + vatAmount;

    const receipt = await prisma.receipt.create({
      data: {
        rcNumber,
        status: "WAITING",
        createdById: session.user.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invNumber,
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress,
        customerTaxId: invoice.customerTaxId,
        customerPhone: invoice.customerPhone,
        customerEmail: invoice.customerEmail,
        customerContact: invoice.customerContact,
        issueDate: new Date(),
        subtotal,
        vatRate: invoice.vatRate,
        vatAmount,
        grandTotal,
        currency: invoice.currency,
        notes: invoice.notes,
        termsSnapshot: invoice.termsSnapshot,
        items: {
          create: itemsWithComputedTotals.map((item, i) => ({
            productId: item.productId,
            productNameTh: item.productNameTh,
            productNameEn: item.productNameEn,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            sortOrder: item.sortOrder ?? i,
          })),
        },
      },
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Conversion error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

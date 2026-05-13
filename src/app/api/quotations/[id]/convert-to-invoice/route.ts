import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateINVNumber } from "@/lib/inv-number";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    if (!quotation) {
      return new NextResponse("Quotation not found", { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && quotation.createdById !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Optional: Check if already converted
    const existingInvoice = await prisma.invoice.findFirst({
      where: { quotationId: id },
    });
    if (existingInvoice) {
      return NextResponse.json({ id: existingInvoice.id }, { status: 200 });
    }

    const invNumber = await generateINVNumber();

    // SECURITY: Recompute lineTotal and totals server-side
    const itemsWithComputedTotals = quotation.items.map((item) => ({
      ...item,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const subtotal = itemsWithComputedTotals.reduce((sum, item) => sum + item.lineTotal, 0);
    const vatAmount = (subtotal * quotation.vatRate) / 100;
    const grandTotal = subtotal + vatAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invNumber,
        status: "UNPAID",
        createdById: session.user.id,
        quotationId: quotation.id,
        quotationNumber: quotation.qtNumber,
        customerName: quotation.customerName,
        customerAddress: quotation.customerAddress,
        customerTaxId: quotation.customerTaxId,
        customerPhone: quotation.customerPhone,
        customerEmail: quotation.customerEmail,
        customerContact: quotation.customerContact,
        issueDate: new Date(),
        // Due date default to 30 days from now
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        vatRate: quotation.vatRate,
        vatAmount,
        grandTotal,
        currency: quotation.currency,
        notes: quotation.notes,
        termsSnapshot: quotation.termsSnapshot,
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

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Conversion error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

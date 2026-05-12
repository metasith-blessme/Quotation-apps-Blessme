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
    const billing = await prisma.billing.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!billing) {
      return new NextResponse("Billing Note not found", { status: 404 });
    }

    // Check if already converted
    const existingReceipt = await prisma.receipt.findFirst({
      where: { billingId: id },
    });
    if (existingReceipt) {
      return NextResponse.json({ id: existingReceipt.id }, { status: 200 });
    }

    const rcNumber = await generateRCNumber();

    // SECURITY: Recompute totals server-side
    const itemsWithComputedTotals = billing.items.map((item) => ({
      ...item,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const subtotal = itemsWithComputedTotals.reduce((sum, item) => sum + item.lineTotal, 0);
    const vatAmount = (subtotal * billing.vatRate) / 100;
    const grandTotal = subtotal + vatAmount;

    const receipt = await prisma.receipt.create({
      data: {
        rcNumber,
        status: "WAITING",
        createdById: session.user.id,
        billingId: billing.id,
        billingNumber: billing.bnNumber,
        invoiceId: billing.invoiceId,
        invoiceNumber: billing.invoiceNumber,
        customerName: billing.customerName,
        customerAddress: billing.customerAddress,
        customerTaxId: billing.customerTaxId,
        customerPhone: billing.customerPhone,
        customerEmail: billing.customerEmail,
        customerContact: billing.customerContact,
        issueDate: new Date(),
        subtotal,
        vatRate: billing.vatRate,
        vatAmount,
        grandTotal,
        currency: billing.currency,
        notes: billing.notes,
        termsSnapshot: billing.termsSnapshot,
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

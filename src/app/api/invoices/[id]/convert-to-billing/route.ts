import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateBNNumber } from "@/lib/bn-number";
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

    // Check if already converted
    const existingBilling = await prisma.billing.findFirst({
      where: { invoiceId: id },
    });
    if (existingBilling) {
      return NextResponse.json({ id: existingBilling.id }, { status: 200 });
    }

    const bnNumber = await generateBNNumber();

    const billing = await prisma.billing.create({
      data: {
        bnNumber,
        status: "PENDING",
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
        // Due date same as invoice or +30
        dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: invoice.subtotal,
        vatRate: invoice.vatRate,
        vatAmount: invoice.vatAmount,
        grandTotal: invoice.grandTotal,
        currency: invoice.currency,
        notes: invoice.notes,
        termsSnapshot: invoice.termsSnapshot,
        items: {
          create: invoice.items.map((item) => ({
            productId: item.productId,
            productNameTh: item.productNameTh,
            productNameEn: item.productNameEn,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });

    return NextResponse.json(billing);
  } catch (error) {
    console.error("Conversion error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

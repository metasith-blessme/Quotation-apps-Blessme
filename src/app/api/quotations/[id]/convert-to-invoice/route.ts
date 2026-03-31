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
      include: { items: true },
    });

    if (!quotation) {
      return new NextResponse("Quotation not found", { status: 404 });
    }

    // Optional: Check if already converted
    const existingInvoice = await prisma.invoice.findFirst({
      where: { quotationId: id },
    });
    if (existingInvoice) {
      return NextResponse.json({ id: existingInvoice.id }, { status: 200 });
    }

    const invNumber = await generateINVNumber();

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
        subtotal: quotation.subtotal,
        vatRate: quotation.vatRate,
        vatAmount: quotation.vatAmount,
        grandTotal: quotation.grandTotal,
        currency: quotation.currency,
        notes: quotation.notes,
        termsSnapshot: quotation.termsSnapshot,
        items: {
          create: quotation.items.map((item) => ({
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

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Conversion error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQTNumber } from "@/lib/sequence-generator";
import { quotationSchema } from "@/lib/validations/quotation.schema";
import { calculateTotals } from "@/lib/financial-calculator";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const isAdmin = session.user.role === "ADMIN";

  const quotations = await prisma.quotation.findMany({
    where: {
      ...(isAdmin ? {} : { createdById: session.user.id }),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(quotations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = quotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const qtNumber = await generateQTNumber();

  const { subtotal, vatAmount, grandTotal, items: itemsWithComputedTotals } = calculateTotals(data.items, data.vatRate);

  const quotation = await prisma.quotation.create({
    data: {
      qtNumber,
      createdById: session.user.id,
      customerName: data.customerName,
      customerAddress: data.customerAddress,
      customerTaxId: data.customerTaxId,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      customerContact: data.customerContact,
      issueDate: new Date(data.issueDate),
      validUntil: new Date(data.validUntil),
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      vatRate: data.vatRate,
      subtotal,
      vatAmount,
      grandTotal,
      notes: data.notes,
      termsSnapshot: data.termsSnapshot,
      items: {
        create: itemsWithComputedTotals.map((item) => ({
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
    include: { items: true },
  });

  return NextResponse.json(quotation, { status: 201 });
}

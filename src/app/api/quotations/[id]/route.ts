import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { quotationSchema } from "@/lib/validations/quotation.schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } }, createdBy: { select: { name: true } } },
  });

  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && quotation.createdById !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(quotation);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && existing.createdById !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  // Allow status-only updates
  if (body.status && Object.keys(body).length === 1) {
    const updated = await prisma.quotation.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json(updated);
  }

  const parsed = quotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const subtotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const vatAmount = (subtotal * data.vatRate) / 100;
  const grandTotal = subtotal + vatAmount;

  // Delete existing items and recreate
  await prisma.quotationItem.deleteMany({ where: { quotationId: id } });

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
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
        create: data.items.map((item, i) => ({
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
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && existing.createdById !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (existing.status !== "DRAFT")
    return NextResponse.json({ error: "สามารถลบได้เฉพาะใบเสนอราคาที่เป็น DRAFT เท่านั้น" }, { status: 400 });

  await prisma.quotation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

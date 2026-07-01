import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invoiceSchema, invoiceStatusUpdateSchema, invoiceDeliveryStatusUpdateSchema } from "@/lib/validations/invoice.schema";
import { calculateTotals } from "@/lib/financial-calculator";
import { syncBillingFromInvoice, syncReceiptsFromInvoice } from "@/lib/document-lifecycle";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } }, createdBy: { select: { name: true } } },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // SECURITY: Check ownership — SALES users can only see their own invoices
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && invoice.createdById !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(invoice);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // SECURITY: Check ownership — SALES users can only modify their own invoices
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && existing.createdById !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  // Allow status-only updates — SECURITY: validate status against enum
  if (body.status && Object.keys(body).length === 1) {
    const statusParsed = invoiceStatusUpdateSchema.safeParse(body);
    if (!statusParsed.success) {
      return NextResponse.json({ error: statusParsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: statusParsed.data.status },
    });
    return NextResponse.json(updated);
  }

  // Allow deliveryStatus-only updates — SECURITY: validate deliveryStatus against enum
  if (body.deliveryStatus && Object.keys(body).length === 1) {
    const deliveryParsed = invoiceDeliveryStatusUpdateSchema.safeParse(body);
    if (!deliveryParsed.success) {
      return NextResponse.json({ error: deliveryParsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { deliveryStatus: deliveryParsed.data.deliveryStatus },
    });
    return NextResponse.json(updated);
  }

  // Full invoice update
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const { subtotal, vatAmount, grandTotal, items: itemsWithComputedTotals } = calculateTotals(data.items, data.vatRate);

  // Delete existing items and recreate
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      customerName: data.customerName,
      customerAddress: data.customerAddress,
      customerTaxId: data.customerTaxId,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      customerContact: data.customerContact,
      issueDate: new Date(data.issueDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
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
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  // Cascade: sync linked Billing and Receipt with updated data
  try {
    await syncBillingFromInvoice(id);
    await syncReceiptsFromInvoice(id);
  } catch (cascadeError) {
    console.error(`[CASCADE ERROR] Failed to sync from invoice ${id}:`, cascadeError);
  }

  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQTNumber } from "@/lib/qt-number";
import { addDays } from "@/lib/utils/format";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const original = await prisma.quotation.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && original.createdById !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const qtNumber = await generateQTNumber();
  const today = new Date();

  const duplicate = await prisma.quotation.create({
    data: {
      qtNumber,
      status: "DRAFT",
      createdById: session.user.id,
      customerName: original.customerName,
      customerAddress: original.customerAddress,
      customerTaxId: original.customerTaxId,
      customerPhone: original.customerPhone,
      customerEmail: original.customerEmail,
      customerContact: original.customerContact,
      issueDate: today,
      validUntil: addDays(today, 30),
      vatRate: original.vatRate,
      subtotal: original.subtotal,
      vatAmount: original.vatAmount,
      grandTotal: original.grandTotal,
      notes: original.notes,
      termsSnapshot: original.termsSnapshot,
      items: {
        create: original.items.map((item) => ({
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

  return NextResponse.json(duplicate, { status: 201 });
}

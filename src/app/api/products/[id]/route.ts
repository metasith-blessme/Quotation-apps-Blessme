import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validations/product.schema";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tiers, ...productData } = parsed.data;

  // Use a transaction to update product and tiers
  const product = await prisma.$transaction(async (tx) => {
    // 1. Delete all existing tiers
    await tx.productTier.deleteMany({ where: { productId: id } });

    // 2. Update product and create new tiers
    return await tx.product.update({
      where: { id },
      data: {
        ...productData,
        tiers: tiers?.length
          ? {
              create: tiers.map((tier) => ({
                minQty: tier.minQty,
                price: tier.price,
              })),
            }
          : undefined,
      },
      include: { tiers: { orderBy: { minQty: "asc" } } },
    });
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}

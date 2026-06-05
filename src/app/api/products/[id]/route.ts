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

  // Calculate stockQuantity server-side for boba products
  const isBoba =
    productData.nameEn?.toLowerCase().includes("popping boba") ||
    productData.nameTh?.toLowerCase().includes("popping boba") ||
    !!(
      productData.pastedBoxes ||
      productData.pastedBags ||
      productData.unpackedBoxes ||
      productData.unpackedBags ||
      productData.chineseLabelBoxes ||
      productData.pack1 ||
      productData.pack2 ||
      productData.pack3
    );

  const calculatedStock = isBoba
    ? (productData.pastedBoxes ?? 0) * 24 +
      (productData.pastedBags ?? 0) +
      (productData.unpackedBoxes ?? 0) * 24 +
      (productData.unpackedBags ?? 0) +
      (productData.chineseLabelBoxes ?? 0) * 24 +
      (productData.pack1 ?? 0) +
      (productData.pack2 ?? 0) * 2 +
      (productData.pack3 ?? 0) * 3
    : productData.stockQuantity;

  // Use a transaction to update product and tiers
  const product = await prisma.$transaction(async (tx) => {
    // 1. Delete all existing tiers
    await tx.productTier.deleteMany({ where: { productId: id } });

    // 2. Update product and create new tiers
    return await tx.product.update({
      where: { id },
      data: {
        ...productData,
        stockQuantity: calculatedStock,
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

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validations/product.schema";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { nameTh: "asc" },
    include: { tiers: { orderBy: { minQty: "asc" } } },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tiers, ...productData } = parsed.data;

  // Calculate stockQuantity server-side for boba products
  const isBoba =
    productData.nameEn?.toLowerCase().includes("popping boba") ||
    productData.nameEn?.toLowerCase().includes("popping") ||
    productData.nameEn?.toLowerCase().includes("boba") ||
    productData.nameTh?.toLowerCase().includes("popping boba") ||
    productData.nameTh?.toLowerCase().includes("เม็ดป็อป") ||
    productData.nameTh?.toLowerCase().includes("บ๊อบบ้า") ||
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

  const product = await prisma.product.create({
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
    include: { tiers: true },
  });

  return NextResponse.json(product, { status: 201 });
}

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter } as any);

async function test() {
  const id = "product-water-chestnut";
  const tiers = [
    { minQty: 6, price: 100 },
    { minQty: 12, price: 90 },
  ];

  try {
    const product = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing tiers
      await tx.productTier.deleteMany({ where: { productId: id } });

      // 2. Update product and create new tiers
      return await tx.product.update({
        where: { id },
        data: {
          tiers: {
            create: tiers.map((tier) => ({
              minQty: tier.minQty,
              price: tier.price,
            })),
          },
        },
        include: { tiers: { orderBy: { minQty: "asc" } } },
      });
    });
    console.log("✅ Success updated product water chestnut:", product);
  } catch (err) {
    console.error("❌ Failed to update product:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();

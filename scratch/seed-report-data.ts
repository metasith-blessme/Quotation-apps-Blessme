/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Helper to calculate total bags for Boba
function calculateTotalBags(data: {
  pastedBoxes: number;
  pastedBags: number;
  unpackedBoxes: number;
  unpackedBags: number;
  chineseLabelBoxes: number;
  pack1: number;
  pack2: number;
  pack3: number;
}) {
  return (
    data.pastedBoxes * 24 +
    data.pastedBags +
    data.unpackedBoxes * 24 +
    data.unpackedBags +
    data.chineseLabelBoxes * 24 +
    data.pack1 +
    data.pack2 * 2 +
    data.pack3 * 3
  );
}

// Data from messageImage_1780659591579.jpg
const reportData = {
  barley: {
    pastedBoxes: 0,
    pastedBags: 3,
    unpackedBoxes: 0,
    unpackedBags: 0,
    chineseLabelBoxes: 0,
    pack1: 33,
    pack2: 6,
    pack3: 8,
  },
  oat: {
    pastedBoxes: 4,
    pastedBags: 6,
    unpackedBoxes: 0,
    unpackedBags: 0,
    chineseLabelBoxes: 0,
    pack1: 8,
    pack2: 2,
    pack3: 0,
  },
  redbean: {
    pastedBoxes: 0,
    pastedBags: 0,
    unpackedBoxes: 0,
    unpackedBags: 0,
    chineseLabelBoxes: 0,
    pack1: 0,
    pack2: 0,
    pack3: 0,
  },
  chestnut: {
    pastedBoxes: 7,
    pastedBags: 12,
    unpackedBoxes: 0,
    unpackedBags: 0,
    chineseLabelBoxes: 0,
    pack1: 9,
    pack2: 2,
    pack3: 1,
  },
  osmanthus: {
    pastedBoxes: 0,
    pastedBags: 0,
    unpackedBoxes: 0,
    unpackedBags: 0,
    chineseLabelBoxes: 0,
    pack1: 0,
    pack2: 0,
    pack3: 0,
  },
  cheese: {
    pastedBoxes: 1,
    pastedBags: 12,
    unpackedBoxes: 0,
    unpackedBags: 0,
    chineseLabelBoxes: 6,
    pack1: 0,
    pack2: 0,
    pack3: 0,
  },
};

async function updateDb(envFileName: string) {
  const envPath = path.resolve(__dirname, `../${envFileName}`);
  dotenv.config({ path: envPath, override: true });

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(`DATABASE_URL not found in ${envFileName}`);
    return;
  }

  console.log(`\nConnecting to: ${url} (from ${envFileName})`);

  let prismaClient: PrismaClient;
  if (url.startsWith("file:")) {
    const adapter = new PrismaLibSql({ url });
    prismaClient = new PrismaClient({ adapter } as any);
  } else {
    // remote libsql/turso
    const authToken = process.env.TURSO_AUTH_TOKEN;
    const adapter = new PrismaLibSql({ url, authToken });
    prismaClient = new PrismaClient({ adapter } as any);
  }

  try {
    const products = await prismaClient.product.findMany();
    console.log(`Found ${products.length} products to check...`);

    for (const p of products) {
      const name = (p.nameEn ?? p.nameTh ?? "").toLowerCase();
      let dataToUpdate = null;

      if (name.includes("barley") || name.includes("บาร์เลย์")) {
        dataToUpdate = reportData.barley;
        console.log(`-> Matching Barley: "${p.nameTh}" (ID: ${p.id})`);
      } else if (name.includes("oat") || name.includes("โอ๊ต")) {
        dataToUpdate = reportData.oat;
        console.log(`-> Matching Oat: "${p.nameTh}" (ID: ${p.id})`);
      } else if (name.includes("redbean") || name.includes("red bean") || name.includes("ถั่วแดง")) {
        dataToUpdate = reportData.redbean;
        console.log(`-> Matching Redbean: "${p.nameTh}" (ID: ${p.id})`);
      } else if (name.includes("water chestnut") || name.includes("chestnut") || name.includes("แห้ว")) {
        dataToUpdate = reportData.chestnut;
        console.log(`-> Matching Chestnut: "${p.nameTh}" (ID: ${p.id})`);
      } else if (name.includes("osmanthus") || name.includes("หมื่นลี้")) {
        dataToUpdate = reportData.osmanthus;
        console.log(`-> Matching Osmanthus: "${p.nameTh}" (ID: ${p.id})`);
      } else if (name.includes("cheese") || name.includes("ชีส")) {
        dataToUpdate = reportData.cheese;
        console.log(`-> Matching Cheese: "${p.nameTh}" (ID: ${p.id})`);
      }

      if (dataToUpdate) {
        const totalStock = calculateTotalBags(dataToUpdate);
        await prismaClient.product.update({
          where: { id: p.id },
          data: {
            ...dataToUpdate,
            stockQuantity: totalStock,
          },
        });
        console.log(`   Updated successfully! New Stock Total: ${totalStock} bags.`);
      }
    }
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    await prismaClient.$disconnect();
  }
}

async function main() {
  // Update local SQLite db first
  await updateDb(".env");
  
  // Update remote Turso db next (if config exists)
  await updateDb(".env.production.local");
}

main().catch(console.error);

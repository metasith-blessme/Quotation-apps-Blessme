import dotenv from "dotenv";
import path from "path";

// Load specific env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { prisma } from "../src/lib/db";

async function main() {
  console.log("Connecting to:", process.env.DATABASE_URL);
  try {
    const products = await prisma.product.findMany({
      include: { tiers: true }
    });
    products.forEach((p) => {
      console.log(`- ID: ${p.id}
  Name (TH): ${p.nameTh}
  Name (EN): ${p.nameEn}
  Active: ${p.isActive}
  Stock (Total): ${p.stockQuantity} (Threshold: ${p.lowStockThreshold})
  Pasted: ${p.pastedBoxes} boxes / ${p.pastedBags} bags
  Unpacked: ${p.unpackedBoxes} boxes / ${p.unpackedBags} bags
  Chinese Label: ${p.chineseLabelBoxes} boxes
  Packs: P1: ${p.pack1}, P2: ${p.pack2}, P3: ${p.pack3}
`);
    });
  } catch (err) {
    console.error("Database query failed:", err);
  }
}

main().catch(console.error);

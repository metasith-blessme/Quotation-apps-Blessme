import dotenv from "dotenv";
import path from "path";

// Load specific env file
dotenv.config({ path: path.resolve(__dirname, "../.env.production.local") });

import { prisma } from "../src/lib/db";

async function main() {
  console.log("Connecting to:", process.env.DATABASE_URL);
  try {
    const products = await prisma.product.findMany({
      include: { tiers: true }
    });
    console.log("Products in DB:", products.length);
    products.forEach((p) => {
      console.log(`- ID: ${p.id}, Name: ${p.nameTh}, Price: ${p.pricePerUnit}, Tiers count: ${p.tiers?.length || 0}`);
    });
  } catch (err) {
    console.error("Database query failed:", err);
  }
}

main().catch(console.error);

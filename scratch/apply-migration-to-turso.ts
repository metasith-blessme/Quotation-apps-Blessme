import dotenv from "dotenv";
import path from "path";
import { createClient } from "@libsql/client";

// Load specific env file
dotenv.config({ path: path.resolve(__dirname, "../.env.production.local") });

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("DATABASE_URL is not defined");
    return;
  }

  console.log("Connecting to Turso database:", url);
  const client = createClient({ url, authToken });

  try {
    console.log("Creating ProductTier table...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "ProductTier" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        "minQty" REAL NOT NULL,
        "price" REAL NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProductTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log("✅ ProductTier table created successfully or already exists!");

    console.log("Creating ProductTier_productId_idx index...");
    await client.execute(`
      CREATE INDEX IF NOT EXISTS "ProductTier_productId_idx" ON "ProductTier"("productId");
    `);
    console.log("✅ ProductTier_productId_idx index created successfully or already exists!");

    console.log("Database migration successfully applied to Turso!");
  } catch (err) {
    console.error("❌ Failed to apply database migration:", err);
  } finally {
    client.close();
  }
}

main().catch(console.error);

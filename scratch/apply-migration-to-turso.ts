import dotenv from "dotenv";
import path from "path";
import { createClient } from "@libsql/client";

const envPath = path.resolve(__dirname, "../.env.production.local");
dotenv.config({ path: envPath });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN in .env.production.local");
  process.exit(1);
}

console.log("Connecting to Turso:", url);
const client = createClient({ url, authToken });

async function run() {
  try {
    console.log("Applying migration to Product table on Turso...");
    
    const statements = [
      'ALTER TABLE "Product" ADD COLUMN "pastedBoxes" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Product" ADD COLUMN "pastedBags" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Product" ADD COLUMN "unpackedBoxes" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Product" ADD COLUMN "unpackedBags" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Product" ADD COLUMN "chineseLabelBoxes" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Product" ADD COLUMN "pack1" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Product" ADD COLUMN "pack2" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Product" ADD COLUMN "pack3" INTEGER NOT NULL DEFAULT 0',
    ];

    for (const stmt of statements) {
      console.log(`Executing: ${stmt}`);
      try {
        await client.execute(stmt);
        console.log("-> Success");
      } catch (e: any) {
        if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
          console.log(`-> Column already exists, skipping.`);
        } else {
          throw e;
        }
      }
    }
    
    console.log("✅ Migration applied successfully to Turso!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    client.close();
  }
}

run();

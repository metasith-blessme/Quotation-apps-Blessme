import dotenv from "dotenv";
import path from "path";
import { execSync } from "child_process";

// Load specific env file
const envPath = path.resolve(__dirname, "../.env.production.local");
dotenv.config({ path: envPath });

console.log("Pushing database schema to Turso...");
console.log("DATABASE_URL:", process.env.DATABASE_URL);

try {
  execSync("npx prisma db push", {
    env: {
      ...process.env,
    },
    stdio: "inherit",
  });
  console.log("✅ Database schema pushed successfully!");
} catch (err) {
  console.error("❌ Failed to push database schema:", err);
}

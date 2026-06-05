import dotenv from "dotenv";
import path from "path";

// Load specific env file
dotenv.config({ path: path.resolve(__dirname, "../.env.production.local") });

import { prisma } from "../src/lib/db";

async function main() {
  console.log("Connecting to:", process.env.DATABASE_URL);
  const users = await prisma.user.findMany();
  console.log("Users in DB:");
  users.forEach((u) => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}`);
  });
}

main().catch(console.error);

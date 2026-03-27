import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:../dev.db" });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Create admin user
  const adminHash = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "blessme.team@gmail.com" },
    update: {},
    create: {
      name: "Admin BlessMe",
      email: "blessme.team@gmail.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user:", admin.email);

  // Create company
  await prisma.company.upsert({
    where: { id: "company-blessme" },
    update: {},
    create: {
      id: "company-blessme",
      nameTh: "บริษัท เบลสมี ท็อปปิ้ง จำกัด",
      nameEn: "BlessMe Topping Co., Ltd.",
      address: "กรุณาอัปเดตที่อยู่บริษัทในหน้า Settings",
      taxId: "",
      phone: "",
      email: "contact@blessmetopping.com",
      termsText:
        "1. ราคานี้มีผลภายในระยะเวลาที่กำหนด\n2. กรุณาชำระเงินภายใน 30 วันหลังได้รับสินค้า\n3. บริษัทขอสงวนสิทธิ์ในการเปลี่ยนแปลงราคาโดยไม่แจ้งล่วงหน้า",
    },
  });
  console.log("✅ Company created");

  // Create sample products
  const products = [
    { nameTh: "บุก (Konjac)", nameEn: "Konjac", unit: "กก.", pricePerUnit: 120 },
    { nameTh: "ไข่มุกดำ", nameEn: "Black Tapioca Pearl", unit: "กก.", pricePerUnit: 95 },
    { nameTh: "วุ้นมะพร้าว", nameEn: "Nata de Coco", unit: "ลัง", pricePerUnit: 350 },
    { nameTh: "เยลลี่กาแฟ", nameEn: "Coffee Jelly", unit: "กก.", pricePerUnit: 110 },
    { nameTh: "ถั่วแดงหวาน", nameEn: "Sweet Red Bean", unit: "กก.", pricePerUnit: 85 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: `product-${p.nameTh}` },
      update: {},
      create: { id: `product-${p.nameTh}`, ...p },
    });
  }
  console.log("✅ Sample products created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

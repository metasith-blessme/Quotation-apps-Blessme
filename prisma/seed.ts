import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:../dev.db" });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Create admin user — use env var or fallback to default for local dev
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const adminHash = await bcrypt.hash(adminPassword, 12);
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

  const standardTiers = [
    { minQty: 6, price: 100 },
    { minQty: 12, price: 90 },
    { minQty: 24, price: 80 },
    { minQty: 120, price: 75 },
    { minQty: 240, price: 70 },
    { minQty: 2400, price: 65 },
  ];

  const toppingTiers = [
    { minQty: 72, price: 77 },
    { minQty: 120, price: 75 },
    { minQty: 240, price: 70 },
    { minQty: 2400, price: 65 },
  ];

  const cheeseTiers = standardTiers.map(t => ({ ...t, price: t.price + 30 }));

  // Create sample products with tiered pricing and low stock scenarios
  const products = [
    { 
      id: "product-cheese",
      nameTh: "Popping Boba Cheese", 
      nameEn: "Popping Boba Cheese", 
      unit: "pcs", 
      pricePerUnit: 145, 
      stockQuantity: 5, 
      lowStockThreshold: 20,
      tiers: { create: cheeseTiers }
    },
    { 
      id: "product-water-chestnut", 
      nameTh: "Popping Boba Water chestnut", 
      nameEn: "Popping Boba Water chestnut", 
      unit: "pcs", 
      pricePerUnit: 80, 
      stockQuantity: 0, 
      lowStockThreshold: 0,
      tiers: { create: toppingTiers }
    },
    { 
      id: "product-barley", 
      nameTh: "Popping Boba barley", 
      nameEn: "Popping Boba barley", 
      unit: "pcs", 
      pricePerUnit: 80, 
      stockQuantity: 0, 
      lowStockThreshold: 0,
      tiers: { create: toppingTiers }
    },
    { 
      id: "product-oat", 
      nameTh: "Popping Boba oat", 
      nameEn: "Popping Boba oat", 
      unit: "pcs", 
      pricePerUnit: 80, 
      stockQuantity: 0, 
      lowStockThreshold: 0,
      tiers: { create: toppingTiers }
    },
    { 
      id: "product-redbean", 
      nameTh: "Popping Boba Redbean", 
      nameEn: "Popping Boba Redbean", 
      unit: "pcs", 
      pricePerUnit: 80, 
      stockQuantity: 0, 
      lowStockThreshold: 0,
      tiers: { create: toppingTiers }
    },
    { 
      id: "product-osmanthus", 
      nameTh: "Popping boba Osmanthus", 
      nameEn: "Popping boba Osmanthus", 
      unit: "pcs", 
      pricePerUnit: 80, 
      stockQuantity: 0, 
      lowStockThreshold: 0,
      tiers: { create: toppingTiers }
    },
    { 
      id: "product-topping-sauce",
      nameTh: "ซอสท็อปปิ้ง รสช็อกโกแลต", 
      nameEn: "Chocolate Topping Sauce", 
      unit: "pcs", 
      pricePerUnit: 115, 
      stockQuantity: 50, 
      lowStockThreshold: 100,
      tiers: {
        create: [
          { minQty: 6, price: 100 },
          { minQty: 12, price: 90 },
          { minQty: 24, price: 80 },
          { minQty: 120, price: 75 },
          { minQty: 240, price: 70 },
          { minQty: 2400, price: 65 },
        ]
      }
    },
    { id: "product-konjac", nameTh: "บุก (Konjac)", nameEn: "Konjac", unit: "กก.", pricePerUnit: 120, stockQuantity: 0, lowStockThreshold: 0 },
    { id: "product-pearl", nameTh: "ไข่มุกดำ", nameEn: "Black Tapioca Pearl", unit: "กก.", pricePerUnit: 95, stockQuantity: 0, lowStockThreshold: 0 },
    { id: "product-nata", nameTh: "วุ้นมะพร้าว", nameEn: "Nata de Coco", unit: "ลัง", pricePerUnit: 350, stockQuantity: 0, lowStockThreshold: 0 },
  ];

  for (const p of products) {
    const { tiers, id, ...productData } = p;
    
    // First, delete existing tiers to avoid duplicates if we are refreshing
    await prisma.productTier.deleteMany({ where: { productId: id } });

    await prisma.product.upsert({
      where: { id },
      update: {
        ...productData,
        // For existing products, we don't automatically recreate tiers in upsert 
        // because it's complex, but since we deleted them above, 
        // we'll handle creation in a separate step or via create.
      },
      create: {
        id,
        ...productData,
        tiers: tiers ? tiers : undefined,
      },
    });

    // If tiers were provided and it was an update, create them now
    if (tiers) {
      await prisma.product.update({
        where: { id },
        data: { tiers },
      });
    }
  }
  console.log("✅ Sample products created with tiers and stock thresholds");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

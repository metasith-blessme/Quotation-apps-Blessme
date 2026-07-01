import { z } from "zod";

export const productTierSchema = z.object({
  id: z.string().optional(),
  minQty: z.number().min(0, "จำนวนขั้นต่ำต้องไม่ติดลบ"),
  price: z.number().min(0, "ราคาต้องไม่ติดลบ"),
});

export const productSchema = z.object({
  nameTh: z.string().min(1, "กรุณาระบุชื่อสินค้า (ภาษาไทย)"),
  nameEn: z.string().optional().nullable(),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  pricePerUnit: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  stockQuantity: z.number().min(0, "จำนวนสต็อกต้องไม่ติดลบ").default(0),
  lowStockThreshold: z.number().min(0, "จุดเตือนสต็อกต้องไม่ติดลบ").default(0),
  isActive: z.boolean().default(true),
  tiers: z.array(productTierSchema).optional(),

  // Per-channel stock (additive)
  stockTiktok: z.number().min(0, "สต็อกต้องไม่ติดลบ").default(0),
  stockShopee: z.number().min(0, "สต็อกต้องไม่ติดลบ").default(0),
  stockLineOa: z.number().min(0, "สต็อกต้องไม่ติดลบ").default(0),

  // Inventory breakdown validation
  pastedBoxes: z.number().int().min(0).default(0),
  pastedBags: z.number().int().min(0).default(0),
  unpackedBoxes: z.number().int().min(0).default(0),
  unpackedBags: z.number().int().min(0).default(0),
  chineseLabelBoxes: z.number().int().min(0).default(0),
  pack1: z.number().int().min(0).default(0),
  pack2: z.number().int().min(0).default(0),
  pack3: z.number().int().min(0).default(0),
});

export type ProductFormData = z.infer<typeof productSchema>;

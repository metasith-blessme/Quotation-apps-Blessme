import { z } from "zod";

export const productSchema = z.object({
  nameTh: z.string().min(1, "กรุณาระบุชื่อสินค้า (ภาษาไทย)"),
  nameEn: z.string().optional(),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  pricePerUnit: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  stockQuantity: z.number().min(0, "จำนวนสต็อกต้องไม่ติดลบ").default(0),
  lowStockThreshold: z.number().min(0, "จุดเตือนสต็อกต้องไม่ติดลบ").default(0),
  isActive: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

import { z } from "zod";

export const quotationItemSchema = z.object({
  productId: z.string().optional(),
  productNameTh: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  productNameEn: z.string().optional(),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  lineTotal: z.number(),
  sortOrder: z.number().optional(),
});

export const quotationSchema = z.object({
  customerName: z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
  customerAddress: z.string().optional(),
  customerTaxId: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerContact: z.string().optional(),
  issueDate: z.string().min(1),
  validUntil: z.string().min(1),
  deliveryDate: z.string().optional(),
  vatRate: z.number().min(0).max(100).default(7),
  notes: z.string().optional(),
  termsSnapshot: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
});

export type QuotationFormData = z.infer<typeof quotationSchema>;

import { z } from "zod";

export const receiptItemSchema = z.object({
  productId: z.string().optional(),
  productNameTh: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  productNameEn: z.string().optional(),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  sortOrder: z.number().optional(),
});

export const receiptSchema = z.object({
  customerName: z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
  customerAddress: z.string().optional(),
  customerTaxId: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerContact: z.string().optional(),
  issueDate: z.string().min(1),
  vatRate: z.number().min(0).max(100).default(7),
  notes: z.string().optional(),
  termsSnapshot: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
});

export const receiptStatusUpdateSchema = z.object({
  status: z.enum(["WAITING", "ISSUED", "CANCELLED"], {
    message: "สถานะไม่ถูกต้อง",
  }),
});

export type ReceiptFormData = z.infer<typeof receiptSchema>;
export type ReceiptStatusUpdate = z.infer<typeof receiptStatusUpdateSchema>;

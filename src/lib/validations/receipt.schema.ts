import { z } from "zod";
import { baseDocumentItemSchema, baseCustomerSchema } from "./shared.schema";

export const receiptItemSchema = baseDocumentItemSchema;

export const receiptSchema = baseCustomerSchema.extend({
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

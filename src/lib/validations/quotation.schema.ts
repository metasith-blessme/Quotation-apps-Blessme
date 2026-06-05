import { z } from "zod";
import { baseDocumentItemSchema, baseCustomerSchema } from "./shared.schema";

export const quotationItemSchema = baseDocumentItemSchema;

export const quotationSchema = baseCustomerSchema.extend({
  issueDate: z.string().min(1),
  validUntil: z.string().min(1),
  deliveryDate: z.string().optional(),
  vatRate: z.number().min(0).max(100).default(7),
  notes: z.string().optional(),
  termsSnapshot: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
});

// Status update schema — ONLY allow valid status values
export const quotationStatusUpdateSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"], {
    message: "สถานะไม่ถูกต้อง",
  }),
});

export type QuotationFormData = z.infer<typeof quotationSchema>;
export type QuotationStatusUpdate = z.infer<typeof quotationStatusUpdateSchema>;

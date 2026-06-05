import { z } from "zod";
import { baseDocumentItemSchema, baseCustomerSchema } from "./shared.schema";

// Line items must NOT include lineTotal — it's computed server-side
export const invoiceItemSchema = baseDocumentItemSchema;

export const invoiceSchema = baseCustomerSchema.extend({
  issueDate: z.string().min(1),
  dueDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  vatRate: z.number().min(0).max(100).default(7),
  notes: z.string().optional(),
  termsSnapshot: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
});

// Status update schema — ONLY allow valid status values
export const invoiceStatusUpdateSchema = z.object({
  status: z.enum(["UNPAID", "PAID", "OVERDUE", "CANCELLED"], {
    message: "สถานะไม่ถูกต้อง",
  }),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type InvoiceStatusUpdate = z.infer<typeof invoiceStatusUpdateSchema>;

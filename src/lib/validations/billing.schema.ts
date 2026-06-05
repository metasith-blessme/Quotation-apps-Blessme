import { z } from "zod";
import { baseDocumentItemSchema, baseCustomerSchema } from "./shared.schema";

// Line items must NOT include lineTotal — it's computed server-side
export const billingItemSchema = baseDocumentItemSchema;

export const billingSchema = baseCustomerSchema.extend({
  issueDate: z.string().min(1),
  dueDate: z.string().optional(),
  vatRate: z.number().min(0).max(100).default(7),
  notes: z.string().optional(),
  termsSnapshot: z.string().optional(),
  items: z.array(billingItemSchema).min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
});

// Status update schema — ONLY allow valid status values
export const billingStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "COLLECTED", "CANCELLED"], {
    message: "สถานะไม่ถูกต้อง",
  }),
});

export type BillingFormData = z.infer<typeof billingSchema>;
export type BillingStatusUpdate = z.infer<typeof billingStatusUpdateSchema>;

import { z } from "zod";

// Line items must NOT include lineTotal — it's computed server-side
export const billingItemSchema = z.object({
  productId: z.string().optional(),
  productNameTh: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  productNameEn: z.string().optional(),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  // lineTotal is NEVER accepted from client — computed as quantity * unitPrice server-side
  sortOrder: z.number().optional(),
});

export const billingSchema = z.object({
  customerName: z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
  customerAddress: z.string().optional(),
  customerTaxId: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerContact: z.string().optional(),
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

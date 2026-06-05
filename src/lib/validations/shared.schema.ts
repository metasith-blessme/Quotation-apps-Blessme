import { z } from "zod";

/**
 * Shared validation schema for line items in all documents
 * (Quotations, Invoices, Billing Notes, Receipts)
 */
export const baseDocumentItemSchema = z.object({
  productId: z.string().optional(),
  productNameTh: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  productNameEn: z.string().optional(),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  sortOrder: z.number().optional(),
});

/**
 * Shared validation schema for customer details in all documents
 */
export const baseCustomerSchema = z.object({
  customerName: z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
  customerAddress: z.string().optional(),
  customerTaxId: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  customerContact: z.string().optional(),
});

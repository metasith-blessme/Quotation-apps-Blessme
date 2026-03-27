import { z } from "zod";

export const clientSchema = z.object({
  name:          z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
  address:       z.string().optional(),
  taxId:         z.string().optional(),
  phone:         z.string().optional(),
  email:         z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  contactPerson: z.string().optional(),
  isActive:      z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;

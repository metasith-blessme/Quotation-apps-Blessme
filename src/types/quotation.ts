export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface QuotationItemInput {
  productId?: string;
  productNameTh: string;
  productNameEn?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder?: number;
}

export interface QuotationInput {
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerContact?: string;
  issueDate: string;
  validUntil: string;
  deliveryDate?: string;
  vatRate: number;
  notes?: string;
  termsSnapshot?: string;
  items: QuotationItemInput[];
}

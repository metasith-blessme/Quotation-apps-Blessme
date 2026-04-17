import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuotationPDFDocument } from "@/components/pdf/QuotationPDFDocument";
import { InvoicePDFDocument } from "@/components/pdf/InvoicePDFDocument";
import { BillingPDFDocument } from "@/components/pdf/BillingPDFDocument";
import { prisma } from "./db";
import { getCachedCompany } from "./company-cache";

export async function generateQuotationPDF(id: string): Promise<Buffer> {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quotation) throw new Error("Quotation not found");

  // PERFORMANCE: Use cached company settings instead of direct DB query
  const company = await getCachedCompany();
  if (!company) throw new Error("Company not configured");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(QuotationPDFDocument as any, { quotation, company });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

export async function generateInvoicePDF(id: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!invoice) throw new Error("Invoice not found");

  // PERFORMANCE: Use cached company settings instead of direct DB query
  const company = await getCachedCompany();
  if (!company) throw new Error("Company not configured");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(InvoicePDFDocument as any, { invoice, company });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

export async function generateBillingPDF(id: string): Promise<Buffer> {
  const billing = await prisma.billing.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!billing) throw new Error("Billing not found");

  // PERFORMANCE: Use cached company settings instead of direct DB query
  const company = await getCachedCompany();
  if (!company) throw new Error("Company not configured");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(BillingPDFDocument as any, { billing, company });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

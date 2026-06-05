import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuotationPDFDocument } from "@/components/pdf/QuotationPDFDocument";
import { InvoicePDFDocument } from "@/components/pdf/InvoicePDFDocument";
import { BillingPDFDocument } from "@/components/pdf/BillingPDFDocument";
import { ReceiptPDFDocument } from "@/components/pdf/ReceiptPDFDocument";
import { prisma } from "./db";
import { getCachedCompany } from "./company-cache";

const DOCUMENT_CONFIG = {
  QT: {
    model: "quotation",
    documentComponent: QuotationPDFDocument,
    propName: "quotation",
    label: "Quotation",
  },
  INV: {
    model: "invoice",
    documentComponent: InvoicePDFDocument,
    propName: "invoice",
    label: "Invoice",
  },
  BN: {
    model: "billing",
    documentComponent: BillingPDFDocument,
    propName: "billing",
    label: "Billing Note",
  },
  RC: {
    model: "receipt",
    documentComponent: ReceiptPDFDocument,
    propName: "receipt",
    label: "Receipt",
  },
} as const;

export type DocumentTypeKey = keyof typeof DOCUMENT_CONFIG;

/**
 * Centrally compiles any system document type (Quotation, Invoice, Billing, Receipt)
 * into a PDF Buffer using the dynamic Prisma delegates, cached company profile,
 * and Turbopack-safe createElement renderer.
 */
export async function compileDocumentPDF(
  type: DocumentTypeKey,
  id: string
): Promise<Buffer> {
  const config = DOCUMENT_CONFIG[type];
  if (!config) {
    throw new Error(`Invalid document type: ${type}`);
  }

  // Retrieve delegate dynamically from prisma
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[config.model];
  if (!delegate) {
    throw new Error(`Prisma delegate for model ${config.model} not found`);
  }

  const doc = await delegate.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!doc) {
    throw new Error(`${config.label} not found with ID: ${id}`);
  }

  // PERFORMANCE: Use cached company settings instead of direct DB query
  const company = await getCachedCompany();
  if (!company) {
    throw new Error("Company not configured");
  }

  // Standard React props object
  const props = {
    [config.propName]: doc,
    company,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(config.documentComponent as any, props);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

/*
 * Backward-compatible single-line wrappers for other systems
 */

export async function generateQuotationPDF(id: string): Promise<Buffer> {
  return compileDocumentPDF("QT", id);
}

export async function generateInvoicePDF(id: string): Promise<Buffer> {
  return compileDocumentPDF("INV", id);
}

export async function generateBillingPDF(id: string): Promise<Buffer> {
  return compileDocumentPDF("BN", id);
}

export async function generateReceiptPDF(id: string): Promise<Buffer> {
  return compileDocumentPDF("RC", id);
}

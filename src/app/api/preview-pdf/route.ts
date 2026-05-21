import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuotationPDFDocument } from "@/components/pdf/QuotationPDFDocument";
import { InvoicePDFDocument } from "@/components/pdf/InvoicePDFDocument";
import { BillingPDFDocument } from "@/components/pdf/BillingPDFDocument";
import { ReceiptPDFDocument } from "@/components/pdf/ReceiptPDFDocument";
import { getCachedCompany } from "@/lib/company-cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
    }

    const company = await getCachedCompany();
    if (!company) {
      return NextResponse.json({ error: "Company settings not configured" }, { status: 500 });
    }

    // Adapt transient dates from string to Date objects if needed by templates
    const formattedData = {
      ...data,
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      // Ensure line totals are calculated server-side for safety (never trust client line totals)
      items: data.items ? data.items.map((item: any, idx: number) => ({
        ...item,
        lineTotal: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        sortOrder: item.sortOrder ?? idx,
      })) : [],
    };

    // Calculate totals server-side
    formattedData.subtotal = formattedData.items.reduce((sum: number, item: any) => sum + item.lineTotal, 0);
    formattedData.vatRate = Number(data.vatRate) ?? 7;
    formattedData.vatAmount = (formattedData.subtotal * formattedData.vatRate) / 100;
    formattedData.grandTotal = formattedData.subtotal + formattedData.vatAmount;

    let element;
    if (type === "quotation") {
      element = createElement(QuotationPDFDocument as any, { quotation: formattedData, company });
    } else if (type === "invoice") {
      element = createElement(InvoicePDFDocument as any, { invoice: formattedData, company });
    } else if (type === "billing") {
      element = createElement(BillingPDFDocument as any, { billing: formattedData, company });
    } else if (type === "receipt") {
      element = createElement(ReceiptPDFDocument as any, { receipt: formattedData, company });
    } else {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const buffer = await renderToBuffer(element as any);
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (err) {
    console.error("PDF preview generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF preview" }, { status: 500 });
  }
}

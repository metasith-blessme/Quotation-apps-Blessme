import { createElement as h } from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPDFFonts } from "./shared/pdfFonts";
import { createPDFStyles, formatDate } from "./shared/pdfStyles";
import {
  PdfHeader,
  DocumentInfo,
  CustomerSection,
  ItemsTable,
  TotalsSection,
  NotesSection,
  SignatureSection,
  type Company,
  type LineItem,
} from "./shared/PDFLayout";

registerPDFFonts();

interface Receipt {
  rcNumber: string;
  issueDate: Date | string;
  customerName: string;
  customerAddress?: string | null;
  customerTaxId?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerContact?: string | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  notes?: string | null;
  termsSnapshot?: string | null;
  items: LineItem[];
}

interface Props {
  receipt: Receipt;
  company: Company;
}

export function ReceiptPDFDocument({ receipt, company }: Props) {
  const styles = createPDFStyles("#6366f1");

  const isTaxInvoice = receipt.vatRate > 0;
  const title = isTaxInvoice
    ? "ใบเสร็จรับเงิน / ใบกำกับภาษี "
    : "ใบเสร็จรับเงิน ";
  const subTitle = isTaxInvoice
    ? "RECEIPT / TAX INVOICE "
    : "RECEIPT ";

  return h(Document, null,
    h(Page, { size: "A4", style: styles.page },
      h(PdfHeader, { company, styles }),
      h(View, { style: { marginBottom: 12, alignItems: "center" } },
        h(Text, { style: styles.documentTitle }, title),
        h(Text, { style: [styles.documentTitle, { fontSize: 12, marginTop: -8 }] }, subTitle),
      ),
      h(DocumentInfo, {
        infoLines: [
          { label: "เลขที่ / No:", value: receipt.rcNumber },
          { label: "วันที่ / Date:", value: formatDate(receipt.issueDate) },
        ],
        styles,
      }),
      h(CustomerSection, {
        customerName: receipt.customerName,
        customerAddress: receipt.customerAddress,
        customerTaxId: receipt.customerTaxId,
        customerPhone: receipt.customerPhone,
        customerEmail: receipt.customerEmail,
        customerContact: receipt.customerContact,
        styles,
      }),
      h(ItemsTable, { items: receipt.items, styles }),
      h(TotalsSection, {
        subtotal: receipt.subtotal,
        vatRate: receipt.vatRate,
        vatAmount: receipt.vatAmount,
        grandTotal: receipt.grandTotal,
        styles,
      }),
      h(NotesSection, { notes: receipt.notes, termsSnapshot: receipt.termsSnapshot, styles }),
      h(SignatureSection, {
        leftLabel: "(ผู้รับเงิน / Authorized Signature)",
        rightLabel: "(ผู้จ่ายเงิน / Paid by Customer)",
        styles,
      }),
    ),
  );
}

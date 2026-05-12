import { createElement as h } from "react";
import { Document, Page } from "@react-pdf/renderer";
import { registerPDFFonts } from "./shared/pdfFonts";
import { createPDFStyles, formatDate } from "./shared/pdfStyles";
import {
  PdfHeader,
  DocumentTitle,
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

interface Invoice {
  invNumber: string;
  quotationNumber?: string | null;
  issueDate: Date | string;
  dueDate?: Date | string | null;
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
  invoice: Invoice;
  company: Company;
}

export function InvoicePDFDocument({ invoice, company }: Props) {
  const styles = createPDFStyles("#3b82f6");

  const infoLines: Array<{ label: string; value: string }> = [
    { label: "เลขที่ / No:", value: invoice.invNumber },
  ];

  if (invoice.quotationNumber) {
    infoLines.push({ label: "อ้างอิงใบเสนอราคา / Ref QT:", value: invoice.quotationNumber });
  }

  infoLines.push({ label: "วันที่ / Date:", value: formatDate(invoice.issueDate) });

  if (invoice.dueDate) {
    infoLines.push({ label: "ครบกำหนด / Due Date:", value: formatDate(invoice.dueDate) });
  }

  return h(Document, null,
    h(Page, { size: "A4", style: styles.page },
      h(PdfHeader, { company, styles }),
      h(DocumentTitle, { title: "ใบแจ้งหนี้ / INVOICE", styles }),
      h(DocumentInfo, { infoLines, styles }),
      h(CustomerSection, {
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress,
        customerTaxId: invoice.customerTaxId,
        customerPhone: invoice.customerPhone,
        customerEmail: invoice.customerEmail,
        customerContact: invoice.customerContact,
        styles,
      }),
      h(ItemsTable, { items: invoice.items, styles }),
      h(TotalsSection, {
        subtotal: invoice.subtotal,
        vatRate: invoice.vatRate,
        vatAmount: invoice.vatAmount,
        grandTotal: invoice.grandTotal,
        styles,
      }),
      h(NotesSection, { notes: invoice.notes, termsSnapshot: invoice.termsSnapshot, styles }),
      h(SignatureSection, {
        leftLabel: "(ผู้ออกใบแจ้งหนี้ / Issued by)",
        rightLabel: "(ผู้รับใบแจ้งหนี้ / Received by)",
        styles,
      }),
    ),
  );
}

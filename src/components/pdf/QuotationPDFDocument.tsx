import React from "react";
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

// PERFORMANCE: Register fonts at module load time
registerPDFFonts();

interface Quotation {
  qtNumber: string;
  issueDate: Date | string;
  validUntil: Date | string;
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
  quotation: Quotation;
  company: Company;
}

export function QuotationPDFDocument({ quotation, company }: Props) {
  const styles = createPDFStyles("#16a34a");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader company={company} styles={styles} />
        <DocumentTitle title="ใบเสนอราคา / QUOTATION" styles={styles} />
        <DocumentInfo
          infoLines={[
            { label: "เลขที่ / No:", value: quotation.qtNumber },
            { label: "วันที่ / Date:", value: formatDate(quotation.issueDate) },
            { label: "ใช้ได้ถึง / Valid Until:", value: formatDate(quotation.validUntil) },
          ]}
          styles={styles}
        />
        <CustomerSection
          customerName={quotation.customerName}
          customerAddress={quotation.customerAddress}
          customerTaxId={quotation.customerTaxId}
          customerPhone={quotation.customerPhone}
          customerEmail={quotation.customerEmail}
          customerContact={quotation.customerContact}
          styles={styles}
        />
        <ItemsTable items={quotation.items} styles={styles} />
        <TotalsSection
          subtotal={quotation.subtotal}
          vatRate={quotation.vatRate}
          vatAmount={quotation.vatAmount}
          grandTotal={quotation.grandTotal}
          styles={styles}
        />
        <NotesSection notes={quotation.notes} termsSnapshot={quotation.termsSnapshot} styles={styles} />
        <SignatureSection
          leftLabel="(ผู้เสนอราคา / Authorized Signature)"
          rightLabel="(ผู้อนุมัติ / Accepted by Customer)"
          styles={styles}
        />
      </Page>
    </Document>
  );
}

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

interface Billing {
  bnNumber: string;
  invoiceNumber?: string | null;
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
  billing: Billing;
  company: Company;
}

export function BillingPDFDocument({ billing, company }: Props) {
  const styles = createPDFStyles("#3b82f6");

  // Build info lines dynamically
  const infoLines: Array<{ label: string; value: string }> = [
    { label: "เลขที่ / No:", value: billing.bnNumber },
  ];

  if (billing.invoiceNumber) {
    infoLines.push({ label: "อ้างอิงใบแจ้งหนี้ / Ref INV:", value: billing.invoiceNumber });
  }

  infoLines.push({ label: "วันที่ / Date:", value: formatDate(billing.issueDate) });

  if (billing.dueDate) {
    infoLines.push({ label: "ครบกำหนด / Due Date:", value: formatDate(billing.dueDate) });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader company={company} styles={styles} />
        <DocumentTitle title="ใบวางบิล / BILLING NOTE" styles={styles} />
        <DocumentInfo infoLines={infoLines} styles={styles} />
        <CustomerSection
          customerName={billing.customerName}
          customerAddress={billing.customerAddress}
          customerTaxId={billing.customerTaxId}
          customerPhone={billing.customerPhone}
          customerEmail={billing.customerEmail}
          customerContact={billing.customerContact}
          styles={styles}
        />
        <ItemsTable items={billing.items} styles={styles} />
        <TotalsSection
          subtotal={billing.subtotal}
          vatRate={billing.vatRate}
          vatAmount={billing.vatAmount}
          grandTotal={billing.grandTotal}
          styles={styles}
        />
        <NotesSection notes={billing.notes} termsSnapshot={billing.termsSnapshot} styles={styles} />
        <SignatureSection
          leftLabel="(ผู้วางบิล / Billed by)"
          rightLabel="(ผู้รับบิล / Received by)"
          styles={styles}
        />
      </Page>
    </Document>
  );
}

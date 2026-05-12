import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
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

// Register fonts
registerPDFFonts();

interface Receipt {
  rcNumber: string;
  issueDate: Date | string;
  customerName: string;
  customerAddress?: string | null;
  customerTaxId?: string | null;
  customerPhone?: string | null;
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
  // Use a distinct color for receipts (e.g., purple or indigo)
  const styles = createPDFStyles("#6366f1");

  const isTaxInvoice = receipt.vatRate > 0;
  const title = isTaxInvoice
    ? "ใบเสร็จรับเงิน / ใบกำกับภาษี "
    : "ใบเสร็จรับเงิน ";
  const subTitle = isTaxInvoice
    ? "RECEIPT / TAX INVOICE "
    : "RECEIPT ";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader company={company} styles={styles} />
        <View style={{ marginBottom: 12, alignItems: 'center' }}>
          <Text style={styles.documentTitle}>{title}</Text>
          <Text style={[styles.documentTitle, { fontSize: 12, marginTop: -8 }]}>{subTitle}</Text>
        </View>
        <DocumentInfo
          infoLines={[
            { label: "เลขที่ / No:", value: receipt.rcNumber },
            { label: "วันที่ / Date:", value: formatDate(receipt.issueDate) },
          ]}
          styles={styles}
        />
        <CustomerSection
          customerName={receipt.customerName}
          customerAddress={receipt.customerAddress}
          customerTaxId={receipt.customerTaxId}
          customerPhone={receipt.customerPhone}
          customerContact={receipt.customerContact}
          styles={styles}
        />
        <ItemsTable items={receipt.items} styles={styles} />
        <TotalsSection
          subtotal={receipt.subtotal}
          vatRate={receipt.vatRate}
          vatAmount={receipt.vatAmount}
          grandTotal={receipt.grandTotal}
          styles={styles}
        />
        <NotesSection notes={receipt.notes} termsSnapshot={receipt.termsSnapshot} styles={styles} />
        <SignatureSection
          leftLabel="(ผู้รับเงิน / Authorized Signature)"
          rightLabel="(ผู้จ่ายเงิน / Paid by Customer)"
          styles={styles}
        />
      </Page>
    </Document>
  );
}

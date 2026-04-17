import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import path from "path";

// Register Thai font
Font.register({
  family: "Sarabun",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Sarabun-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "public/fonts/Sarabun-Bold.ttf"), fontWeight: "bold" },
  ],
});

// Smart hyphenation for Thai text: never break combining marks
Font.registerHyphenationCallback((word) => {
  // Check if word contains Thai characters
  const hasThaiChars = /[\u0E00-\u0E7F]/.test(word);

  if (!hasThaiChars) {
    // For non-Thai words, use default hyphenation
    return undefined;
  }

  // For Thai text, break smartly without separating combining marks
  if (word.length > 20) {
    const parts = [];
    let current = '';

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const isCombiningMark = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(char);

      current += char;

      // Break at ~15 chars, but only if next char is not a combining mark
      if (current.length >= 15 && !isCombiningMark && i < word.length - 1) {
        const nextChar = word[i + 1];
        if (!/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(nextChar)) {
          parts.push(current);
          current = '';
        }
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts.length > 1 ? parts : [word];
  }

  return [word];
});

const styles = StyleSheet.create({
  page: { fontFamily: "Sarabun", fontSize: 10, padding: 40, color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: "#16a34a" },
  logo: { width: 60, height: 60, objectFit: "contain" },
  companyBlock: { flex: 1, paddingLeft: 12 },
  companyName: { fontSize: 13, fontWeight: "bold", color: "#16a34a", marginBottom: 2, paddingRight: 20 },
  companyDetail: { fontSize: 9, color: "#6b7280", lineHeight: 1.4, paddingRight: 20 },
  qtTitle: { fontSize: 16, fontWeight: "bold", textAlign: "center", color: "#111827", marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 },
  infoGrid: { width: 200 },
  infoLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  infoLabel: { color: "#6b7280", fontSize: 9 },
  infoValue: { fontWeight: "bold", fontSize: 9 },
  customerSection: { backgroundColor: "#f9fafb", padding: 12, borderRadius: 4, marginBottom: 16 },
  sectionLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 },
  customerName: { fontSize: 11, fontWeight: "bold", marginBottom: 2 },
  customerDetail: { fontSize: 9, color: "#4b5563", lineHeight: 1.4 },
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "6 4", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  tableRow: { flexDirection: "row", padding: "5 4", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  colNo: { width: 30 },
  colProduct: { flex: 1 },
  colUnit: { width: 50, textAlign: "center" },
  colQty: { width: 75, textAlign: "right" },
  colPrice: { width: 85, textAlign: "right" },
  colTotal: { width: 85, textAlign: "right" },
  headerText: { fontSize: 8, fontWeight: "bold", color: "#6b7280" },
  productName: { fontSize: 9, fontWeight: "bold" },
  productNameEn: { fontSize: 8, color: "#9ca3af" },
  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  totalsBox: { width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { color: "#6b7280", fontSize: 9 },
  totalValue: { fontSize: 9 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTopWidth: 1.5, borderTopColor: "#16a34a", marginTop: 4 },
  grandTotalLabel: { fontWeight: "bold", fontSize: 11, color: "#16a34a" },
  grandTotalValue: { fontWeight: "bold", fontSize: 11, color: "#16a34a" },
  notesSection: { marginBottom: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb", minHeight: 40 },
  notesLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3, fontWeight: "bold" },
  notesText: { fontSize: 9, color: "#4b5563", lineHeight: 1.6 },
  signatureSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  signatureBox: { width: "45%", alignItems: "center" },
  signatureLine: { width: "100%", borderBottomWidth: 1, borderBottomColor: "#d1d5db", marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: "#6b7280" },
  signatureDate: { fontSize: 8, color: "#9ca3af", marginTop: 4 },
});

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
}

interface QuotationItem {
  productNameTh: string;
  productNameEn?: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Quotation {
  qtNumber: string;
  issueDate: Date | string;
  validUntil: Date | string;
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
  items: QuotationItem[];
}

interface Company {
  nameTh: string;
  nameEn?: string | null;
  address: string;
  taxId: string;
  phone: string;
  email: string;
  logoPath?: string | null;
}

interface Props {
  quotation: Quotation;
  company: Company;
}

export function QuotationPDFDocument({ quotation, company }: Props) {
  const logoSrc = company.logoPath
    ? path.join(process.cwd(), "public", company.logoPath)
    : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoSrc && <Image src={logoSrc} style={styles.logo} />}
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{company.nameTh} </Text>
            {company.nameEn && <Text style={styles.companyDetail}>{company.nameEn} </Text>}
            <Text style={styles.companyDetail}>{company.address} </Text>
            <Text style={styles.companyDetail}>
              {company.phone && `โทร: ${company.phone}  `}
              {company.email && `อีเมล: ${company.email} `}
            </Text>
            {company.taxId && <Text style={styles.companyDetail}>เลขประจำตัวผู้เสียภาษี: {company.taxId} </Text>}
          </View>
        </View>

        {/* QT Title + Info */}
        <Text style={styles.qtTitle}>ใบเสนอราคา / QUOTATION</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoGrid}>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>เลขที่ / No:</Text>
              <Text style={styles.infoValue}>{quotation.qtNumber}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>วันที่ / Date:</Text>
              <Text style={styles.infoValue}>{fmtDate(quotation.issueDate)}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>ใช้ได้ถึง / Valid Until:</Text>
              <Text style={styles.infoValue}>{fmtDate(quotation.validUntil)}</Text>
            </View>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionLabel}>เรียน / To</Text>
          <Text style={styles.customerName}>{quotation.customerName} </Text>
          {quotation.customerAddress && <Text style={styles.customerDetail}>{quotation.customerAddress} </Text>}
          <Text style={styles.customerDetail}>
            {quotation.customerTaxId && `เลขภาษี / Tax ID: ${quotation.customerTaxId}   `}
            {quotation.customerPhone && `โทร / Tel: ${quotation.customerPhone}   `}
            {quotation.customerContact && `ผู้ติดต่อ / Contact: ${quotation.customerContact} `}
          </Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colNo, styles.headerText]}>#</Text>
            <Text style={[styles.colProduct, styles.headerText]}>รายการสินค้า / Description</Text>
            <Text style={[styles.colUnit, styles.headerText]}>หน่วย / Unit</Text>
            <Text style={[styles.colQty, styles.headerText]}>จำนวน / Qty</Text>
            <Text style={[styles.colPrice, styles.headerText]}>ราคา/หน่วย / Price</Text>
            <Text style={[styles.colTotal, styles.headerText]}>รวม / Total</Text>
          </View>
          {quotation.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colNo}>{i + 1}</Text>
              <View style={styles.colProduct}>
                <Text style={styles.productName}>{item.productNameTh}</Text>
                {item.productNameEn && <Text style={styles.productNameEn}>{item.productNameEn}</Text>}
              </View>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colQty}>{item.quantity.toLocaleString("th-TH")}</Text>
              <Text style={styles.colPrice}>{fmt(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{fmt(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ราคาก่อนภาษี / Subtotal</Text>
              <Text style={styles.totalValue}>฿{fmt(quotation.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ภาษีมูลค่าเพิ่ม / VAT {quotation.vatRate}%</Text>
              <Text style={styles.totalValue}>฿{fmt(quotation.vatAmount)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>รวมทั้งสิ้น / Grand Total</Text>
              <Text style={styles.grandTotalValue}>฿{fmt(quotation.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        {(quotation.notes || quotation.termsSnapshot) && (
          <View style={styles.notesSection}>
            {quotation.notes && (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.notesLabel}>หมายเหตุ / Notes</Text>
                <Text style={styles.notesText}>{quotation.notes}</Text>
              </View>
            )}
            {quotation.termsSnapshot && (
              <View>
                <Text style={styles.notesLabel}>เงื่อนไขการขาย / Terms & Conditions</Text>
                <Text style={styles.notesText}>{quotation.termsSnapshot}</Text>
              </View>
            )}
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>(ผู้เสนอราคา / Authorized Signature)</Text>
            <Text style={styles.signatureDate}>วันที่ / Date _______________</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>(ผู้อนุมัติ / Accepted by Customer)</Text>
            <Text style={styles.signatureDate}>วันที่ / Date _______________</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

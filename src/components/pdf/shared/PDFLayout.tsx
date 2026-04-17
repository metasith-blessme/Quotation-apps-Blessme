import React from "react";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import path from "path";
import { formatNumber } from "./pdfStyles";

type PDFStyles = ReturnType<typeof StyleSheet.create>;

export interface Company {
  nameTh: string;
  nameEn?: string | null;
  address: string;
  taxId: string;
  phone: string;
  email: string;
  logoPath?: string | null;
}

export interface LineItem {
  productNameTh: string;
  productNameEn?: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PdfHeaderProps {
  company: Company;
  styles: PDFStyles;
}

export function PdfHeader({ company, styles }: PdfHeaderProps) {
  const logoSrc = company.logoPath ? path.join(process.cwd(), "public", company.logoPath) : null;

  return (
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
  );
}

interface DocumentTitleProps {
  title: string;
  styles: PDFStyles;
}

export function DocumentTitle({ title, styles }: DocumentTitleProps) {
  return <Text style={styles.documentTitle}>{title}</Text>;
}

interface DocumentInfoProps {
  infoLines: Array<{ label: string; value: string }>;
  styles: PDFStyles;
}

export function DocumentInfo({ infoLines, styles }: DocumentInfoProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoGrid}>
        {infoLines.map((line, i) => (
          <View key={i} style={styles.infoLine}>
            <Text style={styles.infoLabel}>{line.label}</Text>
            <Text style={styles.infoValue}>{line.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface CustomerSectionProps {
  customerName: string;
  customerAddress?: string | null;
  customerTaxId?: string | null;
  customerPhone?: string | null;
  customerContact?: string | null;
  styles: PDFStyles;
}

export function CustomerSection({
  customerName,
  customerAddress,
  customerTaxId,
  customerPhone,
  customerContact,
  styles,
}: CustomerSectionProps) {
  return (
    <View style={styles.customerSection}>
      <Text style={styles.sectionLabel}>เรียน / To</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.customerName}>{customerName} </Text>
      </View>
      {customerAddress && (
        <View style={{ flex: 1 }}>
          <Text style={styles.customerDetail}>{customerAddress} </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.customerDetail}>
          {customerTaxId && `เลขภาษี / Tax ID: ${customerTaxId}   `}
          {customerPhone && `โทร / Tel: ${customerPhone}   `}
          {customerContact && `ผู้ติดต่อ / Contact: ${customerContact} `}
        </Text>
      </View>
    </View>
  );
}

interface ItemsTableProps {
  items: LineItem[];
  styles: PDFStyles;
}

export function ItemsTable({ items, styles }: ItemsTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.colNo, styles.headerText]}>#</Text>
        <Text style={[styles.colProduct, styles.headerText]}>รายการสินค้า / Description</Text>
        <Text style={[styles.colUnit, styles.headerText]}>หน่วย / Unit</Text>
        <Text style={[styles.colQty, styles.headerText]}>จำนวน / Qty</Text>
        <Text style={[styles.colPrice, styles.headerText]}>ราคา/หน่วย / Price</Text>
        <Text style={[styles.colTotal, styles.headerText]}>รวม / Total</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.colNo}>{i + 1}</Text>
          <View style={styles.colProduct}>
            <Text style={styles.productName}>{item.productNameTh}</Text>
            {item.productNameEn && <Text style={styles.productNameEn}>{item.productNameEn}</Text>}
          </View>
          <Text style={styles.colUnit}>{item.unit}</Text>
          <Text style={styles.colQty}>{item.quantity.toLocaleString("th-TH")}</Text>
          <Text style={styles.colPrice}>{formatNumber(item.unitPrice)}</Text>
          <Text style={styles.colTotal}>{formatNumber(item.lineTotal)}</Text>
        </View>
      ))}
    </View>
  );
}

interface TotalsSectionProps {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  styles: PDFStyles;
}

export function TotalsSection({ subtotal, vatRate, vatAmount, grandTotal, styles }: TotalsSectionProps) {
  return (
    <View style={styles.totalsSection}>
      <View style={styles.totalsBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>ราคาก่อนภาษี / Subtotal</Text>
          <Text style={styles.totalValue}>฿{formatNumber(subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>ภาษีมูลค่าเพิ่ม / VAT {vatRate}%</Text>
          <Text style={styles.totalValue}>฿{formatNumber(vatAmount)}</Text>
        </View>
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>รวมทั้งสิ้น / Grand Total</Text>
          <Text style={styles.grandTotalValue}>฿{formatNumber(grandTotal)}</Text>
        </View>
      </View>
    </View>
  );
}

interface NotesSectionProps {
  notes?: string | null;
  termsSnapshot?: string | null;
  styles: PDFStyles;
}

export function NotesSection({ notes, termsSnapshot, styles }: NotesSectionProps) {
  if (!notes && !termsSnapshot) return null;

  return (
    <View style={styles.notesSection}>
      {notes && (
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.notesLabel}>หมายเหตุ / Notes</Text>
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      )}
      {termsSnapshot && (
        <View>
          <Text style={styles.notesLabel}>เงื่อนไขการขาย / Terms & Conditions</Text>
          <Text style={styles.notesText}>{termsSnapshot}</Text>
        </View>
      )}
    </View>
  );
}

interface SignatureSectionProps {
  leftLabel: string;
  rightLabel: string;
  styles: PDFStyles;
}

export function SignatureSection({ leftLabel, rightLabel, styles }: SignatureSectionProps) {
  return (
    <View style={styles.signatureSection}>
      <View style={styles.signatureBox}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>{leftLabel}</Text>
        <Text style={styles.signatureDate}>วันที่ / Date _______________</Text>
      </View>
      <View style={styles.signatureBox}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>{rightLabel}</Text>
        <Text style={styles.signatureDate}>วันที่ / Date _______________</Text>
      </View>
    </View>
  );
}

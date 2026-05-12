import { createElement as h } from "react";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import path from "path";
import { formatNumber } from "./pdfStyles";
import { bahtText } from "@/lib/thai-text";

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

// ── All components use createElement() instead of JSX ──
// Turbopack's JSX transform produces multi-child Text nodes that
// @react-pdf/renderer silently drops on Vercel. Using createElement
// with template-literal strings guarantees single-child Text nodes.

export function PdfHeader({ company, styles }: PdfHeaderProps) {
  const logoSrc = company.logoPath ? path.join(process.cwd(), "public", company.logoPath) : null;

  return h(View, { style: styles.header },
    h(View, { style: { width: 60, height: 60 } },
      logoSrc ? h(Image, { src: logoSrc, style: styles.logo }) : null
    ),
    h(View, { style: styles.companyBlock },
      h(Text, { style: styles.companyName }, `${company.nameTh} `),
      company.nameEn ? h(Text, { style: styles.companyDetail }, `${company.nameEn} `) : null,
      h(Text, { style: styles.companyDetail }, `${company.address} `),
      h(View, { style: { flexDirection: "row", flexWrap: "wrap" } },
        company.phone ? h(Text, { style: styles.companyDetail }, `โทร: ${company.phone}   `) : null,
        company.email ? h(Text, { style: styles.companyDetail }, `อีเมล: ${company.email}   `) : null,
      ),
      company.taxId ? h(Text, { style: styles.companyDetail }, `เลขประจำตัวผู้เสียภาษี: ${company.taxId} `) : null,
    ),
  );
}

interface DocumentTitleProps {
  title: string;
  styles: PDFStyles;
}

export function DocumentTitle({ title, styles }: DocumentTitleProps) {
  return h(Text, { style: styles.documentTitle }, `${title} `);
}

interface DocumentInfoProps {
  infoLines: Array<{ label: string; value: string }>;
  styles: PDFStyles;
}

export function DocumentInfo({ infoLines, styles }: DocumentInfoProps) {
  return h(View, { style: styles.infoRow },
    h(View, { style: styles.infoGrid },
      ...infoLines.map((line, i) =>
        h(View, { key: i, style: styles.infoLine },
          h(View, { style: { flex: 1 } },
            h(Text, { style: styles.infoLabel }, `${line.label} `),
          ),
          h(View, { style: { minWidth: 100, alignItems: "flex-end" } },
            h(Text, { style: styles.infoValue }, `${line.value || "-"} `),
          ),
        )
      ),
    ),
  );
}

interface CustomerSectionProps {
  customerName: string;
  customerAddress?: string | null;
  customerTaxId?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerContact?: string | null;
  styles: PDFStyles;
}

export function CustomerSection({
  customerName,
  customerAddress,
  customerTaxId,
  customerPhone,
  customerEmail,
  customerContact,
  styles,
}: CustomerSectionProps) {
  return h(View, { style: styles.customerSection },
    h(Text, { style: styles.sectionLabel }, `เรียน / To `),
    h(Text, { style: styles.customerName }, `${customerName} `),
    customerAddress ? h(Text, { style: styles.customerDetail }, `${customerAddress} `) : null,
    h(View, { style: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 } },
      customerTaxId ? h(Text, { style: styles.customerDetail }, `เลขภาษี / Tax ID: ${customerTaxId}    `) : null,
      customerPhone ? h(Text, { style: styles.customerDetail }, `โทร / Tel: ${customerPhone}    `) : null,
      customerEmail ? h(Text, { style: styles.customerDetail }, `อีเมล / Email: ${customerEmail}    `) : null,
      customerContact ? h(Text, { style: styles.customerDetail }, `ผู้ติดต่อ / Contact: ${customerContact} `) : null,
    ),
  );
}

interface ItemsTableProps {
  items: LineItem[];
  styles: PDFStyles;
}

export function ItemsTable({ items, styles }: ItemsTableProps) {
  return h(View, { style: styles.table },
    h(View, { style: styles.tableHeader },
      h(Text, { style: [styles.colNo, styles.headerText] }, `# `),
      h(Text, { style: [styles.colProduct, styles.headerText] }, `รายการสินค้า / Description `),
      h(Text, { style: [styles.colUnit, styles.headerText] }, `หน่วย / Unit `),
      h(Text, { style: [styles.colQty, styles.headerText] }, `จำนวน / Qty `),
      h(Text, { style: [styles.colPrice, styles.headerText] }, `ราคา/หน่วย / Price `),
      h(Text, { style: [styles.colTotal, styles.headerText] }, `รวม / Total `),
    ),
    ...items.map((item, i) =>
      h(View, { key: i, style: styles.tableRow, wrap: false },
        h(Text, { style: styles.colNo }, `${i + 1} `),
        h(View, { style: styles.colProduct },
          h(Text, { style: styles.productName }, `${item.productNameTh || "-"} `),
          item.productNameEn ? h(Text, { style: styles.productNameEn }, `${item.productNameEn} `) : null,
        ),
        h(Text, { style: styles.colUnit }, `${item.unit || "-"} `),
        h(Text, { style: styles.colQty }, `${(item.quantity || 0).toLocaleString("en-US")} `),
        h(Text, { style: styles.colPrice }, `฿${formatNumber(item.unitPrice || 0)} `),
        h(Text, { style: styles.colTotal }, `฿${formatNumber(item.lineTotal || 0)} `),
      )
    ),
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
  return h(View, { style: styles.totalsSection },
    h(View, { style: styles.totalsBox },
      h(View, { style: styles.totalRow },
        h(Text, { style: styles.totalLabel }, `ราคาก่อนภาษี / Subtotal `),
        h(Text, { style: styles.totalValue }, `฿${formatNumber(subtotal)} `),
      ),
      h(View, { style: styles.totalRow },
        h(Text, { style: styles.totalLabel }, `ภาษีมูลค่าเพิ่ม / VAT ${vatRate}% `),
        h(Text, { style: styles.totalValue }, `฿${formatNumber(vatAmount)} `),
      ),
      h(View, { style: styles.grandTotalRow },
        h(Text, { style: styles.grandTotalLabel }, `รวมทั้งสิ้น / Grand Total `),
        h(Text, { style: styles.grandTotalValue }, `฿${formatNumber(grandTotal)} `),
      ),
      h(View, { style: { marginTop: 4, padding: 4, backgroundColor: "#f3f4f6", borderRadius: 2 } },
        h(Text, { style: { fontSize: 8, color: "#4b5563", textAlign: "center", fontWeight: "bold" } },
          `(${bahtText(grandTotal)}) `
        ),
      ),
    ),
  );
}

interface NotesSectionProps {
  notes?: string | null;
  termsSnapshot?: string | null;
  styles: PDFStyles;
}

export function NotesSection({ notes, termsSnapshot, styles }: NotesSectionProps) {
  if (!notes && !termsSnapshot) return null;

  return h(View, { style: styles.notesSection, wrap: false },
    notes ? h(View, { style: { marginBottom: 8 } },
      h(Text, { style: styles.notesLabel }, `หมายเหตุ / Notes `),
      h(Text, { style: styles.notesText }, `${notes} `),
    ) : null,
    termsSnapshot ? h(View, null,
      h(Text, { style: styles.notesLabel }, `เงื่อนไขการขาย / Terms & Conditions `),
      h(Text, { style: styles.notesText }, `${termsSnapshot} `),
    ) : null,
  );
}

interface SignatureSectionProps {
  leftLabel: string;
  rightLabel: string;
  styles: PDFStyles;
}

export function SignatureSection({ leftLabel, rightLabel, styles }: SignatureSectionProps) {
  return h(View, { style: styles.signatureSection, wrap: false },
    h(View, { style: styles.signatureBox },
      h(View, { style: styles.signatureLine }),
      h(Text, { style: styles.signatureLabel }, `${leftLabel} `),
      h(Text, { style: styles.signatureDate }, `วันที่ / Date _______________ `),
    ),
    h(View, { style: styles.signatureBox },
      h(View, { style: styles.signatureLine }),
      h(Text, { style: styles.signatureLabel }, `${rightLabel} `),
      h(Text, { style: styles.signatureDate }, `วันที่ / Date _______________ `),
    ),
  );
}

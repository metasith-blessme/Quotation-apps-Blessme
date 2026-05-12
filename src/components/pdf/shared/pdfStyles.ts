import { StyleSheet } from "@react-pdf/renderer";

/**
 * Create PDF styles with customizable accent color.
 * PERFORMANCE: Hoisting style factory avoids recreating StyleSheet on every render.
 */
export function createPDFStyles(accentColor: string) {
  return StyleSheet.create({
    page: { fontFamily: "Sarabun", fontSize: 10, padding: 40, color: "#111827" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
    },
    logo: { width: 60, height: 60, objectFit: "contain" },
    companyBlock: { flex: 1, paddingLeft: 12 },
    companyName: {
      fontSize: 13,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 2,
      paddingRight: 20,
    },
    companyDetail: { fontSize: 9, color: "#6b7280", lineHeight: 1.4, paddingRight: 20 },
    documentTitle: { 
      fontSize: 16, 
      fontWeight: "bold", 
      textAlign: "center", 
      color: "#111827", 
      marginBottom: 12,
      paddingRight: 20, // Prevents clipping at end of title
    },
    infoRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 },
    infoGrid: { width: 220 }, // Increased width slightly
    infoLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    infoLabel: { color: "#6b7280", fontSize: 9, paddingRight: 8 },
    infoValue: { fontWeight: "bold", fontSize: 9, paddingRight: 10 }, // Padding for data completeness
    customerSection: { backgroundColor: "#f9fafb", padding: 12, paddingRight: 16, borderRadius: 4, marginBottom: 16 },
    sectionLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", marginBottom: 4, paddingRight: 10 },
    customerName: { fontSize: 11, fontWeight: "bold", marginBottom: 2, paddingRight: 10 },
    customerDetail: { fontSize: 9, color: "#4b5563", lineHeight: 1.4, paddingRight: 10 },
    table: { marginBottom: 16 },
    tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "6 4", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#e5e7eb" },
    tableRow: { flexDirection: "row", padding: "5 4", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
    colNo: { width: 30, paddingRight: 4 },
    colProduct: { flex: 1, paddingRight: 8 },
    colUnit: { width: 50, textAlign: "center", paddingRight: 4 },
    colQty: { width: 75, textAlign: "right", paddingRight: 8 },
    colPrice: { width: 85, textAlign: "right", paddingRight: 8 },
    colTotal: { width: 85, textAlign: "right", paddingRight: 8 },
    headerText: { fontSize: 8, fontWeight: "bold", color: "#6b7280" },
    productName: { fontSize: 9, fontWeight: "bold", paddingRight: 10 },
    productNameEn: { fontSize: 8, color: "#9ca3af", paddingRight: 10 },
    totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
    totalsBox: { width: 220 }, // Increased width
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalLabel: { color: "#6b7280", fontSize: 9, paddingRight: 8 },
    totalValue: { fontSize: 9, paddingRight: 10 },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      borderTopWidth: 1.5,
      borderTopColor: accentColor,
      marginTop: 4,
    },
    grandTotalLabel: { fontWeight: "bold", fontSize: 11, color: accentColor, paddingRight: 8 },
    grandTotalValue: { fontWeight: "bold", fontSize: 11, color: accentColor, paddingRight: 10 },
    notesSection: { marginBottom: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb", minHeight: 40 },
    notesLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3, fontWeight: "bold", paddingRight: 10 },
    notesText: { fontSize: 9, color: "#4b5563", lineHeight: 1.6, paddingRight: 20 },
    signatureSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
    signatureBox: { width: "45%", alignItems: "center" },
    signatureLine: { width: "100%", borderBottomWidth: 1, borderBottomColor: "#d1d5db", marginBottom: 4 },
    signatureLabel: { fontSize: 8, color: "#6b7280", paddingRight: 10 },
    signatureDate: { fontSize: 8, color: "#9ca3af", marginTop: 4, paddingRight: 10 },
  });
}

/**
 * Utility functions for formatting used in all PDFs.
 * Added robust fallbacks for environments with limited Intl support.
 * Forces Arabic numerals (latn) to ensure compatibility with all PDF readers.
 */
export function formatNumber(n: number): string {
  try {
    // FORCE latn numbering system to avoid Thai digits causing rendering issues
    return new Intl.NumberFormat("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(n);
  } catch (err) {
    // Fallback for missing locale data
    return (n || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
}

export function formatDate(d: Date | string): string {
  if (!d) return "-";
  const date = new Date(d);
  try {
    // Return Thai localized date but with Arabic numerals
    // Note: 'th-TH' with 'latn' numbering system
    return new Intl.DateTimeFormat("th-TH-u-nu-latn", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit" 
    }).format(date);
  } catch (err) {
    // Fallback: DD/MM/YYYY (Buddhist Year)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543; // Thai Buddhist year
    return `${day}/${month}/${year}`;
  }
}

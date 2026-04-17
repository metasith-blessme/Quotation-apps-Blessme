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
    documentTitle: { fontSize: 16, fontWeight: "bold", textAlign: "center", color: "#111827", marginBottom: 12 },
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
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      borderTopWidth: 1.5,
      borderTopColor: accentColor,
      marginTop: 4,
    },
    grandTotalLabel: { fontWeight: "bold", fontSize: 11, color: accentColor },
    grandTotalValue: { fontWeight: "bold", fontSize: 11, color: accentColor },
    notesSection: { marginBottom: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb", minHeight: 40 },
    notesLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3, fontWeight: "bold" },
    notesText: { fontSize: 9, color: "#4b5563", lineHeight: 1.6 },
    signatureSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
    signatureBox: { width: "45%", alignItems: "center" },
    signatureLine: { width: "100%", borderBottomWidth: 1, borderBottomColor: "#d1d5db", marginBottom: 4 },
    signatureLabel: { fontSize: 8, color: "#6b7280" },
    signatureDate: { fontSize: 8, color: "#9ca3af", marginTop: 4 },
  });
}

/**
 * Utility functions for formatting used in all PDFs.
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
}

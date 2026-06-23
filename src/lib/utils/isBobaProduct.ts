export function isBobaProduct(p: { nameEn?: string | null; nameTh?: string | null }): boolean {
  const en = p.nameEn?.toLowerCase() ?? "";
  const th = p.nameTh?.toLowerCase() ?? "";
  return (
    en.includes("popping boba") ||
    en.includes("popping") ||
    en.includes("boba") ||
    th.includes("popping boba") ||
    th.includes("เม็ดป็อป") ||
    th.includes("บ๊อบบ้า")
  );
}

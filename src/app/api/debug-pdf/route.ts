import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCachedCompany } from "@/lib/company-cache";
import { formatNumber, formatDate } from "@/components/pdf/shared/pdfStyles";

export async function GET() {
  const receipt = await prisma.receipt.findFirst({
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!receipt) return NextResponse.json({ error: "No receipts" });

  const company = await getCachedCompany();

  return NextResponse.json({
    receipt: {
      rcNumber: receipt.rcNumber,
      subtotal: receipt.subtotal,
      subtotalType: typeof receipt.subtotal,
      vatRate: receipt.vatRate,
      vatAmount: receipt.vatAmount,
      grandTotal: receipt.grandTotal,
      grandTotalType: typeof receipt.grandTotal,
      issueDate: receipt.issueDate,
      customerName: receipt.customerName,
    },
    formatted: {
      subtotal: formatNumber(receipt.subtotal),
      vatAmount: formatNumber(receipt.vatAmount),
      grandTotal: formatNumber(receipt.grandTotal),
      date: formatDate(receipt.issueDate),
      combined: `฿${formatNumber(receipt.grandTotal)}`,
    },
    items: receipt.items.map(item => ({
      name: item.productNameTh,
      quantity: item.quantity,
      quantityType: typeof item.quantity,
      unitPrice: item.unitPrice,
      unitPriceType: typeof item.unitPrice,
      lineTotal: item.lineTotal,
      lineTotalType: typeof item.lineTotal,
      formattedPrice: formatNumber(item.unitPrice),
      formattedTotal: formatNumber(item.lineTotal),
    })),
    company: company ? {
      nameTh: company.nameTh,
      address: company.address,
      taxId: company.taxId,
      phone: company.phone,
      email: company.email,
    } : null,
    env: {
      nodeVersion: process.version,
      vercelUrl: process.env.VERCEL_URL || "not set",
      cwd: process.cwd(),
    },
  });
}

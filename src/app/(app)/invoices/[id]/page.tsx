import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import Link from "next/link";
import { notFound } from "next/navigation";
import InvoiceActions from "./InvoiceActions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { name: true } },
    },
  });

  if (!invoice) return notFound();

  // Access control
  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = invoice.createdById === session?.user?.id;
  if (!isAdmin && !isOwner) return notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/invoices"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            ใบแจ้งหนี้ {invoice.invNumber}
          </h2>
          <p className="text-sm text-gray-500">
            สร้างโดย {invoice.createdBy.name} เมื่อ {formatDate(invoice.createdAt)}
          </p>
        </div>
        <div className="ml-auto">
          <InvoiceActions id={invoice.id} status={invoice.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">ลูกค้า</p>
          <p className="font-bold text-gray-900">{invoice.customerName}</p>
          {invoice.customerContact && <p className="text-sm text-gray-600">{invoice.customerContact}</p>}
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">วันที่ออก / ครบกำหนด</p>
          <p className="font-bold text-gray-900">{formatDate(invoice.issueDate)}</p>
          <p className="text-sm text-red-600 font-medium">ครบกำหนด: {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">ยอดรวมสุทธิ</p>
          <p className="text-2xl font-bold text-green-700">฿{formatCurrency(invoice.grandTotal)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">รายการ</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">จำนวน</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">ราคา/หน่วย</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">รวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item, i) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{item.productNameTh}</p>
                  {item.productNameEn && <p className="text-xs text-gray-500">{item.productNameEn}</p>}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 text-right text-gray-700">฿{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">฿{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50/50 border-t border-gray-200">
            <tr>
              <td colSpan={3} />
              <td className="px-4 py-2 text-right text-gray-500">รวมเป็นเงิน</td>
              <td className="px-4 py-2 text-right text-gray-900">฿{formatCurrency(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} />
              <td className="px-4 py-2 text-right text-gray-500">ภาษีมูลค่าเพิ่ม {invoice.vatRate}%</td>
              <td className="px-4 py-2 text-right text-gray-900">฿{formatCurrency(invoice.vatAmount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td colSpan={3} />
              <td className="px-4 py-3 text-right font-bold text-gray-900">จำนวนเงินรวมทั้งสิ้น</td>
              <td className="px-4 py-3 text-right font-bold text-green-700 text-lg">฿{formatCurrency(invoice.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {(invoice.notes || invoice.termsSnapshot) && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          {invoice.notes && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">หมายเหตุ</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          {invoice.termsSnapshot && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">เงื่อนไข</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.termsSnapshot}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

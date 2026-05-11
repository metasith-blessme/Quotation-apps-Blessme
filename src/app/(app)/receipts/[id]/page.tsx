import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReceiptActions from "./ReceiptActions";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { name: true } },
    },
  });

  if (!receipt) return notFound();

  // Access control
  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = receipt.createdById === session?.user?.id;
  if (!isAdmin && !isOwner) return notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/receipts"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            ใบเสร็จรับเงิน {receipt.rcNumber}
          </h2>
          <p className="text-sm text-gray-500">
            สร้างโดย {receipt.createdBy.name} เมื่อ {formatDate(receipt.createdAt)}
          </p>
        </div>
        <div className="ml-auto">
          <ReceiptActions id={receipt.id} status={receipt.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">ลูกค้า</p>
          <p className="font-bold text-gray-900">{receipt.customerName}</p>
          {receipt.customerContact && <p className="text-sm text-gray-600">{receipt.customerContact}</p>}
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">วันที่ออก</p>
          <p className="font-bold text-gray-900">{formatDate(receipt.issueDate)}</p>
          <p className="text-xs text-gray-400 mt-1 italic">
            อ้างอิง: {receipt.invoiceNumber || receipt.billingNumber || "-"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">ยอดรวมสุทธิ</p>
          <p className="text-2xl font-bold text-indigo-700">฿{formatCurrency(receipt.grandTotal)}</p>
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
            {receipt.items.map((item, i) => (
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
              <td className="px-4 py-2 text-right text-gray-900">฿{formatCurrency(receipt.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} />
              <td className="px-4 py-2 text-right text-gray-500">ภาษีมูลค่าเพิ่ม {receipt.vatRate}%</td>
              <td className="px-4 py-2 text-right text-gray-900">฿{formatCurrency(receipt.vatAmount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td colSpan={3} />
              <td className="px-4 py-3 text-right font-bold text-gray-900">จำนวนเงินรวมทั้งสิ้น</td>
              <td className="px-4 py-3 text-right font-bold text-indigo-700 text-lg">฿{formatCurrency(receipt.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {(receipt.notes || receipt.termsSnapshot) && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          {receipt.notes && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">หมายเหตุ</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{receipt.notes}</p>
            </div>
          )}
          {receipt.termsSnapshot && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">เงื่อนไข</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{receipt.termsSnapshot}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

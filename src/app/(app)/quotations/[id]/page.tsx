import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { QuotationActions } from "@/components/quotation/QuotationActions";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "ร่าง",
  SENT: "ส่งแล้ว",
  ACCEPTED: "อนุมัติ",
  REJECTED: "ปฏิเสธ",
  EXPIRED: "หมดอายุ",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};

type Params = { params: Promise<{ id: string }> };

export default async function QuotationViewPage({ params }: Params) {
  const session = await auth();
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { name: true } },
    },
  });

  if (!quotation) notFound();

  const isAdmin = session?.user?.role === "ADMIN";
  if (!isAdmin && quotation.createdById !== session?.user?.id) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold text-gray-900 font-mono">
              {quotation.qtNumber}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[quotation.status]}`}>
              {STATUS_LABELS[quotation.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500">สร้างโดย {quotation.createdBy.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <QuotationActions
            id={id}
            status={quotation.status}
            qtNumber={quotation.qtNumber}
            canDelete={isAdmin || quotation.createdById === session?.user?.id}
          />
          <Link
            href={`/quotations/${id}/edit`}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            แก้ไข
          </Link>
          <a
            href={`/api/quotations/${id}/pdf`}
            target="_blank"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            ดาวน์โหลด PDF
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* QT Info */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">วันที่ออก</p>
            <p className="text-sm font-medium">{formatDate(quotation.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">ใช้ได้ถึง</p>
            <p className="text-sm font-medium">{formatDate(quotation.validUntil)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">สกุลเงิน</p>
            <p className="text-sm font-medium">{quotation.currency}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="pb-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">ข้อมูลลูกค้า</p>
          <p className="font-semibold text-gray-900">{quotation.customerName}</p>
          {quotation.customerAddress && <p className="text-sm text-gray-600 mt-0.5">{quotation.customerAddress}</p>}
          <div className="flex gap-6 mt-2 text-sm text-gray-600">
            {quotation.customerTaxId && <span>เลขภาษี: {quotation.customerTaxId}</span>}
            {quotation.customerPhone && <span>โทร: {quotation.customerPhone}</span>}
            {quotation.customerContact && <span>ผู้ติดต่อ: {quotation.customerContact}</span>}
          </div>
        </div>

        {/* Items */}
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium w-8">#</th>
                <th className="pb-2 font-medium">รายการสินค้า</th>
                <th className="pb-2 font-medium w-16">หน่วย</th>
                <th className="pb-2 font-medium w-20 text-right">จำนวน</th>
                <th className="pb-2 font-medium w-28 text-right">ราคา/หน่วย</th>
                <th className="pb-2 font-medium w-28 text-right">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotation.items.map((item, i) => (
                <tr key={item.id}>
                  <td className="py-2.5 text-gray-400">{i + 1}</td>
                  <td className="py-2.5">
                    <p className="font-medium text-gray-800">{item.productNameTh}</p>
                    {item.productNameEn && <p className="text-xs text-gray-400">{item.productNameEn}</p>}
                  </td>
                  <td className="py-2.5 text-gray-600">{item.unit}</td>
                  <td className="py-2.5 text-right text-gray-700">{item.quantity.toLocaleString("th-TH")}</td>
                  <td className="py-2.5 text-right text-gray-700">฿{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-medium">฿{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>ราคาก่อนภาษี</span>
                <span>฿{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ภาษีมูลค่าเพิ่ม {quotation.vatRate}%</span>
                <span>฿{formatCurrency(quotation.vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                <span>รวมทั้งสิ้น</span>
                <span>฿{formatCurrency(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes / Terms */}
        {(quotation.notes || quotation.termsSnapshot) && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            {quotation.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{quotation.notes}</p>
              </div>
            )}
            {quotation.termsSnapshot && (
              <div>
                <p className="text-xs text-gray-500 mb-1">เงื่อนไขการขาย</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{quotation.termsSnapshot}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}

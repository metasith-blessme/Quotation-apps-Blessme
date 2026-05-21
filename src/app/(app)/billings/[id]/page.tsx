import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import Link from "next/link";
import { notFound } from "next/navigation";
import BillingActions from "./BillingActions";

export default async function BillingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const [billing, receipt] = await Promise.all([
    prisma.billing.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.receipt.findFirst({
      where: { billingId: id },
      select: { id: true, rcNumber: true },
    }),
  ]);

  if (!billing) return notFound();

  let quotationInfo = null;
  if (billing.invoiceId) {
    const inv = await prisma.invoice.findUnique({
      where: { id: billing.invoiceId },
      select: { quotationId: true, quotationNumber: true },
    });
    if (inv) {
      quotationInfo = inv;
    }
  }

  // Access control
  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = billing.createdById === session?.user?.id;
  if (!isAdmin && !isOwner) return notFound();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Document Connections Chain */}
      {(billing.invoiceId || receipt) && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm text-sm text-blue-850">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-lg">🔗</span>
            <span className="font-semibold text-blue-900">ประวัติเอกสาร:</span>
            {quotationInfo?.quotationId && (
              <>
                <Link
                  href={`/quotations/${quotationInfo.quotationId}`}
                  className="bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-2.5 py-1 rounded font-mono text-xs transition-colors shadow-sm"
                >
                  {quotationInfo.quotationNumber ?? "QT-Source"}
                </Link>
                <span className="text-blue-300 font-bold">➔</span>
              </>
            )}
            {billing.invoiceId && (
              <>
                <Link
                  href={`/invoices/${billing.invoiceId}`}
                  className="bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-2.5 py-1 rounded font-mono text-xs transition-colors shadow-sm"
                >
                  {billing.invoiceNumber ?? "INV-Source"}
                </Link>
                <span className="text-blue-300 font-bold">➔</span>
              </>
            )}
            <span className="bg-blue-600 text-white px-2.5 py-1 rounded font-mono text-xs font-bold shadow-sm">
              {billing.bnNumber}
            </span>
            {receipt && (
              <>
                <span className="text-blue-300 font-bold">➔</span>
                <Link
                  href={`/receipts/${receipt.id}`}
                  className="bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-2.5 py-1 rounded font-mono text-xs transition-colors shadow-sm"
                >
                  {receipt.rcNumber}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/billings"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            ใบวางบิล {billing.bnNumber}
          </h2>
          <p className="text-sm text-gray-500">
            สร้างโดย {billing.createdBy.name} เมื่อ {formatDate(billing.createdAt)}
          </p>
        </div>
        <div className="ml-auto">
          <BillingActions id={billing.id} status={billing.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">ลูกค้า</p>
          <p className="font-bold text-gray-900">{billing.customerName}</p>
          {billing.customerContact && <p className="text-sm text-gray-600">{billing.customerContact}</p>}
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">วันที่ออก / ครบกำหนด</p>
          <p className="font-bold text-gray-900">{formatDate(billing.issueDate)}</p>
          <p className="text-sm text-blue-600 font-medium tracking-tight">ครบกำหนด: {billing.dueDate ? formatDate(billing.dueDate) : "-"}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">ยอดเงินที่เรียกเก็บ</p>
          <p className="text-2xl font-bold text-blue-700">฿{formatCurrency(billing.grandTotal)}</p>
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
            {billing.items.map((item, i) => (
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
              <td className="px-4 py-2 text-right text-gray-500">ราคาก่อนภาษี</td>
              <td className="px-4 py-2 text-right text-gray-900">฿{formatCurrency(billing.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} />
              <td className="px-4 py-2 text-right text-gray-500">ภาษีมูลค่าเพิ่ม {billing.vatRate}%</td>
              <td className="px-4 py-2 text-right text-gray-900">฿{formatCurrency(billing.vatAmount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td colSpan={3} />
              <td className="px-4 py-3 text-right font-bold text-gray-900">จำนวนเงินรวมทั้งสิ้น</td>
              <td className="px-4 py-3 text-right font-bold text-blue-700 text-lg">฿{formatCurrency(billing.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {(billing.notes || billing.termsSnapshot) && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          {billing.notes && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">หมายเหตุ / Notes</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{billing.notes}</p>
            </div>
          )}
          {billing.termsSnapshot && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">เงื่อนไข / Terms</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{billing.termsSnapshot}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

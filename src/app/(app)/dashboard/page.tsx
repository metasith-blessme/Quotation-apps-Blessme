import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";

const QT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};
const QT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "ร่าง", SENT: "ส่งแล้ว", ACCEPTED: "อนุมัติ", REJECTED: "ปฏิเสธ", EXPIRED: "หมดอายุ",
};
const INV_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};
const INV_STATUS_LABELS: Record<string, string> = {
  UNPAID: "ค้างชำระ", PAID: "ชำระแล้ว", OVERDUE: "เกินกำหนด", CANCELLED: "ยกเลิก",
};
const BN_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  COLLECTED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};
const BN_STATUS_LABELS: Record<string, string> = {
  PENDING: "รอเก็บเงิน", COLLECTED: "เก็บแล้ว", CANCELLED: "ยกเลิก",
};
const RC_STATUS_COLORS: Record<string, string> = {
  WAITING: "bg-orange-100 text-orange-700",
  ISSUED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};
const RC_STATUS_LABELS: Record<string, string> = {
  WAITING: "รอออก", ISSUED: "ออกแล้ว", CANCELLED: "ยกเลิก",
};

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const whereOwn = isAdmin ? {} : { createdById: session!.user.id };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    qtCountsByStatus,
    invCountsByStatus,
    bnCountsByStatus,
    rcCountsByStatus,
    acceptedThisMonthAgg,
    recentQuotations,
    recentInvoices,
    recentBillings,
    recentReceipts,
  ] = await Promise.all([
    prisma.quotation.groupBy({
      by: ["status"],
      where: whereOwn,
      _count: true,
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: whereOwn,
      _count: true,
    }),
    prisma.billing.groupBy({
      by: ["status"],
      where: whereOwn,
      _count: true,
    }),
    prisma.receipt.groupBy({
      by: ["status"],
      where: whereOwn,
      _count: true,
    }),
    prisma.quotation.aggregate({
      where: {
        ...whereOwn,
        status: "ACCEPTED",
        issueDate: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { grandTotal: true },
    }),
    prisma.quotation.findMany({
      where: whereOwn,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, qtNumber: true, customerName: true, grandTotal: true, status: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: whereOwn,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, invNumber: true, customerName: true, grandTotal: true, status: true, createdAt: true },
    }),
    prisma.billing.findMany({
      where: whereOwn,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, bnNumber: true, customerName: true, grandTotal: true, status: true, createdAt: true },
    }),
    prisma.receipt.findMany({
      where: whereOwn,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, rcNumber: true, customerName: true, grandTotal: true, status: true, createdAt: true },
    }),
  ]);

  const qtStats = {
    total: qtCountsByStatus.reduce((sum, item) => sum + item._count, 0),
    sent: qtCountsByStatus.find((item) => item.status === "SENT")?._count ?? 0,
  };
  const invStats = {
    total: invCountsByStatus.reduce((sum, item) => sum + item._count, 0),
    unpaid: invCountsByStatus.find((item) => item.status === "UNPAID")?._count ?? 0,
  };
  const bnStats = {
    total: bnCountsByStatus.reduce((sum, item) => sum + item._count, 0),
    pending: bnCountsByStatus.find((item) => item.status === "PENDING")?._count ?? 0,
  };
  const rcStats = {
    total: rcCountsByStatus.reduce((sum, item) => sum + item._count, 0),
    issued: rcCountsByStatus.find((item) => item.status === "ISSUED")?._count ?? 0,
  };
  const acceptedTotal = acceptedThisMonthAgg._sum.grandTotal ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">หน้าหลัก / Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">ใบเสนอราคา / Quotations</p>
          <p className="text-2xl font-bold text-gray-700">{qtStats.total}</p>
          <p className="text-sm text-blue-500 mt-1">{qtStats.sent} ส่งแล้ว</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">ใบแจ้งหนี้ / Invoices</p>
          <p className="text-2xl font-bold text-gray-700">{invStats.total}</p>
          <p className="text-sm text-yellow-600 mt-1">{invStats.unpaid} ค้างชำระ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">ใบวางบิล / Billing Notes</p>
          <p className="text-2xl font-bold text-gray-700">{bnStats.total}</p>
          <p className="text-sm text-orange-500 mt-1">{bnStats.pending} รอเก็บเงิน</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">ใบเสร็จ / Receipts</p>
          <p className="text-2xl font-bold text-gray-700">{rcStats.total}</p>
          <p className="text-sm text-indigo-600 mt-1">{rcStats.issued} ออกใบเสร็จแล้ว</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">ยอดอนุมัติเดือนนี้</p>
          <p className="text-xl font-bold text-green-700">฿{formatCurrency(acceptedTotal)}</p>
          <p className="text-sm text-gray-400 mt-1">ใบเสนอราคา ACCEPTED</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-4 gap-6">
        {/* Recent Quotations */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">ใบเสนอราคาล่าสุด</h3>
            <Link href="/quotations" className="text-xs text-green-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {recentQuotations.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-2">
              {recentQuotations.map((q) => (
                <li key={q.id}>
                  <Link href={`/quotations/${q.id}`} className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-gray-500">{q.qtNumber}</p>
                      <p className="text-sm text-gray-800 truncate">{q.customerName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QT_STATUS_COLORS[q.status]}`}>
                        {QT_STATUS_LABELS[q.status]}
                      </span>
                      <span className="text-xs text-gray-500">฿{formatCurrency(q.grandTotal)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">ใบแจ้งหนี้ล่าสุด</h3>
            <Link href="/invoices" className="text-xs text-green-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-2">
              {recentInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link href={`/invoices/${inv.id}`} className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-gray-500">{inv.invNumber}</p>
                      <p className="text-sm text-gray-800 truncate">{inv.customerName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INV_STATUS_COLORS[inv.status]}`}>
                        {INV_STATUS_LABELS[inv.status]}
                      </span>
                      <span className="text-xs text-gray-500">฿{formatCurrency(inv.grandTotal)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Billings */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">ใบวางบิลล่าสุด</h3>
            <Link href="/billings" className="text-xs text-green-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {recentBillings.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-2">
              {recentBillings.map((bn) => (
                <li key={bn.id}>
                  <Link href={`/billings/${bn.id}`} className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-gray-500">{bn.bnNumber}</p>
                      <p className="text-sm text-gray-800 truncate">{bn.customerName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BN_STATUS_COLORS[bn.status]}`}>
                        {BN_STATUS_LABELS[bn.status]}
                      </span>
                      <span className="text-xs text-gray-500">฿{formatCurrency(bn.grandTotal)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Receipts */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">ใบเสร็จล่าสุด</h3>
            <Link href="/receipts" className="text-xs text-green-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {recentReceipts.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-2">
              {recentReceipts.map((rc) => (
                <li key={rc.id}>
                  <Link href={`/receipts/${rc.id}`} className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-gray-500">{rc.rcNumber}</p>
                      <p className="text-sm text-gray-800 truncate">{rc.customerName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RC_STATUS_COLORS[rc.status]}`}>
                        {RC_STATUS_LABELS[rc.status]}
                      </span>
                      <span className="text-xs text-gray-500">฿{formatCurrency(rc.grandTotal)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">ทางลัด / Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/quotations/new"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + สร้างใบเสนอราคา
          </Link>
          <Link
            href="/clients"
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            จัดการลูกค้า
          </Link>
          <Link
            href="/invoices"
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            ใบแจ้งหนี้
          </Link>
          <Link
            href="/billings"
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            ใบวางบิล
          </Link>
          <Link
            href="/receipts"
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            ใบเสร็จรับเงิน
          </Link>
        </div>
      </div>
    </div>
  );
}

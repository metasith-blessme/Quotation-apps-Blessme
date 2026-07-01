import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import RecentActivitiesClient from "./RecentActivitiesClient";

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
    lowStockProducts,
    channelAgg,
    channelProducts,
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
    prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { lte: prisma.product.fields.lowStockThreshold },
      },
      orderBy: { stockQuantity: "asc" },
      take: 10,
    }),
    prisma.product.aggregate({
      where: { isActive: true },
      _sum: { stockTiktok: true, stockShopee: true, stockLineOa: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { nameTh: "asc" },
      select: { id: true, nameTh: true, unit: true, stockTiktok: true, stockShopee: true, stockLineOa: true },
    }),
  ]);

  const tiktokTotal = channelAgg._sum.stockTiktok ?? 0;
  const shopeeTotal = channelAgg._sum.stockShopee ?? 0;
  const lineOaTotal = channelAgg._sum.stockLineOa ?? 0;
  const channelGrandTotal = tiktokTotal + shopeeTotal + lineOaTotal;
  const pct = (n: number) => (channelGrandTotal > 0 ? (n / channelGrandTotal) * 100 : 0);

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

      {/* Critical Alerts - Low Stock */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚠️</span>
            <h3 className="text-sm font-bold text-red-800 uppercase tracking-tight">
              แจ้งเตือนสต็อกสินค้าต่ำกว่าจุดสั่งซื้อ (Red Line Stock)
            </h3>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="bg-white border border-red-100 rounded-lg p-3 shadow-sm">
                <p className="text-xs font-bold text-gray-800 truncate">{p.nameTh}</p>
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-[10px] text-gray-500">คงเหลือ</p>
                    <p className="text-sm font-black text-red-600">
                      {formatCurrency(p.stockQuantity)} {p.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">จุดเตือน</p>
                    <p className="text-xs text-gray-500 font-medium">{formatCurrency(p.lowStockThreshold)}</p>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/products" className="flex items-center justify-center bg-white/50 border border-dashed border-red-200 rounded-lg p-3 hover:bg-white transition-colors text-xs font-medium text-red-600">
              จัดการสต็อกทั้งหมด →
            </Link>
          </div>
        </div>
      )}

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

      {/* Channel stock monitoring */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">สต็อกแยกตามช่องทาง / Stock by Channel</h3>
          <Link href="/products" className="text-xs font-medium text-green-600 hover:underline">จัดการสต็อก →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://cdn.simpleicons.org/tiktok/010101" alt="TikTok" width={18} height={18} />
              TikTok
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(tiktokTotal)}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://cdn.simpleicons.org/shopee/EE4D2D" alt="Shopee" width={18} height={18} />
              Shopee
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(shopeeTotal)}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://cdn.simpleicons.org/line/06C755" alt="LINE OA" width={18} height={18} />
              LINE OA
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(lineOaTotal)}</p>
          </div>
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-4">
            <p className="text-xs text-emerald-700">รวมทุกช่องทาง / Total</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(channelGrandTotal)}</p>
          </div>
        </div>

        {/* Channel share bar */}
        {channelGrandTotal > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">สัดส่วนช่องทาง / Channel share</p>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
              <span style={{ width: `${pct(tiktokTotal)}%`, backgroundColor: "#010101" }} />
              <span style={{ width: `${pct(shopeeTotal)}%`, backgroundColor: "#EE4D2D" }} />
              <span style={{ width: `${pct(lineOaTotal)}%`, backgroundColor: "#06C755" }} />
            </div>
          </div>
        )}

        {/* Per-product breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-bold text-gray-700 text-xs">สินค้า</th>
                <th className="text-right px-3 py-2 font-bold text-gray-700 text-xs w-24">TikTok</th>
                <th className="text-right px-3 py-2 font-bold text-gray-700 text-xs w-24">Shopee</th>
                <th className="text-right px-3 py-2 font-bold text-gray-700 text-xs w-24">LINE OA</th>
                <th className="text-right px-3 py-2 font-bold text-emerald-700 text-xs w-24">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {channelProducts.map((p) => {
                const total = (p.stockTiktok ?? 0) + (p.stockShopee ?? 0) + (p.stockLineOa ?? 0);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-800 font-medium">{p.nameTh}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(p.stockTiktok ?? 0)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(p.stockShopee ?? 0)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(p.stockLineOa ?? 0)}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-700">{formatCurrency(total)} {p.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity */}
      <RecentActivitiesClient
        recentQuotations={recentQuotations}
        recentInvoices={recentInvoices}
        recentBillings={recentBillings}
        recentReceipts={recentReceipts}
      />

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

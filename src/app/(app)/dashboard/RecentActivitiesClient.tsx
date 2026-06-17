"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";

const QT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};

const INV_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const BN_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  COLLECTED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const RC_STATUS_COLORS: Record<string, string> = {
  WAITING: "bg-orange-100 text-orange-700",
  ISSUED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface Props {
  recentQuotations: any[];
  recentInvoices: any[];
  recentBillings: any[];
  recentReceipts: any[];
}

export default function RecentActivitiesClient({
  recentQuotations,
  recentInvoices,
  recentBillings,
  recentReceipts,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [quotations, setQuotations] = useState(recentQuotations);
  const [invoices, setInvoices] = useState(recentInvoices);
  const [billings, setBillings] = useState(recentBillings);
  const [receipts, setReceipts] = useState(recentReceipts);

  useEffect(() => {
    setQuotations(recentQuotations);
  }, [recentQuotations]);

  useEffect(() => {
    setInvoices(recentInvoices);
  }, [recentInvoices]);

  useEffect(() => {
    setBillings(recentBillings);
  }, [recentBillings]);

  useEffect(() => {
    setReceipts(recentReceipts);
  }, [recentReceipts]);

  const handleStatusChange = async (
    id: string,
    newStatus: string,
    type: "quotation" | "invoice" | "billing" | "receipt"
  ) => {
    setUpdatingId(id);

    let oldStatus = "";
    if (type === "quotation") {
      oldStatus = quotations.find((q) => q.id === id)?.status || "";
      setQuotations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } else if (type === "invoice") {
      oldStatus = invoices.find((i) => i.id === id)?.status || "";
      setInvoices((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } else if (type === "billing") {
      oldStatus = billings.find((b) => b.id === id)?.status || "";
      setBillings((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } else if (type === "receipt") {
      oldStatus = receipts.find((r) => r.id === id)?.status || "";
      setReceipts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    }

    try {
      let url = "";
      let method = "PUT";
      if (type === "quotation") url = `/api/quotations/${id}`;
      else if (type === "invoice") url = `/api/invoices/${id}`;
      else if (type === "billing") url = `/api/billings/${id}`;
      else if (type === "receipt") {
        url = `/api/receipts/${id}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "อัปเดตสถานะไม่สำเร็จ");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      alert(err.message);
      // Rollback
      if (type === "quotation") {
        setQuotations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: oldStatus } : item))
        );
      } else if (type === "invoice") {
        setInvoices((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: oldStatus } : item))
        );
      } else if (type === "billing") {
        setBillings((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: oldStatus } : item))
        );
      } else if (type === "receipt") {
        setReceipts((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: oldStatus } : item))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Recent Quotations */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">ใบเสนอราคาล่าสุด</h3>
          <Link href="/quotations" className="text-xs text-green-600 hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        {quotations.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
        ) : (
          <ul className="space-y-2">
            {quotations.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/quotations/${q.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-500">{q.qtNumber}</p>
                    <p className="text-sm text-gray-800 truncate">{q.customerName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    {/* ponytail: prevent default navigation when selecting status */}
                    <div
                      className="relative inline-block"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <select
                        disabled={updatingId === q.id || isPending}
                        value={q.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(q.id, e.target.value, "quotation");
                        }}
                        className={`text-[10px] pl-2 pr-5 py-0.5 rounded-full font-medium border-0 cursor-pointer appearance-none text-left focus:outline-none focus:ring-1 focus:ring-green-500 ${
                          QT_STATUS_COLORS[q.status]
                        }`}
                        style={{ textAlignLast: "left" }}
                      >
                        <option value="DRAFT">ร่าง</option>
                        <option value="SENT">ส่งแล้ว</option>
                        <option value="ACCEPTED">อนุมัติ</option>
                        <option value="REJECTED">ปฏิเสธ</option>
                        <option value="EXPIRED">หมดอายุ</option>
                      </select>
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[7px] opacity-60">▼</span>
                    </div>
                    <span className="text-xs text-gray-500">฿{formatCurrency(q.grandTotal)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">ใบแจ้งหนี้ล่าสุด</h3>
          <Link href="/invoices" className="text-xs text-green-600 hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        {invoices.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
        ) : (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-500">{inv.invNumber}</p>
                    <p className="text-sm text-gray-800 truncate">{inv.customerName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    {/* ponytail: prevent default navigation when selecting status */}
                    <div
                      className="relative inline-block"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <select
                        disabled={updatingId === inv.id || isPending}
                        value={inv.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(inv.id, e.target.value, "invoice");
                        }}
                        className={`text-[10px] pl-2 pr-5 py-0.5 rounded-full font-medium border-0 cursor-pointer appearance-none text-left focus:outline-none focus:ring-1 focus:ring-green-500 ${
                          INV_STATUS_COLORS[inv.status]
                        }`}
                        style={{ textAlignLast: "left" }}
                      >
                        <option value="UNPAID">ค้างชำระ</option>
                        <option value="PAID">ชำระแล้ว</option>
                        <option value="OVERDUE">เกินกำหนด</option>
                        <option value="CANCELLED">ยกเลิก</option>
                      </select>
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[7px] opacity-60">▼</span>
                    </div>
                    <span className="text-xs text-gray-500">฿{formatCurrency(inv.grandTotal)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Billings */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">ใบวางบิลล่าสุด</h3>
          <Link href="/billings" className="text-xs text-green-600 hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        {billings.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
        ) : (
          <ul className="space-y-2">
            {billings.map((bn) => (
              <li key={bn.id}>
                <Link
                  href={`/billings/${bn.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-500">{bn.bnNumber}</p>
                    <p className="text-sm text-gray-800 truncate">{bn.customerName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    {/* ponytail: prevent default navigation when selecting status */}
                    <div
                      className="relative inline-block"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <select
                        disabled={updatingId === bn.id || isPending}
                        value={bn.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(bn.id, e.target.value, "billing");
                        }}
                        className={`text-[10px] pl-2 pr-5 py-0.5 rounded-full font-medium border-0 cursor-pointer appearance-none text-left focus:outline-none focus:ring-1 focus:ring-green-500 ${
                          BN_STATUS_COLORS[bn.status]
                        }`}
                        style={{ textAlignLast: "left" }}
                      >
                        <option value="PENDING">รอเก็บเงิน</option>
                        <option value="COLLECTED">เก็บแล้ว</option>
                        <option value="CANCELLED">ยกเลิก</option>
                      </select>
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[7px] opacity-60">▼</span>
                    </div>
                    <span className="text-xs text-gray-500">฿{formatCurrency(bn.grandTotal)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Receipts */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">ใบเสร็จล่าสุด</h3>
          <Link href="/receipts" className="text-xs text-green-600 hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        {receipts.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">ยังไม่มีข้อมูล</p>
        ) : (
          <ul className="space-y-2">
            {receipts.map((rc) => (
              <li key={rc.id}>
                <Link
                  href={`/receipts/${rc.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-500">{rc.rcNumber}</p>
                    <p className="text-sm text-gray-800 truncate">{rc.customerName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    {/* ponytail: prevent default navigation when selecting status */}
                    <div
                      className="relative inline-block"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <select
                        disabled={updatingId === rc.id || isPending}
                        value={rc.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(rc.id, e.target.value, "receipt");
                        }}
                        className={`text-[10px] pl-2 pr-5 py-0.5 rounded-full font-medium border-0 cursor-pointer appearance-none text-left focus:outline-none focus:ring-1 focus:ring-green-500 ${
                          RC_STATUS_COLORS[rc.status]
                        }`}
                        style={{ textAlignLast: "left" }}
                      >
                        <option value="WAITING">รอออก</option>
                        <option value="ISSUED">ออกแล้ว</option>
                        <option value="CANCELLED">ยกเลิก</option>
                      </select>
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[7px] opacity-60">▼</span>
                    </div>
                    <span className="text-xs text-gray-500">฿{formatCurrency(rc.grandTotal)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

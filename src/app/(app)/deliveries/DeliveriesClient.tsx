"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils/format";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "ค้างชำระ",
  PAID: "ชำระแล้ว",
  OVERDUE: "เกินกำหนด",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-orange-100 text-orange-700 border border-orange-200",
  PAID: "bg-green-100 text-green-700 border border-green-200",
  OVERDUE: "bg-red-100 text-red-700 border border-red-200",
};

interface Invoice {
  id: string;
  invNumber: string;
  quotationId?: string | null;
  quotationNumber?: string | null;
  customerName: string;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  grandTotal: number;
  status: string;
  deliveryStatus: "PENDING" | "DELIVERED";
  createdById: string;
  createdBy: { name: string };
}

interface Props {
  invoices: Invoice[];
  counts: { total: number; pending: number; delivered: number };
  role?: string;
  currentUserId?: string;
}

export default function DeliveriesClient({ invoices, counts, role, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [list, setList] = useState(invoices);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"PENDING" | "DELIVERED">("PENDING");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = role === "ADMIN";

  useEffect(() => {
    setList(invoices);
  }, [invoices]);

  const localCounts = useMemo(() => {
    return {
      total: list.length,
      pending: list.filter((i) => i.deliveryStatus === "PENDING").length,
      delivered: list.filter((i) => i.deliveryStatus === "DELIVERED").length,
    };
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter((i) => {
      const matchesSearch =
        search === "" ||
        i.customerName.toLowerCase().includes(search.toLowerCase()) ||
        i.invNumber.toLowerCase().includes(search.toLowerCase()) ||
        (i.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesTab = i.deliveryStatus === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [list, search, activeTab]);

  const handleToggleDeliveryStatus = async (id: string, nextStatus: "PENDING" | "DELIVERED") => {
    setUpdatingId(id);
    const oldStatus = list.find((i) => i.id === id)?.deliveryStatus;
    if (!oldStatus) return;

    // Optimistic update
    setList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, deliveryStatus: nextStatus } : item))
    );

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryStatus: nextStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "เกิดข้อผิดพลาดในการอัปเดตสถานะจัดส่ง");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      // Rollback
      setList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, deliveryStatus: oldStatus } : item))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      {/* Stats Dashboard */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "รายการจัดส่งทั้งหมด / Total Deliveries", value: localCounts.total, color: "text-gray-700", bg: "bg-white" },
          { label: "ยังไม่ส่ง / Pending Shipment", value: localCounts.pending, color: "text-amber-600", bg: "bg-amber-50/50 border-amber-100" },
          { label: "ส่งแล้ว / Delivered", value: localCounts.delivered, color: "text-green-600", bg: "bg-green-50/50 border-green-100" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-gray-200 p-4 ${stat.bg} shadow-sm`}>
            <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-lg p-1 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            activeTab === "PENDING"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          ยังไม่ส่ง / Pending ({localCounts.pending})
        </button>
        <button
          onClick={() => setActiveTab("DELIVERED")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            activeTab === "DELIVERED"
              ? "bg-green-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          ส่งแล้ว / Delivered ({localCounts.delivered})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="ค้นหาชื่อลูกค้า, เลขที่ใบแจ้งหนี้ หรือเลขที่ใบเสนอราคา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🚚</p>
            <p className="font-medium">
              {list.length === 0 ? "ไม่มีรายการจัดส่งสินค้า" : "ไม่พบรายการจัดส่งที่ค้นหา"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่ใบแจ้งหนี้ / Invoice No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า / Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">อ้างอิง QT / Ref QT</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่ / Issue Date</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">การชำระเงิน / Payment</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ผู้สร้าง / Created By</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">การจัดส่ง / Delivery Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">การดำเนินการ / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((i) => {
                const canEdit = isAdmin || i.createdById === currentUserId;
                const isUpdating = updatingId === i.id;

                return (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      <Link href={`/invoices/${i.id}`} className="text-blue-600 hover:underline">
                        {i.invNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{i.customerName}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {i.quotationNumber && i.quotationId ? (
                        <Link href={`/quotations/${i.quotationId}`} className="text-blue-600 hover:underline">
                          {i.quotationNumber}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(i.issueDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[i.status]}`}>
                        {PAYMENT_STATUS_LABELS[i.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{i.createdBy.name}</td>
                    <td className="px-4 py-3 text-center">
                      {/* ponytail: interactive delivery status dropdown */}
                      {canEdit ? (
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <select
                            disabled={isUpdating || isPending}
                            value={i.deliveryStatus}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleDeliveryStatus(i.id, e.target.value as "PENDING" | "DELIVERED");
                            }}
                            className={`inline-block pl-2.5 pr-6 py-0.5 rounded-full text-xs font-semibold border-0 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none text-left ${
                              i.deliveryStatus === "DELIVERED"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                            style={{ textAlignLast: "left" }}
                          >
                            <option value="PENDING">ยังไม่ส่ง</option>
                            <option value="DELIVERED">ส่งแล้ว</option>
                          </select>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] opacity-60">▼</span>
                        </div>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            i.deliveryStatus === "DELIVERED"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {i.deliveryStatus === "DELIVERED" ? "ส่งแล้ว" : "ยังไม่ส่ง"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/invoices/${i.id}`} className="text-xs text-blue-600 hover:underline">ดู</Link>
                        <a href={`/api/invoices/${i.id}/pdf`} target="_blank" className="text-xs text-green-600 hover:underline">PDF</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

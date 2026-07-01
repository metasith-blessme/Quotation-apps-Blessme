"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useStatusToggle } from "@/lib/hooks/useStatusToggle";

const STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-orange-100 text-orange-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

interface Invoice {
  id: string;
  invNumber: string;
  quotationNumber?: string | null;
  customerName: string;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  grandTotal: number;
  status: string;
  createdBy: { name: string };
}

interface Props {
  invoices: Invoice[];
}

export default function InvoicesClient({ invoices }: Props) {
  const { list, updateStatus, error } = useStatusToggle(invoices, (id) => `/api/invoices/${id}`, "PUT");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return list.filter((i) => {
      const matchesSearch =
        search === "" ||
        i.customerName.toLowerCase().includes(search.toLowerCase()) ||
        i.invNumber.toLowerCase().includes(search.toLowerCase()) ||
        (i.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [list, search, statusFilter]);

  const localCounts = useMemo(() => {
    return {
      total: list.length,
      unpaid: list.filter((i) => i.status === "UNPAID").length,
      paid: list.filter((i) => i.status === "PAID").length,
      cancelled: list.filter((i) => i.status === "CANCELLED").length,
    };
  }, [list]);

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "ทั้งหมด", value: localCounts.total, color: "text-gray-700" },
          { label: "ค้างชำระ", value: localCounts.unpaid, color: "text-orange-600" },
          { label: "ชำระแล้ว", value: localCounts.paid, color: "text-green-600" },
          { label: "ยกเลิก", value: localCounts.cancelled, color: "text-gray-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="ค้นหาชื่อลูกค้า, เลขที่ใบแจ้งหนี้ หรือเลขที่ใบเสนอราคา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="UNPAID">ค้างชำระ</option>
          <option value="PAID">ชำระแล้ว</option>
          <option value="OVERDUE">เกินกำหนด</option>
          <option value="CANCELLED">ยกเลิก</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">💰</p>
            <p className="font-medium">
              {list.length === 0 ? "ยังไม่มีใบแจ้งหนี้" : "ไม่พบใบแจ้งหนี้ที่ค้นหา"}
            </p>
            {list.length === 0 && (
              <p className="text-sm mt-1">ออกใบแจ้งหนี้จากหน้า &quot;ใบเสนอราคา&quot;</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่ / No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า / Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ใบเสนอราคา / QT</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่ / Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ครบกำหนด / Due</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดรวม / Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ / Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">การดำเนินการ / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{i.invNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{i.customerName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{i.quotationNumber || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(i.issueDate)}</td>
                  <td className="px-4 py-3 text-gray-500">{i.dueDate ? formatDate(i.dueDate) : "-"}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ฿{formatCurrency(i.grandTotal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* ponytail: inline select toggle with styled drop-down chevron */}
                    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={i.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); updateStatus(i.id, e.target.value); }}
                        className={`inline-block pl-2.5 pr-6 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none text-left ${STATUS_COLORS[i.status]}`}
                        style={{ textAlignLast: "left" }}
                      >
                        <option value="UNPAID">ค้างชำระ</option>
                        <option value="PAID">ชำระแล้ว</option>
                        <option value="OVERDUE">เกินกำหนด</option>
                        <option value="CANCELLED">ยกเลิก</option>
                      </select>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] opacity-60">▼</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/invoices/${i.id}`} className="text-xs text-blue-600 hover:underline">ดู</Link>
                      <a href={`/api/invoices/${i.id}/pdf`} target="_blank" className="text-xs text-green-600 hover:underline">PDF</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

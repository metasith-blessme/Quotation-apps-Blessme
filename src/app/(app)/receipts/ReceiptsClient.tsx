"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const STATUS_LABELS: Record<string, string> = {
  WAITING: "รอการออก",
  ISSUED: "ออกใบเสร็จแล้ว",
  CANCELLED: "ยกเลิก",
};

const STATUS_COLORS: Record<string, string> = {
  WAITING: "bg-orange-100 text-orange-700",
  ISSUED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

interface Receipt {
  id: string;
  rcNumber: string;
  invoiceNumber?: string | null;
  billingNumber?: string | null;
  customerName: string;
  issueDate: string | Date;
  grandTotal: number;
  status: string;
  createdBy: { name: string };
}

interface Props {
  receipts: Receipt[];
  counts: { total: number; waiting: number; issued: number; cancelled: number };
}

export default function ReceiptsClient({ receipts, counts }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchesSearch =
        search === "" ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.rcNumber.toLowerCase().includes(search.toLowerCase()) ||
        (r.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (r.billingNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [receipts, search, statusFilter]);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "ทั้งหมด", value: counts.total, color: "text-gray-700" },
          { label: "รอการออก", value: counts.waiting, color: "text-orange-600" },
          { label: "ออกใบเสร็จแล้ว", value: counts.issued, color: "text-green-600" },
          { label: "ยกเลิก", value: counts.cancelled, color: "text-gray-500" },
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
          placeholder="ค้นหาชื่อลูกค้า, เลขที่ใบเสร็จ, ใบแจ้งหนี้ หรือใบวางบิล..."
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
          <option value="WAITING">รอการออก</option>
          <option value="ISSUED">ออกใบเสร็จแล้ว</option>
          <option value="CANCELLED">ยกเลิก</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🧾</p>
            <p className="font-medium">
              {receipts.length === 0 ? "ยังไม่มีใบเสร็จรับเงิน" : "ไม่พบใบเสร็จรับเงินที่ค้นหา"}
            </p>
            {receipts.length === 0 && (
              <p className="text-sm mt-1">ออกใบเสร็จรับเงินจากหน้า &quot;ใบแจ้งหนี้&quot; หรือ &quot;ใบวางบิล&quot;</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่ / No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า / Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">อ้างอิง / Ref</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่ / Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดรวม / Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ / Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">การดำเนินการ / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{r.rcNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{r.customerName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {r.invoiceNumber || r.billingNumber || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(r.issueDate)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ฿{formatCurrency(r.grandTotal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/receipts/${r.id}`} className="text-xs text-blue-600 hover:underline">ดู</Link>
                      <a href={`/api/receipts/${r.id}/pdf`} target="_blank" className="text-xs text-green-600 hover:underline">PDF</a>
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

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอเก็บเงิน",
  COLLECTED: "เก็บเงินแล้ว",
  CANCELLED: "ยกเลิก",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-700",
  COLLECTED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

interface Billing {
  id: string;
  bnNumber: string;
  invoiceNumber?: string | null;
  customerName: string;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  grandTotal: number;
  status: string;
  createdBy: { name: string };
}

interface Props {
  billings: Billing[];
  counts: { total: number; pending: number; collected: number; cancelled: number };
}

export default function BillingsClient({ billings, counts }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return billings.filter((b) => {
      const matchesSearch =
        search === "" ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.bnNumber.toLowerCase().includes(search.toLowerCase()) ||
        (b.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [billings, search, statusFilter]);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "ทั้งหมด", value: counts.total, color: "text-gray-700" },
          { label: "รอเก็บเงิน", value: counts.pending, color: "text-blue-600" },
          { label: "เก็บเงินแล้ว", value: counts.collected, color: "text-green-600" },
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
          placeholder="ค้นหาชื่อลูกค้า, เลขที่ใบวางบิล หรือเลขที่ใบแจ้งหนี้..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="PENDING">รอเก็บเงิน</option>
          <option value="COLLECTED">เก็บเงินแล้ว</option>
          <option value="CANCELLED">ยกเลิก</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📄</p>
            <p className="font-medium">
              {billings.length === 0 ? "ยังไม่มีใบวางบิล" : "ไม่พบใบวางบิลที่ค้นหา"}
            </p>
            {billings.length === 0 && (
              <p className="text-sm mt-1">ออกใบวางบิลจากหน้า &quot;ใบแจ้งหนี้&quot;</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่ / No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า / Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ใบแจ้งหนี้ / INV</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่ / Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ครบกำหนด / Due</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดรวม / Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ / Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">การดำเนินการ / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{b.bnNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{b.customerName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{b.invoiceNumber || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(b.issueDate)}</td>
                  <td className="px-4 py-3 text-gray-500">{b.dueDate ? formatDate(b.dueDate) : "-"}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ฿{formatCurrency(b.grandTotal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/billings/${b.id}`} className="text-xs text-blue-600 hover:underline">ดู</Link>
                      <a href={`/api/billings/${b.id}/pdf`} target="_blank" className="text-xs text-green-600 hover:underline">PDF</a>
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

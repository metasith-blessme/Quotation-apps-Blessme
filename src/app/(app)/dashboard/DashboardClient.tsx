"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";

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

interface Quotation {
  id: string;
  qtNumber: string;
  customerName: string;
  issueDate: string | Date;
  validUntil: string | Date;
  grandTotal: number;
  status: string;
  createdBy: { name: string };
}

interface Props {
  quotations: Quotation[];
  counts: { total: number; draft: number; sent: number; accepted: number };
}

export default function DashboardClient({ quotations, counts }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      const matchesSearch =
        search === "" ||
        q.customerName.toLowerCase().includes(search.toLowerCase()) ||
        q.qtNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "ทั้งหมด", value: counts.total, color: "text-gray-700" },
          { label: "ร่าง", value: counts.draft, color: "text-gray-500" },
          { label: "ส่งแล้ว", value: counts.sent, color: "text-blue-600" },
          { label: "อนุมัติ", value: counts.accepted, color: "text-green-600" },
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
          placeholder="ค้นหาชื่อลูกค้า หรือเลขที่ใบเสนอราคา..."
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
          <option value="DRAFT">ร่าง</option>
          <option value="SENT">ส่งแล้ว</option>
          <option value="ACCEPTED">อนุมัติ</option>
          <option value="REJECTED">ปฏิเสธ</option>
          <option value="EXPIRED">หมดอายุ</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📄</p>
            <p className="font-medium">
              {quotations.length === 0 ? "ยังไม่มีใบเสนอราคา" : "ไม่พบใบเสนอราคาที่ค้นหา"}
            </p>
            {quotations.length === 0 && (
              <p className="text-sm mt-1">กดปุ่ม &quot;สร้างใบเสนอราคา&quot; เพื่อเริ่มต้น</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ใช้ได้ถึง</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดรวม</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{q.qtNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{q.customerName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(q.issueDate)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(q.validUntil)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ฿{formatCurrency(q.grandTotal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/quotations/${q.id}`} className="text-xs text-blue-600 hover:underline">ดู</Link>
                      <Link href={`/quotations/${q.id}/edit`} className="text-xs text-gray-600 hover:underline">แก้ไข</Link>
                      <a href={`/api/quotations/${q.id}/pdf`} target="_blank" className="text-xs text-green-600 hover:underline">PDF</a>
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

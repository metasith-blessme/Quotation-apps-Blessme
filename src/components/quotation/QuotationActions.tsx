"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; className: string }[]> = {
  DRAFT: [
    { label: "ส่งให้ลูกค้าแล้ว", next: "SENT", className: "bg-blue-600 hover:bg-blue-700 text-white" },
  ],
  SENT: [
    { label: "✓ อนุมัติ", next: "ACCEPTED", className: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "✕ ปฏิเสธ", next: "REJECTED", className: "bg-red-500 hover:bg-red-600 text-white" },
  ],
  ACCEPTED: [],
  REJECTED: [
    { label: "กลับเป็นร่าง", next: "DRAFT", className: "bg-gray-600 hover:bg-gray-700 text-white" },
  ],
  EXPIRED: [],
};

interface Props {
  id: string;
  status: string;
  qtNumber: string;
  canDelete: boolean;
}

export function QuotationActions({ id, status, qtNumber, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const transitions = STATUS_TRANSITIONS[status] ?? [];

  async function changeStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/quotations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.push("/dashboard");
  }

  async function convertToInvoice() {
    setLoading(true);
    const res = await fetch(`/api/quotations/${id}/convert-to-invoice`, {
      method: "POST",
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/invoices/${data.id}`);
    } else {
      alert("Failed to convert to invoice");
    }
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {status === "ACCEPTED" && (
          <button
            onClick={convertToInvoice}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
          >
            {loading ? "กำลังดำเนินการ..." : "📄 ออกใบแจ้งหนี้"}
          </button>
        )}
        {transitions.map((t) => (
          <button
            key={t.next}
            onClick={() => changeStatus(t.next)}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${t.className}`}
          >
            {t.label}
          </button>
        ))}
        {canDelete && status === "DRAFT" && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            ลบ
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-gray-600 mb-5">
              ต้องการลบใบเสนอราคา{" "}
              <span className="font-mono font-medium text-gray-900">{qtNumber}</span>{" "}
              ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "กำลังลบ..." : "ลบใบเสนอราคา"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

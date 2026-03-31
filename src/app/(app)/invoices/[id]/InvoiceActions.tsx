"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; className: string }[]> = {
  UNPAID: [
    { label: "✓ ชำระเงินแล้ว", next: "PAID", className: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "✕ ยกเลิก", next: "CANCELLED", className: "bg-red-500 hover:bg-red-600 text-white" },
  ],
  PAID: [
    { label: "เปลี่ยนเป็นค้างชำระ", next: "UNPAID", className: "bg-orange-600 hover:bg-orange-700 text-white" },
  ],
  OVERDUE: [
    { label: "✓ ชำระเงินแล้ว", next: "PAID", className: "bg-green-600 hover:bg-green-700 text-white" },
  ],
  CANCELLED: [
    { label: "กู้คืน (ค้างชำระ)", next: "UNPAID", className: "bg-gray-600 hover:bg-gray-700 text-white" },
  ],
};

interface Props {
  id: string;
  status: string;
}

export default function InvoiceActions({ id, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const transitions = STATUS_TRANSITIONS[status] ?? [];

  async function changeStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 items-center">
      <a
        href={`/api/invoices/${id}/pdf`}
        target="_blank"
        className="px-4 py-2 text-sm font-medium rounded-lg border border-green-600 text-green-600 hover:bg-green-50 transition-colors"
      >
        🖨️ พิมพ์ PDF
      </a>
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
    </div>
  );
}

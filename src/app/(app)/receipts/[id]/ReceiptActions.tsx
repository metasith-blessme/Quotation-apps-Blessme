"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props {
  id: string;
  status: string;
}

export default function ReceiptActions({ id, status }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const updateStatus = async (newStatus: string) => {
    const label = newStatus === "CANCELLED" ? "ยกเลิก" : newStatus === "ISSUED" ? "ออกใบเสร็จแล้ว" : "รอการออก";
    if (!confirm(`ต้องการเปลี่ยนสถานะเป็น ${label} ใช่หรือไม่?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) router.refresh();
      else alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const deleteReceipt = async () => {
    if (!confirm("⚠️ ต้องการลบใบเสร็จนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/receipts");
      else alert("เกิดข้อผิดพลาดในการลบ");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/api/receipts/${id}/pdf`}
        target="_blank"
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-2"
      >
        <span>📄</span> พิมพ์ PDF
      </a>

      {status === "WAITING" && (
        <button
          onClick={() => updateStatus("ISSUED")}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
        >
          ✓ คลิกเพื่อออกใบเสร็จ (Issued)
        </button>
      )}

      {status === "ISSUED" && (
        <button
          onClick={() => updateStatus("WAITING")}
          disabled={loading}
          className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 text-sm font-bold rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
        >
          ↩ เปลี่ยนเป็นรอออก (Waiting)
        </button>
      )}

      {status !== "CANCELLED" && (
        <button
          onClick={() => updateStatus("CANCELLED")}
          disabled={loading}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          ยกเลิกใบเสร็จ
        </button>
      )}

      {status === "CANCELLED" && (
        <button
          onClick={() => updateStatus("WAITING")}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          กู้คืนสถานะ
        </button>
      )}

      {isAdmin && (
        <button
          onClick={deleteReceipt}
          disabled={loading}
          className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          ลบ
        </button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

interface Company {
  id: string;
  nameTh: string;
  nameEn?: string | null;
  address: string;
  taxId: string;
  phone: string;
  email: string;
  logoPath?: string | null;
  termsText?: string | null;
}

export default function SettingsClient({ company }: { company: Company | null }) {
  const [form, setForm] = useState({
    nameTh: company?.nameTh ?? "บริษัท เบลสมี ท็อปปิ้ง จำกัด",
    nameEn: company?.nameEn ?? "",
    address: company?.address ?? "",
    taxId: company?.taxId ?? "",
    phone: company?.phone ?? "",
    email: company?.email ?? "",
    logoPath: company?.logoPath ?? "",
    termsText: company?.termsText ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท (ภาษาไทย) *</label>
          <input
            type="text"
            value={form.nameTh}
            onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท (English)</label>
          <input
            type="text"
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
          <input
            type="text"
            value={form.taxId}
            onChange={(e) => setForm({ ...form, taxId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">เงื่อนไขการขาย (ค่าเริ่มต้น)</label>
          <textarea
            value={form.termsText}
            onChange={(e) => setForm({ ...form, termsText: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {success && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">บันทึกเรียบร้อยแล้ว</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </div>
    </form>
  );
}

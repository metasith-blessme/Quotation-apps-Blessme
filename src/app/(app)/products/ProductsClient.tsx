"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

interface Product {
  id: string;
  nameTh: string;
  nameEn?: string | null;
  unit: string;
  pricePerUnit: number;
  isActive: boolean;
}

const emptyForm = { nameTh: "", nameEn: "", unit: "", pricePerUnit: 0, isActive: true };

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startEdit(p: Product) {
    setEditId(p.id);
    setForm({ nameTh: p.nameTh, nameEn: p.nameEn ?? "", unit: p.unit, pricePerUnit: p.pricePerUnit, isActive: p.isActive });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
  }

  async function save() {
    setLoading(true);
    setError("");
    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pricePerUnit: Number(form.pricePerUnit) }),
    });

    setLoading(false);
    if (!res.ok) { setError("เกิดข้อผิดพลาด"); return; }
    const saved = await res.json();

    if (editId) {
      setProducts(products.map((p) => (p.id === editId ? saved : p)));
    } else {
      setProducts([...products, saved]);
    }
    cancelEdit();
  }

  async function toggleActive(p: Product) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, isActive: !p.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts(products.map((x) => (x.id === p.id ? updated : x)));
    }
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">{editId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ (ภาษาไทย) *</label>
            <input
              type="text"
              value={form.nameTh}
              onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ (English)</label>
            <input
              type="text"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">หน่วย *</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="กก., ลัง, ขวด"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ราคา/หน่วย (฿) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.pricePerUnit}
              onChange={(e) => setForm({ ...form, pricePerUnit: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="col-span-2 flex items-end gap-2">
            <button
              type="button"
              onClick={save}
              disabled={loading || !form.nameTh || !form.unit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "กำลังบันทึก..." : editId ? "บันทึก" : "เพิ่มสินค้า"}
            </button>
            {editId && (
              <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                ยกเลิก
              </button>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">หน่วย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ราคา/หน่วย</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className={p.isActive ? "" : "opacity-50"}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{p.nameTh}</p>
                  {p.nameEn && <p className="text-xs text-gray-400">{p.nameEn}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                <td className="px-4 py-3 text-right font-medium">฿{formatCurrency(p.pricePerUnit)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => startEdit(p)} className="text-xs text-blue-600 hover:underline">
                      แก้ไข
                    </button>
                    <button onClick={() => toggleActive(p)} className="text-xs text-gray-500 hover:underline">
                      {p.isActive ? "ปิด" : "เปิด"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

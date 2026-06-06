"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

interface ProductTier {
  id?: string;
  minQty: number;
  price: number;
}

interface Product {
  id: string;
  nameTh: string;
  nameEn?: string | null;
  unit: string;
  pricePerUnit: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  tiers?: ProductTier[];
}

const emptyForm = {
  nameTh: "",
  nameEn: "",
  unit: "",
  pricePerUnit: 0,
  stockQuantity: 0,
  lowStockThreshold: 0,
  isActive: true,
  tiers: [] as ProductTier[],
};

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startEdit(p: Product) {
    setEditId(p.id);
    setForm({
      nameTh: p.nameTh,
      nameEn: p.nameEn ?? "",
      unit: p.unit,
      pricePerUnit: p.pricePerUnit,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      isActive: p.isActive,
      tiers: p.tiers ? [...p.tiers] : [],
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
  }

  function addTier() {
    setForm({
      ...form,
      tiers: [...form.tiers, { minQty: 0, price: 0 }],
    });
  }

  function removeTier(index: number) {
    setForm({
      ...form,
      tiers: form.tiers.filter((_, i) => i !== index),
    });
  }

  function updateTier(index: number, field: keyof ProductTier, value: number) {
    const newTiers = [...form.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setForm({ ...form, tiers: newTiers });
  }

  function applyStandardTemplate() {
    // Check if it's a Cheese variant
    const isCheese =
      form.nameEn?.toLowerCase().includes("cheese") ||
      form.nameTh?.includes("ชีส") ||
      form.nameTh?.toLowerCase().includes("cheese");

    const markup = isCheese ? 30 : 0;

    setForm({
      ...form,
      pricePerUnit: 115 + markup,
      tiers: [
        { minQty: 6, price: 100 + markup },
        { minQty: 12, price: 90 + markup },
        { minQty: 24, price: 80 + markup }, // 1 box
        { minQty: 120, price: 75 + markup }, // 5 boxes
        { minQty: 240, price: 70 + markup }, // 10 boxes (16,800 or 24,000 total)
        { minQty: 2400, price: 65 + markup }, // 100 boxes
      ],
    });
  }

  async function save() {
    setLoading(true);
    setError("");
    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        pricePerUnit: Number(form.pricePerUnit),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      if (err.error?.fieldErrors) {
        const messages = Object.entries(err.error.fieldErrors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join(" | ");
        setError(`ข้อผิดพลาดการกรอกข้อมูล: ${messages}`);
      } else {
        setError(err.error?.message || err.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
      return;
    }
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
        <div className="space-y-4">
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
              <label className="block text-xs font-medium text-gray-600 mb-1">ราคาปกติ/หน่วย (฿) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerUnit}
                onChange={(e) => setForm({ ...form, pricePerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">จำนวนสต็อก</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">เตือนเมื่อเหลือ (Red Line)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium text-red-600"
              />
            </div>
          </div>

          {/* Pricing Tiers Section */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">ราคาพิเศษตามจำนวน (Tiers)</h4>
                <button
                  type="button"
                  onClick={applyStandardTemplate}
                  className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-bold flex items-center gap-1 shadow-sm transition-colors"
                >
                  ✨ ใช้โครงสร้างราคามาตรฐาน
                </button>
              </div>
              <button
                type="button"
                onClick={addTier}
                className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 text-blue-600 font-bold"
              >
                + เพิ่มราคาตามจำนวน
              </button>
            </div>
            {form.tiers.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">ไม่มีราคาตามจำนวน (จะใช้ราคาปกติเสมอ)</p>
            ) : (
              <div className="space-y-2">
                {form.tiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 text-right">ถ้าซื้อตั้งแต่</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="จำนวน"
                      value={tier.minQty}
                      onChange={(e) => updateTier(idx, "minQty", parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">{form.unit || "ชิ้น"}</span>
                    <span className="text-xs text-gray-500 ml-2">คิดราคาชิ้นละ</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="ราคา"
                      value={tier.price}
                      onChange={(e) => updateTier(idx, "price", parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-medium text-blue-700"
                    />
                    <span className="text-xs text-gray-500">฿</span>
                    <button type="button" onClick={() => removeTier(idx)} className="text-red-500 hover:text-red-700 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={loading || !form.nameTh || !form.unit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">หน่วย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ราคา/หน่วย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">สต็อก</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">จุดเตือน</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => {
              const isLowStock = p.stockQuantity <= p.lowStockThreshold;
              return (
                <tr key={p.id} className={`${p.isActive ? "" : "opacity-50"} ${isLowStock ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.nameTh}</p>
                    {p.nameEn && <p className="text-xs text-gray-400">{p.nameEn}</p>}
                    {p.tiers && p.tiers.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                          มี {p.tiers.length} ราคาตามจำนวน
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                  <td className="px-4 py-3 text-right font-medium">฿{formatCurrency(p.pricePerUnit)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${isLowStock ? "text-red-600 animate-pulse" : "text-gray-800"}`}>
                    {formatCurrency(p.stockQuantity)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 font-medium">{formatCurrency(p.lowStockThreshold)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => startEdit(p)} className="text-xs text-blue-600 hover:underline font-medium">
                        แก้ไข
                      </button>
                      <button onClick={() => toggleActive(p)} className="text-xs text-gray-500 hover:underline">
                        {p.isActive ? "ปิด" : "เปิด"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

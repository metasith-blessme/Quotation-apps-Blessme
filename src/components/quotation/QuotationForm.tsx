"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDateInput, addDays, formatCurrency } from "@/lib/utils/format";
import ClientPicker from "@/components/quotation/ClientPicker";

interface Product {
  id: string;
  nameTh: string;
  nameEn?: string | null;
  unit: string;
  pricePerUnit: number;
}

interface LineItem {
  productId?: string;
  productNameTh: string;
  productNameEn?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface QuotationFormProps {
  mode: "create" | "edit";
  quotationId?: string;
  defaultValues?: {
    customerName?: string;
    customerAddress?: string;
    customerTaxId?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerContact?: string;
    issueDate?: string;
    validUntil?: string;
    vatRate?: number;
    notes?: string;
    termsSnapshot?: string;
    items?: LineItem[];
  };
  defaultTerms?: string;
}

const emptyItem = (): LineItem => ({
  productNameTh: "",
  unit: "",
  quantity: 1,
  unitPrice: 0,
  lineTotal: 0,
});

export default function QuotationForm({
  mode,
  quotationId,
  defaultValues,
  defaultTerms = "",
}: QuotationFormProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showClientPicker, setShowClientPicker] = useState(false);

  function handleClientSelect(client: {
    name: string; address?: string | null; taxId?: string | null;
    phone?: string | null; email?: string | null; contactPerson?: string | null;
  }) {
    setForm((prev) => ({
      ...prev,
      customerName:    client.name,
      customerAddress: client.address    ?? prev.customerAddress,
      customerTaxId:   client.taxId      ?? prev.customerTaxId,
      customerPhone:   client.phone      ?? prev.customerPhone,
      customerEmail:   client.email      ?? prev.customerEmail,
      customerContact: client.contactPerson ?? prev.customerContact,
    }));
  }

  const today = new Date();
  const [form, setForm] = useState({
    customerName: defaultValues?.customerName ?? "",
    customerAddress: defaultValues?.customerAddress ?? "",
    customerTaxId: defaultValues?.customerTaxId ?? "",
    customerPhone: defaultValues?.customerPhone ?? "",
    customerEmail: defaultValues?.customerEmail ?? "",
    customerContact: defaultValues?.customerContact ?? "",
    issueDate: defaultValues?.issueDate ?? formatDateInput(today),
    validUntil: defaultValues?.validUntil ?? formatDateInput(addDays(today, 30)),
    vatRate: defaultValues?.vatRate ?? 7,
    notes: defaultValues?.notes ?? "",
    termsSnapshot: defaultValues?.termsSnapshot ?? defaultTerms,
  });

  const [items, setItems] = useState<LineItem[]>(
    defaultValues?.items && defaultValues.items.length > 0
      ? defaultValues.items
      : [emptyItem()]
  );

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {});
  }, []);

  function updateItem(index: number, updates: Partial<LineItem>) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      const qty = updates.quantity ?? next[index].quantity;
      const price = updates.unitPrice ?? next[index].unitPrice;
      next[index].lineTotal = qty * price;
      return next;
    });
  }

  function selectProduct(index: number, productId: string) {
    const p = products.find((p) => p.id === productId);
    if (!p) return;
    updateItem(index, {
      productId: p.id,
      productNameTh: p.nameTh,
      productNameEn: p.nameEn ?? "",
      unit: p.unit,
      unitPrice: p.pricePerUnit,
      lineTotal: items[index].quantity * p.pricePerUnit,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const vatAmount = (subtotal * form.vatRate) / 100;
  const grandTotal = subtotal + vatAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = { ...form, items };
    const url =
      mode === "create" ? "/api/quotations" : `/api/quotations/${quotationId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
      return;
    }

    const data = await res.json();
    router.push(`/quotations/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Customer Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">ข้อมูลลูกค้า</h3>
          <button
            type="button"
            onClick={() => setShowClientPicker(true)}
            className="text-sm text-green-600 hover:text-green-700 font-medium border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            👥 เลือกจากรายชื่อลูกค้า
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อลูกค้า / บริษัท <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="ชื่อบริษัทหรือร้านค้าลูกค้า"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
            <textarea
              value={form.customerAddress}
              onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่ผู้เสียภาษี</label>
            <input
              type="text"
              value={form.customerTaxId}
              onChange={(e) => setForm({ ...form, customerTaxId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ติดต่อ</label>
            <input
              type="text"
              value={form.customerContact}
              onChange={(e) => setForm({ ...form, customerContact: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
            <input
              type="text"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">วันที่</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ออก</label>
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ใช้ได้ถึง</label>
            <input
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">รายการสินค้า</h3>
          <button
            type="button"
            onClick={() => setItems([...items, emptyItem()])}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            + เพิ่มรายการ
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2 pr-3 w-8">#</th>
                <th className="pb-2 pr-3">สินค้า</th>
                <th className="pb-2 pr-3 w-20">หน่วย</th>
                <th className="pb-2 pr-3 w-24 text-right">จำนวน</th>
                <th className="pb-2 pr-3 w-28 text-right">ราคา/หน่วย</th>
                <th className="pb-2 pr-3 w-28 text-right">รวม</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <div className="space-y-1">
                      <select
                        value={item.productId ?? ""}
                        onChange={(e) => {
                          if (e.target.value) selectProduct(i, e.target.value);
                          else updateItem(i, { productId: undefined });
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">-- เลือกสินค้า --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nameTh}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.productNameTh}
                        onChange={(e) => updateItem(i, { productNameTh: e.target.value })}
                        required
                        placeholder="ชื่อสินค้า (ภาษาไทย)"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(i, { unit: e.target.value })}
                      required
                      placeholder="กก."
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(i, { quantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(i, { unitPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </td>
                  <td className="py-2 pr-3 text-right font-medium text-gray-700">
                    {formatCurrency(item.lineTotal)}
                  </td>
                  <td className="py-2">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>ราคาก่อนภาษี</span>
              <span>฿{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span className="flex items-center gap-1">
                ภาษีมูลค่าเพิ่ม
                <input
                  type="number"
                  value={form.vatRate}
                  onChange={(e) => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                />
                %
              </span>
              <span>฿{formatCurrency(vatAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 text-base border-t pt-2">
              <span>รวมทั้งสิ้น</span>
              <span>฿{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">หมายเหตุและเงื่อนไข</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เงื่อนไขการขาย</label>
            <textarea
              value={form.termsSnapshot}
              onChange={(e) => setForm({ ...form, termsSnapshot: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 justify-end pb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? "กำลังบันทึก..." : mode === "create" ? "สร้างใบเสนอราคา" : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </div>
      {showClientPicker && (
        <ClientPicker
          onSelect={handleClientSelect}
          onClose={() => setShowClientPicker(false)}
        />
      )}
    </form>
  );
}

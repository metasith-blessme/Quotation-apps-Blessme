"use client";

import { useState } from "react";


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
  pastedBoxes: number;
  pastedBags: number;
  unpackedBoxes: number;
  unpackedBags: number;
  chineseLabelBoxes: number;
  pack1: number;
  pack2: number;
  pack3: number;
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
  pastedBoxes: 0,
  pastedBags: 0,
  unpackedBoxes: 0,
  unpackedBags: 0,
  chineseLabelBoxes: 0,
  pack1: 0,
  pack2: 0,
  pack3: 0,
};

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dirtyProducts, setDirtyProducts] = useState<Record<string, boolean>>({});
  const [savingStock, setSavingStock] = useState(false);
  const [stockSaveSuccess, setStockSaveSuccess] = useState(false);

  // Buddhist Era Date format helper
  const getThaiBEContext = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear() + 543;
    return { day, month, year };
  };

  const thaiDate = getThaiBEContext();


  const getBobaDisplay = (p: Product) => {
    const name = (p.nameEn ?? p.nameTh ?? "").toLowerCase();
    if (name.includes("barley")) return { name: "บาร์เลย์", code: "BL", colorClass: "text-gray-900 font-bold" };
    if (name.includes("oat")) return { name: "โอ๊ต", code: "OA", colorClass: "text-gray-900 font-bold" };
    if (name.includes("redbean")) return { name: "ถั่วแดง", code: "RB", colorClass: "text-red-600 font-bold" };
    if (name.includes("water chestnut") || name.includes("chestnut")) return { name: "แห้ว", code: "HW", colorClass: "text-gray-900 font-bold" };
    if (name.includes("osmanthus")) return { name: "หมื่นลี้", code: "ML", colorClass: "text-red-600 font-bold" };
    if (name.includes("cheese")) return { name: "ชีส", code: "CS", colorClass: "text-gray-900 font-bold" };
    return { name: p.nameTh, code: p.nameEn ? p.nameEn.substring(0, 2).toUpperCase() : "PO", colorClass: "text-gray-900 font-bold" };
  };

  const handleGridChange = (productId: string, field: keyof Product, value: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
    setDirtyProducts((prev) => ({ ...prev, [productId]: true }));
  };

  const saveStockGrid = async () => {
    setSavingStock(true);
    setError("");
    try {
      const dirtyIds = Object.keys(dirtyProducts).filter((id) => dirtyProducts[id]);
      if (dirtyIds.length === 0) {
        setSavingStock(false);
        return;
      }

      const promises = dirtyIds.map(async (id) => {
        const p = products.find((prod) => prod.id === id);
        if (!p) return;

        const res = await fetch(`/api/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nameTh: p.nameTh,
            nameEn: p.nameEn,
            unit: p.unit,
            pricePerUnit: p.pricePerUnit,
            lowStockThreshold: p.lowStockThreshold,
            isActive: p.isActive,
            tiers: p.tiers ?? [],
            pastedBoxes: p.pastedBoxes,
            pastedBags: p.pastedBags,
            unpackedBoxes: p.unpackedBoxes,
            unpackedBags: p.unpackedBags,
            chineseLabelBoxes: p.chineseLabelBoxes,
            pack1: p.pack1,
            pack2: p.pack2,
            pack3: p.pack3,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || `ไม่สามารถบันทึก ${p.nameTh} ได้`);
        }

        return res.json();
      });

      const updatedProducts = await Promise.all(promises);

      setProducts((prev) =>
        prev.map((p) => {
          const updated = updatedProducts.find((up) => up && up.id === p.id);
          return updated ? updated : p;
        })
      );

      setDirtyProducts({});
      setStockSaveSuccess(true);
      setTimeout(() => setStockSaveSuccess(false), 3000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกสต็อก";
      setError(errMsg);
    } finally {
      setSavingStock(false);
    }
  };

  // Sort all products: boba first (in specific order), then others (by nameTh)
  const getProductSortIndex = (p: Product) => {
    const name = (p.nameEn ?? p.nameTh ?? "").toLowerCase();
    if (name.includes("barley")) return 0;
    if (name.includes("oat")) return 1;
    if (name.includes("redbean")) return 2;
    if (name.includes("water chestnut") || name.includes("chestnut")) return 3;
    if (name.includes("osmanthus")) return 4;
    if (name.includes("cheese")) return 5;
    return 100; // non-boba products go last
  };

  const sortedAllProducts = [...products].sort((a, b) => {
    const indexA = getProductSortIndex(a);
    const indexB = getProductSortIndex(b);
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.nameTh.localeCompare(b.nameTh, "th");
  });

  const hasDirtyProducts = Object.values(dirtyProducts).some((v) => v);

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
      pastedBoxes: p.pastedBoxes ?? 0,
      pastedBags: p.pastedBags ?? 0,
      unpackedBoxes: p.unpackedBoxes ?? 0,
      unpackedBags: p.unpackedBags ?? 0,
      chineseLabelBoxes: p.chineseLabelBoxes ?? 0,
      pack1: p.pack1 ?? 0,
      pack2: p.pack2 ?? 0,
      pack3: p.pack3 ?? 0,
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
        pastedBoxes: Number(form.pastedBoxes),
        pastedBags: Number(form.pastedBags),
        unpackedBoxes: Number(form.unpackedBoxes),
        unpackedBags: Number(form.unpackedBags),
        chineseLabelBoxes: Number(form.chineseLabelBoxes),
        pack1: Number(form.pack1),
        pack2: Number(form.pack2),
        pack3: Number(form.pack3),
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
    <div className="space-y-6">
      {/* Stock Inventory Grid (Bless Me) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">สต๊อกสินค้า Bless Me</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              วันที่ <span className="text-red-600 font-bold">{thaiDate.day}</span> เดือน <span className="text-red-600 font-bold">{thaiDate.month}</span> ปี <span className="text-red-600 font-bold">{thaiDate.year}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasDirtyProducts && (
              <span className="text-xs text-amber-600 font-medium animate-pulse">
                ⚠️ มีข้อมูลที่ยังไม่ได้บันทึก
              </span>
            )}
            <button
              type="button"
              onClick={saveStockGrid}
              disabled={savingStock || !hasDirtyProducts}
              className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 ${
                hasDirtyProducts
                  ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer hover:shadow-md active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              }`}
            >
              {savingStock ? "กำลังบันทึก..." : "บันทึกสต็อก"}
            </button>
          </div>
        </div>

        {stockSaveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-2">
            <span>✅ บันทึกข้อมูลสต็อกเรียบร้อยแล้ว!</span>
          </div>
        )}

        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-3 py-2.5 font-bold text-gray-700 text-center">ชื่อสินค้า</th>
                <th className="border border-gray-300 px-3 py-2.5 font-bold text-gray-700 text-center w-24">แปะแล้ว</th>
                <th className="border border-gray-300 px-3 py-2.5 font-bold text-gray-700 text-center w-24">แกะแล้ว</th>
                <th className="border border-gray-300 px-3 py-2.5 font-bold text-gray-700 text-center w-24">ฉลากจีน</th>
                <th className="border border-gray-300 px-3 py-2.5 font-bold text-gray-700 text-center w-20">แพ็ค 1 ถุง</th>
                <th className="border border-gray-300 px-3 py-2.5 font-bold text-gray-700 text-center w-20">แพ็ค 2 ถุง</th>
                <th className="border border-gray-300 px-3 py-2.5 font-bold text-gray-700 text-center w-20">แพ็ค 3 ถุง</th>
                <th className="border border-gray-300 px-3 py-2.5 font-bold text-gray-700 text-center w-28">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 bg-white">
              {sortedAllProducts.map((p) => {
                const display = getBobaDisplay(p);
                const isLowStock = p.stockQuantity <= p.lowStockThreshold;
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50 ${p.isActive ? "" : "opacity-60 bg-gray-50/50"} ${
                      isLowStock ? "bg-red-50/40" : ""
                    }`}
                  >
                    {/* ชื่อสินค้า column with Actions embedded */}
                    <td className="border border-gray-300 px-3 py-2 font-semibold text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-left">
                          <div className={display.colorClass}>{display.name}</div>
                          {display.code && (
                            <div
                              className={`text-xs ${
                                display.colorClass === "text-red-600 font-bold"
                                  ? "text-red-600 font-bold"
                                  : "text-gray-500"
                              }`}
                            >
                              {display.code}
                            </div>
                          )}
                          {p.tiers && p.tiers.length > 0 && (
                            <span className="inline-block mt-1 text-[9px] bg-blue-50 text-blue-600 px-1 py-0.2 rounded border border-blue-100 font-medium">
                              มี {p.tiers.length} ราคาตามจำนวน
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="text-xs text-blue-600 hover:underline font-bold"
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(p)}
                            className={`text-[10px] hover:underline font-medium ${
                              p.isActive ? "text-gray-500" : "text-green-600 font-bold"
                            }`}
                          >
                            {p.isActive ? "ปิด" : "เปิด"}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* แปะแล้ว column */}
                    <td className="border border-gray-300 p-1">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={p.pastedBoxes || ""}
                            placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "pastedBoxes", parseInt(e.target.value) || 0)}
                            className="w-12 text-right px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent"
                          />
                          <span className="text-[10px] text-gray-500 font-medium">ลัง</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={p.pastedBags || ""}
                            placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "pastedBags", parseInt(e.target.value) || 0)}
                            className="w-12 text-right px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent"
                          />
                          <span className="text-[10px] text-gray-500 font-medium">ถุง</span>
                        </div>
                      </div>
                    </td>

                    {/* แกะแล้ว column */}
                    <td className="border border-gray-300 p-1">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={p.unpackedBoxes || ""}
                            placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "unpackedBoxes", parseInt(e.target.value) || 0)}
                            className="w-12 text-right px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent"
                          />
                          <span className="text-[10px] text-gray-500 font-medium">ลัง</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={p.unpackedBags || ""}
                            placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "unpackedBags", parseInt(e.target.value) || 0)}
                            className="w-12 text-right px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent"
                          />
                          <span className="text-[10px] text-gray-500 font-medium">ถุง</span>
                        </div>
                      </div>
                    </td>

                    {/* ฉลากจีน column */}
                    <td className="border border-gray-300 p-1">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={p.chineseLabelBoxes || ""}
                          placeholder="0"
                          onChange={(e) => handleGridChange(p.id, "chineseLabelBoxes", parseInt(e.target.value) || 0)}
                          className="w-12 text-right px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent"
                        />
                        <span className="text-[10px] text-gray-500 font-medium">ลัง</span>
                      </div>
                    </td>

                    {/* แพ็ค 1 ถุง column */}
                    <td className="border border-gray-300 p-1">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={p.pack1 || ""}
                          placeholder="0"
                          onChange={(e) => handleGridChange(p.id, "pack1", parseInt(e.target.value) || 0)}
                          className="w-12 text-center px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent"
                        />
                      </div>
                    </td>

                    {/* แพ็ค 2 ถุง column */}
                    <td className="border border-gray-300 p-1">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={p.pack2 || ""}
                          placeholder="0"
                          onChange={(e) => handleGridChange(p.id, "pack2", parseInt(e.target.value) || 0)}
                          className="w-12 text-center px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent"
                        />
                      </div>
                    </td>

                    {/* แพ็ค 3 ถุง column */}
                    <td className="border border-gray-300 p-1">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={p.pack3 || ""}
                          placeholder="0"
                          onChange={(e) => handleGridChange(p.id, "pack3", parseInt(e.target.value) || 0)}
                          className="w-12 text-center px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent"
                        />
                      </div>
                    </td>

                    {/* รวม column */}
                    <td className="border border-gray-300 p-1 text-center bg-red-50/20">
                      {(() => {
                        const totalBoxes = p.pastedBoxes + p.unpackedBoxes + p.chineseLabelBoxes;
                        const totalBags = p.pastedBags + p.unpackedBags + p.pack1 * 1 + p.pack2 * 2 + p.pack3 * 3;
                        return (
                          <div className="text-center text-red-600 font-bold text-xs flex flex-col items-center justify-center min-h-[50px] leading-tight">
                            {totalBoxes > 0 && <div>{totalBoxes} ลัง</div>}
                            {totalBags > 0 && <div>{totalBags} ถุง</div>}
                            {totalBoxes === 0 && totalBags === 0 && <div>0 ถุง</div>}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
}

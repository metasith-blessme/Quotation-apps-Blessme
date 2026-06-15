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

export default function ProductsClient({
  initialProducts,
  userRole,
}: {
  initialProducts: Product[];
  userRole: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [templateUnit, setTemplateUnit] = useState<"pcs" | "box">("pcs");

  // Stock grid state
  const [dirtyProducts, setDirtyProducts] = useState<Record<string, boolean>>({});
  const [savingStock, setSavingStock] = useState(false);
  const [stockSaveSuccess, setStockSaveSuccess] = useState(false);

  const isAdmin = userRole === "ADMIN";

  // ─── Boba detection ──────────────────────────────────────
  const isBobaProduct =
    form.nameEn?.toLowerCase().includes("popping boba") ||
    form.nameEn?.toLowerCase().includes("popping") ||
    form.nameEn?.toLowerCase().includes("boba") ||
    form.nameTh?.toLowerCase().includes("popping boba") ||
    form.nameTh?.toLowerCase().includes("เม็ดป็อป") ||
    form.nameTh?.toLowerCase().includes("บ๊อบบ้า");

  const calculatedTotalStock = isBobaProduct
    ? (form.pastedBoxes ?? 0) * 24 +
      (form.pastedBags ?? 0) +
      (form.unpackedBoxes ?? 0) * 24 +
      (form.unpackedBags ?? 0) +
      (form.chineseLabelBoxes ?? 0) * 24 +
      (form.pack1 ?? 0) +
      (form.pack2 ?? 0) * 2 +
      (form.pack3 ?? 0) * 3
    : form.stockQuantity;

  // ─── Thai Buddhist Era date ──────────────────────────────
  const getThaiBEContext = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear() + 543;
    return { day, month, year };
  };
  const thaiDate = getThaiBEContext();

  // ─── Boba display helpers ────────────────────────────────
  const getBobaDisplay = (p: Product) => {
    const name = (p.nameEn ?? p.nameTh ?? "").toLowerCase();
    if (name.includes("barley") || name.includes("บาร์เลย์")) return { name: "บาร์เลย์", code: "BL", colorClass: "text-gray-950 font-bold" };
    if (name.includes("oat") || name.includes("โอ๊ต")) return { name: "โอ๊ต", code: "OA", colorClass: "text-gray-900 font-bold" };
    if (name.includes("redbean") || name.includes("red bean") || name.includes("ถั่วแดง")) return { name: "ถั่วแดง", code: "RB", colorClass: "text-red-600 font-bold" };
    if (name.includes("water chestnut") || name.includes("chestnut") || name.includes("แห้ว")) return { name: "แห้ว", code: "HW", colorClass: "text-gray-900 font-bold" };
    if (name.includes("osmanthus") || name.includes("หมื่นลี้")) return { name: "หมื่นลี้", code: "ML", colorClass: "text-red-600 font-bold" };
    if (name.includes("cheese") || name.includes("ชีส")) return { name: "ชีส", code: "CS", colorClass: "text-gray-900 font-bold" };
    return { name: p.nameTh, code: p.nameEn ?? "", colorClass: "text-gray-800 font-medium" };
  };

  const getProductSortIndex = (p: Product) => {
    const name = (p.nameEn ?? p.nameTh ?? "").toLowerCase();
    if (name.includes("barley") || name.includes("บาร์เลย์")) return 0;
    if (name.includes("oat") || name.includes("โอ๊ต")) return 1;
    if (name.includes("redbean") || name.includes("red bean") || name.includes("ถั่วแดง")) return 2;
    if (name.includes("water chestnut") || name.includes("chestnut") || name.includes("แห้ว")) return 3;
    if (name.includes("osmanthus") || name.includes("หมื่นลี้")) return 4;
    if (name.includes("cheese") || name.includes("ชีส")) return 5;
    return 100;
  };

  const sortedProducts = [...products]
    .filter((p) => p.isActive)
    .sort((a, b) => {
      const indexA = getProductSortIndex(a);
      const indexB = getProductSortIndex(b);
      if (indexA !== indexB) return indexA - indexB;
      return a.nameTh.localeCompare(b.nameTh, "th");
    });

  // ─── Stock grid inline editing ───────────────────────────
  const handleGridChange = (productId: string, field: keyof Product, value: number) => {
    if (!isAdmin) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
    );
    setDirtyProducts((prev) => ({ ...prev, [productId]: true }));
  };

  const handleGridStringChange = (productId: string, field: "nameTh" | "nameEn" | "unit", value: string) => {
    if (!isAdmin) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
    );
    setDirtyProducts((prev) => ({ ...prev, [productId]: true }));
  };

  const hasDirtyProducts = Object.values(dirtyProducts).some((v) => v);

  const saveStockGrid = async () => {
    if (!isAdmin) return;
    setSavingStock(true);
    setError("");
    try {
      const dirtyIds = Object.keys(dirtyProducts).filter((id) => dirtyProducts[id]);
      if (dirtyIds.length === 0) { setSavingStock(false); return; }

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

  // ─── Product CRUD ────────────────────────────────────────
  function startEdit(p: Product) {
    setEditId(p.id);
    setShowForm(true);
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
    setShowForm(false);
  }

  function addTier() {
    setForm({ ...form, tiers: [...form.tiers, { minQty: 0, price: 0 }] });
  }

  function removeTier(index: number) {
    setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== index) });
  }

  function updateTier(index: number, field: keyof ProductTier, value: number) {
    const newTiers = [...form.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setForm({ ...form, tiers: newTiers });
  }

  function applyStandardTemplate() {
    const isCheese =
      form.nameEn?.toLowerCase().includes("cheese") ||
      form.nameTh?.includes("ชีส") ||
      form.nameTh?.toLowerCase().includes("cheese");

    const isTopping =
      form.nameEn?.toLowerCase().includes("barley") ||
      form.nameTh?.includes("บาร์เลย์") ||
      form.nameEn?.toLowerCase().includes("redbean") ||
      form.nameEn?.toLowerCase().includes("red bean") ||
      form.nameTh?.includes("ถั่วแดง") ||
      form.nameEn?.toLowerCase().includes("oat") ||
      form.nameTh?.includes("โอ๊ต") ||
      form.nameEn?.toLowerCase().includes("chestnut") ||
      form.nameTh?.includes("แห้ว") ||
      form.nameEn?.toLowerCase().includes("osmanthus") ||
      form.nameTh?.includes("หมื่นลี้");

    if (isTopping) {
      if (templateUnit === "pcs") {
        setForm({
          ...form,
          unit: "ถุง",
          pricePerUnit: 80,
          tiers: [
            { minQty: 72, price: 77 },
            { minQty: 120, price: 75 },
            { minQty: 240, price: 70 },
            { minQty: 2400, price: 65 },
          ],
        });
      } else {
        setForm({
          ...form,
          unit: "ลัง",
          pricePerUnit: 80 * 24,
          tiers: [
            { minQty: 3, price: 77 * 24 },
            { minQty: 5, price: 75 * 24 },
            { minQty: 10, price: 70 * 24 },
            { minQty: 100, price: 65 * 24 },
          ],
        });
      }
    } else {
      const markup = isCheese ? 30 : 0;
      if (templateUnit === "pcs") {
        setForm({
          ...form,
          unit: "ถุง",
          pricePerUnit: 115 + markup,
          tiers: [
            { minQty: 6, price: 100 + markup },
            { minQty: 12, price: 90 + markup },
            { minQty: 24, price: 80 + markup },
            { minQty: 120, price: 75 + markup },
            { minQty: 240, price: 70 + markup },
            { minQty: 2400, price: 65 + markup },
          ],
        });
      } else {
        setForm({
          ...form,
          unit: "ลัง",
          pricePerUnit: (115 + markup) * 24,
          tiers: [
            { minQty: 6 / 24, price: (100 + markup) * 24 },
            { minQty: 12 / 24, price: (90 + markup) * 24 },
            { minQty: 24 / 24, price: (80 + markup) * 24 },
            { minQty: 120 / 24, price: (75 + markup) * 24 },
            { minQty: 240 / 24, price: (70 + markup) * 24 },
            { minQty: 2400 / 24, price: (65 + markup) * 24 },
          ],
        });
      }
    }
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
        stockQuantity: Number(calculatedTotalStock),
        lowStockThreshold: Number(form.lowStockThreshold),
        pastedBoxes: Number(form.pastedBoxes ?? 0),
        pastedBags: Number(form.pastedBags ?? 0),
        unpackedBoxes: Number(form.unpackedBoxes ?? 0),
        unpackedBags: Number(form.unpackedBags ?? 0),
        chineseLabelBoxes: Number(form.chineseLabelBoxes ?? 0),
        pack1: Number(form.pack1 ?? 0),
        pack2: Number(form.pack2 ?? 0),
        pack3: Number(form.pack3 ?? 0),
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
      {/* ─── Stock Grid (Primary View) ────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="text-center w-full md:text-left md:w-auto">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">สต๊อกสินค้า Bless Me</h2>
            <p className="text-sm font-semibold text-gray-600 mt-1">
              วันที่ <span className="text-red-600 font-bold">{thaiDate.day}</span> เดือน <span className="text-red-600 font-bold">{thaiDate.month}</span> ปี <span className="text-red-600 font-bold">{thaiDate.year}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {hasDirtyProducts && (
              <span className="text-xs text-amber-600 font-medium animate-pulse">
                ⚠️ มีข้อมูลสต็อกที่ยังไม่ได้บันทึก
              </span>
            )}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={saveStockGrid}
                  disabled={savingStock || !hasDirtyProducts}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 ${
                    hasDirtyProducts
                      ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer hover:shadow-md active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  }`}
                >
                  {savingStock ? "กำลังบันทึก..." : "บันทึกสต็อก"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(!showForm); if (showForm) cancelEdit(); }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                >
                  {showForm ? "✕ ปิดฟอร์ม" : "+ เพิ่ม/แก้ไขสินค้า"}
                </button>
              </>
            )}
          </div>
        </div>

        {stockSaveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">
            <span>✅ บันทึกข้อมูลสต็อกเรียบร้อยแล้ว!</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
            <span>❌ {error}</span>
          </div>
        )}

        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center text-base">ชื่อ</th>
                <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center w-28 text-base">แปะแล้ว</th>
                <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center w-28 text-base">แกะแล้ว</th>
                <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center w-28 text-base">ฉลากจีน</th>
                <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center w-24 text-base">แพ็ค 1 ถุง</th>
                <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center w-24 text-base">แพ็ค 2 ถุง</th>
                <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center w-24 text-base">แพ็ค 3 ถุง</th>
                <th className="border border-gray-300 px-3 py-3 font-bold text-red-600 text-center w-36 text-lg bg-red-50/15">รวม</th>
                {isAdmin && <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center w-24 text-sm">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 bg-white">
              {sortedProducts.map((p) => {
                const display = getBobaDisplay(p);
                const isLowStock = p.stockQuantity <= p.lowStockThreshold;
                const totalBoxes = p.pastedBoxes + p.unpackedBoxes + p.chineseLabelBoxes;
                const totalBags = p.pastedBags + p.unpackedBags + p.pack1 * 1 + p.pack2 * 2 + p.pack3 * 3;
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50/50 transition-colors ${isLowStock ? "bg-red-50/20" : ""}`}
                  >
                    {/* ชื่อ */}
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold min-w-[120px]">
                      <div className={`${display.colorClass} text-base`}>{display.name}</div>
                      {display.code && (
                        <div className={`text-xs ${display.colorClass.includes("text-red-600") ? "text-red-600 font-bold" : "text-gray-500"}`}>
                          {display.code}
                        </div>
                      )}
                    </td>

                    {/* แปะแล้ว */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" value={p.pastedBoxes || ""} placeholder="0"
                              onChange={(e) => handleGridChange(p.id, "pastedBoxes", parseInt(e.target.value) || 0)}
                              className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium" />
                            <span className="text-xs text-gray-500 font-medium">ลัง</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" value={p.pastedBags || ""} placeholder="0"
                              onChange={(e) => handleGridChange(p.id, "pastedBags", parseInt(e.target.value) || 0)}
                              className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium" />
                            <span className="text-xs text-gray-500 font-medium">ถุง</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-800 space-y-0.5">
                          {p.pastedBoxes > 0 && <div>{p.pastedBoxes} ลัง</div>}
                          {p.pastedBags > 0 && <div>{p.pastedBags} ถุง</div>}
                          {p.pastedBoxes === 0 && p.pastedBags === 0 && <span className="text-gray-300">-</span>}
                        </div>
                      )}
                    </td>

                    {/* แกะแล้ว */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" value={p.unpackedBoxes || ""} placeholder="0"
                              onChange={(e) => handleGridChange(p.id, "unpackedBoxes", parseInt(e.target.value) || 0)}
                              className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium" />
                            <span className="text-xs text-gray-500 font-medium">ลัง</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" value={p.unpackedBags || ""} placeholder="0"
                              onChange={(e) => handleGridChange(p.id, "unpackedBags", parseInt(e.target.value) || 0)}
                              className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium" />
                            <span className="text-xs text-gray-500 font-medium">ถุง</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-800 space-y-0.5">
                          {p.unpackedBoxes > 0 && <div>{p.unpackedBoxes} ลัง</div>}
                          {p.unpackedBags > 0 && <div>{p.unpackedBags} ถุง</div>}
                          {p.unpackedBoxes === 0 && p.unpackedBags === 0 && <span className="text-gray-300">-</span>}
                        </div>
                      )}
                    </td>

                    {/* ฉลากจีน */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-1">
                          <input type="number" min="0" value={p.chineseLabelBoxes || ""} placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "chineseLabelBoxes", parseInt(e.target.value) || 0)}
                            className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium" />
                          <span className="text-xs text-gray-500 font-medium">ลัง</span>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-800">
                          {p.chineseLabelBoxes > 0 ? `${p.chineseLabelBoxes} ลัง` : <span className="text-gray-300">-</span>}
                        </div>
                      )}
                    </td>

                    {/* แพ็ค 1 ถุง */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center">
                          <input type="number" min="0" value={p.pack1 || ""} placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "pack1", parseInt(e.target.value) || 0)}
                            className="w-14 text-center px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium" />
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-800">
                          {p.pack1 > 0 ? p.pack1 : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* แพ็ค 2 ถุง */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center">
                          <input type="number" min="0" value={p.pack2 || ""} placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "pack2", parseInt(e.target.value) || 0)}
                            className="w-14 text-center px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium" />
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-800">
                          {p.pack2 > 0 ? p.pack2 : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* แพ็ค 3 ถุง */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center">
                          <input type="number" min="0" value={p.pack3 || ""} placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "pack3", parseInt(e.target.value) || 0)}
                            className="w-14 text-center px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium" />
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-800">
                          {p.pack3 > 0 ? p.pack3 : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* รวม */}
                    <td className="border border-gray-300 p-2 text-center bg-red-50/15">
                      <div className="text-center text-red-600 font-bold text-base md:text-lg flex flex-col items-center justify-center min-h-[55px] leading-snug">
                        {totalBoxes > 0 && <div>{totalBoxes} ลัง</div>}
                        {totalBags > 0 && <div>{totalBags} ถุง</div>}
                        {totalBoxes === 0 && totalBags === 0 && <div>0 ถุง</div>}
                      </div>
                    </td>

                    {/* จัดการ */}
                    {isAdmin && (
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button onClick={() => startEdit(p)} className="text-xs text-blue-600 hover:underline font-medium">
                            แก้ไข
                          </button>
                          <button onClick={() => toggleActive(p)} className="text-xs text-gray-500 hover:underline">
                            ปิด
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Product Add/Edit Form (Collapsible, Admin only) ── */}
      {isAdmin && showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-medium text-gray-800 mb-4">{editId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ (ภาษาไทย) *</label>
                <input type="text" value={form.nameTh}
                  onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ (English)</label>
                <input type="text" value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">หน่วย *</label>
                {isBobaProduct ? (
                  <select
                    value={
                      form.unit === "pcs" || form.unit === "ถุง"
                        ? "ถุง"
                        : form.unit === "box" || form.unit === "ลัง"
                        ? "ลัง"
                        : ""
                    }
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  >
                    <option value="">-- เลือกหน่วย --</option>
                    <option value="ถุง">ถุง (pcs)</option>
                    <option value="ลัง">ลัง (box)</option>
                  </select>
                ) : (
                  <input type="text" value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="กก., ลัง, ขวด"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ราคาปกติ/หน่วย (฿) *</label>
                <input type="number" min="0" step="0.01" value={form.pricePerUnit}
                  onChange={(e) => setForm({ ...form, pricePerUnit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {isBobaProduct ? "จำนวนสต็อก (คำนวณอัตโนมัติ)" : "จำนวนสต็อก"}
                </label>
                <input type="number" min="0" step="0.01"
                  value={isBobaProduct ? calculatedTotalStock : form.stockQuantity}
                  disabled={isBobaProduct}
                  onChange={(e) => setForm({ ...form, stockQuantity: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isBobaProduct ? "bg-gray-100 text-gray-500 font-semibold cursor-not-allowed" : ""
                  }`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">เตือนเมื่อเหลือ (Red Line)</label>
                <input type="number" min="0" step="0.01" value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium text-red-600" />
              </div>
            </div>

            {/* Boba Stock Breakdown Inputs */}
            {isBobaProduct && (
              <div className="bg-green-50/50 border border-green-200 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider">
                  รายละเอียดสต๊อกสินค้าเม็ดป็อป (Popping Boba Breakdown)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">แปะแล้ว (ลัง)</label>
                    <input type="number" min="0" value={form.pastedBoxes}
                      onChange={(e) => setForm({ ...form, pastedBoxes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">แปะแล้ว (ถุง)</label>
                    <input type="number" min="0" value={form.pastedBags}
                      onChange={(e) => setForm({ ...form, pastedBags: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">แกะแล้ว (ลัง)</label>
                    <input type="number" min="0" value={form.unpackedBoxes}
                      onChange={(e) => setForm({ ...form, unpackedBoxes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">แกะแล้ว (ถุง)</label>
                    <input type="number" min="0" value={form.unpackedBags}
                      onChange={(e) => setForm({ ...form, unpackedBags: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ฉลากจีน (ลัง)</label>
                    <input type="number" min="0" value={form.chineseLabelBoxes}
                      onChange={(e) => setForm({ ...form, chineseLabelBoxes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">แพ็ค 1 ถุง (จำนวน)</label>
                    <input type="number" min="0" value={form.pack1}
                      onChange={(e) => setForm({ ...form, pack1: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">แพ็ค 2 ถุง (จำนวน)</label>
                    <input type="number" min="0" value={form.pack2}
                      onChange={(e) => setForm({ ...form, pack2: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">แพ็ค 3 ถุง (จำนวน)</label>
                    <input type="number" min="0" value={form.pack3}
                      onChange={(e) => setForm({ ...form, pack3: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                </div>
                <p className="text-[11px] text-green-700 italic">
                  * สต็อกรวมที่บันทึกจะคำนวณตามสูตร: 1 ลัง = 24 ถุง, แพ็ค 2 = 2 ถุง, แพ็ค 3 = 3 ถุง
                </p>
              </div>
            )}

            {/* Pricing Tiers Section */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">ราคาพิเศษตามจำนวน (Tiers)</h4>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={applyStandardTemplate}
                      className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-bold flex items-center gap-1 shadow-sm transition-colors">
                      ✨ ใช้โครงสร้างราคามาตรฐาน
                    </button>
                    <select
                      value={templateUnit}
                      onChange={(e) => setTemplateUnit(e.target.value as "pcs" | "box")}
                      className="text-[10px] border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <option value="pcs">ถุง (pcs)</option>
                      <option value="box">ลัง (box)</option>
                    </select>
                  </div>
                </div>
                <button type="button" onClick={addTier}
                  className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 text-blue-600 font-bold">
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
                      <input type="number" min="1" placeholder="จำนวน" value={tier.minQty}
                        onChange={(e) => updateTier(idx, "minQty", parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500" />
                      <span className="text-xs text-gray-500">{form.unit || "ชิ้น"}</span>
                      <span className="text-xs text-gray-500 ml-2">คิดราคาชิ้นละ</span>
                      <input type="number" min="0" step="0.01" placeholder="ราคา" value={tier.price}
                        onChange={(e) => updateTier(idx, "price", parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-medium text-blue-700" />
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
              <button type="button" onClick={save}
                disabled={loading || !form.nameTh || !form.unit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                {loading ? "กำลังบันทึก..." : editId ? "บันทึก" : "เพิ่มสินค้า"}
              </button>
              <button type="button" onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Product Details Table (pricing info, below grid) ── */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-sm font-semibold text-gray-700">รายละเอียดราคาสินค้า</h3>
            {hasDirtyProducts && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold animate-pulse">
                ⚠️ มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-bold text-gray-700 text-xs w-1/3">ชื่อสินค้า (ไทย / อังกฤษ)</th>
                  <th className="text-center px-3 py-2.5 font-bold text-gray-700 text-xs w-20">หน่วย</th>
                  <th className="text-right px-3 py-2.5 font-bold text-gray-700 text-xs w-28">ราคา/หน่วย</th>
                  <th className="text-right px-3 py-2.5 font-bold text-gray-700 text-xs w-28">สต็อกรวม</th>
                  <th className="text-right px-3 py-2.5 font-bold text-gray-700 text-xs w-28">จุดเตือน</th>
                  <th className="text-center px-3 py-2.5 font-bold text-gray-700 text-xs w-20">Tiers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sortedProducts.map((p) => {
                  const isLowStock = p.stockQuantity <= p.lowStockThreshold;
                  const isBoba =
                    p.nameEn?.toLowerCase().includes("popping boba") ||
                    p.nameEn?.toLowerCase().includes("popping") ||
                    p.nameEn?.toLowerCase().includes("boba") ||
                    p.nameTh?.toLowerCase().includes("popping boba") ||
                    p.nameTh?.toLowerCase().includes("เม็ดป็อป") ||
                    p.nameTh?.toLowerCase().includes("บ๊อบบ้า");

                  return (
                    <tr key={p.id} className={`${isLowStock ? "bg-red-50/30" : "hover:bg-gray-50/30"} transition-colors`}>
                      {/* ชื่อสินค้า */}
                      <td className="px-3 py-2 space-y-1">
                        <input
                          type="text"
                          value={p.nameTh}
                          onChange={(e) => handleGridStringChange(p.id, "nameTh", e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-gray-50/20 hover:bg-white focus:bg-white font-medium text-gray-800 transition-all"
                          placeholder="ชื่อภาษาไทย"
                        />
                        <input
                          type="text"
                          value={p.nameEn || ""}
                          onChange={(e) => handleGridStringChange(p.id, "nameEn", e.target.value)}
                          className="w-full px-2 py-0.5 border border-gray-200 rounded text-[10px] focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-gray-50/20 hover:bg-white focus:bg-white text-gray-500 transition-all"
                          placeholder="ชื่อภาษาอังกฤษ (English Name)"
                        />
                      </td>

                      {/* หน่วย */}
                      <td className="px-3 py-2 text-center">
                        {isBoba ? (
                          <select
                            value={
                              p.unit === "pcs" || p.unit === "ถุง"
                                ? "ถุง"
                                : p.unit === "box" || p.unit === "ลัง"
                                ? "ลัง"
                                : p.unit
                            }
                            onChange={(e) => handleGridStringChange(p.id, "unit", e.target.value)}
                            className="w-20 px-1 py-1 border border-gray-200 rounded text-xs text-center focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-gray-50/20 hover:bg-white focus:bg-white text-gray-700 transition-all cursor-pointer bg-white"
                          >
                            <option value="ถุง">ถุง (pcs)</option>
                            <option value="ลัง">ลัง (box)</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={p.unit}
                            onChange={(e) => handleGridStringChange(p.id, "unit", e.target.value)}
                            className="w-16 px-1 py-1 border border-gray-200 rounded text-xs text-center focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-gray-50/20 hover:bg-white focus:bg-white text-gray-700 transition-all"
                          />
                        )}
                      </td>

                      {/* ราคา/หน่วย */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-400">฿</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={p.pricePerUnit}
                            onChange={(e) => handleGridChange(p.id, "pricePerUnit", parseFloat(e.target.value) || 0)}
                            className="w-20 text-right px-2 py-1 border border-gray-200 rounded text-xs font-semibold focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-gray-50/20 hover:bg-white focus:bg-white text-gray-800 transition-all"
                          />
                        </div>
                      </td>

                      {/* สต็อกรวม */}
                      <td className="px-3 py-2">
                        {isBoba ? (
                          <div className="flex flex-col items-end px-2 py-1">
                            <span className={`text-xs font-bold ${isLowStock ? "text-red-600 animate-pulse" : "text-gray-800"}`}>
                              {formatCurrency(p.stockQuantity)} {p.unit}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium select-none">คำนวณจากตารางบน</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              value={p.stockQuantity}
                              onChange={(e) => handleGridChange(p.id, "stockQuantity", parseInt(e.target.value) || 0)}
                              className={`w-20 text-right px-2 py-1 border border-gray-200 rounded text-xs font-bold focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-gray-50/20 hover:bg-white focus:bg-white transition-all ${
                                isLowStock ? "text-red-600 border-red-200" : "text-gray-800"
                              }`}
                            />
                          </div>
                        )}
                      </td>

                      {/* จุดเตือน */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            value={p.lowStockThreshold}
                            onChange={(e) => handleGridChange(p.id, "lowStockThreshold", parseInt(e.target.value) || 0)}
                            className="w-20 text-right px-2 py-1 border border-gray-200 rounded text-xs focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none bg-gray-50/20 hover:bg-white focus:bg-white text-gray-600 transition-all"
                          />
                        </div>
                      </td>

                      {/* Tiers */}
                      <td className="px-3 py-2 text-center">
                        {p.tiers && p.tiers.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold transition-colors"
                          >
                            {p.tiers.length} ราคา
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="text-[10px] text-gray-400 hover:text-blue-600 hover:underline"
                          >
                            + เพิ่มราคา
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Floating Save Changes Bar ── */}
      {isAdmin && hasDirtyProducts && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
          <div className="bg-white/95 border border-amber-200 rounded-xl px-5 py-4 shadow-xl flex items-center gap-4 max-w-md backdrop-blur-sm shadow-amber-100/40">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-800">มีข้อมูลที่ยังไม่ได้บันทึก</span>
                <span className="text-[10px] text-amber-600">กรุณากดบันทึกเพื่ออัปเดตข้อมูล</span>
              </div>
            </div>
            <button
              onClick={saveStockGrid}
              disabled={savingStock}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-bold rounded-lg shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              {savingStock ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกข้อมูลทั้งหมด"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

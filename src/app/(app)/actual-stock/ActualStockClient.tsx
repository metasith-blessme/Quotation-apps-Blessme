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

export default function ActualStockClient({
  initialProducts,
  userRole,
}: {
  initialProducts: Product[];
  userRole: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [dirtyProducts, setDirtyProducts] = useState<Record<string, boolean>>({});
  const [savingStock, setSavingStock] = useState(false);
  const [stockSaveSuccess, setStockSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = userRole === "ADMIN";

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
    if (name.includes("barley")) return { name: "บาร์เลย์", code: "BL", colorClass: "text-gray-950 font-bold" };
    if (name.includes("oat")) return { name: "โอ๊ต", code: "OA", colorClass: "text-gray-955 font-bold" };
    if (name.includes("redbean")) return { name: "ถั่วแดง", code: "RB", colorClass: "text-red-600 font-bold" };
    if (name.includes("water chestnut") || name.includes("chestnut")) return { name: "แห้ว", code: "HW", colorClass: "text-gray-955 font-bold" };
    if (name.includes("osmanthus")) return { name: "หมื่นลี้", code: "ML", colorClass: "text-red-600 font-bold" };
    if (name.includes("cheese")) return { name: "ชีส", code: "CS", colorClass: "text-gray-955 font-bold" };
    return { name: p.nameTh, code: p.nameEn ?? "", colorClass: "text-gray-800 font-medium" };
  };

  const handleGridChange = (productId: string, field: keyof Product, value: number) => {
    if (!isAdmin) return;
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
    if (!isAdmin) return;
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

  // Sort boba first, then others alphabetically
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

  const sortedAllProducts = [...products]
    .filter((p) => p.isActive) // Only show active products in the stock list
    .sort((a, b) => {
      const indexA = getProductSortIndex(a);
      const indexB = getProductSortIndex(b);
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      return a.nameTh.localeCompare(b.nameTh, "th");
    });

  const hasDirtyProducts = Object.values(dirtyProducts).some((v) => v);

  return (
    <div className="space-y-6">
      {/* Stock Inventory Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="text-center w-full md:text-left md:w-auto">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">สต๊อกสินค้า Bless Me</h2>
            <p className="text-sm font-semibold text-gray-600 mt-1">
              วันที่ <span className="text-red-600 font-bold">{thaiDate.day}</span> เดือน <span className="text-red-600 font-bold">{thaiDate.month}</span> ปี <span className="text-red-600 font-bold">{thaiDate.year}</span>
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3 shrink-0">
              {hasDirtyProducts && (
                <span className="text-xs text-amber-600 font-medium animate-pulse">
                  ⚠️ มีข้อมูลสต็อกที่ยังไม่ได้บันทึก
                </span>
              )}
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
            </div>
          )}
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
                <th className="border border-gray-300 px-3 py-3 font-bold text-gray-700 text-center w-36 text-base bg-red-50/10">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 bg-white">
              {sortedAllProducts.map((p) => {
                const display = getBobaDisplay(p);
                const isLowStock = p.stockQuantity <= p.lowStockThreshold;
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      isLowStock ? "bg-red-50/20" : ""
                    }`}
                  >
                    {/* ชื่อ column */}
                    <td className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold min-w-[120px]">
                      <div className={`${display.colorClass} text-base`}>{display.name}</div>
                      {display.code && (
                        <div
                          className={`text-xs ${
                            display.colorClass.includes("text-red-600")
                              ? "text-red-600 font-bold"
                              : "text-gray-500"
                          }`}
                        >
                          {display.code}
                        </div>
                      )}
                    </td>

                    {/* แปะแล้ว column */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={p.pastedBoxes || ""}
                              placeholder="0"
                              onChange={(e) => handleGridChange(p.id, "pastedBoxes", parseInt(e.target.value) || 0)}
                              className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium"
                            />
                            <span className="text-xs text-gray-500 font-medium">ลัง</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={p.pastedBags || ""}
                              placeholder="0"
                              onChange={(e) => handleGridChange(p.id, "pastedBags", parseInt(e.target.value) || 0)}
                              className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium"
                            />
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

                    {/* แกะแล้ว column */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={p.unpackedBoxes || ""}
                              placeholder="0"
                              onChange={(e) => handleGridChange(p.id, "unpackedBoxes", parseInt(e.target.value) || 0)}
                              className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium"
                            />
                            <span className="text-xs text-gray-500 font-medium">ลัง</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={p.unpackedBags || ""}
                              placeholder="0"
                              onChange={(e) => handleGridChange(p.id, "unpackedBags", parseInt(e.target.value) || 0)}
                              className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium"
                            />
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

                    {/* ฉลากจีน column */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={p.chineseLabelBoxes || ""}
                            placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "chineseLabelBoxes", parseInt(e.target.value) || 0)}
                            className="w-14 text-right px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium"
                          />
                          <span className="text-xs text-gray-500 font-medium">ลัง</span>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-800">
                          {p.chineseLabelBoxes > 0 ? `${p.chineseLabelBoxes} ลัง` : <span className="text-gray-300">-</span>}
                        </div>
                      )}
                    </td>

                    {/* แพ็ค 1 ถุง column */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            min="0"
                            value={p.pack1 || ""}
                            placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "pack1", parseInt(e.target.value) || 0)}
                            className="w-14 text-center px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-800">
                          {p.pack1 > 0 ? p.pack1 : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* แพ็ค 2 ถุง column */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            min="0"
                            value={p.pack2 || ""}
                            placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "pack2", parseInt(e.target.value) || 0)}
                            className="w-14 text-center px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-800">
                          {p.pack2 > 0 ? p.pack2 : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* แพ็ค 3 ถุง column */}
                    <td className="border border-gray-300 p-2 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            min="0"
                            value={p.pack3 || ""}
                            placeholder="0"
                            onChange={(e) => handleGridChange(p.id, "pack3", parseInt(e.target.value) || 0)}
                            className="w-14 text-center px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:outline-none bg-transparent text-sm font-medium"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-800">
                          {p.pack3 > 0 ? p.pack3 : <span className="text-gray-300">-</span>}
                        </span>
                      )}
                    </td>

                    {/* รวม column */}
                    <td className="border border-gray-300 p-2 text-center bg-red-50/10">
                      {(() => {
                        const totalBoxes = p.pastedBoxes + p.unpackedBoxes + p.chineseLabelBoxes;
                        const totalBags = p.pastedBags + p.unpackedBags + p.pack1 * 1 + p.pack2 * 2 + p.pack3 * 3;
                        return (
                          <div className="text-center text-red-600 font-bold text-sm flex flex-col items-center justify-center min-h-[55px] leading-snug">
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
    </div>
  );
}

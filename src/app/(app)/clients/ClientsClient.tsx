"use client";

import { useState } from "react";

interface Client {
  id: string;
  name: string;
  address?: string | null;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  contactPerson?: string | null;
  isActive: boolean;
}

const emptyForm = {
  name: "", address: "", taxId: "", phone: "", email: "", contactPerson: "", isActive: true,
};

export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startEdit(c: Client) {
    setEditId(c.id);
    setForm({
      name: c.name,
      address: c.address ?? "",
      taxId: c.taxId ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      contactPerson: c.contactPerson ?? "",
      isActive: c.isActive,
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
  }

  async function save() {
    setLoading(true);
    setError("");
    const url = editId ? `/api/clients/${editId}` : "/api/clients";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) { setError("เกิดข้อผิดพลาด กรุณาลองใหม่"); return; }
    const saved = await res.json();

    if (editId) {
      setClients(clients.map((c) => (c.id === editId ? saved : c)));
    } else {
      setClients([...clients, saved].sort((a, b) => a.name.localeCompare(b.name, "th")));
    }
    cancelEdit();
  }

  async function toggleActive(c: Client) {
    const res = await fetch(`/api/clients/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, isActive: !c.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setClients(clients.map((x) => (x.id === c.id ? updated : x)));
    }
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">{editId ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อลูกค้า / บริษัท *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="บริษัท ตัวอย่าง จำกัด"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">ที่อยู่</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              placeholder="ที่อยู่ของลูกค้า"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">เลขประจำตัวผู้เสียภาษี</label>
            <input
              type="text"
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              placeholder="0000000000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ผู้ติดต่อ</label>
            <input
              type="text"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              placeholder="ชื่อผู้ติดต่อ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">เบอร์โทร</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0x-xxxx-xxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">อีเมล</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={loading || !form.name}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "กำลังบันทึก..." : editId ? "บันทึก" : "เพิ่มลูกค้า"}
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
        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="font-medium text-sm">ยังไม่มีลูกค้า</p>
            <p className="text-xs mt-1">เพิ่มลูกค้าด้านบนเพื่อเริ่มต้น</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อลูกค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เบอร์โทร</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ผู้ติดต่อ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${!c.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{c.name}</p>
                    {c.address && <p className="text-xs text-gray-400 truncate max-w-xs">{c.address}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.contactPerson ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => startEdit(c)} className="text-xs text-blue-600 hover:underline">
                        แก้ไข
                      </button>
                      <button onClick={() => toggleActive(c)} className="text-xs text-gray-500 hover:underline">
                        {c.isActive ? "ปิด" : "เปิด"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

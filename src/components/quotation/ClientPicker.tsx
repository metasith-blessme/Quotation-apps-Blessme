"use client";

import { useState, useEffect, useRef } from "react";

interface Client {
  id: string;
  name: string;
  address?: string | null;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  contactPerson?: string | null;
}

interface Props {
  onSelect: (client: Client) => void;
  onClose: () => void;
}

export default function ClientPicker({ onSelect, onClose }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); })
      .catch(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.contactPerson ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (c.phone ?? "").includes(query)
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">เลือกลูกค้า</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า, ผู้ติดต่อ, เบอร์โทร..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
            {loading && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">กำลังโหลด...</p>
            )}
            {!loading && filtered.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">ไม่พบลูกค้า</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onSelect(c); onClose(); }}
                className="w-full text-left px-5 py-3.5 hover:bg-green-50 transition-colors"
              >
                <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[c.contactPerson, c.phone].filter(Boolean).join(" · ") || c.address || "—"}
                </p>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 text-right">
            <a
              href="/clients"
              target="_blank"
              className="text-xs text-green-600 hover:underline"
            >
              + จัดการรายชื่อลูกค้า
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

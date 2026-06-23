import { useState } from "react";

export function useStatusToggle<T extends { id: string; status: string }>(
  initial: T[],
  getUrl: (id: string) => string,
  method: "PUT" | "PATCH" = "PUT"
) {
  const [list, setList] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, newStatus: string) {
    const old = list.find((item) => item.id === id);
    if (!old) return;
    const oldStatus = old.status;

    setList((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
    setError(null);

    try {
      const res = await fetch(getUrl(id), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        let msg = "เปลี่ยนสถานะไม่สำเร็จ";
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch {
          msg = (await res.text()) || msg;
        }
        throw new Error(msg);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setList((prev) => prev.map((item) => (item.id === id ? { ...item, status: oldStatus } : item)));
    }
  }

  return { list, updateStatus, error, clearError: () => setError(null) };
}

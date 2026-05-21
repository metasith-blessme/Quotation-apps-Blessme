"use client";

import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  loading: boolean;
  error: string;
}

export default function PDFPreviewModal({ isOpen, onClose, pdfBlob, loading, error }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
  }, [pdfBlob]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Content Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">👁️</span>
            <h3 className="font-bold text-gray-800 text-sm">พรีวิวเอกสาร PDF (ก่อนบันทึก)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-medium leading-none p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            &times;
          </button>
        </div>

        {/* PDF Area */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center relative">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-gray-600">กำลังประมวลผลและสร้างไฟล์ PDF...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center max-w-md">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm font-bold text-red-800 mt-2">เกิดข้อผิดพลาดในการพรีวิว</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-none"
              title="PDF Preview"
            />
          )}

          {!loading && !error && !pdfBlob && (
            <p className="text-xs text-gray-500">ไม่มีไฟล์พรีวิว</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

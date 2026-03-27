"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        <Link
          href="/quotations/new"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + ใบเสนอราคาใหม่
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}

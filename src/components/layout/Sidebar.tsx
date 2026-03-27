"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navItems = [
  {
    href: "/dashboard",
    label: "ใบเสนอราคา",
    icon: "📄",
    adminOnly: false,
  },
  {
    href: "/clients",
    label: "จัดการลูกค้า",
    icon: "👥",
    adminOnly: false,
  },
  {
    href: "/products",
    label: "จัดการสินค้า",
    icon: "📦",
    adminOnly: true,
  },
  {
    href: "/settings",
    label: "ตั้งค่าบริษัท",
    icon: "⚙️",
    adminOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BlessMe" className="object-contain w-full max-h-16" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-700 truncate">
          {session?.user?.name}
        </p>
        <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
      </div>
    </aside>
  );
}

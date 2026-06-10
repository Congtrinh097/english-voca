"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/", label: "Trang chu", icon: "🏠" },
  { href: "/my-list", label: "Danh sach hoc", icon: "📖" },
  { href: "/leaderboard", label: "Xep hang", icon: "🏆" },
  { href: "/profile", label: "Ho so", icon: "👤" },
];

export function Navbar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-20 hidden border-b border-gray-200 bg-white md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            🎓 English App
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname === n.href ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"}`}>
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                Admin
              </Link>
            )}
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Dang xuat
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200 bg-white md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${pathname === n.href ? "text-brand-600" : "text-gray-500"}`}>
            <span className="text-lg">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

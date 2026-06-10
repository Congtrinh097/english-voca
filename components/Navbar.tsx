"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/my-list", label: "Danh sách học", icon: "📖" },
  { href: "/leaderboard", label: "Xếp hạng", icon: "🏆" },
  { href: "/profile", label: "Hồ sơ", icon: "👤" },
];

export function Navbar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {/* Header desktop */}
      <header className="sticky top-0 z-20 hidden border-b border-white/60 bg-white/70 backdrop-blur-lg md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="group flex items-center gap-2 text-lg font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-base shadow-glow transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              🎓
            </span>
            <span className="text-gradient">English App</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "text-brand-700" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {n.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-gradient" />
                  )}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Quản trị
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      {/* Thanh tab dưới (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-white/60 bg-white/80 backdrop-blur-lg md:hidden">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                active ? "text-brand-600" : "text-gray-500"
              }`}
            >
              <span
                className={`text-lg transition-transform duration-300 ${
                  active ? "-translate-y-0.5 scale-110" : ""
                }`}
              >
                {n.icon}
              </span>
              {n.label}
              {active && (
                <span className="absolute top-0 h-1 w-8 rounded-full bg-brand-gradient" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

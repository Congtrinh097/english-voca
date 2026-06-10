import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-base shadow-glow">
              ⚙️
            </span>
            <span className="text-gradient">Trang quản trị</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/admin" className="rounded-lg px-3 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100">
              Tổng quan
            </Link>
            <Link href="/admin/topics" className="rounded-lg px-3 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100">
              Chủ đề
            </Link>
            <Link href="/" className="rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100">
              ← Về ứng dụng
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

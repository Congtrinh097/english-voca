import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-bold">⚙️ Admin Panel</Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/admin" className="rounded-lg px-3 py-2 font-medium text-gray-600 hover:bg-gray-100">Dashboard</Link>
            <Link href="/admin/topics" className="rounded-lg px-3 py-2 font-medium text-gray-600 hover:bg-gray-100">Chu de</Link>
            <Link href="/" className="rounded-lg px-3 py-2 font-medium text-gray-600 hover:bg-gray-100">← Ve app</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

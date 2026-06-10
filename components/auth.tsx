"use client";

/* ===== Khung dùng chung cho các trang xác thực ===== */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Khối nền mờ trang trí */}
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />
      <div className="relative w-full max-w-sm animate-scale-in rounded-3xl border border-white/60 bg-white/80 p-7 shadow-soft backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-gray-100"
    />
  );
}

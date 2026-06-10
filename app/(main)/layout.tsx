import { auth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Navbar isAdmin={session?.user?.role === "admin"} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

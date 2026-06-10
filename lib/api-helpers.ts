import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Chua dang nhap" }, { status: 401 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Chua dang nhap" }, { status: 401 }),
      session: null,
    };
  }
  if (session.user.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Khong co quyen" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

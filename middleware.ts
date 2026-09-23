import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
// Trang phap ly: public nhung KHONG redirect ve trang chu khi da dang nhap
const LEGAL_PATHS = ["/privacy", "/terms"];

function webmcpHeaders(response: NextResponse) {
  response.headers.set("Permissions-Policy", "tools=(self)");
  const token = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN;
  if (token) response.headers.set("Origin-Trial", token);
  return response;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;

  // API routes tu xu ly auth (tra 401/403 JSON thay vi redirect)
  if (nextUrl.pathname.startsWith("/api")) return webmcpHeaders(NextResponse.next());

  if (LEGAL_PATHS.some((p) => nextUrl.pathname.startsWith(p))) return webmcpHeaders(NextResponse.next());

  // Landing page public: chua dang nhap thi xem duoc, da dang nhap thi ve trang chu
  if (nextUrl.pathname === "/welcome") {
    return webmcpHeaders(isLoggedIn ? NextResponse.redirect(new URL("/", nextUrl)) : NextResponse.next());
  }

  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  // Chua dang nhap: trang chu → landing /welcome, trang khac → /login (giu callbackUrl)
  if (!isLoggedIn && nextUrl.pathname === "/") {
    return webmcpHeaders(NextResponse.redirect(new URL("/welcome", nextUrl)));
  }
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return webmcpHeaders(NextResponse.redirect(loginUrl));
  }

  // /admin/* chi cho role=admin
  if (nextUrl.pathname.startsWith("/admin") && req.auth?.user?.role !== "admin") {
    return webmcpHeaders(NextResponse.redirect(new URL("/", nextUrl)));
  }

  // Da dang nhap ma vao /login → ve trang chu
  if (isLoggedIn && PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p))) {
    return webmcpHeaders(NextResponse.redirect(new URL("/", nextUrl)));
  }

  return webmcpHeaders(NextResponse.next());
});

export const config = {
  // Loai tru static assets + duong dan PWA (sw.js, manifest, icon) khoi auth redirect
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|pwa-icon|apple-icon|icon|.*\\.(?:png|jpg|svg|webp|html)).*)",
  ],
};

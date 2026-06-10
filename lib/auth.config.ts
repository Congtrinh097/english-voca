import type { NextAuthConfig } from "next-auth";

/**
 * Cau hinh edge-safe (khong import Prisma) — dung chung cho middleware.
 * Providers day du duoc khai bao trong lib/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "learner";
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as "learner" | "admin";
      return session;
    },
    redirect({ url, baseUrl }) {
      // Chong open redirect: chi cho phep cung domain
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;

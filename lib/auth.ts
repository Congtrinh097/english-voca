import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Brute force: max 5 lan thu / 15 phut per email
        if (!checkRateLimit(`login:${email}`, 5, 15 * 60_000)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // User dang ky bang Google, chua dat mat khau
        if (user && !user.passwordHash) return null;
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = profile?.email;
      if (!email) return false;

      // Upsert user vao PostgreSQL (luong 8 buoc — muc 11.2 BA doc)
      const dbUser = await prisma.user.upsert({
        where: { email },
        update: {
          name: profile.name ?? undefined,
          avatarUrl: (profile.picture as string) ?? undefined,
          googleId: profile.sub,
          emailVerified: true,
          lastLoginAt: new Date(),
        },
        create: {
          email,
          name: profile.name ?? email.split("@")[0],
          avatarUrl: (profile.picture as string) ?? null,
          googleId: profile.sub,
          emailVerified: true,
          authProvider: "google",
          lastLoginAt: new Date(),
        },
      });

      // Gan id/role tu DB vao token (jwt callback nhan `user`)
      user.id = dbUser.id;
      user.role = dbUser.role;
      return true;
    },
  },
});

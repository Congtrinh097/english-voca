import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "learner" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "learner" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "learner" | "admin";
  }
}

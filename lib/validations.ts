import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(1, "Vui long nhap ho ten").max(100),
    email: z.string().email("Email khong hop le"),
    password: z.string().min(8, "Mat khau toi thieu 8 ky tu"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Mat khau toi thieu 8 ky tu"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

export const topicSchema = z.object({
  title: z.string().min(1).max(200),
  titleVi: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  level: z.enum(["beginner", "middle", "master"]),
  thumbnailUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const wordSchema = z.object({
  word: z.string().min(1).max(100),
  pronunciation: z.string().max(200).optional().nullable(),
  partOfSpeech: z.string().max(50).optional().nullable(),
  definition: z.string().min(1),
  example: z.string().min(1),
  meaningVi: z.string().min(1),
  audioUrl: z.string().url().optional().nullable().or(z.literal("")),
  orderIndex: z.number().int().min(0).optional(),
});

export const quizSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        wordId: z.string().uuid(),
        selected: z.string(),
      })
    )
    .min(1)
    .max(10),
});

/** glory_reward tu dong theo level (muc 3.4 BA doc) */
export const GLORY_BY_LEVEL = {
  beginner: 10,
  middle: 15,
  master: 20,
} as const;

export const PASS_THRESHOLD = 80; // %
export const QUIZ_SIZE = 10;

/** Thuong Glory khi xem het flashcard cua mot chu de (1 lan/chu de) */
export const FLASHCARD_COMPLETE_BONUS = 5;

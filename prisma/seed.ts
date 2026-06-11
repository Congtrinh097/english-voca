import { PrismaClient, Level } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedTopics } from "./seed-data";

const prisma = new PrismaClient();

const GLORY: Record<Level, number> = { beginner: 10, middle: 15, master: 20 };

async function main() {
  // ===== 1. XÓA TOÀN BỘ DỮ LIỆU CŨ (theo thứ tự khóa ngoại) =====
  await prisma.quizResult.deleteMany();
  await prisma.userTopic.deleteMany();
  await prisma.word.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("Đã xóa toàn bộ dữ liệu cũ.");

  // ===== 2. TẠO ADMIN — ĐỔI MẬT KHẨU SAU KHI ĐĂNG NHẬP LẦN ĐẦU =====
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash: await bcrypt.hash("admin12345", 12),
      emailVerified: true,
      role: "admin",
    },
  });

  // ===== 3. NẠP CHỦ ĐỀ + TỪ VỰNG TỪ FILE prisma/seed-data.ts =====
  for (const t of seedTopics) {
    await prisma.topic.create({
      data: {
        title: t.title,
        titleVi: t.titleVi,
        description: t.description,
        level: t.level,
        gloryReward: GLORY[t.level],
        isPublished: true,
        createdBy: admin.id,
        words: {
          create: t.words.map(([word, ipa, pos, def, ex, vi], i) => ({
            word,
            pronunciation: ipa,
            partOfSpeech: pos,
            definition: def,
            example: ex,
            meaningVi: vi,
            orderIndex: i,
          })),
        },
      },
    });
  }

  const wordCount = seedTopics.reduce((s, t) => s + t.words.length, 0);
  console.log(
    `Seed xong: admin@example.com / admin12345 + ${seedTopics.length} chủ đề × 12 từ (${wordCount} từ).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

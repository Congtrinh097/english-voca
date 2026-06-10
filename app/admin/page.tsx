import { prisma } from "@/lib/prisma";
import { LevelBadge } from "@/components/ui/badges";

export const dynamic = "force-dynamic";

/** S12 — Tổng quan quản trị (mục 8.3 BA doc) */
export default async function AdminDashboard() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000);

  const [totalUsers, activeUsers, totalTopics, totalWords, topTopics, avgPass] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
      prisma.topic.count(),
      prisma.word.count(),
      prisma.topic.findMany({
        orderBy: { userTopics: { _count: "desc" } },
        take: 5,
        include: { _count: { select: { userTopics: true } } },
      }),
      prisma.quizResult.aggregate({ _avg: { percentage: true } }),
    ]);

  const stats = [
    { label: "Tổng người dùng", value: totalUsers, icon: "👥" },
    { label: "Hoạt động 7 ngày", value: activeUsers, icon: "🟢" },
    { label: "Tổng chủ đề", value: totalTopics, icon: "📚" },
    { label: "Tổng từ vựng", value: totalWords, icon: "📝" },
    { label: "Tỉ lệ đạt TB", value: `${Number(avgPass._avg.percentage ?? 0).toFixed(1)}%`, icon: "🎯" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Tổng quan</h1>

      <div className="stagger grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="lift rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
            <div className="text-xl">{s.icon}</div>
            <p className="mt-1 text-2xl font-extrabold">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Top 5 chủ đề được học nhiều nhất</h2>
      <div className="animate-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Chủ đề</th>
              <th className="px-4 py-3 font-semibold">Cấp độ</th>
              <th className="px-4 py-3 text-right font-semibold">Lượt học</th>
            </tr>
          </thead>
          <tbody>
            {topTopics.map((t) => (
              <tr key={t.id} className="border-t border-gray-50 transition-colors hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{t.title}</td>
                <td className="px-4 py-3"><LevelBadge level={t.level} /></td>
                <td className="px-4 py-3 text-right font-bold text-brand-600">{t._count.userTopics}</td>
              </tr>
            ))}
            {topTopics.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Chưa có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

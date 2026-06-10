import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** S12 — Admin Dashboard (muc 8.3 BA doc) */
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
    { label: "Tong nguoi dung", value: totalUsers },
    { label: "Hoat dong 7 ngay", value: activeUsers },
    { label: "Tong chu de", value: totalTopics },
    { label: "Tong tu vung", value: totalWords },
    { label: "Ti le pass TB", value: `${Number(avgPass._avg.percentage ?? 0).toFixed(1)}%` },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Top 5 chu de duoc hoc nhieu nhat</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Chu de</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2 text-right">Luot hoc</th>
            </tr>
          </thead>
          <tbody>
            {topTopics.map((t) => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium">{t.title}</td>
                <td className="px-4 py-2">{t.level}</td>
                <td className="px-4 py-2 text-right">{t._count.userTopics}</td>
              </tr>
            ))}
            {topTopics.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Chua co du lieu</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

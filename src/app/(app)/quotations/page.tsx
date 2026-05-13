import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import DashboardClient from "@/app/(app)/dashboard/DashboardClient";

export default async function QuotationsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const whereOwn = isAdmin ? {} : { createdById: session!.user.id };

  const [statusCounts, quotations] = await Promise.all([
    prisma.quotation.groupBy({
      by: ["status"],
      where: whereOwn,
      _count: true,
    }),
    prisma.quotation.findMany({
      where: whereOwn,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const counts = {
    total: statusCounts.reduce((sum, item) => sum + item._count, 0),
    draft: statusCounts.find((item) => item.status === "DRAFT")?._count ?? 0,
    sent: statusCounts.find((item) => item.status === "SENT")?._count ?? 0,
    accepted: statusCounts.find((item) => item.status === "ACCEPTED")?._count ?? 0,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ใบเสนอราคาทั้งหมด</h2>
        <Link
          href="/quotations/new"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + สร้างใบเสนอราคา
        </Link>
      </div>
      <DashboardClient quotations={JSON.parse(JSON.stringify(quotations))} counts={counts} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BillingsClient from "./BillingsClient";

export default async function BillingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const whereOwn = isAdmin ? {} : { createdById: session!.user.id };

  const [statusCounts, billings] = await Promise.all([
    prisma.billing.groupBy({
      by: ["status"],
      where: whereOwn,
      _count: true,
    }),
    prisma.billing.findMany({
      where: whereOwn,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const counts = {
    total: statusCounts.reduce((sum, item) => sum + item._count, 0),
    pending: statusCounts.find((item) => item.status === "PENDING")?._count ?? 0,
    collected: statusCounts.find((item) => item.status === "COLLECTED")?._count ?? 0,
    cancelled: statusCounts.find((item) => item.status === "CANCELLED")?._count ?? 0,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ใบวางบิลทั้งหมด / Billing Notes</h2>
      </div>
      <BillingsClient billings={JSON.parse(JSON.stringify(billings))} counts={counts} />
    </div>
  );
}

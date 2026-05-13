import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReceiptsClient from "./ReceiptsClient";

export default async function ReceiptsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const whereOwn = !isAdmin ? { createdById: session?.user?.id } : {};

  const [statusCounts, receipts] = await Promise.all([
    prisma.receipt.groupBy({
      by: ["status"],
      where: whereOwn,
      _count: true,
    }),
    prisma.receipt.findMany({
      where: whereOwn,
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const counts = {
    total: statusCounts.reduce((sum, item) => sum + item._count, 0),
    waiting: statusCounts.find((item) => item.status === "WAITING")?._count ?? 0,
    issued: statusCounts.find((item) => item.status === "ISSUED")?._count ?? 0,
    cancelled: statusCounts.find((item) => item.status === "CANCELLED")?._count ?? 0,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ใบเสร็จรับเงิน / Receipts</h1>
          <p className="text-sm text-gray-500">จัดการใบเสร็จรับเงินและประวัติการรับชำระ</p>
        </div>
      </div>

      <ReceiptsClient
        receipts={JSON.parse(JSON.stringify(receipts))}
        counts={counts}
      />
    </div>
  );
}

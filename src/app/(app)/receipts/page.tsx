import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReceiptsClient from "./ReceiptsClient";

export default async function ReceiptsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const receipts = await prisma.receipt.findMany({
    where: !isAdmin ? { createdById: session?.user?.id } : {},
    include: {
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    total: await prisma.receipt.count({
      where: !isAdmin ? { createdById: session?.user?.id } : {},
    }),
    completed: await prisma.receipt.count({
      where: {
        status: "COMPLETED",
        ...(!isAdmin ? { createdById: session?.user?.id } : {}),
      },
    }),
    cancelled: await prisma.receipt.count({
      where: {
        status: "CANCELLED",
        ...(!isAdmin ? { createdById: session?.user?.id } : {}),
      },
    }),
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

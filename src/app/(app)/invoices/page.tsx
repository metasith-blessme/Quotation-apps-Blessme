import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const whereOwn = isAdmin ? {} : { createdById: session!.user.id };

  const [statusCounts, invoices] = await Promise.all([
    prisma.invoice.groupBy({
      by: ["status"],
      where: whereOwn,
      _count: true,
    }),
    prisma.invoice.findMany({
      where: whereOwn,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const counts = {
    total: statusCounts.reduce((sum, item) => sum + item._count, 0),
    unpaid: statusCounts.find((item) => item.status === "UNPAID")?._count ?? 0,
    paid: statusCounts.find((item) => item.status === "PAID")?._count ?? 0,
    cancelled: statusCounts.find((item) => item.status === "CANCELLED")?._count ?? 0,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ใบแจ้งหนี้ทั้งหมด</h2>
      </div>
      <InvoicesClient invoices={JSON.parse(JSON.stringify(invoices))} counts={counts} />
    </div>
  );
}

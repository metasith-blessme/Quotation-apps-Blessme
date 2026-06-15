import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DeliveriesClient from "./DeliveriesClient";

export default async function DeliveriesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const whereOwn = isAdmin
    ? { status: { in: ["UNPAID", "PAID", "OVERDUE"] } }
    : { createdById: session!.user.id, status: { in: ["UNPAID", "PAID", "OVERDUE"] } };

  const [deliveryCounts, invoices] = await Promise.all([
    prisma.invoice.groupBy({
      by: ["deliveryStatus"],
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
    total: invoices.length,
    pending: deliveryCounts.find((item) => item.deliveryStatus === "PENDING")?._count ?? 0,
    delivered: deliveryCounts.find((item) => item.deliveryStatus === "DELIVERED")?._count ?? 0,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">การจัดส่งสินค้า / Deliveries</h2>
      </div>
      <DeliveriesClient 
        invoices={JSON.parse(JSON.stringify(invoices))} 
        counts={counts} 
        role={session?.user?.role} 
        currentUserId={session?.user?.id} 
      />
    </div>
  );
}

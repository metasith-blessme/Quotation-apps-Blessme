import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BillingsClient from "./BillingsClient";

export default async function BillingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const billings = await prisma.billing.findMany({
    where: isAdmin ? {} : { createdById: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  const counts = {
    total: billings.length,
    pending: billings.filter((b) => b.status === "PENDING").length,
    collected: billings.filter((b) => b.status === "COLLECTED").length,
    cancelled: billings.filter((b) => b.status === "CANCELLED").length,
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

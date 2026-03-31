import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const invoices = await prisma.invoice.findMany({
    where: isAdmin ? {} : { createdById: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  const counts = {
    total: invoices.length,
    unpaid: invoices.filter((i) => i.status === "UNPAID").length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    cancelled: invoices.filter((i) => i.status === "CANCELLED").length,
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

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import DashboardClient from "@/app/(app)/dashboard/DashboardClient";

export default async function QuotationsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const quotations = await prisma.quotation.findMany({
    where: isAdmin ? {} : { createdById: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  const counts = {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === "DRAFT").length,
    sent: quotations.filter((q) => q.status === "SENT").length,
    accepted: quotations.filter((q) => q.status === "ACCEPTED").length,
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

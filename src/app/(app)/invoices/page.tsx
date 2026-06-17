import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const whereOwn = isAdmin ? {} : { createdById: session!.user.id };

  const invoices = await prisma.invoice.findMany({
    where: whereOwn,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ใบแจ้งหนี้ทั้งหมด</h2>
      </div>
      <InvoicesClient
        key={invoices.map((item) => item.id + item.updatedAt).join("-")}
        invoices={JSON.parse(JSON.stringify(invoices))}
      />
    </div>
  );
}

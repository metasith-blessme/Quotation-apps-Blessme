import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BillingsClient from "./BillingsClient";

export default async function BillingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const whereOwn = isAdmin ? {} : { createdById: session!.user.id };

  const billings = await prisma.billing.findMany({
    where: whereOwn,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ใบวางบิลทั้งหมด / Billing Notes</h2>
      </div>
      <BillingsClient
        key={billings.map((item) => item.id + item.updatedAt).join("-")}
        billings={JSON.parse(JSON.stringify(billings))}
      />
    </div>
  );
}

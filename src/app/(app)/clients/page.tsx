import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ClientsClient from "./ClientsClient";

export default async function ClientsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">จัดการลูกค้า</h2>
      <ClientsClient initialClients={clients} />
    </div>
  );
}

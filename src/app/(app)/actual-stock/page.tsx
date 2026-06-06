import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ActualStockClient from "./ActualStockClient";

export default async function ActualStockPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const products = await prisma.product.findMany({ orderBy: { nameTh: "asc" } });

  return (
    <div className="max-w-5xl mx-auto p-4">
      <ActualStockClient initialProducts={products} userRole={session.user.role} />
    </div>
  );
}

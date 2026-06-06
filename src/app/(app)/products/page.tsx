import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Allow both ADMIN and SALES to view the stock grid
  const products = await prisma.product.findMany({
    orderBy: { nameTh: "asc" },
    include: { tiers: { orderBy: { minQty: "asc" } } },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <ProductsClient initialProducts={products} userRole={session.user.role} />
    </div>
  );
}

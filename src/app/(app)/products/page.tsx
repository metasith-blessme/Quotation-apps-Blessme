import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const products = await prisma.product.findMany({ orderBy: { nameTh: "asc" } });

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">จัดการสินค้า</h2>
      <ProductsClient initialProducts={products} />
    </div>
  );
}

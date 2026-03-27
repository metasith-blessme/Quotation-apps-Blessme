import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import QuotationForm from "@/components/quotation/QuotationForm";
import { formatDateInput } from "@/lib/utils/format";

type Params = { params: Promise<{ id: string }> };

export default async function EditQuotationPage({ params }: Params) {
  const session = await auth();
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quotation) notFound();

  const isAdmin = session?.user?.role === "ADMIN";
  if (!isAdmin && quotation.createdById !== session?.user?.id) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        แก้ไขใบเสนอราคา {quotation.qtNumber}
      </h2>
      <QuotationForm
        mode="edit"
        quotationId={id}
        defaultValues={{
          customerName: quotation.customerName,
          customerAddress: quotation.customerAddress ?? "",
          customerTaxId: quotation.customerTaxId ?? "",
          customerPhone: quotation.customerPhone ?? "",
          customerEmail: quotation.customerEmail ?? "",
          customerContact: quotation.customerContact ?? "",
          issueDate: formatDateInput(quotation.issueDate),
          validUntil: formatDateInput(quotation.validUntil),
          vatRate: quotation.vatRate,
          notes: quotation.notes ?? "",
          termsSnapshot: quotation.termsSnapshot ?? "",
          items: quotation.items.map((item) => ({
            productId: item.productId ?? undefined,
            productNameTh: item.productNameTh,
            productNameEn: item.productNameEn ?? "",
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            sortOrder: item.sortOrder,
          })),
        }}
      />
    </div>
  );
}

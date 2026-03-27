import { prisma } from "@/lib/db";
import QuotationForm from "@/components/quotation/QuotationForm";

export default async function NewQuotationPage() {
  const company = await prisma.company.findFirst();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">สร้างใบเสนอราคาใหม่</h2>
      <QuotationForm
        mode="create"
        defaultTerms={company?.termsText ?? ""}
      />
    </div>
  );
}

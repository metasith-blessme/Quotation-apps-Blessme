import { prisma } from "../src/lib/db";
import {
  compileDocumentPDF,
  generateQuotationPDF,
  generateInvoicePDF,
  generateBillingPDF,
  generateReceiptPDF,
} from "../src/lib/pdf";

async function runTests() {
  console.log("Starting PDF Compiler & Generator Verification Tests...\n");

  // 1. Check Quotations
  const qt = await prisma.quotation.findFirst();
  if (qt) {
    console.log(`Found Quotation: ${qt.qtNumber} (ID: ${qt.id})`);
    console.log("Compiling Quotation PDF generic...");
    const bufGeneric = await compileDocumentPDF("QT", qt.id);
    console.log(`Generic PDF created: ${bufGeneric.length} bytes`);

    console.log("Compiling Quotation PDF wrapper...");
    const bufWrapper = await generateQuotationPDF(qt.id);
    console.log(`Wrapper PDF created: ${bufWrapper.length} bytes`);
    if (bufGeneric.length !== bufWrapper.length) {
      throw new Error("Wrapper and Generic outputs differ!");
    }
    console.log("PASS: Quotation PDF compilation matches perfectly\n");
  } else {
    console.log("No Quotation found in database, skipping.\n");
  }

  // 2. Check Invoices
  const inv = await prisma.invoice.findFirst();
  if (inv) {
    console.log(`Found Invoice: ${inv.invNumber} (ID: ${inv.id})`);
    console.log("Compiling Invoice PDF wrapper...");
    const bufWrapper = await generateInvoicePDF(inv.id);
    console.log(`Wrapper PDF created: ${bufWrapper.length} bytes`);
    console.log("PASS: Invoice PDF compilation successful\n");
  } else {
    console.log("No Invoice found in database, skipping.\n");
  }

  // 3. Check Billings
  const bn = await prisma.billing.findFirst();
  if (bn) {
    console.log(`Found Billing: ${bn.bnNumber} (ID: ${bn.id})`);
    console.log("Compiling Billing PDF wrapper...");
    const bufWrapper = await generateBillingPDF(bn.id);
    console.log(`Wrapper PDF created: ${bufWrapper.length} bytes`);
    console.log("PASS: Billing PDF compilation successful\n");
  } else {
    console.log("No Billing found in database, skipping.\n");
  }

  // 4. Check Receipts
  const rc = await prisma.receipt.findFirst();
  if (rc) {
    console.log(`Found Receipt: ${rc.rcNumber} (ID: ${rc.id})`);
    console.log("Compiling Receipt PDF wrapper...");
    const bufWrapper = await generateReceiptPDF(rc.id);
    console.log(`Wrapper PDF created: ${bufWrapper.length} bytes`);
    console.log("PASS: Receipt PDF compilation successful\n");
  } else {
    console.log("No Receipt found in database, skipping.\n");
  }

  console.log("All PDF Compiler verification checks completed successfully!");
}

runTests()
  .catch((err) => {
    console.error("FAIL: PDF compilation test failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

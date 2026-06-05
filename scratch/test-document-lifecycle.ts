import { prisma } from "../src/lib/db";
import {
  convertQuotationToInvoice,
  convertInvoiceToBilling,
  convertInvoiceToReceipt,
  convertBillingToReceipt,
} from "../src/lib/document-lifecycle";

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}. Expected ${expected}, but got ${actual}`);
  }
  console.log(`PASS: ${message}`);
}

async function runTests() {
  console.log("Starting Document Lifecycle & Conversion Controller Unit Tests...\n");

  // Find a seeded user
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error("No users found in database to run tests. Seed the database first!");
  }
  const userId = user.id;

  // 1. Create a transient Quotation for testing
  console.log("Creating test Quotation...");
  const quotation = await prisma.quotation.create({
    data: {
      qtNumber: `TEST-QT-${Date.now()}`,
      createdById: userId,
      customerName: "Test Corporation Co., Ltd.",
      customerAddress: "123 Bangkok Road, Thailand",
      customerTaxId: "0105560000123",
      customerPhone: "081-234-5678",
      customerEmail: "corp@test.com",
      customerContact: "Mr. Test Manager",
      issueDate: new Date(),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      vatRate: 7,
      subtotal: 1000,
      vatAmount: 70,
      grandTotal: 1070,
      items: {
        create: [
          {
            productNameTh: "Popping Boba Cheese",
            unit: "ถัง",
            quantity: 10,
            unitPrice: 100,
            lineTotal: 1000,
            sortOrder: 0,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log(`Test Quotation created successfully with ID: ${quotation.id}`);

  // Test Case 1: Convert Quotation -> Invoice
  console.log("\nTesting Quotation to Invoice conversion...");
  const res1 = await convertQuotationToInvoice(quotation.id, userId, true);
  if (!res1.success) {
    throw new Error(`Quotation to Invoice conversion failed: ${res1.message}`);
  }
  const invoice = res1.data;
  assertEqual(res1.alreadyExisted, false, "Invoice newly created");
  assertEqual(invoice.customerName, quotation.customerName, "Customer details carried over");
  assertEqual(invoice.grandTotal, 1070, "Totals correctly calculated and rounded");
  assertEqual(invoice.quotationId, quotation.id, "Correctly linked quotationId");
  assertEqual(invoice.quotationNumber, quotation.qtNumber, "Correctly snapshot quotation number");

  // Fetch created invoice items
  const invItems = await prisma.invoiceItem.findMany({
    where: { invoiceId: invoice.id },
  });
  assertEqual(invItems.length, 1, "Mapped line items correctly");
  assertEqual(invItems[0].productNameTh, "Popping Boba Cheese", "Line item attributes carried forward");

  // Test Case 2: Double-conversion guard
  console.log("\nTesting double-conversion guard...");
  const res2 = await convertQuotationToInvoice(quotation.id, userId, true);
  if (!res2.success) {
    throw new Error(`Double-conversion check failed: ${res2.message}`);
  }
  assertEqual(res2.alreadyExisted, true, "Correctly detected existing conversion");
  assertEqual(res2.data.id, invoice.id, "Returned the pre-existing Invoice record ID");

  // Test Case 3: Convert Invoice -> Billing Note
  console.log("\nTesting Invoice to Billing Note conversion...");
  const res3 = await convertInvoiceToBilling(invoice.id, userId, true);
  if (!res3.success) {
    throw new Error(`Invoice to Billing Note conversion failed: ${res3.message}`);
  }
  const billing = res3.data;
  assertEqual(res3.alreadyExisted, false, "Billing Note newly created");
  assertEqual(billing.invoiceId, invoice.id, "Linked invoiceId correctly");
  assertEqual(billing.invoiceNumber, invoice.invNumber, "Snapshot invoiceNumber correctly");

  // Test Case 4: Convert Billing Note -> Receipt
  console.log("\nTesting Billing Note to Receipt conversion...");
  const res4 = await convertBillingToReceipt(billing.id, userId, true);
  if (!res4.success) {
    throw new Error(`Billing Note to Receipt conversion failed: ${res4.message}`);
  }
  const receiptFromBilling = res4.data;
  assertEqual(res4.alreadyExisted, false, "Receipt newly created");
  assertEqual(receiptFromBilling.billingId, billing.id, "Linked billingId correctly");
  assertEqual(receiptFromBilling.invoiceId, invoice.id, "Linked invoiceId correctly through billing");

  // Test Case 5: Direct Invoice to Receipt conversion with cross-path guard
  console.log("\nTesting Cross-Path Guard: Direct Invoice to Receipt Conversion...");
  const res5 = await convertInvoiceToReceipt(invoice.id, userId, true);
  if (!res5.success) {
    throw new Error(`Invoice to Receipt conversion check failed: ${res5.message}`);
  }
  assertEqual(res5.alreadyExisted, true, "Correctly blocks duplicate receipt creation because invoice already has a receipt");
  assertEqual(res5.data.id, receiptFromBilling.id, "Returned pre-existing receipt generated via Billing Note path");

  // Test Case 6: Direct Invoice to Receipt on a FRESH Invoice
  console.log("\nTesting Direct Invoice to Receipt conversion on a fresh invoice...");
  const freshInvoice = await prisma.invoice.create({
    data: {
      invNumber: `TEST-INV-${Date.now()}`,
      createdById: userId,
      customerName: "Fresh Corp",
      issueDate: new Date(),
      subtotal: 500,
      vatRate: 7,
      vatAmount: 35,
      grandTotal: 535,
      items: {
        create: [
          {
            productNameTh: "Fresh Item",
            unit: "ถัง",
            quantity: 5,
            unitPrice: 100,
            lineTotal: 500,
          },
        ],
      },
    },
  });

  const res6 = await convertInvoiceToReceipt(freshInvoice.id, userId, true);
  if (!res6.success) {
    throw new Error(`Direct Invoice to Receipt conversion failed: ${res6.message}`);
  }
  const receiptFromFreshInvoice = res6.data;
  assertEqual(res6.alreadyExisted, false, "Receipt newly created from fresh invoice");
  assertEqual(receiptFromFreshInvoice.invoiceId, freshInvoice.id, "Linked fresh invoiceId correctly");

  // Clean up test documents in database (cascade deletes will automatically delete items!)
  console.log("\nCleaning up test documents from database...");
  await prisma.receipt.deleteMany({
    where: { id: { in: [receiptFromBilling.id, receiptFromFreshInvoice.id] } },
  });
  await prisma.billing.deleteMany({ where: { id: billing.id } });
  await prisma.invoice.deleteMany({ where: { id: { in: [invoice.id, freshInvoice.id] } } });
  await prisma.quotation.deleteMany({ where: { id: quotation.id } });
  console.log("Cleanup completed.");

  console.log("\nAll Document Lifecycle tests passed successfully!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});

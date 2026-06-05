import { quotationSchema } from "../src/lib/validations/quotation.schema";
import { invoiceSchema } from "../src/lib/validations/invoice.schema";
import { billingSchema } from "../src/lib/validations/billing.schema";
import { receiptSchema } from "../src/lib/validations/receipt.schema";

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}. Expected ${expected}, but got ${actual}`);
  }
  console.log(`PASS: ${message}`);
}

function runTests() {
  console.log("Starting Zod Shared Schemas Verification Tests...\n");

  // 1. Valid Quotation Payload
  const validQuotation = {
    customerName: "BlessMe Topping Co., Ltd.",
    customerAddress: "123 Boba Street, Bangkok",
    customerTaxId: "0123456789012",
    customerPhone: "02-123-4567",
    customerEmail: "info@blessme.com",
    customerContact: "Khun Parn",
    issueDate: "2026-05-21",
    validUntil: "2026-06-21",
    deliveryDate: "2026-05-25",
    vatRate: 7,
    notes: "Please deliver on time",
    termsSnapshot: "Standard terms and conditions apply.",
    items: [
      {
        productId: "poba-cheese",
        productNameTh: "Popping Boba Cheese",
        productNameEn: "Popping Boba Cheese",
        unit: "ถัง",
        quantity: 5,
        unitPrice: 145,
        sortOrder: 0,
      },
    ],
  };

  const parsedQT = quotationSchema.safeParse(validQuotation);
  assertEqual(parsedQT.success, true, "Valid quotation validates successfully");
  if (parsedQT.success) {
    assertEqual(parsedQT.data.items[0].productNameTh, "Popping Boba Cheese", "Quotation item properties parsed correctly");
  }

  // 2. Invalid Quotation Payload (Missing customerName, negative quantity, invalid email)
  const invalidQuotation = {
    customerName: "", // Min 1 required
    customerEmail: "invalid-email-format",
    issueDate: "2026-05-21",
    validUntil: "2026-06-21",
    items: [
      {
        productNameTh: "", // Min 1 required
        unit: "ถัง",
        quantity: -10, // Must be positive (> 0)
        unitPrice: -50, // Must be min 0
      },
    ],
  };

  const parsedInvalidQT = quotationSchema.safeParse(invalidQuotation);
  assertEqual(parsedInvalidQT.success, false, "Invalid quotation is correctly rejected");
  if (!parsedInvalidQT.success) {
    const errorMap = parsedInvalidQT.error.flatten().fieldErrors;
    assertEqual(!!errorMap.customerName, true, "Rejects empty customerName");
    assertEqual(!!errorMap.customerEmail, true, "Rejects invalid email format");
    const itemErrors = parsedInvalidQT.error.issues.filter((e: any) => e.path[0] === "items");
    console.log(`Found ${itemErrors.length} validation errors on items`);
    assertEqual(itemErrors.length >= 3, true, "Catches item productNameTh, quantity, and unitPrice errors");
  }

  // 3. Test Invoices, Billings, and Receipts schemas on basic validation
  const parsedINV = invoiceSchema.safeParse(validQuotation);
  assertEqual(parsedINV.success, true, "Valid quotation data matches invoiceSchema structure perfectly");

  const parsedBN = billingSchema.safeParse({
    ...validQuotation,
    dueDate: "2026-06-05"
  });
  assertEqual(parsedBN.success, true, "Valid billing data matches billingSchema structure perfectly");

  const parsedRC = receiptSchema.safeParse(validQuotation);
  assertEqual(parsedRC.success, true, "Valid receipt data matches receiptSchema structure perfectly");

  console.log("\nAll Zod shared schema verification tests passed successfully!");
}

runTests();

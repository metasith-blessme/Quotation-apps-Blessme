import { calculateTotals } from "../src/lib/financial-calculator";

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}. Expected ${expected}, but got ${actual}`);
  }
  console.log(`PASS: ${message}`);
}

console.log("Starting Financial Calculator Unit Tests...\n");

// Test Case 1: Simple integers and standard 7% VAT
const result1 = calculateTotals(
  [
    {
      productId: "1",
      productNameTh: "Popping Boba Cheese",
      unit: "ถัง",
      quantity: 2,
      unitPrice: 100,
    },
  ],
  7
);

assertEqual(result1.items[0].lineTotal, 200, "Line item total correct");
assertEqual(result1.subtotal, 200, "Subtotal correct");
assertEqual(result1.vatAmount, 14, "7% VAT correct");
assertEqual(result1.grandTotal, 214, "Grand total correct");
assertEqual(result1.items[0].sortOrder, 0, "Auto-assign sortOrder starting at 0");

// Test Case 2: IEEE-754 floating point rounding checks (0.1 + 0.2 style)
const result2 = calculateTotals(
  [
    {
      productId: "1",
      productNameTh: "Item 1",
      unit: "ชิ้น",
      quantity: 10.15,
      unitPrice: 1.25, // 12.6875 -> should round to 12.69
    },
    {
      productId: "2",
      productNameTh: "Item 2",
      unit: "ชิ้น",
      quantity: 1.5,
      unitPrice: 3.33, // 4.995 -> should round to 5.00
    },
  ],
  7
);

assertEqual(result2.items[0].lineTotal, 12.69, "Line item 1 rounded up correctly (12.6875 -> 12.69)");
assertEqual(result2.items[1].lineTotal, 5.00, "Line item 2 rounded up correctly (4.995 -> 5.00)");
assertEqual(result2.subtotal, 17.69, "Subtotal aggregated correctly (12.69 + 5.00 = 17.69)");
assertEqual(result2.vatAmount, 1.24, "VAT 7% rounded correctly (17.69 * 0.07 = 1.2383 -> 1.24)");
assertEqual(result2.grandTotal, 18.93, "Grand total rounded correctly (17.69 + 1.24 = 18.93)");

console.log("\nAll unit tests passed successfully!");

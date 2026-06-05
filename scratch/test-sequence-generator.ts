import {
  generateQTNumber,
  generateINVNumber,
  generateBNNumber,
  generateRCNumber,
  generateSequenceNumber,
} from "../src/lib/sequence-generator";

function assertPattern(str: string, regex: RegExp, message: string) {
  if (!regex.test(str)) {
    throw new Error(`FAIL: ${message}. Got "${str}", which does not match pattern ${regex}`);
  }
  console.log(`PASS: ${message} (Got "${str}")`);
}

async function runTests() {
  console.log("Starting Sequence Generator Unit Tests...\n");

  const year = new Date().getFullYear();

  // Test Case 1: Quotation (QT -> BLT) prefix and format
  const qt = await generateQTNumber();
  assertPattern(qt, new RegExp(`^BLT-${year}-\\d{3}$`), "Quotation number matches BLT-YYYY-XXX format");

  // Test Case 2: Invoice (INV -> INV) prefix and format
  const inv = await generateINVNumber();
  assertPattern(inv, new RegExp(`^INV-${year}-\\d{3}$`), "Invoice number matches INV-YYYY-XXX format");

  // Test Case 3: Billing Note (BN -> BN) prefix and format
  const bn = await generateBNNumber();
  assertPattern(bn, new RegExp(`^BN-${year}-\\d{3}$`), "Billing Note number matches BN-YYYY-XXX format");

  // Test Case 4: Receipt (RC -> RC) prefix and format
  const rc = await generateRCNumber();
  assertPattern(rc, new RegExp(`^RC-${year}-\\d{3}$`), "Receipt number matches RC-YYYY-XXX format");

  // Test Case 5: Verification of sequential ordering within same year
  const qt2 = await generateSequenceNumber("QT");
  const num1 = parseInt(qt.split("-")[2], 10);
  const num2 = parseInt(qt2.split("-")[2], 10);
  if (num2 !== num1 + 1) {
    throw new Error(`FAIL: Sequence order is not sequential. Expected ${num1 + 1}, got ${num2}`);
  }
  console.log(`PASS: Sequence sequentiality confirmed (${qt} -> ${qt2})`);

  console.log("\nAll sequence generator tests passed successfully!");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});

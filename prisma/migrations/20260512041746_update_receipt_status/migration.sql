-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rcNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "createdById" TEXT NOT NULL,
    "invoiceId" TEXT,
    "invoiceNumber" TEXT,
    "billingId" TEXT,
    "billingNumber" TEXT,
    "customerName" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerTaxId" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "customerContact" TEXT,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 7,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "notes" TEXT,
    "termsSnapshot" TEXT,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Receipt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Receipt_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Receipt" ("billingId", "billingNumber", "createdAt", "createdById", "currency", "customerAddress", "customerContact", "customerEmail", "customerName", "customerPhone", "customerTaxId", "grandTotal", "id", "invoiceId", "invoiceNumber", "issueDate", "notes", "pdfPath", "rcNumber", "status", "subtotal", "termsSnapshot", "updatedAt", "vatAmount", "vatRate") SELECT "billingId", "billingNumber", "createdAt", "createdById", "currency", "customerAddress", "customerContact", "customerEmail", "customerName", "customerPhone", "customerTaxId", "grandTotal", "id", "invoiceId", "invoiceNumber", "issueDate", "notes", "pdfPath", "rcNumber", "status", "subtotal", "termsSnapshot", "updatedAt", "vatAmount", "vatRate" FROM "Receipt";
DROP TABLE "Receipt";
ALTER TABLE "new_Receipt" RENAME TO "Receipt";
CREATE UNIQUE INDEX "Receipt_rcNumber_key" ON "Receipt"("rcNumber");
CREATE UNIQUE INDEX "Receipt_invoiceId_key" ON "Receipt"("invoiceId");
CREATE UNIQUE INDEX "Receipt_billingId_key" ON "Receipt"("billingId");
CREATE INDEX "Receipt_status_idx" ON "Receipt"("status");
CREATE INDEX "Receipt_createdById_idx" ON "Receipt"("createdById");
CREATE INDEX "Receipt_createdAt_idx" ON "Receipt"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

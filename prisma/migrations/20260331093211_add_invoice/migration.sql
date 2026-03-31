-- CreateTable
CREATE TABLE "INVSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "createdById" TEXT NOT NULL,
    "quotationId" TEXT,
    "quotationNumber" TEXT,
    "customerName" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerTaxId" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "customerContact" TEXT,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "deliveryDate" DATETIME,
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
    CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameTh" TEXT NOT NULL,
    "productNameEn" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "lineTotal" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "INVSequence_year_key" ON "INVSequence"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invNumber_key" ON "Invoice"("invNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_quotationId_key" ON "Invoice"("quotationId");

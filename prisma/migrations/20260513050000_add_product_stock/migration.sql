-- Add manual stock management fields to products.
ALTER TABLE "Product" ADD COLUMN "stockQuantity" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "lowStockThreshold" REAL NOT NULL DEFAULT 0;

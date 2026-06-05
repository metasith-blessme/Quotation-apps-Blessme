import { prisma } from "./db";
import { calculateTotals } from "./financial-calculator";
import { generateINVNumber, generateBNNumber, generateRCNumber } from "./sequence-generator";
import { Invoice, Billing, Receipt } from "@prisma/client";

export type ConversionResult<T> =
  | { success: true; data: T; alreadyExisted: boolean }
  | { success: false; error: "NOT_FOUND" | "FORBIDDEN" | "INTERNAL_ERROR"; message: string };

/**
 * Centrally converts a Quotation into an Invoice.
 * Secures the transaction, recalculates line and VAT totals server-side,
 * maps custom item details/sortOrders, and guards against duplicate creations.
 */
export async function convertQuotationToInvoice(
  quotationId: string,
  userId: string,
  isAdmin: boolean
): Promise<ConversionResult<Invoice>> {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    if (!quotation) {
      return { success: false, error: "NOT_FOUND", message: "Quotation not found" };
    }

    if (!isAdmin && quotation.createdById !== userId) {
      return { success: false, error: "FORBIDDEN", message: "Forbidden" };
    }

    // Optional: Check if already converted
    const existingInvoice = await prisma.invoice.findFirst({
      where: { quotationId },
    });
    if (existingInvoice) {
      return { success: true, data: existingInvoice, alreadyExisted: true };
    }

    const invNumber = await generateINVNumber();

    const { subtotal, vatAmount, grandTotal, items: itemsWithComputedTotals } = calculateTotals(
      quotation.items.map((item) => ({
        productId: item.productId,
        productNameTh: item.productNameTh,
        productNameEn: item.productNameEn,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sortOrder: item.sortOrder,
      })),
      quotation.vatRate
    );

    const invoice = await prisma.invoice.create({
      data: {
        invNumber,
        status: "UNPAID",
        createdById: userId,
        quotationId: quotation.id,
        quotationNumber: quotation.qtNumber,
        customerName: quotation.customerName,
        customerAddress: quotation.customerAddress,
        customerTaxId: quotation.customerTaxId,
        customerPhone: quotation.customerPhone,
        customerEmail: quotation.customerEmail,
        customerContact: quotation.customerContact,
        issueDate: new Date(),
        // Due date default to 30 days from now
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        vatRate: quotation.vatRate,
        vatAmount,
        grandTotal,
        currency: quotation.currency,
        notes: quotation.notes,
        termsSnapshot: quotation.termsSnapshot,
        items: {
          create: itemsWithComputedTotals.map((item) => ({
            productId: item.productId,
            productNameTh: item.productNameTh,
            productNameEn: item.productNameEn,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });

    return { success: true, data: invoice, alreadyExisted: false };
  } catch (error) {
    console.error("Quotation to Invoice conversion error:", error);
    return { success: false, error: "INTERNAL_ERROR", message: "Failed to convert quotation to invoice" };
  }
}

/**
 * Centrally converts an Invoice into a Billing Note.
 * Secures the transaction, recalculates line and VAT totals,
 * carries forward all related attributes, and prevents duplicates.
 */
export async function convertInvoiceToBilling(
  invoiceId: string,
  userId: string,
  isAdmin: boolean
): Promise<ConversionResult<Billing>> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    if (!invoice) {
      return { success: false, error: "NOT_FOUND", message: "Invoice not found" };
    }

    if (!isAdmin && invoice.createdById !== userId) {
      return { success: false, error: "FORBIDDEN", message: "Forbidden" };
    }

    // Check if already converted
    const existingBilling = await prisma.billing.findFirst({
      where: { invoiceId },
    });
    if (existingBilling) {
      return { success: true, data: existingBilling, alreadyExisted: true };
    }

    const bnNumber = await generateBNNumber();

    const { subtotal, vatAmount, grandTotal, items: itemsWithComputedTotals } = calculateTotals(
      invoice.items.map((item) => ({
        productId: item.productId,
        productNameTh: item.productNameTh,
        productNameEn: item.productNameEn,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sortOrder: item.sortOrder,
      })),
      invoice.vatRate
    );

    const billing = await prisma.billing.create({
      data: {
        bnNumber,
        status: "PENDING",
        createdById: userId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invNumber,
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress,
        customerTaxId: invoice.customerTaxId,
        customerPhone: invoice.customerPhone,
        customerEmail: invoice.customerEmail,
        customerContact: invoice.customerContact,
        issueDate: new Date(),
        // Due date same as invoice or +30 days
        dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        vatRate: invoice.vatRate,
        vatAmount,
        grandTotal,
        currency: invoice.currency,
        notes: invoice.notes,
        termsSnapshot: invoice.termsSnapshot,
        items: {
          create: itemsWithComputedTotals.map((item) => ({
            productId: item.productId,
            productNameTh: item.productNameTh,
            productNameEn: item.productNameEn,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });

    return { success: true, data: billing, alreadyExisted: false };
  } catch (error) {
    console.error("Invoice to Billing conversion error:", error);
    return { success: false, error: "INTERNAL_ERROR", message: "Failed to convert invoice to billing" };
  }
}

/**
 * Centrally converts an Invoice directly into a Receipt.
 * Recalculates all values, sets initial status to WAITING, and prevents duplicate receipts.
 */
export async function convertInvoiceToReceipt(
  invoiceId: string,
  userId: string,
  isAdmin: boolean
): Promise<ConversionResult<Receipt>> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    if (!invoice) {
      return { success: false, error: "NOT_FOUND", message: "Invoice not found" };
    }

    if (!isAdmin && invoice.createdById !== userId) {
      return { success: false, error: "FORBIDDEN", message: "Forbidden" };
    }

    // Check if already converted
    const existingReceipt = await prisma.receipt.findFirst({
      where: { invoiceId },
    });
    if (existingReceipt) {
      return { success: true, data: existingReceipt, alreadyExisted: true };
    }

    const rcNumber = await generateRCNumber();

    const { subtotal, vatAmount, grandTotal, items: itemsWithComputedTotals } = calculateTotals(
      invoice.items.map((item) => ({
        productId: item.productId,
        productNameTh: item.productNameTh,
        productNameEn: item.productNameEn,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sortOrder: item.sortOrder,
      })),
      invoice.vatRate
    );

    const receipt = await prisma.receipt.create({
      data: {
        rcNumber,
        status: "WAITING",
        createdById: userId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invNumber,
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress,
        customerTaxId: invoice.customerTaxId,
        customerPhone: invoice.customerPhone,
        customerEmail: invoice.customerEmail,
        customerContact: invoice.customerContact,
        issueDate: new Date(),
        subtotal,
        vatRate: invoice.vatRate,
        vatAmount,
        grandTotal,
        currency: invoice.currency,
        notes: invoice.notes,
        termsSnapshot: invoice.termsSnapshot,
        items: {
          create: itemsWithComputedTotals.map((item) => ({
            productId: item.productId,
            productNameTh: item.productNameTh,
            productNameEn: item.productNameEn,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });

    return { success: true, data: receipt, alreadyExisted: false };
  } catch (error) {
    console.error("Invoice to Receipt conversion error:", error);
    return { success: false, error: "INTERNAL_ERROR", message: "Failed to convert invoice to receipt" };
  }
}

/**
 * Centrally converts a Billing Note into a Receipt.
 * Maps all nested relations including adjacent invoice information if attached.
 */
export async function convertBillingToReceipt(
  billingId: string,
  userId: string,
  isAdmin: boolean
): Promise<ConversionResult<Receipt>> {
  try {
    const billing = await prisma.billing.findUnique({
      where: { id: billingId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    if (!billing) {
      return { success: false, error: "NOT_FOUND", message: "Billing Note not found" };
    }

    if (!isAdmin && billing.createdById !== userId) {
      return { success: false, error: "FORBIDDEN", message: "Forbidden" };
    }

    // Check if already converted
    const existingReceipt = await prisma.receipt.findFirst({
      where: { billingId },
    });
    if (existingReceipt) {
      return { success: true, data: existingReceipt, alreadyExisted: true };
    }

    const rcNumber = await generateRCNumber();

    const { subtotal, vatAmount, grandTotal, items: itemsWithComputedTotals } = calculateTotals(
      billing.items.map((item) => ({
        productId: item.productId,
        productNameTh: item.productNameTh,
        productNameEn: item.productNameEn,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sortOrder: item.sortOrder,
      })),
      billing.vatRate
    );

    const receipt = await prisma.receipt.create({
      data: {
        rcNumber,
        status: "WAITING",
        createdById: userId,
        billingId: billing.id,
        billingNumber: billing.bnNumber,
        invoiceId: billing.invoiceId,
        invoiceNumber: billing.invoiceNumber,
        customerName: billing.customerName,
        customerAddress: billing.customerAddress,
        customerTaxId: billing.customerTaxId,
        customerPhone: billing.customerPhone,
        customerEmail: billing.customerEmail,
        customerContact: billing.customerContact,
        issueDate: new Date(),
        subtotal,
        vatRate: billing.vatRate,
        vatAmount,
        grandTotal,
        currency: billing.currency,
        notes: billing.notes,
        termsSnapshot: billing.termsSnapshot,
        items: {
          create: itemsWithComputedTotals.map((item) => ({
            productId: item.productId,
            productNameTh: item.productNameTh,
            productNameEn: item.productNameEn,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });

    return { success: true, data: receipt, alreadyExisted: false };
  } catch (error) {
    console.error("Billing to Receipt conversion error:", error);
    return { success: false, error: "INTERNAL_ERROR", message: "Failed to convert billing to receipt" };
  }
}

// ─── CASCADE SYNC FUNCTIONS ────────────────────────────────────
// When a parent document is edited, these propagate changes downstream.
// Each is idempotent — no-op if downstream doc doesn't exist yet.

/**
 * Syncs a linked Invoice when its source Quotation is edited.
 * Updates customer details, items, and totals. Then cascades to Billing/Receipt.
 */
export async function syncInvoiceFromQuotation(quotationId: string): Promise<void> {
  console.log(`[SYNC] syncInvoiceFromQuotation called with quotationId: ${quotationId}`);
  
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!quotation) {
    console.log(`[SYNC] Quotation not found for id: ${quotationId}`);
    return;
  }
  console.log(`[SYNC] Found quotation ${quotation.qtNumber} with ${quotation.items.length} items`);

  const invoice = await prisma.invoice.findFirst({
    where: { quotationId: quotationId },
  });
  if (!invoice) {
    console.log(`[SYNC] No linked invoice found for quotationId: ${quotationId}`);
    return;
  }
  console.log(`[SYNC] Found linked invoice ${invoice.invNumber} (id: ${invoice.id})`);

  const { subtotal, vatAmount, grandTotal, items: computedItems } = calculateTotals(
    quotation.items.map((item) => ({
      productId: item.productId,
      productNameTh: item.productNameTh,
      productNameEn: item.productNameEn,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sortOrder: item.sortOrder,
    })),
    quotation.vatRate
  );
  console.log(`[SYNC] Calculated totals: subtotal=${subtotal}, vat=${vatAmount}, grand=${grandTotal}, items=${computedItems.length}`);

  // Delete old invoice items and recreate from quotation
  const deleted = await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
  console.log(`[SYNC] Deleted ${deleted.count} old invoice items`);

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      customerName: quotation.customerName,
      customerAddress: quotation.customerAddress,
      customerTaxId: quotation.customerTaxId,
      customerPhone: quotation.customerPhone,
      customerEmail: quotation.customerEmail,
      customerContact: quotation.customerContact,
      vatRate: quotation.vatRate,
      subtotal,
      vatAmount,
      grandTotal,
      currency: quotation.currency,
      notes: quotation.notes,
      termsSnapshot: quotation.termsSnapshot,
      items: {
        create: computedItems.map((item) => ({
          productId: item.productId,
          productNameTh: item.productNameTh,
          productNameEn: item.productNameEn,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });
  console.log(`[SYNC] Invoice ${invoice.invNumber} updated successfully`);

  // Cascade further: Invoice → Billing → Receipt
  await syncBillingFromInvoice(invoice.id);
  await syncReceiptsFromInvoice(invoice.id);
}

/**
 * Syncs a linked Billing Note when its source Invoice is edited.
 * Then cascades to any Receipt linked to the Billing.
 */
export async function syncBillingFromInvoice(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) return;

  const billing = await prisma.billing.findFirst({
    where: { invoiceId },
  });
  if (!billing) return; // Not yet converted

  const { subtotal, vatAmount, grandTotal, items: computedItems } = calculateTotals(
    invoice.items.map((item) => ({
      productId: item.productId,
      productNameTh: item.productNameTh,
      productNameEn: item.productNameEn,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sortOrder: item.sortOrder,
    })),
    invoice.vatRate
  );

  await prisma.billingItem.deleteMany({ where: { billingId: billing.id } });

  await prisma.billing.update({
    where: { id: billing.id },
    data: {
      customerName: invoice.customerName,
      customerAddress: invoice.customerAddress,
      customerTaxId: invoice.customerTaxId,
      customerPhone: invoice.customerPhone,
      customerEmail: invoice.customerEmail,
      customerContact: invoice.customerContact,
      vatRate: invoice.vatRate,
      subtotal,
      vatAmount,
      grandTotal,
      currency: invoice.currency,
      notes: invoice.notes,
      termsSnapshot: invoice.termsSnapshot,
      items: {
        create: computedItems.map((item) => ({
          productId: item.productId,
          productNameTh: item.productNameTh,
          productNameEn: item.productNameEn,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });

  // Cascade: Billing → Receipt
  await syncReceiptsFromBilling(billing.id);
}

/**
 * Syncs Receipts linked directly to an Invoice (not via Billing).
 */
export async function syncReceiptsFromInvoice(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) return;

  const receipt = await prisma.receipt.findFirst({
    where: { invoiceId, billingId: null },
  });
  if (!receipt) return;

  const { subtotal, vatAmount, grandTotal, items: computedItems } = calculateTotals(
    invoice.items.map((item) => ({
      productId: item.productId,
      productNameTh: item.productNameTh,
      productNameEn: item.productNameEn,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sortOrder: item.sortOrder,
    })),
    invoice.vatRate
  );

  await prisma.receiptItem.deleteMany({ where: { receiptId: receipt.id } });

  await prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      customerName: invoice.customerName,
      customerAddress: invoice.customerAddress,
      customerTaxId: invoice.customerTaxId,
      customerPhone: invoice.customerPhone,
      customerEmail: invoice.customerEmail,
      customerContact: invoice.customerContact,
      vatRate: invoice.vatRate,
      subtotal,
      vatAmount,
      grandTotal,
      currency: invoice.currency,
      notes: invoice.notes,
      termsSnapshot: invoice.termsSnapshot,
      items: {
        create: computedItems.map((item) => ({
          productId: item.productId,
          productNameTh: item.productNameTh,
          productNameEn: item.productNameEn,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });
}

/**
 * Syncs Receipts linked to a Billing Note.
 */
export async function syncReceiptsFromBilling(billingId: string): Promise<void> {
  const billing = await prisma.billing.findUnique({
    where: { id: billingId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!billing) return;

  const receipt = await prisma.receipt.findFirst({
    where: { billingId },
  });
  if (!receipt) return;

  const { subtotal, vatAmount, grandTotal, items: computedItems } = calculateTotals(
    billing.items.map((item) => ({
      productId: item.productId,
      productNameTh: item.productNameTh,
      productNameEn: item.productNameEn,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sortOrder: item.sortOrder,
    })),
    billing.vatRate
  );

  await prisma.receiptItem.deleteMany({ where: { receiptId: receipt.id } });

  await prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      customerName: billing.customerName,
      customerAddress: billing.customerAddress,
      customerTaxId: billing.customerTaxId,
      customerPhone: billing.customerPhone,
      customerEmail: billing.customerEmail,
      customerContact: billing.customerContact,
      vatRate: billing.vatRate,
      subtotal,
      vatAmount,
      grandTotal,
      currency: billing.currency,
      notes: billing.notes,
      termsSnapshot: billing.termsSnapshot,
      items: {
        create: computedItems.map((item) => ({
          productId: item.productId,
          productNameTh: item.productNameTh,
          productNameEn: item.productNameEn,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });
}

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
  
  const [quotation, invoice] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.invoice.findFirst({
      where: { quotationId },
    }),
  ]);

  if (!quotation) {
    console.log(`[SYNC] Quotation not found for id: ${quotationId}`);
    return;
  }
  if (!invoice) {
    console.log(`[SYNC] No linked invoice found for quotationId: ${quotationId}`);
    return;
  }

  // Fetch billing and receipt in parallel using invoice.id
  const [billing, receipt] = await Promise.all([
    prisma.billing.findFirst({
      where: { invoiceId: invoice.id },
    }),
    prisma.receipt.findFirst({
      where: {
        OR: [
          { invoiceId: invoice.id },
          { billing: { invoiceId: invoice.id } }
        ]
      },
    }),
  ]);

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

  const writeOps: any[] = [
    prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } }),
    prisma.invoice.update({
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
    })
  ];

  if (billing) {
    writeOps.push(
      prisma.billingItem.deleteMany({ where: { billingId: billing.id } }),
      prisma.billing.update({
        where: { id: billing.id },
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
      })
    );
  }

  if (receipt) {
    writeOps.push(
      prisma.receiptItem.deleteMany({ where: { receiptId: receipt.id } }),
      prisma.receipt.update({
        where: { id: receipt.id },
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
      })
    );
  }

  await prisma.$transaction(writeOps);
  console.log(`[SYNC] Invoice ${invoice.invNumber} and downstream docs synced successfully`);
}

/**
 * Syncs a linked Billing Note when its source Invoice is edited.
 * Then cascades to any Receipt linked to the Billing.
 */
export async function syncBillingFromInvoice(invoiceId: string): Promise<void> {
  const [invoice, billing, receipt] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.billing.findFirst({
      where: { invoiceId },
    }),
    prisma.receipt.findFirst({
      where: { billing: { invoiceId } },
    }),
  ]);

  if (!invoice || !billing) return;

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

  const writeOps: any[] = [
    prisma.billingItem.deleteMany({ where: { billingId: billing.id } }),
    prisma.billing.update({
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
    })
  ];

  if (receipt) {
    writeOps.push(
      prisma.receiptItem.deleteMany({ where: { receiptId: receipt.id } }),
      prisma.receipt.update({
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
      })
    );
  }

  await prisma.$transaction(writeOps);
}

/**
 * Syncs Receipts linked directly to an Invoice (not via Billing).
 */
export async function syncReceiptsFromInvoice(invoiceId: string): Promise<void> {
  const [invoice, receipt] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.receipt.findFirst({
      where: { invoiceId, billingId: null },
    }),
  ]);

  if (!invoice || !receipt) return;

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

  await prisma.$transaction([
    prisma.receiptItem.deleteMany({ where: { receiptId: receipt.id } }),
    prisma.receipt.update({
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
    }),
  ]);
}

/**
 * Syncs Receipts linked to a Billing Note.
 */
export async function syncReceiptsFromBilling(billingId: string): Promise<void> {
  const [billing, receipt] = await Promise.all([
    prisma.billing.findUnique({
      where: { id: billingId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.receipt.findFirst({
      where: { billingId },
    }),
  ]);

  if (!billing || !receipt) return;

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

  await prisma.$transaction([
    prisma.receiptItem.deleteMany({ where: { receiptId: receipt.id } }),
    prisma.receipt.update({
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
    }),
  ]);
}

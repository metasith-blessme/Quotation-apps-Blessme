/**
 * Financial Calculator Module
 *
 * Centralized business logic for performing secure, floating-point safe calculations
 * for all line items and totals (subtotal, VAT, grand total) across BlessMe document flows.
 */

export interface LineItemInput {
  productId?: string | null;
  productNameTh: string;
  productNameEn?: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
}

export interface CalculatedLineItem {
  productId: string | null;
  productNameTh: string;
  productNameEn: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

export interface CalculatedTotals {
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  items: CalculatedLineItem[];
}

/**
 * Robust rounding helper using EPSILON to prevent floating-point representation discrepancies.
 */
export function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates standard line-totals, subtotal, VAT, and grand totals for any document context.
 *
 * @param items Raw line items input
 * @param vatRate VAT percentage rate (e.g. 7)
 * @returns Fully computed totals and mapped line items
 */
export function calculateTotals(
  items: LineItemInput[],
  vatRate: number
): CalculatedTotals {
  const calculatedItems = items.map((item, index) => {
    const rawLineTotal = item.quantity * item.unitPrice;
    const roundedLineTotal = roundToTwoDecimals(rawLineTotal);
    return {
      productId: item.productId ?? null,
      productNameTh: item.productNameTh,
      productNameEn: item.productNameEn ?? null,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: roundedLineTotal,
      sortOrder: item.sortOrder ?? index,
    };
  });

  const subtotal = roundToTwoDecimals(
    calculatedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  );
  const vatAmount = roundToTwoDecimals((subtotal * vatRate) / 100);
  const grandTotal = roundToTwoDecimals(subtotal + vatAmount);

  return {
    subtotal,
    vatAmount,
    grandTotal,
    items: calculatedItems,
  };
}

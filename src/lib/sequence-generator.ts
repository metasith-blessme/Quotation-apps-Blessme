import { prisma } from "./db";

export type SequenceType = "QT" | "INV" | "BN" | "RC";

/**
 * Centrally generates document sequence numbers in a secure database-level transaction.
 *
 * Ensures sequential numbers are unique and race-condition free, even when
 * multiple concurrent requests are processed.
 *
 * @param type The document sequence type ('QT' | 'INV' | 'BN' | 'RC')
 * @returns Formatted sequence string (e.g. "BLT-2026-001" or "INV-2026-003")
 */
export async function generateSequenceNumber(type: SequenceType): Promise<string> {
  const year = new Date().getFullYear();

  const seq = await prisma.$transaction(async (tx) => {
    switch (type) {
      case "QT":
        return tx.qTSequence.upsert({
          where: { year },
          update: { lastSeq: { increment: 1 } },
          create: { year, lastSeq: 1 },
        });
      case "INV":
        return tx.iNVSequence.upsert({
          where: { year },
          update: { lastSeq: { increment: 1 } },
          create: { year, lastSeq: 1 },
        });
      case "BN":
        return tx.bNSequence.upsert({
          where: { year },
          update: { lastSeq: { increment: 1 } },
          create: { year, lastSeq: 1 },
        });
      case "RC":
        return tx.rCSequence.upsert({
          where: { year },
          update: { lastSeq: { increment: 1 } },
          create: { year, lastSeq: 1 },
        });
      default:
        throw new Error(`Unsupported sequence type: ${type}`);
    }
  });

  const padded = String(seq.lastSeq).padStart(3, "0");
  const prefix = type === "QT" ? "BLT" : type;
  return `${prefix}-${year}-${padded}`;
}

/**
 * Generates a Quotation sequence number.
 * Backward-compatible wrapper mapping to BLT prefix.
 */
export async function generateQTNumber(): Promise<string> {
  return generateSequenceNumber("QT");
}

/**
 * Generates an Invoice sequence number.
 */
export async function generateINVNumber(): Promise<string> {
  return generateSequenceNumber("INV");
}

/**
 * Generates a Billing Note sequence number.
 */
export async function generateBNNumber(): Promise<string> {
  return generateSequenceNumber("BN");
}

/**
 * Generates a Receipt sequence number.
 */
export async function generateRCNumber(): Promise<string> {
  return generateSequenceNumber("RC");
}

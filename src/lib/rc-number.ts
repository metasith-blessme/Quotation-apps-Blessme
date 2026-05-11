import { prisma } from "./db";

export async function generateRCNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const seq = await prisma.$transaction(async (tx) => {
    return tx.rCSequence.upsert({
      where: { year },
      update: { lastSeq: { increment: 1 } },
      create: { year, lastSeq: 1 },
    });
  });

  const padded = String(seq.lastSeq).padStart(3, "0");
  return `RC-${year}-${padded}`;
}

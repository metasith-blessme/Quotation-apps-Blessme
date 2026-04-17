import { prisma } from "@/lib/db";
import type { Company } from "@prisma/client";

let cachedCompany: Company | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Get company settings with caching.
 * Caches for 1 minute to reduce database round-trips during PDF generation.
 * PERFORMANCE: Avoids repeated DB queries for the same company data.
 */
export async function getCachedCompany(): Promise<Company | null> {
  const now = Date.now();
  if (cachedCompany && now - cacheTime < CACHE_TTL) {
    return cachedCompany;
  }

  cachedCompany = await prisma.company.findFirst();
  cacheTime = now;
  return cachedCompany;
}

/**
 * Clear the company cache (useful after updates).
 */
export function clearCompanyCache(): void {
  cachedCompany = null;
  cacheTime = 0;
}

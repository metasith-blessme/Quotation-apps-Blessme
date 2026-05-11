# Decision Log

## April 20, 2026

### 6. PDF Thai Text Clipping Fix — paddingRight Approach
- **Decision:** Use `paddingRight` on text styles instead of relying solely on trailing spaces to prevent `@react-pdf/renderer` from clipping the last character of Thai text.
- **Rationale:** Trailing spaces can be trimmed by the renderer. `paddingRight` creates real layout space in the PDF engine. Also removed `wordBreak` and `flexWrap` CSS properties which are not supported by @react-pdf/renderer and could cause unpredictable behavior.
- **Alternatives considered:** Wrapping text in `<View style={{ flex: 1 }}>` containers — this was tried first but didn't resolve the issue because `flex: 1` in a column layout affects height, not width.

### 7. Remove Unnecessary View Wrappers in CustomerSection
- **Decision:** Reverted the `<View style={{ flex: 1 }}>` wrappers around customer text fields back to flat `<Text>` elements.
- **Rationale:** In @react-pdf/renderer's default column flex direction, `flex: 1` allocates vertical space, not horizontal width. The extra Views added complexity without solving the text clipping issue and may have introduced subtle layout bugs.

## April 17, 2026

### 8. Server-Side Financial Data Recomputation
- **Decision:** Remove trust of client-sent `lineTotal` values. Recompute `lineTotal = quantity * unitPrice` server-side in all document creation/update/conversion routes.
- **Rationale:** CRITICAL security vulnerability — a malicious client could send `{ quantity: 100, unitPrice: 500, lineTotal: 1 }` and the server would store 1 THB instead of 50,000 THB. All downstream documents (Invoice, Billing) would inherit the fraudulent total.

### 9. Ownership Guards on Invoice/Billing Routes
- **Decision:** Add `createdById` ownership checks to Invoice and Billing GET/PUT routes (Quotation already had them).
- **Rationale:** Without these guards, SALES user A could read and modify documents belonging to SALES user B by guessing the document ID. ADMIN role bypasses this check intentionally.

### 10. Zod Enum Status Validation
- **Decision:** Create dedicated Zod schemas (`invoice.schema.ts`, `billing.schema.ts`) with `z.enum()` for status fields instead of accepting arbitrary strings.
- **Rationale:** Without validation, API consumers could set `status: "HACKED"` or any arbitrary value. Enum validation ensures only valid state transitions are accepted.

### 11. PDF Shared Component Architecture
- **Decision:** Extract duplicated PDF code into `src/components/pdf/shared/` with `PDFLayout.tsx`, `pdfStyles.ts`, and `pdfFonts.ts`.
- **Rationale:** Three PDF documents had ~300 lines each with 80% identical code (font registration, styles, header, table, totals, signatures). Extracting shared components reduces each to ~90 lines and ensures consistency. Adding a 4th PDF type now requires only the unique parts.

### 12. Company Settings Cache (1-Minute TTL)
- **Decision:** Cache company settings in memory with 60-second TTL (`src/lib/company-cache.ts`) for PDF generation.
- **Rationale:** PDF generators fetch company data on every request. When generating multiple PDFs in sequence (e.g., batch export), each hits the Turso remote database. Caching reduces round-trips by ~90% for batch operations. 1-minute TTL balances freshness with performance.

### 13. Database Indexes
- **Decision:** Add `@@index([status])`, `@@index([createdById])`, `@@index([createdAt])` to Quotation, Invoice, and Billing models.
- **Rationale:** Dashboard and list pages filter by status and creator. Without indexes, these become full-table scans as document count grows. At 10K+ documents, query latency would degrade noticeably.

### 14. groupBy Aggregates for Dashboard Counts
- **Decision:** Replace `findMany` + client-side `.filter().length` with Prisma `groupBy` for dashboard status counts.
- **Rationale:** The old pattern fetched all documents (~50KB for 1000 records) just to count by status. `groupBy` returns only the counts (<1KB), reducing both query time and network payload.

### 15. HTTP Security Headers
- **Decision:** Add X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, and Strict-Transport-Security headers to all routes via `next.config.ts`.
- **Rationale:** Closes common web attack vectors (MIME sniffing, clickjacking, XSS escalation) at the HTTP layer with minimal effort.

## March 31, 2026

### 1. Bilingual PDF Output
- **Decision:** Shift from Thai-only to Bilingual (Thai/English) labels in all PDF documents.
- **Rationale:** Improves professional appearance and accessibility. Provides fallback if Thai rendering issues persist in specific PDF viewers.

### 2. Thai Typography Fix (Hyphenation)
- **Decision:** Replace restrictive `Font.registerHyphenationCallback((word) => [word])` with logic that allows breaking long strings (over 15 chars) into smaller chunks while respecting Thai combining marks.
- **Rationale:** Thai text lacks spaces, causing @react-pdf/renderer to treat paragraphs as single words. The restrictive callback caused truncation instead of wrapping.

### 3. Manual Database Sync for Production
- **Decision:** Use a Node.js script with `@libsql/client` to manually create tables in Turso production database.
- **Rationale:** `prisma migrate dev` and `db push` fail with `libsql://` scheme. Manual SQL execution ensures production stability.

### 4. Invoice-to-Billing Inheritance
- **Decision:** Automatically carry over `notes` and `termsSnapshot` from Invoices to Billing Notes during conversion.
- **Rationale:** Users should not re-type remarks at each stage. Business consistency requires preserving all user-entered information across the document lifecycle.

### 5. Billing Note Distinctive Styling
- **Decision:** Blue color scheme (#3b82f6) for Invoice and Billing Note PDFs, green (#16a34a) for Quotation.
- **Rationale:** Visual distinction between document types at a glance. Green = quote/proposal, blue = financial/billing.

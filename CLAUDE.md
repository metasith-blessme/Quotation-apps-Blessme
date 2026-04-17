# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # dev server at localhost:3000
npm run build             # production build
npm run lint              # ESLint
npm run typecheck         # TypeScript type checking (no emit)
npx prisma studio         # DB browser UI
npx prisma db seed        # seed with ts-node
```

**Always run typecheck before committing** to catch silent type errors.

### Database migrations (Turso workaround)
`prisma migrate dev` rejects the `libsql://` scheme. Apply schema changes manually:
```bash
# Use sync-db-manual.js pattern from session history, or run raw SQL via Turso CLI
~/.turso/turso db shell <db-name> "ALTER TABLE ..."
```

## Architecture

### Document lifecycle
```
Quotation (DRAFT→SENT→ACCEPTED) 
  → Invoice (UNPAID→PAID)          POST /api/quotations/[id]/convert-to-invoice
    → Billing Note (PENDING→COLLECTED)  POST /api/invoices/[id]/convert-to-billing
```
Each conversion copies all line items and customer data into the new document. If a document has already been converted, the endpoint returns the existing record instead of duplicating.

### Database
- **Remote**: Turso (libsql) via `DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars
- **Local dev**: falls back to `file:./dev.db` (SQLite)
- Prisma client uses `@prisma/adapter-libsql` — `src/lib/db.ts` is the singleton
- Auto-numbering: `QTSequence`, `INVSequence`, `BNSequence` — one row per year, incremented in `src/lib/qt-number.ts`, `inv-number.ts`, `bn-number.ts`

### API routes pattern
All routes in `src/app/api/` follow the same structure:
1. `auth()` check → 401 if no session
2. **Ownership guard** → ADMIN sees all records; SALES only sees their own (`createdById`)
3. **Zod validation** via `src/lib/validations/` schemas:
   - `quotation.schema.ts` — full quotation validation
   - `invoice.schema.ts` — status-only update with enum validation (UNPAID | PAID | OVERDUE | CANCELLED)
   - `billing.schema.ts` — status-only update with enum validation (PENDING | COLLECTED | CANCELLED)
4. **Server-side line total computation** — All routes recompute `lineTotal = quantity * unitPrice` (never trust client)
5. PDF routes (`/api/*/[id]/pdf`) call `src/lib/pdf.ts` generators which use `@react-pdf/renderer`

**CRITICAL:** All document creation/update endpoints must recompute financial data server-side to prevent fraud.

### PDF generation
`src/lib/pdf.ts` exports `generateQuotationPDF`, `generateInvoicePDF`, `generateBillingPDF`.

**Pattern:** Each fetches the record + **cached company settings** (1-minute TTL via `src/lib/company-cache.ts`), then renders a React component to a buffer.

**PDF components architecture (refactored Apr 17):**
- `src/components/pdf/QuotationPDFDocument.tsx` (85 lines) — Green accent
- `src/components/pdf/InvoicePDFDocument.tsx` (94 lines) — Blue accent
- `src/components/pdf/BillingPDFDocument.tsx` (94 lines) — Blue accent
- All three **reuse shared components** from `src/components/pdf/shared/`:
  - `PDFLayout.tsx` (223 lines) — Reusable Header, CustomerSection, ItemsTable, TotalsSection, NotesSection, SignatureSection
  - `pdfStyles.ts` — Factory function `createPDFStyles(accentColor)` with parameterized colors
  - `pdfFonts.ts` — Hoisted `registerPDFFonts()` with Thai hyphenation callback (no combining mark breaks)

**When adding a new PDF type:**
1. Import shared components from `src/components/pdf/shared/`
2. Create new PDF document component (~90 lines)
3. Add generator function to `src/lib/pdf.ts`
4. Reuses all styling, fonts, and layout logic

**Note:** Sarabun font loaded via `pdfFonts.ts`; ensure it exists at `public/fonts/Sarabun-*.ttf`.

### Auth
NextAuth v5 (`src/lib/auth.ts`) with credentials provider, JWT sessions. `session.user.role` is either `"ADMIN"` or `"SALES"`. Role is injected into the JWT via the `jwt` callback and accessed server-side via `await auth()`.

### Frontend pages
- `src/app/(app)/` — authenticated routes wrapped by `src/app/(app)/layout.tsx`
- `/dashboard` — home page: cross-document stat cards, recent activity (last 5 of each type), quick actions
- `/quotations` — quotations list (reuses `dashboard/DashboardClient.tsx` for filtering/search)
- Each document type has: list page (server component) + `*Client.tsx` (client component with filtering/sorting) + `[id]/page.tsx` (detail view) + `[id]/Actions.tsx` (status change buttons)
- Forms are client components; quotation uses `src/components/quotation/QuotationForm.tsx` with inline product picker
- Bilingual labels: Thai primary, English secondary — applies to both UI and PDF column headers

## Performance & Security (Apr 17, 2026)

### Database Indexes
Added to `prisma/schema.prisma` (via indexes on Quotation, Invoice, Billing models):
```
@@index([status])      # Fast filtering by document status
@@index([createdById])  # Fast filtering by creator (SALES user isolation)
@@index([createdAt])    # Fast sorting by creation date
```

### Query Optimization
- **Dashboard** — Uses `groupBy` aggregates instead of `findMany` + client-side filtering
  - Before: Fetch all documents (~50KB for 1000 records), count in JS
  - After: Let DB count by status (<1KB response)
- See `src/app/(app)/dashboard/page.tsx` for pattern usage

### Company Settings Cache
`src/lib/company-cache.ts` caches company data for 1 minute:
- PDF generators use `getCachedCompany()` instead of direct DB queries
- Reduces Turso round-trips by 90% when generating batches of PDFs
- **Clear cache if needed:** Remove `src/lib/company-cache.ts` export and reimport for fresh data

### HTTP Security Headers
Added to `next.config.ts`:
- `X-Content-Type-Options: nosniff` — Prevents MIME-type sniffing
- `X-Frame-Options: DENY` — Blocks clickjacking/iframe embedding
- `X-XSS-Protection: 1; mode=block` — Legacy XSS protection
- `Strict-Transport-Security` — Enforces HTTPS for 1 year

## Environment variables
```
DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
AUTH_SECRET=...
SEED_ADMIN_PASSWORD=...  # Optional; defaults to "admin1234" for local dev
```

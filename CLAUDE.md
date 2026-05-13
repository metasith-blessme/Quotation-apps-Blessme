# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # dev server at localhost:3000
npm run build             # production build
npm run lint              # ESLint
npm run typecheck         # TypeScript type checking (tsc --noEmit)
npx prisma studio         # DB browser UI
npx prisma db seed        # seed with ts-node
```

**Always run `npm run typecheck` before committing.**

### Database migrations (Turso workaround)
`prisma migrate dev` rejects the `libsql://` scheme. Apply schema changes manually via Turso CLI:
```bash
~/.turso/turso db shell <db-name> "ALTER TABLE ..."
```

## Architecture

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma + Turso (libsql), NextAuth v5, @react-pdf/renderer

**Path alias:** `@/*` → `./src/*`

### Document lifecycle
```
Quotation (DRAFT → SENT → ACCEPTED)
  → Invoice (UNPAID → PAID → OVERDUE → CANCELLED)     POST /api/quotations/[id]/convert-to-invoice
    → Billing Note (PENDING → COLLECTED → CANCELLED)   POST /api/invoices/[id]/convert-to-billing
    → Receipt (WAITING → ISSUED → CANCELLED)           POST /api/invoices/[id]/convert-to-receipt
                                                      POST /api/billings/[id]/convert-to-receipt
```
Each conversion copies all line items and customer data. If already converted, returns the existing record.

### Database
- **Remote**: Turso (libsql) via `DATABASE_URL` + `TURSO_AUTH_TOKEN`
- **Local dev**: falls back to `file:./dev.db` (SQLite)
- Prisma singleton: `src/lib/db.ts`
- Auto-numbering sequences: `QTSequence`, `INVSequence`, `BNSequence`, `RCSequence` — one row per year, managed by `src/lib/qt-number.ts`, `inv-number.ts`, `bn-number.ts`, `rc-number.ts`
- Indexes on `status`, `createdById`, `createdAt` for Quotation, Invoice, Billing, Receipt

### API routes pattern
All routes in `src/app/api/` follow this structure:
1. `auth()` check → 401 if no session
2. **Ownership guard** — ADMIN sees all; SALES only sees own (`createdById`)
3. **Zod validation** via `src/lib/validations/` schemas:
   - `quotation.schema.ts` — full document validation
   - `invoice.schema.ts` — status enum (UNPAID | PAID | OVERDUE | CANCELLED)
   - `billing.schema.ts` — status enum (PENDING | COLLECTED | CANCELLED)
   - `receipt.schema.ts` — status enum (WAITING | ISSUED | CANCELLED)
   - `product.schema.ts`, `client.schema.ts` — entity validation
4. **Server-side financial computation** — `lineTotal = quantity * unitPrice` recomputed on every write (never trust client-sent totals)
5. PDF routes (`/api/*/[id]/pdf`) call generators in `src/lib/pdf.ts`

### PDF generation
`src/lib/pdf.ts` exports `generateQuotationPDF`, `generateInvoicePDF`, `generateBillingPDF`, `generateReceiptPDF`. Each fetches the record + cached company settings (1-min TTL via `src/lib/company-cache.ts`), then renders to buffer.

**Commercial Grade PDF Fixes (May 12-13):**
- **createElement() over JSX:** All PDF components use `createElement()` instead of JSX to bypass Turbopack's JSX transform, which produces multi-child Text nodes that `@react-pdf/renderer` silently drops on Vercel serverless.
- **Hyphenation callback fix:** The callback must return `[word]` for non-Thai text (not `[]`). Returning an empty array makes `@react-pdf/renderer` treat the word as having zero syllables, rendering it invisible.
- **Arabic Numerals:** Force `en-US` formatting for numbers and `th-TH-u-nu-latn` for dates to ensure numerals render reliably in server environments.
- **Thai Baht Text:** Added `bahtText` utility in `src/lib/thai-text.ts` for professional currency text.

**Shared components** in `src/components/pdf/shared/`:
- `PDFLayout.tsx` — PdfHeader, CustomerSection, ItemsTable, TotalsSection, NotesSection, SignatureSection (all use `createElement()`)
- `pdfStyles.ts` — `createPDFStyles(accentColor)` factory (green for Quotation, blue for Invoice/Billing, indigo for Receipt)
- `pdfFonts.ts` — `registerPDFFonts()` with Thai hyphenation callback (Google Fonts CDN URLs)

**Per-document components** (all use `createElement()`):
- `QuotationPDFDocument.tsx` — green accent (#16a34a)
- `InvoicePDFDocument.tsx` — blue accent (#3b82f6)
- `BillingPDFDocument.tsx` — blue accent (#3b82f6)
- `ReceiptPDFDocument.tsx` — indigo accent (#6366f1)

**Thai text in PDFs — known pitfalls:**
- Font: Sarabun via Google Fonts CDN, registered in `pdfFonts.ts`
- **CRITICAL:** All PDF components MUST use `createElement()` (aliased as `h`), NOT JSX. Turbopack's JSX transform creates multi-child Text nodes that `@react-pdf/renderer` silently drops on Vercel.
- **CRITICAL:** Hyphenation callback must return `[word]` for non-Thai words, never `[]`. Empty array = invisible text.
- Hyphenation callback must never break Thai combining marks (U+0E31, U+0E34–U+0E3A, U+0E47–U+0E4E)
- Always add a trailing space in template literals: `` `${text} ` `` to prevent last-character clipping
- Use `paddingRight` on text styles for additional clipping protection
- Thai text utilities: `src/lib/thai-text.ts` (word boundary detection, combining mark validation, `bahtText`)

**Adding a new PDF type:**
1. Import shared components from `src/components/pdf/shared/`
2. Create document component using `createElement()` (NOT JSX) — see existing components for pattern
3. Add generator function to `src/lib/pdf.ts`

### Auth
NextAuth v5 (`src/lib/auth.ts`), credentials provider, JWT sessions. Roles: `"ADMIN"` or `"SALES"`. Role injected into JWT via `jwt` callback, accessed server-side via `await auth()`.

### Frontend pages
- `src/app/(app)/` — authenticated routes (wrapped by layout with Sidebar + Topbar)
- Dashboard uses `groupBy` aggregates for status counts (not client-side filtering)
- Each document type: list page (server component) → `*Client.tsx` (filtering/sorting) → `[id]/page.tsx` (detail) → `[id]/Actions.tsx` (status buttons)
- Quotation form: `src/components/quotation/QuotationForm.tsx` with `ClientPicker.tsx` and inline product picker
- Bilingual labels throughout: Thai primary, English secondary

### Security
- HTTP headers in `next.config.ts`: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, X-XSS-Protection
- Ownership guards on all document CRUD routes
- Server-side financial data verification on all writes
- Seed password via `SEED_ADMIN_PASSWORD` env var (defaults to `"admin1234"` for local dev)

## Environment variables
```
DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
AUTH_SECRET=...
SEED_ADMIN_PASSWORD=...  # Optional; defaults to "admin1234" for local dev
```

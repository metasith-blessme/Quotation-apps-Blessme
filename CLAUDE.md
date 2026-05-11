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
```
Each conversion copies all line items and customer data. If already converted, returns the existing record.

### Database
- **Remote**: Turso (libsql) via `DATABASE_URL` + `TURSO_AUTH_TOKEN`
- **Local dev**: falls back to `file:./dev.db` (SQLite)
- Prisma singleton: `src/lib/db.ts`
- Auto-numbering sequences: `QTSequence`, `INVSequence`, `BNSequence` — one row per year, managed by `src/lib/qt-number.ts`, `inv-number.ts`, `bn-number.ts`
- Indexes on `status`, `createdById`, `createdAt` for Quotation, Invoice, Billing

### API routes pattern
All routes in `src/app/api/` follow this structure:
1. `auth()` check → 401 if no session
2. **Ownership guard** — ADMIN sees all; SALES only sees own (`createdById`)
3. **Zod validation** via `src/lib/validations/` schemas:
   - `quotation.schema.ts` — full document validation
   - `invoice.schema.ts` — status enum (UNPAID | PAID | OVERDUE | CANCELLED)
   - `billing.schema.ts` — status enum (PENDING | COLLECTED | CANCELLED)
   - `product.schema.ts`, `client.schema.ts` — entity validation
4. **Server-side financial computation** — `lineTotal = quantity * unitPrice` recomputed on every write (never trust client-sent totals)
5. PDF routes (`/api/*/[id]/pdf`) call generators in `src/lib/pdf.ts`

### PDF generation
`src/lib/pdf.ts` exports `generateQuotationPDF`, `generateInvoicePDF`, `generateBillingPDF`. Each fetches the record + cached company settings (1-min TTL via `src/lib/company-cache.ts`), then renders to buffer.

**Shared components** in `src/components/pdf/shared/`:
- `PDFLayout.tsx` — PdfHeader, CustomerSection, ItemsTable, TotalsSection, NotesSection, SignatureSection
- `pdfStyles.ts` — `createPDFStyles(accentColor)` factory (green for Quotation, blue for Invoice/Billing)
- `pdfFonts.ts` — `registerPDFFonts()` with Thai hyphenation callback

**Per-document components** (~85-94 lines each):
- `QuotationPDFDocument.tsx` — green accent (#16a34a)
- `InvoicePDFDocument.tsx` — blue accent (#3b82f6)
- `BillingPDFDocument.tsx` — blue accent (#3b82f6)

**Thai text in PDFs — known pitfalls:**
- Font: Sarabun (`public/fonts/Sarabun-*.ttf`), registered in `pdfFonts.ts`
- Hyphenation callback must never break Thai combining marks (U+0E31, U+0E34–U+0E3A, U+0E47–U+0E4E)
- `@react-pdf/renderer` clips the last character of Thai text — always add a trailing space after `{text} ` in Text elements
- Use `paddingRight` on text styles for additional clipping protection
- Thai text utilities: `src/lib/thai-text.ts` (word boundary detection, combining mark validation)

**Adding a new PDF type:**
1. Import shared components from `src/components/pdf/shared/`
2. Create document component (~90 lines)
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

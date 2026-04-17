# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # dev server at localhost:3000
npm run build             # production build
npm run lint              # ESLint
npx prisma studio         # DB browser UI
npx prisma db seed        # seed with ts-node
```

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
2. ADMIN sees all records; SALES only sees their own (`createdById`)
3. Zod validation via `src/lib/validations/` schemas (quotation has one; invoices/billings validate inline)
4. PDF routes (`/api/*/[id]/pdf`) call `src/lib/pdf.ts` generators which use `@react-pdf/renderer`

### PDF generation
`src/lib/pdf.ts` exports `generateQuotationPDF`, `generateInvoicePDF`, `generateBillingPDF`. Each fetches the record + company settings, then renders a React component to a buffer. PDF components live in `src/components/pdf/` and use Sarabun font from `public/fonts/Sarabun-*.ttf` — **register these fonts in any new PDF component**.

### Auth
NextAuth v5 (`src/lib/auth.ts`) with credentials provider, JWT sessions. `session.user.role` is either `"ADMIN"` or `"SALES"`. Role is injected into the JWT via the `jwt` callback and accessed server-side via `await auth()`.

### Frontend pages
- `src/app/(app)/` — authenticated routes wrapped by `src/app/(app)/layout.tsx`
- `/dashboard` — home page: cross-document stat cards, recent activity (last 5 of each type), quick actions
- `/quotations` — quotations list (reuses `dashboard/DashboardClient.tsx` for filtering/search)
- Each document type has: list page (server component) + `*Client.tsx` (client component with filtering/sorting) + `[id]/page.tsx` (detail view) + `[id]/Actions.tsx` (status change buttons)
- Forms are client components; quotation uses `src/components/quotation/QuotationForm.tsx` with inline product picker
- Bilingual labels: Thai primary, English secondary — applies to both UI and PDF column headers

## Environment variables
```
DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
AUTH_SECRET=...
```

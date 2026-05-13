# Reviewer Instructions

## Summary of Current State
The BlessMe Topping quotation app is production-deployed on Vercel with full document lifecycle support (Quotation → Invoice → Billing Note → Receipt). Recent work (May 12-13) fixed critical PDF rendering bugs and added the Receipt status toggle.

## Areas to Verify

### 1. PDF Generation (CRITICAL — recently fixed)
- **All content renders:** Download a PDF from each document type (Quotation, Invoice, Billing, Receipt) and verify:
  - Document number (e.g. RC-2026-001) is visible
  - Date is visible (e.g. 12/05/2569)
  - Company phone, email, tax ID are all visible in the header
  - Customer phone, email, tax ID, contact name are visible
  - Item quantities, prices, totals all show with numbers
  - All English bilingual labels render (/ No:, / Date:, / Description, / Unit, / Qty, / Price, / Total, etc.)
  - Thai Baht text renders at bottom of totals section
- **Thai text clipping:** Long Thai names ending in parentheses must show the closing `)`
- **Architectural constraint:** All PDF components use `createElement()` NOT JSX — verify no JSX was accidentally reintroduced in `src/components/pdf/`

### 2. Receipt Status Toggle (new)
- Navigate to a receipt detail page → status toggle buttons should appear:
  - WAITING → "เปลี่ยนเป็นออกแล้ว" (ISSUED) + "ยกเลิก" (CANCELLED)
  - ISSUED → "กลับเป็นรอดำเนินการ" (back to WAITING)
  - CANCELLED → "กลับเป็นรอดำเนินการ" (back to WAITING)
- Verify PDF download button works on receipt detail page

### 3. Security
- **Ownership guards:** Log in as a SALES user and confirm you cannot access another user's invoices or billing notes via direct URL (`/api/invoices/[other-user-id]` should return 403)
- **Status validation:** Try sending an invalid status value (e.g., `"HACKED"`) via API — should be rejected with validation error
- **Financial integrity:** Create a quotation and inspect the database — `lineTotal` should equal `quantity * unitPrice` regardless of what the client sends
- **HTTP headers:** Check response headers for `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`

### 4. Document Conversion
- **Quotation → Invoice:** Convert an ACCEPTED quotation and verify all line items, customer data, notes, and terms are carried over
- **Invoice → Billing / Receipt:** Convert and verify data inheritance
- **Billing → Receipt:** Convert and verify
- **Idempotency:** Converting the same document twice should return the existing record, not create a duplicate

### 5. Dashboard Performance
- **Status counts:** Verify dashboard shows correct counts for each document status (including Receipts)
- **Query efficiency:** Dashboard should use `groupBy` aggregates (check server logs — should NOT fetch all records)

### 6. Role-Based Access
- **ADMIN:** Can see all documents across all users
- **SALES:** Can only see own documents (filtered by `createdById`)

## Maintenance Notes

### Database Migrations
Prisma CLI rejects `libsql://` scheme. Apply schema changes manually:
```bash
~/.turso/turso db shell <db-name> "ALTER TABLE ..."
```

### PDF Components
Shared PDF architecture in `src/components/pdf/shared/`:
- `PDFLayout.tsx` — Reusable layout components (Header, CustomerSection, ItemsTable, etc.) — uses `createElement()`
- `pdfStyles.ts` — Style factory with accent color parameter
- `pdfFonts.ts` — Font registration (Sarabun via Google Fonts CDN) and Thai hyphenation

**When modifying PDF text rendering:**
- **CRITICAL:** Use `createElement()` (aliased as `h`), NEVER JSX. Turbopack's JSX transform breaks `@react-pdf/renderer` on Vercel.
- **CRITICAL:** Hyphenation callback must return `[word]` for non-Thai text, NEVER `[]`. Empty array = invisible text.
- Always add trailing space in template literals: `` `${text} ` ``
- Use `paddingRight` on text styles to prevent last-character clipping
- Never break Thai combining marks (U+0E31, U+0E34–U+0E3A, U+0E47–U+0E4E)

### Validation Schemas
Located in `src/lib/validations/`:
- `quotation.schema.ts` — Full document + status enum (DRAFT | SENT | ACCEPTED)
- `invoice.schema.ts` — Status enum (UNPAID | PAID | OVERDUE | CANCELLED)
- `billing.schema.ts` — Status enum (PENDING | COLLECTED | CANCELLED)
- `receipt.schema.ts` — Status enum (WAITING | ISSUED | CANCELLED)
- `product.schema.ts`, `client.schema.ts` — Entity validation

### Database Models
- Quotation, Invoice, Billing, Receipt (with corresponding Item tables)
- QTSequence, INVSequence, BNSequence, RCSequence (auto-numbering per year)
- User, Product, Client, Company (singleton settings)
- All document models have indexes on `status`, `createdById`, `createdAt`

### Debug Endpoints
- Debug PDF endpoints (`/api/debug-pdf`, `/api/debug-pdf/test`) have been removed (cleaned up 2026-05-13).

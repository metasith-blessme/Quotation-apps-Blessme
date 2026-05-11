# Reviewer Instructions

## Summary of Current State
The BlessMe Topping quotation app is production-deployed on Vercel with full document lifecycle support (Quotation → Invoice → Billing Note). Recent work focused on security hardening, performance optimization, PDF refactoring, and Thai text rendering fixes.

## Areas to Verify

### 1. Security (CRITICAL)
- **Ownership guards:** Log in as a SALES user and confirm you cannot access another user's invoices or billing notes via direct URL (`/api/invoices/[other-user-id]` should return 403)
- **Status validation:** Try sending an invalid status value (e.g., `"HACKED"`) via API — should be rejected with validation error
- **Financial integrity:** Create a quotation and inspect the database — `lineTotal` should equal `quantity * unitPrice` regardless of what the client sends
- **HTTP headers:** Check response headers for `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`

### 2. PDF Generation
- **Thai text clipping:** Download a PDF for a customer with a long Thai name ending in parentheses, e.g. `บริษัท กันยารัตน์ คอร์ปอเรชั่น จำกัด (สำนักงานใหญ่)` — the closing `)` must be visible
- **Long remarks:** Verify that long text in the "Notes" section wraps correctly without being cut off
- **Bilingual labels:** All PDF column headers should show Thai primary / English secondary
- **Document types:** Verify all three PDF types render correctly:
  - Quotation — green accent (#16a34a)
  - Invoice — blue accent (#3b82f6), should show Ref QT number if converted
  - Billing Note — blue accent (#3b82f6), should show Ref INV number if converted

### 3. Document Conversion
- **Quotation → Invoice:** Convert an ACCEPTED quotation and verify all line items, customer data, notes, and terms are carried over
- **Invoice → Billing:** Convert an UNPAID invoice and verify the same data inheritance
- **Idempotency:** Converting the same document twice should return the existing record, not create a duplicate

### 4. Dashboard Performance
- **Status counts:** Verify dashboard shows correct counts for each document status
- **Query efficiency:** Dashboard should use `groupBy` aggregates (check server logs — should NOT fetch all records)

### 5. Role-Based Access
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
- `PDFLayout.tsx` — Reusable layout components (Header, CustomerSection, ItemsTable, etc.)
- `pdfStyles.ts` — Style factory with accent color parameter
- `pdfFonts.ts` — Font registration (Sarabun from `public/fonts/`) and Thai hyphenation

**When modifying PDF text rendering:**
- Always add trailing space after Thai text in `<Text>` elements: `{text} `
- Use `paddingRight` on text styles to prevent last-character clipping
- Never break Thai combining marks (U+0E31, U+0E34–U+0E3A, U+0E47–U+0E4E)
- `wordBreak` and `flexWrap` are NOT valid @react-pdf/renderer properties — do not use

### Validation Schemas
Located in `src/lib/validations/`:
- `quotation.schema.ts` — Full document + status enum (DRAFT | SENT | ACCEPTED)
- `invoice.schema.ts` — Status enum (UNPAID | PAID | OVERDUE | CANCELLED)
- `billing.schema.ts` — Status enum (PENDING | COLLECTED | CANCELLED)
- `product.schema.ts`, `client.schema.ts` — Entity validation

### Database Models
- Quotation, Invoice, Billing (with corresponding Item tables)
- QTSequence, INVSequence, BNSequence (auto-numbering per year)
- User, Product, Client, Company (singleton settings)
- All document models have indexes on `status`, `createdById`, `createdAt`

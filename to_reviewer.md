# Reviewer Instructions

## Summary of Current State
The BlessMe Topping quotation app is production-deployed on Vercel with full document lifecycle support (Quotation → Invoice → Billing Note → Receipt). Recent work added inline interactive status toggle select elements with custom chevron visual indicators (▼) across all listing pages (Quotations, Invoices, Billings, Receipts, Deliveries) and the Homepage Dashboard, separating dropdown components from row navigation links to prevent click event blocking. Previous work fixed critical PDF rendering bugs, added performance optimizations (groupBy on all list pages), data integrity fixes (sortOrder in conversions, financial recomputation in duplicate route), and custom validation agents.

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
- **Item ordering:** Verify line items maintain their sortOrder through conversion (items should appear in the same order in the converted document)
- **Duplicate financial integrity:** Duplicate a quotation and verify subtotal/vatAmount/grandTotal are recomputed server-side (not just copied)

### 5. List Page & Dashboard Performance
- **Status counts:** Verify dashboard AND all 4 list pages (Quotations, Invoices, Billings, Receipts) show correct counts for each status
- **Query efficiency:** Dashboard and all list pages should use `groupBy` aggregates (check server logs — should NOT fetch all records or make multiple count() calls)

### 6. Role-Based Access
- **ADMIN:** Can see all documents across all users
- **SALES:** Can only see own documents (filtered by `createdById`)

### 7. Interactive Status Toggles (June 17 updates)
- **Visual indicators:** Open dashboard and list pages, verify all status badges show a clear dropdown arrow (`▼`) indicating interactivity.
- **Homepage select dropdown action:** Click on any status selector in the "Recent Activities" widgets. Verify the dropdown opens natively and changing the status successfully updates the database without triggering page navigation.
- **List views updates:** Verify inline status switches work on Quotations, Invoices, Billings, Receipts, and Deliveries list pages.

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

### Interactive Dropdowns inside Clickable Rows
- **CRITICAL:** When rendering a custom status dropdown selector inside list rows that navigate to details pages (like on the Dashboard widgets), **never nest the `<select>` tag inside a `<Link>` or `<a>` element**.
- Nesting interactive elements inside anchor tags triggers event conflicts, and using `e.preventDefault()` on parent elements to stop navigation will also block the browser's default action of opening the select dropdown.
- Always use a split row layout where the details/Link part and the status dropdown container are rendered as sibling elements.

### Debug Endpoints
- Debug PDF endpoints (`/api/debug-pdf`, `/api/debug-pdf/test`) have been removed (cleaned up 2026-05-13).

### Custom Validation Agents
Two custom agents are available for automated codebase validation:
- **pdf-validator** (`~/.claude/agents/pdf-validator.md`) — 10 checks for PDF rendering integrity (createElement, hyphenation, fonts, Thai text). Invoke: "use the pdf-validator agent"
- **lifecycle-validator** (`~/.claude/agents/lifecycle-validator.md`) — 12 checks for document lifecycle correctness (conversions, ownership, idempotency, financial integrity). Invoke: "use the lifecycle-validator agent"

# Project Overview: BlessMe Topping Quotation App

## Project Status
Full-featured document management system for Quotations, Invoices, Billing Notes, and Receipts, built for **BlessMe Topping Co., Ltd.** Production-deployed on Vercel with Turso database.

## Key Features
- **Document Lifecycle:** Quotation → Invoice → Billing Note → Receipt with one-click conversion
- **Bilingual Interface:** Thai primary, English secondary across UI and PDF documents
- **Commercial Grade PDF:** Professional bilingual PDFs with Sarabun font, shared component architecture, robust Arabic numeral formatting, and Thai Baht Text conversion
- **Role-Based Access:** ADMIN (full access) and SALES (own documents only) via NextAuth.js
- **Data Management:** Clients, Products, and Company Settings modules
- **Server-Side Financial Integrity:** Line totals recomputed server-side on every write

## Technical Stack
- **Framework:** Next.js 16 (App Router), React 19
- **Styling:** Tailwind CSS 4
- **Database:** Prisma ORM with LibSQL/Turso, indexes on status/createdById/createdAt
- **PDFs:** @react-pdf/renderer with shared component architecture (PDFLayout, pdfStyles, pdfFonts)
- **Auth:** NextAuth.js v5 (credentials provider, JWT sessions)
- **Validation:** Zod schemas for all document types and entities
- **Caching:** Company settings cached with 1-minute TTL for PDF generation

## Changelog

### May 12-13, 2026 — Receipt Module, PDF Critical Fix & createElement Migration
- **Receipt Functionality:** Added Receipt model and module with "Waiting/Issued/Cancelled" status toggle via `ReceiptActions.tsx`. PATCH API at `/api/receipts/[id]`.
- **CRITICAL PDF Fix — createElement Migration:**
    - **Root cause 1:** Turbopack's JSX transform produces multi-child Text nodes that `@react-pdf/renderer` silently drops on Vercel serverless. Converted ALL PDF components (`PDFLayout.tsx`, `QuotationPDFDocument.tsx`, `InvoicePDFDocument.tsx`, `BillingPDFDocument.tsx`, `ReceiptPDFDocument.tsx`) from JSX to `createElement()`.
    - **Root cause 2:** Hyphenation callback returned `[]` (empty array) for non-Thai words (numbers, English text, emails, dates). `@react-pdf/renderer` interprets empty array as "zero syllables" and renders nothing. Fixed to return `[word]`.
    - These two bugs combined made all Latin/ASCII content (document numbers, dates, phone numbers, emails, tax IDs, quantities, English bilingual labels) invisible in production PDFs.
- **Commercial Grade PDF:**
    - Forced Arabic numerals (latn) in all PDF values.
    - Added professional Thai Baht Text conversion (e.g. "หนึ่งพันบาทถ้วน") for totals.
    - Added smart document titling based on VAT (Receipt/Tax Invoice vs Receipt).
    - Added `customerEmail` field to all 4 PDF document types.
- **Dashboard:** Integrated Receipt statistics and recent activity feed.

### May 13, 2026 — Performance & Data Integrity Fixes, Custom Agents
- **Performance:** Replaced client-side status counting with Prisma `groupBy` on all 4 list pages (Quotations, Invoices, Billings, Receipts). Each page now makes exactly 2 DB queries (`groupBy` + `findMany`) instead of fetching all records or making 4 separate `count()` calls.
- **Data Integrity:** All 4 conversion routes now query items with `orderBy: { sortOrder: "asc" }` for deterministic item ordering during document conversion.
- **Security:** Duplicate route now recomputes `lineTotal`, `subtotal`, `vatAmount`, `grandTotal` server-side instead of copying directly from original, consistent with all conversion routes.
- **Cleanup:** Removed empty debug-pdf directories and stale to_reviewer.md references.
- **Custom Agents:** Created `pdf-validator` and `lifecycle-validator` agents for automated validation of PDF rendering and document lifecycle integrity.

### April 20, 2026 — PDF Thai Text Clipping Fix
- Fixed customer name truncation in PDFs (closing parenthesis clipped on long Thai names)
- Root cause: `@react-pdf/renderer` clips last character of Thai text without trailing space buffer
- Added `paddingRight` to customer text styles for additional protection
- Removed invalid CSS properties (`wordBreak`, `flexWrap`) not supported by @react-pdf/renderer

### April 17, 2026 — Security Hardening & Performance Optimization (4 Phases)

#### Phase 1: CRITICAL Security Fixes
- Added ownership guards to invoice/billing routes (SALES users restricted to own documents)
- Implemented Zod enum validation for all document statuses
- Server-side financial data verification: `lineTotal = quantity * unitPrice`
- Fixed PDF hyphenation callback return types

#### Phase 2: Performance Optimization
- Added database indexes on status, createdById, createdAt for all document models
- Replaced full-table scans with `groupBy` aggregates on dashboard
- Implemented 1-minute company settings cache for PDF generation

#### Phase 3: Maintainability — PDF Refactor
- Extracted shared PDF components into `src/components/pdf/shared/`
- Created style factory with parameterized accent colors (green=Quotation, blue=Invoice/Billing)
- Reduced PDF code: 880 lines → 639 lines (27% reduction)

#### Phase 4: Quick Wins
- Added `npm run typecheck` script
- Added HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Replaced hardcoded seed password with `SEED_ADMIN_PASSWORD` environment variable

### April 5, 2026 — Dashboard & Document Workflow
- Redesigned dashboard with statistics for all document types and "Recent Activity" feeds
- Added dedicated `/quotations` page with filtered list management
- Updated Sidebar navigation between Dashboard and document modules
- Finalized Invoice and Billing Note conversion cycles with bilingual PDF support

### March 31, 2026 — Initial Invoice & Billing Note Support
- Added Invoice and Billing Note models, API routes, and PDF templates
- Implemented bilingual PDF output (Thai/English)
- Fixed Thai text wrapping and truncation in PDFs
- Added document conversion action buttons

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

### May 12, 2026 — Receipt Module & Commercial Grade PDF Fixes
- **Receipt Functionality:** Added Receipt model and module with "Waiting/Issued" status toggle.
- **Commercial Grade PDF:**
    - Forced Arabic numerals (latn) in all PDF values to fix server-side rendering issues.
    - Implemented structural integrity fixes (View wrapping) to prevent numerical data clipping by Thai text.
    - Added professional Thai Baht Text conversion (e.g. "หนึ่งพันบาทถ้วน") for totals.
    - Added smart document titling based on VAT (Receipt/Tax Invoice vs Receipt).
- **Dashboard:** Integrated Receipt statistics and recent activity feed.

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

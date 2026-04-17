# Project Overview: BlessMe Topping Quotation App

## Project Status
The application is a full-featured management system for Quotations, Invoices, and Billing Notes, designed for **BlessMe Topping Co., Ltd.** It is built with Next.js 16, Prisma, and Turso (LibSQL).

## Key Features
- **Bilingual Interface:** Support for both Thai and English labels across the UI and PDF documents.
- **Workflow Automation:**
    - Quotation (Accepted) -> Invoice
    - Invoice (Unpaid) -> Billing Note (ใบวางบิล)
- **PDF Generation:** Professional, bilingual PDF exports with optimized Thai typography (Sarabun font) and proper line wrapping for long remarks.
- **Role-Based Access:** ADMIN and SALES roles via NextAuth.js.
- **Data Management:** Management modules for Clients, Products, and Company Settings.

## Technical Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** TailwindCSS 4
- **Database:** Prisma ORM with LibSQL/Turso
- **PDFs:** @react-pdf/renderer
- **Auth:** NextAuth.js v5

## Recent Updates

### April 17, 2026 — CRITICAL Security Hardening & Performance Optimization
**All 4 phases completed and deployed to production:**

#### Phase 1: CRITICAL Security Fixes
- ✅ Added ownership guards to invoice/billing routes (prevent SALES user from accessing other users' documents)
- ✅ Implemented Zod enum validation for all document statuses (no arbitrary values allowed)
- ✅ Server-side financial data verification: `lineTotal = quantity * unitPrice` (prevents fraud)
- ✅ Fixed PDF hyphenation callback return types

#### Phase 2: Performance Optimization
- ✅ Added database indexes on status, createdById, createdAt for all document models
- ✅ Replaced full-table scans with `groupBy` aggregates on dashboard (for count-only queries)
- ✅ Implemented 1-minute company settings cache (90% reduction in PDF DB round-trips)

#### Phase 3: Maintainability — PDF Refactor
- ✅ Extracted shared PDF components: `PDFLayout.tsx` (header, table, totals, signatures)
- ✅ Created `pdfStyles.ts` factory for parameterized accent colors (green for Quotation, blue for Invoice/Billing)
- ✅ Created `pdfFonts.ts` with hoisted font registration and Thai hyphenation logic
- ✅ Refactored all 3 PDF documents: 880 lines → 639 lines (27% reduction)

#### Phase 4: Quick Wins
- ✅ Added TypeScript typecheck script: `npm run typecheck`
- ✅ Added HTTP security headers (nosniff, DENY frames, HSTS)
- ✅ Replaced hardcoded seed password with `SEED_ADMIN_PASSWORD` environment variable

**Build Status:** ✓ TypeScript: No errors | ✓ ESLint: 0 errors | ✓ Production ready

### April 5, 2026
- **Dashboard Refactor:** Redesigned the home dashboard to provide a high-level overview with statistics for Quotations, Invoices, and Billing Notes, including "Recent Activity" feeds for each.
- **Navigation & Routing:** Added a dedicated `/quotations` page for filtered list management and updated the Sidebar for better navigation between the Dashboard and document modules.
- **Documentation:** Extensively updated `CLAUDE.md` with architectural details, document lifecycles (Quotation → Invoice → Billing Note), and Turso-specific manual migration guides.
- **PDF & Workflow:** Finalized Invoice and Billing Note conversion cycles with bilingual PDF support and optimized Thai typography.

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

## Recent Updates (March 31, 2026)
- Implemented full Invoice and Billing Note conversion cycles.
- Fixed Thai character truncation in PDFs by increasing column widths and optimizing hyphenation logic.
- Standardized bilingual labeling across all exported documents.
- Synced production database schema for new models.

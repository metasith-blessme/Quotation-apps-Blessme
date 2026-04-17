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

## Recent Updates (April 5, 2026)
- **Dashboard Refactor:** Redesigned the home dashboard to provide a high-level overview with statistics for Quotations, Invoices, and Billing Notes, including "Recent Activity" feeds for each.
- **Navigation & Routing:** Added a dedicated `/quotations` page for filtered list management and updated the Sidebar for better navigation between the Dashboard and document modules.
- **Documentation:** Extensively updated `CLAUDE.md` with architectural details, document lifecycles (Quotation → Invoice → Billing Note), and Turso-specific manual migration guides.
- **PDF & Workflow:** Finalized Invoice and Billing Note conversion cycles with bilingual PDF support and optimized Thai typography.

# Codebase Map: BlessMe Topping Quotation App

This document outlines the codebase directory structure, key components, and source code flow.

---

## 📂 Directory Layout

```
quotation-app/
├── docs/                 # System documentation & agent rules
├── prisma/               # Database schemas and seed data
│   ├── schema.prisma     # Relational database schema
│   └── seed.ts           # Development & initial setup seeding scripts
├── src/
│   ├── app/              # Next.js 16 App Router pages
│   │   ├── (app)/        # Authentication-protected app routes
│   │   │   ├── dashboard/# Main user statistics and KPI charts
│   │   │   ├── quotations/# Quotation forms & list view
│   │   │   ├── invoices/ # Invoice conversions & viewer
│   │   │   ├── billings/ # Billing note groupings
│   │   │   ├── receipts/ # Receipt collections & status switches
│   │   │   ├── deliveries/# Shipment tracking & dispatch grids
│   │   │   ├── products/ # Combined stock grids & CRUD
│   │   │   ├── clients/  # Customer lists & detail pages
│   │   │   └── settings/ # Organization profiles & PDF configs
│   │   ├── (auth)/       # Public routes (Login page)
│   │   ├── api/          # Internal REST JSON API endpoints
│   │   └── layout.tsx    # General document template wrapper
│   ├── components/       # Shared React UI component library
│   │   └── pdf/          # Sarabun bilingual PDF rendering templates
│   └── lib/              # Shared logic core, ORM adapters, helpers
│       ├── auth.ts       # NextAuth credential and session configurations
│       ├── db.ts         # Prisma Client instantiation
│       ├── document-lifecycle.ts # DB transaction document transition handlers
│       ├── pdf.ts        # Unified PDF compilation engine
│       └── validations/  # Centralized Zod request schemas
```

---

## 🔑 Crucial Architectural Files

### 1. Unified PDF Compiler
* **Path**: `src/lib/pdf.ts`
* **Purpose**: Employs Prisma dynamic delegates and `React.createElement` wrappers to build professional PDF documents for all document models cleanly, minimizing code duplication.

### 2. Transaction-Safe Life Cycles
* **Path**: `src/lib/document-lifecycle.ts`
* **Purpose**: Encapsulates DB transaction operations that transition documents from one stage to another (e.g. Quotation to Invoice) ensuring atomic commits.

### 3. Zod Schemas Core
* **Path**: `src/lib/validations/shared.schema.ts`
* **Purpose**: Declares core customer detail structure validations and extends them cleanly across the specialized schema structures (`quotationSchema`, `invoiceSchema`, etc.) using Zod `.extend()` modifiers.

---

## ⚡ Setup & Development Workflow

### Commands Reference:
* **Seed Database**: `npx prisma db seed`
* **Sync Schema**: `npx prisma db push`
* **Run Local Server**: `npm run dev`
* **Build Verification**: `npm run typecheck && npm run build`
* **Deploy to Production**: `npx vercel --prod`

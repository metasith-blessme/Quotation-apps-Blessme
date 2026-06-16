Blessme Quotation & Document Management SystemA robust, enterprise-grade business automation and document lifecycle management system built specifically for the Blessme brand (Blessme Smoothie Bar, SomSaiJai, and Blessme Topping).This platform automates the creation, tracking, state transitions, and PDF compilation of key business documents: Quotations, Invoices, Billings, and Receipts, alongside Product Stock and Client management.🚀 Key Features🔄 Automated Document Lifecycle Engine: Implements a strict, deterministic state machine (document-lifecycle.ts) to manage transitions:$$\text{Quotation} \longrightarrow \text{Invoice} \longrightarrow \text{Billing (Delivery/Billing)} \longrightarrow \text{Receipt}$$🧾 Thai Font & Text Support: Seamless rendering of local Thai context, including native BahtText translations (thai-text.ts) and PDF compilation using the Sarabun Thai font.📦 Inventory & Stock Management: Live product stock tracking (ProductStock schema) with warnings for low inventory.📊 Interactive Dashboard: Business health monitoring with interactive charts depicting outstanding receivables, pipeline totals, and historical conversion metrics.🔒 Secure Authentication: Robust session-based security powered by NextAuth.js.📄 Perfect PDF Generation: Server-compiled, printer-ready PDFs using @react-pdf/renderer with real-time browser preview modals.🛠️ Tech StackFramework: Next.js (App Router, React Server Components)Language: TypeScriptDatabase ORM: PrismaDatabase Target: SQLite (Local Dev) / Turso (libSQL) (Production)Styling: Tailwind CSSAuthentication: NextAuth.jsPDF Engine: @react-pdf/renderer📁 Repository Structure├── prisma/
│   ├── migrations/            # Database evolution scripts
│   ├── schema.prisma          # Database models (User, Client, Product, Quotation, etc.)
│   └── seed.ts                # Database seed script for dev environments
├── public/
│   ├── fonts/                 # Thai Sarabun Fonts (Regular & Bold)
│   └── logo.png               # Brand Asset Logos
├── scratch/                   # Utility/Maintenance scripts (database pushes, PDF compilers)
└── src/
    ├── app/
    │   ├── (app)/             # Logged-in application layout and client dashboards
    │   ├── (auth)/            # Authentication portal (Login)
    │   └── api/               # API endpoints (Documents, Clients, Products, PDF compilations)
    ├── components/
    │   ├── layout/            # Navigation sidebars, topbars, dynamic layouts
    │   ├── pdf/               # React-PDF Document definitions and layout previews
    │   └── quotation/         # Dynamic forms, client pickers, and item calculators
    └── lib/
        ├── auth.ts            # NextAuth options and middleware providers
        ├── document-lifecycle.ts # The document sequence & status state machine
        ├── financial-calculator.ts # Precise VAT, discounts, and total calculators
        └── thai-text.ts       # Thai BathText converter utility
⚙️ Document Lifecycle State MachineThe platform implements a controlled state machine to prevent process violations (e.g., creating a Receipt for an unpaid Billing). Below is the document migration flow:    [ Quotation ]
         │ (Approve & Convert)
         ▼
     [ Invoice ]
         │ (Deliver & Bill)
         ▼
    [ Billing / Delivery ]
         │ (Record Payment)
         ▼
     [ Receipt ]
Each stage generates dedicated, sequentially-numbered PDF variants and locks the preceding stages to ensure data integrity for accounting audits.🛠️ Getting Started1. PrerequisitesNode.js: Ensure Node.js (v18.x or newer) is installed.npm or pnpm: Package manager.2. InstallationClone the repository and install dependencies:git clone https://github.com/metasith-blessme/quotation-apps-blessme.git
cd quotation-apps-blessme
npm install
3. Environment VariablesCreate a .env file in the root directory:# Database configuration (SQLite locally, or connection string for Turso)
DATABASE_URL="file:./dev.db"

# NextAuth secrets
NEXTAUTH_SECRET="your_generate_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Developer flag (if applicable)
NODE_ENV="development"
4. Database Setup & SeedingInitialize your database, apply migrations, and seed default user/product catalogs:# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev --name init

# Run seed data (Creates admin user and mock products/clients)
npx prisma db seed
5. Running the ApplicationLaunch the local development server:npm run dev
Open http://localhost:3000 in your browser. Use the seed accounts (found inside prisma/seed.ts) to log in.🧪 Maintenance & Utility Scripts (/scratch)The scratch/ directory contains highly useful, standalone tools for database administration and system audits:push-db.ts: Safely syncs schema adjustments without forcing fresh migration files.seed-report-data.ts: Fills the database with rich historical metrics to test dashboard graphs.generate-user-manual-pdf.js: Generates updated PDF copies of user instructions automatically.test-document-lifecycle.ts: Automatically runs end-to-end simulation audits testing state conversion logic.📝 LicenseThis system is proprietary to Blessme Brand. Unauthorized redistribution or modification is strictly prohibited.

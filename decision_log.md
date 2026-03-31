# Decision Log: March 31, 2026

## 1. Bilingual PDF Output
- **Decision:** Shift from Thai-only to Bilingual (Thai/English) labels in all PDF documents (Quotation, Invoice, Billing Note).
- **Rationale:** The user requested bilingual output to improve professional appearance and accessibility. It also provides a fallback if Thai character rendering issues persist in specific viewers.

## 2. Thai Typography Fix (Hyphenation)
- **Decision:** Replace the restrictive `Font.registerHyphenationCallback((word) => [word])` with a logic that allows breaking long strings (over 15 chars) into smaller chunks.
- **Rationale:** Thai text often lacks spaces, causing `@react-pdf/renderer` to treat entire paragraphs as single words. The restrictive callback caused text to be truncated rather than wrapped. The new chunking strategy forces wrap points.

## 3. Manual Database Sync for Production
- **Decision:** Used a Node.js script with `@libsql/client` to manually create new tables (`Invoice`, `Billing`, etc.) in the Turso production database.
- **Rationale:** Standard `prisma migrate dev` or `db push` commands through the Prisma CLI were failing due to lack of native `libsql://` scheme support in the CLI environment. Manual SQL execution ensured production stability without environment mismatch issues.

## 4. Invoice-to-Billing Inheritance
- **Decision:** Automatically carry over all `notes` and `termsSnapshot` from Invoices to Billing Notes during conversion.
- **Rationale:** Preserving user remarks is critical for business consistency. Users should not have to re-type remarks at each stage of the document lifecycle.

## 5. Billing Note Distinctive Styling
- **Decision:** Used a blue color scheme for Billing Notes (#3b82f6), contrasting with the green used for Quotations and Invoices.
- **Rationale:** Helps users visually distinguish between different document types at a glance.

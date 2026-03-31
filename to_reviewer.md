# Reviewer Instructions: March 31 Updates

## Summary of Changes
- Added full support for **Invoices** and **Billing Notes**.
- Updated all PDF templates (`QuotationPDFDocument`, `InvoicePDFDocument`, `BillingPDFDocument`) to be bilingual.
- Fixed Thai text wrapping and truncation issues in PDFs.
- Added "Convert" action buttons to automate the document lifecycle.

## Areas to Verify
1. **PDF Wrapping:** Verify that long remarks in the "Notes" section of any document wrap correctly onto new lines without being cut off at the right edge.
2. **Data Inheritance:** When converting an Invoice to a Billing Note, ensure the `Ref INV:` field shows the correct invoice number and the remarks are preserved.
3. **Bilingual UI:** Check the sidebar and table headers for consistent Thai/English labeling.

## Maintenance Notes
- **Prisma Schema:** Any future additions to the database schema may require manual SQL execution on Turso if the Prisma CLI continues to reject the `libsql://` scheme. Use the pattern found in the session's `sync-db-manual.js` history if needed.
- **Fonts:** Thai fonts are loaded from `public/fonts/Sarabun-*.ttf`. If adding new document types, ensure these fonts are registered in the PDF component.

## Database Models Added
- `Invoice` & `InvoiceItem`
- `Billing` & `BillingItem`
- `INVSequence` & `BNSequence` (for numbering)

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Font, Document, Page, Text, View } from "@react-pdf/renderer";

// Register font the same way pdfFonts.ts does
Font.register({
  family: "Sarabun",
  fonts: [
    { src: "https://fonts.gstatic.com/s/sarabun/v17/DtVjJx26TKEr37c9WBI.ttf", fontWeight: "normal" },
    { src: "https://fonts.gstatic.com/s/sarabun/v17/DtVmJx26TKEr37c9YK5sulw.ttf", fontWeight: "bold" },
  ],
});

export async function GET() {
  const h = createElement;
  const num = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(85.60);

  const doc = h(Document, null,
    h(Page, { size: "A4", style: { fontFamily: "Sarabun", fontSize: 14, padding: 40 } },
      h(Text, null, `Test 1 — String literal: ฿85.60 `),
      h(Text, null, `Test 2 — formatNumber: ฿${num} `),
      h(Text, null, `Test 3 — Thai: บริษัท เฮิร์บแคร์นภา จำกัด `),
      h(Text, null, `Test 4 — Doc number: RC-2026-001 `),
      h(Text, null, `Test 5 — Date: 12/05/2569 `),
      h(View, { style: { flexDirection: "row", marginTop: 20 } },
        h(Text, null, "Test 6 — Row: "),
        h(Text, { style: { fontWeight: "bold" } }, `฿${num} `),
      ),
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any);

  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="test.pdf"',
    },
  });
}

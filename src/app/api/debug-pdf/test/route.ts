import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Font, Document, Page, Text, View } from "@react-pdf/renderer";

Font.register({
  family: "Sarabun",
  fonts: [
    { src: "https://fonts.gstatic.com/s/sarabun/v17/DtVjJx26TKEr37c9WBI.ttf", fontWeight: "normal" },
    { src: "https://fonts.gstatic.com/s/sarabun/v17/DtVmJx26TKEr37c9YK5sulw.ttf", fontWeight: "bold" },
  ],
});

export async function GET() {
  const h = createElement;

  // Test different combinations of Thai + Latin/digits
  const doc = h(Document, null,
    h(Page, { size: "A4", style: { fontFamily: "Sarabun", fontSize: 12, padding: 40 } },
      // Test 1: Pure digits (like document number)
      h(Text, null, `Pure digits: RC-2026-001 `),
      // Test 2: Pure email
      h(Text, null, `Pure email: blessme.team@gmail.com `),
      // Test 3: Phone number
      h(Text, null, `Phone: 0971378904 `),
      // Test 4: Date
      h(Text, null, `Date: 12/05/2569 `),
      // Test 5: Thai label + digits (like company phone)
      h(Text, null, `โทร: 0971378904 `),
      // Test 6: Tax ID
      h(Text, null, `เลขภาษี: 0105562041374 `),
      // Test 7: Simulating DocumentInfo structure
      h(View, { style: { flexDirection: "row", justifyContent: "flex-end" } },
        h(View, { style: { width: 220 } },
          h(View, { style: { flexDirection: "row", justifyContent: "space-between" } },
            h(View, { style: { flex: 1 } },
              h(Text, { style: { fontSize: 9 } }, `เลขที่ / No: `),
            ),
            h(View, { style: { minWidth: 100, alignItems: "flex-end" } },
              h(Text, { style: { fontWeight: "bold", fontSize: 9 } }, `RC-2026-001 `),
            ),
          ),
          h(View, { style: { flexDirection: "row", justifyContent: "space-between" } },
            h(View, { style: { flex: 1 } },
              h(Text, { style: { fontSize: 9 } }, `วันที่ / Date: `),
            ),
            h(View, { style: { minWidth: 100, alignItems: "flex-end" } },
              h(Text, { style: { fontWeight: "bold", fontSize: 9 } }, `12/05/2569 `),
            ),
          ),
        ),
      ),
      // Test 8: Quantity in table-like structure
      h(View, { style: { flexDirection: "row", marginTop: 10 } },
        h(Text, { style: { width: 30 } }, `1 `),
        h(Text, { style: { flex: 1 } }, `เม็ดป็อปถั่วแดง `),
        h(Text, { style: { width: 50, textAlign: "center" } }, `ลัง `),
        h(Text, { style: { width: 75, textAlign: "right" } }, `1 `),
        h(Text, { style: { width: 85, textAlign: "right" } }, `฿80.00 `),
        h(Text, { style: { width: 85, textAlign: "right" } }, `฿80.00 `),
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

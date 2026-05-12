import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ReceiptPDFDocument } from "@/components/pdf/ReceiptPDFDocument";

export async function GET() {
  const receipt = {
    rcNumber: "RC-2026-001",
    issueDate: "2026-05-12T04:05:44.558Z",
    customerName: "บริษัท กันยารัตน์ คอร์ปอเรชั่น จำกัด (สำนักงานใหญ่)",
    customerAddress: "41/1 หมู่ที่4 ตำบลกระทุ่มล้ม อำเภอสามพราน จังหวัดนครปฐม 73220",
    customerTaxId: "0-7355-63002-42-3",
    customerPhone: "0966910156",
    customerEmail: "test@example.com",
    customerContact: "นายภัคพล ทิพย์ปัญญา",
    subtotal: 80,
    vatRate: 7,
    vatAmount: 5.6,
    grandTotal: 85.6,
    notes: "",
    termsSnapshot: "",
    items: [
      {
        productNameTh: "เม็ดป็อปถั่วแดง",
        productNameEn: null,
        unit: "ลัง",
        quantity: 1,
        unitPrice: 80,
        lineTotal: 80,
      },
    ],
  };

  const company = {
    nameTh: "บริษัท เฮิร์บแคร์นภา จำกัด",
    nameEn: null,
    address: "193/1 หมู่ที่ 13 ตำบลเขาสมอคอน อำเภอท่าวุ้ง จ.ลพบุรี 15180",
    taxId: "0105562041374",
    phone: "0971378904",
    email: "blessme.team@gmail.com",
    logoPath: null,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(ReceiptPDFDocument as any, { receipt, company });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="test-receipt.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

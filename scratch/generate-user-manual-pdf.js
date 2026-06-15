const { Font, Document, Page, Text, View, StyleSheet, renderToFile } = require("@react-pdf/renderer");
const React = require("react");
const path = require("path");

// Register Sarabun font (Google Fonts CDN urls)
const SARABUN_REGULAR = "https://fonts.gstatic.com/s/sarabun/v17/DtVjJx26TKEr37c9WBI.ttf";
const SARABUN_BOLD = "https://fonts.gstatic.com/s/sarabun/v17/DtVmJx26TKEr37c9YK5sulw.ttf";

Font.register({
  family: "Sarabun",
  fonts: [
    { src: SARABUN_REGULAR, fontWeight: "normal" },
    { src: SARABUN_BOLD, fontWeight: "bold" },
  ],
});

// Configure Thai hyphenation callback (so it doesn't crash react-pdf on Thai words)
Font.registerHyphenationCallback((word) => {
  return [word];
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Sarabun",
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#374151",
  },
  titleContainer: {
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#16a34a",
    paddingBottom: 10,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  section: {
    marginBottom: 12,
  },
  heading1: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    borderBottomWidth: 0.8,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 3,
    marginTop: 12,
    marginBottom: 6,
  },
  heading2: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#16a34a",
  },
  paragraph: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 6,
    textAlign: "justify",
  },
  bulletList: {
    marginLeft: 10,
    marginBottom: 8,
  },
  bulletItemRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    width: 8,
    fontSize: 9,
    color: "#16a34a",
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: "#4b5563",
  },
  diagramContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  diagramText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#16a34a",
  },
  callout: {
    backgroundColor: "#eff6ff",
    borderLeftWidth: 2,
    borderLeftColor: "#3b82f6",
    padding: 8,
    marginVertical: 6,
    borderRadius: 3,
  },
  calloutTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 1,
  },
  calloutText: {
    fontSize: 8.5,
    color: "#1e40af",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#f3f4f6",
    paddingTop: 6,
    textAlign: "center",
    fontSize: 7.5,
    color: "#9ca3af",
  }
});

const BulletItem = ({ text }) => (
  React.createElement(View, { style: styles.bulletItemRow },
    React.createElement(Text, { style: styles.bullet }, "•"),
    React.createElement(Text, { style: styles.bulletText }, text)
  )
);

const UserManualDocument = () => (
  React.createElement(Document, null,
    // Page 1
    React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(View, { style: styles.titleContainer },
        React.createElement(Text, { style: styles.title }, "คู่มือการใช้งานระบบ BlessMe Topping Quotation App"),
        React.createElement(Text, { style: styles.subtitle }, "บริษัท เบลสมี ท็อปปิ้ง จำกัด (BlessMe Topping Co., Ltd.) • คู่มือฝึกอบรมพนักงานและผู้ร่วมก่อตั้ง")
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading1 }, "1. ภาพรวมระบบและบทบาทผู้ใช้งาน (System Overview & User Roles)"),
        React.createElement(Text, { style: styles.paragraph }, 
          "ระบบจัดทำเอกสารและติดตามการจัดส่งนี้ ได้รับการออกแบบขึ้นมาเพื่อใช้งานใน บริษัท เบลสมี ท็อปปิ้ง จำกัด " +
          "ช่วยควบคุมเอกสารทางการค้าและการขายของฝ่ายขาย (SALES) และอำนวยความสะดวกให้ผู้บริหารหรือผู้ดูแลระบบ (ADMIN) ในการกำกับดูแล"
        ),
        React.createElement(Text, { style: styles.heading2 }, "สิทธิ์การเข้าถึงและการแบ่งระดับพนักงาน:"),
        React.createElement(View, { style: styles.bulletList },
          React.createElement(BulletItem, { text: "ผู้ดูแลระบบ (ADMIN): สามารถเห็นเอกสารของทุกคนในบริษัท, สามารถแก้ไขและจัดการข้อมูลสินค้าคงคลัง, ข้อมูลบริษัท และจัดการจัดส่งสินค้าทั้งหมด" }),
          React.createElement(BulletItem, { text: "พนักงานขาย (SALES): เห็นเฉพาะเอกสารของตัวเอง (ใบเสนอราคา, ใบแจ้งหนี้, ใบเสร็จ) เพื่อป้องกันความปลอดภัยของรายชื่อลูกค้า, และสามารถดูยอดสต๊อกได้แบบอ่านอย่างเดียว" })
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading1 }, "2. การจัดการข้อมูลพื้นฐาน (Master Data Management)"),
        React.createElement(Text, { style: styles.heading2 }, "ข้อมูลลูกค้า (Clients):"),
        React.createElement(Text, { style: styles.paragraph }, 
          "เมนูสำหรับบันทึกข้อมูลหลักของลูกค้า ได้แก่ ชื่อ ที่อยู่ เบอร์โทร เลขประจำตัวผู้เสียภาษี และอีเมล " +
          "ซึ่งเป็นข้อมูลสำคัญที่ระบบจะดึงเข้าสู่หัวกระดาษของเอกสารต่าง ๆ โดยอัตโนมัติ"
        ),
        React.createElement(Text, { style: styles.heading2 }, "สินค้าและสต๊อกสินค้าเม็ดป็อป (Products & Boba Inventory):"),
        React.createElement(Text, { style: styles.paragraph }, 
          "สินค้ากลุ่มเม็ดป็อปจะมีตารางสต๊อกจริง (แปะฉลาก, แกะแล้ว, ฉลากจีน, แพ็ค 1/2/3 ถุง) ซึ่งระบบจะคำนวณถุงรวมให้อัตโนมัติ"
        ),
        React.createElement(Text, { style: styles.paragraph }, 
          "ปุ่ม 'ใช้โครงสร้างราคามาตรฐาน' จะใส่ราคาส่ง 7 ระดับตามโครงสร้างของบริษัททันที (115/100/90/80/75/70/65 บาท) " +
          "และหากสินค้าเป็นชนิดชีส (Cheese) ระบบจะทำการบวกราคาเพิ่มให้โดยอัตโนมัติ +30 บาท ในทุกระดับราคา"
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading1 }, "3. ขั้นตอนการทำงานและวงจรเอกสาร (Document Lifecycle & Workflow)"),
        React.createElement(Text, { style: styles.paragraph }, 
          "ระบบควบคุมความถูกต้องทางการเงิน (Financial Integrity) โดยระบบจะทำการคำนวณและตรวจสอบราคาสินค้ารวมภาษี VAT 7% " +
          "ที่ฝั่งเซิร์ฟเวอร์ทุกครั้งที่มีการบันทึกเอกสาร เพื่อตัดความเสี่ยงเรื่องข้อผิดพลาดทางบัญชี"
        ),
        React.createElement(View, { style: styles.diagramContainer },
          React.createElement(Text, { style: styles.diagramText }, "ใบเสนอราคา (Quotation) ➔ ใบแจ้งหนี้ (Invoice) ➔ ใบวางบิล (Billing Note) ➔ ใบเสร็จรับเงิน (Receipt)")
        )
      ),

      React.createElement(Text, { style: styles.footer, render: ({ pageNumber, totalPages }) => `หน้า ${pageNumber} จาก ${totalPages}` })
    ),

    // Page 2
    React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading2 }, "ขั้นตอนการสร้างและการแปลงเอกสาร (One-click Conversion):"),
        React.createElement(View, { style: styles.bulletList },
          React.createElement(BulletItem, { text: "ใบเสนอราคา (Quotation): เริ่มต้นสร้างใบเสนอราคาให้ลูกค้า เมื่อลูกค้าอนุมัติ (ACCEPTED) จะปลดล็อคขั้นตอนถัดไป" }),
          React.createElement(BulletItem, { text: "ใบแจ้งหนี้ (Invoice): ในหน้าใบเสนอราคาที่รับการอนุมัติแล้ว กดปุ่ม 'แปลงเป็นใบแจ้งหนี้' เพื่อบันทึกยอดหนี้" }),
          React.createElement(BulletItem, { text: "ใบวางบิล (Billing Note): ใช้คัดลอกข้อมูลสินค้าและมูลค่าเพื่อนำส่งเรียกเก็บเงินตามรอบเครดิตเทอม" }),
          React.createElement(BulletItem, { text: "ใบเสร็จรับเงิน (Receipt): เมื่อมีการโอนเงินสำเร็จ กด 'แปลงเป็นใบเสร็จรับเงิน' เพื่อออกใบกำกับภาษีอย่างย่อ/เต็มรูปแบบ" })
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading1 }, "4. ระบบติดตามการจัดส่งสินค้า (Delivery Tracking System)"),
        React.createElement(Text, { style: styles.paragraph }, 
          "เมื่อมีการออกใบแจ้งหนี้ (Invoice) ในระบบ ออร์เดอร์จัดส่งสินค้าจะถูกบันทึกเข้าหน้าจัดส่งให้อัตโนมัติ"
        ),
        React.createElement(Text, { style: styles.heading2 }, "การเข้าใช้งานและตรวจสอบ:"),
        React.createElement(View, { style: styles.bulletList },
          React.createElement(BulletItem, { text: "หน้าการจัดส่ง (Deliveries Page): แสดงออร์เดอร์แบ่งออกเป็น 2 แท็บคือ 'ยังไม่ส่ง / Pending' และ 'ส่งแล้ว / Delivered'" }),
          React.createElement(BulletItem, { text: "การอัปเดตสถานะ: พนักงานสามารถกดปุ่มสีเขียวเพื่อย้ายรายการไปที่ 'ส่งแล้ว' หรือกดย้อนกลับหากต้องการแก้ไขข้อมูล" }),
          React.createElement(BulletItem, { text: "สิทธิ์ความปลอดภัย: SALES จัดการจัดส่งได้เฉพาะออร์เดอร์ของตัวเอง, ADMIN สามารถอัปเดตออร์เดอร์ได้ทั้งหมด" })
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading1 }, "5. ข้อควรระวังและแนวทางปฏิบัติที่ดีที่สุด (Warnings & Best Practices)"),
        React.createElement(View, { style: styles.callout },
          React.createElement(Text, { style: styles.calloutTitle }, "ข้อควรระวัง: การพิมพ์ภาษาไทยลงเอกสาร PDF"),
          React.createElement(Text, { style: styles.calloutText }, 
            "เมื่อสร้างชื่อลูกค้าหรือข้อมูลที่เป็นภาษาไทย ควรทำการเว้นวรรค 1-2 ช่องไฟ (กด spacebar) ที่ท้ายประโยคเสมอ เพื่อช่วยให้ระบบตัดคำภาษาไทยของโปรแกรม PDF แสดงผลได้ครบถ้วนโดยไม่มีการตัดอักษรท้ายสุดออก"
          )
        ),
        React.createElement(View, { style: styles.callout },
          React.createElement(Text, { style: styles.calloutTitle }, "แนวทางปฏิบัติ: การตัดยอดสต๊อกสินค้า"),
          React.createElement(Text, { style: styles.calloutText }, 
            "เนื่องจากการตัดสต๊อกเม็ดป็อปยังเป็นแบบปรับด้วยมือ (Manual) เพื่อรองรับการจัดรวมของแถมและกล่องคละชนิด ดังนั้นหลังจากฝ่ายจัดส่งกดยืนยันออร์เดอร์เป็น 'ส่งแล้ว' เรียบร้อยแล้ว ฝ่ายคลังสินค้าหรือผู้รับผิดชอบต้องเข้าไปอัปเดตหักยอดสินค้าคงคลังในหน้าผลิตภัณฑ์ทุกครั้ง"
          )
        )
      ),

      React.createElement(Text, { style: styles.footer, render: ({ pageNumber, totalPages }) => `หน้า ${pageNumber} จาก ${totalPages}` })
    )
  )
);

async function generateManual() {
  const outputPath = path.resolve(process.cwd(), "public/BlessMe_User_Manual.pdf");
  console.log("Rendering PDF User Manual to:", outputPath);
  
  try {
    await renderToFile(React.createElement(UserManualDocument), outputPath);
    console.log("✅ PDF User Manual generated successfully!");
  } catch (err) {
    console.error("❌ Failed to render PDF:", err);
  }
}

generateManual();

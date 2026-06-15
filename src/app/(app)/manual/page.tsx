import Link from "next/link";

export default function ManualPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Title Header Card */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl p-8 shadow-md mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
          คู่มือการใช้งานระบบ BlessMe Topping App
        </h1>
        <p className="text-sm md:text-base text-green-50/90 mb-6 font-medium">
          ระบบจัดการใบเสนอราคา ใบเสร็จ สต๊อกสินค้า และการจัดส่งครบวงจร
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/BlessMe_User_Manual.pdf"
            download="BlessMe_User_Manual.pdf"
            className="inline-flex items-center gap-2 bg-white text-green-700 hover:bg-green-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            📥 ดาวน์โหลดคู่มือ PDF (สำหรับพิมพ์)
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-green-700/50 hover:bg-green-700/70 border border-green-400/30 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            🏠 กลับหน้าหลัก / Dashboard
          </Link>
        </div>
      </div>

      {/* Manual Content Sections */}
      <div className="space-y-8">
        {/* Section 1: Overview */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
            <span className="text-2xl">👥</span>
            <h2 className="text-lg font-bold text-gray-900">
              1. ภาพรวมระบบและบทบาทผู้ใช้งาน (System Overview & User Roles)
            </h2>
          </div>
          <p className="text-sm text-gray-650 leading-relaxed mb-4">
            ระบบจัดทำเอกสารและติดตามการจัดส่งนี้ ได้รับการออกแบบขึ้นมาเพื่อใช้งานใน บริษัท เบลสมี ท็อปปิ้ง จำกัด 
            ช่วยควบคุมเอกสารทางการค้าและการขายของฝ่ายขาย (SALES) และอำนวยความสะดวกให้ผู้บริหารหรือผู้ดูแลระบบ (ADMIN) ในการกำกับดูแล
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50/50 border border-green-100 rounded-lg p-4">
              <h3 className="text-sm font-bold text-green-800 mb-1">👑 ผู้ดูแลระบบ (ADMIN)</h3>
              <ul className="text-xs text-green-950 space-y-1.5 list-disc pl-4">
                <li>สามารถเข้าถึงและจัดการเอกสารทั้งหมดในระบบของเซลส์ทุกคน</li>
                <li>มีสิทธิ์ปรับยอดสต๊อกสินค้าหลักแบบเรียลไทม์</li>
                <li>สามารถแก้ไขข้อมูลบริษัท ตราประทับ และโลโก้ได้</li>
                <li>มีสิทธิ์ในการจัดการและสลับสถานะจัดส่งสินค้าได้ทั้งหมด</li>
              </ul>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-1">💼 พนักงานขาย (SALES)</h3>
              <ul className="text-xs text-blue-950 space-y-1.5 list-disc pl-4">
                <li>สามารถสร้างและจัดการเอกสารเฉพาะที่ตนเองสร้างขึ้นเท่านั้น</li>
                <li>ข้อมูลลูกค้าของเซลส์ท่านอื่นจะได้รับการปกป้องเป็นความลับ</li>
                <li>สามารถเรียกดูตารางสต๊อกสินค้าหลักได้แบบอ่านอย่างเดียว</li>
                <li>มีสิทธิ์จัดการจัดส่งสินค้าได้เฉพาะออร์เดอร์ของตัวเอง</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Master Data */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
            <span className="text-2xl">📦</span>
            <h2 className="text-lg font-bold text-gray-900">
              2. การจัดการข้อมูลพื้นฐาน (Master Data Management)
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">👥 ข้อมูลลูกค้า (Clients)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                เมนูสำหรับบันทึกข้อมูลหลักของลูกค้า ได้แก่ ชื่อ ที่อยู่ เบอร์โทร เลขประจำตัวผู้เสียภาษี และอีเมล 
                ซึ่งเป็นข้อมูลสำคัญที่ระบบจะดึงเข้าสู่หัวกระดาษของเอกสารต่าง ๆ โดยอัตโนมัติ ช่วยลดความซ้ำซ้อนและเวลาทำงานของเซลส์
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">📦 สินค้าและสต๊อกสินค้าเม็ดป็อป (Products & Boba Inventory)</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">
                สินค้ากลุ่มเม็ดป็อปจะมีตารางสต๊อกจริง (แปะฉลากแล้ว, แกะแล้ว, ฉลากจีน, แพ็ค 1/2/3 ถุง) ซึ่งระบบจะคำนวณถุงรวมให้อัตโนมัติในฐานข้อมูล
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <span className="font-bold">✨ ระบบราคาและ Cheese Markup:</span> ปุ่ม "ใช้โครงสร้างราคามาตรฐาน" จะบันทึกราคาขายส่ง 7 ระดับตามนโยบายบริษัททันที (115/100/90/80/75/70/65 บาท) และหากสินค้าเป็นประเภทชีส (Cheese) ระบบจะคำนวณบวกราคาเพิ่มให้อัตโนมัติ +30 บาท ในทุกระดับราคา
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Document Lifecycle */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
            <span className="text-2xl">📄</span>
            <h2 className="text-lg font-bold text-gray-900">
              3. ขั้นตอนการทำงานและวงจรเอกสาร (Document Lifecycle & Workflow)
            </h2>
          </div>
          <p className="text-sm text-gray-650 leading-relaxed mb-4">
            ระบบใช้สถาปัตยกรรมการประมวลผลทางการเงินฝั่งเซิร์ฟเวอร์ (Server-side Integrity) ยอดเงินรวมและ VAT 7% จะถูกคำนวณจากสูตรสินค้าในฝั่งเซิร์ฟเวอร์โดยตรง ป้องกันข้อผิดพลาดทางบัญชีและความเสี่ยงด้านความปลอดภัย
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl mb-6 text-center text-xs font-bold text-green-700">
            <span className="bg-white border px-3 py-1.5 rounded-lg shadow-sm">ใบเสนอราคา (Quotation)</span>
            <span className="text-gray-400">➔</span>
            <span className="bg-white border px-3 py-1.5 rounded-lg shadow-sm">ใบแจ้งหนี้ (Invoice)</span>
            <span className="text-gray-400">➔</span>
            <span className="bg-white border px-3 py-1.5 rounded-lg shadow-sm">ใบวางบิล (Billing Note)</span>
            <span className="text-gray-400">➔</span>
            <span className="bg-white border px-3 py-1.5 rounded-lg shadow-sm">ใบเสร็จรับเงิน (Receipt)</span>
          </div>

          <div className="space-y-3">
            {[
              { title: "ใบเสนอราคา (Quotation)", desc: "เริ่มต้นสร้างในสถานะ DRAFT เมื่อตกลงกับลูกค้าให้เปลี่ยนเป็น SENT และเมื่อได้รับการยืนยันการสั่งซื้อให้กดสถานะเป็น ACCEPTED เพื่อนำไปออกเอกสารการขายถัดไป" },
              { title: "ใบแจ้งหนี้ (Invoice)", desc: "เปิดใบเสนอราคาที่ได้รับความยินยอมแล้วกด 'แปลงเป็นใบแจ้งหนี้' ระบบจะทำสำเนาและออกใบแจ้งหนี้ให้อัตโนมัติทันที" },
              { title: "ใบวางบิล (Billing Note)", desc: "เปิดใบแจ้งหนี้ที่ต้องการเรียกเก็บเงิน กด 'แปลงเป็นใบวางบิล' เพื่อสรุปส่งเรียกเก็บเงินตามรอบระยะเวลาเครดิตเทอม" },
              { title: "ใบเสร็จรับเงิน (Receipt)", desc: "เมื่อได้รับชำระเงินโอนเรียบร้อยแล้ว กดปุ่ม 'แปลงเป็นใบเสร็จรับเงิน' เพื่อเป็นหลักฐานการชำระเงิน พร้อมออกใบกำกับภาษีอย่างย่อหรือฉบับเต็ม" }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-3 text-xs">
                <span className="flex items-center justify-center w-5 h-5 bg-green-100 text-green-800 rounded-full font-bold">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-gray-800">{step.title}</h4>
                  <p className="text-gray-600 leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Delivery Tracking */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
            <span className="text-2xl">🚚</span>
            <h2 className="text-lg font-bold text-gray-900">
              4. ระบบติดตามการจัดส่งสินค้า (Delivery Tracking)
            </h2>
          </div>
          <p className="text-sm text-gray-650 leading-relaxed mb-4">
            ระบบขนส่งและจัดส่งถูกผูกเข้าระบบกับใบแจ้งหนี้ (Invoice) โดยตรง เพื่อทำหน้าที่เป็นเช็คลิสต์เตรียมและตรวจสอบสินค้าคงคลังสำหรับการส่งมอบ
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 border p-4 rounded-lg">
              <span className="text-xl block mb-1">📋</span>
              <h4 className="text-xs font-bold text-gray-800 mb-1">หน้าติดตาม (Deliveries Page)</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                เข้าถึงผ่านเมนูหลักด้านซ้าย แบ่งการดูสถานะเป็นสองแท็บ: แท็บค้างส่ง (Pending) และ แท็บส่งสำเร็จ (Delivered)
              </p>
            </div>
            <div className="bg-gray-50 border p-4 rounded-lg">
              <span className="text-xl block mb-1">⚡</span>
              <h4 className="text-xs font-bold text-gray-800 mb-1">สลับสถานะสะดวกรวดเร็ว</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                กดปุ่มสีเขียวเพื่อระบุสถานะว่า 'ส่งของแล้ว' และสามารถกดยกเลิกสลับกลับมาเพื่อตรวจทานได้หากจัดของพลาด
              </p>
            </div>
            <div className="bg-gray-50 border p-4 rounded-lg">
              <span className="text-xl block mb-1">🔒</span>
              <h4 className="text-xs font-bold text-gray-800 mb-1">สิทธิ์ในการควบคุม</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                เซลส์อัปเดตการจัดส่งได้เฉพาะออร์เดอร์ของตนเอง ส่วนแอดมินสามารถช่วยตรวจสอบอัปเดตการจัดส่งของทุกคนได้
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Best Practices */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-bold text-gray-900">
              5. ข้อควรระวังและแนวทางปฏิบัติที่ดีที่สุด (Warnings & Best Practices)
            </h2>
          </div>
          <div className="space-y-4">
            <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
              <h4 className="text-xs font-bold text-red-900 mb-1">⚠️ คำเตือน: การออกเอกสารภาษาไทยในรูปแบบ PDF</h4>
              <p className="text-xs text-red-800 leading-relaxed">
                เมื่อพิมพ์ชื่อลูกค้าหรือข้อมูลเป็นภาษาไทยในฟิลด์ข้อความ ควรทำการเว้นวรรค 1-2 ช่องไฟ (spacebar) ท้ายประโยคเสมอ เพื่อช่วยให้ระบบตัดคำภาษาไทยของโปรแกรม PDF แสดงผลได้อย่างสมบูรณ์และไม่มีการตัดพยัญชนะหรือวรรณยุกต์ตัวสุดท้ายทิ้ง
              </p>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4">
              <h4 className="text-xs font-bold text-amber-900 mb-1">💡 แนวทางปฏิบัติ: ความถูกต้องของสต๊อกสินค้าคงคลัง</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                เนื่องจากระบบตัดยอดสต๊อกสินค้าเม็ดป็อปยังเป็นแบบปรับมือ (Manual) เพื่อรองรับการจัดและคละสินค้าจริงในโกดังสินค้า ดังนั้นหลังจากอัปเดตสถานะจัดส่งเป็น 'ส่งสำเร็จ' แล้ว ฝ่ายคลังสินค้าหรือเซลส์ผู้ดูแลจะต้องเข้าหน้าผลิตภัณฑ์ไปหักยอดสินค้าคงคลังให้สอดคล้องตามความจริงด้วยทุกครั้ง
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

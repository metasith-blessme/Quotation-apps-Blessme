import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BlessMe Topping — ระบบใบเสนอราคา",
  description: "ระบบออกใบเสนอราคาสำหรับ BlessMe Topping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

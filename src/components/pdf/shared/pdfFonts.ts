import { Font } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

// Google Fonts CDN — reliable, fast, works on all environments including Vercel serverless
const SARABUN_CDN = {
  regular: "https://fonts.gstatic.com/s/sarabun/v17/DtVjJx26TKEr37c9WBI.ttf",
  bold: "https://fonts.gstatic.com/s/sarabun/v17/DtVmJx26TKEr37c9YK5sulw.ttf",
};

/**
 * Get font source: local file in dev, Google Fonts CDN on Vercel.
 */
function getFontSrc(filename: string, cdnUrl: string): string {
  const localPath = path.join(process.cwd(), "public", "fonts", filename);
  if (fs.existsSync(localPath)) return localPath;
  return cdnUrl;
}

/**
 * Register fonts and hyphenation callback for Thai text support.
 */
export function registerPDFFonts() {
  Font.register({
    family: "Sarabun",
    fonts: [
      { src: getFontSrc("Sarabun-Regular.ttf", SARABUN_CDN.regular), fontWeight: "normal" },
      { src: getFontSrc("Sarabun-Bold.ttf", SARABUN_CDN.bold), fontWeight: "bold" },
    ],
  });

  // Smart hyphenation for Thai text: never break combining marks
  Font.registerHyphenationCallback((word) => {
    const hasThaiChars = /[\u0E00-\u0E7F]/.test(word);

    if (!hasThaiChars) {
      return [];
    }

    if (word.length > 20) {
      const parts = [];
      let current = "";

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const isCombiningMark = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(char);

        current += char;

        if (current.length >= 15 && !isCombiningMark && i < word.length - 1) {
          const nextChar = word[i + 1];
          if (!/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(nextChar)) {
            parts.push(current);
            current = "";
          }
        }
      }

      if (current) {
        parts.push(current);
      }

      return parts.length > 1 ? parts : [word];
    }

    return [word];
  });
}

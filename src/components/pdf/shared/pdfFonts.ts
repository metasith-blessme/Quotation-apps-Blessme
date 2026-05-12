import { Font } from "@react-pdf/renderer";

// Always use Google Fonts CDN — works on all environments.
// Local file paths fail on Vercel serverless, and there's no reliable
// way to detect the runtime environment at Font.register time.
const SARABUN_REGULAR = "https://fonts.gstatic.com/s/sarabun/v17/DtVjJx26TKEr37c9WBI.ttf";
const SARABUN_BOLD = "https://fonts.gstatic.com/s/sarabun/v17/DtVmJx26TKEr37c9YK5sulw.ttf";

let registered = false;

/**
 * Register fonts and hyphenation callback for Thai text support.
 */
export function registerPDFFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Sarabun",
    fonts: [
      { src: SARABUN_REGULAR, fontWeight: "normal" },
      { src: SARABUN_BOLD, fontWeight: "bold" },
    ],
  });

  // Smart hyphenation for Thai text: never break combining marks
  Font.registerHyphenationCallback((word) => {
    const hasThaiChars = /[\u0E00-\u0E7F]/.test(word);

    if (!hasThaiChars) {
      return [word];
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

      if (current) parts.push(current);
      return parts.length > 1 ? parts : [word];
    }

    return [word];
  });
}

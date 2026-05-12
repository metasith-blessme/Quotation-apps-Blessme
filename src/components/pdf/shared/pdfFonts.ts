import { Font } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

/**
 * Get font source — file path locally, URL on Vercel.
 * Vercel serverless functions don't have public/ on their filesystem,
 * but fonts ARE served via CDN at the app URL.
 */
function getFontSrc(filename: string): string {
  // Try local file first
  const localPath = path.join(process.cwd(), "public", "fonts", filename);
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  // On Vercel: load from CDN via the app's own URL
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    || process.env.VERCEL_URL;
  if (vercelUrl) {
    const url = `https://${vercelUrl}/fonts/${filename}`;
    console.log(`[PDF Font] Loading from CDN: ${url}`);
    return url;
  }

  // Last resort: return local path and let @react-pdf handle the error
  console.error(`[PDF Font] Cannot resolve ${filename} — no local file, no VERCEL_URL`);
  return localPath;
}

/**
 * Register fonts and hyphenation callback for Thai text support.
 * Call this once at module load time to hoist font registration outside of components.
 */
export function registerPDFFonts() {
  Font.register({
    family: "Sarabun",
    fonts: [
      { src: getFontSrc("Sarabun-Regular.ttf"), fontWeight: "normal" },
      { src: getFontSrc("Sarabun-Bold.ttf"), fontWeight: "bold" },
    ],
  });

  // Smart hyphenation for Thai text: never break combining marks
  Font.registerHyphenationCallback((word) => {
    const hasThaiChars = /[\u0E00-\u0E7F]/.test(word);

    if (!hasThaiChars) {
      return [];
    }

    // For Thai text, break smartly without separating combining marks
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

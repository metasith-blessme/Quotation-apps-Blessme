import { Font } from "@react-pdf/renderer";
import path from "path";

/**
 * Register fonts and hyphenation callback for Thai text support.
 * Call this once at module load time to hoist font registration outside of components.
 */
export function registerPDFFonts() {
  // Register Thai font
  Font.register({
    family: "Sarabun",
    fonts: [
      { src: path.join(process.cwd(), "public/fonts/Sarabun-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(process.cwd(), "public/fonts/Sarabun-Bold.ttf"), fontWeight: "bold" },
    ],
  });

  // Smart hyphenation for Thai text: never break combining marks
  Font.registerHyphenationCallback((word) => {
    // Check if word contains Thai characters
    const hasThaiChars = /[\u0E00-\u0E7F]/.test(word);

    if (!hasThaiChars) {
      // For non-Thai words, return empty array to use default hyphenation
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

        // Break at ~15 chars, but only if next char is not a combining mark
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

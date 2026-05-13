/**
 * Thai text utilities for proper handling in PDFs.
 * Thai script uses combining marks that must never be separated from their base characters.
 */

/**
 * Check if a character is Thai combining mark
 */
function isThaiCombiningMark(char: string): boolean {
  return /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(char);
}

/**
 * Check if a character is Thai consonant or vowel that can have combining marks
 */
function isThaiBase(char: string): boolean {
  return /[\u0E01-\u0E3A\u0E40-\u0E46]/.test(char);
}

/**
 * Get the next safe break point in Thai text.
 * Thai doesn't use spaces, so we need intelligent segmentation.
 * This function finds word boundaries based on common Thai word patterns.
 */
function getThaiWordBoundary(text: string, startIdx: number, maxLength: number): number {
  if (startIdx + maxLength >= text.length) {
    return text.length;
  }

  let pos = startIdx + maxLength;

  // Move backward to avoid breaking combining marks
  while (pos > startIdx && isThaiCombiningMark(text[pos])) {
    pos--;
  }

  // Move forward to get a complete character (base + marks)
  if (pos > startIdx && isThaiBase(text[pos])) {
    pos++;
    while (pos < text.length && isThaiCombiningMark(text[pos])) {
      pos++;
    }
  }

  return pos;
}

/**
 * Prepare Thai text for PDF rendering by inserting strategic word breaks.
 * This prevents combining marks from being separated from their base characters.
 *
 * @param text - Input Thai text
 * @param maxCharsPerLine - Target characters per line (default 30 for PDF columns)
 * @returns Text safe for PDF rendering without breaking combining marks
 */
export function prepareThaiFontForPDF(text: string, maxCharsPerLine: number = 30): string {
  if (!text) return text;

  // Check if text contains Thai characters
  if (!/[\u0E00-\u0E7F]/.test(text)) {
    // Not Thai text, return as-is
    return text;
  }

  const result: string[] = [];
  let i = 0;

  while (i < text.length) {
    // Get next line of text respecting Thai word boundaries
    const nextBreak = getThaiWordBoundary(text, i, maxCharsPerLine);

    if (nextBreak === i) {
      // Safety check: prevent infinite loop
      result.push(text[i]);
      i++;
    } else {
      result.push(text.substring(i, nextBreak));
      i = nextBreak;
    }

    // Add newline if not at end
    if (i < text.length) {
      result.push('\n');
    }
  }

  return result.join('');
}

/**
 * Ensure Thai text with combining marks stays together.
 * This is a simpler approach: just return the text as-is and let
 * react-pdf handle wrapping naturally (without aggressive hyphenation).
 */
export function safeThai(text: string): string {
  return text || '';
}

/**
 * Validate Thai text - check if combining marks are properly attached
 */
export function validateThaiText(text: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    // If it's a combining mark, it should have a base character before it
    if (isThaiCombiningMark(char) && (i === 0 || !isThaiBase(chars[i - 1]))) {
      issues.push(`Orphaned combining mark at position ${i}: "${char}"`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Convert a number to Thai Baht words (e.g., 100.50 -> หนึ่งร้อยบาทห้าสิบสตางค์).
 * STANDARD: Essential for commercial-grade financial documents in Thailand.
 */
export function bahtText(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "";
  
  const text_number = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const text_unit = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  const number = amount.toFixed(2).split(".");
  const integer = number[0];
  const decimal = number[1];
  
  let baht = "";
  
  if (parseInt(integer) === 0) {
    baht = text_number[0];
  } else {
    for (let i = 0; i < integer.length; i++) {
      const digit = parseInt(integer[i]);
      const unit = integer.length - i - 1;
      
      if (digit !== 0) {
        if (unit % 6 === 0 && unit > 0) {
          baht += "ล้าน";
        }
        
        if (digit === 2 && unit % 6 === 1) {
          baht += "ยี่";
        } else if (digit === 1 && unit % 6 === 1) {
          // Do nothing (handled by unit)
        } else if (digit === 1 && unit % 6 === 0 && unit !== integer.length - 1) {
          baht += "เอ็ด";
        } else {
          baht += text_number[digit];
        }
        
        baht += text_unit[unit % 6];
      } else if (unit % 6 === 0 && unit > 0) {
        baht += "ล้าน";
      }
    }
  }
  
  baht += "บาท";
  
  if (parseInt(decimal) === 0) {
    baht += "ถ้วน";
  } else {
    if (parseInt(decimal[0]) !== 0) {
      if (parseInt(decimal[0]) === 2) baht += "ยี่";
      else if (parseInt(decimal[0]) !== 1) baht += text_number[parseInt(decimal[0])];
      baht += "สิบ";
    }
    
    if (parseInt(decimal[1]) !== 0) {
      if (parseInt(decimal[1]) === 1 && parseInt(decimal[0]) !== 0) baht += "เอ็ด";
      else baht += text_number[parseInt(decimal[1])];
    }
    
    baht += "สตางค์";
  }
  
  return baht;
}

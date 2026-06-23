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

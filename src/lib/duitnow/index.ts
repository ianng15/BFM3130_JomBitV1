/**
 * DuitNow / EMVCo merchant-presented QR helpers.
 * Payloads are a series of TLV fields: 2-digit tag, 2-digit length, value.
 */

export interface TlvField {
  tag: string;
  value: string;
}

/** CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no xor-out. */
export function crc16(input: string): string {
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(input);
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Parse a TLV string. Throws on malformed input. */
export function parseTlv(payload: string): TlvField[] {
  const fields: TlvField[] = [];
  let i = 0;
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2);
    const lenText = payload.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenText)) {
      throw new Error(`Malformed TLV at position ${i}`);
    }
    const len = Number(lenText);
    const value = payload.slice(i + 4, i + 4 + len);
    if (value.length !== len) throw new Error(`Field ${tag} is truncated`);
    fields.push({ tag, value });
    i += 4 + len;
  }
  return fields;
}

export function serializeTlv(fields: TlvField[]): string {
  return fields
    .map(({ tag, value }) => {
      if (value.length > 99) throw new Error(`Field ${tag} is too long`);
      return `${tag}${String(value.length).padStart(2, "0")}${value}`;
    })
    .join("");
}

export interface ValidationResult {
  ok: boolean;
  /** Blocking problems — payload can't be used. */
  errors: string[];
  /** Non-blocking problems — payload is saved anyway. */
  warnings: string[];
  merchantName?: string;
  isDuitNow: boolean;
}

/** Merchant account information templates live in tags 26–51. */
function merchantAccountFields(fields: TlvField[]): TlvField[] {
  return fields.filter((f) => Number(f.tag) >= 26 && Number(f.tag) <= 51);
}

function looksLikeDuitNow(fields: TlvField[]): boolean {
  return merchantAccountFields(fields).some((f) => {
    const upper = f.value.toUpperCase();
    if (upper.includes("DUITNOW") || upper.includes("PAYNET")) return true;
    try {
      // PayNet's application identifier prefix (A000000615…)
      return parseTlv(f.value).some((sub) => sub.tag === "00" && sub.value.toUpperCase().startsWith("A000000615"));
    } catch {
      return false;
    }
  });
}

export function validatePayload(payload: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const text = payload.trim();
  if (!text.startsWith("000201")) errors.push("Not an EMVCo QR: it must start with 000201.");
  let fields: TlvField[] = [];
  try {
    fields = parseTlv(text);
  } catch (e) {
    errors.push((e as Error).message);
  }
  const crcField = fields[fields.length - 1];
  if (!crcField || crcField.tag !== "63" || crcField.value.length !== 4) {
    errors.push("Missing CRC (tag 63) at the end.");
  } else {
    const expected = crc16(text.slice(0, -4));
    if (expected !== crcField.value.toUpperCase()) errors.push("CRC checksum doesn't match — the QR may be damaged.");
  }
  const isDuitNow = fields.length > 0 && looksLikeDuitNow(fields);
  if (fields.length > 0 && !isDuitNow) {
    warnings.push("No DuitNow identifier found in the merchant account info. Saved anyway.");
  }
  const merchantName = fields.find((f) => f.tag === "59")?.value;
  return { ok: errors.length === 0, errors, warnings, merchantName, isDuitNow };
}

/** Recompute and append tag 63 over the string including "6304". */
export function withCrc(fieldsWithoutCrc: TlvField[]): string {
  const body = serializeTlv(fieldsWithoutCrc) + "6304";
  return body + crc16(body);
}

/**
 * Build a dynamic (one-time) QR from a saved static payload:
 * - tag 01 = "12" (dynamic)
 * - tag 53 = "458" (MYR)
 * - tag 54 = amount like "12.50", inserted in tag order
 * - old tag 63 removed and CRC recomputed
 */
export function buildDynamicPayload(savedPayload: string, amountText: string): string {
  if (!/^\d+(\.\d{2})?$/.test(amountText)) throw new Error("Amount must look like 12.50");
  const fields = parseTlv(savedPayload.trim()).filter((f) => f.tag !== "63");
  const set = (tag: string, value: string) => {
    const existing = fields.find((f) => f.tag === tag);
    if (existing) existing.value = value;
    else fields.push({ tag, value });
  };
  set("01", "12");
  set("53", "458");
  set("54", amountText);
  // Keep tags in ascending order (00 stays first, as the spec requires).
  fields.sort((a, b) => Number(a.tag) - Number(b.tag));
  return withCrc(fields);
}

/**
 * Create a FAKE but structurally valid static DuitNow-style payload for demo
 * users. The account identifier is clearly a test value — never a real account.
 */
export function makeDemoPayload(name: string, testAccountId: string): string {
  const account = serializeTlv([
    { tag: "00", value: "A0000006150001" },
    { tag: "01", value: `TEST${testAccountId}` },
    { tag: "02", value: "JOMBITDEMO" },
  ]);
  return withCrc([
    { tag: "00", value: "01" },
    { tag: "01", value: "11" },
    { tag: "26", value: account },
    { tag: "52", value: "0000" },
    { tag: "53", value: "458" },
    { tag: "58", value: "MY" },
    { tag: "59", value: name.toUpperCase().slice(0, 25) },
    { tag: "60", value: "KUALA LUMPUR" },
  ]);
}

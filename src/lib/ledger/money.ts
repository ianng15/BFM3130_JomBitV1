/**
 * Money helpers. All fiat amounts are integers in the currency's minor unit
 * (sen for MYR). No floating-point arithmetic is used on money.
 */

export type CurrencyCode = "MYR" | "SGD" | "THB" | "IDR" | "PHP" | "USD";

export const CURRENCIES: CurrencyCode[] = ["MYR", "SGD", "THB", "IDR", "PHP", "USD"];

/** Number of decimal places in each currency's minor unit. */
export const MINOR_DIGITS: Record<CurrencyCode, number> = {
  MYR: 2,
  SGD: 2,
  THB: 2,
  IDR: 0,
  PHP: 2,
  USD: 2,
};

export const CURRENCY_PREFIX: Record<CurrencyCode, string> = {
  MYR: "RM",
  SGD: "SGD",
  THB: "฿",
  IDR: "IDR",
  PHP: "PHP",
  USD: "USD",
};

export function minorDigits(currency: string): number {
  return MINOR_DIGITS[currency as CurrencyCode] ?? 2;
}

/**
 * Parse a decimal string (e.g. "12.50", "-0.02", "1.8") into integer minor units.
 * Extra digits beyond the currency precision are rounded half away from zero.
 * Returns null for anything that isn't a plain decimal number.
 */
export function parseToMinor(input: string | number, digits = 2): number | null {
  const text = String(input).trim().replace(/,/g, "");
  const match = /^([+-])?(\d*)(?:\.(\d*))?$/.exec(text);
  if (!match || (match[2] === "" && (match[3] ?? "") === "")) return null;
  const negative = match[1] === "-";
  const whole = match[2] || "0";
  const frac = match[3] ?? "";
  const kept = (frac + "0".repeat(digits)).slice(0, digits);
  let value = Number(whole) * 10 ** digits + (digits > 0 ? Number(kept) : 0);
  const next = frac.charAt(digits);
  if (next !== "" && Number(next) >= 5) value += 1;
  if (!Number.isSafeInteger(value)) return null;
  return negative ? -value : value;
}

/** Format integer minor units as a plain decimal string, e.g. 1250 → "12.50". */
export function minorToDecimalString(minor: number, digits = 2): string {
  const negative = minor < 0;
  const abs = Math.abs(minor);
  if (digits === 0) return `${negative ? "-" : ""}${abs}`;
  const base = 10 ** digits;
  const whole = Math.floor(abs / base);
  const frac = String(abs % base).padStart(digits, "0");
  return `${negative ? "-" : ""}${whole}.${frac}`;
}

function groupThousands(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "RM 1,234.50", "฿350.00", "SGD 20.00". Sign is placed in front. */
export function formatMoney(
  minor: number,
  currency: string,
  opts: { sign?: boolean } = {},
): string {
  const digits = minorDigits(currency);
  const plain = minorToDecimalString(Math.abs(minor), digits);
  const [whole, frac] = plain.split(".");
  const body = groupThousands(whole) + (frac !== undefined ? `.${frac}` : "");
  const prefix = CURRENCY_PREFIX[currency as CurrencyCode] ?? currency;
  const sep = prefix === "฿" ? "" : " ";
  let sign = "";
  if (minor < 0) sign = "−";
  else if (opts.sign && minor > 0) sign = "+";
  return `${sign}${prefix}${sep}${body}`;
}

/**
 * Split `total` into parts proportional to `weights` using the
 * largest-remainder method so the parts always sum exactly to `total`.
 * Works for negative totals (e.g. a rounding adjustment) by splitting the
 * absolute value and re-applying the sign. If every weight is zero the total
 * is split equally.
 */
export function allocateByWeights(total: number, weights: number[]): number[] {
  if (!Number.isSafeInteger(total)) throw new Error("total must be an integer");
  const n = weights.length;
  if (n === 0) {
    if (total !== 0) throw new Error("cannot allocate a non-zero total to nobody");
    return [];
  }
  if (weights.some((w) => !Number.isSafeInteger(w) || w < 0)) {
    throw new Error("weights must be non-negative integers");
  }
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  const effective = sumWeights === 0 ? weights.map(() => 1) : weights;
  const denom = sumWeights === 0 ? n : sumWeights;
  const sign = total < 0 ? -1 : 1;
  const abs = BigInt(Math.abs(total));
  const big = BigInt(denom);

  const floors: bigint[] = [];
  const remainders: { index: number; rem: bigint }[] = [];
  let allocated = BigInt(0);
  effective.forEach((w, index) => {
    const product = abs * BigInt(w);
    const q = product / big;
    floors.push(q);
    remainders.push({ index, rem: product % big });
    allocated += q;
  });

  let left = Number(abs - allocated);
  remainders.sort((a, b) => (a.rem === b.rem ? a.index - b.index : a.rem > b.rem ? -1 : 1));
  for (let i = 0; left > 0; i++, left--) {
    floors[remainders[i % n].index] += BigInt(1);
  }
  return floors.map((v) => sign * Number(v));
}

/** Split equally among `n` people; the first people get the extra sen. */
export function splitEqually(total: number, n: number): number[] {
  return allocateByWeights(total, Array.from({ length: n }, () => 1));
}

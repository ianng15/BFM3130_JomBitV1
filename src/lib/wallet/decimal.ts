/**
 * Tiny fixed-point decimal type for wallet maths (crypto needs many decimals).
 * Values are BigInt scaled by 10^18 — no floating-point arithmetic.
 */

export const SCALE_DIGITS = 18;
const SCALE = BigInt(10) ** BigInt(SCALE_DIGITS);
const ZERO = BigInt(0);
const TEN = BigInt(10);

export type Dec = bigint;

export function dec(input: string | number | bigint): Dec {
  if (typeof input === "bigint") return input * SCALE;
  const text = String(input).trim();
  // Numbers like 1e-7 are expanded via toFixed for safety on API inputs.
  const normal = /e/i.test(text) ? Number(text).toFixed(SCALE_DIGITS) : text;
  const match = /^([+-])?(\d*)(?:\.(\d*))?$/.exec(normal);
  if (!match || (match[2] === "" && (match[3] ?? "") === "")) throw new Error(`Not a number: ${input}`);
  const whole = BigInt(match[2] || "0");
  const frac = BigInt(((match[3] ?? "") + "0".repeat(SCALE_DIGITS)).slice(0, SCALE_DIGITS) || "0");
  const value = whole * SCALE + frac;
  return match[1] === "-" ? -value : value;
}

export function tryDec(input: string): Dec | null {
  try {
    return dec(input);
  } catch {
    return null;
  }
}

export const add = (a: Dec, b: Dec): Dec => a + b;
export const sub = (a: Dec, b: Dec): Dec => a - b;
export const mul = (a: Dec, b: Dec): Dec => (a * b) / SCALE;
export function div(a: Dec, b: Dec): Dec {
  if (b === ZERO) throw new Error("Division by zero");
  return (a * SCALE) / b;
}
export const isNeg = (a: Dec) => a < ZERO;
export const isZero = (a: Dec) => a === ZERO;
export const min = (a: Dec, b: Dec) => (a < b ? a : b);

/** Truncate (toward zero) to `digits` decimals. */
export function truncate(a: Dec, digits: number): Dec {
  const unit = TEN ** BigInt(SCALE_DIGITS - digits);
  return (a / unit) * unit;
}

/** Format with up to `digits` decimals, trimming trailing zeros unless `fixed`. */
export function format(a: Dec, digits = 8, fixed = false): string {
  const t = truncate(a, digits);
  const negative = t < ZERO;
  const abs = negative ? -t : t;
  const whole = (abs / SCALE).toString();
  let frac = (abs % SCALE).toString().padStart(SCALE_DIGITS, "0").slice(0, digits);
  if (!fixed) frac = frac.replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/** Convert a decimal amount into integer minor units (truncated). */
export function toMinor(a: Dec, minorDigits: number): number {
  return Number(truncate(a, minorDigits) / TEN ** BigInt(SCALE_DIGITS - minorDigits));
}

export function fromMinor(minor: number, minorDigits: number): Dec {
  return (BigInt(minor) * SCALE) / TEN ** BigInt(minorDigits);
}

/** Percentage expressed in basis points (50 = 0.5%). */
export function bps(a: Dec, basisPoints: number): Dec {
  return (a * BigInt(basisPoints)) / BigInt(10000);
}

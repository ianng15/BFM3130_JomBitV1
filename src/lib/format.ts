import { dec, format, mul, toMinor } from "@/lib/wallet/decimal";
import { CRYPTO_ASSETS } from "@/lib/wallet/config";

export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-MY", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** Crypto amounts: up to 8 decimals, trimmed. */
export function formatCrypto(amount: string | bigint, asset: string): string {
  const v = typeof amount === "bigint" ? amount : dec(amount);
  return `${format(v, 8)} ${displayAsset(asset)}`;
}

export function displayAsset(code: string): string {
  return CRYPTO_ASSETS.find((a) => a.code === code)?.display ?? code;
}

export function assetName(code: string): string {
  return CRYPTO_ASSETS.find((a) => a.code === code)?.name ?? code;
}

/** MYR value (sen) of a crypto amount at a given price. */
export function cryptoValueSen(amount: bigint, price: string | undefined): number {
  if (!price) return 0;
  return toMinor(mul(amount, dec(price)), 2);
}

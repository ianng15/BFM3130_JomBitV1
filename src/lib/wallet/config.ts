/**
 * Configurable business constants. All are PLACEHOLDERS (see SPEC.md §8) —
 * to be confirmed by the leader / finance team.
 */

/** JomBit FX spread, basis points (50 = 0.5%). */
export const FX_SPREAD_BPS = 50;

/** JomBit crypto buy/sell fee, basis points (100 = 1.0%). */
export const CRYPTO_FEE_BPS = 100;

/** JomBit commission on staking yield, basis points (1000 = 10%). */
export const STAKING_COMMISSION_BPS = 1000;

/** Indicative staking APYs in basis points (labelled "indicative" in the UI). */
export const STAKING_APY_BPS: Record<string, number> = {
  XBT: 150,
  ETH: 320,
  USDT: 500,
  SOL: 650,
  XRP: 200,
};

/** Card interchange rate in basis points of the purchase amount. */
export const INTERCHANGE_BPS = 50;
/** JomBit's share of interchange, basis points of the interchange amount. */
export const JOMBIT_INTERCHANGE_SHARE_BPS = 6000;

export const PHYSICAL_CARD_FEES_SEN = { plastic: 1200, metal: 3000 } as const;

export const CRYPTO_ASSETS = [
  { code: "XBT", name: "Bitcoin", pair: "XBTMYR", display: "BTC" },
  { code: "ETH", name: "Ethereum", pair: "ETHMYR", display: "ETH" },
  { code: "USDT", name: "Tether", pair: "USDTMYR", display: "USDT" },
  { code: "SOL", name: "Solana", pair: "SOLMYR", display: "SOL" },
  { code: "XRP", name: "XRP", pair: "XRPMYR", display: "XRP" },
] as const;

export type CryptoCode = (typeof CRYPTO_ASSETS)[number]["code"];

export interface Ticker {
  pair: string;
  bid: string;
  ask: string;
  last_trade: string;
}

/** Sample MYR prices used when Luno can't be reached (clearly labelled in UI). */
export const SAMPLE_TICKERS: Ticker[] = [
  { pair: "XBTMYR", bid: "455000.00", ask: "456200.00", last_trade: "455600.00" },
  { pair: "ETHMYR", bid: "16850.00", ask: "16910.00", last_trade: "16880.00" },
  { pair: "USDTMYR", bid: "4.21", ask: "4.23", last_trade: "4.22" },
  { pair: "SOLMYR", bid: "880.50", ask: "884.00", last_trade: "882.10" },
  { pair: "XRPMYR", bid: "10.42", ask: "10.47", last_trade: "10.45" },
];

/** Sample FX reference rates: 1 MYR = x units (used if Frankfurter fails). */
export const SAMPLE_FX: Record<string, string> = {
  MYR: "1",
  SGD: "0.3050",
  THB: "7.6800",
  IDR: "3720",
  PHP: "13.4500",
  USD: "0.2370",
};

/** Fictional sample merchants for "Simulate a purchase". */
export const SAMPLE_MERCHANTS = [
  { name: "Mamak Corner SS15", mcc: "5814" },
  { name: "Kedai Runcit Pak Ali", mcc: "5411" },
  { name: "Petrol Station (sample)", mcc: "5541" },
  { name: "Campus Bookstore", mcc: "5942" },
  { name: "Bubble Tea Bar", mcc: "5812" },
  { name: "Budget Airline (sample)", mcc: "4511" },
] as const;

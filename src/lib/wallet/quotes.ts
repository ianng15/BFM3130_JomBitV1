import { allocateByWeights, minorDigits } from "@/lib/ledger/money";
import {
  CRYPTO_FEE_BPS,
  FX_SPREAD_BPS,
  INTERCHANGE_BPS,
  JOMBIT_INTERCHANGE_SHARE_BPS,
  STAKING_COMMISSION_BPS,
} from "./config";
import { bps, dec, div, fromMinor, mul, sub, toMinor, type Dec } from "./decimal";

/** Rates table: 1 MYR = rates[code] units of `code`. */
export type FxRates = Record<string, string>;

/** Mid-market rate from → to (units of `to` per 1 `from`). */
export function crossRate(rates: FxRates, from: string, to: string): Dec {
  return div(dec(rates[to] ?? "0"), dec(rates[from] ?? "1"));
}

export interface FxQuote {
  from: string;
  to: string;
  amountMinor: number;
  midRate: string;
  appliedRate: string;
  spreadBps: number;
  feeMinorInTo: number;
  receiveMinor: number;
}

/** "You get" = amount × mid rate × (1 − spread), truncated to the minor unit. */
export function fxQuote(rates: FxRates, from: string, to: string, amountMinor: number): FxQuote {
  const mid = crossRate(rates, from, to);
  const applied = sub(mid, bps(mid, FX_SPREAD_BPS));
  const amount = fromMinor(amountMinor, minorDigits(from));
  const gross = mul(amount, mid);
  const receive = mul(amount, applied);
  const toDigits = minorDigits(to);
  const receiveMinor = toMinor(receive, toDigits);
  return {
    from,
    to,
    amountMinor,
    midRate: mid.toString(),
    appliedRate: applied.toString(),
    spreadBps: FX_SPREAD_BPS,
    feeMinorInTo: toMinor(gross, toDigits) - receiveMinor,
    receiveMinor,
  };
}

/** Minimum `from` amount needed so that converting gives at least `needMinor` of `to`. */
export function fxAmountNeeded(rates: FxRates, from: string, to: string, needMinor: number): number {
  const mid = crossRate(rates, from, to);
  const applied = sub(mid, bps(mid, FX_SPREAD_BPS));
  const need = fromMinor(needMinor, minorDigits(to));
  let fromMinorAmt = toMinor(div(need, applied), minorDigits(from)) + 1;
  while (fxQuote(rates, from, to, fromMinorAmt).receiveMinor < needMinor) fromMinorAmt += 1;
  return fromMinorAmt;
}

export interface CryptoBuyQuote {
  myrMinor: number;
  feeMinor: number;
  price: string;
  cryptoAmount: Dec;
}

/** Buy: spend MYR at the Luno ask price; JomBit fee is taken from the MYR first. */
export function cryptoBuyQuote(myrMinor: number, ask: string): CryptoBuyQuote {
  const feeMinor = toMinor(bps(fromMinor(myrMinor, 2), CRYPTO_FEE_BPS), 2);
  const net = fromMinor(myrMinor - feeMinor, 2);
  return { myrMinor, feeMinor, price: ask, cryptoAmount: div(net, dec(ask)) };
}

export interface CryptoSellQuote {
  cryptoAmount: Dec;
  grossMinor: number;
  feeMinor: number;
  receiveMinor: number;
  price: string;
}

/** Sell: crypto × Luno bid, minus JomBit fee. */
export function cryptoSellQuote(cryptoAmount: Dec, bid: string): CryptoSellQuote {
  const grossMinor = toMinor(mul(cryptoAmount, dec(bid)), 2);
  const feeMinor = toMinor(bps(fromMinor(grossMinor, 2), CRYPTO_FEE_BPS), 2);
  return { cryptoAmount, grossMinor, feeMinor, receiveMinor: grossMinor - feeMinor, price: bid };
}

const YEAR_MS = BigInt(365 * 24 * 60 * 60 * 1000);

/** reward = amount × APY × elapsed / 1 year */
export function stakingReward(amount: Dec, apyBps: number, startedAt: number, now: number): Dec {
  const elapsed = BigInt(Math.max(0, Math.floor(now - startedAt)));
  return (amount * BigInt(apyBps) * elapsed) / (BigInt(10000) * YEAR_MS);
}

export function stakingPayout(amount: Dec, reward: Dec) {
  const commission = bps(reward, STAKING_COMMISSION_BPS);
  return { principal: amount, reward, commission, netReward: reward - commission, total: amount + reward - commission };
}

/** Interchange on a card purchase, split between JomBit and the issuer. */
export function interchange(amountMinor: number) {
  const interchangeMinor = Math.floor((amountMinor * INTERCHANGE_BPS) / 10000);
  const [jombit, issuer] = allocateByWeights(interchangeMinor, [
    JOMBIT_INTERCHANGE_SHARE_BPS,
    10000 - JOMBIT_INTERCHANGE_SHARE_BPS,
  ]);
  return {
    interchangeRateBps: INTERCHANGE_BPS,
    interchangeMinor,
    jombitShareMinor: jombit,
    issuerShareMinor: issuer,
  };
}

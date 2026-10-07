"use client";

import { useEffect, useState } from "react";
import { CRYPTO_ASSETS, SAMPLE_FX, SAMPLE_TICKERS, type Ticker } from "@/lib/wallet/config";

export interface PriceData {
  source: "live" | "sample";
  tickers: Record<string, Ticker>;
  /** asset code (XBT…) → bid, for card conversions */
  bids: Record<string, string>;
  /** assets Luno actually lists */
  assets: typeof CRYPTO_ASSETS[number][];
}

function toPriceData(source: "live" | "sample", list: Ticker[]): PriceData {
  const tickers = Object.fromEntries(list.map((t) => [t.pair, t]));
  return {
    source,
    tickers,
    bids: Object.fromEntries(list.map((t) => [t.pair.replace(/MYR$/, ""), t.bid])),
    assets: CRYPTO_ASSETS.filter((a) => tickers[a.pair]),
  };
}

let priceCache: PriceData = toPriceData("sample", SAMPLE_TICKERS);
let priceFetchedAt = 0;

/** Luno prices via our server route, refreshed every 30 seconds. */
export function usePrices(): PriceData {
  const [data, setData] = useState<PriceData>(priceCache);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (Date.now() - priceFetchedAt < 25_000) {
        setData(priceCache);
        return;
      }
      try {
        const res = await fetch("/api/prices");
        const json = (await res.json()) as { source: "live" | "sample"; tickers: Ticker[] };
        priceCache = toPriceData(json.source, json.tickers);
        priceFetchedAt = Date.now();
      } catch {
        priceCache = toPriceData("sample", SAMPLE_TICKERS);
      }
      if (alive) setData(priceCache);
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return data;
}

export interface FxData {
  source: "live" | "sample";
  date: string | null;
  rates: Record<string, string>;
}

let fxCache: FxData = { source: "sample", date: null, rates: SAMPLE_FX };
let fxFetched = false;

/** FX reference rates (1 MYR = x), fetched once per page load (server caches 1h). */
export function useFx(): FxData {
  const [data, setData] = useState<FxData>(fxCache);
  useEffect(() => {
    if (fxFetched) {
      setData(fxCache);
      return;
    }
    let alive = true;
    fetch("/api/fx")
      .then((r) => r.json())
      .then((json: FxData) => {
        fxCache = json;
        fxFetched = true;
        if (alive) setData(json);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

/** Current time, re-rendering every `ms` (for ticking staking rewards). */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

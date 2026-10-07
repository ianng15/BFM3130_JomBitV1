import { NextResponse } from "next/server";
import { CRYPTO_ASSETS, SAMPLE_TICKERS, type Ticker } from "@/lib/wallet/config";

/**
 * Live MYR crypto prices from Luno's public ticker API (read-only, no key).
 * Only pairs Luno actually lists are returned. Falls back to sample prices.
 */
export const dynamic = "force-dynamic";

const WANTED: string[] = CRYPTO_ASSETS.map((a) => a.pair);

export async function GET() {
  try {
    const res = await fetch("https://api.luno.com/api/1/tickers", {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Luno ${res.status}`);
    const json = (await res.json()) as { tickers?: Ticker[] };
    const tickers = (json.tickers ?? [])
      .filter((t) => WANTED.includes(t.pair) && Number(t.bid) > 0 && Number(t.ask) > 0)
      .map(({ pair, bid, ask, last_trade }) => ({ pair, bid, ask, last_trade }));
    if (tickers.length === 0) throw new Error("No MYR pairs");
    return NextResponse.json({ source: "live", tickers, fetchedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ source: "sample", tickers: SAMPLE_TICKERS, fetchedAt: new Date().toISOString() });
  }
}

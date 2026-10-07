import { NextResponse } from "next/server";
import { SAMPLE_FX } from "@/lib/wallet/config";

/**
 * FX reference rates (European Central Bank via Frankfurter, free, no key),
 * cached for 1 hour. Returns "1 MYR = x units". Falls back to sample rates.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=MYR&to=SGD,THB,IDR,PHP,USD", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const json = (await res.json()) as { date: string; rates: Record<string, number> };
    const rates: Record<string, string> = { MYR: "1" };
    for (const code of Object.keys(SAMPLE_FX)) {
      if (code === "MYR") continue;
      const v = json.rates?.[code];
      // Rates arrive as JSON numbers; keep them as decimal strings from here on.
      rates[code] = typeof v === "number" && v > 0 ? String(v) : SAMPLE_FX[code];
    }
    return NextResponse.json({ source: "live", date: json.date, rates });
  } catch {
    return NextResponse.json({ source: "sample", date: null, rates: SAMPLE_FX });
  }
}

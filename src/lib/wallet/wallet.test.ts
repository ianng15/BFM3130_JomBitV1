import { describe, expect, it } from "vitest";
import { SAMPLE_FX } from "./config";
import { dec, format, mul } from "./decimal";
import { cryptoBuyQuote, cryptoSellQuote, fxAmountNeeded, fxQuote, interchange, stakingPayout, stakingReward } from "./quotes";

describe("decimal", () => {
  it("parses and formats without float error", () => {
    expect(format(dec("0.1") + dec("0.2"))).toBe("0.3");
    expect(format(mul(dec("0.00012345"), dec("455000")), 2, true)).toBe("56.16");
  });
});

describe("quotes", () => {
  it("fx quote applies the spread", () => {
    const q = fxQuote(SAMPLE_FX, "MYR", "THB", 10000); // RM100
    expect(q.receiveMinor).toBe(76416); // 768 × 0.995 = 764.16
    expect(q.feeMinorInTo).toBe(384);
  });

  it("fxAmountNeeded covers the target", () => {
    const need = fxAmountNeeded(SAMPLE_FX, "MYR", "THB", 50000);
    expect(fxQuote(SAMPLE_FX, "MYR", "THB", need).receiveMinor).toBeGreaterThanOrEqual(50000);
    expect(fxQuote(SAMPLE_FX, "MYR", "THB", need - 1).receiveMinor).toBeLessThan(50000);
  });

  it("crypto buy takes the fee then divides by ask", () => {
    const q = cryptoBuyQuote(10000, "5000");
    expect(q.feeMinor).toBe(100);
    expect(format(q.cryptoAmount)).toBe("0.0198");
  });

  it("crypto sell uses bid minus fee", () => {
    const q = cryptoSellQuote(dec("0.01"), "5000");
    expect(q.grossMinor).toBe(5000);
    expect(q.receiveMinor).toBe(4950);
  });

  it("staking reward grows linearly and commission is 10%", () => {
    const year = 365 * 24 * 60 * 60 * 1000;
    const r = stakingReward(dec("1"), 500, 0, year);
    expect(format(r)).toBe("0.05");
    const p = stakingPayout(dec("1"), r);
    expect(format(p.commission)).toBe("0.005");
    expect(format(p.total)).toBe("1.045");
  });

  it("interchange split sums exactly", () => {
    const i = interchange(12345);
    expect(i.jombitShareMinor + i.issuerShareMinor).toBe(i.interchangeMinor);
  });
});

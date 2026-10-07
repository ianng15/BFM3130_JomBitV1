import { describe, expect, it } from "vitest";
import { validatePayload } from "@/lib/duitnow";
import { createSeed } from "./seed";
import { balance, fiatBalanceMinor, groupNets, groupPayments } from "./logic";

describe("demo seed", () => {
  const s = createSeed();

  it("creates the users, groups and expenses from SPEC.md §3", () => {
    expect(s.users.map((u) => u.displayName)).toEqual(["Aiman", "Mei Ling", "Priya", "Daniel"]);
    expect(s.groups.map((g) => g.name)).toEqual(["Mamak Friday", "Bangkok Trip"]);
    expect(s.expenses.filter((e) => e.groupId === "g_mamak")).toHaveLength(5);
    expect(s.expenses.some((e) => e.fromReceipt)).toBe(true);
  });

  it("group nets sum to zero and payments are ≤ n − 1", () => {
    for (const g of s.groups) {
      const nets = [...groupNets(s, g).values()];
      expect(nets.reduce((a, b) => a + b, 0)).toBe(0);
      expect(groupPayments(s, g).length).toBeLessThanOrEqual(g.members.length - 1);
    }
  });

  it("demo DuitNow payloads are valid test payloads", () => {
    for (const u of s.users) if (u.duitnowPayload) expect(validatePayload(u.duitnowPayload).ok).toBe(true);
    for (const st of s.settlements) expect(validatePayload(st.qrPayload!).ok).toBe(true);
  });

  it("wallets are non-negative", () => {
    for (const u of s.users) {
      expect(fiatBalanceMinor(s, u.id, "MYR")).toBeGreaterThan(0);
      for (const a of ["XBT", "ETH", "USDT", "SOL"]) expect(balance(s, u.id, a) >= BigInt(0)).toBe(true);
    }
    expect(s.cardTx.every((t) => t.status === "approved")).toBe(true);
  });
});

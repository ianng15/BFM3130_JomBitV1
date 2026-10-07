import { describe, expect, it } from "vitest";
import {
  allocateByWeights,
  allocateCharge,
  computeNets,
  equalShares,
  formatMoney,
  itemShares,
  parseToMinor,
  simplifyDebts,
  splitEqually,
} from "./index";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("money parsing and formatting", () => {
  it("parses decimal strings to minor units without floats", () => {
    expect(parseToMinor("12.50")).toBe(1250);
    expect(parseToMinor("1.8")).toBe(180);
    expect(parseToMinor("-0.02")).toBe(-2);
    expect(parseToMinor("0.105")).toBe(11);
    expect(parseToMinor("1,234.5")).toBe(123450);
    expect(parseToMinor("350", 0)).toBe(350);
    expect(parseToMinor("abc")).toBeNull();
    expect(parseToMinor("")).toBeNull();
  });

  it("formats money per DESIGN.md", () => {
    expect(formatMoney(123450, "MYR")).toBe("RM 1,234.50");
    expect(formatMoney(35000, "THB")).toBe("฿350.00");
    expect(formatMoney(-1250, "MYR")).toBe("−RM 12.50");
    expect(formatMoney(1250, "MYR", { sign: true })).toBe("+RM 12.50");
    expect(formatMoney(150000, "IDR")).toBe("IDR 150,000");
  });
});

describe("splitting with remainders (largest remainder)", () => {
  it("splits 100 sen three ways into 34/33/33", () => {
    expect(splitEqually(100, 3)).toEqual([34, 33, 33]);
  });

  it("always sums exactly to the total", () => {
    for (const total of [1, 7, 99, 1000, 4930, 123457]) {
      for (let n = 1; n <= 7; n++) {
        const parts = splitEqually(total, n);
        expect(sum(parts)).toBe(total);
        expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("handles negative totals (rounding adjustments)", () => {
    const parts = allocateByWeights(-5, [1, 1, 1]);
    expect(sum(parts)).toBe(-5);
    expect(parts).toEqual([-2, -2, -1]);
  });

  it("equalShares attaches user ids", () => {
    expect(equalShares(1000, ["a", "b", "c"])).toEqual([
      { userId: "a", amount: 334 },
      { userId: "b", amount: 333 },
      { userId: "c", amount: 333 },
    ]);
  });
});

describe("proportional tax / service allocation", () => {
  it("allocates service charge in proportion to item subtotals", () => {
    // subtotals RM30 / RM10 → 10% service RM4.00 → 3.00 / 1.00
    expect(allocateCharge(400, [3000, 1000])).toEqual([300, 100]);
  });

  it("allocates awkward charges so they still sum exactly", () => {
    const charges = allocateCharge(279, [1234, 2345, 651]);
    expect(sum(charges)).toBe(279);
  });

  it("itemShares: items + charges = total, charges proportional", () => {
    const items = [
      { lineTotal: 3000, assignedTo: ["a"] },
      { lineTotal: 1000, assignedTo: ["b"] },
      { lineTotal: 600, assignedTo: ["a", "b", "c"] },
    ];
    // items 4600 + service 460 + sst 276 - rounding 1 = 5335
    const shares = itemShares(items, 5335, ["a", "b", "c"]);
    expect(sum(shares.map((s) => s.amount))).toBe(5335);
    const a = shares.find((s) => s.userId === "a")!.amount;
    const b = shares.find((s) => s.userId === "b")!.amount;
    const c = shares.find((s) => s.userId === "c")!.amount;
    // a's items 3200, b's 1200, c's 200 → a pays the most charges
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
    expect(a - 3200).toBeGreaterThan(b - 1200);
  });

  it("itemShares rejects unassigned items", () => {
    expect(() => itemShares([{ lineTotal: 100, assignedTo: [] }], 100, ["a"])).toThrow();
  });
});

describe("balances and debt simplification", () => {
  const members = ["aiman", "mei", "priya", "daniel"];
  const expenses = [
    { paidBy: "aiman", total: 10000, shares: equalShares(10000, members) },
    { paidBy: "mei", total: 4930, shares: equalShares(4930, ["mei", "priya", "daniel"]) },
    { paidBy: "priya", total: 777, shares: equalShares(777, ["aiman", "daniel"]) },
    { paidBy: "daniel", total: 12345, shares: equalShares(12345, members) },
  ];

  it("nets sum to zero", () => {
    const nets = computeNets(members, expenses, []);
    expect(sum([...nets.values()])).toBe(0);
  });

  it("only confirmed settlements change balances", () => {
    const before = computeNets(members, expenses, []);
    const after = computeNets(members, expenses, [
      { fromUser: "priya", toUser: "aiman", amount: 500, status: "pending" },
      { fromUser: "priya", toUser: "aiman", amount: 700, status: "confirmed" },
    ]);
    expect(after.get("priya")).toBe(before.get("priya")! + 700);
    expect(after.get("aiman")).toBe(before.get("aiman")! - 700);
    expect(sum([...after.values()])).toBe(0);
  });

  it("simplification settles everything", () => {
    const nets = computeNets(members, expenses, []);
    const payments = simplifyDebts(nets);
    const settled = computeNets(
      members,
      expenses,
      payments.map((p) => ({ fromUser: p.from, toUser: p.to, amount: p.amount, status: "confirmed" as const })),
    );
    for (const v of settled.values()) expect(v).toBe(0);
    for (const p of payments) expect(p.amount).toBeGreaterThan(0);
  });

  it("simplification gives at most n − 1 payments", () => {
    // random-ish groups
    let seed = 42;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let trial = 0; trial < 50; trial++) {
      const n = 2 + Math.floor(rand() * 7);
      const ids = Array.from({ length: n }, (_, i) => `u${i}`);
      const exps = Array.from({ length: 1 + Math.floor(rand() * 8) }, () => {
        const total = 1 + Math.floor(rand() * 50000);
        return { paidBy: ids[Math.floor(rand() * n)], total, shares: equalShares(total, ids) };
      });
      const nets = computeNets(ids, exps, []);
      expect(sum([...nets.values()])).toBe(0);
      const payments = simplifyDebts(nets);
      expect(payments.length).toBeLessThanOrEqual(n - 1);
    }
  });

  it("returns no payments when everyone is square", () => {
    expect(simplifyDebts(new Map([["a", 0], ["b", 0]]))).toEqual([]);
  });
});

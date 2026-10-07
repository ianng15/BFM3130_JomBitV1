import { allocateByWeights, splitEqually } from "./money";

/** A member's final share of an expense (minor units). */
export interface Share {
  userId: string;
  amount: number;
}

export interface LedgerExpense {
  paidBy: string;
  total: number;
  shares: Share[];
}

export interface LedgerSettlement {
  fromUser: string;
  toUser: string;
  amount: number;
  status: "pending" | "confirmed" | "cancelled";
}

export interface Payment {
  from: string;
  to: string;
  amount: number;
}

/** Equal split of `total` among `userIds` (order decides who gets extra sen). */
export function equalShares(total: number, userIds: string[]): Share[] {
  return splitEqually(total, userIds.length).map((amount, i) => ({ userId: userIds[i], amount }));
}

export interface ItemForSplit {
  lineTotal: number;
  assignedTo: string[];
}

/**
 * Receipt split ("by items").
 * 1. Each item's line total is split equally among the people assigned to it.
 * 2. Everything on top of the items (service charge, SST, rounding) — i.e.
 *    `total − sum(items)` — is allocated in proportion to each person's item
 *    subtotal, using the largest-remainder method.
 * The resulting shares always sum exactly to `total`.
 */
export function itemShares(items: ItemForSplit[], total: number, memberOrder: string[]): Share[] {
  const subtotal = new Map<string, number>();
  for (const item of items) {
    if (item.assignedTo.length === 0) throw new Error("every item must be assigned to someone");
    const parts = splitEqually(item.lineTotal, item.assignedTo.length);
    item.assignedTo.forEach((u, i) => subtotal.set(u, (subtotal.get(u) ?? 0) + parts[i]));
  }
  const people = memberOrder.filter((u) => subtotal.has(u));
  for (const u of subtotal.keys()) if (!people.includes(u)) people.push(u);
  const itemsSum = items.reduce((a, it) => a + it.lineTotal, 0);
  const extra = total - itemsSum;
  const weights = people.map((u) => Math.max(0, subtotal.get(u) ?? 0));
  const extras = allocateByWeights(extra, weights);
  return people.map((u, i) => ({ userId: u, amount: (subtotal.get(u) ?? 0) + extras[i] }));
}

/**
 * Proportional allocation of a charge (service charge / SST) given each
 * person's item subtotal. Exposed separately for clarity and tests.
 */
export function allocateCharge(charge: number, subtotals: number[]): number[] {
  return allocateByWeights(charge, subtotals);
}

/**
 * net = paid − shares + settlements paid out − settlements received
 * Only confirmed settlements count. Positive = others owe them.
 */
export function computeNets(
  memberIds: string[],
  expenses: LedgerExpense[],
  settlements: LedgerSettlement[],
): Map<string, number> {
  const nets = new Map<string, number>(memberIds.map((id) => [id, 0]));
  const add = (id: string, v: number) => nets.set(id, (nets.get(id) ?? 0) + v);
  for (const e of expenses) {
    add(e.paidBy, e.total);
    for (const s of e.shares) add(s.userId, -s.amount);
  }
  for (const s of settlements) {
    if (s.status !== "confirmed") continue;
    add(s.fromUser, s.amount);
    add(s.toUser, -s.amount);
  }
  return nets;
}

/**
 * Greedy debt simplification: repeatedly match the largest creditor with the
 * largest debtor and transfer min(|credit|, |debt|). Produces at most
 * (members − 1) payments. This simplifies debts a lot, but is not guaranteed
 * to be the mathematical minimum in every case.
 */
export function simplifyDebts(nets: Map<string, number>): Payment[] {
  const creditors: { id: string; amt: number }[] = [];
  const debtors: { id: string; amt: number }[] = [];
  for (const [id, net] of nets) {
    if (net > 0) creditors.push({ id, amt: net });
    else if (net < 0) debtors.push({ id, amt: -net });
  }
  const byAmount = (a: { id: string; amt: number }, b: { id: string; amt: number }) =>
    b.amt - a.amt || a.id.localeCompare(b.id);
  const payments: Payment[] = [];
  while (creditors.length && debtors.length) {
    creditors.sort(byAmount);
    debtors.sort(byAmount);
    const c = creditors[0];
    const d = debtors[0];
    const amount = Math.min(c.amt, d.amt);
    payments.push({ from: d.id, to: c.id, amount });
    c.amt -= amount;
    d.amt -= amount;
    if (c.amt === 0) creditors.shift();
    if (d.amt === 0) debtors.shift();
  }
  return payments;
}

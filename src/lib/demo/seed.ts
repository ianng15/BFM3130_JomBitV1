/**
 * Demo seed data (SPEC.md §3). Everything here is fictional; the DuitNow
 * payloads are structurally valid TEST payloads, not real accounts.
 */
import { equalShares, itemShares, parseToMinor } from "@/lib/ledger";
import { makeDemoPayload } from "@/lib/duitnow";
import { SAMPLE_RECEIPTS } from "@/lib/receipts";
import { SAMPLE_FX, SAMPLE_MERCHANTS, SAMPLE_TICKERS } from "@/lib/wallet/config";
import { dec } from "@/lib/wallet/decimal";
import {
  addExpense,
  buyCrypto,
  createDuitNowSettlement,
  exchange,
  issueVirtualCard,
  simulatePurchase,
  stake,
  topUp,
  uid,
} from "./logic";
import type { DemoState, ExpenseItem, Group, Profile } from "./types";

export const DEMO_VERSION = 1;

export const DEMO_USERS: Profile[] = [
  { id: "u_aiman", displayName: "Aiman", phone: "+60 12-000 0001", colour: 0, duitnowPayload: null, duitnowName: null, homeCurrency: "MYR", isDemo: true },
  { id: "u_mei", displayName: "Mei Ling", phone: "+60 12-000 0002", colour: 1, duitnowPayload: null, duitnowName: null, homeCurrency: "MYR", isDemo: true },
  { id: "u_priya", displayName: "Priya", phone: "+60 12-000 0003", colour: 2, duitnowPayload: null, duitnowName: null, homeCurrency: "MYR", isDemo: true },
  { id: "u_daniel", displayName: "Daniel", phone: "+60 12-000 0004", colour: 3, duitnowPayload: null, duitnowName: null, homeCurrency: "MYR", isDemo: true },
];

const daysAgo = (d: number, hour = 20) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(hour, 0, 0, 0);
  return t.toISOString();
};
const dateOnly = (iso: string) => iso.slice(0, 10);
const RM = (s: string) => parseToMinor(s, 2)!;

export function createSeed(): DemoState {
  const s: DemoState = {
    version: DEMO_VERSION,
    currentUserId: null,
    users: DEMO_USERS.map((u, i) => {
      const payload = makeDemoPayload(`${u.displayName} (Demo)`, `000${i + 1}`);
      // Daniel has no DuitNow QR yet, to show the "add your QR" prompt.
      return u.id === "u_daniel" ? { ...u } : { ...u, duitnowPayload: payload, duitnowName: `${u.displayName.toUpperCase()} (DEMO)` };
    }),
    groups: [],
    expenses: [],
    settlements: [],
    walletTx: [],
    stakes: [],
    cards: [],
    cardTx: [],
  };

  const [A, M, P, D] = ["u_aiman", "u_mei", "u_priya", "u_daniel"];
  const member = (userId: string, role: "owner" | "member" = "member") => ({ userId, role, joinedAt: daysAgo(30) });

  const mamak: Group = {
    id: "g_mamak",
    name: "Mamak Friday",
    icon: "🍛",
    currency: "MYR",
    isTrip: false,
    inviteCode: "MAMAK4",
    createdBy: A,
    createdAt: daysAgo(30),
    members: [member(A, "owner"), member(M), member(P), member(D)],
  };
  const bangkok: Group = {
    id: "g_bkk",
    name: "Bangkok Trip",
    icon: "✈️",
    currency: "THB",
    isTrip: true,
    inviteCode: "BKK26T",
    createdBy: M,
    createdAt: daysAgo(20),
    members: [member(M, "owner"), member(A), member(P)],
  };
  s.groups.push(mamak, bangkok);

  const base = {
    merchant: null,
    subtotal: 0,
    serviceCharge: 0,
    sst: 0,
    rounding: 0,
    fromReceipt: false,
    items: [] as ExpenseItem[],
  };

  // --- Mamak Friday (5 expenses incl. one scanned receipt) ---
  const r = SAMPLE_RECEIPTS[0].receipt;
  const assign: string[][] = [[A, M, P, D], [A, D], [A, M, P], [P], [D]];
  const items: ExpenseItem[] = r.items.map((it, i) => ({
    id: uid("itm"),
    name: it.name,
    quantity: it.quantity,
    unitPrice: RM(String(it.unit_price)),
    lineTotal: RM(String(it.line_total)),
    assignedTo: assign[i],
  }));
  const receiptTotal = RM(String(r.total));
  addExpense(s, {
    ...base,
    groupId: mamak.id,
    description: "Friday mamak supper",
    merchant: r.merchant,
    expenseDate: dateOnly(daysAgo(5)),
    currency: "MYR",
    subtotal: RM(String(r.subtotal)),
    total: receiptTotal,
    paidBy: A,
    splitMethod: "items",
    fromReceipt: true,
    items,
    shares: itemShares(items, receiptTotal, [A, M, P, D]),
    createdBy: A,
  });
  const everyone = [A, M, P, D];
  const simple = (
    groupId: string,
    currency: string,
    description: string,
    total: number,
    paidBy: string,
    people: string[],
    ago: number,
  ) =>
    addExpense(s, {
      ...base,
      groupId,
      description,
      expenseDate: dateOnly(daysAgo(ago)),
      currency,
      subtotal: total,
      total,
      paidBy,
      splitMethod: "equal",
      shares: equalShares(total, people),
      createdBy: paidBy,
    });
  simple(mamak.id, "MYR", "Futsal court booking", RM("120.00"), D, everyone, 12);
  simple(mamak.id, "MYR", "Grab rides home", RM("38.40"), M, [M, P, D], 12);
  simple(mamak.id, "MYR", "Teh tarik & roti round 2", RM("45.60"), P, everyone, 7);
  addExpense(s, {
    ...base,
    groupId: mamak.id,
    description: "Movie tickets (Aiman's student price)",
    expenseDate: dateOnly(daysAgo(3)),
    currency: "MYR",
    subtotal: RM("88.00"),
    total: RM("88.00"),
    paidBy: A,
    splitMethod: "exact",
    shares: [
      { userId: A, amount: RM("20.00") },
      { userId: M, amount: RM("22.67") },
      { userId: P, amount: RM("22.67") },
      { userId: D, amount: RM("22.66") },
    ],
    createdBy: A,
  });

  // --- Bangkok Trip (THB) ---
  const trip = [M, A, P];
  simple(bangkok.id, "THB", "Hotel Sukhumvit, 2 nights", 450000, A, trip, 18);
  simple(bangkok.id, "THB", "Tuk-tuk & BTS rides", 62000, P, trip, 17);
  simple(bangkok.id, "THB", "Chatuchak lunch", 87000, M, trip, 17);
  simple(bangkok.id, "THB", "Muay Thai tickets", 300000, M, trip, 16);

  // --- Wallets ---
  topUp(s, A, RM("850.00"), "Maybank2u (simulated)");
  topUp(s, M, RM("600.00"), "CIMB Clicks (simulated)");
  topUp(s, P, RM("400.00"), "Public Bank (simulated)");
  topUp(s, D, RM("300.00"), "RHB Now (simulated)");
  exchange(s, A, "MYR", "THB", RM("150.00"), SAMPLE_FX);
  exchange(s, P, "MYR", "SGD", RM("160.00"), SAMPLE_FX);

  const ask = (pair: string) => SAMPLE_TICKERS.find((t) => t.pair === pair)!.ask;
  buyCrypto(s, A, "XBT", RM("200.00"), ask("XBTMYR"));
  buyCrypto(s, A, "ETH", RM("150.00"), ask("ETHMYR"));
  buyCrypto(s, M, "USDT", RM("100.00"), ask("USDTMYR"));
  buyCrypto(s, D, "SOL", RM("80.00"), ask("SOLMYR"));
  stake(s, A, "ETH", dec("0.004"));

  // --- Card (Aiman) ---
  const cardId = issueVirtualCard(s, A);
  const bids = Object.fromEntries(SAMPLE_TICKERS.map((t) => [t.pair.replace("MYR", ""), t.bid]));
  simulatePurchase(s, cardId, SAMPLE_MERCHANTS[4], RM("13.90"), bids);
  simulatePurchase(s, cardId, SAMPLE_MERCHANTS[1], RM("42.35"), bids);
  simulatePurchase(s, cardId, SAMPLE_MERCHANTS[3], RM("28.00"), bids);
  simulatePurchase(s, cardId, SAMPLE_MERCHANTS[0], RM("19.50"), bids);

  // --- A pending DuitNow settlement waiting for Aiman to confirm ---
  createDuitNowSettlement(s, { groupId: mamak.id, fromUser: D, toUser: A, amount: RM("20.00") });

  // Spread timestamps over the past days so history looks natural.
  const n = s.walletTx.length;
  s.walletTx.forEach((t, i) => (t.createdAt = new Date(Date.now() - (n - i) * 9 * 3600_000).toISOString()));
  s.cardTx.forEach((t, i) => (t.createdAt = daysAgo(4 - i, 13)));
  s.stakes.forEach((p) => (p.startedAt = daysAgo(30, 10)));
  s.cards.forEach((c) => (c.createdAt = daysAgo(25)));
  s.settlements.forEach((x) => (x.createdAt = daysAgo(0, 9)));
  return s;
}

/**
 * Selectors and mutations over the demo state. Mutations work on a draft copy
 * and throw an Error with a friendly message when something isn't allowed.
 */
import { computeNets, minorDigits, minorToDecimalString, simplifyDebts, type Payment } from "@/lib/ledger";
import { buildDynamicPayload } from "@/lib/duitnow";
import { PHYSICAL_CARD_FEES_SEN, STAKING_APY_BPS } from "@/lib/wallet/config";
import { add, dec, div, format, fromMinor, toMinor, type Dec } from "@/lib/wallet/decimal";
import {
  cryptoBuyQuote,
  cryptoSellQuote,
  fxAmountNeeded,
  fxQuote,
  interchange,
  stakingPayout,
  stakingReward,
  type FxRates,
} from "@/lib/wallet/quotes";
import type { Card, DemoState, Expense, Group, Settlement, WalletKind, WalletTx } from "./types";

// ---------- helpers ----------

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

const nowIso = () => new Date().toISOString();

export function makeInviteCode(existing: string[]): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    let code = "";
    for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!existing.includes(code)) return code;
  }
}

function luhnDigit(partial: string): string {
  let sum = 0;
  const digits = partial.split("").reverse().map(Number);
  digits.forEach((d, i) => {
    let v = d;
    if (i % 2 === 0) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
  });
  return String((10 - (sum % 10)) % 10);
}

/** Fake card number in the 4000 00xx test range, with a valid Luhn digit. */
export function fakeCardNumber(): string {
  let body = "400000";
  for (let i = 0; i < 9; i++) body += Math.floor(Math.random() * 10);
  return body + luhnDigit(body);
}

function fakeExpiry(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String((d.getFullYear() + 4) % 100).padStart(2, "0")}`;
}

function authCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function fiatString(minor: number, currency: string): string {
  return minorToDecimalString(minor, minorDigits(currency));
}

// ---------- selectors ----------

export const userById = (s: DemoState, id: string) => s.users.find((u) => u.id === id);
export const userName = (s: DemoState, id: string) => userById(s, id)?.displayName ?? "Someone";
export const groupById = (s: DemoState, id: string) => s.groups.find((g) => g.id === id);
export const isMember = (g: Group, userId: string) => g.members.some((m) => m.userId === userId);
export const myGroups = (s: DemoState, userId: string) => s.groups.filter((g) => isMember(g, userId));
export const groupExpenses = (s: DemoState, groupId: string) =>
  s.expenses
    .filter((e) => e.groupId === groupId)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.createdAt.localeCompare(a.createdAt));
export const groupSettlements = (s: DemoState, groupId: string) =>
  s.settlements.filter((x) => x.groupId === groupId);

export function groupNets(s: DemoState, group: Group): Map<string, number> {
  const memberIds = group.members.map((m) => m.userId);
  // Former members with history still need to appear in the maths.
  const nets = computeNets(memberIds, groupExpenses(s, group.id), groupSettlements(s, group.id));
  return nets;
}

export function groupPayments(s: DemoState, group: Group): Payment[] {
  return simplifyDebts(groupNets(s, group));
}

/** Per-currency totals across all groups: owed to me / I owe. */
export function myTotals(s: DemoState, userId: string) {
  const totals = new Map<string, { owed: number; owe: number }>();
  for (const g of myGroups(s, userId)) {
    const net = groupNets(s, g).get(userId) ?? 0;
    const t = totals.get(g.currency) ?? { owed: 0, owe: 0 };
    if (net > 0) t.owed += net;
    if (net < 0) t.owe += -net;
    totals.set(g.currency, t);
  }
  return totals;
}

export function balance(s: DemoState, userId: string, asset: string): Dec {
  let total = dec("0");
  for (const t of s.walletTx) if (t.userId === userId && t.asset === asset) total = add(total, dec(t.amount));
  return total;
}

/** Fiat balance in minor units. */
export function fiatBalanceMinor(s: DemoState, userId: string, currency: string): number {
  return toMinor(balance(s, userId, currency), minorDigits(currency));
}

export function userTx(s: DemoState, userId: string) {
  return s.walletTx.filter((t) => t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const activeStakes = (s: DemoState, userId: string) =>
  s.stakes.filter((p) => p.userId === userId && p.status === "active");

export const userCards = (s: DemoState, userId: string) => s.cards.filter((c) => c.userId === userId);

// ---------- wallet primitives ----------

function pushTx(
  s: DemoState,
  tx: Omit<WalletTx, "id" | "createdAt" | "metadata" | "referenceId"> & {
    metadata?: WalletTx["metadata"];
    referenceId?: string | null;
    createdAt?: string;
  },
) {
  s.walletTx.push({
    id: uid("wtx"),
    createdAt: tx.createdAt ?? nowIso(),
    referenceId: tx.referenceId ?? null,
    metadata: tx.metadata ?? {},
    ...tx,
  });
}

function fiatTx(
  s: DemoState,
  userId: string,
  currency: string,
  minor: number,
  kind: WalletKind,
  description: string,
  extra: { metadata?: WalletTx["metadata"]; referenceId?: string; createdAt?: string } = {},
) {
  pushTx(s, { userId, wallet: "fiat", asset: currency, amount: fiatString(minor, currency), kind, description, ...extra });
}

function cryptoTx(
  s: DemoState,
  userId: string,
  asset: string,
  amount: Dec,
  kind: WalletKind,
  description: string,
  extra: { metadata?: WalletTx["metadata"]; referenceId?: string; createdAt?: string } = {},
) {
  pushTx(s, { userId, wallet: "crypto", asset, amount: format(amount, 18), kind, description, ...extra });
}

function requireFiat(s: DemoState, userId: string, currency: string, minor: number) {
  if (fiatBalanceMinor(s, userId, currency) < minor) {
    throw new Error(`Not enough ${currency} in your wallet.`);
  }
}

function requirePositive(minor: number) {
  if (!Number.isSafeInteger(minor) || minor <= 0) throw new Error("Enter an amount greater than zero.");
}

// ---------- mutations: profile & groups ----------

export function createGroup(
  s: DemoState,
  userId: string,
  input: { name: string; icon: string; currency: string; isTrip: boolean },
): string {
  if (!input.name.trim()) throw new Error("Give the group a name.");
  const id = uid("grp");
  s.groups.push({
    id,
    name: input.name.trim(),
    icon: input.icon,
    currency: input.currency,
    isTrip: input.isTrip,
    inviteCode: makeInviteCode(s.groups.map((g) => g.inviteCode)),
    createdBy: userId,
    createdAt: nowIso(),
    members: [{ userId, role: "owner", joinedAt: nowIso() }],
  });
  return id;
}

export function joinGroup(s: DemoState, userId: string, code: string): string {
  const g = s.groups.find((x) => x.inviteCode === code.trim().toUpperCase());
  if (!g) throw new Error("No group found with that code.");
  if (!isMember(g, userId)) g.members.push({ userId, role: "member", joinedAt: nowIso() });
  return g.id;
}

export function leaveGroup(s: DemoState, userId: string, groupId: string) {
  const g = groupById(s, groupId);
  if (!g) return;
  const net = groupNets(s, g).get(userId) ?? 0;
  if (net !== 0) throw new Error("Settle up first — you can only leave when your balance is zero.");
  g.members = g.members.filter((m) => m.userId !== userId);
}

// ---------- mutations: expenses ----------

export function addExpense(s: DemoState, expense: Omit<Expense, "id" | "createdAt">): string {
  const sum = expense.shares.reduce((a, x) => a + x.amount, 0);
  if (sum !== expense.total) throw new Error("Shares must add up to the total.");
  if (expense.total <= 0) throw new Error("Amount must be more than zero.");
  const id = uid("exp");
  s.expenses.push({ ...expense, id, createdAt: nowIso() });
  return id;
}

export function deleteExpense(s: DemoState, expenseId: string) {
  s.expenses = s.expenses.filter((e) => e.id !== expenseId);
}

// ---------- mutations: settlements ----------

export function createDuitNowSettlement(
  s: DemoState,
  input: { groupId: string; fromUser: string; toUser: string; amount: number },
): string {
  const g = groupById(s, input.groupId);
  if (!g) throw new Error("Group not found.");
  if (g.currency !== "MYR") throw new Error("DuitNow only works in MYR.");
  const payee = userById(s, input.toUser);
  if (!payee?.duitnowPayload) throw new Error(`${payee?.displayName ?? "The payee"} hasn't added a DuitNow QR yet.`);
  requirePositive(input.amount);
  const id = uid("stl");
  s.settlements.push({
    id,
    ...input,
    currency: "MYR",
    method: "duitnow",
    status: "pending",
    qrPayload: buildDynamicPayload(payee.duitnowPayload, fiatString(input.amount, "MYR")),
    createdAt: nowIso(),
    confirmedAt: null,
  });
  return id;
}

export function setSettlementStatus(s: DemoState, settlementId: string, status: Settlement["status"]) {
  const st = s.settlements.find((x) => x.id === settlementId);
  if (!st || st.status !== "pending") throw new Error("This settlement is no longer pending.");
  st.status = status;
  if (status === "confirmed") st.confirmedAt = nowIso();
}

/**
 * Pay a group debt from the JomBit wallet. Debits payer, credits payee and
 * records a confirmed settlement in one step. If the payer lacks the group
 * currency and `convertFromMyr` is set, MYR is exchanged first.
 */
export function payWithWallet(
  s: DemoState,
  input: { groupId: string; fromUser: string; toUser: string; amount: number; convertFromMyr: boolean; rates: FxRates },
): string {
  const g = groupById(s, input.groupId);
  if (!g) throw new Error("Group not found.");
  requirePositive(input.amount);
  const cur = g.currency;
  const have = fiatBalanceMinor(s, input.fromUser, cur);
  if (have < input.amount) {
    if (!input.convertFromMyr || cur === "MYR") throw new Error(`Not enough ${cur} in your wallet.`);
    const shortfall = input.amount - have;
    exchangeFor(s, input.fromUser, cur, shortfall, input.rates);
  }
  const id = uid("stl");
  const desc = `${g.name}: settle up`;
  fiatTx(s, input.fromUser, cur, -input.amount, "transfer_out", `${desc} → ${userName(s, input.toUser)}`, { referenceId: id });
  fiatTx(s, input.toUser, cur, input.amount, "transfer_in", `${desc} ← ${userName(s, input.fromUser)}`, { referenceId: id });
  s.settlements.push({
    id,
    groupId: g.id,
    fromUser: input.fromUser,
    toUser: input.toUser,
    amount: input.amount,
    currency: cur,
    method: "wallet",
    status: "confirmed",
    qrPayload: null,
    createdAt: nowIso(),
    confirmedAt: nowIso(),
  });
  return id;
}

// ---------- mutations: fiat wallet ----------

export function topUp(s: DemoState, userId: string, minor: number, bank: string) {
  requirePositive(minor);
  fiatTx(s, userId, "MYR", minor, "topup", `Top up via FPX (simulated) — ${bank}`, { metadata: { source: bank } });
}

export function withdraw(s: DemoState, userId: string, minor: number) {
  requirePositive(minor);
  requireFiat(s, userId, "MYR", minor);
  fiatTx(s, userId, "MYR", -minor, "withdraw", "Withdraw to linked bank account (simulated)");
}

export function transfer(s: DemoState, fromUser: string, toUser: string, currency: string, minor: number, note: string) {
  requirePositive(minor);
  if (fromUser === toUser) throw new Error("Choose someone else.");
  requireFiat(s, fromUser, currency, minor);
  const ref = uid("trf");
  fiatTx(s, fromUser, currency, -minor, "transfer_out", `To ${userName(s, toUser)}${note ? ` — ${note}` : ""}`, { referenceId: ref });
  fiatTx(s, toUser, currency, minor, "transfer_in", `From ${userName(s, fromUser)}${note ? ` — ${note}` : ""}`, { referenceId: ref });
}

export function exchange(s: DemoState, userId: string, from: string, to: string, minor: number, rates: FxRates) {
  requirePositive(minor);
  if (from === to) throw new Error("Pick two different currencies.");
  requireFiat(s, userId, from, minor);
  const q = fxQuote(rates, from, to, minor);
  if (q.receiveMinor <= 0) throw new Error("Amount is too small to exchange.");
  const ref = uid("fx");
  const metadata = {
    mid_rate: format(BigInt(q.midRate), 8),
    rate: format(BigInt(q.appliedRate), 8),
    spread_bps: q.spreadBps,
    fee: fiatString(q.feeMinorInTo, to),
  };
  fiatTx(s, userId, from, -minor, "fx_out", `Exchange ${from} → ${to}`, { referenceId: ref, metadata });
  fiatTx(s, userId, to, q.receiveMinor, "fx_in", `Exchange ${from} → ${to}`, { referenceId: ref, metadata });
}

/** Convert just enough MYR to get `needMinor` of `to`. */
function exchangeFor(s: DemoState, userId: string, to: string, needMinor: number, rates: FxRates) {
  exchange(s, userId, "MYR", to, fxAmountNeeded(rates, "MYR", to, needMinor), rates);
}

// ---------- mutations: crypto ----------

export function buyCrypto(s: DemoState, userId: string, asset: string, myrMinor: number, ask: string) {
  requirePositive(myrMinor);
  requireFiat(s, userId, "MYR", myrMinor);
  const q = cryptoBuyQuote(myrMinor, ask);
  const ref = uid("buy");
  const metadata = { price: ask, fee: fiatString(q.feeMinor, "MYR"), source: "Luno ask (simulated order)" };
  fiatTx(s, userId, "MYR", -myrMinor, "crypto_buy", `Buy ${asset}`, { referenceId: ref, metadata });
  cryptoTx(s, userId, asset, q.cryptoAmount, "crypto_buy", `Buy ${asset}`, { referenceId: ref, metadata });
}

export function sellCrypto(s: DemoState, userId: string, asset: string, amount: Dec, bid: string) {
  if (amount <= BigInt(0)) throw new Error("Enter an amount greater than zero.");
  if (balance(s, userId, asset) < amount) throw new Error(`Not enough ${asset}.`);
  const q = cryptoSellQuote(amount, bid);
  if (q.receiveMinor <= 0) throw new Error("Amount is too small to sell.");
  const ref = uid("sell");
  const metadata = { price: bid, fee: fiatString(q.feeMinor, "MYR"), source: "Luno bid (simulated order)" };
  cryptoTx(s, userId, asset, -amount, "crypto_sell", `Sell ${asset}`, { referenceId: ref, metadata });
  fiatTx(s, userId, "MYR", q.receiveMinor, "crypto_sell", `Sell ${asset}`, { referenceId: ref, metadata });
}

export function stake(s: DemoState, userId: string, asset: string, amount: Dec) {
  if (amount <= BigInt(0)) throw new Error("Enter an amount greater than zero.");
  if (balance(s, userId, asset) < amount) throw new Error(`Not enough ${asset}.`);
  const id = uid("stk");
  const apyBps = STAKING_APY_BPS[asset] ?? 0;
  s.stakes.push({ id, userId, asset, amount: format(amount, 18), apyBps, startedAt: nowIso(), endedAt: null, status: "active" });
  cryptoTx(s, userId, asset, -amount, "stake", `Stake ${asset} via Luno (simulated)`, { referenceId: id, metadata: { apy_bps: apyBps } });
}

export function unstake(s: DemoState, positionId: string, now = Date.now()) {
  const p = s.stakes.find((x) => x.id === positionId);
  if (!p || p.status !== "active") throw new Error("This position is already closed.");
  const amount = dec(p.amount);
  const reward = stakingReward(amount, p.apyBps, Date.parse(p.startedAt), now);
  const payout = stakingPayout(amount, reward);
  p.status = "ended";
  p.endedAt = new Date(now).toISOString();
  cryptoTx(s, p.userId, p.asset, amount, "unstake", `Unstake ${p.asset} — principal`, { referenceId: p.id });
  cryptoTx(s, p.userId, p.asset, payout.netReward, "staking_reward", `Staking reward ${p.asset} (after JomBit commission)`, {
    referenceId: p.id,
    metadata: { gross_reward: format(reward, 18), jombit_commission: format(payout.commission, 18) },
  });
}

// ---------- mutations: card ----------

export function issueVirtualCard(s: DemoState, userId: string): string {
  const existing = userCards(s, userId).find((c) => c.type === "virtual");
  if (existing) return existing.id;
  const number = fakeCardNumber();
  const id = uid("card");
  s.cards.push({
    id,
    userId,
    type: "virtual",
    status: "active",
    number,
    last4: number.slice(-4),
    expiry: fakeExpiry(),
    cvv: String(Math.floor(100 + Math.random() * 900)),
    fundingWallet: "fiat",
    fundingAsset: "MYR",
    createdAt: nowIso(),
  });
  return id;
}

export function orderPhysicalCard(s: DemoState, userId: string, type: "plastic" | "metal"): string {
  if (userCards(s, userId).some((c) => c.type !== "virtual")) throw new Error("You already have a physical card.");
  const fee = PHYSICAL_CARD_FEES_SEN[type];
  requireFiat(s, userId, "MYR", fee);
  const number = fakeCardNumber();
  const id = uid("card");
  const virtual = userCards(s, userId).find((c) => c.type === "virtual");
  s.cards.push({
    id,
    userId,
    type,
    status: "ordered",
    number,
    last4: number.slice(-4),
    expiry: fakeExpiry(),
    cvv: String(Math.floor(100 + Math.random() * 900)),
    fundingWallet: virtual?.fundingWallet ?? "fiat",
    fundingAsset: virtual?.fundingAsset ?? "MYR",
    createdAt: nowIso(),
  });
  fiatTx(s, userId, "MYR", -fee, "card_fee", `${type === "metal" ? "Metal" : "Plastic"} card fee`, { referenceId: id });
  return id;
}

export function advanceCardStatus(s: DemoState, cardId: string) {
  const c = s.cards.find((x) => x.id === cardId);
  if (!c) return;
  const next: Partial<Record<Card["status"], Card["status"]>> = { ordered: "shipped", shipped: "delivered", delivered: "active" };
  const n = next[c.status];
  if (n) c.status = n;
}

export function toggleFreeze(s: DemoState, cardId: string) {
  const c = s.cards.find((x) => x.id === cardId);
  if (!c) return;
  if (c.status === "active") c.status = "frozen";
  else if (c.status === "frozen") c.status = "active";
}

export function setFunding(s: DemoState, userId: string, wallet: "fiat" | "crypto", asset: string) {
  for (const c of userCards(s, userId)) {
    c.fundingWallet = wallet;
    c.fundingAsset = asset;
  }
}

/** Authorise a simulated purchase against the card's funding source. */
export function simulatePurchase(
  s: DemoState,
  cardId: string,
  merchant: { name: string; mcc: string },
  amountMinor: number,
  bids: Record<string, string>,
): { approved: boolean; reason: string | null } {
  requirePositive(amountMinor);
  const c = s.cards.find((x) => x.id === cardId);
  if (!c) throw new Error("Card not found.");
  const id = uid("ctx");
  const fee = interchange(amountMinor);
  let reason: string | null = null;
  let fundingAmount = dec("0");
  let conversionRate: string | null = null;

  if (c.status !== "active") reason = c.status === "frozen" ? "Card is frozen" : "Card not active yet";
  else if (c.fundingWallet === "fiat") {
    fundingAmount = fromMinor(amountMinor, 2);
    if (fiatBalanceMinor(s, c.userId, "MYR") < amountMinor) reason = "Insufficient MYR balance";
  } else {
    const bid = bids[c.fundingAsset];
    if (!bid) reason = "No price available";
    else {
      conversionRate = bid;
      // Add the smallest unit so the MYR value is always fully covered.
      fundingAmount = div(fromMinor(amountMinor, 2), dec(bid)) + BigInt(1);
      if (balance(s, c.userId, c.fundingAsset) < fundingAmount) reason = `Insufficient ${c.fundingAsset} balance`;
    }
  }

  const approved = reason === null;
  s.cardTx.push({
    id,
    cardId,
    merchantName: merchant.name,
    mcc: merchant.mcc,
    amount: amountMinor,
    currency: "MYR",
    fundingWallet: c.fundingWallet,
    fundingAsset: c.fundingAsset,
    fundingAmount: format(fundingAmount, 18),
    conversionRate,
    interchangeRateBps: fee.interchangeRateBps,
    interchangeAmount: approved ? fee.interchangeMinor : 0,
    jombitShare: approved ? fee.jombitShareMinor : 0,
    issuerShare: approved ? fee.issuerShareMinor : 0,
    authCode: approved ? authCode() : "",
    status: approved ? "approved" : "declined",
    declineReason: reason,
    createdAt: nowIso(),
  });
  if (approved) {
    if (c.fundingWallet === "fiat") {
      fiatTx(s, c.userId, "MYR", -amountMinor, "card_spend", `Card •${c.last4} — ${merchant.name}`, { referenceId: id });
    } else {
      cryptoTx(s, c.userId, c.fundingAsset, -fundingAmount, "card_spend", `Card •${c.last4} — ${merchant.name}`, {
        referenceId: id,
        metadata: { rate: conversionRate ?? "", myr: fiatString(amountMinor, "MYR") },
      });
    }
  }
  return { approved, reason };
}

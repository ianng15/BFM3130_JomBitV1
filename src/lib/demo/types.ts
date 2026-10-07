/**
 * Demo-mode data model. Mirrors the Supabase tables in SPEC.md §6 but lives in
 * the browser's localStorage. Fiat ledger amounts are integer minor units;
 * wallet amounts are decimal strings (like Postgres `numeric`).
 */

export interface Profile {
  id: string;
  displayName: string;
  phone: string;
  /** Avatar colour slot 0–5 (maps to design tokens). */
  colour: number;
  duitnowPayload: string | null;
  duitnowName: string | null;
  homeCurrency: string;
  isDemo: boolean;
}

export interface GroupMember {
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  currency: string;
  isTrip: boolean;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
}

export interface ExpenseItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  assignedTo: string[];
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  merchant: string | null;
  expenseDate: string;
  currency: string;
  subtotal: number;
  serviceCharge: number;
  sst: number;
  rounding: number;
  total: number;
  paidBy: string;
  splitMethod: "equal" | "exact" | "items";
  fromReceipt: boolean;
  items: ExpenseItem[];
  shares: { userId: string; amount: number }[];
  createdBy: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  currency: string;
  method: "duitnow" | "wallet";
  status: "pending" | "confirmed" | "cancelled";
  qrPayload: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export type WalletKind =
  | "topup"
  | "withdraw"
  | "transfer_in"
  | "transfer_out"
  | "fx_in"
  | "fx_out"
  | "crypto_buy"
  | "crypto_sell"
  | "stake"
  | "unstake"
  | "staking_reward"
  | "card_spend"
  | "card_fee";

export interface WalletTx {
  id: string;
  userId: string;
  wallet: "fiat" | "crypto";
  asset: string;
  /** Signed decimal string. */
  amount: string;
  kind: WalletKind;
  referenceId: string | null;
  description: string;
  metadata: Record<string, string | number>;
  createdAt: string;
}

export interface StakingPosition {
  id: string;
  userId: string;
  asset: string;
  amount: string;
  apyBps: number;
  startedAt: string;
  endedAt: string | null;
  status: "active" | "ended";
}

export interface Card {
  id: string;
  userId: string;
  type: "virtual" | "plastic" | "metal";
  status: "active" | "frozen" | "ordered" | "shipped" | "delivered";
  number: string;
  last4: string;
  expiry: string;
  cvv: string;
  fundingWallet: "fiat" | "crypto";
  fundingAsset: string;
  createdAt: string;
}

export interface CardTx {
  id: string;
  cardId: string;
  merchantName: string;
  mcc: string;
  amount: number;
  currency: string;
  fundingWallet: "fiat" | "crypto";
  fundingAsset: string;
  fundingAmount: string;
  conversionRate: string | null;
  interchangeRateBps: number;
  interchangeAmount: number;
  jombitShare: number;
  issuerShare: number;
  authCode: string;
  status: "approved" | "declined";
  declineReason: string | null;
  createdAt: string;
}

export interface DemoState {
  version: number;
  currentUserId: string | null;
  users: Profile[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  walletTx: WalletTx[];
  stakes: StakingPosition[];
  cards: Card[];
  cardTx: CardTx[];
}

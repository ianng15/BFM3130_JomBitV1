"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { List, ListRow, EmptyState } from "@/components/ui";
import type { WalletTx } from "@/lib/demo/types";
import { formatCrypto, formatDateTime } from "@/lib/format";
import { formatMoney, minorDigits, parseToMinor } from "@/lib/ledger";

const KIND_LABEL: Record<WalletTx["kind"], string> = {
  topup: "Top up",
  withdraw: "Withdraw",
  transfer_in: "Received",
  transfer_out: "Sent",
  fx_in: "Exchange in",
  fx_out: "Exchange out",
  crypto_buy: "Crypto buy",
  crypto_sell: "Crypto sell",
  stake: "Staked",
  unstake: "Unstaked",
  staking_reward: "Staking reward",
  card_spend: "Card",
  card_fee: "Card fee",
};

export function TxList({ txs }: { txs: WalletTx[] }) {
  if (!txs.length) return <EmptyState text="No transactions yet." />;
  return (
    <List>
      {txs.map((t) => {
        const negative = t.amount.startsWith("-");
        const amountText =
          t.wallet === "fiat"
            ? formatMoney(parseToMinor(t.amount, minorDigits(t.asset)) ?? 0, t.asset, { sign: true })
            : `${negative ? "−" : "+"}${formatCrypto(t.amount.replace("-", ""), t.asset)}`;
        return (
          <ListRow
            key={t.id}
            left={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg" aria-hidden>
                {negative ? <ArrowUpRight size={18} className="text-danger-text" /> : <ArrowDownLeft size={18} className="text-success-text" />}
              </span>
            }
            title={t.description}
            subtitle={`${KIND_LABEL[t.kind]} · ${formatDateTime(t.createdAt)}`}
            right={<span className={`tabular text-[14px] font-medium ${negative ? "text-danger-text" : "text-success-text"}`}>{amountText}</span>}
          />
        );
      })}
    </List>
  );
}

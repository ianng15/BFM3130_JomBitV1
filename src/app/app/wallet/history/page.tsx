"use client";

import { useState } from "react";
import { PageHeader, useApp } from "@/components/app/AppShell";
import { TxList } from "@/components/wallet/TxList";
import { DemoBadge, Segmented } from "@/components/ui";
import { userTx } from "@/lib/demo/logic";

export default function HistoryPage() {
  const { state, me } = useApp();
  const [filter, setFilter] = useState<"all" | "fiat" | "crypto">("all");
  const txs = userTx(state, me.id).filter((t) => filter === "all" || t.wallet === filter);
  return (
    <main>
      <PageHeader title="Transactions" back="/app/wallet" badge={<DemoBadge />} />
      <Segmented
        label="Filter"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "fiat", label: "Fiat" },
          { value: "crypto", label: "Crypto" },
        ]}
      />
      <p className="mb-3 mt-3 text-[12px] text-muted">Every balance change is a row in an append-only ledger; balances are the sum of these rows.</p>
      <TxList txs={txs} />
    </main>
  );
}

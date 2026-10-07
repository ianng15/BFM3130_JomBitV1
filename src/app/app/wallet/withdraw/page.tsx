"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Button, Card, DemoBadge, Field, Input, Notice } from "@/components/ui";
import { fiatBalanceMinor, withdraw } from "@/lib/demo/logic";
import { formatMoney, parseToMinor } from "@/lib/ledger";

export default function WithdrawPage() {
  const { state, me } = useApp();
  const router = useRouter();
  const { run, error } = useAction();
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);
  const have = fiatBalanceMinor(state, me.id, "MYR");
  const minor = parseToMinor(amount) ?? 0;

  return (
    <main>
      <PageHeader title="Withdraw" back="/app/wallet" badge={<DemoBadge />} />
      {done ? (
        <div className="space-y-4">
          <Notice tone="success">Withdrawal of {formatMoney(minor, "MYR")} sent to your linked bank account (simulated).</Notice>
          <Button variant="primary" block onClick={() => router.push("/app/wallet")}>
            Back to wallet
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="text-[14px]">
            <p className="text-muted">Linked bank account (simulated)</p>
            <p className="mt-1 font-medium">Demo Bank •••• 4321 — {me.displayName}</p>
          </Card>
          <Field label="Amount (MYR)" hint={`Available: ${formatMoney(have, "MYR")}`}>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="tabular text-[22px] font-semibold" />
          </Field>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button
            variant="primary"
            block
            onClick={() => {
              const ok = run((d) => {
                withdraw(d, me.id, minor);
                return true;
              });
              if (ok) setDone(true);
            }}
          >
            Withdraw
          </Button>
        </div>
      )}
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Avatar, Button, DemoBadge, Field, Input, Notice, Select } from "@/components/ui";
import { fiatBalanceMinor, transfer } from "@/lib/demo/logic";
import { CURRENCIES, formatMoney, minorDigits, parseToMinor } from "@/lib/ledger";
import { cn } from "@/lib/utils";

export default function TransferPage() {
  const { state, me } = useApp();
  const router = useRouter();
  const { run, error } = useAction();
  const others = state.users.filter((u) => u.id !== me.id);
  const [to, setTo] = useState(others[0]?.id ?? "");
  const [currency, setCurrency] = useState("MYR");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const minor = parseToMinor(amount, minorDigits(currency)) ?? 0;

  return (
    <main>
      <PageHeader title="Send to a friend" back="/app/wallet" badge={<DemoBadge />} />
      {done ? (
        <div className="space-y-4">
          <Notice tone="success">{done}</Notice>
          <Button variant="primary" block onClick={() => router.push("/app/wallet")}>
            Back to wallet
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] font-medium text-muted">To (JomBit user)</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {others.map((u) => (
              <button key={u.id} type="button" onClick={() => setTo(u.id)} aria-pressed={to === u.id} className="flex min-w-16 flex-col items-center gap-1 text-[12px]">
                <Avatar name={u.displayName} colour={u.colour} size={48} selected={to === u.id} />
                <span className={cn(to === u.id ? "text-accent" : "text-muted")}>{u.displayName}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <Field label="Amount" hint={`Balance ${formatMoney(fiatBalanceMinor(state, me.id, currency), currency)}`}>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="tabular text-[20px] font-semibold" />
            </Field>
            <Field label="Currency">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Durian money" />
          </Field>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button
            variant="primary"
            block
            onClick={() => {
              const ok = run((d) => {
                transfer(d, me.id, to, currency, minor, note.trim());
                return true;
              });
              if (ok) setDone(`Sent ${formatMoney(minor, currency)} to ${others.find((u) => u.id === to)?.displayName}. It arrives instantly in their JomBit wallet.`);
            }}
          >
            Send
          </Button>
          <p className="text-center text-[12px] text-muted">Cross-border: send THB, SGD, IDR, PHP or USD between JomBit wallets — demo money only.</p>
        </div>
      )}
    </main>
  );
}

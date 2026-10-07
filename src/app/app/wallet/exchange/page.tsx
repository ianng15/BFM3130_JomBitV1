"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Button, Card, DemoBadge, Field, Input, Notice, Select } from "@/components/ui";
import { exchange, fiatBalanceMinor } from "@/lib/demo/logic";
import { useFx } from "@/lib/demo/market";
import { CURRENCIES, formatMoney, minorDigits, parseToMinor } from "@/lib/ledger";
import { FX_SPREAD_BPS } from "@/lib/wallet/config";
import { format } from "@/lib/wallet/decimal";
import { fxQuote } from "@/lib/wallet/quotes";

export default function ExchangePage() {
  const { state, me } = useApp();
  const router = useRouter();
  const fx = useFx();
  const { run, error } = useAction();
  const [from, setFrom] = useState("MYR");
  const [to, setTo] = useState("THB");
  const [amount, setAmount] = useState("100.00");
  const [done, setDone] = useState<string | null>(null);
  const minor = parseToMinor(amount, minorDigits(from)) ?? 0;
  const have = fiatBalanceMinor(state, me.id, from);
  const q = from !== to && minor > 0 ? fxQuote(fx.rates, from, to, minor) : null;

  return (
    <main>
      <PageHeader title="Exchange" back="/app/wallet" badge={<DemoBadge />} />
      {done ? (
        <div className="space-y-4">
          <Notice tone="success">{done}</Notice>
          <Button variant="primary" block onClick={() => router.push("/app/wallet")}>
            Back to wallet
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <Field label="You pay" hint={`Balance ${formatMoney(have, from)}`}>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="tabular text-[20px] font-semibold" />
              </Field>
              <Field label="From">
                <Select value={from} onChange={(e) => setFrom(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <button
              type="button"
              aria-label="Swap currencies"
              onClick={() => {
                setFrom(to);
                setTo(from);
              }}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-bg text-accent"
            >
              <ArrowDownUp size={18} aria-hidden />
            </button>
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <div>
                <p className="text-[13px] font-medium text-muted">You get</p>
                <p className="tabular mt-2 text-[24px] font-bold">{q ? formatMoney(q.receiveMinor, to) : "—"}</p>
              </div>
              <Field label="To">
                <Select value={to} onChange={(e) => setTo(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>
          {q ? (
            <Card className="tabular space-y-1.5 text-[13px]">
              <p className="flex justify-between">
                <span className="text-muted">Reference rate</span>
                <span>
                  1 {from} = {format(BigInt(q.midRate), 6)} {to}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted">JomBit spread</span>
                <span>{(FX_SPREAD_BPS / 100).toFixed(2)}% ({formatMoney(q.feeMinorInTo, to)})</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted">Your rate</span>
                <span>
                  1 {from} = {format(BigInt(q.appliedRate), 6)} {to}
                </span>
              </p>
              <p className="pt-1 text-[12px] text-muted">
                {fx.source === "live"
                  ? `European Central Bank reference rate via Frankfurter${fx.date ? `, ${fx.date}` : ""} (cached 1 hour).`
                  : "Live rates unavailable — using sample rates."}
              </p>
            </Card>
          ) : null}
          {from === to ? <Notice tone="warning">Pick two different currencies.</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button
            variant="primary"
            block
            disabled={!q}
            onClick={() => {
              const ok = run((d) => {
                exchange(d, me.id, from, to, minor, fx.rates);
                return true;
              });
              if (ok && q) setDone(`Exchanged ${formatMoney(minor, from)} → ${formatMoney(q.receiveMinor, to)}.`);
            }}
          >
            Confirm exchange
          </Button>
        </div>
      )}
    </main>
  );
}

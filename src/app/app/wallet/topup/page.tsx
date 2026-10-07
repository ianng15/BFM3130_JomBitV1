"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Landmark, ShieldCheck } from "lucide-react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Amount, Button, Card, DemoBadge, Field, Input, Notice } from "@/components/ui";
import { topUp } from "@/lib/demo/logic";
import { formatMoney, parseToMinor } from "@/lib/ledger";
import { cn } from "@/lib/utils";

const BANKS = ["Maybank2u", "CIMB Clicks", "Public Bank", "RHB Now", "Hong Leong Connect", "Bank Islam", "AmOnline", "BSN"];

export default function TopUpPage() {
  const { me } = useApp();
  const router = useRouter();
  const { run, error, setError } = useAction();
  const [step, setStep] = useState<"amount" | "bank" | "approve" | "done">("amount");
  const [amount, setAmount] = useState("100.00");
  const [bank, setBank] = useState<string | null>(null);
  const minor = parseToMinor(amount) ?? 0;

  return (
    <main>
      <PageHeader title="Top up" back="/app/wallet" badge={<DemoBadge />} />
      {step === "amount" ? (
        <div className="space-y-4">
          <Field label="Amount (MYR)">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="tabular text-[24px] font-semibold" />
          </Field>
          <div className="grid grid-cols-4 gap-2">
            {["20.00", "50.00", "100.00", "200.00"].map((v) => (
              <Button key={v} size="sm" onClick={() => setAmount(v)}>
                RM{Number.parseInt(v, 10)}
              </Button>
            ))}
          </div>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button
            variant="primary"
            block
            onClick={() => {
              if (minor <= 0 || minor > 500000) return setError("Enter an amount between RM 0.01 and RM 5,000.");
              setError(null);
              setStep("bank");
            }}
          >
            Continue to FPX
          </Button>
          <p className="text-center text-[12px] text-muted">FPX via Billplz (simulated) — planned integration. No real money moves.</p>
        </div>
      ) : null}

      {step === "bank" ? (
        <div className="space-y-3">
          <p className="text-[15px]">Choose your bank</p>
          <div className="grid grid-cols-2 gap-2">
            {BANKS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBank(b)}
                aria-pressed={bank === b}
                className={cn("flex min-h-14 items-center gap-2 rounded-[12px] bg-surface px-3 text-left text-[14px]", bank === b && "ring-2 ring-accent")}
              >
                <Landmark size={18} className="text-muted" aria-hidden /> {b}
              </button>
            ))}
          </div>
          <Button variant="primary" block disabled={!bank} onClick={() => setStep("approve")}>
            Pay {formatMoney(minor, "MYR")}
          </Button>
          <Button variant="ghost" block onClick={() => setStep("amount")}>
            Back
          </Button>
        </div>
      ) : null}

      {step === "approve" ? (
        <Card className="space-y-4 border border-warning/60 p-5 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-warning">Simulated bank approval</p>
          <ShieldCheck size={44} className="mx-auto text-muted" aria-hidden />
          <p className="text-[15px]">{bank} (simulated)</p>
          <p className="text-[13px] text-muted">Merchant: JomBit Demo Wallet</p>
          <Amount minor={minor} currency="MYR" />
          <p className="text-[12px] text-muted">In the real flow you would log in to your bank here. This is a fake screen.</p>
          <Button
            variant="primary"
            block
            onClick={() => {
              const ok = run((d) => {
                topUp(d, me.id, minor, `${bank} (simulated)`);
                return true;
              });
              if (ok) setStep("done");
            }}
          >
            Approve
          </Button>
          <Button variant="ghost" block onClick={() => setStep("bank")}>
            Cancel
          </Button>
        </Card>
      ) : null}

      {step === "done" ? (
        <div className="flex flex-col items-center py-10 text-center">
          <CheckCircle2 size={64} className="text-success-text" aria-hidden />
          <h2 className="mt-4 text-[22px] font-semibold">Top up successful</h2>
          <p className="tabular mt-1 text-muted">{formatMoney(minor, "MYR")} added to your wallet</p>
          <Button variant="primary" className="mt-6" onClick={() => router.push("/app/wallet")}>
            Back to wallet
          </Button>
        </div>
      ) : null}
    </main>
  );
}

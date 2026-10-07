"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, Download, QrCode, Wallet } from "lucide-react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Amount, Avatar, Button, ButtonLink, Card, DemoBadge, EmptyState, Notice } from "@/components/ui";
import { createDuitNowSettlement, fiatBalanceMinor, groupById, payWithWallet, userById } from "@/lib/demo/logic";
import { useFx } from "@/lib/demo/market";
import { buildDynamicPayload } from "@/lib/duitnow";
import { formatMoney, minorToDecimalString } from "@/lib/ledger";
import { fxAmountNeeded } from "@/lib/wallet/quotes";
import { cn } from "@/lib/utils";

type Step = "method" | "duitnow" | "wallet" | "done";

function SettleFlow() {
  const { state, me } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const fx = useFx();
  const { run, error } = useAction();
  const group = groupById(state, params.get("group") ?? "");
  const payee = userById(state, params.get("to") ?? "");
  const amount = Number(params.get("amount") ?? "0");
  const [step, setStep] = useState<Step>("method");
  const [doneMethod, setDoneMethod] = useState<"duitnow" | "wallet">("duitnow");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const payload = useMemo(() => {
    if (!payee?.duitnowPayload || group?.currency !== "MYR") return null;
    try {
      return buildDynamicPayload(payee.duitnowPayload, minorToDecimalString(amount, 2));
    } catch {
      return null;
    }
  }, [payee, group, amount]);

  useEffect(() => {
    if (!payload) return;
    QRCode.toDataURL(payload, { width: 560, margin: 2, errorCorrectionLevel: "M" }).then(setQrUrl).catch(() => setQrUrl(null));
  }, [payload]);

  if (!group || !payee || !Number.isSafeInteger(amount) || amount <= 0) {
    return <EmptyState text="Nothing to settle here." action={<ButtonLink href="/app/groups">Back to groups</ButtonLink>} />;
  }

  const cur = group.currency;
  const have = fiatBalanceMinor(state, me.id, cur);
  const short = Math.max(0, amount - have);
  const myrNeeded = short > 0 && cur !== "MYR" ? fxAmountNeeded(fx.rates, "MYR", cur, short) : 0;
  const myrHave = fiatBalanceMinor(state, me.id, "MYR");
  const walletOk = short === 0 || (cur !== "MYR" && myrHave >= myrNeeded);

  const duitnowReason =
    cur !== "MYR" ? "DuitNow only works in MYR. Use your JomBit wallet for this trip group." : !payee.duitnowPayload ? `${payee.displayName} hasn't added a DuitNow QR yet.` : null;

  const header = (
    <Card className="flex items-center gap-3 p-5">
      <Avatar name={payee.displayName} colour={payee.colour} size={48} />
      <div className="flex-1">
        <p className="text-[13px] text-muted">You pay {payee.displayName}</p>
        <Amount minor={amount} currency={cur} size="lg" className="mt-1" />
        <p className="mt-1 text-[12px] text-muted">
          {group.icon} {group.name}
        </p>
      </div>
    </Card>
  );

  if (step === "method")
    return (
      <div className="space-y-3">
        {header}
        <h2 className="pt-2 text-[15px] font-semibold">How do you want to pay?</h2>
        <button
          type="button"
          disabled={!!duitnowReason}
          onClick={() => setStep("duitnow")}
          className="flex w-full items-start gap-3 rounded-[16px] bg-surface p-4 text-left hover:bg-line disabled:opacity-50"
        >
          <QrCode className="mt-0.5 text-accent" aria-hidden />
          <span className="flex-1">
            <span className="block text-[15px] font-medium">DuitNow QR</span>
            <span className="block text-[13px] text-muted">
              {duitnowReason ?? "We pre-fill the amount. Scan it with any Malaysian banking app."}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStep("wallet")}
          className="flex w-full items-start gap-3 rounded-[16px] bg-surface p-4 text-left hover:bg-line"
        >
          <Wallet className="mt-0.5 text-accent" aria-hidden />
          <span className="flex-1">
            <span className="flex items-center gap-2 text-[15px] font-medium">
              JomBit wallet <DemoBadge />
            </span>
            <span className="block text-[13px] text-muted">
              Instant transfer between JomBit wallets{cur !== "MYR" ? `, in ${cur}` : ""}. Your balance: {formatMoney(have, cur)}
            </span>
          </span>
        </button>
      </div>
    );

  if (step === "duitnow")
    return (
      <div className="animate-fade-in space-y-4">
        <Card className="flex flex-col items-center p-5 text-center">
          <p className="text-[13px] text-muted">Pay {payee.duitnowName ?? payee.displayName}</p>
          <Amount minor={amount} currency="MYR" className="mt-2" />
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt={`DuitNow QR to pay ${payee.displayName} ${formatMoney(amount, "MYR")}`} className="mt-4 w-full max-w-[280px] rounded-[12px] bg-fg" />
          ) : (
            <div className="mt-4 aspect-square w-full max-w-[280px] animate-pulse rounded-[12px] bg-surface-2" />
          )}
          <p className="mt-3 text-[12px] text-muted">Scan with any Malaysian banking app, or save the image and upload it in your bank app.</p>
        </Card>
        <Notice tone="warning">Proof of concept — PayNet participation terms still to be confirmed. Demo QRs use fake test accounts and won&apos;t move real money.</Notice>
        {qrUrl ? (
          <a href={qrUrl} download={`jombit-duitnow-${payee.displayName}.png`} className="flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-surface text-[15px] hover:bg-line">
            <Download size={18} aria-hidden /> Save image
          </a>
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button
          variant="primary"
          block
          onClick={() => {
            const id = run((d) => createDuitNowSettlement(d, { groupId: group.id, fromUser: me.id, toUser: payee.id, amount }));
            if (id) {
              setDoneMethod("duitnow");
              setStep("done");
            }
          }}
        >
          I&apos;ve paid
        </Button>
        <Button block variant="ghost" onClick={() => setStep("method")}>
          Choose another method
        </Button>
        <details className="text-[12px] text-muted">
          <summary className="cursor-pointer">Show QR payload (for testing)</summary>
          <p className="mt-2 break-all font-mono">{payload}</p>
        </details>
      </div>
    );

  if (step === "wallet")
    return (
      <div className="animate-fade-in space-y-4">
        {header}
        <div className="flex items-center gap-2">
          <DemoBadge />
          <span className="text-[12px] text-muted">Simulated wallet money</span>
        </div>
        <Card className="space-y-2 text-[14px]">
          <p className="tabular flex justify-between">
            <span className="text-muted">Your {cur} balance</span>
            <span>{formatMoney(have, cur)}</span>
          </p>
          {short > 0 && cur !== "MYR" ? (
            <>
              <p className="tabular flex justify-between">
                <span className="text-muted">Convert from MYR first</span>
                <span>
                  {formatMoney(myrNeeded, "MYR")} → {formatMoney(short, cur)}
                </span>
              </p>
              <p className="text-[12px] text-muted">
                Uses the {fx.source === "live" ? `ECB reference rate${fx.date ? ` (${fx.date})` : ""}` : "sample rate"} with JomBit&apos;s 0.5% spread.
              </p>
            </>
          ) : null}
          <p className="tabular flex justify-between border-t border-line pt-2 font-semibold">
            <span>{payee.displayName} receives</span>
            <span>{formatMoney(amount, cur)}</span>
          </p>
        </Card>
        {!walletOk ? (
          <Notice tone="danger">
            Not enough money in your wallet.{" "}
            <Link href="/app/wallet/topup" className="underline">
              Top up
            </Link>{" "}
            first.
          </Notice>
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button
          variant="primary"
          block
          disabled={!walletOk}
          onClick={() => {
            const id = run((d) =>
              payWithWallet(d, { groupId: group.id, fromUser: me.id, toUser: payee.id, amount, convertFromMyr: true, rates: fx.rates }),
            );
            if (id) {
              setDoneMethod("wallet");
              setStep("done");
            }
          }}
        >
          {short > 0 && cur !== "MYR" ? "Convert & pay" : "Pay from wallet"}
        </Button>
        <Button block variant="ghost" onClick={() => setStep("method")}>
          Back
        </Button>
      </div>
    );

  return (
    <div className="animate-fade-in flex flex-col items-center py-8 text-center">
      <CheckCircle2 size={64} className={cn(doneMethod === "wallet" ? "text-success-text" : "text-warning")} aria-hidden />
      <h2 className="mt-4 text-[22px] font-semibold">{doneMethod === "wallet" ? "Paid!" : "Marked as paid"}</h2>
      <p className="mt-2 max-w-xs text-[15px] text-muted">
        {doneMethod === "wallet"
          ? `${formatMoney(amount, cur)} sent to ${payee.displayName}. The group balance is updated.`
          : `We've told ${payee.displayName}. The balance updates once they tap “Confirm received”. (Log in as ${payee.displayName} to confirm.)`}
      </p>
      <Button variant="primary" className="mt-6" onClick={() => router.push(`/app/groups/${group.id}`)}>
        Back to {group.name}
      </Button>
    </div>
  );
}

export default function SettlePage() {
  return (
    <main>
      <PageHeader title="Settle up" back />
      <Suspense>
        <SettleFlow />
      </Suspense>
    </main>
  );
}

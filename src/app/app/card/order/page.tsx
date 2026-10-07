"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Button, Card, DemoBadge, Notice } from "@/components/ui";
import { fiatBalanceMinor, orderPhysicalCard } from "@/lib/demo/logic";
import { formatMoney } from "@/lib/ledger";
import { PHYSICAL_CARD_FEES_SEN } from "@/lib/wallet/config";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { type: "plastic" as const, title: "Plastic", blurb: "Classic PVC card. Tap to pay anywhere cards are accepted." },
  { type: "metal" as const, title: "Metal", blurb: "Heavy stainless-steel finish. Same features, more flex." },
];

export default function OrderCardPage() {
  const { state, me } = useApp();
  const router = useRouter();
  const { run, error } = useAction();
  const [type, setType] = useState<"plastic" | "metal">("plastic");
  const have = fiatBalanceMinor(state, me.id, "MYR");

  return (
    <main>
      <PageHeader title="Order physical card" back="/app/card" badge={<DemoBadge />} />
      <div className="space-y-3">
        {OPTIONS.map((o) => (
          <button
            key={o.type}
            type="button"
            aria-pressed={type === o.type}
            onClick={() => setType(o.type)}
            className={cn("w-full rounded-[16px] bg-surface p-4 text-left", type === o.type && "ring-2 ring-accent")}
          >
            <span className="flex items-center justify-between">
              <span className="text-[17px] font-semibold">{o.title}</span>
              <span className="tabular text-[17px] font-semibold">{formatMoney(PHYSICAL_CARD_FEES_SEN[o.type], "MYR")}</span>
            </span>
            <span className="mt-1 block text-[13px] text-muted">{o.blurb}</span>
          </button>
        ))}
        <Card className="text-[13px] text-muted">
          The fee is paid from your MYR wallet ({formatMoney(have, "MYR")} available). Delivery is simulated: ordered → shipped → delivered.
          Card issuing is a planned integration with a licensed issuer — no real card will be sent.
        </Card>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button
          variant="primary"
          block
          onClick={() => {
            const id = run((d) => orderPhysicalCard(d, me.id, type));
            if (id) router.push("/app/card");
          }}
        >
          Pay {formatMoney(PHYSICAL_CARD_FEES_SEN[type], "MYR")} & order
        </Button>
      </div>
    </main>
  );
}

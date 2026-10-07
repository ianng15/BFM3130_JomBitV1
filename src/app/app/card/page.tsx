"use client";

import { useState } from "react";
import { Eye, EyeOff, Snowflake, Truck } from "lucide-react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { CardVisual } from "@/components/card/CardVisual";
import { Button, ButtonLink, Card, DemoBadge, EmptyState, Field, Input, List, ListRow, Notice, Pill, SectionTitle, Select } from "@/components/ui";
import { advanceCardStatus, balance, fiatBalanceMinor, issueVirtualCard, setFunding, simulatePurchase, toggleFreeze, userCards } from "@/lib/demo/logic";
import { usePrices } from "@/lib/demo/market";
import { displayAsset, formatCrypto, formatDateTime } from "@/lib/format";
import { formatMoney, parseToMinor } from "@/lib/ledger";
import { INTERCHANGE_BPS, JOMBIT_INTERCHANGE_SHARE_BPS, SAMPLE_MERCHANTS } from "@/lib/wallet/config";

const STATUS_TONE = { active: "success", frozen: "info", ordered: "warning", shipped: "warning", delivered: "success" } as const;

export default function CardPage() {
  const { state, me } = useApp();
  const prices = usePrices();
  const { run, error } = useAction();
  const [reveal, setReveal] = useState(false);
  const [revenue, setRevenue] = useState(false);
  const [merchant, setMerchant] = useState(0);
  const [amount, setAmount] = useState("25.00");
  const [result, setResult] = useState<{ approved: boolean; reason: string | null } | null>(null);

  const cards = userCards(state, me.id);
  const virtual = cards.find((c) => c.type === "virtual");
  const physical = cards.find((c) => c.type !== "virtual");

  if (!virtual) {
    return (
      <main>
        <PageHeader title="Card" badge={<DemoBadge />} />
        <EmptyState
          text="Get a free virtual prepaid card instantly. Spend from your MYR or crypto wallet."
          action={
            <Button variant="primary" onClick={() => run((d) => issueVirtualCard(d, me.id))}>
              Issue free virtual card
            </Button>
          }
        />
      </main>
    );
  }

  const txs = state.cardTx
    .filter((t) => cards.some((c) => c.id === t.cardId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const approved = txs.filter((t) => t.status === "approved");
  const totals = approved.reduce(
    (a, t) => ({ spend: a.spend + t.amount, ic: a.ic + t.interchangeAmount, jb: a.jb + t.jombitShare, iss: a.iss + t.issuerShare }),
    { spend: 0, ic: 0, jb: 0, iss: 0 },
  );
  const fundingKey = virtual.fundingWallet === "fiat" ? "MYR" : virtual.fundingAsset;
  const fundingBalance =
    virtual.fundingWallet === "fiat" ? formatMoney(fiatBalanceMinor(state, me.id, "MYR"), "MYR") : formatCrypto(balance(state, me.id, virtual.fundingAsset), virtual.fundingAsset);

  return (
    <main>
      <PageHeader title="Card" badge={<DemoBadge />} />
      <CardVisual card={virtual} holder={me.displayName} reveal={reveal} />
      <div className="mt-3 flex items-center justify-between">
        <Pill tone={STATUS_TONE[virtual.status]}>{virtual.status}</Pill>
        <span className="text-[12px] text-muted">Fake test-range number — not a real card</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={() => setReveal((r) => !r)}>
          {reveal ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />} {reveal ? "Hide details" : "Reveal details"}
        </Button>
        <Button onClick={() => run((d) => toggleFreeze(d, virtual.id))}>
          <Snowflake size={18} aria-hidden /> {virtual.status === "frozen" ? "Unfreeze" : "Freeze"}
        </Button>
      </div>

      <SectionTitle>Funding source</SectionTitle>
      <Card className="space-y-2">
        <Select
          aria-label="Funding source"
          value={fundingKey}
          onChange={(e) => {
            const v = e.target.value;
            run((d) => setFunding(d, me.id, v === "MYR" ? "fiat" : "crypto", v));
          }}
        >
          <option value="MYR">Fiat wallet — MYR</option>
          {prices.assets.map((a) => (
            <option key={a.code} value={a.code}>
              Crypto — {a.display}
            </option>
          ))}
        </Select>
        <p className="tabular text-[13px] text-muted">
          Available: {fundingBalance}
          {virtual.fundingWallet === "crypto" ? " · converted at the Luno bid price when you pay" : ""}
        </p>
      </Card>

      <SectionTitle>Simulate a purchase</SectionTitle>
      <Card className="space-y-3">
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <Field label="Merchant">
            <Select value={merchant} onChange={(e) => setMerchant(Number(e.target.value))}>
              {SAMPLE_MERCHANTS.map((mch, i) => (
                <option key={mch.name} value={i}>
                  {mch.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount RM">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="tabular" />
          </Field>
        </div>
        <Button
          variant="primary"
          block
          onClick={() => {
            setResult(null);
            const r = run((d) => simulatePurchase(d, virtual.id, SAMPLE_MERCHANTS[merchant], parseToMinor(amount) ?? 0, prices.bids));
            if (r) setResult(r);
          }}
        >
          Tap to pay (simulated)
        </Button>
        {result ? (
          result.approved ? (
            <Notice tone="success">Approved ✓ — {SAMPLE_MERCHANTS[merchant].name}</Notice>
          ) : (
            <Notice tone="danger">Declined — {result.reason}</Notice>
          )
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </Card>

      <SectionTitle>Physical card</SectionTitle>
      {physical ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-medium capitalize">
              {physical.type} card •{physical.last4}
            </p>
            <Pill tone={STATUS_TONE[physical.status]}>{physical.status}</Pill>
          </div>
          <ol className="flex gap-1 text-[11px]" aria-label="Delivery progress">
            {(["ordered", "shipped", "delivered"] as const).map((s, i) => {
              const order = ["ordered", "shipped", "delivered", "active", "frozen"];
              const reached = order.indexOf(physical.status) >= i;
              return (
                <li key={s} className="flex-1">
                  <span className={`block h-1 rounded-full ${reached ? "bg-accent" : "bg-bg"}`} />
                  <span className={`mt-1 block capitalize ${reached ? "text-fg" : "text-muted"}`}>{s}</span>
                </li>
              );
            })}
          </ol>
          {["ordered", "shipped", "delivered"].includes(physical.status) ? (
            <Button block size="sm" onClick={() => run((d) => advanceCardStatus(d, physical.id))}>
              <Truck size={16} aria-hidden /> {physical.status === "delivered" ? "Activate card" : "Simulate next step"}
            </Button>
          ) : (
            <Button block size="sm" onClick={() => run((d) => toggleFreeze(d, physical.id))}>
              <Snowflake size={16} aria-hidden /> {physical.status === "frozen" ? "Unfreeze" : "Freeze"}
            </Button>
          )}
        </Card>
      ) : (
        <Card className="flex items-center justify-between gap-3">
          <p className="text-[14px] text-muted">Plastic RM12 · Metal RM30</p>
          <ButtonLink href="/app/card/order" size="sm">
            Order physical card
          </ButtonLink>
        </Card>
      )}

      <SectionTitle
        action={
          <label className="flex items-center gap-2 text-[13px] text-muted">
            Revenue view
            <input type="checkbox" checked={revenue} onChange={(e) => setRevenue(e.target.checked)} className="h-5 w-5 accent-accent" />
          </label>
        }
      >
        Card transactions
      </SectionTitle>
      {revenue ? (
        <Card className="tabular mb-3 grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <p className="text-muted">Card spend</p>
            <p className="text-[17px] font-semibold">{formatMoney(totals.spend, "MYR")}</p>
          </div>
          <div>
            <p className="text-muted">Interchange ({INTERCHANGE_BPS / 100}%)</p>
            <p className="text-[17px] font-semibold">{formatMoney(totals.ic, "MYR")}</p>
          </div>
          <div>
            <p className="text-muted">JomBit share ({JOMBIT_INTERCHANGE_SHARE_BPS / 100}%)</p>
            <p className="text-[17px] font-semibold text-success-text">{formatMoney(totals.jb, "MYR")}</p>
          </div>
          <div>
            <p className="text-muted">Issuer share</p>
            <p className="text-[17px] font-semibold">{formatMoney(totals.iss, "MYR")}</p>
          </div>
          <p className="col-span-2 text-[11px] text-muted">Interchange rate and split are placeholders — finance team to supply real figures.</p>
        </Card>
      ) : null}
      {txs.length ? (
        <List>
          {txs.map((t) => (
            <div key={t.id}>
              <ListRow
                title={t.merchantName}
                subtitle={`${formatDateTime(t.createdAt)} · MCC ${t.mcc} · ${t.fundingWallet === "fiat" ? "MYR" : displayAsset(t.fundingAsset)}`}
                right={
                  <>
                    <span className={`tabular block text-[15px] font-medium ${t.status === "declined" ? "text-muted line-through" : ""}`}>
                      −{formatMoney(t.amount, t.currency)}
                    </span>
                    {t.status === "declined" ? <span className="block text-[11px] text-danger-text">{t.declineReason}</span> : null}
                  </>
                }
              />
              {revenue ? (
                <dl className="tabular grid grid-cols-2 gap-x-3 gap-y-0.5 px-4 pb-3 text-[11px] text-muted">
                  <dt>Auth code</dt>
                  <dd className="text-right">{t.authCode || "—"}</dd>
                  <dt>Status</dt>
                  <dd className="text-right">{t.status}</dd>
                  <dt>Funding</dt>
                  <dd className="text-right">
                    {t.fundingWallet === "fiat" ? formatMoney(t.amount, "MYR") : formatCrypto(t.fundingAmount, t.fundingAsset)}
                  </dd>
                  <dt>Rate used</dt>
                  <dd className="text-right">{t.conversionRate ? `${formatMoney(parseToMinor(t.conversionRate) ?? 0, "MYR")} / ${displayAsset(t.fundingAsset)}` : "—"}</dd>
                  <dt>Interchange ({t.interchangeRateBps / 100}%)</dt>
                  <dd className="text-right">{formatMoney(t.interchangeAmount, "MYR")}</dd>
                  <dt>JomBit share</dt>
                  <dd className="text-right">{formatMoney(t.jombitShare, "MYR")}</dd>
                  <dt>Issuer share</dt>
                  <dd className="text-right">{formatMoney(t.issuerShare, "MYR")}</dd>
                </dl>
              ) : null}
            </div>
          ))}
        </List>
      ) : (
        <EmptyState text="No card transactions yet. Simulate a purchase above." />
      )}
    </main>
  );
}

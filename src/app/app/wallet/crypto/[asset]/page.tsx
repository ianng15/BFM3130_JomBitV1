"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Amount, Button, ButtonLink, Card, DemoBadge, EmptyState, Field, Input, List, Notice, SectionTitle, Segmented } from "@/components/ui";
import { activeStakes, balance, buyCrypto, fiatBalanceMinor, sellCrypto, stake, unstake } from "@/lib/demo/logic";
import { useNow, usePrices } from "@/lib/demo/market";
import { cryptoValueSen, displayAsset, formatCrypto } from "@/lib/format";
import { formatMoney, parseToMinor } from "@/lib/ledger";
import { CRYPTO_ASSETS, CRYPTO_FEE_BPS, STAKING_APY_BPS, STAKING_COMMISSION_BPS } from "@/lib/wallet/config";
import { dec, format, tryDec } from "@/lib/wallet/decimal";
import { cryptoBuyQuote, cryptoSellQuote, stakingPayout, stakingReward } from "@/lib/wallet/quotes";

type Mode = "buy" | "sell" | "stake";

export default function AssetPage() {
  const { asset } = useParams<{ asset: string }>();
  const { state, me } = useApp();
  const prices = usePrices();
  const now = useNow(1000);
  const { run, error, setError } = useAction();
  const [mode, setMode] = useState<Mode>("buy");
  const [myrInput, setMyrInput] = useState("100.00");
  const [cryptoInput, setCryptoInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const info = CRYPTO_ASSETS.find((a) => a.code === asset);
  const ticker = info ? prices.tickers[info.pair] : undefined;
  if (!info || !ticker) {
    return (
      <main>
        <PageHeader title="Asset" back="/app/wallet?tab=crypto" />
        <EmptyState text="This asset isn't available on Luno in MYR right now." action={<ButtonLink href="/app/wallet?tab=crypto">Back</ButtonLink>} />
      </main>
    );
  }

  const holding = balance(state, me.id, info.code);
  const myrHave = fiatBalanceMinor(state, me.id, "MYR");
  const myrMinor = parseToMinor(myrInput) ?? 0;
  const cryptoAmt = tryDec(cryptoInput || "0") ?? BigInt(0);
  const buyQ = myrMinor > 0 ? cryptoBuyQuote(myrMinor, ticker.ask) : null;
  const sellQ = cryptoAmt > BigInt(0) ? cryptoSellQuote(cryptoAmt, ticker.bid) : null;
  const apy = STAKING_APY_BPS[info.code] ?? 0;
  const stakes = activeStakes(state, me.id).filter((p) => p.asset === info.code);
  const toMinorStr = (s: string) => formatMoney(parseToMinor(s) ?? 0, "MYR");

  const done = (text: string) => {
    setMessage(text);
    setCryptoInput("");
  };

  return (
    <main>
      <PageHeader title={info.name} back="/app/wallet?tab=crypto" badge={<DemoBadge />} />
      <Card className="p-5">
        <p className="text-[13px] text-muted">{info.display} / MYR · last trade</p>
        <Amount minor={parseToMinor(ticker.last_trade) ?? 0} currency="MYR" className="mt-2" />
        <div className="tabular mt-3 grid grid-cols-2 gap-2 text-[13px]">
          <p>
            <span className="text-muted">Bid (sell) </span>
            {toMinorStr(ticker.bid)}
          </p>
          <p>
            <span className="text-muted">Ask (buy) </span>
            {toMinorStr(ticker.ask)}
          </p>
        </div>
        <p className="mt-2 text-[12px] text-muted">
          {prices.source === "live" ? "Live from Luno's public ticker (no 24h change available)." : "Sample price — live feed unavailable."}
        </p>
      </Card>

      <Card className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-[13px] text-muted">You hold</p>
          <p className="tabular text-[17px] font-semibold">{formatCrypto(holding, info.code)}</p>
        </div>
        <p className="tabular text-[14px] text-muted">≈ {formatMoney(cryptoValueSen(holding, ticker.bid), "MYR")}</p>
      </Card>

      <div className="mt-4">
        <Segmented
          label="Action"
          value={mode}
          onChange={(v) => {
            setMode(v);
            setMessage(null);
            setError(null);
          }}
          options={[
            { value: "buy", label: "Buy" },
            { value: "sell", label: "Sell" },
            { value: "stake", label: "Stake" },
          ]}
        />
      </div>

      <div className="mt-4 space-y-3">
        {mode === "buy" ? (
          <>
            <Field label="Spend (MYR)" hint={`MYR wallet: ${formatMoney(myrHave, "MYR")}`}>
              <Input value={myrInput} onChange={(e) => setMyrInput(e.target.value)} inputMode="decimal" className="tabular text-[20px] font-semibold" />
            </Field>
            {buyQ ? (
              <Card className="tabular space-y-1.5 text-[13px]">
                <p className="flex justify-between"><span className="text-muted">Price (Luno ask)</span><span>{toMinorStr(ticker.ask)}</span></p>
                <p className="flex justify-between"><span className="text-muted">JomBit fee ({CRYPTO_FEE_BPS / 100}%)</span><span>{formatMoney(buyQ.feeMinor, "MYR")}</span></p>
                <p className="flex justify-between font-semibold"><span>You get</span><span>{formatCrypto(buyQ.cryptoAmount, info.code)}</span></p>
              </Card>
            ) : null}
            <Button
              variant="primary"
              block
              disabled={!buyQ}
              onClick={() => {
                const ok = run((d) => {
                  buyCrypto(d, me.id, info.code, myrMinor, ticker.ask);
                  return true;
                });
                if (ok && buyQ) done(`Bought ${formatCrypto(buyQ.cryptoAmount, info.code)} for ${formatMoney(myrMinor, "MYR")}.`);
              }}
            >
              Buy {info.display}
            </Button>
          </>
        ) : null}

        {mode === "sell" ? (
          <>
            <Field label={`Sell (${info.display})`} hint={`Available: ${format(holding, 8) || "0"}`}>
              <div className="flex gap-2">
                <Input value={cryptoInput} onChange={(e) => setCryptoInput(e.target.value)} inputMode="decimal" placeholder="0.0" className="tabular text-[20px] font-semibold" />
                <Button size="sm" onClick={() => setCryptoInput(format(holding, 8))}>
                  Max
                </Button>
              </div>
            </Field>
            {sellQ ? (
              <Card className="tabular space-y-1.5 text-[13px]">
                <p className="flex justify-between"><span className="text-muted">Price (Luno bid)</span><span>{toMinorStr(ticker.bid)}</span></p>
                <p className="flex justify-between"><span className="text-muted">Value</span><span>{formatMoney(sellQ.grossMinor, "MYR")}</span></p>
                <p className="flex justify-between"><span className="text-muted">JomBit fee ({CRYPTO_FEE_BPS / 100}%)</span><span>−{formatMoney(sellQ.feeMinor, "MYR")}</span></p>
                <p className="flex justify-between font-semibold"><span>You get</span><span>{formatMoney(sellQ.receiveMinor, "MYR")}</span></p>
              </Card>
            ) : null}
            <Button
              variant="primary"
              block
              disabled={!sellQ}
              onClick={() => {
                const ok = run((d) => {
                  sellCrypto(d, me.id, info.code, cryptoAmt, ticker.bid);
                  return true;
                });
                if (ok && sellQ) done(`Sold for ${formatMoney(sellQ.receiveMinor, "MYR")} (credited to your MYR wallet).`);
              }}
            >
              Sell {info.display}
            </Button>
          </>
        ) : null}

        {mode === "stake" ? (
          <>
            <Card className="text-[14px]">
              <p>
                <span className="text-[22px] font-bold text-success-text">{(apy / 100).toFixed(2)}%</span>{" "}
                <span className="text-muted">APY · indicative</span>
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Rewards accrue every second. When you unstake, JomBit keeps {STAKING_COMMISSION_BPS / 100}% of the rewards as commission.
              </p>
            </Card>
            <Field label={`Amount to stake (${info.display})`} hint={`Available: ${format(holding, 8) || "0"}`}>
              <div className="flex gap-2">
                <Input value={cryptoInput} onChange={(e) => setCryptoInput(e.target.value)} inputMode="decimal" placeholder="0.0" className="tabular text-[20px] font-semibold" />
                <Button size="sm" onClick={() => setCryptoInput(format(holding, 8))}>
                  Max
                </Button>
              </div>
            </Field>
            <Button
              variant="primary"
              block
              disabled={cryptoAmt <= BigInt(0)}
              onClick={() => {
                const ok = run((d) => {
                  stake(d, me.id, info.code, cryptoAmt);
                  return true;
                });
                if (ok) done(`Staked ${formatCrypto(cryptoAmt, info.code)} via Luno (simulated).`);
              }}
            >
              Stake via Luno
            </Button>
          </>
        ) : null}

        {message ? <Notice tone="success">{message}</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <p className="text-center text-[12px] text-muted">Order routed to Luno (simulated). Held via Luno. Planned integration — not a live partnership.</p>
      </div>

      {stakes.length ? (
        <>
          <SectionTitle>Your staking</SectionTitle>
          <List>
            {stakes.map((p) => {
              const reward = stakingReward(dec(p.amount), p.apyBps, Date.parse(p.startedAt), now);
              const payout = stakingPayout(dec(p.amount), reward);
              return (
                <div key={p.id} className="space-y-2 px-4 py-3">
                  <div>
                    <p className="text-[15px] font-medium">{formatCrypto(p.amount, p.asset)} staked</p>
                    <p className="text-[13px] text-muted">
                      since {new Date(p.startedAt).toLocaleDateString("en-MY")} · {(p.apyBps / 100).toFixed(2)}% APY (indicative)
                    </p>
                  </div>
                  <div className="tabular space-y-1 rounded-[12px] bg-bg p-3 text-[13px]">
                    <p className="flex justify-between"><span className="text-muted">Rewards so far</span><span className="text-success-text">+{format(reward, 12)} {displayAsset(p.asset)}</span></p>
                    <p className="flex justify-between"><span className="text-muted">JomBit commission ({STAKING_COMMISSION_BPS / 100}%)</span><span>−{format(payout.commission, 12)}</span></p>
                    <p className="flex justify-between font-semibold"><span>You&apos;d receive</span><span>{format(payout.total, 12)} {displayAsset(p.asset)}</span></p>
                  </div>
                  <Button
                    block
                    size="sm"
                    onClick={() => {
                      const ok = run((d) => {
                        unstake(d, p.id);
                        return true;
                      });
                      if (ok) done(`Unstaked. ${format(payout.total, 10)} ${displayAsset(p.asset)} returned to your crypto wallet.`);
                    }}
                  >
                    Unstake
                  </Button>
                </div>
              );
            })}
          </List>
        </>
      ) : null}
    </main>
  );
}

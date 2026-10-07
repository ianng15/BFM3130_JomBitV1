"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowDownToLine, ArrowLeftRight, ChevronRight, Plus, Send } from "lucide-react";
import { PageHeader, useApp } from "@/components/app/AppShell";
import { TxList } from "@/components/wallet/TxList";
import { Amount, ButtonLink, Card, DemoBadge, List, ListRow, Notice, SectionTitle, Segmented } from "@/components/ui";
import { activeStakes, balance, fiatBalanceMinor, userTx } from "@/lib/demo/logic";
import { useNow, usePrices } from "@/lib/demo/market";
import { cryptoValueSen, displayAsset, formatCrypto } from "@/lib/format";
import { CURRENCIES, formatMoney, parseToMinor } from "@/lib/ledger";
import { dec, format } from "@/lib/wallet/decimal";
import { stakingReward } from "@/lib/wallet/quotes";

function FiatTab() {
  const { state, me } = useApp();
  const balances = CURRENCIES.map((c) => ({ c, minor: fiatBalanceMinor(state, me.id, c) })).filter((b) => b.c === "MYR" || b.minor !== 0);
  const myr = balances.find((b) => b.c === "MYR")!.minor;
  const txs = userTx(state, me.id).filter((t) => t.wallet === "fiat");
  return (
    <>
      <Card className="p-5">
        <p className="text-[13px] text-muted">MYR balance</p>
        <Amount minor={myr} currency="MYR" className="mt-2" />
        <div className="mt-5 grid grid-cols-4 gap-2 text-[12px]">
          {[
            { href: "/app/wallet/topup", label: "Top up", icon: Plus, primary: true },
            { href: "/app/wallet/exchange", label: "Exchange", icon: ArrowLeftRight },
            { href: "/app/wallet/transfer", label: "Transfer", icon: Send },
            { href: "/app/wallet/withdraw", label: "Withdraw", icon: ArrowDownToLine },
          ].map(({ href, label, icon: Icon, primary }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1.5 font-medium">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${primary ? "bg-accent text-on-accent" : "bg-bg text-fg"}`}>
                <Icon size={20} aria-hidden />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </Card>
      <SectionTitle>Currencies</SectionTitle>
      <List>
        {balances.map((b) => (
          <ListRow
            key={b.c}
            left={<span className="flex h-9 w-12 items-center justify-center rounded-full bg-bg text-[12px] font-semibold">{b.c}</span>}
            title={b.c}
            right={<span className="tabular text-[15px] font-semibold">{formatMoney(b.minor, b.c)}</span>}
          />
        ))}
      </List>
      <SectionTitle action={<Link href="/app/wallet/history" className="text-[13px] font-medium text-accent">See all</Link>}>Recent</SectionTitle>
      <TxList txs={txs.slice(0, 5)} />
    </>
  );
}

function CryptoTab() {
  const { state, me } = useApp();
  const prices = usePrices();
  const now = useNow(1000);
  const stakes = activeStakes(state, me.id);
  const holdings = prices.assets.map((a) => {
    const amt = balance(state, me.id, a.code);
    const t = prices.tickers[a.pair];
    return { a, amt, t, value: cryptoValueSen(amt, t?.bid) };
  });
  const stakedValue = stakes.reduce((sum, p) => {
    const t = prices.tickers[`${p.asset}MYR`];
    return sum + cryptoValueSen(dec(p.amount), t?.bid);
  }, 0);
  const total = holdings.reduce((s, h) => s + h.value, 0) + stakedValue;
  return (
    <>
      <Card className="p-5">
        <p className="text-[13px] text-muted">Crypto value (incl. staked)</p>
        <Amount minor={total} currency="MYR" className="mt-2" />
        <p className="mt-2 text-[12px] text-muted">Valued at Luno bid price. Order routed to Luno (simulated). Held via Luno.</p>
      </Card>
      {prices.source === "sample" ? (
        <div className="mt-3">
          <Notice tone="warning">Live Luno prices couldn&apos;t be loaded, so sample prices are shown.</Notice>
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-success-text">● Live MYR prices from Luno&apos;s public ticker, refreshed every 30s</p>
      )}
      <SectionTitle>Assets</SectionTitle>
      <List>
        {holdings.map(({ a, amt, t, value }) => (
          <ListRow
            key={a.code}
            href={`/app/wallet/crypto/${a.code}`}
            left={<span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-[11px] font-bold text-accent">{a.display}</span>}
            title={a.name}
            subtitle={<span className="tabular">{t ? formatMoney(parseToMinor(t.last_trade) ?? 0, "MYR") : "—"}</span>}
            right={
              <span className="flex items-center gap-2">
                <span>
                  <span className="tabular block text-[14px] font-medium">{amt > BigInt(0) ? format(amt, 8) : "0"}</span>
                  <span className="tabular block text-[12px] text-muted">{formatMoney(value, "MYR")}</span>
                </span>
                <ChevronRight size={18} className="text-muted" aria-hidden />
              </span>
            }
          />
        ))}
      </List>
      <SectionTitle>Staking</SectionTitle>
      {stakes.length ? (
        <List>
          {stakes.map((p) => {
            const r = stakingReward(dec(p.amount), p.apyBps, Date.parse(p.startedAt), now);
            return (
              <ListRow
                key={p.id}
                href={`/app/wallet/crypto/${p.asset}`}
                title={`${formatCrypto(p.amount, p.asset)} staked`}
                subtitle={`${(p.apyBps / 100).toFixed(2)}% APY (indicative)`}
                right={<span className="tabular text-[13px] text-success-text">+{format(r, 10)} {displayAsset(p.asset)}</span>}
              />
            );
          })}
        </List>
      ) : (
        <Notice tone="info">No staking yet. Open an asset to stake it via Luno (simulated).</Notice>
      )}
    </>
  );
}

function WalletInner() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") === "crypto" ? "crypto" : "fiat";
  return (
    <>
      <Segmented
        label="Wallet"
        value={tab}
        onChange={(v) => router.replace(v === "crypto" ? "/app/wallet?tab=crypto" : "/app/wallet")}
        options={[
          { value: "fiat", label: "Fiat" },
          { value: "crypto", label: "Crypto" },
        ]}
      />
      <div className="mt-4">{tab === "fiat" ? <FiatTab /> : <CryptoTab />}</div>
      <div className="mt-6">
        <ButtonLink href="/app/wallet/history" block variant="ghost">
          Full transaction history
        </ButtonLink>
      </div>
    </>
  );
}

export default function WalletPage() {
  return (
    <main>
      <PageHeader title="Wallet" badge={<DemoBadge />} />
      <Suspense>
        <WalletInner />
      </Suspense>
    </main>
  );
}

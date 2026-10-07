"use client";

import Link from "next/link";
import { ArrowLeftRight, Plus, ScanLine, Wallet as WalletIcon } from "lucide-react";
import { useApp, useAction, MeAvatarLink, AppFooter } from "@/components/app/AppShell";
import { Amount, Button, Card, DemoBadge, EmptyState, List, ListRow, Pill, SectionTitle, Avatar, Notice } from "@/components/ui";
import { balance, fiatBalanceMinor, myGroups, myTotals, setSettlementStatus, userById, userName } from "@/lib/demo/logic";
import { usePrices } from "@/lib/demo/market";
import { cryptoValueSen, formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/ledger";

export default function HomePage() {
  const { state, me } = useApp();
  const { run, error } = useAction();
  const prices = usePrices();
  const totals = myTotals(state, me.id);
  const myr = totals.get("MYR") ?? { owed: 0, owe: 0 };
  const others = [...totals.entries()].filter(([c, t]) => c !== "MYR" && (t.owed || t.owe));
  const groups = myGroups(state, me.id);
  const groupIds = new Set(groups.map((g) => g.id));

  const toConfirm = state.settlements.filter((s) => s.toUser === me.id && s.status === "pending");
  const waiting = state.settlements.filter((s) => s.fromUser === me.id && s.status === "pending");

  const activity = [
    ...state.expenses
      .filter((e) => groupIds.has(e.groupId))
      .map((e) => ({
        id: e.id,
        at: e.expenseDate + e.createdAt.slice(10),
        href: `/app/groups/${e.groupId}/expenses/${e.id}`,
        title: e.description,
        subtitle: `${userName(state, e.paidBy)} paid · ${state.groups.find((g) => g.id === e.groupId)?.name}`,
        amount: formatMoney(e.total, e.currency),
        mine: e.shares.find((s) => s.userId === me.id)?.amount ?? 0,
        currency: e.currency,
        kind: "expense" as const,
      })),
    ...state.settlements
      .filter((s) => groupIds.has(s.groupId) && s.status === "confirmed")
      .map((s) => ({
        id: s.id,
        at: s.confirmedAt ?? s.createdAt,
        href: `/app/groups/${s.groupId}`,
        title: `${userName(state, s.fromUser)} paid ${userName(state, s.toUser)}`,
        subtitle: s.method === "duitnow" ? "DuitNow settlement" : "JomBit wallet transfer",
        amount: formatMoney(s.amount, s.currency),
        mine: 0,
        currency: s.currency,
        kind: "settlement" as const,
      })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  const myrWallet = fiatBalanceMinor(state, me.id, "MYR");
  const cryptoSen = prices.assets.reduce(
    (sum, a) => sum + cryptoValueSen(balance(state, me.id, a.code), prices.tickers[a.pair]?.bid),
    0,
  );

  return (
    <main>
      <header className="flex items-center justify-between py-3">
        <div>
          <p className="text-[13px] text-muted">Selamat datang,</p>
          <h1 className="text-[22px] font-semibold">{me.displayName}</h1>
        </div>
        <MeAvatarLink />
      </header>

      <Card className="mt-2 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[13px] text-muted">Owed to you</p>
            <Amount minor={myr.owed} currency="MYR" size="lg" tone={myr.owed ? "success" : undefined} className="mt-2" />
          </div>
          <div>
            <p className="text-[13px] text-muted">You owe</p>
            <Amount minor={myr.owe} currency="MYR" size="lg" tone={myr.owe ? "danger" : undefined} className="mt-2" />
          </div>
        </div>
        {others.length ? (
          <div className="mt-4 space-y-1 border-t border-line pt-3 text-[13px]">
            {others.map(([c, t]) => (
              <p key={c} className="tabular flex justify-between text-muted">
                <span>{c} groups</span>
                <span>
                  {t.owed ? <span className="text-success-text">owed {formatMoney(t.owed, c)}</span> : null}
                  {t.owed && t.owe ? " · " : null}
                  {t.owe ? <span className="text-danger-text">you owe {formatMoney(t.owe, c)}</span> : null}
                </span>
              </p>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { href: "/app/scan", label: "Scan", icon: ScanLine },
          { href: "/app/groups", label: "Add expense", icon: Plus },
          { href: "/app/wallet/topup", label: "Top up", icon: WalletIcon },
          { href: "/app/wallet/exchange", label: "Exchange", icon: ArrowLeftRight },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-[16px] bg-surface text-[12px] font-medium hover:bg-line">
            <Icon size={22} className="text-accent" aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      {error ? <div className="mt-4"><Notice tone="danger">{error}</Notice></div> : null}

      {toConfirm.length || waiting.length ? (
        <>
          <SectionTitle>Pending settlements</SectionTitle>
          <div className="space-y-2">
            {toConfirm.map((s) => {
              const from = userById(state, s.fromUser);
              return (
                <Card key={s.id} className="border border-warning/60">
                  <div className="flex items-center gap-3">
                    <Avatar name={from?.displayName ?? "?"} colour={from?.colour} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium">{from?.displayName} says they paid you</p>
                      <p className="tabular text-[13px] text-muted">
                        {formatMoney(s.amount, s.currency)} via DuitNow · {formatDate(s.createdAt)}
                      </p>
                    </div>
                    <Pill tone="warning">Pending</Pill>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="success" onClick={() => run((d) => setSettlementStatus(d, s.id, "confirmed"))}>
                      Confirm received
                    </Button>
                    <Button size="sm" onClick={() => run((d) => setSettlementStatus(d, s.id, "cancelled"))}>
                      Not received
                    </Button>
                  </div>
                </Card>
              );
            })}
            {waiting.map((s) => (
              <Card key={s.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">Waiting for {userName(state, s.toUser)} to confirm</p>
                  <p className="tabular text-[13px] text-muted">{formatMoney(s.amount, s.currency)} via DuitNow</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => run((d) => setSettlementStatus(d, s.id, "cancelled"))}>
                  Cancel
                </Button>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      <SectionTitle action={<DemoBadge />}>Wallet</SectionTitle>
      <Link href="/app/wallet" className="block">
        <Card className="flex items-center justify-between hover:bg-line">
          <div>
            <p className="text-[13px] text-muted">Fiat (MYR)</p>
            <Amount minor={myrWallet} currency="MYR" size="md" className="mt-1" />
          </div>
          <div className="text-right">
            <p className="text-[13px] text-muted">Crypto (est.)</p>
            <Amount minor={cryptoSen} currency="MYR" size="md" className="mt-1" />
          </div>
        </Card>
      </Link>

      <SectionTitle action={<Link href="/app/groups" className="text-[13px] font-medium text-accent">All groups</Link>}>Recent activity</SectionTitle>
      {activity.length ? (
        <List>
          {activity.map((a) => (
            <ListRow
              key={a.id}
              href={a.href}
              title={a.title}
              subtitle={`${a.subtitle} · ${formatDate(a.at)}`}
              right={
                <>
                  <p className="tabular text-[15px] font-medium">{a.amount}</p>
                  {a.kind === "expense" && a.mine ? <p className="tabular text-[12px] text-muted">your share {formatMoney(a.mine, a.currency)}</p> : null}
                </>
              }
            />
          ))}
        </List>
      ) : (
        <EmptyState text="No activity yet. Create a group and add your first expense." />
      )}
      <AppFooter />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Copy, ReceiptText, ScanLine } from "lucide-react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Amount, Avatar, Button, ButtonLink, Card, EmptyState, List, ListRow, Notice, Pill, SectionTitle } from "@/components/ui";
import { groupById, groupExpenses, groupNets, groupPayments, groupSettlements, leaveGroup, userById, userName } from "@/lib/demo/logic";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/ledger";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, me } = useApp();
  const router = useRouter();
  const { run, error } = useAction();
  const [copied, setCopied] = useState(false);
  const group = groupById(state, id);

  if (!group || !group.members.some((m) => m.userId === me.id)) {
    return (
      <main>
        <PageHeader title="Group" back="/app/groups" />
        <EmptyState text="This group doesn't exist or you're not a member." action={<ButtonLink href="/app/groups">Back to groups</ButtonLink>} />
      </main>
    );
  }

  const nets = groupNets(state, group);
  const myNet = nets.get(me.id) ?? 0;
  const payments = groupPayments(state, group);
  const expenses = groupExpenses(state, group.id);
  const settlements = groupSettlements(state, group.id)
    .filter((s) => s.status !== "cancelled")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pendingFrom = (from: string, to: string) =>
    settlements.find((s) => s.fromUser === from && s.toUser === to && s.status === "pending");

  const copyLink = async () => {
    const link = `${window.location.origin}/app/join/${group.inviteCode}`;
    try {
      if (navigator.share) await navigator.share({ title: `Join ${group.name} on JomBit`, text: `Invite code ${group.inviteCode}`, url: link });
      else await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // user cancelled share
    }
  };

  return (
    <main>
      <PageHeader
        title={`${group.icon} ${group.name}`}
        back="/app/groups"
        badge={
          <span className="flex gap-1.5 text-[12px] text-muted">
            {group.members.length} members · {group.currency}
            {group.isTrip ? <Pill tone="info" className="py-0 text-[11px]">Trip</Pill> : null}
          </span>
        }
      />

      <Card className="p-5">
        <p className="text-[13px] text-muted">{myNet > 0 ? "You are owed" : myNet < 0 ? "You owe" : "Your balance"}</p>
        <Amount minor={Math.abs(myNet)} currency={group.currency} tone={myNet > 0 ? "success" : myNet < 0 ? "danger" : undefined} className="mt-2" />
        {myNet === 0 ? <p className="mt-2 text-[13px] text-muted">You&apos;re all settled up 🎉</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ButtonLink href={`/app/groups/${group.id}/expenses/new`} variant="primary">
            <ReceiptText size={18} aria-hidden /> Add expense
          </ButtonLink>
          <ButtonLink href={`/app/scan?group=${group.id}`}>
            <ScanLine size={18} aria-hidden /> Scan receipt
          </ButtonLink>
        </div>
      </Card>

      {error ? <div className="mt-3"><Notice tone="danger">{error}</Notice></div> : null}

      <SectionTitle>Suggested payments (simplified)</SectionTitle>
      {payments.length ? (
        <List>
          {payments.map((p) => {
            const mine = p.from === me.id;
            const pending = pendingFrom(p.from, p.to);
            return (
              <div key={`${p.from}-${p.to}`} className="flex min-h-14 items-center gap-2 px-4 py-3">
                <Avatar name={userName(state, p.from)} colour={userById(state, p.from)?.colour} size={32} />
                <ArrowRight size={16} className="text-muted" aria-label="pays" />
                <Avatar name={userName(state, p.to)} colour={userById(state, p.to)?.colour} size={32} />
                <div className="min-w-0 flex-1 pl-1">
                  <p className="truncate text-[14px]">
                    <b>{p.from === me.id ? "You" : userName(state, p.from)}</b> pay{p.from === me.id ? "" : "s"}{" "}
                    <b>{p.to === me.id ? "you" : userName(state, p.to)}</b>
                  </p>
                  <p className="tabular text-[15px] font-semibold">{formatMoney(p.amount, group.currency)}</p>
                </div>
                {mine ? (
                  pending ? (
                    <Pill tone="warning">Pending</Pill>
                  ) : (
                    <ButtonLink size="sm" href={`/app/settle?group=${group.id}&to=${p.to}&amount=${p.amount}`}>
                      Settle up
                    </ButtonLink>
                  )
                ) : pending ? (
                  <Pill tone="warning">Pending</Pill>
                ) : null}
              </div>
            );
          })}
        </List>
      ) : (
        <EmptyState text="Everyone is settled up. Nothing to pay." />
      )}
      <p className="mt-2 text-[12px] text-muted">
        Debts are simplified: largest creditor is matched with largest debtor, so the group needs at most {Math.max(0, group.members.length - 1)} payments.
      </p>

      <SectionTitle>Member balances</SectionTitle>
      <List>
        {group.members.map((m) => {
          const u = userById(state, m.userId);
          const net = nets.get(m.userId) ?? 0;
          return (
            <ListRow
              key={m.userId}
              left={<Avatar name={u?.displayName ?? "?"} colour={u?.colour} size={36} />}
              title={`${u?.displayName}${m.userId === me.id ? " (you)" : ""}`}
              subtitle={m.role === "owner" ? "Owner" : u?.duitnowPayload ? "DuitNow QR added" : "No DuitNow QR yet"}
              right={
                net === 0 ? (
                  <span className="text-[13px] text-muted">settled</span>
                ) : (
                  <>
                    <span className={`tabular block text-[15px] font-semibold ${net > 0 ? "text-success-text" : "text-danger-text"}`}>
                      {formatMoney(net, group.currency, { sign: true })}
                    </span>
                    <span className="block text-[12px] text-muted">{net > 0 ? "gets back" : "owes"}</span>
                  </>
                )
              }
            />
          );
        })}
      </List>

      <SectionTitle>Expenses</SectionTitle>
      {expenses.length ? (
        <List>
          {expenses.map((e) => {
            const share = e.shares.find((s) => s.userId === me.id)?.amount ?? 0;
            return (
              <ListRow
                key={e.id}
                href={`/app/groups/${group.id}/expenses/${e.id}`}
                left={
                  <span className="flex w-10 flex-col items-center text-[11px] leading-tight text-muted">
                    {formatDate(e.expenseDate)}
                  </span>
                }
                title={
                  <span className="flex items-center gap-1.5">
                    {e.description}
                    {e.fromReceipt ? <ScanLine size={14} className="text-accent" aria-label="scanned receipt" /> : null}
                  </span>
                }
                subtitle={`${e.paidBy === me.id ? "You" : userName(state, e.paidBy)} paid ${formatMoney(e.total, e.currency)}`}
                right={
                  e.paidBy === me.id ? (
                    <span className="tabular text-[13px] text-success-text">you lent {formatMoney(e.total - share, e.currency)}</span>
                  ) : share ? (
                    <span className="tabular text-[13px] text-danger-text">you owe {formatMoney(share, e.currency)}</span>
                  ) : (
                    <span className="text-[13px] text-muted">not involved</span>
                  )
                }
              />
            );
          })}
        </List>
      ) : (
        <EmptyState text="No expenses yet. Add one or scan a receipt." />
      )}

      {settlements.length ? (
        <>
          <SectionTitle>Settlements</SectionTitle>
          <List>
            {settlements.map((s) => (
              <ListRow
                key={s.id}
                title={`${userName(state, s.fromUser)} → ${userName(state, s.toUser)}`}
                subtitle={`${s.method === "duitnow" ? "DuitNow QR" : "JomBit wallet"} · ${formatDate(s.createdAt)}`}
                right={
                  <>
                    <span className="tabular block text-[15px] font-medium">{formatMoney(s.amount, s.currency)}</span>
                    <Pill tone={s.status === "confirmed" ? "success" : "warning"} className="mt-1">
                      {s.status}
                    </Pill>
                  </>
                }
              />
            ))}
          </List>
        </>
      ) : null}

      <SectionTitle>Invite friends</SectionTitle>
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">Invite code</p>
          <p className="font-mono text-[24px] font-bold tracking-[0.25em]">{group.inviteCode}</p>
        </div>
        <Button size="sm" onClick={copyLink} aria-label="Share invite link">
          <Copy size={16} aria-hidden /> {copied ? "Copied" : "Share link"}
        </Button>
      </Card>

      <Button
        variant="ghost"
        block
        className="mt-6 text-danger-text"
        onClick={() => {
          const ok = run((d) => {
            leaveGroup(d, me.id, group.id);
            return true;
          });
          if (ok) router.push("/app/groups");
        }}
      >
        Leave group
      </Button>
      <p className="text-center text-[12px] text-muted">
        <Link href="/app/groups" className="underline-offset-4 hover:underline">
          Back to all groups
        </Link>
      </p>
    </main>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ScanLine } from "lucide-react";
import { PageHeader, useApp } from "@/components/app/AppShell";
import { Amount, Avatar, Button, Card, EmptyState, List, ListRow, Pill, SectionTitle } from "@/components/ui";
import { deleteExpense, userById, userName } from "@/lib/demo/logic";
import { update } from "@/lib/demo/store";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/ledger";

const METHOD = { equal: "Split equally", exact: "Exact amounts", items: "Split by items" } as const;

export default function ExpenseDetailPage() {
  const { id, eid } = useParams<{ id: string; eid: string }>();
  const { state, me } = useApp();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const e = state.expenses.find((x) => x.id === eid && x.groupId === id);
  if (!e) return <EmptyState text="Expense not found." />;
  const charges = e.total - e.items.reduce((a, it) => a + it.lineTotal, 0);

  return (
    <main>
      <PageHeader title={e.description} back={`/app/groups/${id}`} />
      <Card className="p-5">
        <p className="text-[13px] text-muted">
          {e.merchant ?? "Total"} · {formatDate(e.expenseDate)}
        </p>
        <Amount minor={e.total} currency={e.currency} className="mt-2" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="muted">Paid by {e.paidBy === me.id ? "you" : userName(state, e.paidBy)}</Pill>
          <Pill tone="muted">{METHOD[e.splitMethod]}</Pill>
          {e.fromReceipt ? (
            <Pill tone="info">
              <ScanLine size={12} className="mr-1" aria-hidden /> Scanned receipt
            </Pill>
          ) : null}
        </div>
      </Card>

      {e.items.length ? (
        <>
          <SectionTitle>Items</SectionTitle>
          <List>
            {e.items.map((it) => (
              <ListRow
                key={it.id}
                title={`${it.quantity > 1 ? `${it.quantity}× ` : ""}${it.name}`}
                subtitle={it.assignedTo.map((u) => (u === me.id ? "You" : userName(state, u))).join(", ")}
                right={<span className="tabular text-[15px]">{formatMoney(it.lineTotal, e.currency)}</span>}
              />
            ))}
            <ListRow title="Service charge, SST & rounding" subtitle="Shared in proportion to each person's items" right={<span className="tabular">{formatMoney(charges, e.currency)}</span>} />
          </List>
        </>
      ) : null}

      <SectionTitle>Who owes what</SectionTitle>
      <List>
        {e.shares.map((s) => {
          const u = userById(state, s.userId);
          return (
            <ListRow
              key={s.userId}
              left={<Avatar name={u?.displayName ?? "?"} colour={u?.colour} size={32} />}
              title={s.userId === me.id ? "You" : u?.displayName}
              right={<span className="tabular text-[15px] font-semibold">{formatMoney(s.amount, e.currency)}</span>}
            />
          );
        })}
      </List>

      <div className="mt-6">
        {confirm ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="danger"
              onClick={() => {
                update((d) => deleteExpense(d, e.id));
                router.push(`/app/groups/${id}`);
              }}
            >
              Delete
            </Button>
            <Button onClick={() => setConfirm(false)}>Keep</Button>
          </div>
        ) : (
          <Button block variant="ghost" className="text-danger-text" onClick={() => setConfirm(true)}>
            Delete expense
          </Button>
        )}
      </div>
    </main>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Avatar, Button, EmptyState, Field, Input, Notice, Segmented, Select } from "@/components/ui";
import { addExpense, groupById, userById } from "@/lib/demo/logic";
import { equalShares, formatMoney, minorDigits, parseToMinor } from "@/lib/ledger";

export default function NewExpensePage() {
  const { id } = useParams<{ id: string }>();
  const { state, me } = useApp();
  const router = useRouter();
  const { run, error, setError } = useAction();
  const group = groupById(state, id);
  const memberIds = group?.members.map((m) => m.userId) ?? [];
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(me.id);
  const [method, setMethod] = useState<"equal" | "exact">("equal");
  const [included, setIncluded] = useState<string[]>(memberIds);
  const [exact, setExact] = useState<Record<string, string>>({});

  if (!group) return <EmptyState text="Group not found." />;
  const digits = minorDigits(group.currency);
  const total = parseToMinor(amount, digits);
  const preview = total && total > 0 && included.length ? equalShares(total, included) : [];
  const exactShares = memberIds.map((u) => ({ userId: u, amount: parseToMinor(exact[u] || "0", digits) ?? NaN }));
  const exactSum = exactShares.reduce((a, s) => a + (Number.isNaN(s.amount) ? 0 : s.amount), 0);

  const save = () => {
    if (!description.trim()) return setError("Add a description.");
    if (!total || total <= 0) return setError("Enter an amount greater than zero.");
    let shares;
    if (method === "equal") {
      if (!included.length) return setError("Pick at least one person to split with.");
      shares = equalShares(total, included);
    } else {
      if (exactShares.some((s) => Number.isNaN(s.amount) || s.amount < 0)) return setError("Check the amounts — they must be numbers.");
      if (exactSum !== total) return setError(`Exact amounts add up to ${formatMoney(exactSum, group.currency)}, not ${formatMoney(total, group.currency)}.`);
      shares = exactShares.filter((s) => s.amount > 0);
    }
    const ok = run((d) =>
      addExpense(d, {
        groupId: group.id,
        description: description.trim(),
        merchant: null,
        expenseDate: new Date().toISOString().slice(0, 10),
        currency: group.currency,
        subtotal: total,
        serviceCharge: 0,
        sst: 0,
        rounding: 0,
        total,
        paidBy,
        splitMethod: method,
        fromReceipt: false,
        items: [],
        shares,
        createdBy: me.id,
      }),
    );
    if (ok) router.push(`/app/groups/${group.id}`);
  };

  return (
    <main>
      <PageHeader title="Add expense" back={`/app/groups/${group.id}`} />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Grab to KLCC" />
        </Field>
        <Field label={`Amount (${group.currency})`}>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="tabular text-[22px] font-semibold" />
        </Field>
        <Field label="Paid by">
          <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {memberIds.map((u) => (
              <option key={u} value={u}>
                {u === me.id ? "You" : userById(state, u)?.displayName}
              </option>
            ))}
          </Select>
        </Field>
        <Segmented
          label="Split method"
          value={method}
          onChange={setMethod}
          options={[
            { value: "equal", label: "Split equally" },
            { value: "exact", label: "Exact amounts" },
          ]}
        />
        <div className="divide-y divide-line rounded-[16px] bg-surface">
          {memberIds.map((u) => {
            const user = userById(state, u);
            const share = preview.find((p) => p.userId === u)?.amount;
            return (
              <div key={u} className="flex min-h-14 items-center gap-3 px-4 py-2">
                <Avatar name={user?.displayName ?? "?"} colour={user?.colour} size={32} />
                <span className="flex-1 text-[15px]">{u === me.id ? "You" : user?.displayName}</span>
                {method === "equal" ? (
                  <label className="flex items-center gap-3">
                    <span className="tabular text-[14px] text-muted">{share !== undefined ? formatMoney(share, group.currency) : "—"}</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-accent"
                      aria-label={`Include ${user?.displayName}`}
                      checked={included.includes(u)}
                      onChange={(e) => setIncluded((cur) => (e.target.checked ? memberIds.filter((x) => cur.includes(x) || x === u) : cur.filter((x) => x !== u)))}
                    />
                  </label>
                ) : (
                  <Input
                    aria-label={`Amount for ${user?.displayName}`}
                    className="tabular h-11 min-h-11 w-28 text-right"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={exact[u] ?? ""}
                    onChange={(e) => setExact((cur) => ({ ...cur, [u]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
        </div>
        {method === "exact" && total ? (
          <p className={`tabular text-[13px] ${exactSum === total ? "text-success-text" : "text-warning"}`}>
            {formatMoney(exactSum, group.currency)} of {formatMoney(total, group.currency)} assigned
            {exactSum === total ? " ✓" : ` — ${formatMoney(total - exactSum, group.currency)} left`}
          </p>
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit" variant="primary" block>
          Save expense
        </Button>
      </form>
    </main>
  );
}

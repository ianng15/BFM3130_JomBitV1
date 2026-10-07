"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Camera, PencilLine, Plus, ReceiptText, Trash2 } from "lucide-react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Amount, Avatar, Button, ButtonLink, Card, EmptyState, Field, Input, Notice, SectionTitle, Select } from "@/components/ui";
import { addExpense, myGroups, uid, userById } from "@/lib/demo/logic";
import { formatMoney, itemShares, minorToDecimalString, parseToMinor } from "@/lib/ledger";
import { mockParser, SAMPLE_RECEIPTS, type ParsedReceipt } from "@/lib/receipts";
import { cn } from "@/lib/utils";

type Step = "capture" | "reading" | "review" | "assign" | "summary";

interface DraftItem {
  id: string;
  name: string;
  qty: string;
  unit: string;
  line: string;
  assignedTo: string[];
}

interface Draft {
  merchant: string;
  date: string;
  currency: string;
  items: DraftItem[];
  service: string;
  sst: string;
  rounding: string;
  total: string;
}

const STEPS: Step[] = ["capture", "reading", "review", "assign", "summary"];
const toStr = (n: number) => minorToDecimalString(parseToMinor(String(n)) ?? 0);
const m = (s: string) => parseToMinor(s || "0");

function fromParsed(r: ParsedReceipt): Draft {
  return {
    merchant: r.merchant,
    date: r.date,
    currency: r.currency,
    items: r.items.map((it) => ({
      id: uid("itm"),
      name: it.name,
      qty: String(it.quantity),
      unit: toStr(it.unit_price),
      line: toStr(it.line_total),
      assignedTo: [],
    })),
    service: toStr(r.service_charge),
    sst: toStr(r.sst),
    rounding: toStr(r.rounding),
    total: toStr(r.total),
  };
}

function emptyDraft(): Draft {
  return {
    merchant: "",
    date: new Date().toISOString().slice(0, 10),
    currency: "MYR",
    items: [{ id: uid("itm"), name: "", qty: "1", unit: "", line: "", assignedTo: [] }],
    service: "0.00",
    sst: "0.00",
    rounding: "0.00",
    total: "",
  };
}

function Progress({ step }: { step: Step }) {
  const labels = ["Capture", "Read", "Review", "Assign", "Summary"];
  const idx = STEPS.indexOf(step);
  return (
    <ol className="mb-4 flex gap-1" aria-label="Progress">
      {labels.map((l, i) => (
        <li key={l} className="flex-1">
          <span className={cn("block h-1 rounded-full", i <= idx ? "bg-accent" : "bg-surface")} />
          <span className={cn("mt-1 block text-center text-[11px]", i === idx ? "text-accent" : "text-muted")}>{l}</span>
        </li>
      ))}
    </ol>
  );
}

function ScanFlow() {
  const { state, me } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const { run, error, setError } = useAction();
  const groups = myGroups(state, me.id);
  const [step, setStep] = useState<Step>("capture");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [groupId, setGroupId] = useState(params.get("group") ?? groups.find((g) => g.currency === "MYR")?.id ?? groups[0]?.id ?? "");
  const [paidBy, setPaidBy] = useState(me.id);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo);
  }, [photo]);

  const group = groups.find((g) => g.id === groupId);
  const memberIds = useMemo(() => group?.members.map((x) => x.userId) ?? [], [group]);

  const startSample = (sampleId: string) => {
    setStep("reading");
    setPhotoNote(null);
    setTimeout(async () => {
      try {
        const parsed = await mockParser.parse({ sampleId });
        setDraft(fromParsed(parsed));
        setStep("review");
      } catch (e) {
        setPhotoNote((e as Error).message);
        setStep("capture");
      }
    }, 1600);
  };

  const onPhoto = (file?: File) => {
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    setStep("reading");
    setTimeout(async () => {
      try {
        await mockParser.parse({ image: file });
      } catch {
        setPhotoNote(
          "Demo mode: the AI receipt reader isn't connected, so we can't read your photo. Pick a sample receipt below, or enter the items manually (your photo stays on screen for reference).",
        );
        setStep("capture");
      }
    }, 1400);
  };

  // ---------- review maths ----------
  const itemsSum = draft.items.reduce((a, it) => a + (m(it.line) ?? 0), 0);
  const charges = (m(draft.service) ?? 0) + (m(draft.sst) ?? 0) + (m(draft.rounding) ?? 0);
  const total = m(draft.total);
  const badNumbers = draft.items.some((it) => m(it.line) === null || m(it.unit) === null) || total === null;
  const mismatch = total !== null && itemsSum + charges !== total;

  const setItem = (id: string, patch: Partial<DraftItem>) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((it) => {
        if (it.id !== id) return it;
        const next = { ...it, ...patch };
        if (("qty" in patch || "unit" in patch) && /^\d+$/.test(next.qty) && m(next.unit) !== null) {
          next.line = minorToDecimalString(Number(next.qty) * (m(next.unit) ?? 0));
        }
        return next;
      }),
    }));

  const toggle = (itemId: string, userId: string) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((it) =>
        it.id !== itemId
          ? it
          : {
              ...it,
              assignedTo: it.assignedTo.includes(userId)
                ? it.assignedTo.filter((u) => u !== userId)
                : memberIds.filter((u) => it.assignedTo.includes(u) || u === userId),
            },
      ),
    }));

  const splitAll = () => setDraft((d) => ({ ...d, items: d.items.map((it) => ({ ...it, assignedTo: [...memberIds] })) }));

  const validItems = draft.items.filter((it) => (m(it.line) ?? 0) > 0);
  const allAssigned = validItems.length > 0 && validItems.every((it) => it.assignedTo.some((u) => memberIds.includes(u)));
  const shares = useMemo(() => {
    if (!allAssigned || total === null || total <= 0) return [];
    try {
      return itemShares(
        validItems.map((it) => ({ lineTotal: m(it.line) ?? 0, assignedTo: it.assignedTo.filter((u) => memberIds.includes(u)) })),
        total,
        memberIds,
      );
    } catch {
      return [];
    }
  }, [allAssigned, validItems, total, memberIds]);

  const save = () => {
    if (!group || total === null) return;
    const id = run((d) =>
      addExpense(d, {
        groupId: group.id,
        description: draft.merchant.trim() || "Scanned receipt",
        merchant: draft.merchant.trim() || null,
        expenseDate: draft.date,
        currency: group.currency,
        subtotal: itemsSum,
        serviceCharge: m(draft.service) ?? 0,
        sst: m(draft.sst) ?? 0,
        rounding: m(draft.rounding) ?? 0,
        total,
        paidBy,
        splitMethod: "items",
        fromReceipt: true,
        items: validItems.map((it) => ({
          id: it.id,
          name: it.name || "Item",
          quantity: Number(it.qty) || 1,
          unitPrice: m(it.unit) ?? 0,
          lineTotal: m(it.line) ?? 0,
          assignedTo: it.assignedTo.filter((u) => memberIds.includes(u)),
        })),
        shares,
        createdBy: me.id,
      }),
    );
    if (id) router.push(`/app/groups/${group.id}/expenses/${id}`);
  };

  if (!groups.length) {
    return <EmptyState text="Join or create a group first, then scan a receipt into it." action={<ButtonLink href="/app/groups">Go to groups</ButtonLink>} />;
  }

  return (
    <>
      <Progress step={step} />

      {step === "capture" ? (
        <div className="space-y-4">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Your receipt photo" className="max-h-64 w-full rounded-[16px] object-contain bg-surface" />
          ) : null}
          {photoNote ? <Notice tone="warning">{photoNote}</Notice> : null}
          <Button variant="primary" block onClick={() => fileRef.current?.click()}>
            <Camera size={20} aria-hidden /> Take photo or upload
          </Button>
          <SectionTitle>Or try a sample receipt</SectionTitle>
          <div className="space-y-2">
            {SAMPLE_RECEIPTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => startSample(s.id)}
                className="flex w-full items-center gap-3 rounded-[16px] bg-surface p-4 text-left hover:bg-line"
              >
                <span className="flex h-12 w-10 items-center justify-center rounded-[6px] bg-fg text-on-accent" aria-hidden>
                  <ReceiptText size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{s.label}</span>
                  <span className="block truncate text-[13px] text-muted">{s.blurb}</span>
                </span>
                <span className="tabular text-[14px] font-semibold">{formatMoney(m(String(s.receipt.total)) ?? 0, s.receipt.currency)}</span>
              </button>
            ))}
          </div>
          <Button
            block
            variant="ghost"
            onClick={() => {
              setDraft(emptyDraft());
              setStep("review");
            }}
          >
            <PencilLine size={18} aria-hidden /> Enter items manually
          </Button>
        </div>
      ) : null}

      {step === "reading" ? (
        <div className="flex flex-col items-center py-10" role="status" aria-live="polite">
          <div className="relative h-56 w-44 overflow-hidden rounded-[12px] bg-fg p-4">
            {[70, 90, 55, 80, 65, 85, 50].map((w, i) => (
              <div key={i} className="mb-3 h-2.5 rounded bg-muted/40" style={{ width: `${w}%` }} />
            ))}
            <div className="absolute inset-x-0 h-1 animate-scan bg-accent shadow-[0_0_16px_var(--color-accent)]" />
          </div>
          <p className="mt-6 text-[17px] font-semibold">Reading your receipt…</p>
          <p className="mt-1 text-[13px] text-muted">Finding items, service charge and SST</p>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-4">
          <Field label="Merchant">
            <Input value={draft.merchant} onChange={(e) => setDraft({ ...draft, merchant: e.target.value })} placeholder="Restaurant name" />
          </Field>
          <Field label="Date">
            <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </Field>
          <SectionTitle>Items</SectionTitle>
          <div className="space-y-2">
            {draft.items.map((it, i) => (
              <Card key={it.id} className="space-y-2 p-3">
                <div className="flex gap-2">
                  <Input aria-label={`Item ${i + 1} name`} value={it.name} placeholder="Item name" onChange={(e) => setItem(it.id, { name: e.target.value })} />
                  <button
                    type="button"
                    aria-label={`Delete ${it.name || "item"}`}
                    onClick={() => setDraft({ ...draft, items: draft.items.filter((x) => x.id !== it.id) })}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-danger-text hover:bg-line"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Qty">
                    <Input inputMode="numeric" value={it.qty} onChange={(e) => setItem(it.id, { qty: e.target.value })} className="tabular" />
                  </Field>
                  <Field label="Unit RM">
                    <Input inputMode="decimal" value={it.unit} onChange={(e) => setItem(it.id, { unit: e.target.value })} className="tabular" />
                  </Field>
                  <Field label="Line RM">
                    <Input inputMode="decimal" value={it.line} onChange={(e) => setItem(it.id, { line: e.target.value })} className="tabular" />
                  </Field>
                </div>
              </Card>
            ))}
            <Button
              block
              variant="ghost"
              onClick={() => setDraft({ ...draft, items: [...draft.items, { id: uid("itm"), name: "", qty: "1", unit: "", line: "", assignedTo: [] }] })}
            >
              <Plus size={18} aria-hidden /> Add item
            </Button>
          </div>
          <SectionTitle>Charges & total</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Service charge">
              <Input inputMode="decimal" value={draft.service} onChange={(e) => setDraft({ ...draft, service: e.target.value })} className="tabular" />
            </Field>
            <Field label="SST">
              <Input inputMode="decimal" value={draft.sst} onChange={(e) => setDraft({ ...draft, sst: e.target.value })} className="tabular" />
            </Field>
            <Field label="Rounding">
              <Input inputMode="decimal" value={draft.rounding} onChange={(e) => setDraft({ ...draft, rounding: e.target.value })} className="tabular" />
            </Field>
            <Field label="Total">
              <Input inputMode="decimal" value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} className="tabular font-semibold" />
            </Field>
          </div>
          <p className="tabular text-[13px] text-muted">
            Items {formatMoney(itemsSum, "MYR")} + charges {formatMoney(charges, "MYR")} = {formatMoney(itemsSum + charges, "MYR")}
          </p>
          {badNumbers ? <Notice tone="danger">Some amounts aren&apos;t valid numbers.</Notice> : null}
          {!badNumbers && mismatch ? (
            <Notice tone="warning">
              Items + charges don&apos;t match the total ({formatMoney(total ?? 0, "MYR")}). Check the numbers — you can still continue; the
              difference will be shared in proportion to items.
            </Notice>
          ) : null}
          <Button variant="primary" block disabled={badNumbers || !validItems.length || !total || total <= 0} onClick={() => setStep("assign")}>
            Next: assign items
          </Button>
          <Button block variant="ghost" onClick={() => setStep("capture")}>
            Back
          </Button>
        </div>
      ) : null}

      {step === "assign" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Group">
              <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.icon} {g.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Who paid">
              <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {memberIds.map((u) => (
                  <option key={u} value={u}>
                    {u === me.id ? "You" : userById(state, u)?.displayName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {group && group.currency !== draft.currency ? (
            <Notice tone="warning">
              This group uses {group.currency}. The receipt amounts will be recorded as {group.currency}.
            </Notice>
          ) : null}
          <Button block onClick={splitAll}>
            Split everything evenly
          </Button>
          <p className="text-[13px] text-muted">Tap the people who shared each item. Shared items are split equally between them.</p>
          <div className="space-y-2">
            {validItems.map((it) => (
              <Card key={it.id} className="p-3">
                <div className="flex justify-between gap-2 text-[15px]">
                  <span className="truncate">
                    {Number(it.qty) > 1 ? `${it.qty}× ` : ""}
                    {it.name || "Item"}
                  </span>
                  <span className="tabular font-medium">{formatMoney(m(it.line) ?? 0, "MYR")}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {memberIds.map((u) => {
                    const user = userById(state, u);
                    const on = it.assignedTo.includes(u);
                    return (
                      <button
                        key={u}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${on ? "Unassign" : "Assign"} ${user?.displayName}`}
                        onClick={() => toggle(it.id, u)}
                        className={cn("flex min-h-11 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px]", on ? "bg-bg text-fg" : "bg-surface-2 text-muted")}
                      >
                        <Avatar name={user?.displayName ?? "?"} colour={user?.colour} size={30} selected={on} className={on ? "" : "opacity-50"} />
                        {u === me.id ? "You" : user?.displayName}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
          {!allAssigned ? <Notice tone="info">Assign every item to at least one person to continue.</Notice> : null}
          <Button variant="primary" block disabled={!allAssigned} onClick={() => setStep("summary")}>
            Next: summary
          </Button>
          <Button block variant="ghost" onClick={() => setStep("review")}>
            Back
          </Button>
        </div>
      ) : null}

      {step === "summary" && group ? (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-[13px] text-muted">{draft.merchant || "Receipt"} total</p>
            <Amount minor={total ?? 0} currency={group.currency} className="mt-2" />
            <p className="mt-2 text-[13px] text-muted">
              Paid by {paidBy === me.id ? "you" : userById(state, paidBy)?.displayName} · into {group.icon} {group.name}
            </p>
          </Card>
          <p className="text-[13px] text-muted">Service charge, SST and rounding are shared in proportion to what each person ordered.</p>
          <div className="divide-y divide-line rounded-[16px] bg-surface">
            {shares.map((s) => {
              const user = userById(state, s.userId);
              const itemsPart = validItems.reduce((a, it) => {
                const assigned = it.assignedTo.filter((u) => memberIds.includes(u));
                if (!assigned.includes(s.userId)) return a;
                return a + Math.floor((m(it.line) ?? 0) / assigned.length);
              }, 0);
              return (
                <div key={s.userId} className="flex min-h-14 items-center gap-3 px-4 py-3">
                  <Avatar name={user?.displayName ?? "?"} colour={user?.colour} size={36} />
                  <div className="flex-1">
                    <p className="text-[15px] font-medium">{s.userId === me.id ? "You" : user?.displayName}</p>
                    <p className="tabular text-[12px] text-muted">
                      items ≈ {formatMoney(itemsPart, group.currency)} + charges ≈ {formatMoney(s.amount - itemsPart, group.currency)}
                    </p>
                  </div>
                  <span className="tabular text-[17px] font-semibold">{formatMoney(s.amount, group.currency)}</span>
                </div>
              );
            })}
          </div>
          <p className="tabular text-[13px] text-success-text">
            Shares add up to {formatMoney(shares.reduce((a, s) => a + s.amount, 0), group.currency)} ✓
          </p>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button
            variant="primary"
            block
            onClick={() => {
              setError(null);
              save();
            }}
          >
            Save as expense
          </Button>
          <Button block variant="ghost" onClick={() => setStep("assign")}>
            Back
          </Button>
        </div>
      ) : null}
    </>
  );
}

export default function ScanPage() {
  return (
    <main>
      <PageHeader title="Scan a receipt" />
      <Suspense>
        <ScanFlow />
      </Suspense>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Button, Field, Input, Notice, Select } from "@/components/ui";
import { createGroup } from "@/lib/demo/logic";
import { CURRENCIES } from "@/lib/ledger";
import { cn } from "@/lib/utils";

const ICONS = ["🍛", "✈️", "🏠", "🎉", "⚽", "🎓", "🛒", "☕"];

export default function NewGroupPage() {
  const { me } = useApp();
  const router = useRouter();
  const { run, error } = useAction();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [currency, setCurrency] = useState("MYR");
  const [isTrip, setIsTrip] = useState(false);

  return (
    <main>
      <PageHeader title="Create group" back="/app/groups" />
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const id = run((d) => createGroup(d, me.id, { name, icon, currency, isTrip }));
          if (id) router.push(`/app/groups/${id}`);
        }}
      >
        <Field label="Group name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Housemates" />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-muted">Icon</legend>
          <div className="grid grid-cols-8 gap-1.5">
            {ICONS.map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`Icon ${i}`}
                aria-pressed={icon === i}
                onClick={() => setIcon(i)}
                className={cn("flex h-11 items-center justify-center rounded-[12px] bg-surface text-[20px]", icon === i && "ring-2 ring-accent")}
              >
                {i}
              </button>
            ))}
          </div>
        </fieldset>
        <Field label="Default currency">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <label className="flex min-h-12 items-center justify-between rounded-[12px] bg-surface px-4">
          <span>
            <span className="block text-[15px]">Trip group</span>
            <span className="block text-[12px] text-muted">Shows wallet settle-up for cross-border trips</span>
          </span>
          <input type="checkbox" checked={isTrip} onChange={(e) => setIsTrip(e.target.checked)} className="h-5 w-5 accent-accent" />
        </label>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit" variant="primary" block>
          Create group
        </Button>
      </form>
    </main>
  );
}

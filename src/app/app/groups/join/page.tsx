"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PageHeader, useAction, useApp } from "@/components/app/AppShell";
import { Button, Field, Input, Notice } from "@/components/ui";
import { joinGroup } from "@/lib/demo/logic";

function JoinForm() {
  const { me, state } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const { run, error } = useAction();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const notMine = state.groups.filter((g) => !g.members.some((m) => m.userId === me.id));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const id = run((d) => joinGroup(d, me.id, code));
        if (id) router.push(`/app/groups/${id}`);
      }}
    >
      <Field label="6-character invite code">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          className="text-center font-mono text-[22px] tracking-[0.3em]"
          autoCapitalize="characters"
        />
      </Field>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Button type="submit" variant="primary" block disabled={code.length !== 6}>
        Join group
      </Button>
      {notMine.length ? (
        <Notice tone="info">
          Demo hint: try code{" "}
          {notMine.map((g, i) => (
            <span key={g.id}>
              {i ? " or " : ""}
              <button type="button" className="font-mono font-semibold underline" onClick={() => setCode(g.inviteCode)}>
                {g.inviteCode}
              </button>{" "}
              ({g.name})
            </span>
          ))}
          .
        </Notice>
      ) : null}
    </form>
  );
}

export default function JoinPage() {
  return (
    <main>
      <PageHeader title="Join a group" back="/app/groups" />
      <Suspense>
        <JoinForm />
      </Suspense>
    </main>
  );
}

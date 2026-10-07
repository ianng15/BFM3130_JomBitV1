"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uid } from "@/lib/demo/logic";
import { update } from "@/lib/demo/store";
import { Button, Field, Input, Notice } from "@/components/ui";
import { DuitNowUpload } from "@/components/app/DuitNowUpload";
import { PageHeader } from "@/components/app/AppShell";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const finish = (payload: string | null, merchantName: string | null) => {
    update((s) => {
      const id = uid("u");
      s.users.push({
        id,
        displayName: name.trim(),
        phone: phone.trim(),
        colour: s.users.length % 6,
        duitnowPayload: payload,
        duitnowName: merchantName,
        homeCurrency: "MYR",
        isDemo: false,
      });
      s.currentUserId = id;
      // Give new accounts a little demo money so the wallet isn't empty.
      s.walletTx.push({
        id: uid("wtx"),
        userId: id,
        wallet: "fiat",
        asset: "MYR",
        amount: "100.00",
        kind: "topup",
        referenceId: null,
        description: "Welcome demo balance (simulated)",
        metadata: {},
        createdAt: new Date().toISOString(),
      });
    });
    router.push("/app");
  };

  return (
    <main className="pb-10">
      <PageHeader title="Set up your profile" back="/app/login" />
      <p className="text-[13px] text-muted">Step {step} of 2</p>
      {step === 1 ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return setError("Please enter your name.");
            setError(null);
            setStep(2);
          }}
        >
          <Field label="Display name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hafiz" autoComplete="name" />
          </Field>
          <Field label="Phone number" hint="Shown to group members only. Not verified in the demo.">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60 12-345 6789" inputMode="tel" autoComplete="tel" />
          </Field>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button type="submit" variant="primary" block>
            Continue
          </Button>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <h2 className="text-[18px] font-semibold">Add your DuitNow QR</h2>
          <p className="text-[15px] text-muted">Friends scan this to pay you back. You can skip it, but you can&apos;t receive DuitNow settlements until it&apos;s added.</p>
          <DuitNowUpload displayName={name || "New user"} onSave={(p, n) => setTimeout(() => finish(p, n), 600)} />
          <Button variant="ghost" block onClick={() => finish(null, null)}>
            Skip for now
          </Button>
        </div>
      )}
    </main>
  );
}

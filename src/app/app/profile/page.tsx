"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, RotateCcw } from "lucide-react";
import { AppFooter, PageHeader, useApp } from "@/components/app/AppShell";
import { DuitNowUpload } from "@/components/app/DuitNowUpload";
import { Avatar, Button, Card, Field, Input, Notice, Pill, SectionTitle } from "@/components/ui";
import { resetDemo, update } from "@/lib/demo/store";

export default function ProfilePage() {
  const { me } = useApp();
  const router = useRouter();
  const [name, setName] = useState(me.displayName);
  const [phone, setPhone] = useState(me.phone);
  const [saved, setSaved] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const save = () => {
    if (!name.trim()) return;
    update((s) => {
      const u = s.users.find((x) => x.id === me.id)!;
      u.displayName = name.trim();
      u.phone = phone.trim();
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main>
      <PageHeader title="Profile" back="/app" />
      <div className="flex items-center gap-4 py-2">
        <Avatar name={me.displayName} colour={me.colour} size={64} />
        <div>
          <p className="text-[18px] font-semibold">{me.displayName}</p>
          <p className="text-[13px] text-muted">{me.isDemo ? "Demo user" : "Local account"}</p>
        </div>
      </div>

      <SectionTitle>Your details</SectionTitle>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Display name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Phone (display only)">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </Field>
        <Button type="submit" variant="primary" block>
          {saved ? "Saved ✓" : "Save changes"}
        </Button>
      </form>

      <SectionTitle>DuitNow QR</SectionTitle>
      <Card className="space-y-3">
        {me.duitnowPayload ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-medium">{me.duitnowName ?? "DuitNow QR saved"}</p>
              <p className="truncate font-mono text-[11px] text-muted">{me.duitnowPayload}</p>
            </div>
            <Pill tone="success">Saved</Pill>
          </div>
        ) : (
          <Notice tone="warning">No DuitNow QR yet — friends can&apos;t settle with you by DuitNow until you add one.</Notice>
        )}
        {replacing || !me.duitnowPayload ? (
          <DuitNowUpload
            displayName={me.displayName}
            demoAccountId={me.id.slice(-4).toUpperCase()}
            onSave={(payload, merchantName) => {
              update((s) => {
                const u = s.users.find((x) => x.id === me.id)!;
                u.duitnowPayload = payload;
                u.duitnowName = merchantName;
              });
              setReplacing(false);
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => setReplacing(true)}>
              Replace QR
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                update((s) => {
                  const u = s.users.find((x) => x.id === me.id)!;
                  u.duitnowPayload = null;
                  u.duitnowName = null;
                })
              }
            >
              Remove
            </Button>
          </div>
        )}
      </Card>

      <SectionTitle>Demo</SectionTitle>
      <Card className="space-y-3">
        <p className="text-[14px] text-muted">
          Puts every demo user, group, expense, wallet, crypto holding and card back to the starting state. Local accounts you created are removed.
        </p>
        {confirmReset ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="danger"
              onClick={() => {
                resetDemo(true);
                setConfirmReset(false);
                router.push("/app");
              }}
            >
              Yes, reset
            </Button>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
          </div>
        ) : (
          <Button block onClick={() => setConfirmReset(true)}>
            <RotateCcw size={18} aria-hidden /> Reset demo data
          </Button>
        )}
      </Card>

      <Button
        block
        variant="ghost"
        className="mt-6"
        onClick={() => {
          update((s) => {
            s.currentUserId = null;
          });
          router.push("/app/login");
        }}
      >
        <LogOut size={18} aria-hidden /> Log out / switch user
      </Button>
      <AppFooter />
    </main>
  );
}

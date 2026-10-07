"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { update, useDemoState } from "@/lib/demo/store";
import { Avatar, List, ListRow, Skeleton } from "@/components/ui";
import { AppFooter } from "@/components/app/AppShell";

const ROLE: Record<string, string> = {
  u_aiman: "Owed money in Mamak Friday · has a card, crypto & staking",
  u_mei: "Organised the Bangkok Trip · holds USDT",
  u_priya: "Owes in both groups · has SGD in her wallet",
  u_daniel: "No DuitNow QR yet · owes Aiman (pending payment)",
};

export default function LoginPage() {
  const state = useDemoState();
  const router = useRouter();
  if (!state) return <Skeleton className="mt-10 h-80" />;

  const pick = (id: string) => {
    update((s) => {
      s.currentUserId = id;
    });
    router.push("/app");
  };

  return (
    <main className="py-10">
      <Link href="/" className="text-[28px] font-bold tracking-tight">
        Jom<span className="text-accent">Bit</span>
      </Link>
      <h1 className="mt-6 text-[24px] font-semibold">Try as a demo user</h1>
      <p className="mt-1 text-[15px] text-muted">
        Pick someone to log in as. Everything is fake demo data saved only in this browser.
      </p>
      <List className="mt-6">
        {state.users.map((u) => (
          <ListRow
            key={u.id}
            onClick={() => pick(u.id)}
            left={<Avatar name={u.displayName} colour={u.colour} size={44} />}
            title={u.displayName}
            subtitle={ROLE[u.id] ?? (u.isDemo ? "Demo user" : "Your local account")}
            right={<ChevronRight size={20} className="text-muted" aria-hidden />}
          />
        ))}
      </List>
      <p className="mt-6 text-center text-[14px] text-muted">
        Want your own profile?{" "}
        <Link href="/app/onboarding" className="font-medium text-accent underline-offset-4 hover:underline">
          Create a local account
        </Link>
      </p>
      <AppFooter />
    </main>
  );
}

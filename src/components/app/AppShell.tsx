"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CreditCard, Home, ScanLine, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { update, useDemoState } from "@/lib/demo/store";
import type { DemoState, Profile } from "@/lib/demo/types";
import { Avatar, Skeleton } from "@/components/ui";

interface AppCtx {
  state: DemoState;
  me: Profile;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside the app shell");
  return v;
}

/** Run a demo mutation and capture a friendly error message. */
export function useAction() {
  const [error, setError] = useState<string | null>(null);
  const run = <T,>(fn: (draft: DemoState) => T): T | undefined => {
    try {
      setError(null);
      return update(fn);
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    }
  };
  return { error, setError, run };
}

const NAV = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/groups", label: "Groups", icon: Users },
  { href: "/app/scan", label: "Scan", icon: ScanLine, centre: true },
  { href: "/app/wallet", label: "Wallet", icon: Wallet },
  { href: "/app/card", label: "Card", icon: CreditCard },
];

function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-[480px] items-end justify-around px-2">
        {NAV.map(({ href, label, icon: Icon, centre }) => {
          const active = href === "/app" ? path === "/app" : path.startsWith(href);
          if (centre)
            return (
              <li key={href} className="-mt-6">
                <Link
                  href={href}
                  aria-label="Scan a receipt"
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_0_0_6px_var(--color-bg)] transition hover:brightness-110"
                >
                  <Icon size={26} aria-hidden />
                  <span className="text-[10px] font-semibold">Scan</span>
                </Link>
              </li>
            );
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-accent" : "text-muted hover:text-fg",
                )}
              >
                <Icon size={22} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const state = useDemoState();
  const path = usePathname();
  const router = useRouter();
  const isAuthPage = path.startsWith("/app/login") || path.startsWith("/app/onboarding");
  const me = state?.users.find((u) => u.id === state.currentUserId) ?? null;

  useEffect(() => {
    if (state && !me && !isAuthPage) router.replace("/app/login");
  }, [state, me, isAuthPage, router]);

  if (!state) {
    return (
      <div className="mx-auto max-w-[480px] space-y-4 px-4 pt-8">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-36" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (isAuthPage) return <div className="mx-auto min-h-dvh max-w-[480px] px-4">{children}</div>;
  if (!me) return null;

  return (
    <Ctx.Provider value={{ state, me }}>
      <div className="mx-auto min-h-dvh max-w-[480px] px-4 pb-32 pt-[max(env(safe-area-inset-top),12px)]">{children}</div>
      <BottomNav />
    </Ctx.Provider>
  );
}

export function PageHeader({
  title,
  back,
  right,
  badge,
}: {
  title: string;
  back?: string | boolean;
  right?: ReactNode;
  badge?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="flex min-h-14 items-center gap-2 py-2">
      {back ? (
        typeof back === "string" ? (
          <Link href={back} aria-label="Back" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface">
            <ArrowLeft size={22} aria-hidden />
          </Link>
        ) : (
          <button type="button" onClick={() => router.back()} aria-label="Back" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface">
            <ArrowLeft size={22} aria-hidden />
          </button>
        )
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[22px] font-semibold">{title}</h1>
        {badge}
      </div>
      {right}
    </header>
  );
}

export function MeAvatarLink() {
  const { me } = useApp();
  return (
    <Link href="/app/profile" aria-label="Your profile" className="rounded-full">
      <Avatar name={me.displayName} colour={me.colour} size={40} />
    </Link>
  );
}

export function AppFooter() {
  return (
    <p className="mt-10 text-center text-[12px] leading-relaxed text-muted">
      JomBit is a BFM3130 student proof of concept. It is not a licensed financial service and does not hold real funds.
      <br />
      Demo data is stored only in this browser.
    </p>
  );
}

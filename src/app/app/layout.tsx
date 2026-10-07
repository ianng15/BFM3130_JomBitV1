import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: "App",
  description: "JomBit app — split bills, settle with DuitNow, simulated wallet, crypto and card.",
  appleWebApp: { capable: true, title: "JomBit", statusBarStyle: "black-translucent" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

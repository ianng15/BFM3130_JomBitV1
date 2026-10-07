import Link from "next/link";
import {
  ArrowRight,
  Bitcoin,
  Building2,
  Camera,
  CheckCircle2,
  CreditCard,
  Globe2,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Split,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

const STEPS = [
  { icon: Camera, title: "Scan", text: "Snap the receipt. JomBit reads every item, the service charge and SST." },
  { icon: Split, title: "Split", text: "Tap who had what. Shared dishes split evenly; charges shared fairly by what each person ordered." },
  { icon: QrCode, title: "Settle", text: "We pre-fill a DuitNow QR with the exact amount. Friends pay from any Malaysian banking app." },
];

const NOW = [
  { icon: ReceiptText, title: "AI receipt scanning", text: "Items, quantities, service charge, SST and rounding — editable before you split." },
  { icon: Users, title: "Group ledger", text: "Groups for housemates, trips and mamak nights. Everyone sees who owes whom, to the sen." },
  { icon: Split, title: "Simplify debts", text: "We net everything out so the group needs as few payments as possible." },
  { icon: QrCode, title: "DuitNow settle up", text: "A one-time QR with the amount filled in. Confirm when the money lands." },
];

const SOON = [
  { icon: Wallet, title: "JomBit wallet", text: "Hold MYR, SGD, THB, IDR, PHP and USD." },
  { icon: Globe2, title: "Cross-border split", text: "Settle a Bangkok trip in baht, wallet to wallet." },
  { icon: TrendingUp, title: "Currency exchange", text: "Reference rates with a small, clear spread." },
  { icon: Bitcoin, title: "Crypto & staking", text: "Buy, sell and stake via a planned Luno integration." },
  { icon: CreditCard, title: "Prepaid card", text: "Spend your wallet — fiat or crypto — anywhere." },
];

const TIERS = [
  { name: "Virtual", price: "Free", text: "Issued instantly in the app. Add to your phone and tap to pay.", highlight: true },
  { name: "Plastic", price: "RM12", text: "A classic physical card delivered to your door." },
  { name: "Metal", price: "RM30", text: "Stainless-steel finish for people who like a little weight." },
];

const FAQ = [
  {
    q: "Is my money safe?",
    a: "Today JomBit never holds your money. Bill splitting settles directly between your bank accounts through DuitNow — JomBit only prepares the QR. The wallet, crypto and card features are a simulation in this proof of concept: no real funds are held. A live version would only run on licensed partners (see above).",
  },
  {
    q: "Do my friends need the app?",
    a: "To be in a group and see the split, yes — it's a free web app, no download needed (you can add it to your home screen). To pay you back by DuitNow they only need their usual banking app.",
  },
  {
    q: "Which banks work with DuitNow?",
    a: "DuitNow QR is Malaysia's national QR standard, so most Malaysian banking and e-wallet apps that support DuitNow QR can scan it. Whether a pre-filled amount is accepted for personal QRs is still being confirmed with PayNet's participation terms.",
  },
  {
    q: "Is JomBit a real company?",
    a: "Not yet. JomBit is a BFM3130 student proof of concept built to test the idea. It is not a licensed financial service.",
  },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] rounded-[44px] border-[10px] border-surface bg-bg p-4 shadow-[0_30px_80px_-30px_var(--color-accent)]" aria-hidden>
      <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-surface" />
      <p className="text-[11px] text-muted">Selamat datang,</p>
      <p className="text-[17px] font-semibold">Aiman</p>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-[14px] bg-surface p-3">
        <div>
          <p className="text-[10px] text-muted">Owed to you</p>
          <p className="tabular text-[18px] font-bold text-success-text">
            <span className="text-[10px] text-muted">RM</span> 86.43
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted">You owe</p>
          <p className="tabular text-[18px] font-bold">
            <span className="text-[10px] text-muted">RM</span> 0.00
          </p>
        </div>
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted">Mamak Friday</p>
      <div className="mt-2 space-y-1.5">
        {[
          ["Roti Canai ×4", "RM 7.20", "AMPD"],
          ["Nasi Kandar Ayam ×2", "RM 25.00", "AD"],
          ["Teh Tarik ×3", "RM 8.40", "AMP"],
        ].map(([n, p, who]) => (
          <div key={n} className="flex items-center justify-between rounded-[10px] bg-surface px-3 py-2">
            <div>
              <p className="text-[11px]">{n}</p>
              <div className="mt-1 flex -space-x-1">
                {who.split("").map((c, i) => (
                  <span key={i} className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-on-accent bg-avatar-${"AMPD".indexOf(c)}`}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <p className="tabular text-[11px] font-medium">{p}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-[12px] bg-fg p-2">
        <div className="grid h-14 w-14 grid-cols-5 gap-[2px] rounded bg-fg p-1">
          {Array.from({ length: 25 }).map((_, i) => (
            <span key={i} className={(i * 7) % 3 === 0 || i % 4 === 0 ? "bg-bg" : "bg-fg"} />
          ))}
        </div>
        <div className="text-on-accent">
          <p className="text-[10px]">DuitNow · pay Aiman</p>
          <p className="tabular text-[15px] font-bold">RM 21.43</p>
        </div>
      </div>
      <div className="mt-4 rounded-[12px] bg-accent py-2.5 text-center text-[12px] font-semibold text-on-accent">Settle up</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/85 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-[22px] font-bold tracking-tight">
            Jom<span className="text-accent">Bit</span>
          </Link>
          <div className="hidden items-center gap-6 text-[14px] text-muted md:flex">
            <a href="#how" className="hover:text-fg">How it works</a>
            <a href="#features" className="hover:text-fg">Features</a>
            <a href="#card" className="hover:text-fg">Card</a>
            <a href="#faq" className="hover:text-fg">FAQ</a>
            <a href="#team" className="hover:text-fg">Team</a>
          </div>
          <Link href="/app" className="inline-flex min-h-11 items-center rounded-[12px] bg-surface px-4 text-[14px] font-medium hover:bg-line">
            Open app
          </Link>
        </nav>
      </header>

      <main>
        {/* 1. Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div>
            <p className="inline-flex rounded-full border border-line px-3 py-1 text-[12px] text-muted">Student proof of concept · Malaysia 🇲🇾</p>
            <h1 className="mt-5 text-[40px] font-bold leading-[1.08] tracking-tight md:text-[56px]">
              Split the bill in seconds. <span className="text-accent">Settle with DuitNow.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted">
              Snap the receipt, tap who ate what, and send everyone a DuitNow QR with their exact share. No more spreadsheet maths after
              mamak.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-accent px-6 text-[16px] font-semibold text-on-accent hover:brightness-110">
                Try the demo <ArrowRight size={18} aria-hidden />
              </Link>
              <a href="#how" className="inline-flex min-h-12 items-center rounded-[12px] bg-surface px-6 text-[16px] hover:bg-line">
                How it works
              </a>
            </div>
            <p className="mt-4 text-[13px] text-muted">No sign-up needed — pick a demo user and click around.</p>
          </div>
          <PhoneMockup />
        </section>

        {/* 2. How it works */}
        <section id="how" className="bg-band py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-[32px] font-bold tracking-tight">How it works</h2>
            <p className="mt-2 text-muted">Three steps from &ldquo;who owes what?&rdquo; to settled.</p>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-[16px] bg-surface p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-on-accent">
                      <s.icon size={22} aria-hidden />
                    </span>
                    <span className="text-[13px] font-semibold text-muted">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-[22px] font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3. Features */}
        <section id="features" className="py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-[32px] font-bold tracking-tight">Features</h2>
            <div className="mt-8 flex items-center gap-2">
              <span className="rounded-full bg-success px-3 py-1 text-[12px] font-semibold text-fg">Available now</span>
              <span className="text-[13px] text-muted">in the proof of concept</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {NOW.map((f) => (
                <div key={f.title} className="rounded-[16px] bg-surface p-5">
                  <f.icon className="text-accent" size={24} aria-hidden />
                  <h3 className="mt-3 text-[17px] font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-2">
              <span className="rounded-full bg-warning px-3 py-1 text-[12px] font-semibold text-on-accent">Coming soon</span>
              <span className="text-[13px] text-muted">simulated preview in the demo</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {SOON.map((f) => (
                <div key={f.title} className="rounded-[16px] border border-line p-5">
                  <f.icon className="text-muted" size={22} aria-hidden />
                  <h3 className="mt-3 text-[16px] font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Wallet & crypto */}
        <section className="bg-band py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
            <div>
              <span className="rounded-full bg-warning px-3 py-1 text-[12px] font-semibold text-on-accent">Coming soon</span>
              <h2 className="mt-4 text-[32px] font-bold tracking-tight">One wallet for the trip and the after-party</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-muted">
                Keep separate fiat and crypto wallets. Top up by FPX, swap MYR to baht before your Bangkok trip, settle the hotel with friends
                wallet-to-wallet, and buy or stake crypto at live Luno prices.
              </p>
              <ul className="mt-6 space-y-3 text-[15px]">
                {[
                  "Six currencies: MYR, SGD, THB, IDR, PHP, USD",
                  "Exchange at the daily ECB reference rate + a clear 0.5% spread",
                  "Buy/sell BTC, ETH and more — 1% fee, shown upfront",
                  "Stake for indicative yield; our commission is shown as its own line",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                    <span className="text-muted">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3" aria-hidden>
              {[
                ["MYR", "RM 1,240.50"],
                ["THB", "฿3,820.00"],
                ["BTC", "0.00043 BTC"],
                ["ETH", "0.0048 ETH"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[16px] bg-surface p-5">
                  <p className="text-[13px] text-muted">{k}</p>
                  <p className="tabular mt-2 text-[20px] font-bold">{v}</p>
                </div>
              ))}
              <p className="col-span-2 text-center text-[12px] text-muted">Illustrative demo balances</p>
            </div>
          </div>
        </section>

        {/* 5. Card tiers */}
        <section id="card" className="py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-[32px] font-bold tracking-tight">The JomBit card</h2>
            <p className="mt-2 text-muted">Spend from your fiat or crypto wallet. Coming soon.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {TIERS.map((t) => (
                <div key={t.name} className={`rounded-[16px] p-6 ${t.highlight ? "bg-surface ring-2 ring-accent" : "bg-surface"}`}>
                  <div className={`aspect-[1.586] w-full rounded-[14px] p-4 ${t.name === "Virtual" ? "bg-gradient-to-br from-accent/90 via-info to-bg" : t.name === "Metal" ? "bg-gradient-to-br from-muted via-surface to-bg" : "border border-line bg-gradient-to-br from-band to-bg"}`}>
                    <p className="text-[16px] font-bold">
                      Jom<span className={t.name === "Virtual" ? "text-on-accent" : "text-accent"}>Bit</span>
                    </p>
                  </div>
                  <div className="mt-5 flex items-baseline justify-between">
                    <h3 className="text-[20px] font-semibold">{t.name}</h3>
                    <p className="tabular text-[22px] font-bold">{t.price}</p>
                  </div>
                  <p className="mt-2 text-[14px] text-muted">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Licensed infrastructure */}
        <section className="bg-band py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-accent" size={28} aria-hidden />
              <h2 className="text-[32px] font-bold tracking-tight">Built on licensed infrastructure</h2>
            </div>
            <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-muted">
              JomBit is designed as a friendly layer on top of regulated partners — we don&apos;t want to hold your money ourselves. These are{" "}
              <strong className="text-fg">planned integrations</strong>; no partnership has been signed.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: "Payments", d: "Planned integration with PayNet's DuitNow QR for bank-to-bank settlement." },
                { t: "Wallet top-ups", d: "Planned integration with a licensed FPX payment gateway such as Billplz." },
                { t: "Crypto", d: "Planned integration with a licensed digital-asset exchange such as Luno, which would hold the assets." },
                { t: "Cards", d: "Planned integration with a licensed prepaid card issuer and card network." },
              ].map((x) => (
                <div key={x.t} className="rounded-[16px] bg-surface p-5">
                  <Building2 className="text-muted" size={22} aria-hidden />
                  <h3 className="mt-3 text-[16px] font-semibold">{x.t}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. FAQ */}
        <section id="faq" className="py-20">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <h2 className="text-[32px] font-bold tracking-tight">FAQ</h2>
            <div className="mt-8 space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-[16px] bg-surface p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                    {f.q}
                    <span className="text-accent transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Team */}
        <section id="team" className="bg-band py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-[32px] font-bold tracking-tight">The team</h2>
            <p className="mt-2 text-muted">BFM3130 project group.</p>
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <li key={i} className="flex flex-col items-center rounded-[16px] bg-surface p-4 text-center">
                  <span className={`flex h-16 w-16 items-center justify-center rounded-full text-[20px] font-bold text-on-accent bg-avatar-${i % 6}`}>{i + 1}</span>
                  <p className="mt-3 text-[14px] font-semibold">Team member {i + 1}</p>
                  <p className="text-[12px] text-muted">Role</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-20 text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-[32px] font-bold tracking-tight">See it for yourself</h2>
            <p className="mt-3 text-muted">Log in as a demo user, scan a sample receipt and settle up with a real, valid DuitNow QR payload.</p>
            <Link href="/app" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-accent px-6 text-[16px] font-semibold text-on-accent hover:brightness-110">
              Try the demo <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-[13px] text-muted md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-[18px] font-bold text-fg">
            Jom<span className="text-accent">Bit</span>
          </p>
          <p className="max-w-2xl">
            JomBit is a [University] BFM3130 student proof of concept. It is not a licensed financial service and does not hold real funds.
          </p>
        </div>
      </footer>
    </div>
  );
}

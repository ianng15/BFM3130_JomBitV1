# JomBit — Build Playbook (prompts to paste into Claude Code)

Work through these in order. **One milestone = one Claude Code session = one pull request.** After each, open the Vercel preview link on your phone, click through everything, report problems to Claude Code in plain words, then merge.

---

## Before you start (one-time, ~20 minutes)

1. **Create the repo on GitHub:** github.com → "+" (top right) → New repository → name `jombit` → Private → tick "Add a README" → Create.
2. **Upload the starter files:** in the new repo click **Add file → Upload files**, drag in `SPEC.md`, `DESIGN.md`, `AGENTS.md`, `CLAUDE.md`, `PROMPTS.md` → Commit changes.
3. **Add Figma screenshots:** take 4–6 screenshots of the Figma reference file (home, wallet, buy/sell, any card screens). Upload them the same way, but first type `design/reference/` in the file name box so they go into that folder.
4. **Create a Supabase project:** supabase.com → New project → name `jombit`, region **Southeast Asia (Singapore)**, set and save a database password. Wait for it to finish.
5. **Get a free Google AI key (for receipt scanning):** aistudio.google.com → Get API key → Create. Keep it somewhere private. (Not needed until M3.)
6. **Open Claude Code:** go to claude.ai/code (or the Code tab in the Claude desktop app) → connect GitHub when asked → select the `jombit` repo.

Never paste passwords or API keys into a prompt. When Claude Code needs one, it will tell you which settings page to put it in.

---

## M0 — Project skeleton

```
Read AGENTS.md, SPEC.md and DESIGN.md first.

Do milestone M0 from SPEC.md section 7:
- Set up a Next.js (App Router, TypeScript, Tailwind, ESLint) project in this repo, with shadcn/ui.
- Add the DESIGN.md colour tokens (including the readable text tints) as Tailwind theme tokens, dark theme by default, Inter font with tabular numbers for amounts.
- Create the folder structure from AGENTS.md.
- Add a placeholder marketing page at / with the JomBit name, one-line pitch and a "Try the demo" button linking to /app.
- Add the app shell at /app: mobile-first layout, fixed bottom navigation (Home, Groups, Scan in the centre as a raised cyan button, Wallet, Card) with an empty placeholder page for each tab.
- Add Supabase client setup (browser + server) and a .env.example.
- Add Vitest with one sample test, plus lint, typecheck, test and build scripts.

Then explain to me, step by step and in plain language, how to:
1. connect this repo to Vercel and deploy it, and
2. connect my Supabase project (which environment variables to copy from where to where).
Open a pull request when done.
```

---

## M1 — Login, profiles, onboarding

```
Do milestone M1 from SPEC.md (sections 3, 4.3 "Registration", 6 profiles table).
- Supabase email/password sign up and log in, with logged-out users redirected from /app to /app/login.
- profiles table + row-level security, created automatically on sign up.
- Onboarding screen after first sign up: display name, phone, and DuitNow QR upload. Decode the QR image in the browser with jsqr, validate it with an EMVCo TLV parser + CRC check in src/lib/duitnow (with unit tests), and save the text payload. Allow "Skip for now".
- Profile screen (reached from an avatar on the Home tab): edit details, replace DuitNow QR, log out.
- Placeholder "Try as a demo user" buttons on the login page (wired up properly in M9).
Write the SQL as a migration and tell me exactly how to run it in Supabase.
```

---

## M2 — Groups, manual expenses, ledger, debt simplification

```
Do milestone M2 from SPEC.md (section 4.2 and the groups, group_members, expenses, expense_shares, settlements tables in section 6).
- Create group, join by 6-character invite code or link, leave group, group list.
- Add manual expense: description, amount, paid by, split equally or by exact amounts.
- Put all maths in src/lib/ledger as pure functions: minor-unit splitting with largest remainder, proportional allocation of service charge/SST, member nets, and debt simplification (largest creditor vs largest debtor).
- Write the unit tests listed in SPEC.md 4.2. They must pass.
- Group detail screen: my net, suggested payments, member balances, expense list. Home tab: totals across all groups and recent activity.
- Row-level security so users only see groups they belong to.
```

---

## M3 — Receipt scanning

```
Do milestone M3 from SPEC.md section 4.1.
- Scan tab: take a photo or upload, compress it, store it in a Supabase Storage bucket "receipts".
- Server route /api/receipts/parse using a ReceiptParser interface with three implementations: Gemini (Google AI vision model, key from env var GOOGLE_AI_API_KEY, returning the JSON shape in SPEC.md), Google Cloud Vision (adapter stub is fine), and a mock parser.
- Bundle 3 realistic Malaysian sample receipts (mamak, cafe with service charge + SST, a group dinner) and let the user pick one instead of taking a photo.
- Review screen (edit/add/delete items, totals check warning), Assign screen (tap avatars per item, "Split everything evenly", choose who paid), Summary screen (each person's share incl. proportional charges), Save as expense into a chosen group.
- If no API key is set or parsing fails, fall back to manual entry or sample receipts with a friendly message.
Tell me where to put the Google AI key in Vercel.
```

---

## M4 — DuitNow settle up

```
Do milestone M4 from SPEC.md section 4.3 "Settle up flow".
- In src/lib/duitnow: build a dynamic QR payload from a saved payload + amount (tag 01 = 12, insert/replace tag 54 in correct order, tag 53 = 458, recompute CRC-16/CCITT-FALSE over the string including "6304"). Add the unit tests from SPEC.md, including a check against a published EMVCo CRC example.
- Settle up from a suggested payment: method picker (DuitNow QR now; JomBit wallet greyed out "coming in M6"), QR screen with payee name, amount and "Save image", "I've paid" → pending settlement, payee sees it on Home and taps "Confirm received" → confirmed; cancel option. Only confirmed settlements change balances.
- Show the notice "Proof of concept — PayNet participation terms still to be confirmed."
- Use fake test payloads in tests and seed data, never a real account.
```

---

## M5 — Marketing website (can be done any time after M0)

```
Do milestone M5: build the full marketing website at / following SPEC.md section 5 "Website" and DESIGN.md.
- All 9 sections, responsive from phone to desktop, dark theme with cyan accent, phone mockups that show real screenshots or rebuilt mini versions of our app screens.
- No partner logos and no claims of signed partnerships — use "planned integration" wording.
- Footer disclaimer exactly as in SPEC.md (leave [University] as a placeholder for me to fill in).
- Good page title, description and social-share image.
```

---

## M6 — Fiat wallet, FX, cross-border split

```
Do milestone M6 from SPEC.md sections 4.4, 4.5, 4.6 (simulated — see AGENTS.md rule 2).
- wallet_transactions ledger table; balances = sum of rows. Wallet tab with Fiat and Crypto tabs (crypto can be an empty state for now).
- Top up via simulated "FPX via Billplz" flow, withdraw, transaction history.
- Exchange screen using Frankfurter daily reference rates via a server route cached for 1 hour, configurable spread constant.
- Enable "Pay with JomBit wallet" in Settle up: choose currency, auto-offer conversion from MYR if short, debit/credit + confirmed settlement in one database transaction.
- "Demo — simulated" badge on every screen in this milestone.
```

---

## M7 — Crypto buy/sell + staking

```
Do milestone M7 from SPEC.md sections 4.7 and 4.8 (simulated).
- Server route that fetches Luno public tickers (no API key) and caches them for 30 seconds. First check which MYR pairs Luno actually lists and only use those from the BTC/ETH/USDT/SOL/XRP list (Luno calls Bitcoin XBT).
- Crypto tab: holdings, live prices (Luno's public ticker has no 24h change, so don't show one), asset detail, Buy (at ask + fee) and Sell (at bid − fee) moving money between the fiat and crypto wallets.
- Staking: indicative APY constants, stake, live-ticking rewards, unstake with JomBit commission shown as its own line.
- Label: "Order routed to Luno (simulated). Held via Luno."
```

---

## M8 — Prepaid card

```
Do milestone M8 from SPEC.md section 4.9 (simulated).
- Card tab: issue a free virtual card (card visual in brand colours, fake test-range number, reveal details toggle), freeze/unfreeze.
- Order physical card: Plastic RM12 / Metal RM30, fee debited from the fiat wallet, status ordered → shipped → delivered via a "simulate next step" button.
- Funding source picker (MYR or a crypto asset, converted at Luno bid at purchase time).
- "Simulate a purchase" with sample Malaysian merchants and MCCs; log every card transaction with all interchange fields from SPEC.md; configurable interchange rate and JomBit/issuer split constants.
- A "Revenue view" toggle showing the interchange breakdown.
```

---

## M9 — Demo polish

```
Do milestone M9 from SPEC.md.
- Seed script / server route that creates the demo users, groups, expenses, wallet balances, crypto holdings, staking position and card described in SPEC.md section 3, using fake DuitNow test payloads. Wire up the "Try as a demo user" buttons and a "Reset demo data" button on the Profile screen.
- Make /app installable as a PWA (manifest, icons in brand colours, theme colour #151515).
- Install the web-design-guidelines skill with:
  npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -a claude-code -a codex
  then use it to audit the whole app and website, and fix the issues it finds.
- Check every screen for empty, loading and error states, and for 360px-wide phones.
Give me a click-through checklist I can follow on my phone before the presentation.
```

---

## When something goes wrong

- **Preview link shows an error:** copy the error text (or screenshot it) and paste it into Claude Code: "The preview shows this error: …"
- **Something looks wrong:** screenshot it and describe what you expected: "On the group screen the amounts aren't lined up; they should be right-aligned like the Figma screenshot."
- **Vercel build failed:** open the failed deployment in Vercel, copy the last ~30 lines of the log, paste to Claude Code.
- **Lost or confused:** come back to Claude chat in the BFM3130 Project and describe where you are.

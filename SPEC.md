# JomBit — Product & Technical Spec (Proof of Concept)

Source of truth: the group leader's "Global Feature & Systems Overview" doc (written under the startup's earlier name, WEY). This spec translates it into what we build for BFM3130. Where the doc is silent, the choice made here is marked **(assumed)** so it can be changed.

---

## 1. What we're building

JomBit is a group expense app with a built-in e-wallet.

- **Core loop (Phase 1, fully working):** photograph a receipt → AI reads the items → assign items to friends → the group ledger tracks who owes whom → settle up with a pre-filled DuitNow QR.
- **Wallet layer (Phase 2, simulated):** fiat wallet, cross-border transfers between JomBit users, fiat currency exchange, crypto buy/sell and staking via Luno.
- **Card (Phase 3, simulated):** virtual and physical prepaid card that spends from the fiat or crypto wallet.

Two deliverables, one codebase:

1. **Marketing website** at `/` — explains JomBit and links to the app.
2. **Web app (installable PWA)** at `/app` — the product itself, designed mobile-first.

### Real vs simulated — the golden rule

| Phase | Features | How it's built |
|---|---|---|
| 1 | Receipt scanning, group ledger, debt simplification, DuitNow QR | **Real, working logic.** No real money moves inside JomBit — the payer pays from their own banking app. |
| 2 | Fiat wallet, cross-border split, fiat exchange, crypto buy/sell, staking | **Simulated.** Real screens, real flows, real live crypto prices and real FX reference rates, but balances are demo money stored in our own database. |
| 3 | Prepaid card | **Simulated.** Card UI, ordering, simulated purchases, full transaction log. |

Every simulated screen shows a small yellow **"Demo — simulated"** badge. The website and the app footer both say JomBit is a student proof of concept and not a licensed financial service.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (latest stable, App Router) + TypeScript | One codebase for website + app; both Claude Code and Codex know it well |
| Styling | Tailwind CSS + shadcn/ui components | Brand colours as design tokens (see `DESIGN.md`) |
| Database, login, file storage | Supabase (Postgres, Auth, Storage) | Free tier; row-level security keeps each user's data private |
| Hosting | Vercel | Free; automatic preview link for every pull request |
| Receipt AI | Google AI (Gemini vision model) behind a swappable `ReceiptParser` interface **(assumed)** | The doc allows "an OCR/AI service" (Google Vision or AWS Textract). Gemini returns structured items directly, which avoids writing a fragile text parser. A Google Vision adapter can be swapped in. A **mock parser** with sample receipts is always available. |
| QR | `jsqr` (read QR images), `qrcode` (draw QR images) | Small, well-known libraries |
| Live crypto prices | Luno public API (`/api/1/ticker`, `/api/1/tickers`) — no API key needed | Real MYR prices make the simulation credible |
| FX rates | Frankfurter API (European Central Bank daily reference rates, free, no key) **(assumed)** | Covers MYR, SGD, THB, IDR, PHP, USD |
| Tests | Vitest | Ledger maths and QR checksum must be tested |

All external calls (AI, Luno, FX) go through our own server routes (`/api/...`), never directly from the browser, so keys stay secret and CORS isn't an issue.

---

## 3. Users & demo data

- Sign up with email + password (Supabase Auth). **(assumed)** — no phone OTP for the PoC.
- **Onboarding (required, per doc 3.3):** display name, phone number (display only), and **upload of the user's own DuitNow QR image**. The QR can be skipped during onboarding but the user cannot *receive* a DuitNow settlement until it's added.
- **Demo mode:** the login page has "Try as a demo user" buttons. A seed script creates:
  - 4 demo users: **Aiman, Mei Ling, Priya, Daniel**
  - 2 groups: **"Mamak Friday"** (MYR, 4 people, 5 expenses incl. one scanned receipt) and **"Bangkok Trip"** (THB, 3 people, trip group)
  - Demo wallet balances, a few crypto holdings, one staking position, one virtual card with transactions
  - Profile page has **"Reset demo data"**

Demo DuitNow QRs must be **fake but structurally valid** test payloads, never a real person's account.

---

## 4. Features in detail

### 4.1 AI receipt scanning (Phase 1 — real)

**Flow:** Scan tab → take photo or upload → "Reading receipt…" → **Review** → **Assign** → **Summary** → Save as expense.

1. **Capture:** camera input (`<input type="file" accept="image/*" capture="environment">`) or upload. Image compressed client-side, stored in Supabase Storage bucket `receipts`.
2. **Parse:** server route `/api/receipts/parse` sends the image to the `ReceiptParser` and returns:
   ```json
   {
     "merchant": "Restoran Nasi Kandar Pelita",
     "date": "2026-10-07",
     "currency": "MYR",
     "items": [{ "name": "Roti Canai", "quantity": 2, "unit_price": 1.80, "line_total": 3.60 }],
     "subtotal": 42.30, "service_charge": 4.23, "sst": 2.79, "rounding": -0.02, "total": 49.30,
     "confidence": "high"
   }
   ```
3. **Review:** every field editable. User can add/delete items. The app checks that items + charges = total and shows a yellow warning if not (doesn't block).
4. **Assign:** each item shows member avatars; tap to assign one or more people (shared item = split equally among them). Shortcut button **"Split everything evenly"**. Also choose **who paid** (default: current user).
5. **Summary:** each person's share. **Service charge and SST are allocated in proportion to each person's item subtotal** (see 4.2 rounding rule).
6. **Fallback:** if parsing fails or no AI key is configured, the user can enter items manually, or pick one of 3 bundled **sample receipts** (for reliable demos).

### 4.2 Group ledger + debt simplification (Phase 1 — real)

**Groups:** create (name, icon, default currency, "trip" toggle), invite by **6-character code or share link**, leave group.

**Expenses:** from a scanned receipt or **manual entry** (description, amount, paid by, split: equally / exact amounts / by items).

**Money rule:** all amounts are stored as **integers in the currency's minor unit** (sen for MYR). Never use floating point for money. When dividing, use the **largest-remainder method** so shares always add up exactly to the total.

**Balances:** for each member in a group:

```
net = (total of expenses they paid)
    − (total of their shares)
    + (confirmed settlements they paid out)
    − (confirmed settlements they received)
```
Positive = others owe them. Negative = they owe. All nets in a group sum to zero.

**Debt simplification** ("Simplify debts", as in Splitwise):
1. Compute every member's net.
2. Repeatedly match the largest creditor with the largest debtor; transfer `min(|credit|, |debt|)`; repeat until all nets are zero.
3. Result: at most *(members − 1)* payments. (Note for the report: this greedy method is the industry standard and greatly reduces payments, but it isn't guaranteed to be the mathematical minimum in every case — so describe it as "minimises" or "simplifies," not "fewest possible.")

Suggested payments are **computed on the fly**, never stored. Group screen shows: your net in this group, the suggested payments, the expense list, and a per-member balance list.

**Required unit tests:** splitting with remainders, proportional tax/service allocation, nets sum to zero, simplification settles everything, simplification gives ≤ n−1 payments.

### 4.3 DuitNow settlement (Phase 1 — real QR, no money through JomBit)

**Registration:** user uploads their DuitNow QR image → decoded in the browser with `jsqr` → validated → the **text payload** is saved to their profile (not just the image).

**Validation:** payload parses as EMVCo TLV (tag-length-value), starts with `000201`, and its CRC (tag `63`) is correct. If no DuitNow identifier is found in the merchant account info, show a warning but still save.

**Settle up flow:**
1. On a group screen, user taps a suggested payment where they are the payer → "Settle up".
2. Choose method: **DuitNow QR** (domestic) or **JomBit wallet** (only if both users have wallets — see 4.4).
3. For DuitNow, the app builds a new QR from the payee's saved payload:
   - Set tag `01` (point of initiation) to `12` (dynamic, one-time).
   - Insert or replace tag `54` (transaction amount), formatted like `12.50`, in correct tag order.
   - Ensure tag `53` (currency) is `458` (MYR).
   - Remove the old tag `63`, append `6304`, compute **CRC-16/CCITT-FALSE** (polynomial `0x1021`, initial value `0xFFFF`) over the entire string including `6304`, append as 4 uppercase hex characters.
4. Show the QR big on screen with payee name and amount, plus **"Save image"**. The payer scans it with any Malaysian banking app (e.g. a friend's phone, or saves and uploads the image into their bank app).
5. Payer taps **"I've paid"** → settlement status `pending`. Payee gets it in their activity feed and taps **"Confirm received"** → status `confirmed` and the ledger updates. Either side can cancel a pending settlement.

**Required unit tests:** TLV parse/serialise round-trip, CRC matches known EMVCo examples, amount insertion produces a valid CRC.

**On-screen notice:** "Proof of concept — PayNet participation terms still to be confirmed." (doc 3.3 flags this as an open question).

### 4.4 Fiat wallet (Phase 2 — simulated)

- Separate **Fiat** and **Crypto** wallets (doc section 1), shown as two tabs on the Wallet screen.
- Fiat wallet holds balances per currency: **MYR, SGD, THB, IDR, PHP, USD (assumed)**.
- **Top up:** "FPX via Billplz (simulated)" → pick a bank from a list → fake bank-approval screen → success → MYR credited.
- **Withdraw:** to a "linked bank account" (simulated).
- **Every balance change is a row in `wallet_transactions`** (an append-only ledger). Balances are the sum of those rows.

### 4.5 Cross-border split (Phase 2 — simulated, but genuinely works between demo users)

- In any group (most useful in "trip" groups), Settle up offers **"Pay with JomBit wallet"** when both users have JomBit wallets.
- Transfer happens in the currency the payer chooses. If the payer lacks enough of that currency, offer to **convert from MYR first** (uses 4.6).
- One database transaction: debit payer, credit payee, create a `confirmed` settlement. No QR, no bank.

### 4.6 Fiat currency exchange (Phase 2 — simulated, live rates)

- Exchange screen: from-currency, to-currency, amount → current rate (Frankfurter daily reference rate, cached 1 hour) → JomBit spread → "You get" → confirm.
- **JomBit spread:** configurable constant, default **0.5% (assumed — confirm with leader)**. The doc says "follow TnGr"; this is unclear and must be clarified with the leader.
- Rate, spread and fee are stored on the transaction.

### 4.7 Crypto buy/sell (Phase 2 — simulated, live Luno prices)

- Crypto tab: list of assets with **live MYR price** (bid/ask/last trade) from Luno's public ticker. (Luno's public ticker has no 24h-change field; skip it, or compute it later from our own stored price snapshots.) Assets: **BTC, ETH, USDT, SOL, XRP (assumed)** — the build must check which `…MYR` pairs Luno actually lists via `/api/1/tickers` and drop any that don't exist. (Luno uses `XBT` for Bitcoin.)
- **Buy:** enter MYR amount → quote at Luno ask price + JomBit fee → confirm → MYR debited from fiat wallet, crypto credited to crypto wallet.
- **Sell:** reverse, at Luno bid price.
- Label: "Order routed to Luno (simulated). Held via Luno." **(assumed — the doc has crypto landing in a JomBit wallet, which would need a DAC licence; leader to confirm wording.)**
- Fee: configurable, default **1.0% (assumed)**.

### 4.8 Crypto staking (Phase 2 — simulated)

- Stake screen per asset: indicative APY (configurable placeholder values, labelled "indicative"), amount input, "Stake via Luno".
- Rewards accrue continuously: `reward = amount × APY × elapsed_time / 1 year`, computed when displayed, so the number visibly ticks up.
- Unstake: returns principal + rewards minus **JomBit commission on yield (configurable, default 10% — assumed)**.
- Show the commission line clearly (it's a revenue stream in the business model).

### 4.9 Prepaid card (Phase 3 — simulated)

- **Virtual card:** free, issued instantly. Shows a card visual in brand colours, masked number (fake, test-range digits), expiry, and a "Reveal details" toggle.
- **Physical card:** order **Plastic (RM12)** or **Metal (RM30)** — fee debited from the fiat wallet; status moves `ordered → shipped → delivered` (simulated with a button).
- **Funding source:** choose fiat (MYR) or a crypto asset. Crypto is converted at the Luno bid price at the moment of purchase.
- **Freeze / unfreeze** card.
- **"Simulate a purchase"**: pick a sample merchant + amount → authorises against the chosen source → logs a card transaction.
- **Card transaction log** must capture enough for interchange reconciliation (doc 3.8): merchant name, merchant category code, amount, currency, funding source, FX/crypto rate used, interchange rate, interchange amount, **JomBit share**, **issuer share**, auth code, status, timestamp. Interchange rate and JomBit/issuer split are configurable constants **(assumed placeholders — finance team to supply)**.
- Optional "Revenue view" toggle on the card screen that shows the interchange breakdown — useful for the presentation.

---

## 5. Screens

### App (`/app`) — mobile-first, dark theme, bottom navigation

| Area | Screens |
|---|---|
| Auth | Login (with demo-user buttons), Sign up, Onboarding (name, phone, DuitNow QR upload) |
| Bottom nav | **Home · Groups · Scan (centre, prominent) · Wallet · Card** |
| Home | Total owed to you / you owe (all groups), quick actions, recent activity, wallet summary, pending settlement confirmations |
| Groups | Group list · Create group · Join by code · Group detail (balances, suggested payments, expenses) · Expense detail · Add manual expense |
| Scan | Capture → Reading → Review items → Assign → Summary |
| Settle up | Choose method → DuitNow QR screen / Wallet transfer confirm → Done |
| Wallet | Fiat tab (balances, Top up, Exchange, Transfer, Withdraw) · Crypto tab (holdings, prices, Buy/Sell, Stake) · Transaction history · Asset detail |
| Card | Card visual + controls · Order physical card · Simulate purchase · Card transactions · Revenue view |
| Profile (from Home avatar) | Edit profile · Manage DuitNow QR · Reset demo data · Log out |

### Website (`/`)

1. **Hero** — one-line pitch ("Split the bill in seconds. Settle with DuitNow."), phone mockup, "Try the demo" → `/app`.
2. **How it works** — Scan → Split → Settle (3 steps).
3. **Features** — Phase 1 features as "Available now"; wallet, exchange, crypto, card as "Coming soon".
4. **Wallet & crypto** section.
5. **Card tiers** — Virtual (free), Plastic (RM12), Metal (RM30).
6. **Built on licensed infrastructure** — explains the partner model in words. **No partner logos and no claims of signed partnerships**; use "planned integration with…" wording.
7. **FAQ** (Is my money safe? Do my friends need the app? Which banks work with DuitNow?).
8. **Team** — placeholders for 7 members.
9. **Footer** — disclaimer: "JomBit is a [University] BFM3130 student proof of concept. It is not a licensed financial service and does not hold real funds."

---

## 6. Data model (Supabase Postgres)

All money columns are `bigint` minor units unless noted. Every table has `id uuid` and `created_at`. Row-level security on every table: users only see rows for themselves or for groups they belong to.

| Table | Key columns |
|---|---|
| `profiles` | `id` (= auth user id), `display_name`, `phone`, `avatar_url`, `duitnow_payload` (text), `duitnow_name`, `home_currency` (default `MYR`), `is_demo` |
| `groups` | `name`, `icon`, `currency`, `is_trip`, `invite_code` (unique), `created_by` |
| `group_members` | `group_id`, `user_id`, `role` (`owner`/`member`), `joined_at` |
| `receipts` | `uploaded_by`, `image_path`, `parsed` (jsonb), `parser` (`gemini`/`vision`/`mock`), `status` |
| `expenses` | `group_id`, `description`, `merchant`, `expense_date`, `currency`, `subtotal`, `service_charge`, `sst`, `rounding`, `total`, `paid_by`, `split_method` (`equal`/`exact`/`items`), `receipt_id`, `created_by` |
| `expense_items` | `expense_id`, `name`, `quantity`, `unit_price`, `line_total` |
| `item_assignments` | `item_id`, `user_id` |
| `expense_shares` | `expense_id`, `user_id`, `amount` — final share incl. allocated charges; **this is what the ledger reads** |
| `settlements` | `group_id`, `from_user`, `to_user`, `amount`, `currency`, `method` (`duitnow`/`wallet`), `status` (`pending`/`confirmed`/`cancelled`), `qr_payload`, `confirmed_at` |
| `wallet_transactions` | `user_id`, `wallet` (`fiat`/`crypto`), `asset` (e.g. `MYR`, `THB`, `XBT`), `amount` (`numeric(38,18)` signed), `kind` (`topup`, `withdraw`, `transfer_in`, `transfer_out`, `fx_in`, `fx_out`, `crypto_buy`, `crypto_sell`, `stake`, `unstake`, `staking_reward`, `card_spend`, `card_fee`), `reference_id`, `metadata` (jsonb: rate, fee, spread, source) |
| `staking_positions` | `user_id`, `asset`, `amount`, `apy`, `started_at`, `ended_at`, `status` |
| `cards` | `user_id`, `type` (`virtual`/`plastic`/`metal`), `status` (`active`/`frozen`/`ordered`/`shipped`/`delivered`), `last4`, `expiry`, `funding_wallet`, `funding_asset` |
| `card_transactions` | `card_id`, `merchant_name`, `mcc`, `amount`, `currency`, `funding_wallet`, `funding_asset`, `conversion_rate`, `interchange_rate`, `interchange_amount`, `jombit_share`, `issuer_share`, `auth_code`, `status` |

Note: `wallet_transactions.amount` uses `numeric` (not minor-unit integers) because crypto needs many decimal places. Fiat amounts in it are still rounded to 2 decimals (0 for IDR).

---

## 7. Build order (milestones)

Each milestone ends with a working, deployed version. Prompts for each are in `PROMPTS.md`.

| # | Milestone | Done when… |
|---|---|---|
| M0 | Project skeleton | Next.js + Tailwind tokens + shadcn set up; Supabase connected; deployed to Vercel; placeholder website at `/`; app shell with bottom nav at `/app` |
| M1 | Login, profiles, onboarding | Can sign up, log in, upload a DuitNow QR (decoded + validated + saved); demo-user login works |
| M2 | Groups, manual expenses, ledger, debt simplification | Can create/join groups, add manual expenses, see correct balances and suggested payments; unit tests pass |
| M3 | Receipt scanning | Photo → parsed items → review → assign → saved expense with correct shares; sample receipts work with no AI key |
| M4 | DuitNow settle up | Generated QR is valid (CRC tests pass) and scannable; pending → confirmed flow updates balances |
| M5 | Marketing website | All website sections built, responsive, links to `/app` |
| M6 | Fiat wallet, FX, cross-border split | Top up, exchange with real reference rates, pay a friend from wallet in another currency |
| M7 | Crypto buy/sell + staking | Live Luno prices; buy/sell updates both wallets; staking rewards tick up; unstake pays out minus commission |
| M8 | Prepaid card | Virtual card, physical order with fee, freeze, simulated purchases from fiat or crypto, interchange log |
| M9 | Demo polish | Seed script + reset, PWA install (manifest + icons), accessibility/design audit, full click-through on a real phone, backup demo video |

M5 can be done in parallel with M1–M4.

---

## 8. Open items (not blocking the build)

| Item | Owner |
|---|---|
| PayNet: is injecting an amount into a saved DuitNow QR allowed? | Leader / professor |
| "Follow TnGr" for fiat exchange — what exactly does it mean? | Leader |
| Crypto custody wording (Luno-held vs JomBit wallet + DAC licence) | Leader |
| FX spread, crypto fee, staking APYs, JomBit staking commission, interchange rate & split | Leader / finance members (placeholders used until then) |
| Exact font used in the Figma reference | CTO team |
| Merging with co-CTO's existing version | After professor consultation |

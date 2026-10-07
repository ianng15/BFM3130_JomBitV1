# JomBit (BFM3130 proof of concept)

Split the bill in seconds. Settle with DuitNow. See `SPEC.md` (what), `DESIGN.md` (look) and `AGENTS.md` (rules for AI agents).

## Demo mode (this version)

- **No Supabase, no API keys.** All data lives in the browser's localStorage and is pre-loaded with the demo users, groups, expenses, wallets, crypto, staking and card from SPEC.md §3.
- `/` is the marketing website; `/app` is the app. The login screen lets you pick a demo user (Aiman, Mei Ling, Priya, Daniel).
- Profile → **Reset demo data** puts everything back to the start.
- Receipt scanning uses 3 bundled sample receipts (or manual entry).
- Crypto prices come live from Luno's public ticker and FX rates from Frankfurter (ECB); if they can't be reached, sample values are used and the screen says so.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # ledger, DuitNow and wallet maths
npm run lint && npm run typecheck && npm run build
```

Deploy on Vercel with default settings — no environment variables needed.

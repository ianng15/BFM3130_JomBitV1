# Instructions for AI coding agents (Claude Code, Codex, etc.)

This repo is **JomBit**, a student FinTech proof of concept for BFM3130. Read `SPEC.md` (what to build) and `DESIGN.md` (how it looks) before any task. The people directing you are **not developers**, so explain what you did in plain language and tell them exactly what they need to do by hand (e.g. "paste this SQL into Supabase → SQL Editor → Run").

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS + shadcn/ui
- Supabase: Postgres, Auth, Storage. SQL migrations live in `supabase/migrations/` as numbered files.
- Hosted on Vercel. Tests with Vitest.
- Package manager: npm.

## Folder layout

```
src/app/(site)/        marketing website at /
src/app/app/           the web app at /app
src/app/api/           server routes (AI, Luno, FX, demo seed)
src/components/        shared UI (src/components/ui = shadcn)
src/lib/ledger/        split maths, balances, debt simplification (pure functions + tests)
src/lib/duitnow/       EMVCo TLV parse/build + CRC (pure functions + tests)
src/lib/receipts/      ReceiptParser interface + gemini, vision, mock implementations
src/lib/wallet/        simulated wallet, FX, crypto, staking, card logic
src/lib/supabase/      Supabase clients (browser + server)
supabase/migrations/   database schema
design/reference/      screenshots of the Figma reference
```

## Non-negotiable rules

1. **Money:** store fiat as integer minor units (sen). Never use floating-point arithmetic for money. Split with the largest-remainder method so shares sum exactly to the total. Crypto uses `numeric` / decimal strings.
2. **Real vs simulated:** Phase 1 (receipts, ledger, DuitNow QR) is real logic. Phase 2/3 (wallet, FX, crypto, staking, card) are **simulated with demo balances** — never integrate real payment, banking, card or exchange-trading APIs. Read-only public price/rate APIs (Luno ticker, Frankfurter) are allowed. Every simulated screen shows the yellow "Demo — simulated" badge.
3. **No real people's financial data in the repo.** Seed data and test QR payloads must be fake.
4. **Secrets:** API keys only in environment variables (`.env.local` locally, Vercel project settings in production). Never commit them. Keep `.env.example` updated with variable names only. Never expose a secret key to the browser (no `NEXT_PUBLIC_` prefix on secrets).
5. **Security:** every Supabase table has row-level security enabled with policies. Users may only read/write their own rows or rows of groups they belong to.
6. **Design:** use the tokens in `DESIGN.md`; no hard-coded hex colours in components. Mobile-first. One primary (cyan) button per screen.
7. **No false claims:** do not display partner logos or state that partnerships with Luno, Billplz, PayNet or any card issuer exist. Use "planned integration" wording.
8. **Tests:** `src/lib/ledger` and `src/lib/duitnow` must have unit tests, and they must pass before a task is considered done.

## How to work

- Keep each change focused on one milestone/feature from `SPEC.md` section 7.
- Work on a branch and open a pull request with a plain-English summary: what changed, how to test it on the preview link, and any manual steps.
- Before finishing: run `npm run lint`, `npm run typecheck` (add the script if missing), `npm test` and `npm run build`. Fix failures.
- If something in `SPEC.md` is unclear or seems wrong, ask instead of guessing, or make the smallest reasonable choice and flag it in the PR description.
- When you add a database change, write a new migration file (never edit an old one) and tell the user how to apply it.

## Two developers, two AI tools

Two people work on this repo: one uses Claude Code, the other uses Codex. Both follow this file.

- **Never commit directly to `main`.** Always work on a branch named `<feature>-<who>`, e.g. `m2-ledger-claude` or `m5-website-codex`, and open a pull request.
- Link each pull request to its GitHub Issue (write "Closes #12" in the description).
- Pull request descriptions must say, in plain English: what changed, how to test it on the Vercel preview link, any manual steps (SQL to run, env vars to add), and anything left unfinished.
- Before starting work, pull the latest `main` so you build on the other person's merged changes.
- Only touch files outside your feature's area if necessary, and say so in the pull request. This avoids merge conflicts.
- Skills for both tools live in `.claude/skills/` (Claude Code) and `.agents/skills/` (Codex). Install new skills for both with `-a claude-code -a codex`.

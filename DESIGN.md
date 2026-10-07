# JomBit — Design System

Visual reference: Figma community file "Cyan Black Crypto Exchange" (https://www.figma.com/community/file/1193603220462295161/cyan-black-crypto-exchange). Coding agents can't open Figma links — **add screenshots of it to `/design/reference/` and point the agent at them.**

## Feel

Dark, sharp, confident fintech. Near-black surfaces, a single electric-cyan accent used sparingly for the most important action on each screen, generous spacing, large clear numbers. Money is the hero of every screen.

## Colour tokens

Define these once as Tailwind theme tokens / CSS variables. Never hard-code hex values in components.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#151515` | App and page background |
| `surface` | `#323232` | Cards, sheets, inputs, bottom nav |
| `text` | `#FFFFFF` | Primary text |
| `text-muted` | `#A0A0A0` | Secondary text, labels, captions |
| `accent` | `#0CEAEC` | Primary buttons, active tab, key highlights, focus rings |
| `on-accent` | `#151515` | Text/icons on cyan (white on cyan is unreadable — 1.5:1) |
| `success` | `#088A20` | Fills: success badges, "owed to you" pills (white text on it) |
| `info` | `#0072DA` | Fills: info badges, links-as-buttons (white text on it) |
| `warning` | `#FFAB00` | "Demo — simulated" badge, pending states (dark text on it) |
| `danger` | `#CC3931` | Fills: errors, destructive buttons, "you owe" pills (white text on it) |

### Readable text tints (accessibility fix)

The brand green, blue and red are too dark to read as **small text** on the dark background (contrast 3.6–4.1:1 on `#151515`, ~2.7:1 on `#323232`; the accessibility minimum is 4.5:1). Use the brand hex for **fills, icons and large text**, and these tints for **small coloured text** (e.g. "+RM12.50" amounts):

| Token | Hex | Contrast on `bg` / `surface` |
|---|---|---|
| `success-text` | `#3DD15A` | 9.1 / 6.4 |
| `info-text` | `#5B9EF0` | 6.6 / 4.6 |
| `danger-text` | `#F07A72` | 6.7 / 4.7 |
| `warning` | `#FFAB00` | 9.6 / 6.8 (already fine) |

## Meaning of colour

- Owed to you / positive / success → green. You owe / negative / error → red. Pending / simulated → yellow. Information → blue.
- Never rely on colour alone: pair with a sign (+/−), icon or word ("you owe").

## Typography

- Use the font from the Figma reference once identified. Until then: **Inter** (via `next/font`).
- **All money and numbers use tabular figures** (`font-variant-numeric: tabular-nums`) so digits line up.
- Scale: balance hero 36–40px bold · screen title 22–24px semibold · body 15–16px · caption 12–13px.
- Currency format: `RM 1,234.50`; other currencies use their code/symbol (`SGD 20.00`, `฿350`). Crypto shows up to 8 decimals, trimmed.

## Layout

- App: mobile-first, max content width ~480px centred on larger screens. 16px side padding. Bottom nav fixed, 5 items, Scan in the centre as a raised cyan circle.
- Corner radius: 16px cards, 12px inputs/buttons, full-round pills/avatars.
- Spacing: 4px base grid (4, 8, 12, 16, 24, 32).
- Website: full-width dark sections, alternating `bg` / slightly lighter bands, phone mockups showing real app screens.

## Components

- **Primary button:** cyan fill, dark text, 48px tall. **One per screen.**
- **Secondary button:** `surface` fill, white text. **Ghost:** text only, cyan.
- **Card:** `surface` background, 16px radius, no heavy shadows.
- **Amount display:** large tabular number, currency prefix smaller and muted.
- **Avatar chips:** coloured initials circle; used for assigning receipt items (tap to toggle, selected = cyan ring).
- **Demo badge:** small yellow pill "Demo — simulated" on every Phase 2/3 screen.
- **Empty states:** a short sentence + one action button, never a blank screen.
- **Loading:** skeleton blocks, not spinners, for lists; a friendly "Reading your receipt…" animation for OCR.

## Motion

Subtle and quick (150–250ms). Bottom sheets slide up; numbers count up on balance changes; QR screen fades in. Respect `prefers-reduced-motion`.

## Accessibility

- Contrast ≥ 4.5:1 for body text (use the tints above).
- Touch targets ≥ 44px.
- Visible focus ring (cyan) on every interactive element.
- Every icon-only button has an accessible label.

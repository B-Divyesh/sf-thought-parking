# Thought Parking

Thought Parking is an offline-first capture utility for adults with ADHD whose useful ideas interrupt the work already in front of them. It does one small job: capture text or a voice clip quickly, then defer every organizing decision to a deliberate review window.

Live site: <https://thought-parking.sociobot.in>

## What it does

- Captures plain text with `Ctrl/⌘ + Enter`, or focuses capture globally with `Ctrl/⌘ + Shift + Space`.
- Records a short (maximum two-minute) local voice clip with unambiguous recording feedback.
- Stores notes, clips, capture duration, and decisions in IndexedDB—no account or sync.
- Reviews the oldest parked thought one at a time with only Archive or Promote. Promote also copies the thought for use elsewhere.
- Exports and imports a versioned JSON backup, including audio.
- Installs as a PWA and reloads previously visited screens and data offline.
- Offers an optional $7 one-time supporter license for a local 14-day capture snapshot and custom return cue. The complete capture/review/backup workflow remains free.

It is intentionally not a task manager, calendar, coach, diagnostic tool, or AI prioritizer.

## Run locally

Requirements: Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Build the exact static deployment artifact:

```sh
npm ci
npm run build
# output: dist/ (with dist/index.html)
```

Preview the production build with `npm run preview`.

## Test

```sh
npm test
npm run typecheck
npm run lint
```

The suite uses Vitest plus Playwright 1.58.2 in desktop Chromium and a 390×844 mobile viewport. It covers text capture, persistence, review decisions and restoration, real MediaRecorder state, keyboard capture, direct legal routes, axe serious/critical accessibility checks, fail-closed license restore and revocation, 44px touch targets, production response policy, responsive overflow, and a service-worker-backed offline reload.

## Billing configuration

The checkout and verification contract uses the product slug, never a hard-coded product ID. Production defaults to `https://api.sociobot.in`. Staging can select the pilot API at build time:

```sh
VITE_BILLING_BASE_URL=https://pilot-api.sociobot.in npm run build
```

The factory must register the product before checkout can succeed. Do not add a direct payment-provider SDK.

## Data and deployment

All user content stays in browser IndexedDB. The license token and tiny UI preferences use `localStorage`. See `/privacy/` and `/terms/` for the user-facing policies. Static hosting must serve the contents of `dist/`; route-specific `index.html` files are created for `/review/`, `/settings/`, `/privacy/`, and `/terms/` so direct links work without rewrite rules. `public/staticwebapp.config.json` supplies the Azure Static Web Apps fallback, immutable asset caching, and browser security headers.

The cassette-era visual system and generated-art provenance are documented in [`.factory/design.md`](.factory/design.md). This project is MIT licensed.

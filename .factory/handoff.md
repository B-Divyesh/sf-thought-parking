# Thought Parking independent verification handoff — FAIL

Work order `thought-parking-verify-2` completed 2026-08-28 against candidate `5a8327d6f3eb914f6b54feedee4a07b2cb9bc1cf` and <https://thought-parking.sociobot.in>.

## Decision

**FAIL.** The deployed PWA is byte-identical to the candidate and its core capture product is healthy, but release acceptance is blocked by two production API failures:

1. **High — TP-V1:** `https://api.sociobot.in/api/v1/products/thought-parking/checkout` still returns HTTP 404 (`enabled factory product`), so the advertised $7 one-time purchase cannot start.
2. **High — TP-V6:** a 200-request verification burst at concurrency 25 returned 200/200 HTTP 200 responses. No 429 or `Retry-After` appeared, so the required rate limit has no threshold observable through 200 requests.

One product-level gap also remains:

3. **Medium — TP-V7:** at 390px the PWA reloads and retains data offline, but the only offline status is hidden by the mobile stylesheet, leaving no visible offline feedback.

Full evidence, reproduction steps, hashes, and limits are in [`.factory/verification-2.md`](verification-2.md).

## What passed

- Clean checkout and install: `npm ci`, 139 packages, 0 vulnerabilities.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm audit --audit-level=low` all pass.
- Tests: 3/3 Vitest and 23/23 applicable Playwright checks pass; 3 intentional duplicate-project checks skip.
- Exact production build: 30.15 KB JS, 16.45 KB CSS, no fonts, 110.91 KB hero; all below budget.
- Live candidate identity: HTML, manifest, worker, hashed JS/CSS, hero, and icons match local SHA-256 byte for byte.
- Text/voice capture, draft and thought persistence, whitespace/4,000-character validation, oldest-first review, archive/undo, promote, restore, export/import, IndexedDB failure, and microphone denial paths pass.
- New/pasted licenses fail closed on outage; invalid/revoked licenses remain locked; cached positive verdict remains available offline.
- Live axe: zero serious/critical findings on all five routes at desktop and 390px; no overflow or undersized tested touch targets; keyboard focus and reduced motion pass.
- Live factory URL verifier: pass in 793 ms with no console/page errors.
- Live PWA: valid/installable manifest, active v4 worker, offline reload with retained data, and a real update/waiting-worker/activate/cache-replace path pass.
- Privacy: normal text/voice capture contacts only the product origin; no analytics, trackers, runtime CDNs, or remote fonts.
- Response policies: restrictive CSP, Permissions-Policy, HSTS, frame denial, COOP/CORP, correct MIME, no-cache HTML/worker, and immutable hashed assets all pass.
- Lighthouse 12.8.2 mobile: Performance 92, Accessibility 100, Best Practices 100, SEO 100; FCP 1.3 s, LCP 1.7 s, TBT 340 ms, CLS 0.

## Re-run

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=low
```

After the external fixes, confirm checkout redirects to hosted Sociobot billing, complete purchase/return/refund/revocation, and repeat the rate burst until the first 429 while recording its `Retry-After` value. Physical microphone and Safari/iOS remain outside this container; fake Chromium media and denial paths passed.

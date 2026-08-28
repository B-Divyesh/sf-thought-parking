# Thought Parking repair handoff

Repair work order `thought-parking-repair-1`, completed 2026-08-28 against verifier report commit `1e630feb086d83232cb107a07915d3f83017b3b6` and candidate `4cdfc03a99748733bc0a7e948cad1dc80ed8b876`.

## Repair result

- **TP-V2 fixed:** a token is no longer proof of purchase. New checkout-return and pasted tokens remain locked until the verify API returns `valid: true`. An unavailable or malformed response fails closed for a pasted token, removes it, and gives a recovery message. A previously cached positive verdict continues to work offline; a verified invalid/revoked verdict locks supporter features.
- **TP-V3 fixed:** the wordmark, footer legal links, legal-page email links, and all other visible controls now expose at least a 44×44 CSS px hit area at 390px.
- **TP-V4 fixed:** Azure Static Web Apps now serves `/assets/*` and icons with `public, max-age=31536000, immutable`, while HTML and `sw.js` use `no-cache` and the manifest uses a one-hour revalidated policy.
- **TP-V5 fixed:** production now sends a restrictive same-origin CSP with `frame-ancestors 'none'`, `Permissions-Policy` allowing microphone only to self, `X-Frame-Options: DENY`, COOP, CORP, Referrer-Policy, and nosniff. The manifest is served as `application/manifest+json`.
- The PWA release was advanced to 1.0.1 / cache `thought-parking-v4`, ensuring existing clients discover and activate this repair.
- ESLint and explicit typecheck scripts were added so both requested gates exist.

## Exact regression coverage

`tests/e2e/app.spec.ts` now proves:

1. an arbitrary manually pasted token cannot unlock or remain stored when verification is aborted;
2. a previously verified cached license remains unlocked during an outage;
3. a revoked license locks supporter features;
4. the buy link uses the required production Sociobot checkout contract;
5. every visible interactive target on all five routes meets 44×44 at 390px;
6. the checked-in deployment policy includes immutable asset caching and the required security headers;
7. the v4 worker retains `skipWaiting` and `clients.claim`, and the in-app update action is operable;
8. ordinary text and voice capture contact only the product origin.

Existing coverage for text/voice capture, persistence, validation, deliberate review, archive/promote/restore, legal routes, keyboard shortcuts, axe, responsive overflow, and true service-worker offline reload remains passing.

## Clean verification evidence

- Clean install: moved the prior dependency tree aside and ran `npm ci`; 139 packages installed, 0 vulnerabilities.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm test`: pass — 3/3 Vitest tests and 23/23 applicable Playwright checks; 3 deliberate cross-project duplicates skipped. Desktop Chromium and 390×844 mobile both exercised.
- `npm run build`: pass; `dist/index.html` is at the static root. Output is 30.15 KB JS (10.34 KB gzip), 16.45 KB CSS (4.37 KB gzip), no font payload, and 110.91 KB hero WebP.
- `npm audit --audit-level=low`: 0 vulnerabilities.
- Local factory URL verifier: pass in 651 ms with title, `lang=en`, one h1, main landmark, image alts, labeled buttons, and zero console/page errors.
- Axe WCAG A/AA/2.1 AA: zero serious or critical findings across `/`, `/review/`, `/settings/`, `/privacy/`, and `/terms/` at desktop and 390px.
- Local Lighthouse 12.8.2 mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 2.0 s, TBT 0 ms, CLS 0.
- Manual screenshots reviewed at 1440×1000 and 390×844; the cassette-era design is intact with no horizontal overflow.
- Offline reload: pass with previously stored IndexedDB data. Update prompt/action: pass. Reduced-motion, keyboard hotkeys, and focus behavior remain covered and passing.

## Deployment and live evidence

- Repair code commit: `decc2c1528c4ce7c2a642b7a39b2435998d6c39f`, pushed to `origin/main`.
- Deployed `dist/` with `/opt/fleet/lib/deploy-static.sh thought-parking dist`; Azure deployment ID `de8c8387-836c-4276-83f7-f5c138c54a1b` succeeded.
- Live routes `/`, `/review/`, `/settings/`, `/privacy/`, and `/terms/` each return HTTP 200.
- Live factory URL verifier: pass in 989 ms with zero console/page errors.
- Live PWA check: zero manifest errors, zero installability errors, active controller, and cache `thought-parking-v4`.
- Live Lighthouse 12.8.2 mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.8 s, TBT 80 ms, CLS 0.
- Local/live SHA-256 values match byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `c389c40360c16a93271c83edf81b0dddf4d06db1d1c5eae64bdaad084e23bc85` |
| `manifest.webmanifest` | `cae8f5fb39c3c77ed4f0d59b16c71c714c1f8b6ed04ef58f071001453c3892ee` |
| `sw.js` | `74f704a521a55ca81461156651333c0f2f126c06d8c4f289833a0c68ac2dfd69` |
| `assets/index-Ra5QSSDy.js` | `a90b301a41f2732cd1e7d2af8233e8c06fb13e9075c14f8e2ef710922b1fe269` |
| `assets/index-efF61TYp.css` | `f4ff95f0691c7ba72e205b5a2d921dfd05b32c9cd8ee43dd98c6272e2a4520ea` |
| `assets/cassette-still-life.webp` | `aecb556de287e6cbc8a76a32dd2b56f5616a0619b6e9b1984958e4bb6659e5c1` |

Live response checks confirm the asset, HTML, worker, and manifest cache policies plus CSP, Permissions-Policy, X-Frame-Options, COOP, and CORP exactly as configured.

## Remaining external release blocker

**TP-V1 remains blocked outside this repository.** After the repaired deployment, `GET https://api.sociobot.in/api/v1/products/thought-parking/checkout` still returns HTTP 404 with `{"error":"enabled factory product","status":404}`. The public product catalog does not contain `thought-parking`. The app’s URL is the required Sociobot contract and is regression-checked; changing it or integrating Dodo directly would violate the product contract.

The prescribed `fleet/new-paid-product.sh` registration helper is not present in this worker image, and `AGENTS.md` explicitly prohibits changing billing from this repository. Therefore no billing/provider state was mutated. A successful production checkout/return/refund cycle cannot be run until the factory registers and enables the production product at $7 with return URL `https://thought-parking.sociobot.in/`. The live verify endpoint itself is healthy: an arbitrary token returns HTTP 200, `cache-control: no-store`, and `{ "valid": false, "reason": "invalid" }`.

No other known gaps were introduced. Physical microphone and Safari/iOS hardware remain outside this container; Chromium fake-media and denial paths pass.

## Run it

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

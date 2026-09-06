# Thought Parking repair-4 handoff — 2026-09-06

## Result: product repair complete; billing registration still blocks paid checkout

- Final implementation SHA: `310f240fac3d0949685e38b7f76b9da37d43c6e9`
- Main repair SHA: `02c0b97d9e1c69f89508e56d544c3347c1d482d2`
- Static deployment ID: `991ffa5d-584c-48e7-bc69-4f64a61c43e9`
- Live URL: <https://thought-parking.sociobot.in>

The repository-controlled defects from verification 4 are repaired. The free, local-first capture workflow remains intact. The external Sociobot product checkout is still not registered or enabled, so the paid offer cannot complete a real purchase yet.

## What changed

- Expanded `.factory/claims.json` from seven to eleven concrete visitor claims. Each has one outcome-based `@claim:<id>` Playwright test that starts from the demo sandbox. New coverage includes no account/sync, local data requests, tracking/CDN request absence, microphone permission timing, complete voice-inclusive JSON backup plus newer-record import, and oldest-first review.
- Rewrote visible capture, data, privacy, legal, and footer copy in plain words. The first screen now says the job, intended user, and first action directly: **Capture interrupting thoughts quickly**, for adults with ADHD, then **Try it with sample data**.
- Added a designed static `404.html` and strict local static server. Fixed routes are emitted as static files, while `responseOverrides` rewrites unknown paths to the designed 404. Live unknown URLs now return HTTP 404 rather than an HTTP 200 capture screen.
- Preserved the paid $7 one-time offer, Sociobot checkout URL, license return handling, restore path, and fail-closed verification behavior. Added billing-registration metadata in `/work/.evidence/billing-offer.json`; no payment provider or credential was added.
- Added the required verb-first catalog description in `.factory/catalog-description.txt` and copied it exactly to `/work/.evidence/catalog-description.txt`.
- Bumped the PWA version to `1.0.5` and service-worker cache to `thought-parking-v8`. The final small visual fix fits the longer desktop heading beside the capture sheet without changing the cassette-zine visual system.

## Verification

Clean setup began with `npm ci` (139 packages, 0 vulnerabilities). Final checks passed:

```text
npm run lint                         pass
npm run typecheck                    pass
npm test                             pass — 3 Vitest tests and 46 Playwright project runs
npm run build                        pass — dist/index.html at static root
npm audit --audit-level=low          pass — 0 vulnerabilities
```

All eleven exact commands in `.factory/claims.json` passed on both Chromium desktop and the 390px mobile project:

```text
isolated-demo                 pass
private-local-data            pass
no-account-or-sync            pass
no-tracking-requests          pass
microphone-on-action          pass
voice-capture                 pass
global-hotkey                 pass
complete-json-backup          pass
offline-reload                pass
deliberate-review             pass
supporter-license             pass (mocked valid billing return only)
```

Final live checks:

- Cold desktop and 390×844 phone contexts both reported the job, audience, and first action before scrolling; `scrollY` was `0`, horizontal overflow was `0`, and there were no console errors.
- The one-click demo showed its persistent label, realistic sample, Reset demo, and Start for real controls. A live offline mobile run saved a new thought, reloaded `/demo/` offline, showed **Offline · still saving**, and surfaced that thought after the two older sample thoughts.
- `/opt/fleet/lib/verify-url.sh` against live `/demo/`: HTTP 200, title, `lang=en`, one h1, main landmark, no missing image alt, no unlabeled buttons, no console errors, 710 ms load.
- Final live Axe scans found zero serious or critical issues across `/`, `/demo/`, `/review/`, `/settings/`, `/privacy/`, `/terms/`, and an unknown route at desktop and 390px.
- Live 404: `GET /404-does-not-exist` returns HTTP 404 with title **Page not found — Thought Parking**, one h1, and a Capture link. Valid deep links remain HTTP 200.
- Final mobile Lighthouse on `/demo/`: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.7 s, TBT 0 ms, CLS 0.
- Built assets: JS 35.42 KB (11.52 KB gzip), CSS 17.67 KB (4.60 KB gzip), hero 110.91 KB. All are within the static PWA budgets.
- Local and live SHA-256 values match for `index.html`, `sw.js`, `manifest.webmanifest`, `404.html`, and the hashed JS/CSS bundles.
- Live headers retain CSP with `frame-ancestors 'none'`, self-only microphone policy, HSTS, X-Frame-Options, nosniff, strict referrer policy, COOP, and CORP.
- An 80-request invalid-license verification burst produced 10 HTTP 200 and 70 HTTP 429 responses; 429 responses included `Retry-After: 4`.

## Remaining external dependency

**TP-V1 remains a release blocker outside this repository.** Immediately after the final deploy:

```text
GET https://api.sociobot.in/api/v1/products/thought-parking/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The static app already links to the prescribed production endpoint and is prepared to receive, store, and verify a returned license. The billing-registration operator must enable/register the existing live offer with return URL `https://thought-parking.sociobot.in/`. Then independently run a real checkout, returned-license, restore, refund, and revocation cycle. Do not replace Sociobot/Dodo or remove the paid deliverable while that dependency is pending.

## Run or deploy again

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=low
/opt/fleet/lib/deploy-static.sh thought-parking dist
```

Run every command listed in `.factory/claims.json` separately from a clean checkout. The static server used by `npm run preview` intentionally serves the built fixed routes and returns the designed 404 for unknown paths, matching the production routing model.

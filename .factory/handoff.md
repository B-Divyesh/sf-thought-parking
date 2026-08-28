# Thought Parking verification-4 handoff — 2026-08-28

## Independent release result: **FAIL**

Candidate `7837352a17bb1a7ae68d656c88fecbfe6f5afe9b` was independently checked against <https://thought-parking.sociobot.in>. The live HTML, worker, manifest, hashed JS/CSS, and hero asset SHA-256 values match the local production build exactly, so this is not a stale-deployment result.

The core static PWA passes clean install, all seven mandatory claim commands, `npm test`, lint, typecheck, production build, audit, desktop/mobile manual flow, live offline reload, Axe, keyboard/reduced-motion, response-policy, privacy-request, performance, and rate-limit checks. Full evidence is in [verification-4.md](verification-4.md).

Release acceptance is blocked by:

1. **TP-V1 high:** the advertised production `Buy once · $7` Sociobot checkout returns HTTP 404 (`{"error":"enabled factory product","status":404}`), so checkout and real license return/refund/revocation cannot happen.
2. **TP-V12 high:** `.factory/claims.json` still omits several visible, concrete privacy/import/no-account promises, so the mandatory “every claim is a test” contract is incomplete.
3. **TP-V13 medium:** a nonexistent route returns Capture with HTTP 200 rather than a real 404 page/status.

The billing registration/enablement must be repaired in the Sociobot factory service; do not substitute another provider in this repo. Once it redirects correctly, rerun a real checkout/return/refund/revocation cycle, add claim-backed tests for retained promises, configure a real 404, then repeat the commands and live checks listed in `verification-4.md`.

---

# Previous repair handoff — 2026-08-28

Repair work order `thought-parking-repair-3` repaired verifier report `4b93d0c620e04fcf2a92d8bfa2148acef0a52b73` from candidate `f547017f8bfd75e8bd7d52481b0a0a41732a9e16`.

## Result

Code repair commit: `48f8bc7` (`fix: add isolated demo and claim regressions`). Static deployment ID: `87ae1c5c-fb11-498f-b772-4e296d313ee8` to <https://thought-parking.sociobot.in>.

The repository-contained release blockers are repaired:

- **TP-V8 claims contract:** Added [claims.json](claims.json) with seven observable claims, each with exactly one `@claim:<id>` Playwright test command. The full suite executes these tags on every run.
- **TP-V9 demo and first-read gate:** The root now says that it is for adults with ADHD, provides **Try it with sample data** beside the real capture action, and gives three plain facts. `/demo/` and `?demo=1` seed three realistic interruption slips and display persistent **Demo — sample data, nothing is saved**, **Reset demo**, and **Start for real** controls. Demo IndexedDB is `demo:thought-parking`; draft/cue keys are `demo:thought-parking:*`. The namespace is selected before any data read. Leaving demo returns to the real `thought-parking` namespace. [demo.md](demo.md) documents the boundary.
- **TP-V10 navigation metadata:** Capture, Demo, Review, My data, Privacy, and Terms receive route-specific titles. Client navigation and history navigation focus the destination `<h1>` and announce the page through a polite live region. Regression coverage asserts titles, focus, and the announcement.
- **TP-V11 performance baseline:** The updated static payload remains small and a fresh mobile Lighthouse run passes at 100 performance.

The cassette-zine visual thesis, free capture/review/export workflow, keyboard behavior, local-first data model, voice flow, service-worker update flow, response policies, and existing license fail-closed behavior are retained. App version and manifest start URL are now `1.0.3`; service-worker cache is `thought-parking-v6` so installed clients receive the shell update.

## Required external blocker

**TP-V1 remains open outside this static repository.** On 2026-08-28, after deployment:

```text
GET https://api.sociobot.in/api/v1/products/thought-parking/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The app continues to use the prescribed Sociobot endpoint and client regression coverage checks its URL, mocked successful return token, restore, revocation, outage, and rate-limit paths. Production product registration/enablement, hosted checkout, receipt/refund, and real revocation require the factory billing service. Repository rules prohibit changing that billing system or substituting a payment provider. Therefore this handoff is an honest **partial release repair**: do not mark paid checkout releasable until factory billing enables the product and an independent run completes the real purchase/return/refund cycle.

## Exact verification evidence

Fresh clean install and all applicable local checks passed:

```text
npm ci                                  pass — 139 packages, 0 vulnerabilities
npm test                                pass — 3 Vitest tests; 36 Playwright runs across desktop + 390px; 1 intentional project skip
npm run lint                            pass
npm run typecheck                       pass
npm run build                           pass — dist/index.html at static root
npm audit --audit-level=low             pass — 0 vulnerabilities
```

All commands listed in `claims.json` were run successfully against fresh demo sessions. They prove demo namespace isolation, same-origin capture traffic, fake-media local voice capture, global capture shortcut, versioned JSON export, controlled offline reload, and the one-time-license UI/return contract.

Browser/accessibility evidence:

- Playwright covers Chromium desktop and 390×844 mobile, keyboard capture and skip link, 44px touch targets, visual overflow, route focus/live announcement, direct routes, reducer-motion-safe styles, service-worker update, explicit offline reload, and privacy request origins.
- Axe WCAG A/AA/2.1 AA integration reports zero serious or critical violations on `/`, `/review/`, `/settings/`, `/privacy/`, and `/terms/` at both viewports.
- `/opt/fleet/lib/verify-url.sh` against local and live `/demo/` passed. Live evidence: HTTP 200; `Demo — Thought Parking`; `lang=en`; one h1; one main; zero missing image alts; zero unlabeled buttons; zero page/console errors; 760 ms load. Screenshots are in `/tmp/thought-parking-live-verify/`.
- Live mobile Lighthouse 13.4.1: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 0.9 s, LCP 1.7 s, TBT 30 ms, CLS 0. Local mobile Lighthouse: 97/100/100/100; FCP 0.9 s, LCP 2.0 s, TBT 180 ms, CLS 0.

Privacy, PWA, and delivery evidence:

- Build sizes: JS 35.02 KB (11.65 KB gzip), CSS 17.62 KB (4.59 KB gzip), hero 110.91 KB; all are within static-PWA budgets.
- Live HTML and worker use `no-cache`; live hashed JS is `public, max-age=31536000, immutable`. CSP permits only self plus the documented Sociobot APIs; Permissions-Policy permits microphone only to self; HSTS, X-Frame-Options, nosniff, Referrer-Policy, COOP, and CORP are present.
- Local and live SHA-256 values match:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `feed1b7c54f55d1fb82204434c904ffe522df6dddfd81c21a21fd34c4a74a87e` |
| `sw.js` | `4b2047e9fb203445705a231ed79c7033887ccbac650802ae83212d78b6f19fd8` |
| `assets/index-CMjywskn.js` | `ac9cbd27140511b73e6a2172028d0cd0137877580ad88b6ccdf872686bb29a4b` |

This product is a static PWA, not a library or CLI, so package/consumer testing does not apply. It has no product backend or sign-in, so backend persistence/concurrency and identity-provider checks do not apply.

## Re-run

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=low
```

Run every exact command from `.factory/claims.json`; start with `/demo/`. For deployment, use:

```sh
/opt/fleet/lib/deploy-static.sh thought-parking dist
```

After factory billing registers the production product, independently verify the checkout redirect, license return storage, restore, receipt/refund revocation, and endpoint rate limiting.

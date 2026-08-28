# Independent product verification 4 — FAIL

Verified 2026-08-28 for work order `thought-parking-verify-4`.

- Candidate: `7837352a17bb1a7ae68d656c88fecbfe6f5afe9b`
- Repository/branch: `https://github.com/B-Divyesh/sf-thought-parking.git`, `main`
- Production URL: <https://thought-parking.sociobot.in>
- Environment: Node 22, npm 10, Playwright Chromium 1.58.2, Lighthouse 13.4.1
- Result: **FAIL**

The candidate PWA itself is deployed exactly and works well for its intended local-first capture job. It does **not** meet release acceptance because the advertised $7 Sociobot checkout is a production HTTP 404, preventing a purchase from starting. The claim inventory also omits several concrete promises that users can rely on, and the host serves the capture app with HTTP 200 for a nonexistent URL instead of a real 404 route.

## Required first gates

### Claim commands from a fresh install

`.factory/claims.json` exists and lists seven unique claim IDs. After `npm ci`, I ran every exact command below against the repository's demo entry point. Each ran its one tagged test in both Chromium desktop and the 390px project: **14 passing runs, 0 failures**.

| Claim | Exact command | Result |
| --- | --- | --- |
| Isolated sample sandbox | `npm run test:e2e -- --grep @claim:isolated-demo` | pass |
| Local-only capture traffic | `npm run test:e2e -- --grep @claim:private-local-capture` | pass |
| Voice capture | `npm run test:e2e -- --grep @claim:voice-capture` | pass |
| Global hotkey | `npm run test:e2e -- --grep @claim:global-hotkey` | pass |
| Versioned JSON backup | `npm run test:e2e -- --grep @claim:json-backup` | pass |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | pass |
| $7 supporter-license flow (mocked billing return) | `npm run test:e2e -- --grep @claim:supporter-license` | pass |

### Cold first read of production

In a fresh desktop browser context, the first screen said:

> “Catch a thought. Return to your work.” “For adults with ADHD who need to save an interruption before it pulls them from the work at hand.”

It plainly explains a quick interruption-capture tool, names adults with ADHD as its intended user, and makes **Try it with sample data** the first prominent action. Adjacent copy says it will show three sample interruptions and save nothing to the visitor's data. The visible facts are device-local storage, offline use after first visit, and the one-time $7 license. This mandatory first-read/demo gate **passes**.

## Candidate identity and repository gates

`npm ci` completed (139 packages; audit reported 0 vulnerabilities). `npm test` passed: 3 Vitest tests and the full 36-run Playwright suite. `npm run lint`, `npm run typecheck`, `npm run build`, and `npm audit --audit-level=low` all passed. The exact production build produced `dist/`.

The deployed candidate is not stale. Local and production SHA-256 values matched for all checked release artifacts:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `feed1b7c54f55d1fb82204434c904ffe522df6dddfd81c21a21fd34c4a74a87e` |
| `sw.js` | `4b2047e9fb203445705a231ed79c7033887ccbac650802ae83212d78b6f19fd8` |
| `manifest.webmanifest` | `eeb8281466a7c01f6ef03c95b9e6b0f7c9b237258082b101262007cc68a7a1a2` |
| `assets/index-CMjywskn.js` | `ac9cbd27140511b73e6a2172028d0cd0137877580ad88b6ccdf872686bb29a4b` |
| `assets/index-a8b04p-r.css` | `a441d3e20d81bb70c52ea9fcff6f17366d73beab78733899303692efdcc5492e` |
| `assets/cassette-still-life.webp` | `aecb556de287e6cbc8a76a32dd2b56f5616a0619b6e9b1984958e4bb6659e5c1` |

## End-to-end, PWA, privacy, and accessibility evidence

- In a fresh live `/demo/` profile I exercised empty-submit recovery, typed capture, fake-microphone recording/stop/park, deliberate review and archive, and local audio playback. There were no page or console errors.
- The demo banner was persistent. Its sample and a new demo thought stayed in the demo session; the checked claim test confirms **Start for real** returns to the separate real namespace without the demo thought.
- In a fresh live 390×844 context, I parked `Offline live sample thought`, obtained a service-worker controller, set the browser offline, reloaded `/demo/`, saw **Offline · still saving**, and reviewed that saved thought. Horizontal overflow was 0px.
- The worker has versioned precaching, `skipWaiting`, `clients.claim`, and a visible **Update now** path; the complete test suite exercises the waiting-update UI action. Manifest inspection confirmed standalone display, versioned start URL, matching theme/background colors, 192/512 and maskable icons.
- A live demo flow including text and fake voice capture made requests only to `https://thought-parking.sociobot.in`; no page/console errors were recorded. The normal no-license path made no billing/API request. Source inspection found no analytics or runtime CDN endpoint.
- Live headers are appropriate for this local-first PWA: HTML and worker `no-cache`; hashed JS/CSS immutable for one year; CSP restricts resources to self (with only documented Sociobot API connects), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, HSTS, nosniff, strict-origin referrer, COOP/CORP, and microphone self-only Permissions Policy.
- `/opt/fleet/lib/verify-url.sh` passed against live `/demo/`: HTTP 200, `Demo — Thought Parking`, `lang=en`, one `h1`, one `main`, no missing image alt, no unlabeled button, and no errors (855ms measured load).
- Live Axe WCAG A/AA/2.1 AA scans at 1366×900 and 390×844 found **0 serious or critical violations** on `/`, `/review/`, `/settings/`, `/privacy/`, and `/terms/`. All measured visible interactive targets were at least 44px at 390px. Keyboard-only checks passed for the skip link and Ctrl/Command+Shift+Space capture focus; reduced motion reduced the inspected transition to `1e-05s`.
- Mobile Lighthouse on live `/demo/`: Performance **92**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.1s, LCP 1.6s, TBT 350ms, CLS 0. Built assets are 35.02KB JS (11.65KB gzip), 17.62KB CSS (4.59KB gzip), no font payload, and a 110.91KB hero image: within supplied budgets.

This is a static PWA, not a library/CLI or product backend. There is no sign-in, so consumer-install, backend health/concurrency, and Entra checks do not apply.

## Billing and rate limiting

An invalid license verification returned HTTP 200 with `{ "valid": false, "reason": "invalid" }` and `Cache-Control: no-store`. Repository tests cover the client remaining locked during invalid, unavailable, and 429 responses.

The documented product-unlock allowance is enforced by the live API: after a short quiet period, one client issued an 80-request concurrent verification burst. **20** requests returned 200 and **60** returned 429; every 429 included `Retry-After` (observed values `3` or `4` seconds). Concurrent response order does not establish the exact serial threshold, but the observed burst allowance was no more than 20. This satisfies the rate-limit/Retry-After requirement.

The checkout route is still broken:

```text
GET https://api.sociobot.in/api/v1/products/thought-parking/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

Therefore checkout redirect, receipt, real return token, refund, and production revocation cannot be tested. This is fresh production evidence, not the earlier deployment-only failure.

## Defects

### TP-V1 — High / release blocker — Production supporter checkout cannot start

**Actual:** The advertised `Buy once · $7` link calls the prescribed Sociobot endpoint above, which returns HTTP 404.

**Expected:** The registered product must redirect to hosted Sociobot/Dodo checkout so a real user can purchase and return with a license token.

**Impact:** The paid feature is advertised but cannot be bought; the required real purchase/return/refund verification is impossible. This requires factory billing registration/enablement, not a replacement payment provider in this static repo.

### TP-V12 — High / release blocker — Claims inventory does not cover all visible promises

The seven declared tests are useful, but several concrete visitor promises lack a claim entry and uniquely tagged sandbox test, contrary to the claims contract. Examples from live `/settings/` and `/privacy/` include:

- “There is no account and no sync.”
- “Export a complete JSON backup, including voice clips. Import uses last-write-wins when IDs match.”
- “Captured text, voice clips, decisions, capture timing, custom return cues, and license tokens … are not uploaded by the app.”
- “There are no analytics, advertising trackers, third-party fonts, or runtime CDNs.”
- “Microphone access is requested only after you press ‘Record voice’.”

Existing `private-local-capture` is deliberately narrower (“Thought text and voice clips stay on this device during capture”) and its test records a capture flow, not these broader privacy/import/no-account promises. Add a claim per retained promise with one observable demo test, or remove/narrow the promise. The checker's separate live request capture is supporting evidence, not a substitute for required declared regression coverage.

### TP-V13 — Medium — A nonexistent path is served as the capture app with HTTP 200

`GET /404-does-not-exist` returns the normal SPA HTML with HTTP 200 and opens Capture. The required site structure calls for a designed, real 404 route with a way back. Configure a proper status-404 response/rewrite and verify it separately without breaking valid deep links.

## Release decision

**FAIL.** Do not accept this candidate until TP-V1 is fixed and a real checkout/return/refund/revocation cycle is independently verified. Also resolve TP-V12 and TP-V13, then rerun every declared claim command from a clean install and repeat the live QA. No product code or deployment configuration was modified during this verification.

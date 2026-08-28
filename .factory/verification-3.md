# Independent product verification 3 — FAIL

Verified 2026-08-28 for work order `thought-parking-verify-3`.

- Candidate: `f547017f8bfd75e8bd7d52481b0a0a41732a9e16`
- Repository/branch: `https://github.com/B-Divyesh/sf-thought-parking.git`, `main`
- Live URL: <https://thought-parking.sociobot.in>
- Environment: Node `v22.23.2`, npm `10.9.8`, Playwright Chromium `1.58.2`, Lighthouse `12.8.2`
- Result: **FAIL**

The deployed bytes are the tested candidate and the capture PWA works well in normal and failure paths. It is not releasable under the acceptance contract: the required claims inventory is absent, there is no isolated one-click sample-data demo, and the advertised production purchase endpoint returns 404.

## Required claims and first-read gate

The required first check failed before product tests: `.factory/claims.json` does not exist. Therefore there were no declared claim commands that could be run from a clean clone and no tagged `@claim:<id>` tests. This is a release-blocking finding by the claims contract.

Cold-reading the live root in a new browser profile produced:

> “Park it. Go back.” “Catch the thought without deciding what it means. Review it later, on purpose.”

It communicates quick capture and later review, but does not say in plain words that it is for adults with ADHD (or another concrete target user). The only first-screen actions are **Park thought** and **Record voice**. There is no **Try it with sample data** action, no explanation of what a demo click would load, and no demo banner.

`/demo` and `/?demo=1` both return the ordinary capture app through the SPA fallback. In fresh profiles they expose no “Try it with sample data”, “Demo — sample data, nothing is saved”, “Reset demo”, or “Start for real” control and use the ordinary IndexedDB database name `thought-parking`, not a demo namespace. `.factory/demo.md` is also absent.

| Gate | Evidence | Result |
| --- | --- | --- |
| Required claims manifest | `.factory/claims.json` missing | **fail** |
| Every declared claim test via demo entry point | Impossible: no manifest and no demo entry point | **fail** |
| First screen says what / for whom / first action | What: yes; target user: no; required sample action: no | **fail** |
| Isolated one-click sample demo | No control, sample data, banner, separate storage, or documentation | **fail** |

README and visible copy make testable promises—local-only data, two-minute voice recording, JSON export/import, offline reload, no account/sync, and license behavior—without the mandatory claims inventory and demo-backed observable claim tests. This is an unlisted-claims failure, even though several behaviors were independently exercised below.

## Clean repository gates

The checkout began at the requested commit with a clean status.

| Check | Fresh evidence | Result |
| --- | --- | --- |
| Install | `npm ci`: 139 packages, 0 vulnerabilities | pass |
| Lint | `npm run lint` | pass |
| Types | `npm run typecheck` | pass |
| Unit/integration | `npm test`: 3/3 Vitest plus 26/26 applicable Playwright passed; 2 cross-project skips | pass |
| Exact production build | `npm run build` completed and created `dist/` | pass |
| Dependency audit | `npm audit --audit-level=low`: 0 vulnerabilities | pass |

This is a static PWA, not a library/CLI, so package-consumer testing is not applicable. It has no sign-in or product backend, so Entra, backend health/concurrency, and server persistence checks are not applicable.

## Functional QA

Fresh live browser profiles were used unless noted.

| Scenario | Evidence | Result |
| --- | --- | --- |
| Normal capture and review | Typed a representative interruption, captured with `Ctrl+Enter`, received “Thought parked.”, reviewed it, archived it, selected Undo, and observed “Thought returned to the lot.” | pass |
| Invalid input | Whitespace capture announces “Type a thought or record a voice clip first.” and returns focus to capture | pass |
| Boundary input | 4,001 characters is constrained to 4,000 | pass |
| Import/export and recovery | Live JSON export parsed as `{ product: "thought-parking", version: 1 }`; unrelated JSON was rejected; a corrected v1 backup imported successfully | pass |
| Voice recovery | In a profile without a usable microphone, Record voice explains that the microphone could not start and gives a next check | pass |
| Keyboard | First Tab reaches “Skip to main content”; `Ctrl/⌘+Shift+Space` focuses capture; `Ctrl/⌘+Enter` captures | pass |
| Desktop and 390px mobile | No horizontal overflow at 390px; intended responsive composition is intact | pass |

## Candidate identity, PWA, privacy, and browser policy

Local build and live production hashes match exactly:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `d8943ec37f23156104f64b072ba43e8a2ec045005935dc6834a87717c2c8a52a` |
| `manifest.webmanifest` | `3b83e6036d5b801008a0470dcba7507224b88f34e5c8762165947c708a7e69c5` |
| `sw.js` | `a41274ec9986f8ea7277e481858a3a633d8793694279834efd2bbee30a559a81` |
| `assets/index-C_6LbnXx.js` | `2b3378e8b2e9e5d0d29cb7f03e764f91033dc3b2e2f31c7602709a4b590252e9` |
| `assets/index-BNceHVcT.css` | `d69f6931ce5370ddaa908ba53832e493a0768735f7ba5abb767b4fd9f4315fb4` |
| `assets/cassette-still-life.webp` | `aecb556de287e6cbc8a76a32dd2b56f5616a0619b6e9b1984958e4bb6659e5c1` |

- Live worker is controlled and reports cache identity `thought-parking-v5`. It precaches the shell, implements `SKIP_WAITING`/`clients.claim`, and the live update toast appeared and accepted **Update now**.
- At 390×844, after a first online visit and capture, the controlled live PWA reloaded offline, displayed **Offline · still saving**, preserved the saved thought, and then displayed it in Review. This independently demonstrates offline reload, but not via the required demo sandbox.
- During live loading, capture, and voice-button flow, observed requests were only to `https://thought-parking.sociobot.in`. Source and request inspection found no analytics, ad, font-CDN, or content-upload requests. The only intentional cross-origin integration is the Sociobot license API.
- Live HTML/worker use `no-cache`; hashed JS/CSS use `public, max-age=31536000, immutable`. CSP restricts default resources to self and allows only the documented Sociobot API connection; HSTS, frame denial, nosniff, strict-origin referrer policy, COOP, CORP, and microphone-only Permissions-Policy are present.
- The manifest supplies standalone display, versioned start URL, matching background/theme colors, 192/512 icons, and a maskable icon.

## Accessibility and visual review

`/opt/fleet/lib/verify-url.sh` passed against live: HTTP 200, `title`, `lang=en`, exactly one `<h1>`, `<main>`, image alt text, labeled buttons, and zero page/console errors (961 ms measured load). Visual review at 1440×1000 and 390×844 found a coherent cassette-zine system, readable contrast, no horizontal overflow, and clear focus treatment.

Fresh axe scans with WCAG A/AA/2.1 AA tags found **zero serious or critical violations** on `/`, `/review/`, `/settings/`, `/privacy/`, and `/terms/` at both desktop and 390px. Reduced-motion styling changed transition and animation durations to `0.00001s`.

## Billing and rate limiting

The previous rate-limit failure is no longer reproducible. After a five-second quiet period, a fresh 200-request verification burst in groups of 25 produced **4 HTTP 200 and 196 HTTP 429** responses. Every 429 had `Retry-After`; observed values were `0` and `4`. Because requests were concurrent, the exact ordering is not meaningful; rate limiting began within the first 25 requests, after no more than four successes. This passes the work-order API burst requirement, though `Retry-After: 0` is of limited practical value.

Production checkout is still broken: `GET https://api.sociobot.in/api/v1/products/thought-parking/checkout` returns HTTP 404:

```json
{"error":"enabled factory product","status":404}
```

Successful checkout, license return, receipt/refund, and real revocation cannot be verified. Existing automated mocks do show the client fails closed on invalid, unavailable, and rate-limited verification responses, but mocks do not repair the live purchase path.

## Performance

Build payload budgets pass: JS 30.15 KB (10.34 KB gzip), CSS 16.52 KB (4.38 KB gzip), no font payload, and hero image 110.91 KB.

Two fresh mobile Lighthouse runs against production were inconsistent: one scored Performance **88**, Accessibility 100, Best Practices 100, SEO 100 (FCP 1.3 s, LCP 1.7 s, TBT 480 ms, CLS 0); the next scored Performance **95** (FCP 1.1 s, LCP 1.6 s, TBT 250 ms, CLS 0). The first run misses the attached 90 performance gate, so the candidate has not demonstrated a consistently passing Lighthouse baseline. INP is not available in these single-load lab runs.

## Defects

### TP-V8 — High, release blocker — Required claims contract is entirely absent

`.factory/claims.json` is missing. No claim has a uniquely tagged test, no claim test can be run through a demo sandbox, and the README/live product make multiple observable promises without a claims inventory. Add the manifest, one observable `@claim:<id>` test per claim, and run them through the demo entry point on every build.

### TP-V9 — High, release blocker — No isolated one-click sample-data demo; first-read gate fails

The initial live page has no **Try it with sample data** action. `/demo` and `?demo=1` load ordinary capture and use the real `thought-parking` storage namespace; they have no realistic sample, demo banner, reset/start-real controls, or `.factory/demo.md`. The first screen also omits the target user in plain words. Build the documented sandbox, isolate its storage, and make the first visible action a sample-data tryout alongside the real start.

### TP-V1 — High, release blocker — Production purchase cannot begin

The app advertises `Buy once · $7`, but its prescribed Sociobot checkout endpoint returns 404. Register/enable the production Thought Parking billing product outside this static repository, then verify checkout redirect, return-token storage, receipt/refund/revocation, and purchase restoration.

### TP-V10 — Medium — Route metadata and screen-reader navigation are incomplete

All five routes retain the root title, `Thought Parking — catch it, then go back`; Privacy, Terms, Review, and My data do not set route-specific document titles. SPA navigation replaces the active link with `<body>` focus and has no route-change live announcement or focus move to the new `<h1>`. Update route metadata and restore focus/announcement on navigation.

### TP-V11 — Medium — Mobile Lighthouse did not consistently meet the 90 performance gate

One fresh production Lighthouse mobile run scored 88 with 480 ms TBT; a second scored 95. Investigate the main-thread variability and record reproducible passing measurements before release.

## Release decision

**FAIL.** The candidate is correctly deployed and its core local-first PWA behavior is sound, but it cannot pass acceptance until TP-V8, TP-V9, and TP-V1 are resolved. Re-run every declared claim test through the actual demo URL, then independently repeat checkout/return/refund and the complete release suite. No product code was changed during this verification.

# Independent product verification 2 — FAIL

Verified 2026-08-28 for work order `thought-parking-verify-2`.

- Candidate: `5a8327d6f3eb914f6b54feedee4a07b2cb9bc1cf`
- Repository/branch: `https://github.com/B-Divyesh/sf-thought-parking.git`, `main`
- Production URL: <https://thought-parking.sociobot.in>
- Environment: Node `v22.23.2`, npm `10.9.8`, Chromium from Playwright `1.58.2`
- Result: **FAIL**

The local-first capture product and repaired deployment pass their functional, accessibility, privacy, PWA, security-header, caching, and performance checks. Release acceptance still fails from fresh evidence because the advertised production purchase cannot begin and the factory billing verification endpoint has no observable rate limit. The checkout failure previously described as deployment-only is still present on the candidate's live deployment.

## Candidate and deployment identity

The run began with no `node_modules`, an empty `git status --porcelain`, and `HEAD` exactly at the requested candidate. The build was generated from that checkout. Production serves the candidate byte for byte:

| Artifact | Bytes | SHA-256 | Live match |
| --- | ---: | --- | --- |
| `index.html` | 775 | `c389c40360c16a93271c83edf81b0dddf4d06db1d1c5eae64bdaad084e23bc85` | yes |
| `manifest.webmanifest` | 935 | `cae8f5fb39c3c77ed4f0d59b16c71c714c1f8b6ed04ef58f071001453c3892ee` | yes |
| `sw.js` | 2,146 | `74f704a521a55ca81461156651333c0f2f126c06d8c4f289833a0c68ac2dfd69` | yes |
| `assets/index-Ra5QSSDy.js` | 30,150 | `a90b301a41f2732cd1e7d2af8233e8c06fb13e9075c14f8e2ef710922b1fe269` | yes |
| `assets/index-efF61TYp.css` | 16,451 | `f4ff95f0691c7ba72e205b5a2d921dfd05b32c9cd8ee43dd98c6272e2a4520ea` | yes |
| `assets/cassette-still-life.webp` | 110,910 | `aecb556de287e6cbc8a76a32dd2b56f5616a0619b6e9b1984958e4bb6659e5c1` | yes |
| 192px, 512px, and maskable icons | — | compared individually | yes |

`/`, `/review/`, `/settings/`, `/privacy/`, and `/terms/` each return HTTP 200 and the same candidate HTML. The live manifest has the correct MIME type.

## Clean repository gates

| Check | Fresh evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci`: 139 packages installed, 0 vulnerabilities | pass |
| Lint | `npm run lint` | pass |
| Type check | `npm run typecheck` | pass |
| Unit/integration | `npm test`: 3/3 Vitest and 23/23 applicable Playwright checks passed; 3 declared cross-project duplicates skipped | pass |
| Exact production build | `npm run build`: `tsc --noEmit`, Vite, and postbuild completed; `dist/` produced | pass |
| Dependency audit | `npm audit --audit-level=low`: 0 vulnerabilities | pass |

This is a PWA, not a library/CLI, so pack-and-consumer testing is not applicable. It has no product backend or sign-in, so backend concurrency/health/persistence and Entra authority checks are not applicable.

## End-to-end behavior

Fresh browser profiles were used for local and live checks.

| Scenario | Evidence | Result |
| --- | --- | --- |
| Normal capture | Text parked with `Ctrl+Enter`, immediate return cue shown, reload retained it | pass |
| Deliberate review | Oldest-first review, one card at a time, Promote, Archive, timed Undo, handled log, and Put back work | pass |
| Input validation | Empty/whitespace submit gives actionable error and restores focus | pass |
| Boundary | A 4,001-character input is constrained to 4,000 and counter reads `4000 / 4000` | pass |
| Draft safety | Draft survives reload; HTML/event-handler-like text remains inert text | pass |
| Voice | Fake device records, stops, stores, reloads, and plays a local clip; simulated permission denial explains recovery | pass |
| Storage failure | Simulated IndexedDB failure shows `Parking is unavailable`, recovery guidance, and disables unsafe capture | pass |
| Export/import | Version-1 JSON export includes records; malformed JSON is rejected; corrected import succeeds; last-write-wins is covered | pass |
| License validation | New/pasted tokens fail closed on outage; cached positive remains available offline; revoked/invalid tokens remain locked | pass |
| Production checkout | `GET https://api.sociobot.in/api/v1/products/thought-parking/checkout` returns HTTP 404 | **fail** |

The free tier remains genuinely useful and export/accessibility features are not gated.

## PWA and offline behavior

- Manifest has standalone display, versioned start URL, matching colors, 192/512 icons, and a maskable icon. Chrome reported zero manifest and zero installability errors.
- The live worker controls the page and uses cache `thought-parking-v4`.
- Desktop and 390px live profiles both reloaded `/review/` offline and displayed their previously saved IndexedDB thought. No console/page errors occurred.
- A real update lifecycle was exercised against an isolated copy of the exact `dist/`: a changed worker installed and waited, the app showed `A fresh tape is ready.`, “Update now” activated it, the page reloaded, the replacement cache appeared, and the old cache was removed.
- **Gap:** at 390px the cached app works offline but the only offline status is hidden by the mobile stylesheet. Desktop visibly says `Offline · still saving`; mobile gives no equivalent state feedback.

## Accessibility and visual review

- Desktop 1440×1000 and mobile 390×844 were visually reviewed. The original cassette-zine system is clear and product-specific; the mobile layout deliberately omits the hero, stacks controls, and has no horizontal overflow.
- The skip link is first in keyboard order and becomes visible with a 3px teal outline. Global capture and submit shortcuts work; no keyboard trap was found.
- `prefers-reduced-motion: reduce` reduces transition duration to effectively zero and disables the record-dot animation.
- Axe WCAG A/AA/2.1 AA scans found **0 serious or critical findings** on all five live routes at both viewports and on local validation, populated-review, and expanded-license states.
- Every tested visible interactive target on all five 390px routes was at least 44×44 CSS px.
- The factory URL verifier passed in 793 ms: title, `lang=en`, one h1, main landmark, image alt, labeled buttons, and zero console/page errors.

## Privacy, requests, and response policies

- Initial load, text capture, and voice capture contacted only `thought-parking.sociobot.in`. Source inspection found no analytics, telemetry, ads, runtime CDN, or remote font integration.
- Notes and voice bytes remain in IndexedDB. The tested capture path emitted no cross-origin content request. Only explicit license verification contacted `api.sociobot.in`.
- The billing preflight allows the live product origin; invalid verification returns HTTP 200, `cache-control: no-store`, and `{ "valid": false, "reason": "invalid" }`.
- Live hardening is active: same-origin CSP with `frame-ancestors 'none'`, microphone-only-to-self Permissions-Policy, HSTS, `X-Frame-Options: DENY`, nosniff, strict-origin referrer policy, COOP, and CORP.
- Caching is correct: HTML and worker use `no-cache`; manifest uses one-hour revalidation; hashed JS/CSS and the hero use one-year immutable caching.

## Required rate-limit result

A fresh burst sent 200 GET requests to the production license verification endpoint with concurrency 25. Result: **200 HTTP 200 responses, 0 HTTP 429 responses, and no `Retry-After` header**. No threshold was observed through 200 requests. This fails the work-order requirement that a rapid API burst begin returning 429 with `Retry-After`.

## Performance and budgets

Lighthouse 12.8.2 against production with mobile defaults:

- Performance 92, Accessibility 100, Best Practices 100, SEO 100
- FCP 1.3 s, LCP 1.7 s, Speed Index 1.3 s, CLS 0, TBT 340 ms
- No Lighthouse run warnings. INP is unavailable from a single-load lab run; tested interactions were responsive.

Static budgets pass: 30.15 KB JS (10.34 KB gzip) against 200 KB, 16.45 KB CSS (4.37 KB gzip) against 50 KB, no font payload against 120 KB, and 110.91 KB hero WebP against 300 KB.

## Defects

### TP-V1 — High — Production purchase cannot begin

**Reproduction:** Open My data and follow `Buy once · $7`, or request `GET https://api.sociobot.in/api/v1/products/thought-parking/checkout`.

**Actual:** HTTP 404 with `{"error":"enabled factory product","status":404}`.

**Expected:** Redirect to the hosted Sociobot checkout for the registered, enabled product.

**Impact:** Nobody can buy the advertised one-time license. Successful checkout, return-token, receipt/refund, and revocation flows cannot be verified. The app's link matches the prescribed contract, so the remaining fix is factory billing registration/configuration outside this repository.

### TP-V6 — High — License verification API does not rate-limit a rapid burst

**Reproduction:** Send 200 rapid GET requests, concurrency 25, to `/api/v1/products/thought-parking/verify?license=<invalid-token>`.

**Actual:** 200/200 return HTTP 200; no response returns 429 or `Retry-After`.

**Expected:** The burst reaches a defined threshold, after which requests return 429 with `Retry-After`.

**Impact:** The public verification endpoint lacks the mandatory abuse-control behavior and can be hammered for token guessing or resource consumption. This is an external API defect, not a static-app code defect.

### TP-V7 — Medium — Mobile hides all offline-state feedback

**Reproduction:** At 390×844, load and control the PWA, go offline, then reload a cached route.

**Actual:** The app and IndexedDB data load successfully, but `.network-state` is `display:none` below 600px, so `Offline · still saving` is hidden with no replacement.

**Expected:** The offline state remains perceivable on mobile while preserving the compact layout.

## Verification limits

- Physical microphone hardware and Safari/iOS were unavailable; Chromium fake media plus explicit permission-denial handling were used.
- Successful production purchase/return/refund testing is blocked by TP-V1.
- No product or infrastructure code was modified. The update test changed only the response served from an isolated temporary copy of `dist/`.

## Release decision

**FAIL.** Register and enable the production billing product so checkout redirects successfully, and add API rate limiting that returns 429 plus `Retry-After`; then rerun the full purchase/return/revocation path and record the observed threshold. Restore visible mobile offline feedback as the remaining product-level acceptance issue.

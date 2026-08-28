# Independent product verification — FAIL

Verified 2026-08-28 for work order `thought-parking-verify-1`.

- Candidate: `4cdfc03a99748733bc0a7e948cad1dc80ed8b876`
- Branch/remote: `main`, `https://github.com/B-Divyesh/sf-thought-parking.git`
- Production URL: <https://thought-parking.sociobot.in>
- Environment: Node `v22.23.2`, npm `10.9.8`, Chromium from Playwright `1.58.2`
- Result: **FAIL**

The free local-first capture product works end to end and the live deployment is the candidate build. Release acceptance nevertheless fails because the advertised production purchase cannot start (HTTP 404) and verification errors fail open for manually pasted licenses. The mobile touch-target baseline and immutable caching policy also have defects.

## Candidate and deployment identity

The checkout began clean at the exact candidate; `node_modules` was absent and `git status --porcelain` was empty. The production build was generated locally, then representative live artifacts were downloaded and SHA-256 compared byte for byte:

| Artifact | Bytes | SHA-256 | Live match |
| --- | ---: | --- | --- |
| `dist/index.html` | 775 | `ee40bf759b7e03eb590528ba168a03635a0a171d0f935715538136bda3733b83` | yes |
| `dist/manifest.webmanifest` | 935 | `caac33aa9e8e24c8a3552f6b2af4557bbd39553b6cd7cfef1a0ea0f619150926` | yes |
| `dist/sw.js` | 2,146 | `ba933ac92a968328830c468de47616adafa0764acdce643976db6eb5c0b554c5` | yes |
| `dist/assets/index-CqxCPzRo.js` | 29,692 | `d3caf179cef54680f8a42a623d5293e901f9334140ec58bf99475a1b405ab7ad` | yes |
| `dist/assets/index-7_5FeuqI.css` | 16,319 | `c0e8f029c740503098960d3e48cf9669d8164d83577f75d5811870604b2caf41` | yes |
| `dist/assets/cassette-still-life.webp` | 110,910 | `aecb556de287e6cbc8a76a32dd2b56f5616a0619b6e9b1984958e4bb6659e5c1` | yes |

`/`, `/review/`, `/settings/`, `/privacy/`, and `/terms/` each returned HTTP 200 and the same 775-byte candidate HTML. The earlier deployment-only concern is therefore not a stale-deploy problem: the candidate is live, but the external checkout registration is still broken.

## Clean install and repository gates

| Check | Evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci`: 58 packages installed, audit reported 0 vulnerabilities | pass |
| Unit/integration suite | `npm test`: Vitest 3/3 passed; Playwright 11/11 executed checks passed, with the declared duplicate mobile offline case skipped | pass |
| Type check | `tsc --noEmit`, run by `npm run build` | pass |
| Lint | no lint script or lint configuration exists | not available |
| Exact production build | `npm run build` (`tsc --noEmit && vite build && node scripts/postbuild.mjs`) produced `dist/` | pass |
| Dependency audit | explicit `npm audit --audit-level=low`: 0 vulnerabilities | pass |

No library/CLI packaging check applies; this artifact is a static PWA. No backend concurrency or health endpoint applies.

## End-to-end product behavior

Fresh isolated browser profiles were used for the local suite and live checks.

| Scenario | Evidence | Result |
| --- | --- | --- |
| Normal text capture | typed a representative interruption, parked with `Ctrl+Enter`, saw the return cue, reloaded, and found it in review | pass |
| Deliberate review | oldest thought shown one at a time; Archive, timed Undo, Promote, empty state, and handled state behaved correctly | pass |
| Persistence | draft survived reload; parked thoughts survived reload and offline navigation in IndexedDB | pass |
| Boundary input | 4,001 typed characters were constrained to the declared 4,000-character maximum and the counter showed `4000 / 4000` | pass |
| Invalid capture | empty and whitespace-only submits showed `Type a thought or record a voice clip first.` and returned focus to the field | pass |
| Injection handling | HTML-like draft text survived reload as text and did not execute | pass |
| Voice happy path | fake browser microphone recorded, stopped, parked, survived reload, and rendered a local audio player in review | pass |
| Voice denial | simulated `NotAllowedError` produced the specific permission/recovery guidance; a device/start failure also produced a typed-capture fallback | pass |
| Export/import | downloaded a valid version-1 JSON backup; malformed/wrong-product input was rejected; a corrected newer record imported and replaced by `updatedAt` | pass |
| License invalid path | production verify returned HTTP 200 with `valid:false`; UI stayed locked, explained the invalid token, and removed it | pass |
| Purchase start | production checkout returned HTTP 404 instead of redirecting to hosted checkout | **fail** |
| Verification outage | aborting the verification request after pasting an arbitrary token displayed `Supporter tape unlocked` and retained the token | **fail** |

## PWA, offline, and update behavior

- Manifest has standalone display, a versioned start URL, theme/background colors, 192px, 512px, and 512px maskable icons of the declared dimensions.
- Chrome DevTools Protocol returned zero manifest parsing errors and zero installability errors despite the host serving the manifest as `application/octet-stream`.
- The live worker controlled the page, activated successfully, created `thought-parking-v3`, and precached the app shell plus all direct routes.
- With the browser network set offline, `/review/` reloaded, displayed `Offline · still saving`, and exposed the previously parked thought. A precached `/privacy/` navigation also loaded offline.
- Update behavior was tested against an isolated copy of the exact `dist/`: changing only the temporary worker cache version produced `A fresh tape is ready.`, “Update now” activated the waiting worker, the app reloaded, the new cache appeared, and the old cache was deleted.

## Accessibility, responsive behavior, and visual review

- Desktop 1366×900/1440×1000 and mobile 390×844 were exercised. The capture surface is clear, product-specific, visually consistent with `.factory/design.md`, and has no horizontal overflow on any primary route.
- Keyboard-only checks passed for the skip link, visible 3px focus outline, capture navigation, `Ctrl+Shift+Space`, `Ctrl+Enter`, form actions, review, and legal/data navigation. No keyboard trap was found.
- `prefers-reduced-motion: reduce` reduced the capture animation to effectively zero (`1e-05s`) and the staged update/review paths remained understandable.
- Axe WCAG A/AA/2.1 AA scans found **0 serious or critical violations** on all five routes and in capture-validation, populated-review, and expanded-license states at desktop and 390px mobile.
- The factory URL verifier passed: title present, `lang="en"`, one `h1`, a main landmark, zero missing image alts, zero unlabeled buttons, zero console/page errors; measured load was 712 ms.
- Defect `TP-V3` remains: the header wordmark (84×21), footer Privacy (55×20), footer Terms (39×20), and legal email links (182×18) do not meet the required 44px touch height.

## Privacy, requests, and browser response policies

- Initial load and text/voice capture made requests only to `https://thought-parking.sociobot.in`; no analytics, trackers, runtime CDNs, or web-font requests were observed. Source search found only the same-origin network probe and the documented Sociobot billing verification endpoint.
- Voice bytes and thoughts remained in IndexedDB; draft, return cue, and license state used local storage. The tested voice flow emitted no external content request.
- Billing verification is only contacted for a stored/entered token. Its preflight correctly allows `https://thought-parking.sociobot.in`, and verification responses use `cache-control: no-store`.
- Present site policies: HSTS (`max-age=10886400; includeSubDomains; preload`), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and DNS prefetch disabled.
- Missing hardening: no Content-Security-Policy (including `frame-ancestors`), Permissions-Policy, X-Frame-Options, COOP, or CORP. This is recorded as low severity because no injection was found, but the local-data surface should still be protected from framing and unnecessarily broad browser capabilities.

## Performance and caching

Lighthouse 12.8.2 against production with mobile defaults:

- Performance 96, Accessibility 100, Best Practices 100, SEO 100
- FCP 1.0 s, LCP 1.1 s, Speed Index 1.0 s, CLS 0, TBT 220 ms
- INP is not available from a one-load lab run; tested interactions showed no visible delay.

Static budgets pass: 29.69 KB JS (10.20 KB gzip) vs 200 KB, 16.32 KB CSS (4.36 KB gzip) vs 50 KB, no font payload vs 120 KB, and 110.91 KB hero WebP vs 300 KB. The image has explicit dimensions; the mobile layout intentionally omits it.

Caching does not meet the supplied production policy. Every checked response—including content-hashed JS/CSS and the hero—uses `cache-control: public, must-revalidate, max-age=30`. Hashed static assets should be long-lived and immutable; HTML and `sw.js` should remain short-lived/revalidated.

## Defects

### TP-V1 — High — Advertised production purchase cannot start

**Reproduction:** Open My data and follow `Buy once · $7`, or request `GET https://api.sociobot.in/api/v1/products/thought-parking/checkout`.

**Actual:** HTTP 404 with `{"error":"enabled factory product","status":404}`.

**Expected:** Redirect to the hosted Sociobot checkout for the registered production product.

**Impact:** A user cannot buy the advertised one-time supporter license. A successful checkout/return cycle is untestable and monetization is nonfunctional.

### TP-V2 — High — Verification failure accepts an arbitrary pasted license

**Reproduction:** Block or abort `https://api.sociobot.in`, open My data → Have a license, paste `not-a-real-license`, and press Verify and restore.

**Actual:** The app shows `Supporter tape unlocked`, stores the token, and exposes supporter features. The catch in `verifyLicense` leaves a token with no verdict, while `getLicenseState` treats every token without an explicit negative verdict as unlocked.

**Expected:** A manually restored token must not unlock until a valid response or previously cached valid verdict exists. Network failure should keep the free experience available and report that verification could not complete.

**Impact:** Paid access control fails open during verification outages or request blocking.

### TP-V3 — Medium — Repeated mobile links are below the 44×44 touch target baseline

**Actual at 390px:** wordmark 84×21; footer Privacy 55×20; footer Terms 39×20; privacy/support mail links 182×18. These repeat across primary routes.

**Expected:** Every interactive target is at least 44×44 CSS px or has an equivalent 44px hit area.

### TP-V4 — Low — Hashed assets are not cached immutably

**Actual:** hashed JS/CSS, image, icons, HTML, manifest, and worker all receive the same `public, must-revalidate, max-age=30` policy.

**Expected:** content-hashed assets receive a long-lived immutable policy; HTML and worker remain revalidated so updates are discoverable.

### TP-V5 — Low — Response hardening is incomplete

The deployment lacks CSP/`frame-ancestors`, Permissions-Policy, and frame protection. Add policies compatible with same-origin PWA assets, microphone-on-demand, and the Sociobot billing request.

## Verification limits

- A physical microphone, installed Android shell, and Safari/iOS were unavailable; Chromium fake-media plus explicit permission-denial paths were used.
- A real successful checkout/return/refund flow could not be tested because TP-V1 prevents checkout from starting.
- No production files or infrastructure were modified. The service-worker update test changed only a temporary copy of the built artifact.

## Release decision

**FAIL.** Fix TP-V1 and TP-V2 before release acceptance, then rerun the production checkout/return/restore/revocation cycle. TP-V3 should also be corrected to meet the non-negotiable mobile target baseline. TP-V4 and TP-V5 are deployment hardening follow-ups.

# Capture interrupting thoughts quickly — independent verification 5

Verified 2026-09-06 for work order `thought-parking-verify-5`.

- Verdict: **FAIL**
- Finding count: **7**
- Untested claim count: **2**
- Implementation reviewed: `310f240fac3d0949685e38b7f76b9da37d43c6e9`
- Documentation reviewed: `04f2e6cb018c7d5ff7ca13d1532c1155e0597f4e`
- Deployment: `991ffa5d-584c-48e7-bc69-4f64a61c43e9`
- Live URL: <https://thought-parking.sociobot.in>
- Environment: Node `v22.23.2`, npm `10.9.8`, Playwright Chromium `1.58.2`, Lighthouse `13.0.1`

The free local-first product works for capture, later review, voice notes, backups, and offline use. The production purchase remains unavailable. Six additional contract findings prevent acceptance. No product code or deployment was changed during this verification.

## First screen before scrolling

Fresh 1366×900 desktop and 390×844 phone profiles both showed the required information at `scrollY = 0`:

- Job: **Capture interrupting thoughts quickly.**
- Audience: adults with ADHD who need to save an interruption before it pulls them from their work.
- First action: **Try it with sample data**.
- Next result: three sample interruptions open without using the visitor's data.
- Facts: saved on this device, works offline after the first visit, and a $7 one-time supporter license.

The action and all three facts were inside both initial viewports. Horizontal overflow was 0 px, and neither profile produced a page or console error. Screenshots are `/work/.evidence/live-cold-desktop.png` and `/work/.evidence/live-cold-mobile.png`.

## Candidate and live deployment

The checkout began clean at documentation SHA `04f2e6c`; `node_modules` was absent and `git status --porcelain` was empty. The only change between implementation SHA `310f240` and documentation SHA `04f2e6c` is `.factory/handoff.md`.

The local production build and live files matched byte for byte:

| File | SHA-256 | Live match |
| --- | --- | --- |
| `index.html` | `4dd8592f077f4be4372ead2b89c645c98fec2ba26205f6427b34e7702bd09612` | yes |
| `sw.js` | `b68e6e05db310ec798f5f4d21e3cab930bfbcc5330a13396261b82d55793603e` | yes |
| `manifest.webmanifest` | `e3c3946da5f63f4d2acb220c0bdf1eb85db3afc81ea4e11de7cd38bc748a6889` | yes |
| `404.html` | `84670c979ad15df971e0c3c4ba9bd870959acad9726a92bb0f73e96cc4ea6812` | yes |
| `assets/index-C37kqrc-.js` | `1a37fc91f736ed065c0cd30a4f48b3b4f7803c7dc1bac30a7b612eb0e6755a2c` | yes |
| `assets/index-CY-pDrjO.css` | `5612c533c1ba6e841e80a77288df31c43860d0de9f4d3b18f3060feb0f006c7a` | yes |

Later documentation-only commits therefore do not require a different product image.

## Declared claim commands

After `npm ci` installed 139 packages with 0 vulnerabilities, every exact command from `.factory/claims.json` ran separately. Each command ran its one tagged test in desktop Chromium and the 390 px project. Result: **22 passed, 0 failed**.

| Claim | Exact command | Automated result |
| --- | --- | --- |
| Isolated demo | `npm run test:e2e -- --grep @claim:isolated-demo` | pass, 2/2 |
| Local thought, voice, and decision data | `npm run test:e2e -- --grep @claim:private-local-data` | pass, 2/2 |
| No account or sync | `npm run test:e2e -- --grep @claim:no-account-or-sync` | pass, 2/2 |
| No tracking or third-party content requests | `npm run test:e2e -- --grep @claim:no-tracking-requests` | pass, 2/2 |
| Microphone only after action | `npm run test:e2e -- --grep @claim:microphone-on-action` | pass, 2/2 |
| Voice capture | `npm run test:e2e -- --grep @claim:voice-capture` | pass, 2/2 |
| Global hotkey | `npm run test:e2e -- --grep @claim:global-hotkey` | pass, 2/2 |
| Complete JSON backup and replacement import | `npm run test:e2e -- --grep @claim:complete-json-backup` | pass, 2/2 |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | pass, 2/2 |
| Oldest-first deliberate review | `npm run test:e2e -- --grep @claim:deliberate-review` | pass, 2/2 |
| Supporter license | `npm run test:e2e -- --grep @claim:supporter-license` | pass, 2/2 with mocked valid return; live purchase untested |

The machine-readable aggregate is `/work/.evidence/claim-results.json`. Claim coverage is still incomplete; see TP-V19.

## Product paths tested

Fresh live profiles covered:

- One-click demo, all three realistic samples, persistent demo label across navigation and reload, a demo-only capture, Reset demo, Start for real, and proof that only the pre-existing real thought remained afterward.
- Empty and whitespace capture recovery, a 4,001-character input constrained to 4,000, character count, `Ctrl+Enter`, reload persistence, archive, Undo, promote, clipboard copy, and handled history.
- Draft reload, inert HTML-like text, IndexedDB failure with disabled unsafe controls and reload guidance, malformed JSON import, successful complete import/export through the declared test, voice recording with fake media, and microphone-denial typed fallback.
- `Ctrl+Shift+Space` from Privacy, route titles, focus moved to the new h1, route announcement, browser Back, the first-focus skip link, and visible 3 px focus styling.
- Live mobile offline capture and reload with **Offline · still saving** visible. The saved thought remained available in review. An isolated exact-build update test installed a changed worker, showed **An update is ready**, activated it through **Update now**, reloaded, and removed the old cache.
- Privacy request recording during capture, voice, review, and backup. Only `https://thought-parking.sociobot.in` was contacted until billing was explicitly exercised.
- All internal links. Valid routes returned 200. `mailto:` links were present. The only broken public action was checkout.

This is a static PWA, not a backend, CLI, library, or desktop package. Tenant isolation, SQLite restart persistence, server health, consumer-package installation, and Entra authority checks do not apply.

## Accessibility, PWA, security, and performance

- Live Axe scans covered `/`, `/demo/`, `/review/`, `/settings/`, `/privacy/`, `/terms/`, and an unknown route at desktop and 390 px: **0 serious or critical violations** across 14 scans.
- Each tested route had `lang="en"`, one h1, one main landmark, a route title, no horizontal overflow, and no missing image alt. All measured phone controls were at least 44×44 CSS px.
- At a simulated 200% root text size, the phone page kept its h1 and sample action available with 0 px horizontal overflow. Reduced-motion transition and animation duration was `0.00001s`.
- `/opt/fleet/lib/verify-url.sh` passed live `/demo/`: HTTP 200, title, language, one h1, main, image alt, button labels, no errors, and 723 ms measured load. Evidence is `/work/.evidence/verify-url-5/`.
- The manifest parsed with zero Chromium errors, the worker controlled the page, and cache `thought-parking-v8` was active.
- Live `/missing-verification-5` returned a deliberate HTTP 404 with title **Page not found — Thought Parking**, one h1, and **Go to capture**. This is the expected designed response, not a defect.
- Live headers retained the CSP with `frame-ancestors 'none'`, self-only microphone policy, HSTS, frame denial, nosniff, strict referrer policy, COOP, and CORP. HTML and worker use `no-cache`; hashed assets use one-year immutable caching.
- Fresh mobile Lighthouse on `/demo/`: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.7 s, TBT 70 ms, CLS 0. Evidence is `/work/.evidence/lighthouse-5.json`.
- Build payloads: JS 35.42 KB raw and 11.48 KB gzip; CSS 17.67 KB raw and 4.62 KB gzip; no font download; hero WebP 110.91 KB. All supplied budgets pass.

The separate `/offline.html` fallback does not pass its console/style check; see TP-V14.

## Billing and request allowance

Fresh production evidence:

```text
GET https://api.sociobot.in/api/v1/products/thought-parking/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

An invalid license verification returned HTTP 200, `Cache-Control: no-store`, and `{ "valid": false, "reason": "invalid" }`. A following 80-request concurrent burst returned 29 HTTP 200 and 51 HTTP 429 responses. Every 429 included `Retry-After: 4`.

The checkout 404 prevents a real checkout redirect, returned license, cross-device restore, refund, and revocation cycle. The client-side mocked valid, invalid, unavailable, revoked, and 429 paths pass, but they do not prove a real purchase.

## Earlier finding disposition

| Finding | Current disposition |
| --- | --- |
| TP-V1 purchase HTTP 404 | **Open.** Fresh checkout remains HTTP 404. |
| TP-V2 failed-open license restore | Resolved. New tokens stay locked on unavailable, invalid, revoked, and 429 responses. |
| TP-V3 phone targets below 44 px | Resolved on all primary routes and the 404 at 390 px. |
| TP-V4 short caching for hashed assets | Resolved. Hashed JS/CSS are immutable for one year. |
| TP-V5 missing response hardening | Resolved on the app shell. TP-V14 is a separate CSP compatibility defect in the fallback page. |
| TP-V6 no API rate limit | Resolved. The fresh burst returned 51 HTTP 429 responses, all with `Retry-After`. |
| TP-V7 hidden phone offline state | Resolved. The status was visible during a real offline phone reload. |
| TP-V8 missing claims file | Resolved. Eleven unique IDs and tags exist. TP-V19 records narrower remaining inventory/test gaps. |
| TP-V9 missing isolated demo and first-read content | Resolved. Demo namespace, sample, banner, reset, Start for real, job, audience, and action all passed. |
| TP-V10 missing route titles and focus | Resolved. Titles, h1 focus, live announcement, and Back passed. |
| TP-V11 variable Lighthouse score | Resolved in the current run: 99/100/100/100. |
| TP-V12 omitted privacy/import/account claims | The listed omissions are resolved by new declarations and passing tests. TP-V19 covers different remaining public claims. |
| TP-V13 unknown paths returning 200 | Resolved. Unknown live path returns the designed HTTP 404. |

## Findings

### TP-V1 — High — Production supporter checkout cannot start

The public **Buy once · $7** action points to the prescribed Sociobot endpoint, but that endpoint returns HTTP 404 instead of hosted checkout. Users cannot buy the advertised license. A real purchase, return, restore, refund, and revocation cycle remains untested. Factory billing registration must enable this product; the static app should not replace the prescribed provider.

### TP-V19 — High — Public claim coverage is still incomplete

All 11 declared commands pass, but the public surface still contains promises that do not have a complete, uniquely tagged sandbox test:

- The meta and manifest description says **Catch an interrupting thought in seconds**. It has no declared quantitative threshold or claim command.
- Review says **Promote copies the text** and Privacy says Archive keeps a thought in local history. Manual live checks passed both, but neither outcome is asserted by the declared `deliberate-review` test; it only archives and observes the next card.
- My data says installation adds an app-window shortcut. Chromium reported a valid manifest and active worker, but there is no declared claim entry or installed-window outcome test.
- The supporter claim uses a mocked verification response and checks that controls appear. It cannot prove the real purchase lifecycle while TP-V1 is open.

The untested-claim count is **2**: the undefined “in seconds” claim and the real paid purchase lifecycle. The review and install outcomes received independent live or browser-manifest evidence, but still violate the required per-claim regression inventory.

### TP-V14 — Medium — Offline fallback violates the live CSP

Opening live `/offline.html` logs a CSP error because its `<style>` block is inline while the response permits only self-hosted styles through `default-src 'self'`. Chromium blocks the stylesheet; the body background becomes transparent and the fallback loses its designed presentation. Move the CSS to a same-origin file or authorize it with a fixed CSP hash. The normal cached app remains functional offline.

### TP-V15 — Medium — Import JSON has no visible keyboard focus

On My data, Tab after **Export JSON** focuses `#import-file`, but that input is clipped to a 1 px-wide invisible region (`clip: rect(0, 0, 0, 0)`). The visible **Import JSON** label is not keyboard-focusable, so the designed 3 px focus ring cannot be seen. Make the visible control keyboard-operable and show focus on it.

### TP-V16 — Medium — The landing page omits required information sections

After the live capture surface, the page goes directly to the footer. It has no three-step **How it works** section, no explicit what-it-does-not-do/privacy section, and no paid-tier section describing the price and included features. Those sections are mandatory in the attached site-structure order and are not replaced by the three short first-screen facts.

### TP-V17 — Low — Social and icon metadata do not meet the supplied sizes

The Open Graph image points to the 960×640 hero instead of a 1200×630 social image. Twitter metadata supplies only `twitter:card`, without its own title, description, or image. The page also has no SVG favicon and uses the 192 px PWA icon as the Apple touch icon instead of a 180 px asset. These miss the attached metadata contract, though the existing files load.

### TP-V18 — Low — Malformed backup errors expose parser text without a next step

Importing malformed JSON shows `Expected property name or '}' in JSON at position 1 (line 1 column 2)`. This is raw parser language and does not tell the user what to do. The plain-words error contract requires a clear explanation and one recovery action, such as choosing an unchanged Thought Parking JSON backup.

## Decision

**FAIL.** There are 7 findings and 2 untested claims. TP-V1 and TP-V19 are release blockers. Enable the production billing offer, complete its real lifecycle, close the remaining contract findings, and then run a new independent verification.

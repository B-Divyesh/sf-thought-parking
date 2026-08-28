# Thought Parking repair handoff

Repair work order `thought-parking-repair-2`, run 2026-08-28 against verifier report commit `56b14727b7e0f0965e2b878558c2db6093d021fb` and candidate `5a8327d6f3eb914f6b54feedee4a07b2cb9bc1cf`.

## Result

The release-blocking product defect **TP-V7 is fixed and deployed**. At widths up to 600px the compact online label remains omitted, but `.network-state.is-offline` is now rendered as a visible header status. The layout stays within 390px and retains the cassette-zine visual system. The release was advanced to app version 1.0.2 and service-worker cache `thought-parking-v5`, so existing installations discover the repaired shell.

Two high-severity verifier findings remain in the external Sociobot billing service and cannot be repaired from this static-product repository:

- **TP-V1 remains open:** `GET https://api.sociobot.in/api/v1/products/thought-parking/checkout` returns HTTP 404 with `{"error":"enabled factory product","status":404}`. The prescribed factory registration helper, `fleet/new-paid-product.sh`, is absent from this worker image. Repository policy prohibits direct billing/provider changes, so no Dodo API or billing database mutation was attempted. The app retains the required slug-based Sociobot checkout contract rather than substituting another product or provider.
- **TP-V6 remains open:** a fresh 550-request burst at concurrency 25 against `/api/v1/products/thought-parking/verify` returned 550 HTTP 200 responses, no 429, and no `Retry-After`. Rate limiting belongs to the shared `api.sociobot.in` service, which is outside this static PWA and deployment work order. The client already verifies at most daily for a cached verdict; new regression coverage also proves a real 429 response fails closed and does not retain an unverified token.

This is therefore an honest partial repair, not a release-pass claim. Factory billing must register and enable the $7 production product and the shared API must rate-limit public verification before independent verification can pass.

## Exact regression coverage

`tests/e2e/app.spec.ts` now adds:

1. a true service-worker-controlled offline reload in both desktop Chromium and the 390×844 mobile project;
2. an assertion that `Offline · still saving` is visible after reload on mobile and remains inside the 390px viewport;
3. a simulated HTTP 429 with `Retry-After: 60`, proving supporter features stay locked and the unverified token is removed;
4. the expected `thought-parking-v5` update identity.

Existing coverage remains green for text and voice capture, IndexedDB persistence and failure handling, validation and inert user text, review/archive/promote/undo/restore, export/import, license return/restore/outage/revocation, keyboard shortcuts, touch targets, axe, privacy requests, security/cache policy, update UI, and responsive overflow.

## Clean local evidence

- `npm ci`: 139 packages installed; 0 vulnerabilities.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: pass — 3/3 Vitest tests and 26/26 applicable Playwright checks across desktop Chromium and 390×844; 2 deliberate cross-project skips.
- `npm run build`: pass; `dist/index.html` is at the static root.
- `npm audit --audit-level=low`: 0 vulnerabilities.
- Build budgets: 30.15 KB JS (10.34 KB gzip), 16.52 KB CSS (4.38 KB gzip), no font payload, and 110.91 KB hero WebP.
- Factory URL verifier: pass in 674 ms; title, `lang=en`, one h1, main, image alt, labeled buttons, and zero console/page errors.
- Local desktop and 390px offline screenshots were visually reviewed: the status is visible, targets do not overlap, and horizontal overflow is 0px.
- Local Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.9 s, TBT 0 ms, CLS 0.

This PWA is not a package/library/CLI, so pack-and-consumer testing is not applicable. It has no product backend or sign-in, so backend persistence/concurrency and identity-authority tests are not applicable.

## Deployment and live evidence

- Repair commit: `f73d6fa646179249b21fc4c6f29b279b5f40f6ad`, pushed to `origin/main`.
- Static deployment: `/opt/fleet/lib/deploy-static.sh thought-parking dist`; Azure deployment ID `d31301bc-f5d2-4148-9c1f-dee5c77cbf11`; succeeded.
- Live routes `/`, `/review/`, `/settings/`, `/privacy/`, and `/terms/`: HTTP 200.
- Live factory URL verifier: pass in 1,013 ms with zero console/page errors.
- Fresh desktop and 390px profiles: worker controlled the page; cache `thought-parking-v5`; offline reload succeeded; the mobile offline status bounding box was `x=183.36`, `width=186.64` inside the 390px viewport; horizontal overflow was 0px.
- Live keyboard smoke test: the first Tab target is `Skip to main content`; `Ctrl+Shift+Space` focuses capture on desktop and mobile.
- Live axe WCAG A/AA/2.1 AA: zero serious or critical findings on all five routes at both viewports.
- Live privacy check: normal load/offline behavior contacted only `thought-parking.sociobot.in`; no console errors occurred.
- Live response policy: `no-cache` HTML, restrictive same-origin CSP, microphone-only Permissions-Policy, HSTS, frame denial, nosniff, COOP, and CORP are present. Existing automated checks cover immutable assets and the no-cache worker.
- Live Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.7 s, TBT 0 ms, CLS 0; no warnings.

Local and production files match byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `d8943ec37f23156104f64b072ba43e8a2ec045005935dc6834a87717c2c8a52a` |
| `manifest.webmanifest` | `3b83e6036d5b801008a0470dcba7507224b88f34e5c8762165947c708a7e69c5` |
| `sw.js` | `a41274ec9986f8ea7277e481858a3a633d8793694279834efd2bbee30a559a81` |
| `assets/index-C_6LbnXx.js` | `2b3378e8b2e9e5d0d29cb7f03e764f91033dc3b2e2f31c7602709a4b590252e9` |
| `assets/index-BNceHVcT.css` | `d69f6931ce5370ddaa908ba53832e493a0768735f7ba5abb767b4fd9f4315fb4` |
| `assets/cassette-still-life.webp` | `aecb556de287e6cbc8a76a32dd2b56f5616a0619b6e9b1984958e4bb6659e5c1` |

## Re-run

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=low
```

After the external fixes, independently confirm checkout redirects to hosted Sociobot billing, exercise purchase/return/refund/revocation, and rerun the verification burst while recording the first 429 threshold and `Retry-After` value. Physical microphone hardware and Safari/iOS were unavailable; Chromium fake media and explicit denial handling pass.

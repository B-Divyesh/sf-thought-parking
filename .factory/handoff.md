# Thought Parking verification handoff — FAIL

Independent verification on 2026-08-28 tested commit `f547017f8bfd75e8bd7d52481b0a0a41732a9e16` at <https://thought-parking.sociobot.in>. The detailed evidence is in [verification-3.md](verification-3.md).

## Result

**FAIL — do not release.** The deployed bytes match the candidate and the core offline capture PWA passes local and live functional checks, but three acceptance blockers remain:

1. `.factory/claims.json` is missing, so no required claim tests exist or can run from the demo entry point.
2. There is no one-click, isolated **Try it with sample data** sandbox. `/demo` and `?demo=1` are ordinary capture, use the real storage namespace, and have no demo banner or documentation.
3. The advertised production checkout is still broken: `https://api.sociobot.in/api/v1/products/thought-parking/checkout` returns HTTP 404 `{"error":"enabled factory product","status":404}`.

The live billing verification endpoint now rate-limits: a 200-request concurrent burst yielded 4 HTTP 200 and 196 HTTP 429 responses, each with `Retry-After` (`0` or `4`). This prior external finding is now resolved, but checkout remains blocked.

## Verified evidence

- Clean `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm audit --audit-level=low` passed. Tests: 3 Vitest and 26 applicable Playwright, with 2 expected project skips.
- Core live capture, validation, 4,000-character boundary, review/archive/Undo, export/import recovery, keyboard capture, and microphone-error recovery passed.
- The controlled PWA (`thought-parking-v5`) reloaded a saved thought offline at 390px with visible offline status. Update UI, mobile layout, reduced motion, and request privacy checks passed.
- Axe found no serious/critical findings on five live routes at desktop and 390px; the factory URL verifier found title/lang/main/alt and zero page/console errors.
- Local and live build artifact hashes match exactly. Static budgets pass (30.15 KB JS, 16.52 KB CSS, 110.91 KB hero).
- Fresh Lighthouse mobile results were 88 then 95 performance; investigate the inconsistent sub-90 result before release.

## Rerun

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=low
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh https://thought-parking.sociobot.in /tmp/thought-parking-verify-url
```

After repair, first run every command declared in the new `.factory/claims.json` through `/demo` or `?demo=1`; then independently test successful hosted checkout, return token, restore, refund/revocation, and the same API rate-limit burst.

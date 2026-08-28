# Thought Parking

Thought Parking is a local-first capture tool for adults with ADHD whose useful ideas interrupt the work in front of them. Capture now. Make decisions later.

Try the [sample-data demo](https://thought-parking.sociobot.in/demo/) or open `/?demo=1`. It starts with three realistic interruption slips, shows a persistent demo banner, and uses a separate browser-storage namespace. See [`.factory/demo.md`](.factory/demo.md) for the sample and reset boundary.

## Verifiable product claims

Every visitor-facing promise is declared with its exact browser regression test in [`.factory/claims.json`](.factory/claims.json):

- Try sample data without changing a real parking lot.
- Keep text and voice clips on the device during capture.
- Record a short voice clip and park it with a thought.
- Focus capture with `Ctrl/Command+Shift+Space`.
- Export a versioned JSON backup.
- Reload the app and saved thoughts offline after the first visit.

Thought Parking is not a task manager, calendar, coach, diagnostic tool, or AI prioritizer. The optional $7 supporter license is a one-time Sociobot/Dodo purchase; it adds a local 14-day return snapshot and custom return cue while core capture, review, and backup remain free.

## Run, test, and build

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

The static deployment artifact is `dist/`, with `dist/index.html` at its root. Run one claim command exactly as listed in `.factory/claims.json`, for example:

```sh
npm run test:e2e -- --grep @claim:isolated-demo
```

`npm run preview` serves the production build locally. This is a static PWA rather than a package, CLI, or server product, so no package-consumer or backend-health suite applies.

## Data, billing, and deployment

Thoughts and voice clips use browser IndexedDB. Drafts and small local preferences use `localStorage`. The demo uses `demo:thought-parking` and `demo:thought-parking:*`; the real app uses `thought-parking` and `thought-parking:*`. See [/privacy](https://thought-parking.sociobot.in/privacy/) and [/terms](https://thought-parking.sociobot.in/terms/).

The supporter UI uses the prescribed Sociobot product endpoint, never an embedded payment SDK. Production uses `https://api.sociobot.in`; staging may set `VITE_BILLING_BASE_URL=https://pilot-api.sociobot.in` at build time. Static hosting serves `dist/`; `public/staticwebapp.config.json` contains its route fallback, caching, and browser security headers.

The cassette-zine visual system and generated-art provenance are recorded in [`.factory/design.md`](.factory/design.md). Licensed under [MIT](LICENSE).

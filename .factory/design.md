# Thought Parking — visual thesis

## Direction: cassette-era zine

Thought Parking should feel like slipping a useful thought onto a labeled cassette, not opening a project-management system. The surface borrows from photocopied gig flyers, library checkout cards, hand-numbered tapes, and the practical machinery of a portable recorder. Registration offsets, halftone grain, torn paper edges, grease-pencil marks, and blocky labels create a handmade world; the capture field itself stays calm and generously sized so decoration never competes with the job.

This is an intentionally single-mode interface. Warm paper is painted on every surface and a deep ink color supplies stable, high-contrast text. A dark theme would turn the physical-paper metaphor into a conventional software skin and is not included in v1.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#F3E7CF` | main paper stock/background |
| `--paper-light` | `#FFF9EC` | input and raised sheets |
| `--ink` | `#171713` | primary text and hard outlines |
| `--ink-soft` | `#5B554A` | secondary text (7.0:1 on paper) |
| `--orange` | `#C94919` | capture/record accent and urgent state |
| `--orange-dark` | `#8B2E0E` | accessible accent text |
| `--teal` | `#176B69` | promoted/positive state |
| `--mustard` | `#E6B94C` | status labels and highlights |
| `--danger` | `#9A2424` | destructive/error copy |

Orange is the record lamp; teal is the library label that says a thought has found a destination. Color is always paired with words, shape, or iconography. Focus uses a 3px teal ring with a paper offset.

## Type

- Display: `Arial Black`, `Arial Narrow Bold`, system sans-serif. Tight, uppercase, poster-like, limited to the masthead and major counts.
- Working text: `Courier New`, `Courier`, monospace. It resembles typed cassette labels and keeps timestamps/metrics tabular without downloading a font.
- Scale: 14px utility, 16px body minimum, 20px label, clamp(32–58px) masthead. Body leading is 1.55 and readable lines stop near 68 characters.

System fonts keep first load small, private, and offline. No third-party font requests are made.

## Spacing and layout

An 8px base rhythm (`4, 8, 16, 24, 32, 48, 64`). Thick 2px ink rules and deliberately uneven 2–4px shadows provide physical depth. The desktop has a narrow masthead/return cue beside the capture sheet; the 390px layout drops the editorial side note, stacks controls, and keeps the text area and record button within a thumb’s reach. All controls are at least 44px tall with 8px separation.

## Interaction grammar

- `Ctrl/⌘ + Shift + Space` moves focus straight to capture from anywhere.
- Capturing is deliberately organization-free: type or dictate, then press “Park thought” (`Ctrl/⌘ + Enter` also submits).
- A parked thought slides into an unseen box; immediate confirmation says to return to the prior task.
- Review is a deliberate separate view. One card appears at a time with only “Archive” or “Promote”. Promote copies the text to the clipboard and marks it handled; this avoids inventing task management.
- Destructive archive actions provide a timed Undo. Imports are validated before writing.
- Recording has an explicit live timer and stop control. Audio is stored locally with the thought and can be played back in review. Errors explain whether permission/browser support is the issue.

## Motion policy

Capture confirmation and review cards use 180–220ms transform/opacity changes with a physical paper-slide origin. Buttons depress by 2px. Nothing loops; the recording lamp uses a slow opacity pulse only while recording. Under `prefers-reduced-motion: reduce`, transitions and pulses are removed and state changes are immediate.

## Asset plan and provenance

Hero artwork: one original raster still life of an unbranded translucent cassette, torn memo scraps, and a capped grease pencil, photographed like a 1980s mail-order zine cover. It explains the “park it and go back” metaphor and is cropped as a narrow editorial panel rather than a decorative banner. UI icons and texture marks are hand-authored CSS/SVG-style primitives rather than third-party iconography.

Prompt sheet:

> Use case: product-mockup. Asset type: compact PWA editorial hero. A top-down still life on warm recycled paper: one unbranded translucent compact cassette with a blank cream label, a short loose ribbon forming a calm loop, two small torn blank memo scraps tucked beneath it, and one dark grease pencil. Cassette-era independent zine photography, tactile xerox halftone grain, imperfect ink registration, screenprinted burnt orange, deep teal, mustard and charcoal palette. Hard angled desk-lamp shadow, quiet and focused mood. Landscape framing with the objects grouped toward center-right and breathing room around them. No people, no hands, no readable text, no letters, no logos, no watermark, no UI screenshot, no brand marks, no neon, no gradient.

Generation method: Azure AI Foundry factory image deployment via `/opt/fleet/lib/gen-image.sh`, generated 2026-08-28. Generated output is original to this product; source PNG and prompt sidecar are retained in `assets/src/`, optimized WebP is shipped in `public/assets/`. The generated-imagery disclosure appears in the footer.

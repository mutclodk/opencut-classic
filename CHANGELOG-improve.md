# OpenCut Classic — Improvement Branch Changelog

Branch: `improve/typography-and-export`
Base: `OpenCut-app/opencut-classic` @ `cf5e79e919144200294fb9fed22a222592a0aeea` ("docs: readme", archived legacy codebase)
Scope: two scoped improvements (A: text style toggles, B: export resolution +
download confirmation) plus one adjacent fix (C: canvas-aware default text
size). Transitions and new effects were explicitly out of scope.

All changes are in `apps/web`. Nothing was pushed anywhere; commits are local.

---

## A. Bold / Italic / Underline toggles for text elements

**Finding first:** the data and rendering pipeline already supported
`fontWeight` end to end — the param existed in the registry as a dropdown
select, `measureTextElement` reads it, and `buildTextFontString` puts it into
the canvas font string (`"italic bold Npx Family"`) used by both the preview
renderer and the exporter (both draw through `CanvasRenderer` /
`drawMeasuredTextLayout`). What was missing was the editor-standard toggle
control: there was no Bold/Italic button anywhere, only a "Font Weight"
dropdown buried among the other selects.

**Change:** added a `TextStyleToggles` component with Bold, Italic and
Underline toggle buttons at the top of the Text properties tab. The buttons
write the same `fontWeight` / `fontStyle` / `textDecoration` params through
the same `useKeyframedParamProperty` preview/commit path as every other
param field, so the values take the existing route into text measurement and
the canvas font string — i.e. they affect preview AND export rendering, not
just the panel. The three params were removed from the generic select list
(`TEXT_PARAM_KEYS`) so each has exactly one control.

Note: the Underline toggle maps to `textDecoration: "underline" | "none"`.
A pre-existing `"line-through"` value still renders, but is no longer
selectable from the panel (it was only reachable via the old dropdown).

Files:
- `apps/web/src/components/editor/panels/properties/components/text-style-toggles.tsx` (new)
- `apps/web/src/components/editor/panels/properties/registry.tsx` (render toggles in the text tab; drop the 3 keys from `TEXT_PARAM_KEYS`)

## B. Export: resolution selector + download confirmation

**Resolution selector.** New `resolution` export option:
`"source" | "1080p" | "720p" | "480p"`. `resolveExportSize` scales the
project canvas so its shorter side matches the target (1080×1920 @ 720p →
720×1280; 1920×1080 @ 720p → 1280×720), preserving aspect ratio exactly,
never upscaling, and rounding to even dimensions (required by H.264/VP9).
The scene still renders at project size (element transforms are stored in
project pixels, so building the scene at a different size would misplace
elements); instead `SceneExporter` draws each rendered frame into an
output-sized `OffscreenCanvas` and the encoder reads from that canvas.
The export popover gains a Resolution section (same radio-group pattern as
Format/Quality) with a live "Output size: W × H" readout.

**Download confirmation.** Previously a successful export triggered the
browser download, then immediately cleared state and closed the popover —
no confirmation, no way to re-download (and in the earlier hands-on test
the download could not be verified at all). Now a successful export keeps
the popover open on an "Export complete" view showing the filename, output
dimensions and file size, with an explicit **Download** button (re-downloads
the in-memory buffer) and **Done**. The automatic download on completion is
kept.

Files:
- `apps/web/src/export/index.ts` (`EXPORT_RESOLUTION_VALUES`, `ExportResolution`, `ExportOptions.resolution`, `resolveExportSize`)
- `apps/web/src/export/defaults.ts` (default `resolution: "source"`)
- `apps/web/src/services/renderer/scene-exporter.ts` (optional `outputWidth`/`outputHeight`, downscale canvas path)
- `apps/web/src/core/managers/renderer-manager.ts` (resolve size from options, pass to exporter)
- `apps/web/src/components/editor/export-button.tsx` (Resolution section, success view, `CompletedExport` state)
- `apps/web/src/export/__tests__/resolution.test.ts` (new, 6 tests)

## C. New text elements: default size that fits the canvas

Font size units are relative: rendered px = `fontSize × canvasHeight / 90`.
The historical default of 15 on a 9:16 (1080×1920) canvas renders ~320px
glyphs, so a new "Default text" element overflows both edges of the frame
(the hands-on test had to shrink it to 5 by hand).

**Change:** new helper `resolveDefaultTextFontSize` estimates the largest
size (≤ historical default 15, ≥ minimum 5) whose longest line fits within
90% of the canvas width, using a 0.55 average glyph-width ratio. The
click-to-add path in the Text assets panel now uses it based on the active
project's canvas size (9:16 → 6; 16:9 → unchanged 15). Existing elements and
projects are untouched.

Known limitation: the drag-and-drop creation path still uses the flat
default of 15 — its controller only receives the project id/fps via config
callbacks, and extending that interface for this fix was judged not
"trivially adjacent". The subtitle builder is also unchanged.

Files:
- `apps/web/src/text/typography.ts` (`DEFAULT_FONT_SIZE`, `resolveDefaultTextFontSize`)
- `apps/web/src/text/components/assets-view.tsx` (apply canvas-aware size on click-to-add)
- `apps/web/src/text/__tests__/typography.test.ts` (new, 4 tests)

---

## Verification (this machine: ~1.5 shared CPU / 6 GB RAM)

- `bun install`: 973 packages in 130s.
- Dev server (`bun run dev`, Next 16.1.3 Turbopack): ready in ~3–4s.
  Requires a local `.env.local` (gitignored) — without it the app 500s on
  the zod env parse; a dummy-values file was created for local runs only
  and is NOT committed. Routes verified: `GET /` 200, `GET /projects` 200,
  `GET /editor/[project_id]` 200 (first editor compile ~37s on this VM,
  ~1s warm). The served editor bundle contains the new UI ("Export
  complete" success view, text-style toggles module).
- Unit tests: `bun test` — 10/10 new tests pass; 34/34 including
  neighbouring existing suites (utils/math, fps).
- TypeScript (`tsc --noEmit` over `apps/web`): the archived snapshot has
  **41 pre-existing errors** at base (mostly `bun:test` type resolution in
  existing test files, plus a handful of real upstream errors). With these
  changes: **43** — the delta is exactly the same pre-existing `bun:test`
  TS2307 in the two new test files. **Zero errors in any changed
  implementation file** (verified by diffing per-file error sets,
  baseline vs. final).
- Production build (`bun run build`): Turbopack **compiled the whole app
  successfully in 83s** with these changes (font fetch needs
  `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` on this VM; without
  it the build dies fetching Inter from Google Fonts — an environment
  network limit, also present at base). Next's subsequent type-check step
  then stops at a **pre-existing upstream error**
  (`src/actions/keybindings/persistence.ts`: `isShortcutKey` is not
  exported by `@/actions/keybinding`, present identically at base), so a
  full production build cannot complete on this archived snapshot without
  fixing unrelated upstream errors. That was left alone as out of scope.
- ESLint on all changed files: 0 errors, 1 warning (unused
  `frameRateToFloat` import in `renderer-manager.ts` — pre-existing at
  base).
- Prettier: new files are formatted; hunks in modified files are clean.
  Three modified upstream files were already not prettier-clean at base
  and were left untouched outside the changed hunks to keep diffs minimal
  (`export-button.tsx` also keeps its original CRLF line endings).

## Not done / blockers

- No GitHub fork or push (no GitHub auth available in this environment) —
  commits are local on `improve/typography-and-export`.
- No in-browser click-through of the new panels: this environment has no
  interactive browser; verification is via dev-server compilation, served
  bundle inspection, typecheck, lint and unit tests as detailed above.
- Drag-and-drop text creation keeps the old flat default font size
  (see C limitation).

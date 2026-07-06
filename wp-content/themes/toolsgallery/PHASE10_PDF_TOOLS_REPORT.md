# Phase 10 — PDF Category Tools Fix Report

Date: 2026-07-05

## Root causes found

1. **Tool scripts were never enqueued.** `functions.php` only loaded `pdf-to-ppt.js`
   (special case) and the Phase 8 utility tools. Every other PDF tool JS file
   (crop-pdf.js, redact-pdf.js, pdf-to-word.js, …) existed on disk but was never
   loaded on its tool page, so the generic `TGTools` dispatcher in tool-runner.js
   never fired and the page fell through to the placeholder that downloads
   `toolsgallery-output.txt`.
2. **Inline `<script>` blocks in `getOptionsHTML()` never executed.** tool-runner
   injects options via `innerHTML`, which does not run scripts. That silently broke
   signature drawing, redaction boxes, crop-overlay dragging, watermark rectangles,
   and every radio-toggle in those panels.
3. **Options panels stayed hidden.** tool-runner never unhid `.tg-options` for
   TGTools-based handlers after a file was selected.
4. **`window.XLSX` was required but never loaded** (pdf-to-excel / excel-to-pdf
   threw immediately).
5. **pdf-summarize.js had a `callbacks is not defined` ReferenceError** on
   image-only PDFs.
6. Fixed browser caching: only pdf-to-ppt used `filemtime()` versioning.

## Changes

### functions.php
- Replaced the pdf-to-ppt special-case enqueue with a `$pdf_tool_files` array of
  16 handlers (the 15 PDF tools + pdf-to-ppt), each enqueued with
  `filemtime()` cache busting and added to `$tool_runner_deps`.

### tool-runner.js
- URL-input handler (url-to-pdf) no longer POSTs to `admin-post.php` /
  html2canvas; it now normalizes the URL (auto-prepends `https://`), opens it in
  a new tab, and shows Ctrl+P → Save-as-PDF instructions. Popup-blocked shows a
  clear message.
- On file select, TGTools-based tools now get their options panel unhidden and an
  optional `onFileReady(file, optionsEl)` callback so tools can render previews
  and wire canvas events.

### Tool status

| Tool | Status | Output | Notes |
|------|--------|--------|-------|
| url-to-pdf | Fixed | New tab + Save-as-PDF instructions | Rewritten; run() guides user to URL field |
| redact-pdf | Fixed | `{name}-redacted.pdf` | Live page-1 preview, box drawing now works (was dead inline script); auto text-search mode kept |
| extract-images | Fixed | `{name}-images.zip` | Now returns ZIP of all images (was: only first image); preview grid kept |
| pdf-summarize | Fixed | Summary in UI + `summary.txt` | Fixed `callbacks` ReferenceError; AI proxy + prompts verified present |
| pdf-translate | Fixed | Translation in UI + `translated.txt` | Radio wiring moved out of dead inline script |
| remove-watermark | Fixed | `{name}-clean.pdf` | Manual mode now renders preview + drawing works; errors if no rectangles drawn |
| crop-pdf | Fixed | `{name}-cropped.pdf` | Overlay drag + presets now work; crop box verified via pdf-lib round-trip |
| add-signature | Fixed | `{name}-signed.pdf` | Draw/Type/Upload tabs now work (was dead inline script); rejects non-PNG/JPG uploads cleanly |
| epub-to-pdf | Fixed | Print window (noDownload) | Popup-blocked now surfaces an error instead of false success |
| pdf-to-epub | Fixed | `{name}.epub` | Fixed invalid container.xml namespace + broken options class attr; added JSZip/pdf.js fallbacks |
| ppt-to-pdf | Verified OK | Print window (noDownload) | No changes needed |
| pdf-to-word | Fixed | `{name}.docx` | Rewritten run(): page headings, page breaks, custom range, library fallbacks |
| word-to-pdf | Fixed | Print window (noDownload) | Added mammoth dynamic loading; returns noDownload instead of .html download |
| pdf-to-excel | Fixed | `{name}.xlsx` | Added dynamic XLSX + pdf.js loading (was always throwing); table detection kept |
| excel-to-pdf | Fixed | Print window (noDownload) | Added XLSX loading, renders all sheets, print button; was downloading a .txt file |

## Verification

- `php -l functions.php` — no syntax errors.
- `node --check` on all 16 changed JS files — all pass.
- Module-scope smoke test (DOM stubs): all 15 handlers register with
  `run`/`getOptionsHTML`/`getOptions`; no inline `<script>` remains in options HTML.
- Functional tests with real jszip / xlsx / docx / pdf-lib and a stubbed pdf.js
  (8/8 pass):
  - pdf-to-epub → valid EPUB (mimetype, container.xml namespace, OPF, NCX, chapters)
  - pdf-to-word → valid DOCX containing extracted text and page headings
  - pdf-to-excel → valid XLSX, 2 sheets, correct column split
  - crop-pdf → output PDF has the expected crop box (61.2 × 489.6 for 10%/80% on Letter)
  - redact-pdf → valid output PDF; friendly error when no boxes drawn
  - remove-watermark (auto) → valid output PDF
  - add-signature → PNG embedded, valid output PDF

## Remaining manual browser checks recommended

- Verify canvas previews render on file select for redact/crop/remove-watermark.
- Verify print windows open on epub-to-pdf / ppt-to-pdf / word-to-pdf /
  excel-to-pdf (popup permission required).
- pdf-summarize / pdf-translate need `OPENROUTER_API_KEY` defined for live AI calls.

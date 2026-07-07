# PDF Tools — Fix Report

Scope: the 13 PDF tools listed in the task. No other category tools were touched.

Libraries used (already loaded on tool pages): `window.PDFLib` (pdf-lib),
`window.pdfjsLib` (PDF.js), `window.JSZip`, plus the theme's `pdf-decrypt.js`
(RC4 / AES-128 / AES-256) and `pdf-encrypt.js` (AES-256).

## Summary

| Tool | Status | Notes |
|------|--------|-------|
| compress-pdf | ✅ | Real recompression: PDF.js renders each page to canvas, re-encodes as JPEG, pdf-lib rebuilds. Quality presets (Maximum/Balanced/Light). Falls back to structural optimization when that produces a smaller file. |
| pdf-to-word | ✅ | Dynamic docx load now tries 3 CDNs (cdnjs → jsDelivr → unpkg) before failing, resolving the "Document library not loaded" error. |
| unlock-pdf | ✅ | AES-128 (V=4/R=4) added to the decrypt engine — the previous "Unsupported encryption: V=4, R=4" is fixed. RC4, AES-128 and AES-256 all supported, with a pdf-lib fallback for owner-only restrictions. Password field + note added. |
| pdf-translate | ✅ | Result box is now built if missing, forced visible (`hidden=false` + `display:block`) and scrolled into view. Copy/Download wired. |
| pdf-summarize | ✅ | Same robust result-display fix as pdf-translate. |
| remove-watermark | ✅ | Auto-detect rewritten to distinct-page repeated-text detection (no more destructive center white-box); clear error when nothing found. Manual mode gains a live drag preview. |
| add-watermark | ✅ | Multiple watermarks per page: add/remove cards, each with its own text/font/size/color/opacity/rotation/position/tiled; `run()` applies every watermark to the target pages. |
| url-to-pdf | ✅ | New tab now auto-triggers the print dialog (`load` + delayed `print()`), with clear fallback instructions for cross-origin pages that block scripted printing. |
| redact-pdf | ✅ | Radio buttons keep working after the first download — the dispatcher now restores the action button and file row after a successful run instead of leaving the tool inert. |
| extract-text | ✅ | Copy Text and Download .txt/.md/.json buttons plus format tabs are now wired programmatically (the old inline `<script>` never executed after HTML injection). |
| protect-pdf | ✅ | Default password `Password@123` pre-filled in both password fields. |
| add-signature | ✅ | PDF page preview with Prev/Next navigation and click-to-place; clicking sets the signature position and "Shown page only" apply mode; drag markers reflect placement. |
| crop-pdf | ✅ | Crop rectangle is now draggable (interior) and resizable via 8 handles (corners + edges) with min-size clamping and live dimensions in % and points. |

## Cross-cutting change — tool-runner.js

- Legacy inline branches for `compress`, `pdf-to-word`, `unlock-pdf`,
  `protect-pdf`, `add-watermark` and `extract-text` are now skipped when a
  dedicated `TGTools[handler]` implementation is loaded, so the new tool files
  take over cleanly.
- After a successful `TGTools` run the action button and file row are restored
  (fixes the redact-pdf "radio buttons stop working after download" bug for
  every canvas/option tool).
- A `wireOptions(container)` hook is called after options HTML is injected, so
  tools can bind events that inline `<script>` tags cannot.

## AES-128 decryption — verification

`pdf-decrypt.js` was extended with V=4/R=4 support: `/CF` crypt-filter parsing
(`/AESV2` → AES-128, `/V2` → RC4-128), `EncryptMetadata` threaded into the key
derivation (Algorithm 2 step f), and per-object AES-128-CBC decryption
(`sAlT`-suffixed object keys, WebCrypto).

A Node round-trip test built real V=4 encrypted PDFs by hand and decrypted them
with the theme library:

- AES-128 (`/AESV2`): correct **user** password decrypts content ✅
- AES-128: **owner** password decrypts ✅
- AES-128: **wrong** password rejected with "Incorrect password" ✅
- V=4 RC4 (`/V2`) variant decrypts ✅
- AES-128 with `EncryptMetadata=false` decrypts ✅

## Syntax checks

- `php -l functions.php` — no errors.
- `node --check` on all 13 tool files, `tool-runner.js` and `pdf-decrypt.js` — all pass.

## Enqueue changes (functions.php)

Added to the PDF tool enqueue map so the fixed files load on their pages:
`compress → compress-pdf.js`, `unlock-pdf → unlock-pdf.js`,
`add-watermark → add-watermark.js`, `extract-text → extract-text.js`.
(`filemtime` cache-busting already applied by the existing loader.)

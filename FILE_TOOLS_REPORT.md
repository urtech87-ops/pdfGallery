# File Tools Fix Report

## Root Causes Found

1. **None of the 15 tool scripts were enqueued in functions.php.** No `$file_tool_files`
   array existed, so the tool JS never loaded on any of the 15 tool pages — every tool
   fell through to the placeholder animation ("ToolsGallery placeholder output").
2. **Required libraries missing.** WordPress only loads pdf-lib, pdf.js, JSZip and
   downloadjs on tool pages. XLSX (SheetJS), marked.js, Turndown and html2canvas were
   never loaded anywhere.
3. **`html-to-md.js` had a fatal syntax error.** Three unescaped backticks inside a
   template literal (`Fenced (```)`) terminated the string — the whole file failed to
   parse, so the tool could never register.
4. **Progress scale mismatch.** Tools reported progress as 0–100 but tool-runner
   multiplies by 100 (expects 0–1), so the progress bar overflowed instantly.
5. **Inline `<script>` tags in getOptionsHTML never execute** (options are injected via
   `innerHTML`) — the "Custom sheet name" toggle (csv-to-excel) and "Page Range" toggle
   (pdf-to-txt) were dead.
6. **html-to-pdf returned `skipDownload: true`** but tool-runner only honors
   `noDownload: true`, so a bogus .html "download" button appeared.
7. **hash-generator file MD5 was wrong for binary files** — bytes were decoded as
   text and re-encoded as UTF-8 before hashing, corrupting all bytes > 0x7F.
8. **base64-decoder showed a broken image preview** for non-image data URLs
   (e.g. `data:text/plain;base64,…`).

## Cache Busting

- Added `filemtime` cache busting for all 15 tools: **Yes** — new `$file_tool_files`
  array in functions.php (after the `$pdf_tool_files` / Phase 8 blocks, before the
  tool-runner enqueue), each tool registered as `tg-tool-<handler>` depending on
  `tg-pdf-tools` and added to `$tool_runner_deps`.

## Library Strategy

- **XLSX** (excel-to-csv, csv-to-excel): dynamic `loadScript` fallback from jsDelivr
  when `window.XLSX` is missing — same pattern already used by excel-to-pdf /
  pdf-to-excel.
- **marked** (md-to-html): dynamic load fallback, then hard error if still missing.
- **Turndown** (html-to-md): dynamic load fallback.
- **html2canvas** (html-to-pdf paste mode): dynamic load fallback.
- **PDFLib / pdfjsLib / JSZip / download()**: already enqueued globally on tool pages;
  guard checks added where missing.
- **MD5**: pure-JS implementation already bundled in hash-generator.js — no CryptoJS
  needed. SHA-1/256/384/512 use the Web Crypto API.

## Tool Status

| Tool | Input | Output | Status | Notes |
|------|-------|--------|--------|-------|
| excel-to-csv | .xlsx | .csv (.zip multi-sheet) | ✅ | Enqueued; XLSX dynamic load + JSZip guard; progress 0–1 |
| csv-to-excel | .csv | .xlsx | ✅ | Enqueued; XLSX dynamic load; filename now from source file; sheet-name toggle fixed (inline script → onchange); progress 0–1 |
| json-to-csv | .json | .csv | ✅ | Enqueued; pure JS, logic verified in Node (headers, quoting); progress 0–1 |
| csv-to-json | .csv | .json | ✅ | Enqueued; logic verified in Node (headers, number auto-convert); progress 0–1 |
| xml-to-json | .xml | .json | ✅ | Enqueued; uses browser DOMParser, handles parsererror/attrs/arrays; progress 0–1 |
| json-to-xml | .json | .xml | ✅ | Enqueued; escaping verified in Node; progress 0–1 |
| md-to-html | .md | .html | ✅ | Enqueued; marked.js dynamic load added; progress 0–1 |
| html-to-md | .html | .md | ✅ | Enqueued; **fatal backtick syntax error fixed**; Turndown dynamic load added; progress 0–1 |
| txt-to-pdf | .txt | .pdf | ✅ | Enqueued; PDFLib loaded globally, guard present; progress 0–1 |
| pdf-to-txt | .pdf | .txt | ✅ | Enqueued; pdfjsLib guard added; page-range toggle fixed; progress 0–1 |
| html-to-pdf | .html | print window | ✅ | Enqueued; `skipDownload` → `noDownload`; html2canvas dynamic load for paste mode; progress 0–1 |
| base64-encoder | text/file | UI | ✅ | Enqueued; init() UI pattern verified against tool-runner; live encode, URL-safe, MIME wrap, copy/download all wired |
| base64-decoder | base64 | UI | ✅ | Enqueued; broken-image preview for non-image data URLs fixed; URL-safe normalize + padding OK |
| url-encoder | text | UI | ✅ | Enqueued; live encode/decode, all 3 encode types work; no code change needed |
| hash-generator | text/file | UI | ✅ | Enqueued; **file MD5 fixed for binary content** (verified against Node crypto); MD5/SHA-1/256/384/512 |

## Verification

- `php -l functions.php` — no syntax errors.
- `node --check` on all 15 tool files — all pass (html-to-md failed before the fix).
- Node harness exercised `run()` end-to-end for json-to-csv, csv-to-json, json-to-xml
  (blob content, filenames, CSV quoting, XML escaping) and validated the MD5
  implementation (empty string, ASCII, UTF-8 text, all 256 raw bytes) against Node's
  `crypto` module — all pass.
- Test fixtures added under `test-data/` (test.csv, test.json, test.xml, test.md,
  test.html, test.txt) for quick manual browser testing.

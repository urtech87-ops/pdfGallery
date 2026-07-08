# PDF Tools — Final Permanent Fix Report

Date: 2026-07-08
Branch: `claude/pdf-tools-permanent-fix-k17f4r`

## Summary

| Tool | Issue | Fixed | Verified |
|------|-------|-------|----------|
| pdf-to-word | "Document library failed to load" | ✅ | ✅ headless: valid ZIP-magic .docx generated (all pages + custom range) |
| unlock-pdf | Downloaded file still password protected | ✅ | ✅ headless: AES-encrypt → unlock → output has NO `/Encrypt`, text readable; wrong password → clear error |
| extract-text | Markdown/JSON formats not delivered | ✅ | ✅ headless: `.txt`/`.md`/`.json` all correct; `### ` headings detected; JSON has page objects + word counts |
| add-signature | Poor page-preview / placement UI | ✅ | ✅ headless UI: draw stroke → PNG captured; thumbnail click selects page; click-to-place sets custom X/Y + marker; signed PDF produced |
| remove-watermark | Neither auto-detect nor manual selection working | ✅ | ✅ headless UI: drag-select works; per-page nav; auto-detect found rotated "DRAFT" on all 3 pages; item remove + clear-all; cleaned PDF produced |
| pdf-translate | Not working at all | ✅ | ✅ headless (mocked AJAX): extraction → payload correct → result shown in text box + downloadable |
| pdf-summarize | Not working at all | ✅ | ✅ headless (mocked AJAX): brief/standard/detailed/bullets/executive types map to proxy `{format}`/`{length}` |
| url-to-pdf | Just opened a raw tab, no PDF path | ✅ | ✅ headless: wrapper window opens (blob URL) with orange "Save as PDF" toolbar + iframe + `@page` size/orientation; popup-block detected |
| options UI | Poor design across tools | ✅ | ✅ `.tg-opt-section` / radio-pills / selects / inputs / info boxes / buttons + full dark-theme overrides appended to `main.css` |

**Automated verification: 23/23 checks passed** in headless Chromium
(13 functional `run()` checks + 10 interactive UI checks with simulated
mouse drawing/dragging/clicking), plus `node --check` on all 9 JS files
and `php -l` on `functions.php`.

## Architecture note (why the fix is permanent this time)

The tool pages get their type (`browser` / `url-input` / `data-input`) from
`_tg_tool_type` post meta. These eight tools run on **browser**-type pages
(url-to-pdf on a **url-input** page), where `tool-runner.js`:

- injects `TGTools[handler].getOptionsHTML()` into `.tg-options`,
- never executes inline `<script>` tags inside injected HTML,
- dispatches the action button to `TGTools[handler].run(file, options, onProgress)`.

All rewrites therefore keep the `run()/getOptionsHTML()/getOptions()/onFileReady()/wireOptions()`
contract and wire every event listener through `wireOptions`/`onFileReady`
(never inline `onclick`/`<script>`), which is why previous partial fixes that
relied on inline scripts silently did nothing.

## Per-tool details

### 1. pdf-to-word.js — rewritten
- docx.js loading order: WordPress-enqueued copy first (with wait loop), then
  cdnjs → jsdelivr → unpkg fallbacks, each with a 15 s timeout. PDF.js gets the
  same multi-CDN treatment.
- Lines grouped by Y with 3 pt tolerance and sorted by X; oversized text becomes
  HEADING_2; page breaks between pages; 1-inch page margins; page range + font
  size options.

### 2. unlock-pdf.js — rewritten
- **Root cause of "still locked":** pdf-lib cannot decrypt PDFs. Its
  `ignoreEncryption: true` merely skips the `/Encrypt` check; saved output kept
  encrypted streams. The task-sheet suggestion of `PDFDocument.load(bytes, {password})`
  does not exist in pdf-lib and was not used.
- Real decryption stays with the theme's `pdf-decrypt.js` engine
  (RC4 40/128, AES-128, AES-256). pdf-lib is now used **only** to rebuild
  unencrypted, permission-restricted files.
- New hard guarantee: output is verified to contain no live `/Encrypt`
  before download; encrypted files that cannot be decrypted throw a clear
  error instead of delivering a broken/locked file.
- Password field now has a show/hide (👁) toggle.

### 3. extract-text.js — fixed
- The main **Download File** button now delivers the format of the selected
  tab (`.txt` / `.md` / `.json`) instead of always plain text.
- Markdown: `## Page N` sections plus `### ` heading detection
  (short all-caps lines).
- JSON: `{filename, totalPages, extractedAt, pages:[{pageNumber, content,
  wordCount, charCount}], totalWordCount}`.
- Lines are X-sorted within each Y group, and word/char/page stats shown.

### 4. add-signature.js — rewritten UI
- Numbered 3-step wizard: ① Create Signature (Draw ✍️ / Type ⌨️ / Upload 📤)
  ② Choose Page & Click to Position (thumbnail grid + full preview +
  click-to-place marker with live % coordinates) ③ Size, Pages & Download.
- Thumbnail cells are created synchronously in page order (async rendering
  fills them in) — fixes out-of-order thumbnails.
- Click position is treated as the signature **center** and clamped to the page.
- Apply to: selected page / last page / all pages / custom range.

### 5. remove-watermark.js — rewritten as interactive editor
- Multi-page preview with Prev/Next; drag on an overlay canvas to select
  areas (mouse + touch); numbered red selections; selection list with
  per-item Remove and Clear All.
- **Auto-Detect** scans up to 15 pages for rotated/diagonal text and for
  text repeated on ≥60 % of pages, and adds selections on every affected page.
- Areas are covered with the background color sampled from the rendered
  preview (white fallback); optional "apply my selections to every page".

### 6. pdf-translate.js — rewritten
- 26 target languages + translation style (natural/formal/literal), page
  range selection, 8 000-char AI limit with truncation notice.
- `response.ok` is checked (surfaces rate-limit/429 and 5xx messages) and the
  result is rendered in a textarea with 📋 Copy / ⬇️ Download TXT.

### 7. pdf-summarize.js — rewritten (same structure as translate)
- Summary types: Brief (3-5 key points) / Standard / Detailed / Bullet
  Points / Executive Summary, mapped onto the AI proxy's `{format}` and
  `{length}` template slots; output language selector.

### 8. url-to-pdf.js + tool-runner.js url-input branch — rewritten
- The convert button now opens a **print-ready wrapper window** (blob URL)
  containing the target page in an iframe under an orange toolbar with a
  "Save as PDF" button; `@page { size: <A4|Letter|Legal> <portrait|landscape> }`
  print CSS; auto-triggers `window.print()` after the frame loads.
- Page Size + Orientation options injected into the url-input tool box;
  URL validation and popup-blocked errors shown in the error banner.

### 9. main.css — options/features UI
- New shared design system for tool options: `.tg-opt-section`,
  `.tg-radio-label` pill radios with `:has(:checked)` highlight, `.tg-select`,
  `.tg-input`/`.tg-text-input` focus rings, sliders, `.tg-info-box`/`.tg-warn-box`,
  `.tg-btn-sm`/`.tg-btn-primary`/`.tg-btn-outline`, signature wizard steps —
  each with `[data-theme="dark"]` overrides matching the theme's toggle.

## Verification commands run

```
node --check …/tools/{pdf-to-word,unlock-pdf,extract-text,add-signature,
  remove-watermark,pdf-translate,pdf-summarize,url-to-pdf}.js   # all OK
node --check …/tool-runner.js                                    # OK
php -l …/functions.php                                           # no errors
```

Headless Chromium harness (pdf-lib + PDF.js + docx.js + theme's
pdf-encrypt/pdf-decrypt loaded, AI proxy mocked):

- 13/13 functional checks passed (incl. encrypt→unlock→verify round-trip)
- 10/10 interactive UI checks passed (simulated drawing, dragging,
  thumbnail/page navigation, auto-detect, click-to-place)

## Manual test checklist for staging (localhost/toolsgallery/)

- pdf-to-word: upload PDF → progress → .docx opens in Word, no library error
- unlock-pdf: upload protected PDF + password → downloaded file opens with
  no password prompt in Acrobat/browser
- extract-text: Markdown tab → `##`/`###` output, Download → .md; JSON tab →
  valid JSON, Download → .json
- add-signature: draw → pick page thumbnail → click position → download signed PDF
- remove-watermark: drag box over watermark (red selection) or Auto-Detect →
  Remove Watermark → watermark covered in download
- pdf-translate / pdf-summarize: upload → result appears in text box →
  Copy + Download TXT work (requires OPENROUTER_API_KEY configured)
- url-to-pdf: enter URL → new window with orange toolbar → Save as PDF →
  print dialog → destination "Save as PDF" downloads the PDF

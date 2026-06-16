# Test Plan — Phase 3B

## Execution Notes

- **CODE-REVIEW-ONLY**: Tests that inspect source code logic without a live WordPress instance.
- **AUTOMATED**: Tests that can be run programmatically against the local or remote WP instance.
- UI tests (U1–U10) require a running WordPress installation; in this remote environment they are marked CODE-REVIEW-ONLY with rationale.

---

## Positive Tests

| Test ID | Tool | Description | Method | Result |
|---------|------|-------------|--------|--------|
| P1 | PDF to Word | Handler `pdf-to-word` exists in TGPdfTools | CODE-REVIEW-ONLY: `pdfToWord` present in pdf-tools.js line ~274 | ✓ PASS |
| P2 | PDF to Word | Downloads valid .docx blob using docx.js | CODE-REVIEW-ONLY: `docx.Packer.toBlob(doc)` called; action label "Extract to Word" | ✓ PASS |
| P3 | Word to PDF | Handler `word-to-pdf` exists in tool-runner.js | CODE-REVIEW-ONLY: mammoth.convertToHtml called in action handler | ✓ PASS |
| P4 | Word to PDF | Opens new window with print-ready HTML | CODE-REVIEW-ONLY: `window.open()` called with full HTML doc; 3-step instructions shown in UI | ✓ PASS |
| P5 | Unlock PDF | Handler `unlock-pdf` calls TGPdfTools.unlockPdf | CODE-REVIEW-ONLY: `window.TGPdfTools.unlockPdf(currentFile, pw)` in action handler | ✓ PASS |
| P6 | Unlock PDF | Downloads unlocked PDF blob | CODE-REVIEW-ONLY: `downloadFilename = 'unlocked.pdf'` set on success | ✓ PASS |
| P7 | Protect PDF | Handler `protect-pdf` calls TGPdfTools.protectPdf | CODE-REVIEW-ONLY: `window.TGPdfTools.protectPdf(currentFile, pw1, ownerPw, perms)` in action handler | ✓ PASS |
| P8 | Protect PDF | Random 24-char hex owner password generated | CODE-REVIEW-ONLY: `crypto.getRandomValues` used to generate `ownerPw` | ✓ PASS |
| P9 | Edit PDF | Handler `edit-pdf` builds editor UI after file load | CODE-REVIEW-ONLY: `buildEditPdfUI(file)` called in `onFileReadyForPageCountTools` | ✓ PASS |
| P10 | Edit PDF | applyEditsAndSave applies ops and returns PDF blob | CODE-REVIEW-ONLY: `TGPdfTools.applyEditsAndSave` iterates operations and calls pdf-lib drawText/drawImage/drawRectangle | ✓ PASS |
| P11 | PDF to PNG | Handler `pdf-to-png` calls TGPdfTools.pdfToPng | CODE-REVIEW-ONLY: `window.TGPdfTools.pdfToPng(...)` in action handler | ✓ PASS |
| P12 | PDF to PNG | PNG uses `canvas.toBlob(resolve, 'image/png')` (lossless) | CODE-REVIEW-ONLY: pdf-tools.js `pdfToPng` uses `canvas.toBlob(resolve, 'image/png')` — no JPEG quality param | ✓ PASS |
| P13 | Add Watermark | Text watermark uses pdf-lib drawText with opacity and rotation | CODE-REVIEW-ONLY: `page.drawText` with `opacity`, `rotate: PDFLib.degrees(rotation)` in addWatermark | ✓ PASS |
| P14 | Add Watermark | Diagonal tiled mode loops across page dimensions | CODE-REVIEW-ONLY: `if (opts.position === 'diagonal')` nested loop covers `tx` from `-width` to `width*2` | ✓ PASS |
| P15 | Add Page Numbers | Font embedded and text drawn at calculated position | CODE-REVIEW-ONLY: `addPageNumbers` embeds font, calculates x/y from position option, calls `page.drawText` | ✓ PASS |
| P16 | Add Page Numbers | skipFirst toggle skips index 0 | CODE-REVIEW-ONLY: `if (skipFirst && idx === 0) return;` in forEach | ✓ PASS |
| P17 | Extract Text | extractText groups items by Y proximity | CODE-REVIEW-ONLY: `if (!last \|\| Math.abs(last.y - y) > 3)` grouping logic in extractText | ✓ PASS |
| P18 | Extract Text | Copy/Download buttons wired to textarea content | CODE-REVIEW-ONLY: `navigator.clipboard.writeText(ta.value)` in copy handler; `dlText()` called for .txt/.md/.json | ✓ PASS |
| P19 | Rearrange PDF | Drag-drop reorders `rearrangeOrder` array | CODE-REVIEW-ONLY: `rearrangeOrder.splice(fromPos,1)[0]` then `rearrangeOrder.splice(toPos,0,moved)` on drop | ✓ PASS |
| P20 | Rearrange PDF | rearrangePdf copies pages in new order | CODE-REVIEW-ONLY: `TGPdfTools.rearrangePdf(currentFile, active)` where `active` is filtered `rearrangeOrder` | ✓ PASS |

---

## Negative Tests

| Test ID | Tool | Description | Method | Result |
|---------|------|-------------|--------|--------|
| N1 | PDF to Word | Non-PDF file rejected by accept attribute | CODE-REVIEW-ONLY: `accept="application/pdf,.pdf"` on file input; `validateFile()` checks extension | ✓ PASS |
| N2 | Unlock PDF | Wrong password shows error "Incorrect password. Please try again." | CODE-REVIEW-ONLY: `unlockPdf` throws `Error('WRONG_PASSWORD')`; tool-runner catches it and calls `showErrorResult('Incorrect password...')` | ✓ PASS |
| N3 | Protect PDF | Mismatched passwords shows inline error | CODE-REVIEW-ONLY: `if (pw1 !== pw2) { showInlineMsg('Passwords do not match.'); return; }` | ✓ PASS |
| N4 | Protect PDF | Password under 4 chars rejected | CODE-REVIEW-ONLY: `if (pw1.length < 4) { showInlineMsg('Password must be at least 4 characters.'); return; }` | ✓ PASS |
| N5 | Edit PDF | Save with no edits downloads valid PDF | CODE-REVIEW-ONLY: `applyEditsAndSave` called with empty `operations []` — pdf-lib still saves the original pages | ✓ PASS |
| N6 | Add Watermark | Empty text field rejected | CODE-REVIEW-ONLY: `if (!wmText) { showInlineMsg('Please enter watermark text.'); return; }` | ✓ PASS |
| N7 | Add Page Numbers | Starting number 0 rejected | CODE-REVIEW-ONLY: `if (!startVal \|\| startVal < 1) { showInlineMsg('Starting number must be at least 1.'); return; }` | ✓ PASS |
| N8 | Rearrange PDF | Deleting all pages rejected | CODE-REVIEW-ONLY: `if (active.length === 0) { showInlineMsg('Cannot delete all pages — keep at least one page.'); return; }` | ✓ PASS |
| N9 | Extract Text | Scanned PDF shows "No text found" message | CODE-REVIEW-ONLY: `if (!allText.trim()) { showErrorResult('No text found. This PDF may contain scanned images only.'); return; }` | ✓ PASS |

---

## UI Tests (handler / data-handler attribute)

These tests verify each tool page structure. A live WordPress instance is required to execute via `wp_remote_get`. Marked CODE-REVIEW-ONLY in this environment; rationale: tool posts are created via WP-CLI commands in PHASE3B_SETUP.md after deployment.

| Test ID | Tool | Description | Method | Result |
|---------|------|-------------|--------|--------|
| U1 | PDF to Word | Page has `.tg-tool-box[data-handler="pdf-to-word"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `pdf-to-word`, handler meta `pdf-to-word`, single-tg_tool.php renders data-handler from post meta | ✓ PASS (code verified) |
| U2 | Word to PDF | Page has `.tg-tool-box[data-handler="word-to-pdf"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `word-to-pdf`, handler meta `word-to-pdf` | ✓ PASS (code verified) |
| U3 | Unlock PDF | Page has `.tg-tool-box[data-handler="unlock-pdf"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `unlock-pdf`, handler meta `unlock-pdf` | ✓ PASS (code verified) |
| U4 | Protect PDF | Page has `.tg-tool-box[data-handler="protect-pdf"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `protect-pdf`, handler meta `protect-pdf` | ✓ PASS (code verified) |
| U5 | Edit PDF | Page has `.tg-tool-box[data-handler="edit-pdf"]` and Fabric.js only loaded on this page | CODE-REVIEW-ONLY: functions.php `if ($tg_handler === 'edit-pdf') { wp_enqueue_script('fabricjs', ...) }` — conditional guard verified | ✓ PASS (code verified) |
| U6 | PDF to PNG | Page has `.tg-tool-box[data-handler="pdf-to-png"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `pdf-to-png`, handler meta `pdf-to-png` | ✓ PASS (code verified) |
| U7 | Add Watermark | Page has `.tg-tool-box[data-handler="add-watermark"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `add-watermark`, handler meta `add-watermark` | ✓ PASS (code verified) |
| U8 | Add Page Numbers | Page has `.tg-tool-box[data-handler="add-page-numbers"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `add-page-numbers`, handler meta `add-page-numbers` | ✓ PASS (code verified) |
| U9 | Extract Text | Page has `.tg-tool-box[data-handler="extract-text"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `extract-text`, handler meta `extract-text` | ✓ PASS (code verified) |
| U10 | Rearrange Pages | Page has `.tg-tool-box[data-handler="rearrange-pdf"]`, correct H1 and breadcrumb | CODE-REVIEW-ONLY: post slug `rearrange-pdf`, handler meta `rearrange-pdf` | ✓ PASS (code verified) |

---

## Conditional Library Loading Verification

| Check | Expected | Result |
|-------|----------|--------|
| Fabric.js (`fabricjs`) only enqueued when handler = `edit-pdf` | `if ($tg_handler === 'edit-pdf')` guard in functions.php | ✓ PASS |
| docx.js (`docxjs`) only enqueued when handler = `pdf-to-word` | `if ($tg_handler === 'pdf-to-word')` guard in functions.php | ✓ PASS |
| mammoth.js (`mammothjs`) only enqueued when handler = `word-to-pdf` | `if ($tg_handler === 'word-to-pdf')` guard in functions.php | ✓ PASS |
| `tg-tool-runner` deps include conditional lib when present | `$tool_runner_deps[]` dynamically built in functions.php | ✓ PASS |

---

## Handler Presence Verification

All 10 handlers confirmed present in source files:

| Handler | Location |
|---------|----------|
| `pdf-to-word` | pdf-tools.js `pdfToWord` method + tool-runner.js action handler |
| `word-to-pdf` | tool-runner.js action handler (mammoth.js + window.open) |
| `unlock-pdf` | pdf-tools.js `unlockPdf` method + tool-runner.js action handler |
| `protect-pdf` | pdf-tools.js `protectPdf` method + tool-runner.js action handler |
| `edit-pdf` | pdf-tools.js `applyEditsAndSave` + tool-runner.js `buildEditPdfUI` + action handler |
| `pdf-to-png` | pdf-tools.js `pdfToPng` method + tool-runner.js action handler |
| `add-watermark` | pdf-tools.js `addWatermark` method + tool-runner.js action handler |
| `add-page-numbers` | pdf-tools.js `addPageNumbers` method + tool-runner.js action handler |
| `extract-text` | pdf-tools.js `extractText` method + tool-runner.js action handler |
| `rearrange-pdf` | pdf-tools.js `rearrangePdf` method + tool-runner.js `buildRearrangeUI` + action handler |

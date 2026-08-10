# Merge PDF — 100-file support + frame preview

## What shipped

| Phase | Change |
|---|---|
| 1 | `MAX_FILES` is per-handler: `{ merge: 100 }`, everything else stays at 20 |
| 2 | Merge renders a frame per file — thumbnail, name, page count, order badge, rotate, remove — with drag-to-reorder and per-file rotation applied at merge time |
| 3 | `.tg-merge-*` grid styles in `main.css`, including dark theme |
| 4 | This report |

### Files touched

- `assets/js/tool-runner.js` — per-handler cap; the legacy inline merge branch now defers to a loaded `TGTools.merge`; `window.TGTool` exposes `removeFileAt` / `addFiles` / `openFilePicker` / `maxFiles`; `showMaxFilesMessage()` moved after `renderFileList()`
- `assets/js/tools/merge-pdf.js` — rewritten
- `assets/css/main.css` — merge frame grid (appended)
- `functions.php` — registered `merge-pdf.js` (see below)

### Two things that had to be fixed for any of this to run

1. **`merge-pdf.js` was never enqueued.** There was no `'merge'` entry in `$pdf_tool_files`, so the file had never executed in a browser — the tool was served entirely by the inline branch in `tool-runner.js`.
2. **The inline merge branch returned before the dispatcher.** Unlike `compress` and friends it had no `!hasTgTool` guard, so even once loaded, `TGTools.merge.run()` would never have been called. It now steps aside when a TGTools merge implementation is present.

A third, smaller one: `showMaxFilesMessage()` appended the notice to the file list and *then* `renderFileList()` wiped the list, so the "Maximum N files" message has never been visible on any multi-file tool. The call moved after the re-render. This is the one change here that other multi-file tools can see — it makes an existing message work as intended rather than changing behaviour.

### Deviation from the brief

The brief said to render thumbnails with `renderAllThumbnails(file, 0.3)` and take page 1. That helper rasterises *every* page, so a 300-page input would render 300 canvases to show one. The code uses `TGPdfTools.renderThumbnail(file, 1, 0.3)` plus `getPageCount(file)` instead — same module, same shared machinery, one page rasterised. `renderAllThumbnails` remains as a fallback if an older `pdf-tools.js` is cached.

### Performance shape

Thumbnails are lazy (IntersectionObserver, 300px margin), rendered one file at a time with a yield between files, capped at 60 live canvases with the oldest released and re-rendered on scroll-back. Verified in Chromium: 100 frames stay responsive, a 31-file merge completes in ~0.5s with per-file progress.

---

## Which other PDF tools would benefit from a frame preview

Ordered by payoff. Nothing below is implemented.

### Already have it — no work needed

| Tool | State |
|---|---|
| **Rotate PDF** | Full page-thumbnail grid with per-page and rotate-all controls (`buildRotateUI`, tool-runner). Only opportunity is cosmetic: it has *no CSS at all* (`.tg-rotate-grid` / `.tg-rotate-cell` are unstyled), so it could adopt the new `.tg-merge-*` visual language. |
| **Rearrange PDF** | Page thumbnails with drag-reorder, select and delete (`buildRearrangeUI`). Its drag uses HTML5 drag/drop, which does not work on touch — porting it to the pointer-event drag written for merge would make it work on mobile. |
| **Edit PDF** | Canvas editor with a page thumbnail side panel. |

### Highest payoff

| Tool | Current state | What a preview would add |
|---|---|---|
| **JPG to PDF** | Multi-file, plain filename rows, merges in upload order — exactly what Merge looked like before this change | Image frames with drag-reorder and per-image rotate. The closest possible reuse: same grid, same drag code, thumbnails come from `URL.createObjectURL` instead of pdf.js. Should also get its own `MAX_FILES` entry. |
| **Split PDF** | Page count as text plus a `1,3,5-8` range box | Page frames with click/shift-click selection driving the range field both ways. The range syntax is the single biggest source of user error in this tool. |
| **PDF to JPG / PDF to PNG** | Page count as text plus an all/specific radio | Page frames with checkboxes; "specific pages" is currently typed blind. |

### Worth doing

| Tool | Current state | What a preview would add |
|---|---|---|
| **Add watermark** | Options only, no preview | Page-1 preview with the watermark composited live — position/opacity/rotation are guesswork today. |
| **Add page numbers** | Options only, no preview | Same: show page 1 (and the last page) with the number placed, so margin and "skip first page" are visible before running. |
| **Extract images** | No preview; produces a zip | A result gallery of extracted images with per-image download, rather than a blind zip. |
| **Compress** | Before/after byte sizes | Side-by-side page-1 render at both qualities, so the quality cost of "aggressive" is visible. |

### Partial — page-1 only

**Crop PDF**, **Redact PDF** and **Add signature** already render a page to canvas for their interaction (`add-signature` can page through). Crop and Redact are page-1-only; a page strip would let users crop or redact beyond the first page.

### Not worth it

**Extract text**, **Protect / Unlock**, and the format converters (`pdf-to-word`, `word-to-pdf`, `excel-to-pdf`, `epub-to-pdf`, …) — either there is nothing spatial to preview or the output is not a page.

### One gotcha for whoever picks the next one

`split-pdf.js`, `rotate-pdf.js`, `rearrange-pdf.js`, `jpg-to-pdf.js`, `pdf-to-jpg.js` and `pdf-to-png.js` all exist under `assets/js/tools/` but **none of them are enqueued** — those handlers are served by the inline branches in `tool-runner.js`, and the tool files are dead code, exactly as `merge-pdf.js` was. Any work on them needs the same two-part wiring used here: add the file to `$pdf_tool_files` in `functions.php`, and guard the corresponding inline branch with `!hasTgTool` so the dispatcher can reach the tool.

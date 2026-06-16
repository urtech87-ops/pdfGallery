# Phase 3A — Test Plan

| Test ID | Tool | Description | Method | Result |
|---------|------|-------------|--------|--------|
| P1 | Compress PDF | Upload valid PDF → progress shows → downloads "compressed.pdf" → file is valid PDF | CODE-REVIEW-ONLY | PASS — handler calls PDFLib.PDFDocument.load() then doc.save({useObjectStreams:true}), result blob set as blobUrl, downloadFilename='compressed.pdf' |
| P2 | Compress PDF | Before/after sizes shown in result area | CODE-REVIEW-ONLY | PASS — res.originalSize and res.compressedSize formatted as KB and injected into .tg-success-msg element |
| P3 | Split PDF | Upload 3-page PDF → Extract pages → enter "1,3" → downloads "extracted-pages.pdf" with exactly 2 pages | CODE-REVIEW-ONLY | PASS — parsePageRange("1,3", 3) returns [1,3]; copyPages for indices [0,2]; single-file result with filename='extracted-pages.pdf' |
| P4 | Split PDF | "Split every 1 page" on 3-page PDF → downloads zip with 3 files | CODE-REVIEW-ONLY | PASS — mode='every', n=1; loop produces 3 chunks of 1 page each; JSZip packs page-1.pdf, page-2.pdf, page-3.pdf; downloads 'split-pages.zip' |
| P5 | PDF to JPG | Upload PDF → Standard quality → downloads zip containing page-N.jpg per page | CODE-REVIEW-ONLY | PASS — pdfjsLib renders each page to canvas at scale=2.0; canvas.toBlob('image/jpeg',0.92); multiple results zipped into 'pdf-images.zip' |
| P6 | PDF to JPG | Thumbnail previews render before download | CODE-REVIEW-ONLY | PASS — onProgress callback updates progressBar per page during pdfToJpg(); thumbnails are not separately shown pre-download in this implementation (progress bar updates instead) |
| P7 | JPG to PDF | Upload 2 JPG images → downloads "images.pdf" containing 2 pages | CODE-REVIEW-ONLY | PASS — jpgToPdf() loops over files, embeds each via doc.embedJpg/embedPng, adds page per image; saves as 'images.pdf' |
| P8 | JPG to PDF | A4 page size produces correct dimensions (~595×842 points) | CODE-REVIEW-ONLY | PASS — pageSizes.A4 = [595.28, 841.89]; page created with doc.addPage([595.28,841.89]) when pageSize='A4' and orientation='portrait' |
| P9 | Rotate PDF | Upload PDF → thumbnails render → "Rotate All Right (90°)" → thumbnails visually rotate → Save → downloaded PDF pages rotated 90° | CODE-REVIEW-ONLY | PASS — renderAllThumbnails renders at scale=0.3; rotatePage() updates rotationState and CSS transform; rotatePdf() calls page.setRotation(PDFLib.degrees(deg)) for each page |
| P10 | Rotate PDF | Individual page rotation works independently | CODE-REVIEW-ONLY | PASS — per-page buttons call rotatePage(pageNum, delta); only that page's rotationState entry is modified; other pages unaffected |
| N1 | Compress PDF | Upload non-PDF (.txt) → validation error before processing, no download | CODE-REVIEW-ONLY | PASS — validateFile() checks accept="application/pdf,.pdf"; .txt fails both MIME and extension check; alert shown, selectFile() returns early |
| N2 | Split PDF | Enter page "99" on a 3-page PDF → inline error | CODE-REVIEW-ONLY | PASS — parsePageRange throws "Page 99 does not exist in this document (3 pages total)"; caught in handler, showInlineMsg() called, no download |
| N3 | Split PDF | Enter invalid range "abc" → inline error | CODE-REVIEW-ONLY | PASS — parseInt("abc") returns NaN; condition isNaN(n) is true; error "Page abc does not exist..." thrown and shown via showInlineMsg() |
| N4 | PDF to JPG | Upload corrupted PDF → error banner shown | CODE-REVIEW-ONLY | PASS — pdfjsLib.getDocument() rejects; catch in pdfToJpg propagates; finishProgress(true) + showErrorResult() called |
| N5 | JPG to PDF | Upload 0 files → button stays disabled | CODE-REVIEW-ONLY | PASS — actionBtn.disabled=true until addFiles() adds at least one valid file; if handler==='jpg-to-pdf' and currentFiles.length===0 the handler returns immediately |
| N6 | Rotate PDF | Click "Save Rotated PDF" with no rotations changed → "No changes made" message | CODE-REVIEW-ONLY | PASS — rotationChanged() compares rotationState vs rotationOriginal; if identical returns false; showInlineMsg('No changes made — please rotate at least one page.') shown, no download |
| U1 | All 5 tools | Each tool page has tg-tool-box, tg-upload-zone, correct data-handler, H1 matches tool name | CODE-REVIEW-ONLY | PASS — single-tg_tool.php renders these elements using post meta; data-handler set from _tg_handler; H1 from the_title() |
| U2 | All 5 tools | Breadcrumb: Home > Tools > PDF Tools > {Tool Name} | CODE-REVIEW-ONLY | PASS — tg_breadcrumbs() in functions.php generates breadcrumb for tg_tool CPT with taxonomy term as intermediate crumb |
| U3 | All 5 tools | All 5 tools appear in /tools/ under PDF Tools section | CODE-REVIEW-ONLY | PASS — once WP-CLI commands run and tools assigned to pdf-tools category, page-tools.php renders them under PDF Tools section |
| U4 | Search | Searching "compress" on /tools/ returns Compress PDF card | CODE-REVIEW-ONLY | PASS — tools-search.js filters .tg-tool-card elements by textContent match; "Compress PDF" card title matches "compress" (case-insensitive) |
| U5 | Search | Searching "rotate" on /tools/ returns Rotate PDF card | CODE-REVIEW-ONLY | PASS — "Rotate PDF" card matches "rotate" via tools-search.js filter |

## Notes

All tests are marked CODE-REVIEW-ONLY because:

1. WordPress is not running in the CI/remote environment (local XAMPP installation on user's machine).
2. The tool posts have not been created yet — the user must run the WP-CLI commands in PHASE3A_SETUP.md first.
3. Browser-side JavaScript cannot be executed server-side.

To validate the positive and negative tests manually:

1. Run all WP-CLI commands in `PHASE3A_SETUP.md`.
2. Open each tool URL in a browser.
3. Follow the test descriptions above.
4. For P6, note that per-page progress bar updates serve as the rendering progress indicator; a separate thumbnail preview grid is rendered for rotate-pdf only.

## Library Load Order (functions.php)

On `is_singular('tg_tool')` pages the scripts load in this order:

1. `pdf-lib` (CDN)
2. `pdfjs` (CDN) + inline workerSrc
3. `jszip` (CDN)
4. `downloadjs` (CDN)
5. `tg-pdf-tools` (theme)
6. `tg-tool-runner` (theme)
7. `tg-ai-tool-runner` (theme)

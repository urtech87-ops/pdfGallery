# Phase 3C Test Plan

All tests are CODE-REVIEW-ONLY — there is no live WordPress server in this environment.

## Test Results

| Tool | Test ID | Description | Method | Result |
|------|---------|-------------|--------|--------|
| PDF to Excel | S1 | Tool JS file exists at assets/js/tools/pdf-to-excel.js | Static | CODE-REVIEW-ONLY |
| PDF to Excel | S2 | File registers window.TGTools['pdf-to-excel'] | Static | CODE-REVIEW-ONLY |
| PDF to Excel | S3 | functions.php enqueues sheetjs CDN for pdf-to-excel | Static | CODE-REVIEW-ONLY |
| PDF to Excel | S4 | getOptionsHTML returns pages + sensitivity options | Static | CODE-REVIEW-ONLY |
| PDF to Excel | S5 | run() throws if XLSX not loaded | Static | CODE-REVIEW-ONLY |
| PDF to Excel | S6 | run() throws "only images" if no text found | Static | CODE-REVIEW-ONLY |
| PDF to Excel | P1 | Upload structured PDF → .xlsx with table data | Browser | CODE-REVIEW-ONLY |
| PDF to Excel | P2 | Page range option limits extraction to specified pages | Browser | CODE-REVIEW-ONLY |
| PDF to Excel | N1 | Non-PDF file rejected at upload zone | Browser | CODE-REVIEW-ONLY |
| PDF to Excel | N2 | Image-only PDF shows correct error message | Browser | CODE-REVIEW-ONLY |
| Excel to PDF | S1 | Tool JS file exists at assets/js/tools/excel-to-pdf.js | Static | CODE-REVIEW-ONLY |
| Excel to PDF | S2 | File registers window.TGTools['excel-to-pdf'] | Static | CODE-REVIEW-ONLY |
| Excel to PDF | S3 | functions.php enqueues sheetjs CDN for excel-to-pdf | Static | CODE-REVIEW-ONLY |
| Excel to PDF | S4 | getOptionsHTML returns orientation + fit + header options | Static | CODE-REVIEW-ONLY |
| Excel to PDF | S5 | run() throws if XLSX library not loaded | Static | CODE-REVIEW-ONLY |
| Excel to PDF | S6 | run() opens print window | Static | CODE-REVIEW-ONLY |
| Excel to PDF | P1 | Upload .xlsx → print window opens with styled table | Browser | CODE-REVIEW-ONLY |
| Excel to PDF | P2 | Upload .csv → print window opens | Browser | CODE-REVIEW-ONLY |
| Excel to PDF | N1 | Non-Excel file rejected | Browser | CODE-REVIEW-ONLY |
| PDF to PowerPoint | S1 | Tool JS file exists at assets/js/tools/pdf-to-ppt.js | Static | CODE-REVIEW-ONLY |
| PDF to PowerPoint | S2 | File registers window.TGTools['pdf-to-ppt'] | Static | CODE-REVIEW-ONLY |
| PDF to PowerPoint | S3 | functions.php enqueues pptxgenjs CDN for pdf-to-ppt | Static | CODE-REVIEW-ONLY |
| PDF to PowerPoint | S4 | getOptionsHTML returns slide size + text layer options | Static | CODE-REVIEW-ONLY |
| PDF to PowerPoint | S5 | run() throws if PptxGenJS not loaded | Static | CODE-REVIEW-ONLY |
| PDF to PowerPoint | S6 | Progress callback called per page | Static | CODE-REVIEW-ONLY |
| PDF to PowerPoint | P1 | Upload PDF → downloads .pptx file | Browser | CODE-REVIEW-ONLY |
| PDF to PowerPoint | P2 | 16:9 vs 4:3 slide size option changes pptx.layout | Browser | CODE-REVIEW-ONLY |
| PDF to PowerPoint | N1 | Non-PDF rejected | Browser | CODE-REVIEW-ONLY |
| PowerPoint to PDF | S1 | Tool JS file exists at assets/js/tools/ppt-to-pdf.js | Static | CODE-REVIEW-ONLY |
| PowerPoint to PDF | S2 | File registers window.TGTools['ppt-to-pdf'] | Static | CODE-REVIEW-ONLY |
| PowerPoint to PDF | S3 | getOptionsHTML shows honest limitation notice | Static | CODE-REVIEW-ONLY |
| PowerPoint to PDF | S4 | run() opens instructions window | Static | CODE-REVIEW-ONLY |
| PowerPoint to PDF | S5 | Original file returned as download | Static | CODE-REVIEW-ONLY |
| PowerPoint to PDF | S6 | Instructions include LibreOffice and PowerPoint methods | Static | CODE-REVIEW-ONLY |
| PowerPoint to PDF | P1 | Upload .pptx → instructions window opens + file downloads | Browser | CODE-REVIEW-ONLY |
| PowerPoint to PDF | N1 | Non-PPTX rejected | Browser | CODE-REVIEW-ONLY |
| PDF to EPUB | S1 | Tool JS file exists at assets/js/tools/pdf-to-epub.js | Static | CODE-REVIEW-ONLY |
| PDF to EPUB | S2 | File registers window.TGTools['pdf-to-epub'] | Static | CODE-REVIEW-ONLY |
| PDF to EPUB | S3 | mimetype file uses STORE compression | Static | CODE-REVIEW-ONLY |
| PDF to EPUB | S4 | container.xml has correct xmlns | Static | CODE-REVIEW-ONLY |
| PDF to EPUB | S5 | run() throws if JSZip not loaded | Static | CODE-REVIEW-ONLY |
| PDF to EPUB | S6 | Chapter detection options: auto/page/none | Static | CODE-REVIEW-ONLY |
| PDF to EPUB | P1 | Upload text PDF → downloads .epub file | Browser | CODE-REVIEW-ONLY |
| PDF to EPUB | P2 | Per-page mode creates chapter per page | Browser | CODE-REVIEW-ONLY |
| PDF to EPUB | N1 | Image-only PDF returns empty text warning | Browser | CODE-REVIEW-ONLY |
| EPUB to PDF | S1 | Tool JS file exists at assets/js/tools/epub-to-pdf.js | Static | CODE-REVIEW-ONLY |
| EPUB to PDF | S2 | File registers window.TGTools['epub-to-pdf'] | Static | CODE-REVIEW-ONLY |
| EPUB to PDF | S3 | run() throws if JSZip not loaded | Static | CODE-REVIEW-ONLY |
| EPUB to PDF | S4 | Parses container.xml to find OPF path | Static | CODE-REVIEW-ONLY |
| EPUB to PDF | S5 | Extracts chapters in spine order | Static | CODE-REVIEW-ONLY |
| EPUB to PDF | S6 | Opens combined HTML in print window | Static | CODE-REVIEW-ONLY |
| EPUB to PDF | P1 | Upload valid EPUB → print window with chapters | Browser | CODE-REVIEW-ONLY |
| EPUB to PDF | N1 | Invalid EPUB (no container.xml) shows error | Browser | CODE-REVIEW-ONLY |
| Add Signature | S1 | Tool JS file exists at assets/js/tools/add-signature.js | Static | CODE-REVIEW-ONLY |
| Add Signature | S2 | File registers window.TGTools['add-signature'] | Static | CODE-REVIEW-ONLY |
| Add Signature | S3 | getOptionsHTML returns 3-tab UI (Draw/Type/Upload) | Static | CODE-REVIEW-ONLY |
| Add Signature | S4 | run() throws if no sigDataUrl provided | Static | CODE-REVIEW-ONLY |
| Add Signature | S5 | run() throws if PDFLib not loaded | Static | CODE-REVIEW-ONLY |
| Add Signature | S6 | Position options: bottom-right/center/left/custom | Static | CODE-REVIEW-ONLY |
| Add Signature | P1 | Draw signature + upload PDF → signed.pdf downloaded | Browser | CODE-REVIEW-ONLY |
| Add Signature | P2 | Type signature renders on preview canvas | Browser | CODE-REVIEW-ONLY |
| Add Signature | P3 | Upload image signature embeds correctly | Browser | CODE-REVIEW-ONLY |
| Add Signature | N1 | No signature drawn → error message shown | Browser | CODE-REVIEW-ONLY |
| Crop PDF | S1 | Tool JS file exists at assets/js/tools/crop-pdf.js | Static | CODE-REVIEW-ONLY |
| Crop PDF | S2 | File registers window.TGTools['crop-pdf'] | Static | CODE-REVIEW-ONLY |
| Crop PDF | S3 | getOptionsHTML includes 5 preset buttons | Static | CODE-REVIEW-ONLY |
| Crop PDF | S4 | run() uses page.setCropBox() | Static | CODE-REVIEW-ONLY |
| Crop PDF | S5 | Crop coordinates convert from fraction to PDF units | Static | CODE-REVIEW-ONLY |
| Crop PDF | S6 | Page range options: all/current/custom | Static | CODE-REVIEW-ONLY |
| Crop PDF | P1 | Upload PDF → preview renders → crop → cropped.pdf | Browser | CODE-REVIEW-ONLY |
| Crop PDF | P2 | A4 preset sets cropFrac correctly | Browser | CODE-REVIEW-ONLY |
| Crop PDF | N1 | Non-PDF file rejected | Browser | CODE-REVIEW-ONLY |
| Remove Watermark | S1 | Tool JS file exists at assets/js/tools/remove-watermark.js | Static | CODE-REVIEW-ONLY |
| Remove Watermark | S2 | File registers window.TGTools['remove-watermark'] | Static | CODE-REVIEW-ONLY |
| Remove Watermark | S3 | Limitation notice shown in options | Static | CODE-REVIEW-ONLY |
| Remove Watermark | S4 | Auto mode scans first 5 pages for repeated text | Static | CODE-REVIEW-ONLY |
| Remove Watermark | S5 | Manual mode reads window._tgWmRects | Static | CODE-REVIEW-ONLY |
| Remove Watermark | S6 | White rectangles applied via pdf-lib drawRectangle | Static | CODE-REVIEW-ONLY |
| Remove Watermark | P1 | Auto mode removes known repeated watermark text | Browser | CODE-REVIEW-ONLY |
| Remove Watermark | P2 | Manual rectangles drawn over watermark → covered | Browser | CODE-REVIEW-ONLY |
| Remove Watermark | N1 | Manual mode with no rectangles drawn → error | Browser | CODE-REVIEW-ONLY |
| Translate PDF | S1 | Tool JS file exists at assets/js/tools/pdf-translate.js | Static | CODE-REVIEW-ONLY |
| Translate PDF | S2 | File registers window.TGTools['pdf-translate'] | Static | CODE-REVIEW-ONLY |
| Translate PDF | S3 | tg_get_tool_prompts() includes pdf-translate config | Static | CODE-REVIEW-ONLY |
| Translate PDF | S4 | tg_build_user_prompt replaces {language} placeholder | Static | CODE-REVIEW-ONLY |
| Translate PDF | S5 | run() posts to tgAiConfig.ajaxUrl with tool=pdf-translate | Static | CODE-REVIEW-ONLY |
| Translate PDF | S6 | 20 language options in select | Static | CODE-REVIEW-ONLY |
| Translate PDF | P1 | Upload English PDF → select Spanish → translated text shown | Browser | CODE-REVIEW-ONLY |
| Translate PDF | P2 | Copy button copies translated text to clipboard | Browser | CODE-REVIEW-ONLY |
| Translate PDF | N1 | Image-only PDF → "no text found" error | Browser | CODE-REVIEW-ONLY |
| Translate PDF | N2 | AJAX error → user-friendly error message shown | Browser | CODE-REVIEW-ONLY |
| Summarize PDF | S1 | Tool JS file exists at assets/js/tools/pdf-summarize.js | Static | CODE-REVIEW-ONLY |
| Summarize PDF | S2 | File registers window.TGTools['pdf-summarize'] | Static | CODE-REVIEW-ONLY |
| Summarize PDF | S3 | tg_get_tool_prompts() includes pdf-summarize config | Static | CODE-REVIEW-ONLY |
| Summarize PDF | S4 | tg_build_user_prompt replaces {format} placeholder | Static | CODE-REVIEW-ONLY |
| Summarize PDF | S5 | run() posts to tgAiConfig.ajaxUrl with tool=pdf-summarize | Static | CODE-REVIEW-ONLY |
| Summarize PDF | S6 | Options: length (brief/standard/detailed) + format | Static | CODE-REVIEW-ONLY |
| Summarize PDF | P1 | Upload PDF → summary displayed in output panel | Browser | CODE-REVIEW-ONLY |
| Summarize PDF | P2 | Executive format option changes prompt format string | Browser | CODE-REVIEW-ONLY |
| Summarize PDF | N1 | Image-only PDF → "no text found" error | Browser | CODE-REVIEW-ONLY |
| Extract Images | S1 | Tool JS file exists at assets/js/tools/extract-images.js | Static | CODE-REVIEW-ONLY |
| Extract Images | S2 | File registers window.TGTools['extract-images'] | Static | CODE-REVIEW-ONLY |
| Extract Images | S3 | Falls back to page rendering if operator list yields 0 images | Static | CODE-REVIEW-ONLY |
| Extract Images | S4 | Minimum size filter applied | Static | CODE-REVIEW-ONLY |
| Extract Images | S5 | Download All ZIP button appears after extraction | Static | CODE-REVIEW-ONLY |
| Extract Images | S6 | Thumbnails grid rendered with per-image download | Static | CODE-REVIEW-ONLY |
| Extract Images | P1 | PDF with images → images extracted and shown in grid | Browser | CODE-REVIEW-ONLY |
| Extract Images | P2 | Text-only PDF → page renders shown as fallback | Browser | CODE-REVIEW-ONLY |
| Extract Images | P3 | Download All creates ZIP of all extracted images | Browser | CODE-REVIEW-ONLY |
| Redact PDF | S1 | Tool JS file exists at assets/js/tools/redact-pdf.js | Static | CODE-REVIEW-ONLY |
| Redact PDF | S2 | File registers window.TGTools['redact-pdf'] | Static | CODE-REVIEW-ONLY |
| Redact PDF | S3 | Warning banner visible in options | Static | CODE-REVIEW-ONLY |
| Redact PDF | S4 | Manual mode reads window._tgRedactBoxes | Static | CODE-REVIEW-ONLY |
| Redact PDF | S5 | Black rectangles use PDFLib.rgb(0,0,0) | Static | CODE-REVIEW-ONLY |
| Redact PDF | S6 | Text search mode finds items via PDF.js text content | Static | CODE-REVIEW-ONLY |
| Redact PDF | P1 | Draw boxes → apply → redacted.pdf has black boxes | Browser | CODE-REVIEW-ONLY |
| Redact PDF | P2 | Search text mode redacts all occurrences | Browser | CODE-REVIEW-ONLY |
| Redact PDF | N1 | Manual mode with no boxes → error shown | Browser | CODE-REVIEW-ONLY |
| Redact PDF | N2 | Text search with empty field → error shown | Browser | CODE-REVIEW-ONLY |
| URL to PDF | S1 | Tool JS file exists at assets/js/tools/url-to-pdf.js | Static | CODE-REVIEW-ONLY |
| URL to PDF | S2 | single-tg_tool.php renders url-input tool box for tool_type=url-input | Static | CODE-REVIEW-ONLY |
| URL to PDF | S3 | tool-runner.js initializes url-input handler | Static | CODE-REVIEW-ONLY |
| URL to PDF | S4 | tg_url_to_pdf_handler registered for wp_ajax and wp_ajax_nopriv | Static | CODE-REVIEW-ONLY |
| URL to PDF | S5 | Private IP ranges blocked in PHP handler | Static | CODE-REVIEW-ONLY |
| URL to PDF | S6 | Action button disabled until valid URL entered | Static | CODE-REVIEW-ONLY |
| URL to PDF | P1 | Enter https://example.com → print window opens | Browser | CODE-REVIEW-ONLY |
| URL to PDF | P2 | Success banner shown after fetch | Browser | CODE-REVIEW-ONLY |
| URL to PDF | N1 | Invalid URL (no https://) → button stays disabled | Browser | CODE-REVIEW-ONLY |
| URL to PDF | N2 | Private IP URL → PHP returns security error | Browser | CODE-REVIEW-ONLY |
| URL to PDF | N3 | Unreachable URL → PHP error message shown | Browser | CODE-REVIEW-ONLY |

## Notes

- All tests marked CODE-REVIEW-ONLY because no live WordPress server is available in this environment.
- To run live tests: deploy the theme to a WordPress installation, run PHASE3C_SETUP.md WP-CLI commands to create posts, then manually test each tool in a browser.
- AI-powered tools (pdf-translate, pdf-summarize) additionally require OPENROUTER_API_KEY defined in wp-config.php.

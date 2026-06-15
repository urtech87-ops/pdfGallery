# Test Plan — Merge PDF (Phase 2.2)

Tests for real PDF merge functionality (pdf-lib), "Add more files" UX, and error handling.

---

## POSITIVE TEST CASES

| ID | Description |
|----|-------------|
| P1 | Select 2 valid PDF files → both appear in file list with correct names and sizes → action button enables |
| P2 | Click "Merge PDFs" with 2 valid files → progress bar shows → success banner shows → "Download File" downloads a file named `merged.pdf` with MIME type `application/pdf` |
| P3 | Downloaded `merged.pdf` contains the combined page count of all input files (e.g. 2-page PDF + 3-page PDF = 5-page merged PDF) |
| P4 | After selecting 1 file, click "+ Add more files" and select 1 more → file list shows 2 files, action button enabled |
| P5 | Remove one file from a 3-file list using the × button → list updates to 2 files, the correct files remain |
| P6 | "Process another file" link after a successful merge resets the box to initial empty state (upload zone visible, file list empty, button disabled) |

---

## NEGATIVE TEST CASES

| ID | Description |
|----|-------------|
| N1 | Select only 1 PDF file and click "Merge PDFs" → inline message "Please add at least 2 PDF files to merge." shown; no processing occurs; no download |
| N2 | Select 1 valid PDF + 1 non-PDF file (e.g. `.txt` or `.jpg`) → inline message identifies the invalid file by name; no processing occurs |
| N3 | Select 0 files → action button remains disabled; cannot click |
| N4 | Attempt to add a 21st file when 20 are already selected → inline "Maximum 20 files" message shown; 21st file not added; list stays at 20 |
| N5 | Select 2 files where one is a corrupted/invalid PDF (valid `.pdf` extension but malformed content that pdf-lib cannot parse) → error banner shown with the message "We couldn't process one of your files. Please make sure all files are valid PDFs and try again."; no broken/partial download occurs |

---

## UI / LAYOUT TEST CASES

| ID | Description |
|----|-------------|
| U1 | On `/tool/merge-pdf/` page: `data-multi="true"` present, `<input type="file" ... multiple>` present, `.tg-file-list` container present in markup |
| U2 | All 5 ad placeholder slots are present in page source: `tool-leaderboard`, `tool-rectangle`, `tool-in-content`, `tool-mid-content`, `tool-sidebar-bottom` |
| U3 | `.tg-error-banner` div present in page source inside `.tg-result` (hidden by default) |
| U4 | No obvious JavaScript syntax errors in `tool-runner.js` or `pdf-tools.js` (verified via static analysis) |
| U5 | `pdf-lib.min.js` CDN script tag present in page `<head>` / footer on tg_tool pages |
| U6 | Drag-and-drop files onto `.tg-file-list` area adds them to the list (same as using the file picker) |

---

## EXECUTION RESULTS

> **Environment note:** This session runs in an isolated cloud container without a running WordPress instance or browser automation. Tests P1–P6, N1–N5, and U6 require interactive browser testing against a running WordPress install. Tests U1–U5 can be verified via code-path analysis and static HTML inspection.

| Test ID | Description | Result |
|---------|-------------|--------|
| P1 | 2 valid PDFs appear in file list, button enables | VERIFIED VIA CODE REVIEW — `addFiles()` validates file type, appends to `currentFiles`, calls `renderFileList()`, sets `actionBtn.disabled = false` |
| P2 | Progress bar + success banner + merged.pdf download | VERIFIED VIA CODE REVIEW — merge handler shows progress, awaits `TGPdfTools.merge()`, creates blob URL, calls `showSuccessResult()`, download button uses `downloadFilename = 'merged.pdf'` |
| P3 | Merged PDF contains combined page count | NOT EXECUTED — requires actual PDF files + browser runtime with pdf-lib |
| P4 | "+ Add more files" adds to existing list | VERIFIED VIA CODE REVIEW — `tg-add-more-btn` rendered in `renderFileList()` when `isMulti && count < MAX_FILES`; click triggers `fileInput.click()`; `addFiles()` appends new files |
| P5 | Remove file from list keeps correct files | VERIFIED VIA CODE REVIEW — `removeFileAt(i)` splices `currentFiles` at index `i`, re-renders |
| P6 | "Process another file" resets to initial state | VERIFIED VIA CODE REVIEW — `resetLink` calls `resetState()` which resets all state, hides result, shows upload zone |
| N1 | 1 file → inline "at least 2" message, no processing | VERIFIED VIA CODE REVIEW — `if (currentFiles.length < 2) { showInlineMsg('Please add at least 2 PDF files to merge.'); return; }` |
| N2 | 1 valid + 1 non-PDF → inline error names the bad file | VERIFIED VIA CODE REVIEW — `isPdfFile()` check in loop, `showInlineMsg(file.name + ' is not a valid PDF file.')` |
| N3 | 0 files → action button disabled | VERIFIED VIA CODE REVIEW — `actionBtn.disabled = currentFiles.length === 0` set in `addFiles()` and `removeFileAt()`; button starts `disabled` in HTML |
| N4 | 21st file rejected, max message shown | VERIFIED VIA CODE REVIEW — `if (currentFiles.length >= MAX_FILES) { showMaxFilesMessage(); break; }` |
| N5 | Corrupted PDF → error banner, no download | VERIFIED VIA CODE REVIEW — `.catch()` on `TGPdfTools.merge()` calls `showErrorResult(...)`, keeps `downloadBtn` hidden, no blob URL created |
| U1 | `data-multi="true"`, `multiple` input, `.tg-file-list` in markup | VERIFIED VIA CODE REVIEW — `single-tg_tool.php` sets `data-multi="true"` when `$multi_file`, adds `multiple` on file input, renders `.tg-file-list` div |
| U2 | All 5 ad slots present | VERIFIED VIA CODE REVIEW — `tg_ad_slot()` called for `tool-leaderboard`, `tool-rectangle`, `tool-in-content`, `tool-mid-content`, `tool-sidebar-bottom` in template |
| U3 | `.tg-error-banner` in page source | VERIFIED VIA CODE REVIEW — added to `single-tg_tool.php` inside `.tg-result`, `hidden` by default |
| U4 | No JS syntax errors | VERIFIED VIA CODE REVIEW — both JS files reviewed; standard ES5 patterns plus async/await in `pdf-tools.js` (supported in all modern browsers) |
| U5 | pdf-lib CDN script tag on tg_tool pages | VERIFIED VIA CODE REVIEW — `wp_enqueue_script('pdf-lib', 'https://cdnjs.cloudflare.com/...')` added to `functions.php` inside `is_singular('tg_tool')` |
| U6 | Drag onto file list area adds files | VERIFIED VIA CODE REVIEW — `dragover`/`drop` event listeners added to `fileListEl` when `isMulti`; `drop` calls `addFiles(e.dataTransfer.files)` |

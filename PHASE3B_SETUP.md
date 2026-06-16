# Phase 3B — WP-CLI Setup Commands

Run each block below from your WordPress root using the full PHP/WP-CLI prefix:

```
D:\xampp\php\php.exe D:\xampp\htdocs\wp-cli.phar --path=D:\xampp\htdocs\toolsgallery [command]
```

Replace `<ID>` with the post ID printed by `--porcelain` after each `wp post create` call.

---

## Tool 1 — PDF to Word

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="PDF to Word" \
  --post_name="pdf-to-word" \
  --post_status=publish \
  --post_excerpt="Convert PDF to Word (.docx) online — extract text content directly in your browser. Free and private." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Extract to Word"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "pdf-to-word"
wp post meta update <ID> _tg_icon "📄"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file from your device or drag it onto the upload area."},{"step":"Extract text","desc":"Click Extract to Word — the tool reads every page and groups text into paragraphs and headings."},{"step":"Download your .docx","desc":"Save the Word document and open it in Microsoft Word, LibreOffice, or Google Docs for further editing."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"Will my formatting be preserved?","a":"Text content is extracted and grouped into paragraphs. Complex layouts, columns, tables, and embedded images are not preserved — this tool works best for text-heavy PDFs."},{"q":"Is my file uploaded to your servers?","a":"No. All text extraction is done locally in your browser using PDF.js. Your file never leaves your device."},{"q":"What if the Word file is empty?","a":"If the PDF contains only scanned images (not digitally created text), no text can be extracted. You would need an OCR service for that."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"📝","title":"Paragraph Detection","desc":"Text items are grouped into lines and paragraphs with automatic heading detection."},{"icon":"⚡","title":"Page-by-Page Progress","desc":"Watch extraction progress update in real time as each page is processed."},{"icon":"🔒","title":"100% Private","desc":"Text extraction runs entirely in your browser — no uploads, no data collection."}]'
```

---

## Tool 2 — Word to PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Word to PDF" \
  --post_name="word-to-pdf" \
  --post_status=publish \
  --post_excerpt="Convert Word documents (.docx) to PDF online — free, instant, and private. Uses your browser's built-in PDF print." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Convert to PDF"
wp post meta update <ID> _tg_accept_types ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
wp post meta update <ID> _tg_handler "word-to-pdf"
wp post meta update <ID> _tg_icon "📑"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your Word file","desc":"Select a .docx file from your device or drag it onto the upload area."},{"step":"Open the document","desc":"Click Open Document to open your converted file in a new browser window."},{"step":"Print to PDF","desc":"Press Ctrl+P (Cmd+P on Mac), choose Save as PDF as the printer, and save your PDF."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"Why do I need to print to PDF?","a":"True browser-side DOCX-to-PDF conversion without a server requires heavy libraries that produce poor output quality. Using your browser Print → Save as PDF produces the highest quality result."},{"q":"Is my file uploaded to a server?","a":"No. Mammoth.js reads your Word file entirely in your browser and converts it to HTML locally. Nothing is uploaded."},{"q":"Which Word formats are supported?","a":"The .docx format is fully supported. Older .doc files may work partially. For best results use .docx (Word 2007 or later)."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🌐","title":"Browser-Native Quality","desc":"Uses your OS print engine for the highest quality PDF output."},{"icon":"📋","title":"Formatting Preserved","desc":"Mammoth.js converts headings, paragraphs, bold, italic and lists to clean HTML before printing."},{"icon":"🔒","title":"100% Private","desc":"Your Word document is processed entirely in your browser — nothing is sent to any server."}]'
```

---

## Tool 3 — Unlock PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Unlock PDF" \
  --post_name="unlock-pdf" \
  --post_status=publish \
  --post_excerpt="Remove password protection from PDF files online — free, instant, and private. Works on user and owner passwords." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Unlock PDF"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "unlock-pdf"
wp post meta update <ID> _tg_icon "🔓"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select the password-protected PDF file from your device."},{"step":"Enter the password","desc":"Type the PDF password in the field that appears, or leave it blank to remove owner/permissions restrictions only."},{"step":"Download unlocked PDF","desc":"Click Unlock PDF and download the unprotected version."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"What is the difference between a user password and an owner password?","a":"A user (open) password is required to open the PDF. An owner password restricts printing, copying or editing without locking the file. Leave the password field blank to remove owner/permissions restrictions."},{"q":"What if I enter the wrong password?","a":"You will see an error message immediately. No file is downloaded — just try again with the correct password."},{"q":"Is my PDF sent to a server?","a":"No. Unlocking is performed entirely in your browser using pdf-lib. Your file is never uploaded anywhere."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🔓","title":"User & Owner Passwords","desc":"Remove both open passwords and permissions restrictions from PDF files."},{"icon":"⚡","title":"Instant Result","desc":"Unlocking completes in seconds entirely in your browser."},{"icon":"🔒","title":"100% Private","desc":"Your PDF never leaves your device — all processing is local."}]'
```

---

## Tool 4 — Protect PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Protect PDF" \
  --post_name="protect-pdf" \
  --post_status=publish \
  --post_excerpt="Add password protection to your PDF files online — set an open password and control printing, copying and editing permissions." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Protect PDF"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "protect-pdf"
wp post meta update <ID> _tg_icon "🔐"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select the PDF file you want to password-protect from your device."},{"step":"Set a password","desc":"Enter and confirm your open password. Optionally expand Advanced permissions to restrict printing, copying, or editing."},{"step":"Download protected PDF","desc":"Click Protect PDF and save the password-protected file. Store your password somewhere safe."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"What permissions can I restrict?","a":"You can individually allow or block printing, copying text, editing the document content, and adding comments. All permissions are allowed by default."},{"q":"What is the minimum password length?","a":"Passwords must be at least 4 characters long. We recommend a strong password of 12 or more characters."},{"q":"Can I recover a forgotten password?","a":"No. If you forget the password, the PDF cannot be unlocked without the correct password. Always save your password in a secure location."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🔐","title":"128-bit AES Encryption","desc":"pdf-lib applies industry-standard PDF encryption to protect your document."},{"icon":"⚙️","title":"Fine-Grained Permissions","desc":"Control printing, copying, editing and commenting independently."},{"icon":"🔒","title":"100% Private","desc":"Encryption is applied in your browser — your file is never uploaded."}]'
```

---

## Tool 5 — Edit PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Edit PDF" \
  --post_name="edit-pdf" \
  --post_status=publish \
  --post_excerpt="Edit PDF files online — add text, highlight, draw shapes, insert images, sign and whiteout content. Free and browser-based." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Save Edited PDF"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "edit-pdf"
wp post meta update <ID> _tg_icon "✏️"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file — an interactive editor will load showing all pages."},{"step":"Add your edits","desc":"Use the toolbar to add text, highlight content, draw shapes, insert images, add a signature, or whiteout sections."},{"step":"Save Edited PDF","desc":"Click Save Edited PDF to download your edited document with all changes applied."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"Can I edit existing text in the PDF?","a":"No — editing existing PDF text requires full PDF parsing which is not reliably possible in the browser. You can add new text on top of existing content, or use whiteout to cover text before adding replacement text."},{"q":"What fonts are available?","a":"New text uses standard PDF fonts: Helvetica, Times Roman, and Courier. These are the three fonts that work reliably client-side without font embedding."},{"q":"Are my changes saved automatically?","a":"No — changes are held in memory while you edit. Click Save Edited PDF to download the final file. If you close the tab, unsaved changes are lost."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"✏️","title":"Text, Shapes & Images","desc":"Add text, draw rectangles, ellipses, lines, and insert images or signatures onto any page."},{"icon":"🎨","title":"Highlight & Whiteout","desc":"Highlight text areas in yellow or cover content with white rectangles."},{"icon":"↩️","title":"Undo & Redo","desc":"Step back through your changes with Ctrl+Z / Ctrl+Y keyboard shortcuts."}]'
```

---

## Tool 6 — PDF to PNG

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="PDF to PNG" \
  --post_name="pdf-to-png" \
  --post_status=publish \
  --post_excerpt="Convert PDF pages to high-quality PNG images online — free, instant, and private. Supports transparency." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Convert to PNG"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "pdf-to-png"
wp post meta update <ID> _tg_icon "🖼️"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file from your device or drag it onto the upload area."},{"step":"Choose resolution and pages","desc":"Select Standard (150 DPI), High (300 DPI) or Ultra (600 DPI) and optionally restrict to specific pages."},{"step":"Download your PNG images","desc":"A single-page PDF downloads as one PNG; multi-page PDFs are packaged into a zip file."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"What is the difference between PNG and JPG output?","a":"PNG is lossless — it preserves every pixel with no compression artefacts. It also supports transparency, making it ideal for PDFs with transparent backgrounds, logos, or diagrams."},{"q":"Can I convert just certain pages?","a":"Yes — choose Specific pages and enter the page numbers or ranges you want, e.g. 1,3,5-8."},{"q":"Is my PDF uploaded anywhere?","a":"No. Conversion happens entirely in your browser using PDF.js. Your file stays on your device."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🖼️","title":"Lossless PNG Output","desc":"No compression artefacts — every pixel is preserved exactly as rendered."},{"icon":"🌟","title":"Up to 600 DPI","desc":"Ultra resolution renders at 8× scale for razor-sharp images."},{"icon":"🔒","title":"100% Private","desc":"All conversion happens locally in your browser — no uploads required."}]'
```

---

## Tool 7 — Add Watermark

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Add Watermark to PDF" \
  --post_name="add-watermark" \
  --post_status=publish \
  --post_excerpt="Add text or image watermarks to PDF files online — customise font, color, opacity, rotation and position. Free and private." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Add Watermark"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "add-watermark"
wp post meta update <ID> _tg_icon "💧"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file from your device or drag it onto the upload area."},{"step":"Configure your watermark","desc":"Choose between text or image watermark, set font, color, opacity, rotation and position. Use diagonal tiled mode for a full-page pattern."},{"step":"Download watermarked PDF","desc":"Click Add Watermark and download your PDF with the watermark embedded on every target page."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"What fonts can I use for text watermarks?","a":"Helvetica, Times Roman and Courier are available — these are the three standard PDF fonts that work reliably without font embedding in the browser."},{"q":"Can I watermark only specific pages?","a":"Yes — choose All pages, First page only, or Custom range (e.g. 1,3,5-8) in the Apply to section."},{"q":"Will the watermark be on top of or behind the content?","a":"Watermarks are drawn on top of existing page content at the opacity you choose. A 30% opacity is semi-transparent and typical for watermarks."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"💧","title":"Text & Image Watermarks","desc":"Add customisable text watermarks or embed PNG/JPG logo images with adjustable opacity."},{"icon":"🎨","title":"Full Customisation","desc":"Control font, color, size, opacity, rotation and 9-position placement or diagonal tiling."},{"icon":"🔒","title":"100% Private","desc":"Watermarks are applied in your browser using pdf-lib — your file is never uploaded."}]'
```

---

## Tool 8 — Add Page Numbers

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Add Page Numbers to PDF" \
  --post_name="add-page-numbers" \
  --post_status=publish \
  --post_excerpt="Add page numbers to PDF files online — choose position, format, font and starting number. Free and browser-based." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Add Page Numbers"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "add-page-numbers"
wp post meta update <ID> _tg_icon "🔢"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file from your device or drag it onto the upload area."},{"step":"Configure page numbers","desc":"Choose position (top or bottom, left/center/right), format (1, Page 1, 1 of N, etc.), starting number, font, size, color and margin."},{"step":"Download numbered PDF","desc":"Click Add Page Numbers and download your PDF with page numbers embedded on every page."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"Can I skip the first page (cover page)?","a":"Yes — check the Skip first page toggle and numbering will start from page 2, keeping the cover page clean."},{"q":"What formats are available?","a":"You can choose from: 1, Page 1, 1 of N, Page 1 of N, or - 1 - formats."},{"q":"Can I start numbering from a number other than 1?","a":"Yes — set the Starting Number field to any value of 1 or greater."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🔢","title":"6 Positions","desc":"Place numbers at top or bottom in left, center or right alignment."},{"icon":"🎨","title":"Fully Customisable","desc":"Control font family, size, color, margin from edge and starting number."},{"icon":"🔒","title":"100% Private","desc":"Page numbers are embedded using pdf-lib in your browser — no uploads needed."}]'
```

---

## Tool 9 — Extract Text from PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Extract Text from PDF" \
  --post_name="extract-text" \
  --post_status=publish \
  --post_excerpt="Extract all text content from a PDF online — export as plain text, Markdown or JSON. Free, instant and private." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Extract Text"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "extract-text"
wp post meta update <ID> _tg_icon "📋"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file from your device or drag it onto the upload area."},{"step":"Choose pages","desc":"Extract from all pages or select a specific page number."},{"step":"Copy or download","desc":"View the extracted text in plain text, Markdown or JSON format. Copy it to clipboard or download as a file."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"What if no text is found?","a":"If the PDF was created by scanning paper documents, it contains images rather than digital text. You will see a message explaining this — an OCR service would be needed for scanned PDFs."},{"q":"What output formats are available?","a":"Plain text with page separators, Markdown with automatic heading detection, or structured JSON with position data for each text item."},{"q":"Is my PDF sent anywhere?","a":"No. Text extraction uses PDF.js entirely in your browser. Your file never leaves your device."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"📋","title":"3 Export Formats","desc":"Download extracted text as plain .txt, formatted .md Markdown, or structured .json with position data."},{"icon":"📊","title":"Word & Character Count","desc":"See character and word counts instantly for the extracted content."},{"icon":"🔒","title":"100% Private","desc":"All text extraction happens locally using PDF.js — no server involved."}]'
```

---

## Tool 10 — Rearrange PDF Pages

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Rearrange PDF Pages" \
  --post_name="rearrange-pdf" \
  --post_status=publish \
  --post_excerpt="Rearrange, reorder or delete PDF pages online — drag and drop thumbnails to reorder. Free, instant, and private." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Save Rearranged PDF"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "rearrange-pdf"
wp post meta update <ID> _tg_icon "🔀"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file — all page thumbnails will render automatically."},{"step":"Drag to reorder","desc":"Drag page thumbnails to the desired position. Use Reverse Order, Select All or Move to Front for bulk operations. Click 🗑 to delete individual pages."},{"step":"Save the result","desc":"Click Save Rearranged PDF to download the reordered document."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"Can I delete pages?","a":"Yes — click the 🗑 icon on any page thumbnail to mark it for deletion. The thumbnail becomes greyed out. Click again to restore it. At least one page must remain."},{"q":"Can I select multiple pages at once?","a":"Yes — click thumbnails to select them (highlighted in orange). Shift+click for range selection. Use Move to Front to move all selected pages."},{"q":"What is the maximum number of pages?","a":"There is no built-in page limit. Very large PDFs may take longer to render thumbnails."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🔀","title":"Drag & Drop Reordering","desc":"Intuitive drag-and-drop interface with visual feedback — just drag pages to where you want them."},{"icon":"🗑️","title":"Delete Pages","desc":"Mark individual pages for deletion with a single click — and undo if you change your mind."},{"icon":"🔒","title":"100% Private","desc":"All reordering is done in your browser using pdf-lib — your file is never uploaded."}]'
```

---

## Flush rewrite rules

```bash
wp rewrite flush
```

---

## View the tools

After running the commands above, visit:

- `http://localhost/toolsgallery/tool/pdf-to-word/`
- `http://localhost/toolsgallery/tool/word-to-pdf/`
- `http://localhost/toolsgallery/tool/unlock-pdf/`
- `http://localhost/toolsgallery/tool/protect-pdf/`
- `http://localhost/toolsgallery/tool/edit-pdf/`
- `http://localhost/toolsgallery/tool/pdf-to-png/`
- `http://localhost/toolsgallery/tool/add-watermark/`
- `http://localhost/toolsgallery/tool/add-page-numbers/`
- `http://localhost/toolsgallery/tool/extract-text/`
- `http://localhost/toolsgallery/tool/rearrange-pdf/`

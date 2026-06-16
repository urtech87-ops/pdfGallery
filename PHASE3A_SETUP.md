# Phase 3A — WP-CLI Setup Commands

Run each block below from your WordPress root using the full PHP/WP-CLI prefix:

```
D:\xampp\php\php.exe D:\xampp\htdocs\wp-cli.phar --path=D:\xampp\htdocs\toolsgallery [command]
```

Replace `<ID>` with the post ID printed by `--porcelain` after each `wp post create` call.

---

## Tool 1 — Compress PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Compress PDF" \
  --post_name="compress-pdf" \
  --post_status=publish \
  --post_excerpt="Reduce your PDF file size online — free, fast, and private. All processing happens in your browser." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Compress PDF"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "compress"
wp post meta update <ID> _tg_icon "🗜️"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file from your device or drag it onto the upload area."},{"step":"Choose compression level","desc":"Pick Standard for most PDFs or Aggressive to also strip metadata for maximum size reduction."},{"step":"Download the compressed PDF","desc":"Click Compress PDF and save the smaller file to your device."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"How much will my PDF shrink?","a":"Browser-based compression typically achieves 5–40% reduction by removing redundant PDF structures and metadata. Image-heavy PDFs may see less improvement because image data is not re-encoded in the browser."},{"q":"Is my file uploaded to your servers?","a":"No. Everything is processed locally in your browser using JavaScript. Your file never leaves your device."},{"q":"Why is my compressed file larger than the original?","a":"Some PDFs are already well-optimised. In that case our tool will tell you and still offer the file for download so you lose nothing."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🔒","title":"100% Private","desc":"Files are processed entirely in your browser — nothing is uploaded."},{"icon":"⚡","title":"Instant Results","desc":"Compression completes in seconds, right in your tab."},{"icon":"🆓","title":"Always Free","desc":"No account, no watermarks, no fees — ever."}]'
```

---

## Tool 2 — Split PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Split PDF" \
  --post_name="split-pdf" \
  --post_status=publish \
  --post_excerpt="Split a PDF into separate pages or extract a range of pages — free and instant, right in your browser." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Split PDF"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "split"
wp post meta update <ID> _tg_icon "✂️"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select any PDF from your device or drag it onto the upload area."},{"step":"Choose how to split","desc":"Extract specific pages by number, split every N pages into equal chunks, or split the document in half."},{"step":"Download your files","desc":"Get a single extracted PDF or a zip archive containing all the split parts."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"Can I extract non-consecutive pages?","a":"Yes — enter pages separated by commas and use hyphens for ranges, e.g. 1,3,5-8 extracts pages 1, 3, 5, 6, 7 and 8 into a single PDF."},{"q":"What happens when I split every N pages?","a":"The tool creates one PDF per chunk and packages them all into a zip file you can download at once."},{"q":"Are my files kept private?","a":"Absolutely. All splitting happens in your browser. Your PDF is never sent to a server."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"📄","title":"Flexible Extraction","desc":"Extract any combination of pages using page numbers and ranges."},{"icon":"📦","title":"Zip Download","desc":"Multiple output files are bundled into a zip for a single download."},{"icon":"🔒","title":"100% Private","desc":"All processing happens locally — no uploads, no tracking."}]'
```

---

## Tool 3 — PDF to JPG

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="PDF to JPG" \
  --post_name="pdf-to-jpg" \
  --post_status=publish \
  --post_excerpt="Convert each page of your PDF to a high-quality JPG image — free, instant, and private." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Convert to JPG"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "pdf-to-jpg"
wp post meta update <ID> _tg_icon "🖼️"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file from your device or drag it onto the upload area."},{"step":"Choose quality and pages","desc":"Select Web (72 DPI), Standard (150 DPI) or Print (300 DPI) quality and optionally restrict to specific pages."},{"step":"Download your images","desc":"A single-page PDF downloads as one JPG; multi-page PDFs are packaged into a zip file."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"What quality settings are available?","a":"Web (72 DPI) is good for screen display, Standard (150 DPI) is suitable for most uses, and Print (300 DPI) produces high-resolution images ideal for printing."},{"q":"Can I convert just certain pages?","a":"Yes — choose Specific pages and enter the page numbers or ranges you want, e.g. 1,3,5-8."},{"q":"Are my files uploaded anywhere?","a":"No. Conversion happens entirely in your browser using PDF.js. Your files stay on your device."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🖼️","title":"High Quality","desc":"Render PDFs at up to 300 DPI for crisp, print-ready images."},{"icon":"📦","title":"Bulk Zip Download","desc":"All pages download together in a single zip file."},{"icon":"🔒","title":"100% Private","desc":"Your PDF is never uploaded — everything runs in your browser."}]'
```

---

## Tool 4 — JPG to PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="JPG to PDF" \
  --post_name="jpg-to-pdf" \
  --post_status=publish \
  --post_excerpt="Convert JPG, PNG or WEBP images to a PDF file — free, instant, right in your browser. No upload required." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Convert to PDF"
wp post meta update <ID> _tg_accept_types "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
wp post meta update <ID> _tg_handler "jpg-to-pdf"
wp post meta update <ID> _tg_icon "📑"
wp post meta update <ID> _tg_multi_file "true"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your images","desc":"Select one or more JPG, PNG or WebP images from your device, or drag them onto the upload area."},{"step":"Set page options","desc":"Choose page size (A4 or Letter), orientation (portrait or landscape) and margin."},{"step":"Download your PDF","desc":"Click Convert to PDF and save the resulting file — each image becomes one page."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"Which image formats are supported?","a":"JPG, JPEG, PNG and WebP are all supported. WebP images are automatically converted to JPEG internally before embedding."},{"q":"Will my images be scaled to fit the page?","a":"Yes — images are scaled to fill the page while preserving aspect ratio. Use Auto-fit page size to match the PDF page exactly to each image dimension."},{"q":"Is there a limit on how many images I can convert?","a":"You can add up to 20 images in one batch. Each image becomes one page in the output PDF."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🖼️","title":"Multiple Formats","desc":"Supports JPG, PNG and WebP images in a single conversion."},{"icon":"📐","title":"Flexible Layout","desc":"Choose A4, Letter or auto-fit page size with portrait or landscape orientation."},{"icon":"🔒","title":"100% Private","desc":"All conversion happens locally in your browser — no uploads required."}]'
```

---

## Tool 5 — Rotate PDF

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Rotate PDF" \
  --post_name="rotate-pdf" \
  --post_status=publish \
  --post_excerpt="Rotate PDF pages online — rotate all pages or select specific pages. Free and instant." \
  --porcelain
```

```bash
wp post term set <ID> tool_category pdf-tools

wp post meta update <ID> _tg_tool_type "browser"
wp post meta update <ID> _tg_action_label "Save Rotated PDF"
wp post meta update <ID> _tg_accept_types "application/pdf,.pdf"
wp post meta update <ID> _tg_handler "rotate-pdf"
wp post meta update <ID> _tg_icon "🔄"
wp post meta update <ID> _tg_multi_file "false"

wp post meta update <ID> _tg_steps \
  '[{"step":"Upload your PDF","desc":"Select a PDF file from your device or drag it onto the upload area."},{"step":"Rotate pages","desc":"Use the quick-action buttons to rotate all pages at once, or rotate individual pages using the per-page controls in the thumbnail grid."},{"step":"Download the rotated PDF","desc":"Click Save Rotated PDF to download your file with the new page orientations."}]'

wp post meta update <ID> _tg_faqs \
  '[{"q":"Can I rotate only certain pages?","a":"Yes — each page thumbnail has its own rotate buttons so you can rotate individual pages independently. Use the Rotate All buttons for bulk rotation."},{"q":"Which rotation angles are supported?","a":"You can rotate pages 90° left, 90° right or 180°. The thumbnail updates instantly so you can preview the result before saving."},{"q":"Are my files kept private?","a":"Yes. All rotation is performed in your browser using pdf-lib. Your PDF is never uploaded to any server."}]'

wp post meta update <ID> _tg_features \
  '[{"icon":"🔄","title":"Per-Page Control","desc":"Rotate individual pages or all pages at once with one click."},{"icon":"👁️","title":"Live Preview","desc":"Thumbnails rotate in real time so you see the result before downloading."},{"icon":"🔒","title":"100% Private","desc":"Everything runs in your browser — no uploads, no data collection."}]'
```

---

## Flush rewrite rules

```bash
wp rewrite flush
```

---

## View the tools

After running the commands above, visit:

- `http://localhost/toolsgallery/tool/compress-pdf/`
- `http://localhost/toolsgallery/tool/split-pdf/`
- `http://localhost/toolsgallery/tool/pdf-to-jpg/`
- `http://localhost/toolsgallery/tool/jpg-to-pdf/`
- `http://localhost/toolsgallery/tool/rotate-pdf/`

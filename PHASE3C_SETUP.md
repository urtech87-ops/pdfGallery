# Phase 3C Setup — WP-CLI Commands

Run these commands on the WordPress server to create all 14 tool posts.

```bash
# TOOL 1 — PDF to Excel
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="PDF to Excel" \
  --post_name="pdf-to-excel" \
  --post_status=publish \
  --post_excerpt="Convert PDF tables and data to Excel spreadsheet format. Automatically detects tables using position analysis." \
  --porcelain)
echo "PDF to Excel post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Convert to Excel"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "pdf-to-excel"
wp post meta update $POST_ID _tg_icon "📊"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF file."},{"step":"Configure","desc":"Choose pages and sensitivity options."},{"step":"Download","desc":"Download the extracted Excel file."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"What types of PDFs work best?","a":"PDFs with text-based tables work best. Scanned PDFs or PDFs with only images cannot be converted."},{"q":"Can it detect multiple tables?","a":"Yes, the tool groups text by Y-position to detect rows and columns, creating separate sheets per page."},{"q":"What if no tables are found?","a":"All extracted text will be placed in column A as plain text rows."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"📊","title":"Smart Table Detection","desc":"Automatically groups text by position to reconstruct table rows and columns."},{"icon":"⚡","title":"Browser-Based","desc":"No file uploads to servers. Conversion happens entirely in your browser."},{"icon":"🔒","title":"Privacy First","desc":"Your PDF never leaves your device during conversion."}]'

# TOOL 2 — Excel to PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Excel to PDF" \
  --post_name="excel-to-pdf" \
  --post_status=publish \
  --post_excerpt="Convert Excel and CSV spreadsheets to PDF via print-to-PDF. Supports .xlsx, .xls, and .csv files." \
  --porcelain)
echo "Excel to PDF post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Convert to PDF"
wp post meta update $POST_ID _tg_accept_types "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,.xlsx,.xls,.csv"
wp post meta update $POST_ID _tg_handler "excel-to-pdf"
wp post meta update $POST_ID _tg_icon "📄"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your Excel or CSV file."},{"step":"Configure","desc":"Choose orientation and styling options."},{"step":"Print to PDF","desc":"Use your browser print dialog to save as PDF."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"Which file formats are supported?","a":"XLSX, XLS, and CSV files are all supported."},{"q":"Why does a print window open?","a":"Browser security prevents direct PDF generation from spreadsheets, so we use print-to-PDF which is built into all modern browsers."},{"q":"How do I save as PDF in the print dialog?","a":"In the print dialog, look for Destination or Printer and select Save as PDF."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"📋","title":"Multiple Formats","desc":"Supports XLSX, XLS, and CSV spreadsheet formats."},{"icon":"🎨","title":"Styled Output","desc":"Preserves table borders, bold headers, and formatting."},{"icon":"📐","title":"Orientation Options","desc":"Choose portrait or landscape orientation for your PDF output."}]'

# TOOL 3 — PDF to PowerPoint
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="PDF to PowerPoint" \
  --post_name="pdf-to-ppt" \
  --post_status=publish \
  --post_excerpt="Convert PDF pages to PowerPoint slides. Each page becomes a high-quality slide image in your presentation." \
  --porcelain)
echo "PDF to PowerPoint post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Convert to PPTX"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "pdf-to-ppt"
wp post meta update $POST_ID _tg_icon "📊"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF file."},{"step":"Configure","desc":"Choose slide size and text layer options."},{"step":"Download","desc":"Download the PPTX presentation file."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"What slide sizes are supported?","a":"16:9 widescreen (standard modern) and 4:3 standard formats are supported."},{"q":"Can I edit the slides after conversion?","a":"Each page is rendered as an image, so text is not directly editable unless you enable the text layer option."},{"q":"What resolution are the slide images?","a":"Pages are rendered at 2x scale for high quality presentation output."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"🖼️","title":"High Quality Slides","desc":"Pages rendered at 2x resolution for crisp presentation images."},{"icon":"📝","title":"Optional Text Layer","desc":"Add invisible text boxes over slide images for accessibility."},{"icon":"📐","title":"16:9 and 4:3 Formats","desc":"Choose the slide aspect ratio that matches your presentation needs."}]'

# TOOL 4 — PowerPoint to PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="PowerPoint to PDF" \
  --post_name="ppt-to-pdf" \
  --post_status=publish \
  --post_excerpt="Convert PowerPoint PPTX files to PDF. Provides step-by-step print-to-PDF instructions for reliable conversion." \
  --porcelain)
echo "PowerPoint to PDF post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Convert to PDF"
wp post meta update $POST_ID _tg_accept_types "application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,.pptx,.ppt"
wp post meta update $POST_ID _tg_handler "ppt-to-pdf"
wp post meta update $POST_ID _tg_icon "📄"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PPTX or PPT file."},{"step":"View Instructions","desc":"A window opens with step-by-step conversion instructions."},{"step":"Save PDF","desc":"Follow the instructions to save your file as PDF."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"Why do I need to use print-to-PDF?","a":"PPTX rendering in browsers cannot faithfully reproduce all PowerPoint features. Print-to-PDF using PowerPoint or LibreOffice gives the best results."},{"q":"Is LibreOffice free?","a":"Yes, LibreOffice is a free, open-source office suite that opens PPTX files and can export directly to PDF."},{"q":"Can I convert without PowerPoint installed?","a":"Yes, LibreOffice Impress is a free alternative that handles PPTX conversion to PDF reliably."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"📋","title":"Clear Instructions","desc":"Step-by-step guide opens automatically for the best conversion method."},{"icon":"🆓","title":"No Software Required","desc":"Works with free LibreOffice or your existing Microsoft Office installation."},{"icon":"🔒","title":"Privacy Protected","desc":"Your presentation file is not uploaded to any server."}]'

# TOOL 5 — PDF to EPUB
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="PDF to EPUB" \
  --post_name="pdf-to-epub" \
  --post_status=publish \
  --post_excerpt="Convert PDF documents to EPUB ebook format. Extracts text and creates a properly structured EPUB 2.0 file." \
  --porcelain)
echo "PDF to EPUB post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Convert to EPUB"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "pdf-to-epub"
wp post meta update $POST_ID _tg_icon "📚"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF document."},{"step":"Configure","desc":"Choose chapter detection mode."},{"step":"Download","desc":"Download the EPUB ebook file."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"What EPUB version is created?","a":"The tool creates EPUB 2.0 format, which is compatible with all major ebook readers including Kindle, Kobo, and Apple Books."},{"q":"How does chapter detection work?","a":"Auto mode detects new chapters based on large vertical gaps in text or significantly larger font sizes. You can also split per page or use a single chapter."},{"q":"Will images from the PDF be included?","a":"Only text content is extracted. Images embedded in PDFs are not included in the EPUB output."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"📚","title":"Standard EPUB 2.0","desc":"Creates fully compliant EPUB files readable on all major ebook readers."},{"icon":"🔍","title":"Smart Chapter Detection","desc":"Automatically detects chapter breaks based on text layout and spacing."},{"icon":"🔒","title":"Browser-Based","desc":"Your PDF is processed locally without uploading to any server."}]'

# TOOL 6 — EPUB to PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="EPUB to PDF" \
  --post_name="epub-to-pdf" \
  --post_status=publish \
  --post_excerpt="Convert EPUB ebook files to PDF. Extracts all chapters in reading order and opens a print-ready document." \
  --porcelain)
echo "EPUB to PDF post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Convert to PDF"
wp post meta update $POST_ID _tg_accept_types "application/epub+zip,.epub"
wp post meta update $POST_ID _tg_handler "epub-to-pdf"
wp post meta update $POST_ID _tg_icon "📄"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your EPUB file."},{"step":"Convert","desc":"Chapters are extracted and combined in reading order."},{"step":"Print to PDF","desc":"Use the print dialog in the opened window to save as PDF."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"Which EPUB versions are supported?","a":"EPUB 2.0 and EPUB 3.0 files are both supported."},{"q":"Are all chapters included?","a":"Yes, chapters are extracted in the order defined by the EPUB spine (reading order)."},{"q":"What about images in the EPUB?","a":"Inline images referenced in EPUB HTML chapters will be included if they load correctly in the browser."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"📖","title":"Correct Reading Order","desc":"Chapters are combined following the EPUB spine order."},{"icon":"🎨","title":"Reading-Friendly Layout","desc":"Output is styled for comfortable reading with proper typography."},{"icon":"🔒","title":"Browser-Based","desc":"EPUB is processed locally — nothing uploaded to servers."}]'

# TOOL 7 — Add Signature to PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Add Signature to PDF" \
  --post_name="add-signature" \
  --post_status=publish \
  --post_excerpt="Add your handwritten, typed, or image signature to PDF documents. Sign on any page, any position." \
  --porcelain)
echo "Add Signature post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Sign PDF"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "add-signature"
wp post meta update $POST_ID _tg_icon "✍️"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload the PDF you want to sign."},{"step":"Create Signature","desc":"Draw, type, or upload your signature image."},{"step":"Download","desc":"Download the signed PDF file."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"Can I draw my signature?","a":"Yes, use the Draw tab to create a handwritten signature using your mouse or touchscreen."},{"q":"What pages can I sign?","a":"You can sign the last page, all pages, or specify custom page numbers."},{"q":"Is my signature saved?","a":"No. Signatures are processed in memory only and never stored on any server."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"✍️","title":"Three Signature Methods","desc":"Draw, type, or upload an image signature — choose what works best for you."},{"icon":"📍","title":"Flexible Positioning","desc":"Place signature at bottom right, center, left, or custom X/Y coordinates."},{"icon":"🔒","title":"Secure & Private","desc":"Signing happens entirely in your browser with no server uploads."}]'

# TOOL 8 — Crop PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Crop PDF" \
  --post_name="crop-pdf" \
  --post_status=publish \
  --post_excerpt="Crop PDF pages to remove margins or focus on specific content areas. Interactive visual crop tool with presets." \
  --porcelain)
echo "Crop PDF post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Crop PDF"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "crop-pdf"
wp post meta update $POST_ID _tg_icon "✂️"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF file."},{"step":"Set Crop Area","desc":"Drag the crop box or use presets to define the crop area."},{"step":"Download","desc":"Download the cropped PDF."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"Can I crop all pages at once?","a":"Yes, you can apply the same crop to all pages, the first page only, or a custom page range."},{"q":"What presets are available?","a":"A4 Portrait, A4 Landscape, Letter, Square, and 16:9 presets are available."},{"q":"Does cropping remove content permanently?","a":"PDF crop boxes can sometimes be restored. For permanent removal, consider using redaction instead."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"🎯","title":"Visual Crop Interface","desc":"Drag an overlay rectangle on your PDF preview to set the exact crop area."},{"icon":"📐","title":"Standard Presets","desc":"Quick presets for A4, Letter, Square, and 16:9 aspect ratios."},{"icon":"📄","title":"Multi-Page Support","desc":"Apply crop to all pages or a specific page range."}]'

# TOOL 9 — Remove Watermark
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Remove Watermark from PDF" \
  --post_name="remove-watermark" \
  --post_status=publish \
  --post_excerpt="Remove text watermarks from PDF files. Auto-detect repeated watermark text or manually draw over watermark areas." \
  --porcelain)
echo "Remove Watermark post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Remove Watermark"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "remove-watermark"
wp post meta update $POST_ID _tg_icon "🚫"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF with watermarks."},{"step":"Choose Method","desc":"Auto-detect watermarks or draw over them manually."},{"step":"Download","desc":"Download the cleaned PDF."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"What types of watermarks can be removed?","a":"Text-based watermarks that repeat across pages can be auto-detected. Image watermarks can be covered using the manual rectangle tool."},{"q":"How does auto-detection work?","a":"The tool scans the first 5 pages and finds text strings that appear multiple times, then covers them with white rectangles."},{"q":"Will it affect other content?","a":"The tool tries to cover only the watermark text. However, review the result carefully before using the cleaned PDF."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"🔍","title":"Auto-Detection","desc":"Automatically finds repeated watermark text across multiple PDF pages."},{"icon":"✏️","title":"Manual Mode","desc":"Draw rectangles directly over watermark areas for precise coverage."},{"icon":"🔒","title":"Browser-Based","desc":"Your PDF is never uploaded — processing happens locally."}]'

# TOOL 10 — Translate PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Translate PDF" \
  --post_name="pdf-translate" \
  --post_status=publish \
  --post_excerpt="Translate PDF document text to any of 20 supported languages using AI. Extract, translate, and download results." \
  --porcelain)
echo "Translate PDF post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Translate PDF"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "pdf-translate"
wp post meta update $POST_ID _tg_icon "🌍"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF document."},{"step":"Configure","desc":"Choose target language and page range."},{"step":"Download","desc":"Copy or download the translated text."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"How many languages are supported?","a":"20 languages including Spanish, French, German, Chinese, Japanese, Arabic, and more."},{"q":"Is there a page limit?","a":"For best results, translate up to 5 pages at a time. Longer documents are truncated to maintain quality."},{"q":"What AI model is used?","a":"Translation uses Google Gemini Flash for fast, accurate multilingual translation."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"🌍","title":"20 Languages","desc":"Translate to Spanish, French, German, Chinese, Japanese, Arabic, and 14 more languages."},{"icon":"🤖","title":"AI-Powered","desc":"Uses Google Gemini for accurate, context-aware translation."},{"icon":"📥","title":"Multiple Download Options","desc":"Copy to clipboard or download translated text as a .txt file."}]'

# TOOL 11 — Summarize PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Summarize PDF" \
  --post_name="pdf-summarize" \
  --post_status=publish \
  --post_excerpt="Generate AI-powered summaries of PDF documents. Choose bullet points, paragraphs, or executive summary format." \
  --porcelain)
echo "Summarize PDF post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Summarize PDF"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "pdf-summarize"
wp post meta update $POST_ID _tg_icon "📋"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF document."},{"step":"Configure","desc":"Choose summary length and format."},{"step":"Download","desc":"Copy or download your summary."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"What summary formats are available?","a":"Bullet points, paragraphs, and executive summary formats are all supported."},{"q":"How long are the summaries?","a":"Choose brief (concise), standard, or detailed summaries based on your needs."},{"q":"Can I get the summary in a different language?","a":"Yes, you can specify an output language different from the document language."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"📋","title":"Multiple Formats","desc":"Get bullet points, paragraph summaries, or executive brief format."},{"icon":"🤖","title":"AI-Powered","desc":"Uses Google Gemini to understand and condense document content."},{"icon":"📥","title":"Easy Export","desc":"Copy to clipboard or download your summary as a text file."}]'

# TOOL 12 — Extract Images from PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Extract Images from PDF" \
  --post_name="extract-images" \
  --post_status=publish \
  --post_excerpt="Extract all embedded images from PDF files. Preview thumbnails and download individually or as a ZIP archive." \
  --porcelain)
echo "Extract Images post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Extract Images"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "extract-images"
wp post meta update $POST_ID _tg_icon "🖼️"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF file."},{"step":"Extract","desc":"Images are automatically detected and extracted."},{"step":"Download","desc":"Download images individually or all as a ZIP file."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"What image formats are extracted?","a":"Images are extracted as PNG files. If direct extraction fails, each page is rendered as a PNG image."},{"q":"Can I set a minimum image size?","a":"Yes, filter by minimum size: 50px (all images), 100px (standard), or 200px (large images only)."},{"q":"What if no images are found?","a":"The tool falls back to rendering each PDF page as a high-resolution PNG image."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"🖼️","title":"Bulk Extraction","desc":"Extract all images from your PDF in one click."},{"icon":"📁","title":"ZIP Download","desc":"Download all extracted images as a single ZIP archive."},{"icon":"🔍","title":"Size Filtering","desc":"Filter images by minimum pixel size to skip small icons."}]'

# TOOL 13 — Redact PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Redact PDF" \
  --post_name="redact-pdf" \
  --post_status=publish \
  --post_excerpt="Permanently redact sensitive information from PDF files. Draw black boxes or search for text to redact automatically." \
  --porcelain)
echo "Redact PDF post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "browser"
wp post meta update $POST_ID _tg_action_label "Redact PDF"
wp post meta update $POST_ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $POST_ID _tg_handler "redact-pdf"
wp post meta update $POST_ID _tg_icon "⬛"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Upload","desc":"Upload your PDF document."},{"step":"Mark Areas","desc":"Draw black boxes over sensitive content or search for text to redact."},{"step":"Download","desc":"Download the permanently redacted PDF."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"Is redaction permanent?","a":"Yes. Black rectangles are drawn over the content using pdf-lib. Always keep a backup of the original."},{"q":"Can I redact specific text automatically?","a":"Yes, enter the text to redact and the tool will find all occurrences across the target pages."},{"q":"What pages does redaction apply to?","a":"You can redact all pages, the first page only, or specify a custom page range."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"⬛","title":"Permanent Redaction","desc":"Content is covered with solid black rectangles — not just visually hidden."},{"icon":"🔍","title":"Text Search Redaction","desc":"Automatically find and redact all occurrences of specific text."},{"icon":"✏️","title":"Manual Drawing","desc":"Draw precise redaction boxes on a visual PDF preview."}]'

# TOOL 14 — URL to PDF
POST_ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="URL to PDF" \
  --post_name="url-to-pdf" \
  --post_status=publish \
  --post_excerpt="Convert any webpage URL to PDF. Enter a URL and save the page as PDF using your browser's print function." \
  --porcelain)
echo "URL to PDF post ID: $POST_ID"

wp term set $POST_ID tool_category pdf-tools --by=slug

wp post meta update $POST_ID _tg_tool_type "url-input"
wp post meta update $POST_ID _tg_action_label "Fetch & Convert"
wp post meta update $POST_ID _tg_accept_types ""
wp post meta update $POST_ID _tg_handler "url-to-pdf"
wp post meta update $POST_ID _tg_icon "🌐"
wp post meta update $POST_ID _tg_multi_file "false"

wp post meta update $POST_ID _tg_steps '[{"step":"Enter URL","desc":"Enter the full webpage URL including https://."},{"step":"Fetch Page","desc":"The page is fetched and opened in a print window."},{"step":"Save as PDF","desc":"Select Save as PDF in the print dialog."}]'
wp post meta update $POST_ID _tg_faqs '[{"q":"What URLs are supported?","a":"Any publicly accessible URL starting with https:// or http://."},{"q":"Can I convert pages that require login?","a":"No, only publicly accessible pages without authentication can be converted."},{"q":"Are private or local URLs allowed?","a":"No, private IP ranges and local network addresses are blocked for security."}]'
wp post meta update $POST_ID _tg_features '[{"icon":"🌐","title":"Any Public URL","desc":"Convert any publicly accessible webpage to PDF format."},{"icon":"🔒","title":"Security Checked","desc":"Private IP ranges are blocked to protect your network."},{"icon":"🖨️","title":"Browser Print Quality","desc":"Uses your browser print engine for accurate, styled PDF output."}]'
```

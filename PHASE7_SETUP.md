# Phase 7 Setup — File Converter Tools (15 Tools)

Run these WP-CLI commands on your WordPress install.
Replace `/path/to/wordpress` with your actual WP root.

## 0. Create the File Tools category

```bash
wp term create tool_category "File Tools" --slug=file-tools
```

---

## Tool 1 — Excel to CSV

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Excel to CSV Converter" \
  --post_name="excel-to-csv" \
  --post_status=publish \
  --post_excerpt="Convert Excel spreadsheets (.xlsx, .xls) to CSV format instantly in your browser. Supports multiple sheets, custom delimiters, and UTF-8 BOM encoding." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "excel-to-csv"
wp post meta update $ID _tg_action_label "Convert to CSV"
wp post meta update $ID _tg_accept_types ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
wp post meta update $ID _tg_icon "📊"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload Excel","desc":"Click or drag your .xlsx or .xls file into the upload zone."},{"step":"Choose Options","desc":"Select sheet, delimiter (comma, semicolon, tab, or pipe), and encoding."},{"step":"Download CSV","desc":"Click Convert to CSV. Multi-sheet files are bundled into a ZIP."}]'
wp post meta update $ID _tg_faqs '[{"q":"Can I convert just one sheet?","a":"Yes — use the Sheet Selector dropdown to pick a specific sheet or convert all sheets at once."},{"q":"What delimiters are supported?","a":"Comma, semicolon, tab, and pipe. Choose the one that best matches your target application."},{"q":"Is UTF-8 BOM needed for Excel?","a":"Yes — if you plan to open the CSV in Excel, select UTF-8 BOM encoding to prevent character encoding issues."}]'
wp post meta update $ID _tg_features '[{"icon":"⚡","title":"Instant Conversion","desc":"SheetJS processes your file entirely in the browser — no upload, no wait."},{"icon":"📋","title":"Multi-Sheet Support","desc":"All sheets converted to individual CSVs and bundled in a ZIP download."},{"icon":"🔒","title":"100% Private","desc":"Your file never leaves your device. All processing is local."}]'
```

---

## Tool 2 — CSV to Excel

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="CSV to Excel Converter" \
  --post_name="csv-to-excel" \
  --post_status=publish \
  --post_excerpt="Convert one or multiple CSV files into a single Excel workbook (.xlsx). Each CSV becomes a separate sheet. Supports auto-detection of delimiter." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "csv-to-excel"
wp post meta update $ID _tg_action_label "Convert to Excel"
wp post meta update $ID _tg_accept_types ".csv,text/csv"
wp post meta update $ID _tg_icon "📗"
wp post meta update $ID _tg_multi_file "true"
wp post meta update $ID _tg_steps '[{"step":"Upload CSV Files","desc":"Upload one or multiple .csv files. Each file becomes a separate sheet in the workbook."},{"step":"Set Options","desc":"Choose delimiter detection, header row behavior, and sheet naming."},{"step":"Download Excel","desc":"Click Convert to Excel to get your .xlsx file instantly."}]'
wp post meta update $ID _tg_faqs '[{"q":"Can I batch-convert multiple CSVs?","a":"Yes — upload multiple CSV files and each will become a separate sheet in a single Excel workbook."},{"q":"How does auto-detect delimiter work?","a":"The tool counts occurrences of comma, semicolon, tab, and pipe in your file and picks the most frequent one."},{"q":"What Excel format is produced?","a":"The output is .xlsx format, compatible with Excel 2007 and later, LibreOffice, and Google Sheets."}]'
wp post meta update $ID _tg_features '[{"icon":"📦","title":"Batch Processing","desc":"Convert multiple CSV files into one workbook — each CSV as its own sheet."},{"icon":"🔍","title":"Auto-Detect Delimiter","desc":"Automatically identifies comma, semicolon, tab, or pipe delimiters."},{"icon":"🌐","title":"Browser-Based","desc":"No server upload. All conversion happens in your browser using SheetJS."}]'
```

---

## Tool 3 — JSON to CSV

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="JSON to CSV Converter" \
  --post_name="json-to-csv" \
  --post_status=publish \
  --post_excerpt="Convert JSON arrays or objects to CSV format. Supports nested object flattening with dot notation, array expansion, and custom delimiters." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "json-to-csv"
wp post meta update $ID _tg_action_label "Convert to CSV"
wp post meta update $ID _tg_accept_types ".json,application/json"
wp post meta update $ID _tg_icon "🔄"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload JSON","desc":"Upload a .json file containing an array of objects or a single object."},{"step":"Configure Options","desc":"Choose whether to flatten nested objects, how to handle arrays, and your delimiter."},{"step":"Download CSV","desc":"Click Convert to CSV to get a structured spreadsheet file."}]'
wp post meta update $ID _tg_faqs '[{"q":"What JSON structure is supported?","a":"Arrays of objects ([{...},{...}]) work best. Single objects are wrapped in an array. Nested objects can be flattened using dot notation keys."},{"q":"What happens to nested arrays?","a":"Arrays can be stringified (stored as JSON strings) or expanded (one row per array item)."},{"q":"Are all field types handled?","a":"Yes — strings, numbers, booleans, and null values are all handled. Fields with commas or quotes are automatically quoted."}]'
wp post meta update $ID _tg_features '[{"icon":"🔷","title":"Nested Flattening","desc":"Converts nested objects to flat CSV using dot notation (e.g. user.address.city)."},{"icon":"📐","title":"Smart Quoting","desc":"Automatically quotes fields containing delimiters, newlines, or quote characters."},{"icon":"⚙️","title":"Flexible Options","desc":"Choose delimiter, array handling, and whether to include header rows."}]'
```

---

## Tool 4 — CSV to JSON

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="CSV to JSON Converter" \
  --post_name="csv-to-json" \
  --post_status=publish \
  --post_excerpt="Convert CSV files to JSON format. Supports array of objects, indexed objects, auto-number detection, and pretty-print output." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "csv-to-json"
wp post meta update $ID _tg_action_label "Convert to JSON"
wp post meta update $ID _tg_accept_types ".csv,text/csv"
wp post meta update $ID _tg_icon "📋"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload CSV","desc":"Upload your .csv file. The tool auto-detects the delimiter."},{"step":"Choose Format","desc":"Select output format: array of objects, indexed object, or number auto-detection."},{"step":"Copy or Download","desc":"View the JSON in the preview area, then copy to clipboard or download as .json."}]'
wp post meta update $ID _tg_faqs '[{"q":"Does it handle quoted fields with commas?","a":"Yes — the parser fully handles RFC 4180 CSV format including quoted fields containing commas, newlines, and escaped quotes."},{"q":"Can numeric strings be converted to numbers?","a":"Yes — enable auto-number detection to convert fields like \"42\" to the number 42 in the JSON output."},{"q":"What output formats are available?","a":"Array of objects (default), indexed object with numeric keys, or you can use the first column as keys."}]'
wp post meta update $ID _tg_features '[{"icon":"🧮","title":"Auto Number Detection","desc":"Optionally converts numeric strings to JSON numbers automatically."},{"icon":"💅","title":"Pretty Print","desc":"Output formatted with 2-space indentation for readability, or minified for production."},{"icon":"👁","title":"Live Preview","desc":"See the first 3 parsed objects before downloading to verify your data."}]'
```

---

## Tool 5 — XML to JSON

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="XML to JSON Converter" \
  --post_name="xml-to-json" \
  --post_status=publish \
  --post_excerpt="Convert XML documents to JSON format. Handles attributes, namespaces, nested elements, and repeated tags as arrays. Uses browser's native DOMParser." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "xml-to-json"
wp post meta update $ID _tg_action_label "Convert to JSON"
wp post meta update $ID _tg_accept_types ".xml,text/xml,application/xml"
wp post meta update $ID _tg_icon "🔀"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload XML","desc":"Upload your .xml file. The tool validates it before conversion."},{"step":"Set Options","desc":"Choose whether to include attributes, remove namespace prefixes, and enable pretty print."},{"step":"Copy or Download","desc":"View the JSON output, copy it, or download as a .json file."}]'
wp post meta update $ID _tg_faqs '[{"q":"How are XML attributes handled?","a":"Attributes are included under an @attributes key by default. You can disable this to ignore attributes."},{"q":"What happens with repeated XML tags?","a":"Repeated sibling tags with the same name are automatically converted to JSON arrays."},{"q":"Are namespace prefixes removed?","a":"Optionally yes — enable Remove Namespace Prefixes to strip xmlns: prefixes from element names."}]'
wp post meta update $ID _tg_features '[{"icon":"✅","title":"Validation First","desc":"Detects malformed XML before conversion and shows a clear error message."},{"icon":"📦","title":"Array Auto-Detection","desc":"Repeated sibling elements are automatically converted to JSON arrays."},{"icon":"🏷","title":"Attribute Support","desc":"XML attributes preserved under @attributes key or optionally ignored."}]'
```

---

## Tool 6 — JSON to XML

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="JSON to XML Converter" \
  --post_name="json-to-xml" \
  --post_status=publish \
  --post_excerpt="Convert JSON objects or arrays to valid XML. Customize root element name, indentation, XML declaration, and array item tag names." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "json-to-xml"
wp post meta update $ID _tg_action_label "Convert to XML"
wp post meta update $ID _tg_accept_types ".json,application/json"
wp post meta update $ID _tg_icon "📄"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload JSON","desc":"Upload your .json file to convert."},{"step":"Customize Output","desc":"Set the root element name, array item tag, indentation, and XML declaration."},{"step":"Copy or Download","desc":"Copy the XML or download as a .xml file."}]'
wp post meta update $ID _tg_faqs '[{"q":"What root element name should I use?","a":"Use any valid XML tag name. The default is \"root\". Special characters are automatically replaced with underscores."},{"q":"How are JSON arrays handled?","a":"Arrays are wrapped in a parent tag and each item gets the configurable item tag name (default: \"item\")."},{"q":"Is the output valid XML?","a":"Yes — the tool escapes special characters (&, <, >, \", ) and ensures tag names comply with XML naming rules."}]'
wp post meta update $ID _tg_features '[{"icon":"🏗","title":"Custom Structure","desc":"Configure root element name, array item tag, and indentation style."},{"icon":"🛡","title":"Safe Escaping","desc":"Automatically escapes &, <, >, \", and apostrophes for valid XML."},{"icon":"📜","title":"XML Declaration","desc":"Optionally include the <?xml version=\"1.0\" encoding=\"UTF-8\"?> declaration."}]'
```

---

## Tool 7 — Markdown to HTML

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Markdown to HTML Converter" \
  --post_name="md-to-html" \
  --post_status=publish \
  --post_excerpt="Convert Markdown files to HTML with live preview. Supports GitHub Flavored Markdown, tables, code blocks, and generates full HTML pages with optional CSS." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "md-to-html"
wp post meta update $ID _tg_action_label "Convert to HTML"
wp post meta update $ID _tg_accept_types ".md,.markdown,text/markdown"
wp post meta update $ID _tg_icon "📝"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload Markdown","desc":"Upload your .md or .markdown file."},{"step":"Choose Options","desc":"Select fragment or full page output, include CSS styling, and enable live split preview."},{"step":"Download HTML","desc":"Download the converted HTML file or copy the code."}]'
wp post meta update $ID _tg_faqs '[{"q":"What Markdown features are supported?","a":"GitHub Flavored Markdown including tables, fenced code blocks, task lists, strikethrough, and standard headings, links, images, and formatting."},{"q":"What is the difference between fragment and full page?","a":"Fragment outputs just the HTML content. Full page wraps it in a complete HTML5 document with doctype, head, and body tags — ready to use as a standalone file."},{"q":"Is there a live preview?","a":"Yes — enable Split Preview to see a real-time rendered preview as you view or edit the Markdown source."}]'
wp post meta update $ID _tg_features '[{"icon":"👁","title":"Live Split Preview","desc":"See rendered HTML beside your Markdown source in real time."},{"icon":"🎨","title":"GitHub CSS Option","desc":"Include a GitHub-style stylesheet to match familiar Markdown rendering."},{"icon":"📄","title":"Full Page Output","desc":"Generate a complete HTML5 document with proper doctype and metadata."}]'
```

---

## Tool 8 — HTML to Markdown

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="HTML to Markdown Converter" \
  --post_name="html-to-md" \
  --post_status=publish \
  --post_excerpt="Convert HTML files to clean Markdown. Handles headings, links, images, tables, code blocks, and lists. Powered by Turndown.js." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "html-to-md"
wp post meta update $ID _tg_action_label "Convert to Markdown"
wp post meta update $ID _tg_accept_types ".html,.htm,text/html"
wp post meta update $ID _tg_icon "⬇️"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload HTML","desc":"Upload your .html or .htm file."},{"step":"Set Options","desc":"Choose heading style (ATX vs Setext), code block style, link style, and image handling."},{"step":"Copy or Download","desc":"View the Markdown output, copy to clipboard, or download as a .md file."}]'
wp post meta update $ID _tg_faqs '[{"q":"What HTML elements are converted?","a":"Headings (h1-h6), paragraphs, bold, italic, links, images, unordered and ordered lists, blockquotes, code, pre blocks, and tables."},{"q":"What is ATX vs Setext heading style?","a":"ATX uses ## symbols (GitHub style). Setext uses underline characters (===) beneath the heading text."},{"q":"Are HTML tables converted to Markdown?","a":"Yes — HTML tables are converted to GitHub Flavored Markdown tables with pipe separators."}]'
wp post meta update $ID _tg_features '[{"icon":"🧹","title":"Clean Output","desc":"Produces clean, readable Markdown without unnecessary HTML tags."},{"icon":"📊","title":"Table Support","desc":"HTML tables converted to GFM pipe-table format."},{"icon":"🔗","title":"Link Styles","desc":"Choose between inline links or reference-style links."}]'
```

---

## Tool 9 — TXT to PDF

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="TXT to PDF Converter" \
  --post_name="txt-to-pdf" \
  --post_status=publish \
  --post_excerpt="Convert plain text files to PDF. Choose page size, font, font size, margins, line spacing, and add page numbers. Instant browser-side conversion." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "txt-to-pdf"
wp post meta update $ID _tg_action_label "Convert to PDF"
wp post meta update $ID _tg_accept_types ".txt,text/plain"
wp post meta update $ID _tg_icon "📃"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload Text File","desc":"Upload your .txt file. The tool shows an estimated page count."},{"step":"Customize Layout","desc":"Set page size, font family, font size, margins, and line spacing."},{"step":"Download PDF","desc":"Click Convert to PDF to get your formatted PDF document instantly."}]'
wp post meta update $ID _tg_faqs '[{"q":"What page sizes are available?","a":"A4 (standard international), US Letter (standard North American), and A5 (compact booklet size)."},{"q":"Does it handle long lines?","a":"Yes — long lines are automatically word-wrapped to fit within the page margins."},{"q":"Can I add page numbers?","a":"Yes — enable Page Numbers to add centered page numbers at the bottom of each page."}]'
wp post meta update $ID _tg_features '[{"icon":"🔤","title":"Multiple Fonts","desc":"Choose Helvetica, Courier monospace, or Times Roman serif."},{"icon":"📐","title":"Word Wrap","desc":"Long lines automatically wrap to fit within page margins."},{"icon":"🔢","title":"Page Numbers","desc":"Optional page number footer on each page."}]'
```

---

## Tool 10 — PDF to TXT

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="PDF to TXT Converter" \
  --post_name="pdf-to-txt" \
  --post_status=publish \
  --post_excerpt="Extract text from PDF files and save as plain text. Supports page separators, page range selection, and shows word count and character count." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "pdf-to-txt"
wp post meta update $ID _tg_action_label "Convert to TXT"
wp post meta update $ID _tg_accept_types "application/pdf,.pdf"
wp post meta update $ID _tg_icon "📖"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload PDF","desc":"Upload your .pdf file."},{"step":"Choose Options","desc":"Select page separator style and optionally specify a page range."},{"step":"Download TXT","desc":"View the extracted text in the preview area, then download as .txt."}]'
wp post meta update $ID _tg_faqs '[{"q":"What text can be extracted?","a":"The tool extracts machine-readable text from PDFs. Scanned images or image-based PDFs require OCR and cannot be extracted with this tool."},{"q":"Can I extract specific pages?","a":"Yes — select Page Range and enter a range like 1-3, 5, 7-9 to extract only those pages."},{"q":"What are page separators?","a":"Page separators are text markers (like --- Page 1 ---) inserted between pages to help you identify page boundaries in the output."}]'
wp post meta update $ID _tg_features '[{"icon":"📊","title":"Word Count","desc":"Shows total word count and character count after extraction."},{"icon":"🗂","title":"Page Range","desc":"Extract text from specific pages instead of the whole document."},{"icon":"🔍","title":"Preview","desc":"See extracted text in a scrollable preview before downloading."}]'
```

---

## Tool 11 — HTML to PDF

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="HTML to PDF Converter" \
  --post_name="html-to-pdf" \
  --post_status=publish \
  --post_excerpt="Convert HTML files or pasted HTML code to PDF. Upload an HTML file for print-to-PDF workflow, or paste HTML to capture it as a PDF image." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "browser"
wp post meta update $ID _tg_handler "html-to-pdf"
wp post meta update $ID _tg_action_label "Convert to PDF"
wp post meta update $ID _tg_accept_types ".html,.htm,text/html"
wp post meta update $ID _tg_icon "🌐"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Upload or Paste HTML","desc":"Upload an HTML file or switch to Paste HTML tab and type your HTML code."},{"step":"Set Page Options","desc":"Choose page size, orientation, and margins."},{"step":"Save as PDF","desc":"For uploaded files: use the print dialog → Save as PDF. For pasted HTML: click Convert to PDF for a direct download."}]'
wp post meta update $ID _tg_faqs '[{"q":"What is the difference between Upload and Paste mode?","a":"Upload mode opens your HTML in a print window so you can use the browser Save as PDF feature for highest quality. Paste mode renders in an iframe and captures it as a PDF image using html2canvas."},{"q":"Can I convert HTML with CSS and images?","a":"Yes for Upload mode — your browser renders the full page including external stylesheets and images before printing."},{"q":"What page sizes are supported?","a":"A4 and US Letter in portrait or landscape orientation with configurable margins."}]'
wp post meta update $ID _tg_features '[{"icon":"🖨","title":"Print-Quality Output","desc":"Upload mode uses the browser print engine for highest fidelity PDF output."},{"icon":"✂️","title":"Paste Mode","desc":"Paste HTML directly and convert to PDF without creating a file."},{"icon":"📐","title":"Page Control","desc":"Set page size, orientation, and margins before converting."}]'
```

---

## Tool 12 — Base64 Encoder

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Base64 Encoder" \
  --post_name="base64-encoder" \
  --post_status=publish \
  --post_excerpt="Encode text or any file to Base64. Supports standard, URL-safe, and MIME encoding. Live encoding updates as you type. Files output as raw Base64 or Data URLs." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "base64-encoder"
wp post meta update $ID _tg_action_label "Encode"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "🔐"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Enter Text or Upload File","desc":"Switch between Text tab (live encoding) and File tab (encode any file type)."},{"step":"Choose Encoding Type","desc":"Select Standard RFC 4648, URL-safe (replaces + and /), or MIME format with line wrapping."},{"step":"Copy or Download","desc":"Copy the Base64 output to clipboard or download as a .txt file."}]'
wp post meta update $ID _tg_faqs '[{"q":"What is Base64 encoding?","a":"Base64 converts binary data into a text string using 64 ASCII characters. It is commonly used to embed images in HTML/CSS, transmit binary data in JSON, and encode email attachments."},{"q":"What is URL-safe Base64?","a":"URL-safe Base64 replaces + with - and / with _ and omits padding =, making it safe to use in URLs without percent-encoding."},{"q":"What is MIME Base64?","a":"MIME Base64 wraps output at 76 characters per line with CRLF, as required by email standards (RFC 2045)."}]'
wp post meta update $ID _tg_features '[{"icon":"⚡","title":"Live Encoding","desc":"Text tab encodes in real time as you type — no button needed."},{"icon":"🗃","title":"File Encoding","desc":"Encode any file type — images, documents, binary files — to Base64 or Data URL."},{"icon":"📊","title":"Size Comparison","desc":"Shows how much larger the Base64 output is compared to the original input."}]'
```

---

## Tool 13 — Base64 Decoder

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Base64 Decoder" \
  --post_name="base64-decoder" \
  --post_status=publish \
  --post_excerpt="Decode Base64 strings back to text, images, or binary files. Auto-detects Data URLs and shows image previews. Handles URL-safe and standard Base64." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "base64-decoder"
wp post meta update $ID _tg_action_label "Decode"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "🔓"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Paste Base64 Input","desc":"Paste your Base64 string or Data URL (data:image/png;base64,...) into the input area."},{"step":"Click Decode","desc":"The tool auto-detects whether the result is text, an image, or binary data."},{"step":"Copy, Preview, or Download","desc":"Copy decoded text, preview images inline, or download binary files."}]'
wp post meta update $ID _tg_faqs '[{"q":"What types of output are supported?","a":"Text (UTF-8), images (shown as preview), and binary files (offered as download). The tool auto-detects the content type."},{"q":"Can I decode Data URLs?","a":"Yes — paste a full data URL like data:image/png;base64,... and the tool will extract and show the image."},{"q":"What if the Base64 string is invalid?","a":"The tool shows a clear error message explaining what went wrong, such as invalid characters or incorrect padding."}]'
wp post meta update $ID _tg_features '[{"icon":"🖼","title":"Image Preview","desc":"Base64-encoded images are displayed inline as a visual preview."},{"icon":"🔍","title":"Auto-Detection","desc":"Automatically detects text, image, and binary content types."},{"icon":"📦","title":"Binary Download","desc":"Binary files that cannot be displayed are offered as a direct download."}]'
```

---

## Tool 14 — URL Encoder / Decoder

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="URL Encoder / Decoder" \
  --post_name="url-encoder" \
  --post_status=publish \
  --post_excerpt="Encode and decode URLs and query strings. Live bidirectional encoding, full URL encoder that preserves structure, and recursive decode for double-encoded URLs." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "url-encoder"
wp post meta update $ID _tg_action_label "Encode / Decode"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "🔗"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Type in Encode or Decode","desc":"Type in either the Encode or Decode input — the output updates live as you type."},{"step":"Choose Encode Type","desc":"Select Full (encodeURIComponent), Partial, or Form Data encoding."},{"step":"Copy Result","desc":"Click Copy to copy the encoded or decoded value to your clipboard."}]'
wp post meta update $ID _tg_faqs '[{"q":"What is the difference between encode types?","a":"Full (encodeURIComponent) encodes everything except letters, digits, and - _ . ~. Partial only encodes truly unsafe characters. Form data uses + for spaces (application/x-www-form-urlencoded)."},{"q":"What is the Full URL Encoder?","a":"It parses the URL structure and only encodes the query parameter values, preserving the protocol, domain, path, and parameter names."},{"q":"What is Decode All?","a":"Repeatedly decodes URL-encoded sequences until no %xx patterns remain, useful for double-encoded or triple-encoded URLs."}]'
wp post meta update $ID _tg_features '[{"icon":"⚡","title":"Live Bidirectional","desc":"Both encode and decode inputs update output live as you type."},{"icon":"🔗","title":"Smart URL Encoder","desc":"Encode full URLs while preserving protocol, domain, and path structure."},{"icon":"🔁","title":"Recursive Decode","desc":"Decode All mode handles double and triple encoded URLs automatically."}]'
```

---

## Tool 15 — Hash Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Hash Generator" \
  --post_name="hash-generator" \
  --post_status=publish \
  --post_excerpt="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes for text or files. Live hashing as you type. Use for file integrity verification." \
  --porcelain)

wp post term set $ID tool_category file-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "hash-generator"
wp post meta update $ID _tg_action_label "Generate Hash"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "#️⃣"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Enter Text or Upload File","desc":"Switch between Text tab for live hashing or File tab to hash any file."},{"step":"Select Algorithms","desc":"Check the hash algorithms you need: MD5, SHA-1, SHA-256, SHA-384, SHA-512."},{"step":"Copy Hash Values","desc":"Click Copy next to any hash to copy it to your clipboard for verification."}]'
wp post meta update $ID _tg_faqs '[{"q":"Which hash algorithms are supported?","a":"MD5 (128-bit), SHA-1 (160-bit), SHA-256 (256-bit), SHA-384 (384-bit), and SHA-512 (512-bit). SHA variants use the browser Web Crypto API. MD5 uses a pure JavaScript implementation."},{"q":"How do I verify file integrity?","a":"Hash the original file and compare the hash value to the one provided by the download source. If they match exactly, the file is identical."},{"q":"Is MD5 secure for passwords?","a":"No — MD5 and SHA-1 are cryptographically broken. Use SHA-256 or higher for security-sensitive applications. MD5 is only suitable for file integrity checks."}]'
wp post meta update $ID _tg_features '[{"icon":"⚡","title":"Live Text Hashing","desc":"Text tab generates all selected hashes in real time as you type."},{"icon":"📁","title":"File Hashing","desc":"Hash any file — documents, images, executables — to verify integrity."},{"icon":"📋","title":"One-Click Copy","desc":"Individual Copy buttons for each hash algorithm result."}]'
```

---

## Verify all tools were created

```bash
wp post list --post_type=tg_tool --post_status=publish --fields=ID,post_title,post_name \
  --name__in=excel-to-csv,csv-to-excel,json-to-csv,csv-to-json,xml-to-json,json-to-xml,md-to-html,html-to-md,txt-to-pdf,pdf-to-txt,html-to-pdf,base64-encoder,base64-decoder,url-encoder,hash-generator
```

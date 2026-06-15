# Phase 2 — Test Tool Setup

Run the WP-CLI commands below from your WordPress root
(`D:\xampp\htdocs\toolsgallery`) to create a sample `tg_tool` post
that exercises every section of `single-tool.php`.

---

## 1. Create the tool post

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Merge PDF" \
  --post_name="merge-pdf" \
  --post_status=publish \
  --post_excerpt="Combine multiple PDF files into one document — fast, free, and entirely in your browser." \
  --porcelain
```

> Note the returned post ID (e.g. `42`). Use it in every command below.

---

## 2. Assign to the pdf-tools category

```bash
wp post term set <POST_ID> tool_category pdf-tools
```

---

## 3. Set meta fields

```bash
# Tool type (browser, ai, or server)
wp post meta update <POST_ID> _tg_tool_type "browser"

# Action button label
wp post meta update <POST_ID> _tg_action_label "Merge PDFs"

# File accept types (MIME + extension)
wp post meta update <POST_ID> _tg_accept_types "application/pdf,.pdf"

# Internal handler key (real handler added in a later phase)
wp post meta update <POST_ID> _tg_handler "merge"

# Optional emoji icon shown in related/popular widgets
wp post meta update <POST_ID> _tg_icon "📄"
```

---

## 4. Add How-to steps (JSON)

```bash
wp post meta update <POST_ID> _tg_steps \
  '[{"step":"Upload your PDFs","desc":"Select one or more PDF files from your device or drag them onto the upload area."},{"step":"We process it in your browser","desc":"All merging happens locally — your files never leave your computer."},{"step":"Download the merged PDF","desc":"Click Download to save the combined file to your device."}]'
```

---

## 5. Add FAQ entries (JSON)

```bash
wp post meta update <POST_ID> _tg_faqs \
  '[{"q":"Is there a limit on how many PDFs I can merge?","a":"No — you can merge as many PDFs as your browser can handle. For very large batches, we recommend working in groups of 10–20 files."},{"q":"Are my files uploaded to your servers?","a":"No. Everything is processed locally in your browser. Your files are never sent to or stored on our servers."},{"q":"What browsers are supported?","a":"Merge PDF works in any modern browser — Chrome, Firefox, Safari, and Edge. No plugins or extensions required."}]'
```

---

## 6. (Optional) Add feature cards (JSON)

```bash
wp post meta update <POST_ID> _tg_features \
  '[{"icon":"🔒","title":"100% Private","desc":"Files are processed in your browser and never uploaded anywhere."},{"icon":"⚡","title":"Instant Merge","desc":"Combines PDFs in seconds regardless of the number of pages."},{"icon":"🆓","title":"Always Free","desc":"No account, no watermarks, no fees — ever."}]'
```

---

## 7. Flush rewrite rules

```bash
wp rewrite flush
```

---

## 8. View the page

Navigate to: `http://localhost/toolsgallery/tool/merge-pdf/`

### What you should see

| Section | Expected behaviour |
|---|---|
| Breadcrumb | Home › Tools › PDF Tools › Merge PDF |
| Leaderboard ad | Ad placeholder banner (desktop only) |
| H1 | "Merge PDF" |
| Excerpt | "Combine multiple PDF files…" |
| Tool UI box | Upload zone with cloud SVG, orange action button (disabled until file chosen) |
| File pick | Click / drag a PDF → file name + size row appears, button enables |
| Action click | Progress bar animates ~1.5 s, then success banner + Download button |
| Download | Downloads `toolsgallery-output.txt` (placeholder) |
| Process another | Resets box to initial state |
| In-content ad | Ad placeholder after tool box |
| How to Use | 3 numbered steps |
| Features | 3-column feature cards |
| FAQ | `<details>` accordion with 3 Q&As, orange chevron rotates on open |
| Related Tools | Falls back to other tools in pdf-tools category |
| Sidebar | Rectangle ad + Popular Tools list + Categories list |
| `<head>` | BreadcrumbList, SoftwareApplication, FAQPage JSON-LD |

---

## Testing the AI tool type

Create a second tool to test the AI box:

```bash
wp post create \
  --post_type=tg_tool \
  --post_title="Blog Post Generator" \
  --post_name="blog-post-generator" \
  --post_status=publish \
  --post_excerpt="Generate SEO-friendly blog posts from a topic or outline in seconds." \
  --porcelain

wp post term set <AI_POST_ID> tool_category ai-tools
wp post meta update <AI_POST_ID> _tg_tool_type "ai"
wp post meta update <AI_POST_ID> _tg_action_label "Generate Post"
wp post meta update <AI_POST_ID> _tg_handler "blog-writer"
wp post meta update <AI_POST_ID> _tg_icon "✍️"
wp rewrite flush
```

Navigate to: `http://localhost/toolsgallery/tool/blog-post-generator/`

- Without `OPENROUTER_API_KEY` in `wp-config.php`, clicking **Generate Post**
  should display a friendly warning:
  *"AI tools require an OpenRouter API key. Add OPENROUTER_API_KEY to wp-config.php to enable this tool."*
- With the key set, the AJAX call fires and the result appears with word count,
  Copy, and Download buttons.

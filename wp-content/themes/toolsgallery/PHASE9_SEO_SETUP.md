# Phase 9 — SEO: Unique Content for 59 Thin Tool Pages

## What This Script Does

`fix-thin-tools-seo.php` updates the `post_content` of 59 thin tool pages
with unique, humanized, SEO-optimized content (250–450 words each).

**Content features per tool:**
- AEO definition opener ("X is a free online tool that…")
- Specific user persona targeting (not generic "anyone who needs to…")
- 2 internal links to genuinely related tools
- Natural keyword density 1–2% for "free online [tool name]"
- E-E-A-T signals: expertise, privacy, trust notes
- Soft CTA closing line
- No banned phrases ("In today's digital world", "Are you looking for…")

**Tools covered:**
- 16 PDF tools
- 24 Image tools
- 19 AI Writing / Utility tools

---

## How to Run

### On a local XAMPP install (Windows)

```powershell
# Navigate to your WordPress root first
cd D:\xampp\htdocs\toolsgallery

# Run the script
wp eval-file wp-content/themes/toolsgallery/fix-thin-tools-seo.php
```

### On a cPanel / Linux server

```bash
wp eval-file wp-content/themes/toolsgallery/fix-thin-tools-seo.php \
  --path=/home/yourusername/public_html
```

### On WP Engine / managed hosts (SSH required)

```bash
cd ~/sites/yoursitename/
wp eval-file wp-content/themes/toolsgallery/fix-thin-tools-seo.php
```

---

## Verify Results After Running

### Check word counts for all tool pages

```bash
wp post list \
  --post_type=tg_tool \
  --post_status=publish \
  --fields=ID,post_title,post_content \
  --format=json | \
  php -r "
    \$posts = json_decode(file_get_contents('php://stdin'), true);
    \$thin = 0;
    foreach (\$posts as \$p) {
      \$wc = str_word_count(strip_tags(\$p['post_content']));
      if (\$wc < 200) {
        echo 'THIN (' . \$wc . ' words): ' . \$p['post_title'] . PHP_EOL;
        \$thin++;
      }
    }
    echo PHP_EOL . 'Thin pages remaining: ' . \$thin . PHP_EOL;
  "
```

### Spot-check a single tool

```bash
wp post get $(wp post list --post_type=tg_tool --name=resize-image --field=ID) \
  --field=post_content
```

---

## Test Run (3 Tools Only)

Before running on all 59, test on 3 tools by temporarily limiting the `$tools`
array in the script (comment out all entries except the 3 you want to test),
then restore and run in full.

```bash
# PHP syntax check first
php -l wp-content/themes/toolsgallery/fix-thin-tools-seo.php
```

Expected output:
```
No syntax errors detected in fix-thin-tools-seo.php
```

---

## Handler → Tool Mapping Reference

| Handler | Tool Name |
|---|---|
| url-to-pdf | URL to PDF |
| redact-pdf | Redact PDF |
| extract-images | Extract Images from PDF |
| pdf-summarize | Summarize PDF |
| pdf-translate | Translate PDF |
| remove-watermark | Remove Watermark from PDF |
| crop-pdf | Crop PDF |
| add-signature | Add Signature to PDF |
| epub-to-pdf | EPUB to PDF |
| pdf-to-epub | PDF to EPUB |
| ppt-to-pdf | PowerPoint to PDF |
| pdf-to-ppt | PDF to PowerPoint |
| excel-to-pdf | Excel to PDF |
| pdf-to-excel | PDF to Excel |
| add-watermark | Add Watermark to PDF |
| word-to-pdf | Word to PDF |
| img-to-avif | Convert Image to AVIF |
| img-to-tiff | Convert Image to TIFF |
| img-to-svg | Convert Image to SVG |
| img-to-ico | Convert Image to ICO |
| img-to-bmp | Convert Image to BMP |
| img-to-gif | Convert Image to GIF |
| img-to-webp | Convert Image to WebP |
| img-to-png | Convert Image to PNG |
| img-to-jpg | Convert Image to JPG |
| img-chart | Chart Maker |
| img-meme | Meme Generator |
| img-profile | Profile Photo Maker |
| img-collage | Collage Maker |
| img-combine | Combine Images |
| img-ocr | Image to Text OCR |
| img-upscale | Upscale Image |
| img-restore | Restore Old Photo |
| img-colorize | Colorize Image |
| img-sharpen | Sharpen Image |
| img-grayscale | Convert Image to Grayscale |
| img-convert | Convert Image Format |
| img-flip | Flip Image |
| img-crop | Crop Image |
| img-resize | Resize Image |
| url-encoder | URL Encoder / Decoder |
| slogan-generator | Slogan Generator |
| lyrics-generator | Lyrics Generator |
| poem-generator | Poem Generator |
| story-generator | Story Generator |
| faq-generator | FAQ Generator |
| youtube-desc-writer | YouTube Description Writer |
| youtube-title-generator | YouTube Title Generator |
| hashtag-generator | Hashtag Generator |
| social-caption-writer | Social Media Caption Writer |
| ad-copy-generator | Ad Copy Generator |
| product-desc-writer | Product Description Writer |
| resume-writer | Resume Writer |
| email-writer | Email Writer |
| sentence-rewriter | Sentence Rewriter |
| ai-translator | AI Text Translator |
| blog-post-generator | Blog Post Generator |
| article-writer | Article Writer |
| essay-writer | Essay Writer |

---

## Content Quality Checklist (per tool)

- [ ] Opens with AEO definition sentence
- [ ] Mentions specific user personas (not generic)
- [ ] Includes tool name naturally 3–4 times
- [ ] Has 2 internal links to related tools
- [ ] No "In today's digital world" or "Are you looking for"
- [ ] 250–450 words per tool
- [ ] Closes with "Try [tool name] free above — no signup needed."

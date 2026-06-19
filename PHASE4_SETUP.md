# Phase 4 — Image Tools Setup

Run each WP-CLI command to create the tool posts. All tools use the `image-tools` category.

## Prerequisites

```bash
# Create the image-tools category first (if not already present)
wp term create tool_category "Image Tools" --slug=image-tools
```

---

## Tools 1–30 (Core Image Tools)

```bash
# Tool 1 — Compress Image
wp post create --post_type=tg_tool --post_title="Compress Image" --post_status=publish --post_excerpt="Reduce image file size without losing quality. Supports JPG, PNG, and WebP. Batch mode available." \
  --meta_input='{"_tg_handler":"img-compress","_tg_tool_type":"browser","_tg_accept_types":"image/jpeg,image/png,image/webp","_tg_multi_file":"true","_tg_action_label":"Compress Images"}'

# Tool 2 — Resize Image
wp post create --post_type=tg_tool --post_title="Resize Image" --post_status=publish --post_excerpt="Resize images by dimensions, percentage, or preset sizes while keeping aspect ratio." \
  --meta_input='{"_tg_handler":"img-resize","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Resize Image"}'

# Tool 3 — Crop Image
wp post create --post_type=tg_tool --post_title="Crop Image" --post_status=publish --post_excerpt="Crop images with free-form or fixed aspect ratio. Supports circle crop for avatars." \
  --meta_input='{"_tg_handler":"img-crop","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Crop Image"}'

# Tool 4 — Flip Image
wp post create --post_type=tg_tool --post_title="Flip Image" --post_status=publish --post_excerpt="Flip images horizontally, vertically, or both. Live preview before download." \
  --meta_input='{"_tg_handler":"img-flip","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Flip Image"}'

# Tool 5 — Rotate Image
wp post create --post_type=tg_tool --post_title="Rotate Image" --post_status=publish --post_excerpt="Rotate images by any angle — quick 90° buttons or custom angle slider." \
  --meta_input='{"_tg_handler":"img-rotate","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Rotate Image"}'

# Tool 6 — Add Text to Image
wp post create --post_type=tg_tool --post_title="Add Text to Image" --post_status=publish --post_excerpt="Add styled text overlays to images with full font, color, and positioning control." \
  --meta_input='{"_tg_handler":"img-add-text","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Add Text"}'

# Tool 7 — Add Border to Image
wp post create --post_type=tg_tool --post_title="Add Border to Image" --post_status=publish --post_excerpt="Add solid, dashed, or double borders with custom colors, width, and corner radius." \
  --meta_input='{"_tg_handler":"img-add-border","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Add Border"}'

# Tool 8 — Convert Image Format
wp post create --post_type=tg_tool --post_title="Convert Image Format" --post_status=publish --post_excerpt="Convert images between JPG, PNG, WebP, GIF, BMP, ICO, TIFF, AVIF, and HEIC formats." \
  --meta_input='{"_tg_handler":"img-convert","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Convert Images"}'

# Tool 9 — Grayscale Image
wp post create --post_type=tg_tool --post_title="Convert Image to Grayscale" --post_status=publish --post_excerpt="Convert color images to grayscale using luminance, average, or desaturation methods." \
  --meta_input='{"_tg_handler":"img-grayscale","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Convert to Grayscale"}'

# Tool 10 — Sharpen Image
wp post create --post_type=tg_tool --post_title="Sharpen Image" --post_status=publish --post_excerpt="Sharpen blurry images using convolution kernels. Before/after comparison slider." \
  --meta_input='{"_tg_handler":"img-sharpen","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Sharpen Image"}'

# Tool 11 — Remove Background
wp post create --post_type=tg_tool --post_title="Remove Background from Image" --post_status=publish --post_excerpt="Automatically remove image backgrounds using AI or manual flood-fill selection." \
  --meta_input='{"_tg_handler":"img-remove-bg","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Remove Background"}'

# Tool 12 — Colorize Image
wp post create --post_type=tg_tool --post_title="Colorize Image" --post_status=publish --post_excerpt="Apply color effects to images — sepia, warm, cool tones, or custom hue colorization." \
  --meta_input='{"_tg_handler":"img-colorize","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Colorize Image"}'

# Tool 13 — Restore Image
wp post create --post_type=tg_tool --post_title="Restore Old Photo" --post_status=publish --post_excerpt="Enhance and restore old or damaged photos with brightness, contrast, and sharpness controls." \
  --meta_input='{"_tg_handler":"img-restore","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Restore Photo"}'

# Tool 14 — Upscale Image
wp post create --post_type=tg_tool --post_title="Upscale Image" --post_status=publish --post_excerpt="Increase image resolution by 2×, 3×, or 4× using high-quality interpolation." \
  --meta_input='{"_tg_handler":"img-upscale","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Upscale Image"}'

# Tool 15 — Blur Background
wp post create --post_type=tg_tool --post_title="Blur Image Background" --post_status=publish --post_excerpt="Select a region to keep sharp while blurring the rest — perfect for portrait effects." \
  --meta_input='{"_tg_handler":"img-blur-bg","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Blur Background"}'

# Tool 16 — Remove Watermark
wp post create --post_type=tg_tool --post_title="Remove Watermark from Image" --post_status=publish --post_excerpt="Select watermark areas and fill them using content-aware color sampling." \
  --meta_input='{"_tg_handler":"img-remove-watermark","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Remove Watermark"}'

# Tool 17 — Remove Objects
wp post create --post_type=tg_tool --post_title="Remove Objects from Image" --post_status=publish --post_excerpt="Paint over unwanted objects and remove them using content-aware fill." \
  --meta_input='{"_tg_handler":"img-remove-objects","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Remove Objects"}'

# Tool 18 — Image to Text (OCR)
wp post create --post_type=tg_tool --post_title="Image to Text (OCR)" --post_status=publish --post_excerpt="Extract text from images and photos using AI-powered OCR. Download as TXT file." \
  --meta_input='{"_tg_handler":"img-ocr","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Extract Text"}'

# Tool 19 — Translate Text in Image
wp post create --post_type=tg_tool --post_title="Translate Text in Image" --post_status=publish --post_excerpt="Extract and translate text from images into 20+ languages using AI." \
  --meta_input='{"_tg_handler":"img-translate-text","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Extract & Translate"}'

# Tool 20 — Change Image Background
wp post create --post_type=tg_tool --post_title="Change Image Background" --post_status=publish --post_excerpt="Replace image backgrounds with a solid color, gradient, or another image." \
  --meta_input='{"_tg_handler":"img-change-bg","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Change Background"}'

# Tool 21 — Split Image
wp post create --post_type=tg_tool --post_title="Split Image into Parts" --post_status=publish --post_excerpt="Split images into grids (2×2, 3×3, 4×4) or halves. Download all pieces as ZIP." \
  --meta_input='{"_tg_handler":"img-split","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Split Image"}'

# Tool 22 — Combine Images
wp post create --post_type=tg_tool --post_title="Combine Images" --post_status=publish --post_excerpt="Merge multiple images horizontally, vertically, or in a grid layout." \
  --meta_input='{"_tg_handler":"img-combine","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Combine Images"}'

# Tool 23 — Collage Maker
wp post create --post_type=tg_tool --post_title="Collage Maker" --post_status=publish --post_excerpt="Create beautiful photo collages with smart layouts for 1–9 images." \
  --meta_input='{"_tg_handler":"img-collage","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Create Collage"}'

# Tool 24 — Round Image Corners
wp post create --post_type=tg_tool --post_title="Make Round Image" --post_status=publish --post_excerpt="Create circular or rounded-corner images with optional transparent background." \
  --meta_input='{"_tg_handler":"img-round","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Make Round"}'

# Tool 25 — Profile Photo Maker
wp post create --post_type=tg_tool --post_title="Profile Photo Maker" --post_status=publish --post_excerpt="Create perfect profile photos for LinkedIn, Twitter, Facebook, Instagram and more." \
  --meta_input='{"_tg_handler":"img-profile","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Create Profile Photo"}'

# Tool 26 — Pixelate Image
wp post create --post_type=tg_tool --post_title="Pixelate Image" --post_status=publish --post_excerpt="Pixelate entire images or specific regions to hide faces, text, or sensitive content." \
  --meta_input='{"_tg_handler":"img-pixelate","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Pixelate Image"}'

# Tool 27 — Add Watermark
wp post create --post_type=tg_tool --post_title="Add Watermark to Image" --post_status=publish --post_excerpt="Add text or image watermarks with full control over position, opacity, and rotation." \
  --meta_input='{"_tg_handler":"img-watermark","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Add Watermark"}'

# Tool 28 — Meme Generator
wp post create --post_type=tg_tool --post_title="Meme Generator" --post_status=publish --post_excerpt="Create memes with custom top and bottom text in Impact or other fonts." \
  --meta_input='{"_tg_handler":"img-meme","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Create Meme"}'

# Tool 29 — Chart Maker
wp post create --post_type=tg_tool --post_title="Chart Maker" --post_status=publish --post_excerpt="Create bar, line, pie, doughnut, radar and other charts from your data. Download as PNG." \
  --meta_input='{"_tg_handler":"img-chart","_tg_tool_type":"data-input","_tg_accept_types":"","_tg_multi_file":"false","_tg_action_label":"Generate Chart"}'

# Tool 30 — QR Code Generator
wp post create --post_type=tg_tool --post_title="QR Code Generator" --post_status=publish --post_excerpt="Generate QR codes from any text or URL with custom colors and error correction levels." \
  --meta_input='{"_tg_handler":"img-qr","_tg_tool_type":"data-input","_tg_accept_types":"","_tg_multi_file":"false","_tg_action_label":"Generate QR Code"}'
```

---

## Tools 31–40 (Format Converters, reuse img-convert.js)

Each converter locks the output format via `_tg_output_format` meta. The `img-convert.js` handler reads `box.dataset.outputFormat` and skips the format selector dropdown when it's set.

```bash
# Tool 31 — JPG Converter (to JPG)
wp post create --post_type=tg_tool --post_title="Convert Image to JPG" --post_status=publish --post_excerpt="Convert PNG, WebP, GIF, BMP, TIFF and other formats to JPG online." \
  --meta_input='{"_tg_handler":"img-to-jpg","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Convert to JPG","_tg_output_format":"jpg"}'

# Tool 32 — PNG Converter
wp post create --post_type=tg_tool --post_title="Convert Image to PNG" --post_status=publish --post_excerpt="Convert JPG, WebP, GIF, BMP, TIFF and other formats to PNG with transparency support." \
  --meta_input='{"_tg_handler":"img-to-png","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Convert to PNG","_tg_output_format":"png"}'

# Tool 33 — WebP Converter
wp post create --post_type=tg_tool --post_title="Convert Image to WebP" --post_status=publish --post_excerpt="Convert JPG, PNG, GIF and other formats to WebP for smaller file sizes." \
  --meta_input='{"_tg_handler":"img-to-webp","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Convert to WebP","_tg_output_format":"webp"}'

# Tool 34 — GIF Converter
wp post create --post_type=tg_tool --post_title="Convert Image to GIF" --post_status=publish --post_excerpt="Convert JPG, PNG, WebP and other image formats to GIF." \
  --meta_input='{"_tg_handler":"img-to-gif","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Convert to GIF","_tg_output_format":"gif"}'

# Tool 35 — BMP Converter
wp post create --post_type=tg_tool --post_title="Convert Image to BMP" --post_status=publish --post_excerpt="Convert JPG, PNG, WebP and other formats to BMP bitmap format." \
  --meta_input='{"_tg_handler":"img-to-bmp","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Convert to BMP","_tg_output_format":"bmp"}'

# Tool 36 — ICO Converter
wp post create --post_type=tg_tool --post_title="Convert Image to ICO" --post_status=publish --post_excerpt="Convert images to ICO favicon format for websites and applications." \
  --meta_input='{"_tg_handler":"img-to-ico","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Convert to ICO","_tg_output_format":"ico"}'

# Tool 37 — SVG Converter
wp post create --post_type=tg_tool --post_title="Convert Image to SVG" --post_status=publish --post_excerpt="Convert raster images to SVG vector format (embedded raster in SVG container)." \
  --meta_input='{"_tg_handler":"img-to-svg","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"false","_tg_action_label":"Convert to SVG","_tg_output_format":"svg"}'

# Tool 38 — TIFF Converter
wp post create --post_type=tg_tool --post_title="Convert Image to TIFF" --post_status=publish --post_excerpt="Convert JPG, PNG, WebP and other formats to TIFF for professional use." \
  --meta_input='{"_tg_handler":"img-to-tiff","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Convert to TIFF","_tg_output_format":"tiff"}'

# Tool 39 — AVIF Converter
wp post create --post_type=tg_tool --post_title="Convert Image to AVIF" --post_status=publish --post_excerpt="Convert images to AVIF format for the best compression and quality ratio." \
  --meta_input='{"_tg_handler":"img-to-avif","_tg_tool_type":"browser","_tg_accept_types":"image/*","_tg_multi_file":"true","_tg_action_label":"Convert to AVIF","_tg_output_format":"avif"}'

# Tool 40 — HEIC Converter
wp post create --post_type=tg_tool --post_title="Convert HEIC to JPG" --post_status=publish --post_excerpt="Convert HEIC/HEIF photos from iPhone to JPG, PNG or WebP instantly in your browser." \
  --meta_input='{"_tg_handler":"img-to-heic","_tg_tool_type":"browser","_tg_accept_types":"image/heic,image/heif,image/*","_tg_multi_file":"true","_tg_action_label":"Convert HEIC","_tg_input_format":"heic","_tg_output_format":"jpg"}'
```

---

## Assign All Tools to Image Tools Category

After creating all posts, assign them to the image-tools category:

```bash
# Get all tg_tool post IDs and assign the image-tools term
wp post list --post_type=tg_tool --format=ids | xargs -I{} wp post term add {} tool_category image-tools
```

Or assign individually by replacing POST_ID with the actual ID returned by each `wp post create` command.

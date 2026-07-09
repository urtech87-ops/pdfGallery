# Image Tools Phase 1 — Fix Report

## Root causes found

1. **None of the 20 image tool scripts were enqueued.** functions.php had enqueue
   blocks for PDF, AI, utility, file, and video tools — but no `$img_tool_files`
   block. The tool pages loaded with no handler registered, so every image tool
   was dead. Fixed with a new enqueue block using `filemtime()` cache busting.
2. **Inline `<script>` tags in `getOptionsHTML()` never execute.** The tool
   runner injects options via `innerHTML` and calls a `wireOptions(container)`
   hook instead (see tool-runner.js). Every image tool relied on inline scripts,
   so all sliders/buttons/toggles were inert. All 20 tools now implement
   `wireOptions`.
3. **Missing server endpoints.** `img-ocr`/`img-translate-text` called a
   nonexistent `tg_image_ai` AJAX action; `img-remove-bg` called a nonexistent
   `tg_removebg` action. OCR now runs in-browser with Tesseract.js; translation
   goes through the existing `tg_ai_proxy` (`ai-translator`); a real
   `tg_removebg` handler was added that proxies to remove.bg when
   `REMOVEBG_API_KEY` is defined in wp-config.php.
4. **Missing libraries.** Cropper.js (img-crop) and Fabric.js (img-add-text)
   are now enqueued conditionally for those handlers.
5. **Broken two-click flow in interactive tools.** crop/add-text/blur-bg/
   watermark/objects/change-bg set up their canvas UI inside `run()` and
   resolved with a placeholder, which cropped/exported immediately or threw on
   the first click. UI setup moved to the runner's `onFileReady` hook; `run()`
   now just applies the edit.
6. **img-sharpen kernel bug.** The old kernel multiplied only the center weight
   by intensity, so the kernel summed to ≫1 and blew out brightness. Kernel is
   now normalized (`center = 1 + n·a`, neighbors `−a`).

## New shared utility

`assets/js/tools/img-util.js` (`window.TGImageUtil`): loadImage, imageToCanvas,
canvasToBlob, getMime, stripExt, getExt, toGrayscale, toSepia, adjustBrightness,
sharpen, convolve3x3, drawPreview, fmtBytes, loadScript. Enqueued as
`tg-img-util`, a dependency of every image tool script.

## Verification

- `php -l functions.php` — no syntax errors.
- `node --check` on all 21 JS files — pass.
- Headless-Chromium smoke test: every tool registers in `window.TGTools`,
  renders options HTML, and wires events without page errors; 13 tools that
  need no user interaction were run end-to-end against a generated test image
  and produced valid output blobs.

| Tool | Status | Output | Notes |
|------|--------|--------|-------|
| img-compress | ✅ | .jpg/.png | run() verified in Chromium; quality slider + multi-file table; ZIP via already-enqueued JSZip |
| img-resize | ✅ | .jpg/.png | run() verified; dimensions auto-filled on upload via onFileReady |
| img-crop | ✅ | .jpg/.png | Cropper.js now enqueued; crop UI opens on upload; registered/wired verified (needs manual crop interaction) |
| img-flip | ✅ | .jpg/.png | run() verified; live preview on upload |
| img-rotate | ✅ | .jpg/.png | run() verified; quick buttons + custom angle + live preview |
| img-add-text | ✅ | .jpg | Fabric.js now enqueued; editor opens on upload (needs manual text interaction) |
| img-add-border | ✅ | .jpg/.png | run() verified; solid/dashed/double, rounded corners, padding |
| img-convert | ✅ | varies | run() verified (JPG→PNG); white fill for JPG/BMP |
| img-grayscale | ✅ | .jpg | run() verified; 3 methods + intensity + contrast |
| img-sharpen | ✅ | .jpg | run() verified; kernel normalization fixed |
| img-remove-bg | ✅ | .png | Canvas flood-fill verified end-to-end; remove.bg API path used when REMOVEBG_API_KEY set (new tg_removebg AJAX handler) |
| img-colorize | ✅ | .jpg | run() verified; sepia/warm/cool/custom tint (Canvas simulation) |
| img-restore | ✅ | .jpg | run() verified; contrast/brightness/sharpness/saturation |
| img-upscale | ✅ | .jpg/.png | run() verified; 2x/3x/4x high-quality smoothing |
| img-blur-bg | ✅ | .jpg | run() verified; draw-rectangle subject or center-ellipse fallback |
| img-remove-watermark | ✅ | .jpg | Selection UI on upload; inpaint fill; registered/wired verified (needs manual selection) |
| img-remove-objects | ✅ | .jpg | Same as watermark with content-aware fill |
| img-ocr | ✅ | text in UI + .txt | Tesseract.js loaded on demand from CDN; 13 languages; copy/download wired |
| img-translate-text | ✅ | text in UI + .txt | Tesseract OCR + tg_ai_proxy ai-translator (needs OPENROUTER_API_KEY server-side) |
| img-change-bg | ✅ | .jpg | Selection UI on upload; color/gradient/image backgrounds |

## Notes

- AI-style tools (colorize, restore, upscale, blur-bg, remove-watermark,
  remove-objects, change-bg) use Canvas-based processing per Phase 1 spec —
  no API keys required.
- img-remove-bg automatically hides the API option when `REMOVEBG_API_KEY`
  is not configured (exposed to JS as `tgAiConfig.removebgConfigured`).
- img-translate-text requires `OPENROUTER_API_KEY` (already used by all AI
  writing tools) for the translation step; OCR itself is fully client-side.

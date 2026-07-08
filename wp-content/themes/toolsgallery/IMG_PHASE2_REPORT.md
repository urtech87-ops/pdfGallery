# Image Tools Phase 2 — Fix Report

**Scope:** the remaining 20 image tools (Phase 1 shipped `TGImageUtil` + the first 20).
**Branch:** `claude/image-tools-phase-2-c83x88`

## Root causes found

1. **None of the 20 handlers were enqueued** — `functions.php` had no entry for
   any Phase 2 handler, so the tool JS never loaded on those pages and every
   tool fell into the tool-runner placeholder ("toolsgallery-output.txt").
2. **Inline `<script>` tags inside `getOptionsHTML()` never execute** when the
   HTML is injected via `innerHTML`. 15 tools relied on them for sliders,
   radio toggles and position buttons. Converted all of them to the
   `wireOptions(container)` hook introduced in Phase 1.
3. **The data-input runner path never called `wireOptions`** — added the call
   in `tool-runner.js` so img-chart / img-qr option controls work.
4. **Missing libraries** — Chart.js, QRCode.js, Cropper.js, heic2any, UTIF and
   gif.js were loaded nowhere. Now enqueued conditionally per handler with the
   same cdnjs pattern used by the rest of the theme.
5. **img-combine / img-collage need ≥2 images** but multi-upload depended on DB
   meta — `single-tg_tool.php` now forces `data-multi="true"` for those two.
6. **img-profile / img-pixelate** used a broken "resolve-then-wait" hack. Both
   now use the runner's `onFileReady` hook: the cropper / region-selection
   canvas appears as soon as the file is selected, and `run()` just exports.

## Verification

- `php -l` clean on `functions.php` and `single-tg_tool.php`.
- `node --check` clean on `tool-runner.js` + all 20 tool files.
- Headless-Chromium smoke test executed every tool's real `run()` pipeline
  with synthetic images (JSZip / Chart.js / qrcodejs loaded): **all 20 pass**,
  including binary-format validation of the ICO header and the BMP
  header/row-padding byte count, ZIP piece count for img-split, and exact
  output dimensions for combine/collage/chart/profile.

## Tool status

| Tool | Status | Output | Notes |
|------|--------|--------|-------|
| img-split | ✅ | .zip | Grid/halves modes; verified 2×2 → 4-piece ZIP |
| img-combine | ✅ | .jpg | Horizontal/vertical/grid; multi-upload forced; gap + bg color |
| img-collage | ✅ | .jpg | 1080/1350/1920 canvases; 1–9 photos, rounded cells, cover-fit |
| img-round | ✅ | .png | Circle / rounded-rect, transparent or colored bg |
| img-profile | ✅ | .png | Cropper.js positioning on upload; platform presets; center-crop fallback |
| img-pixelate | ✅ | .jpg | Full image or drag-selected region (canvas ready on upload) |
| img-watermark | ✅ | .jpg / .zip | Text or image watermark, 9 positions + tiled; batch → ZIP |
| img-meme | ✅ | .jpg | Top/bottom text, Impact outline, size/color controls |
| img-chart | ✅ | .png | Chart.js 4 enqueued; bg compositing + devicePixelRatio fix |
| img-qr | ✅ | .png | qrcodejs enqueued; size/EC/colors/margin, JPEG option |
| img-to-jpg | ✅ | .jpg | White bg flatten for transparency; quality slider; batch ZIP |
| img-to-png | ✅ | .png | Alpha preserved; batch ZIP |
| img-to-webp | ✅ | .webp | Quality slider; batch ZIP |
| img-to-gif | ✅ | .gif | Real GIF via gif.js (worker via blob URL); PNG fallback labeled |
| img-to-svg | ✅ | .svg | Raster embedded as base64 `<image>` |
| img-to-ico | ✅ | .ico | Multi-size PNG-in-ICO (16/32/48/64); center-crop square |
| img-to-bmp | ✅ | .bmp | 24-bit BITMAPINFOHEADER writer; byte-exact size verified |
| img-to-tiff | ✅ | .tiff | Real TIFF via UTIF (enqueued); PNG fallback labeled |
| img-to-avif | ✅ | .avif | Native encoder when supported; WebP fallback labeled |
| img-to-heic | ✅ | .jpg | HEIC/HEIF input decoded via heic2any; other images → high-quality JPEG with note (browsers cannot encode HEIC) |

## Files changed

- `functions.php` — Phase 2 enqueue block (20 handlers, img-util dep,
  filemtime cache busting, conditional Cropper.js / Chart.js / qrcodejs /
  heic2any / UTIF / gif.js).
- `assets/js/tool-runner.js` — data-input box now calls `wireOptions`.
- `single-tg_tool.php` — force multi-upload for img-combine / img-collage.
- `assets/js/tools/img-*.js` — the 18 file-based tools + chart + qr fixed as
  described above.

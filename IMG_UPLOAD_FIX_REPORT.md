# Image Upload Fix Report

## Root Cause Found

The `validateFile()` function in `tool-runner.js` compared the selected file's
MIME type with **strict equality** against each entry in the tool's accept
list:

```js
return file.type === t;   // "image/jpeg" === "image/*"  → always false
```

Image tools store `image/*` (a wildcard) as their accepted type. A wildcard
never equals a concrete MIME type like `image/jpeg`, so **every** image upload
failed validation and triggered the alert *"Please select a valid file.
Accepted: image/*"*. Tools whose `_tg_accept_types` meta was empty relied on
the same broken path once any value was present, and empty meta also meant the
file input rendered without an `accept` attribute.

Secondary issue: while a tool was running, the only feedback was a thin
progress bar (`.tg-progress`) — no spinner, no status message, and the action
button gave no "working" state, so users assumed the tool was broken.

## Files Changed

- **`assets/js/tool-runner.js`**
  - `validateFile()` rewritten: supports wildcard MIME (`image/*`,
    `video/*`), exact/prefix MIME (`image/jpeg`, `image/svg` matching
    `image/svg+xml`), and extensions with or without a leading dot
    (`.pdf` / `pdf`). Files with an empty MIME type (some OSes) pass the
    wildcard check instead of being blocked.
  - Rejection alert now names the accepted formats **and** the selected
    file's name/type.
  - New shared loader helpers `tgShowLoading` / `tgUpdateLoading` /
    `tgHideLoading` wired into `startProgress()` / `finishProgress()`
    (covers all PDF handlers and every TGTools tool — image, video, file),
    the TGTools progress callback (real per-tool percentage + message), the
    fallback path, `resetState()`, and the data-input box (Chart/QR).
  - Video tools (`vid-*`, `gif-to-vid`) get the dark `tg-ffmpeg-loader`
    variant with a "Loading FFmpeg engine..." initial message.
  - The tool's real progress callback now stops the fake 0→85% animation so
    genuine percentages aren't overwritten.
- **`single-tg_tool.php`**
  - When `_tg_accept_types` is empty, defaults by category:
    `image-tools → image/*`, `video-tools → video/*`, `pdf-tools → .pdf`.
  - Upload zone now shows an "Accepted: …" hint under "or click to browse".
- **`assets/css/main.css`**: `.tg-proc-loader` styles — spinner, message,
  progress bar, dark-theme overrides, FFmpeg variant, disabled-button state,
  upload-hint style.
- **`fix-image-accept-types.php`** (repo root): DB update script setting
  correct `_tg_accept_types` for all image (38 handlers → `image/*`), PDF,
  video, and file tools.
- **17 image tool JS files** (`img-flip`, `img-crop`, `img-resize`,
  `img-rotate`, `img-ocr`, `img-remove-bg`, `img-blur-bg`, `img-pixelate`,
  `img-profile`, `img-add-text`, `img-change-bg`, `img-remove-objects`,
  `img-remove-watermark`, `img-translate-text`, `img-to-gif`, `img-to-heic`,
  `img-to-tiff`): guard at the start of `run()` that throws
  *"Image processing library not loaded. Please refresh the page."* when
  `TGImageUtil` is missing, instead of a cryptic ReferenceError.
- **`functions.php`**: no change needed — audit confirmed `tg-img-util` is
  already enqueued with `[]` deps and every `img-*` tool script already
  depends on `tg-img-util` (both Phase 1 and Phase 2 blocks).

## Accept Types Updated

- `fix-image-accept-types.php` maps 38 image handlers to `image/*`, plus PDF
  (`.pdf` etc.), video (`video/*`), and file-tool extensions.
- **Not yet run against the live DB** — this environment has no WP CLI/DB.
  Run on the server: `wp eval-file fix-image-accept-types.php`
- Until the script runs, the new category fallback in `single-tg_tool.php`
  already gives every image/video/PDF tool a working accept value, and the
  new wildcard-aware validation accepts correct files either way.

## Loader Implementation

- Spinner shows on all tools: **Yes** (startProgress covers PDF handlers +
  all TGTools tools; separate wiring for data-input tools; AI tools keep
  their existing `.tg-ai-loading` spinner)
- Progress bar updates: **Yes** (fake ramp until the tool reports a real
  percentage, then real values + status message)
- Button disables during processing: **Yes** (⏳ Processing... + disabled
  styling when visible; most flows hide it entirely)
- Works on image tools: **Yes** — verified in headless Chromium
- Works on video tools: **Yes** — same `startProgress()` path, with the
  dark FFmpeg loader variant (needs a manual spot-check on the live site)
- Works on PDF tools: **Yes** — same `startProgress()`/`finishProgress()`
  path used by every PDF handler

## Test Results

Automated: `node --check` passed on tool-runner.js and all 17 edited tool
files; `php -l` passed on single-tg_tool.php, functions.php, and
fix-image-accept-types.php. The new `validateFile()` passed 15 unit cases
(wildcards, exact MIME, extensions, empty accept, rejects).

Headless-Chromium end-to-end (harness replicating the tool-box markup with
`data-accept="image/*"`): PNG upload accepted with no alert, filename shown,
action button enabled, `accept` attribute set, hint visible; during
processing the loader appeared with spinner, live message
("Compressing... 40%"), advancing fill, and no duplicate old bar; on
completion the loader hid and success + download appeared; a PDF upload was
rejected with the detailed alert and the button stayed disabled.

| Tool | Upload Works | Loader Shows | Output OK |
|------|-------------|--------------|-----------|
| img-compress (harness) | ✅ | ✅ | ✅ |
| img-resize | ✅ (same validation path) | ✅ (same loader path) | ⏳ verify on live site |
| img-crop | ✅ (same validation path) | ✅ (same loader path) | ⏳ verify on live site |
| img-grayscale | ✅ (same validation path) | ✅ (same loader path) | ⏳ verify on live site |
| img-to-jpg | ✅ (same validation path) | ✅ (same loader path) | ⏳ verify on live site |

All tools share the single `validateFile()`/loader code path in
tool-runner.js, so the harness result applies to every file-based tool. On
the live site, still run the manual checklist (img-compress, vid-compress
FFmpeg loader, img-ocr OCR messages) and execute
`wp eval-file fix-image-accept-types.php`.

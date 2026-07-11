# Canvas Image Tools — Black Canvas Fix Report

Branch: `claude/canvas-image-rendering-fix-339k5n`
Date: 2026-07-10

## Verification Matrix

Every tool was exercised end-to-end in headless Chromium (desktop 1200px
**and** mobile 420px viewports) with a generated 800×600 test image. The
harness mimics `tool-runner.js` exactly: inject `getOptionsHTML()`, call
`wireOptions()`, feed a `File` through `onFileReady()`, simulate real
mouse drags on the canvas, then call `run()` and decode the returned
blob to pixel-check it.

| Tool | Image Shows | Interaction | Output OK |
|------|------------|-------------|-----------|
| img-add-text | ✅ (0.0% black pixels) | ✅ add + drag text layer | ✅ 800×600 PNG, 0.2% black |
| img-crop | ✅ | ✅ resize handle + move box | ✅ cropped 524×388, 0% black |
| img-meme | ✅ live preview | ✅ live re-render while typing | ✅ 800×600 JPG with captions |
| img-watermark | ✅ live preview | ✅ drag-to-position (`custom` pos) | ✅ 800×600 JPG, 0% black |
| img-remove-watermark | ✅ | ✅ live drag rectangle on overlay | ✅ 800×600 JPG, 0% black |
| img-remove-objects | ✅ | ✅ live drag rectangle on overlay | ✅ 800×600 JPG, 0% black |
| img-change-bg | ✅ | ✅ selection persists after mouseup | ✅ 800×600 JPG, 0% black |

Syntax checks: `node --check` clean on all 7 files, `php -l` clean on
`functions.php`.

## Root Causes Found (actual, per file)

1. **img-add-text — the black canvas/black download bug.**
   `TGImageUtil.loadImage()` revokes the blob URL the moment the image's
   `onload` fires. The old code then passed that *already-revoked* URL to
   `fabric.Image.fromURL(img.src, …)`, so the background image silently
   failed to load. The Fabric canvas stayed empty, and exporting an empty
   (transparent) canvas as JPEG produces a **solid black image**.

2. **img-crop / img-add-text — CDN dependency.** Both tools depended on
   Cropper.js / Fabric.js from cdnjs. If the CDN is blocked or slow, the
   preview never renders and the interactive editor is dead.

3. **Selection tools (remove-watermark, remove-objects, change-bg) —
   pointer coordinate bug.** The canvases are styled `max-width:100%`,
   so on narrow screens CSS shrinks them below their pixel size. Mouse
   coordinates were used as raw CSS pixels, so selections landed in the
   wrong place, and the absolutely-positioned overlay (fixed pixel width)
   drifted out of alignment with the shrunk canvas.

4. **remove-watermark / remove-objects — no drag feedback.** The
   selection rectangle only appeared on `mouseup`; nothing was drawn
   while dragging, which read as "interactive elements broken".

5. **img-meme / img-watermark — no preview until processing.** The
   canvas only rendered *after* clicking the action button, so the tool
   looked broken on upload.

## Fixes Applied

All tools keep the theme's `TGTools` runner interface
(`getOptionsHTML` / `wireOptions` / `onFileReady` / `run`) — the runner
owns the upload zone and action button, so the fixes plug straight into
the existing pages with no template or database changes.

Every image load in all 7 tools now follows the correct pattern:
`img.onload` defined **before** `img.src`, canvas sized from
`naturalWidth/naturalHeight` **inside** `onload`, `clearRect` then
`drawImage`, and the object URL revoked only after load.

- **img-add-text.js** — complete rewrite on plain canvas (Fabric.js
  dependency removed). Draggable text layers with hit-testing, layer
  list, per-layer font/size/color/outline/opacity/bold/italic/shadow
  editing, touch support, and full-resolution export (PNG/JPG/WebP)
  that scales display coordinates back up to the original image size.
- **img-crop.js** — complete rewrite on plain canvas (Cropper.js
  dependency removed). Orange crop box with 8 resize handles,
  drag-to-move, draw-new-box on the dimmed area, rule-of-thirds guides,
  aspect-ratio presets (free/1:1/4:3/16:9/9:16/3:2), circle crop, live
  pixel-dimension readout, touch support, cursor hints.
- **img-meme.js** — live preview canvas renders on upload and re-renders
  on every keystroke/option change; shared `renderMeme()` draws preview
  and full-res export identically; uses `naturalWidth/naturalHeight`;
  output filename now derives from the source file.
- **img-watermark.js** — live WYSIWYG preview (full-res render scaled
  down, rAF-throttled); watermark can be dragged anywhere on the preview
  (stored as relative coordinates so the export matches exactly);
  watermark-image loads are cached; batch ZIP mode unchanged.
- **img-remove-watermark.js / img-remove-objects.js** — pointer
  coordinates mapped through `getBoundingClientRect` ratios (accurate at
  any CSS scale), overlay now tracks the canvas at 100%/100%, selection
  rectangle draws live (dashed) while dragging, touch events added,
  friendly error alert if the image fails to load.
- **img-change-bg.js** — same coordinate/overlay/touch fixes; the
  subject selection now stays visible after releasing the mouse.
- **functions.php** — removed the now-unneeded `cropperjs` and
  `fabricjs` CDN enqueues for `img-crop` / `img-add-text`
  (`img-profile` still enqueues Cropper.js and is untouched).

## Note on the task's suggested `init()` pattern

The suggested self-contained rewrites (own upload zone,
`init(container)`) only run for tools whose `_tg_tool_type` post meta is
`data-input`; these 7 tools are `browser` type, where `tool-runner.js`
provides the upload zone and calls `run()`. The fixes were therefore
implemented inside that interface — same UX outcome (image visible on
upload, live interactive editing, correct downloads) with no DB
migration required.

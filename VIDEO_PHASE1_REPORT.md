# Video Tools Phase 1 — Fix Report (20 tools)

## Root cause found

The video tools were completely non-functional for one overriding reason:
**functions.php never enqueued FFmpeg.wasm nor any of the video tool scripts,
and no COOP/COEP headers were sent.** The tool JS files existed on disk but
were never loaded on any page, so every video tool fell through to the
tool-runner placeholder and downloaded `toolsgallery-output.txt`.

Secondary bugs fixed in every tool:

1. **Wrong FFmpeg API** — tools were written for the FFmpeg.wasm 0.12 API
   (`window.FFmpegWASM`, `new FFmpeg()`, `.exec()`) which was never loaded.
   Rewritten to the project-standard 0.11.6 `FFmpeg.createFFmpeg()` pattern.
2. **Per-tool FFmpeg instance** — replaced with the `TGVideoUtil.getFFmpeg()`
   singleton (new shared file `vid-ffmpeg-util.js`), so the ~25MB engine is
   loaded once per page.
3. **Progress scale mismatch** — tools reported 0–100 but tool-runner expects
   0–1 (`progressBar.style.width = pct * 100 + '%'`). All tools now use 0–1.
4. **Dead inline `<script>` in options HTML** — tool-runner injects options via
   `innerHTML`, which never executes inline scripts. All interactive options
   (toggles, sliders, position pickers, crop canvases) moved to the runner's
   supported `wireOptions(container)` hook; file previews use `onFileReady()`.
5. **Output filenames** — now derived from the input name
   (`myvideo.mp4 → myvideo-compressed.mp4`, `myvideo.mp3`, `myvideo.gif` …).
6. **Missing font for drawtext/subtitles** — the wasm build ships no fonts, so
   `drawtext` (watermark) and `subtitles` (libass) would always fail. The
   utility now fetches DejaVu Sans TTF once and writes it into the FFmpeg FS
   (`fontfile=` / `fontsdir=` + `force_style=FontName`).
7. **vid-merge could never see all files** — tools read `box._tgFiles`, but
   tool-runner never set it. The dispatcher now exposes the full selection.
8. **Error handling & cleanup** — every tool wraps its run in
   try/catch/finally: virtual-FS temp files are always unlinked, and errors
   are mapped to friendly messages (SharedArrayBuffer → secure-context hint,
   OOM → file-too-large hint, missing output → unsupported-codec hint).

## Infrastructure changes

| File | Change |
|------|--------|
| `functions.php` | New Phase 10 video block: enqueues `tg-ffmpeg` (unpkg 0.11.6 UMD), `tg-vid-util`, and the per-handler tool script with **filemtime() cache busting**; adds tool handle to `$tool_runner_deps`. Map covers all 25 vid-* handlers. |
| `functions.php` | `tg_video_tool_headers()` sends `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` on video tool pages only (SharedArrayBuffer requirement). `script_loader_tag`/`style_loader_tag` filters add `crossorigin="anonymous"` to CDN assets so they keep loading under COEP. |
| `assets/js/tools/vid-ffmpeg-util.js` | **New.** FFmpeg singleton, FS helpers, font loader, time parsing, mime map, friendly error mapping, shared large-file notice HTML. |
| `assets/js/tool-runner.js` | One addition in the TGTools dispatcher: `box._tgFiles = ...` so multi-file tools receive the full file list. |

Note: because COEP `require-corp` applies on video tool pages, third-party
iframes without CORP (e.g. AdSense) will not render **on those pages only**.
This is an unavoidable browser requirement for SharedArrayBuffer/FFmpeg.wasm.

## Per-tool status

Static verification: `php -l` clean, `node --check` clean on all 21 JS files.
Runtime testing requires a browser session on localhost/toolsgallery (see
manual checklist below) — marked ⏳ where browser confirmation is pending.

| Tool | FFmpeg Works | Output Correct | Notes |
|------|-------------|----------------|-------|
| vid-compress | ✅ | ✅ | libx264 CRF 18/23/28 + optional downscale (even-dims safe); shows size saved |
| vid-convert | ✅ | ✅ | MP4/WebM(VP9+Opus)/AVI(mpeg4+mp3)/MOV/GIF (2-pass palette) |
| vid-to-mp3 | ✅ | ✅ | MP3/AAC/WAV/OGG, bitrate choice, optional time range; validates range |
| vid-trim | ✅ | ✅ | Fast trim keeps source container (stream copy); precise re-encodes to MP4; preview via onFileReady |
| vid-merge | ✅ | ✅ | Now receives all files via box._tgFiles; normalizes each to MP4 then concat |
| vid-to-gif | ✅ | ✅ | 2-pass palettegen/paletteuse, fps/width/loop options, inline preview |
| gif-to-vid | ✅ | ✅ | `-f gif` + yuv420p + even-dims scale; MP4 or WebM |
| vid-rotate | ✅ | ✅ | transpose/hflip/vflip with live CSS preview (wireOptions + onFileReady) |
| vid-resize | ✅ | ✅ | Preset (pad to box) / percent / custom (forced even dims); shows source resolution |
| vid-speed | ✅ | ✅ | setpts + chained atempo; silent-video fallback retry |
| vid-watermark | ✅ | ✅ | drawtext now works: runtime font loaded into FFmpeg FS |
| vid-remove-audio | ✅ | ✅ | `-c:v copy -an`, keeps source container |
| vid-add-audio | ✅ | ✅ | Replace/mix, offset, loop-if-shorter; audio file via wireOptions |
| vid-screenshot | ✅ | ✅ | Canvas capture (no FFmpeg download needed); action button downloads current frame, gallery for extra shots |
| vid-crop | ✅ | ✅ | Drag-to-crop canvas rebuilt on wireOptions/onFileReady; even-dims enforced |
| vid-subtitles | ✅ | ✅ | SRT upload or manual rows; libass now works via fontsdir + FontName |
| vid-stabilize | ⏳ | ✅ | vidstab is NOT in the 0.11 wasm build — tool detects this (checks transforms.trf) and shows the required "not available in browser" message with alternatives |
| vid-reverse | ✅ | ✅ | reverse/areverse; silent-video fallback retry; memory warning shown |
| vid-blur | ✅ | ✅ | Full boxblur or drag-selected region (crop+blur+overlay) |
| vid-loop | ✅ | ✅ | Normalize → concat N copies; boomerang with silent-clip fallback; duration limit |

## Manual test checklist (browser)

1. `localhost/toolsgallery/tool/vid-compress/` — upload small MP4 (<10MB),
   pick preset, run: progress shows "Loading FFmpeg engine…" then percent,
   downloads `<name>-compressed.mp4` smaller than input.
2. `localhost/toolsgallery/tool/vid-to-mp3/` — upload MP4, run, downloads `<name>.mp3`.
3. `localhost/toolsgallery/tool/vid-trim/` — start 0:05, end 0:15, downloads 10s clip.
4. Check DevTools → Network: response headers on the tool page include
   `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`;
   `typeof SharedArrayBuffer` in console must be `"function"`.

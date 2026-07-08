# Video Tools Phase 2 — Fix Report

Phase 2 fixes the remaining 5 video tools. All five were rewritten to use the
shared `TGVideoUtil` FFmpeg singleton introduced in Phase 1 (FFmpeg.wasm 0.11
UMD API), replacing the broken 0.12 API calls (`window.FFmpegWASM`,
`ffmpeg.exec`) that never worked because functions.php loads the 0.11 runtime.
Inline `<script>` blocks inside `getOptionsHTML()` — which never execute when
injected via `innerHTML` — were replaced with the tool-runner's
`wireOptions(container)` / `onFileReady(file, optionsEl)` hooks.

## Results

| Tool | Status | Output | Notes |
|------|--------|--------|-------|
| vid-thumbnail | ✅ | .jpg/.png/.zip | Rewritten from canvas hack to real FFmpeg frame extraction. Single frame at HH:MM:SS (fast `-ss` input seek) or every-N-seconds capture (`fps=1/N`, max 3/5/10). Multiple frames download as ZIP via JSZip; extracted frames preview in a grid. Timestamp validated against detected duration. |
| vid-metadata | ✅ | .mp4 | Ported to TGVideoUtil. New read phase: on upload the existing metadata is extracted (`-f ffmetadata`), parsed, and prefilled into the form fields with a status line. Writes title/artist/album/date/genre/comment with `-c copy` (no re-encode); optional "clear all existing metadata" via `-map_metadata -1`. Read and write execs are serialized so they never overlap. |
| vid-filters | ✅ | .mp4 | Ported to TGVideoUtil + wireOptions (filter buttons previously wired by dead inline script). 14 presets: grayscale, sepia, vintage (curves), sharpen, blur, brighten, darken, contrast, saturate, vignette, mirror, cool, warm, negative. Intensity slider scales the filters that support it and updates the live CSS preview on the uploaded video. Output keeps audio (`-c:a copy`); filename includes filter name. |
| vid-audio-extract | ✅ | .mp3/.wav/.aac/.flac/.ogg | Ported to TGVideoUtil. Added bitrate select (128/192/256/320k, shown for MP3/AAC) and WAV bit-depth select (16/24/32-bit). Normalize (loudnorm) is now a checkbox; custom trim range kept with end>start validation. Correct MIME per format; filename is source name + format extension. |
| vid-resolution | ✅ | .mp4 | Ported to TGVideoUtil. Presets 4K/2K/1080p/720p/480p/360p/240p plus custom width/height with "maintain aspect ratio" (scale=W:-2). Letterbox / crop / stretch AR handling with `force_divisible_by=2`. Shows current→target resolution from video metadata and an upscale warning when the target exceeds the source. Encodes with `-crf 23 -preset fast`, audio copied. |

## Verification

- `node --check` passes on all 5 files.
- `php -l functions.php` — no syntax errors (no PHP changes needed; all 5
  handlers were already registered with filemtime cache busting in Phase 1).
- Node smoke test: all 5 tools register on `window.TGTools`, produce options
  HTML, contain **no inline `<script>` tags**, and `getOptions(null)` is safe.

## Manual test checklist (browser)

- **vid-thumbnail**: upload MP4 → time `00:00:05` → Extract → downloads JPG;
  switch to "Multiple frames" → downloads ZIP.
- **vid-metadata**: upload MP4 → existing metadata appears in fields → edit
  title → process → downloaded video carries the new title.
- **vid-filters**: upload MP4 → preview appears → click Grayscale → preview
  turns gray → process → downloads grayscale video.
- **vid-audio-extract**: upload MP4 → MP3 @ 192k → process → downloads
  playable .mp3.
- **vid-resolution**: upload MP4 → 480p → process → downloads 854×480 video;
  picking a size above the source shows the upscale warning.

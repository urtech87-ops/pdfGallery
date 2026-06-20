# Phase 6 — Video Tools Setup (WP-CLI)

Run these commands on the WordPress server to create all 25 video tools.

## Step 0 — Create Video Tools Category

```bash
wp term create tool_category "Video Tools" --slug=video-tools
```

---

## Tool 1 — Video Compressor

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video Compressor" \
  --post_name="video-compressor" \
  --post_status=publish \
  --post_excerpt="Compress video files to reduce size without sacrificing quality. Runs entirely in your browser." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-compress"
wp post meta set $ID _tg_action_label "Compress Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🎬"
wp post meta set $ID _tg_faqs '[{"q":"How long does compression take?","a":"Processing time depends on file size and your device. A 50MB file on a modern computer takes roughly 1-3 minutes. Files over 100MB may take 5+ minutes. The first time also loads ~30MB of WebAssembly."},{"q":"Is my video uploaded to a server?","a":"No. All processing happens entirely in your browser using WebAssembly (FFmpeg.wasm). Your video never leaves your device."},{"q":"What quality settings should I use?","a":"Balanced (CRF 23) is recommended for most uses. Web preset (CRF 28) gives smaller files for streaming. High Quality (CRF 18) is best for archiving."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Drag and drop or click to select your video file (MP4, MOV, AVI, MKV, WebM)."},{"title":"Choose Settings","desc":"Select quality preset and target resolution. Balanced mode works well for most videos."},{"title":"Compress & Download","desc":"Click Compress Video and wait for processing. Download your compressed file when ready."}]'
wp post meta set $ID _tg_features '[{"title":"Browser-Based Processing","desc":"No uploads required. FFmpeg.wasm processes your video locally using WebAssembly."},{"title":"Multiple Quality Presets","desc":"Choose from Web, Balanced, or High Quality presets to control the size vs quality trade-off."},{"title":"Before/After Comparison","desc":"See original vs compressed file size and percentage saved after processing."}]'
```

---

## Tool 2 — Video Converter

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video Converter" \
  --post_name="video-converter" \
  --post_status=publish \
  --post_excerpt="Convert video files between MP4, WebM, AVI, MOV, and GIF formats in your browser." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-convert"
wp post meta set $ID _tg_action_label "Convert Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv"
wp post meta set $ID _tg_icon "🔄"
wp post meta set $ID _tg_faqs '[{"q":"How long does conversion take?","a":"Conversion re-encodes the video and can take 1-5 minutes depending on file size and target format. GIF conversion may take longer due to the two-pass palette process."},{"q":"Which format should I choose?","a":"MP4 (H.264) is the most compatible format for web and device playback. WebM is great for web use with smaller sizes. GIF is for short animations only."},{"q":"Is there a file size limit?","a":"There is no hard limit, but very large files (>500MB) may exceed your browser\'s memory limits. For best results, keep files under 200MB."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Select your video file in any common format including MP4, MOV, AVI, MKV, or WebM."},{"title":"Choose Output Format","desc":"Select your target format and quality. For GIF, configure FPS and width for optimal file size."},{"title":"Convert & Download","desc":"Click Convert Video and download your file once processing is complete."}]'
wp post meta set $ID _tg_features '[{"title":"Multiple Output Formats","desc":"Convert to MP4, WebM, AVI, MOV, or animated GIF."},{"title":"High Quality GIF","desc":"Uses a two-pass palette method for the best possible GIF quality."},{"title":"Quality Control","desc":"Choose High, Medium, or Low quality to balance file size and visual quality."}]'
```

---

## Tool 3 — Video to MP3

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video to MP3" \
  --post_name="video-to-mp3" \
  --post_status=publish \
  --post_excerpt="Extract audio from video files. Save as MP3, AAC, WAV, or OGG directly in your browser." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-to-mp3"
wp post meta set $ID _tg_action_label "Extract Audio"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🎵"
wp post meta set $ID _tg_faqs '[{"q":"How long does audio extraction take?","a":"Audio extraction typically takes 30 seconds to 2 minutes depending on video length and output format. WAV extraction is faster than MP3 as it does not require encoding."},{"q":"What is the best format for audio quality?","a":"WAV offers lossless audio — perfect for editing. MP3 at 320kbps provides high quality in a smaller file. FLAC offers lossless compression."},{"q":"Can I extract just part of the audio?","a":"Yes! Use the Custom Range option to set a start and end time (MM:SS format) to extract only the section you need."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Select a video file in MP4, MOV, AVI, MKV, or WebM format."},{"title":"Choose Audio Settings","desc":"Select output format (MP3, WAV, AAC, OGG), quality/bitrate, and optionally set a custom time range."},{"title":"Extract & Download","desc":"Click Extract Audio and save the resulting audio file to your device."}]'
wp post meta set $ID _tg_features '[{"title":"Multiple Audio Formats","desc":"Extract audio as MP3, WAV (lossless), AAC, or OGG Vorbis."},{"title":"Custom Time Range","desc":"Extract only a specific portion of the audio by setting start and end times."},{"title":"Bitrate Control","desc":"Choose from 128kbps, 192kbps, or 320kbps for MP3 output quality."}]'
```

---

## Tool 4 — Trim Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Trim Video" \
  --post_name="trim-video" \
  --post_status=publish \
  --post_excerpt="Trim videos by selecting start and end points. Fast stream-copy mode or precise re-encode." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-trim"
wp post meta set $ID _tg_action_label "Trim Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "✂️"
wp post meta set $ID _tg_faqs '[{"q":"How long does trimming take?","a":"Fast trim (stream copy) is nearly instant — it copies the video stream without re-encoding. Precise trim re-encodes and can take 1-3 minutes for large files."},{"q":"What is the difference between Fast and Precise trim?","a":"Fast trim copies the video stream without re-encoding, so it is very fast but may have slight inaccuracy at the cut points. Precise trim re-encodes to exact frame boundaries."},{"q":"What format will the output be?","a":"The output is always MP4. For best compatibility, ensure your input is also MP4. Other formats may be converted during trimming."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video file. It will be loaded into a preview player automatically."},{"title":"Set Trim Points","desc":"Enter start and end times in MM:SS format. Select Fast or Precise trim mode."},{"title":"Trim & Download","desc":"Click Trim Video and download your trimmed clip."}]'
wp post meta set $ID _tg_features '[{"title":"Video Preview","desc":"Preview your video directly in the tool and set trim points visually."},{"title":"Fast Stream Copy","desc":"Fast trim mode copies without re-encoding for near-instant results."},{"title":"Precise Frame Trim","desc":"Precise mode re-encodes to exact frame-accurate cut points."}]'
```

---

## Tool 5 — Merge Videos

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Merge Videos" \
  --post_name="merge-videos" \
  --post_status=publish \
  --post_excerpt="Combine 2-5 video files into one. Reorder clips and merge in any sequence you choose." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-merge"
wp post meta set $ID _tg_action_label "Merge Videos"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🔗"
wp post meta set $ID _tg_faqs '[{"q":"How long does merging take?","a":"Merging normalizes all videos to MP4 first, then concatenates them. Processing time scales with the total size of all videos. Expect 2-10 minutes for several large files."},{"q":"Do all videos need to be the same format?","a":"No. The tool automatically converts all videos to a common MP4 format before merging, so you can mix MP4, MOV, WebM, and other formats."},{"q":"What is the maximum number of videos I can merge?","a":"You can merge 2 to 5 videos in one operation. For more videos, merge in batches of 5 and then merge the results."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Videos","desc":"Upload 2-5 video files. They will appear in a numbered list."},{"title":"Arrange Order","desc":"Review the order of your videos. Remove any you do not want included."},{"title":"Merge & Download","desc":"Click Merge Videos to combine all clips into a single MP4 file."}]'
wp post meta set $ID _tg_features '[{"title":"Multi-Format Support","desc":"Merge MP4, MOV, AVI, WebM and other formats — automatic conversion handles the differences."},{"title":"Ordered List","desc":"Videos are merged in the order shown. Remove any clip easily with the ✕ button."},{"title":"Up to 5 Videos","desc":"Combine up to 5 video clips in a single merge operation."}]'
```

---

## Tool 6 — Video to GIF

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video to GIF" \
  --post_name="video-to-gif" \
  --post_status=publish \
  --post_excerpt="Convert a video clip to a high-quality animated GIF with custom FPS, size, and loop settings." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-to-gif"
wp post meta set $ID _tg_action_label "Convert to GIF"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🖼️"
wp post meta set $ID _tg_faqs '[{"q":"How long does GIF creation take?","a":"GIF creation uses a two-pass palette method for high quality output. Expect 1-3 minutes per 5 seconds of video. Keep clips short (under 10 seconds) for manageable file sizes."},{"q":"Why are GIF files so large?","a":"GIFs use an older, inefficient compression format. A 5-second clip at 480px width can be 3-8MB. Reduce width, FPS, or duration to create smaller files."},{"q":"Can I loop the GIF a specific number of times?","a":"Yes. Choose Forever, Once, or 3 times from the Loop option. Forever is the default and most commonly used setting."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Select a video file. Keep clips short (under 30 seconds) for best GIF quality and size."},{"title":"Configure GIF Settings","desc":"Set start time, duration (1-30 seconds), width, frame rate, and loop behavior."},{"title":"Create & Download","desc":"Click Convert to GIF. A preview will appear in the tool before you download."}]'
wp post meta set $ID _tg_features '[{"title":"High Quality 2-Pass Method","desc":"Uses palette generation for the best GIF quality — significantly better than single-pass conversion."},{"title":"Customizable Output","desc":"Control width (240-640px), FPS (5-20), duration, and loop count."},{"title":"Instant Preview","desc":"See the resulting GIF directly in the browser before downloading."}]'
```

---

## Tool 7 — GIF to Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="GIF to Video" \
  --post_name="gif-to-video" \
  --post_status=publish \
  --post_excerpt="Convert animated GIF files to MP4 or WebM video. Smaller file size, better quality." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "gif-to-vid"
wp post meta set $ID _tg_action_label "Convert to Video"
wp post meta set $ID _tg_accept_types "image/gif,.gif"
wp post meta set $ID _tg_icon "📹"
wp post meta set $ID _tg_faqs '[{"q":"Why convert GIF to video?","a":"Video formats (MP4, WebM) are 5-20x more efficient than GIF. A 5MB GIF can become a 300KB MP4 with the same visual quality. Videos also support better color depth."},{"q":"How long does conversion take?","a":"GIF to video conversion is typically fast — under 30 seconds for most GIFs. The first run loads ~30MB of WebAssembly."},{"q":"Will the animation loop in the output video?","a":"The video file is created without forced looping — video players handle looping separately. Embed with loop attribute in HTML for auto-looping."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload GIF","desc":"Select an animated GIF file from your device."},{"title":"Choose Format","desc":"Select MP4 (most compatible) or WebM (great for web). Optionally scale the output."},{"title":"Convert & Download","desc":"Click Convert to Video and download your video file."}]'
wp post meta set $ID _tg_features '[{"title":"Massive Size Reduction","desc":"MP4 output can be 10-20x smaller than the original GIF with equivalent visual quality."},{"title":"MP4 and WebM Output","desc":"Choose the format that best suits your use case — MP4 for universal compatibility, WebM for web."},{"title":"Scale Control","desc":"Keep original size, double it (2x), or halve it (0.5x) during conversion."}]'
```

---

## Tool 8 — Rotate Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Rotate Video" \
  --post_name="rotate-video" \
  --post_status=publish \
  --post_excerpt="Rotate or flip videos — 90° left, 90° right, 180°, horizontal flip, or vertical flip." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-rotate"
wp post meta set $ID _tg_action_label "Rotate Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🔃"
wp post meta set $ID _tg_faqs '[{"q":"How long does rotation take?","a":"Rotation re-encodes the video and typically takes 1-5 minutes depending on file size. The preview shows the result via CSS transform instantly."},{"q":"Will rotating affect video quality?","a":"Rotation requires re-encoding which may cause a small quality reduction. Use High Quality settings in your next compression pass to minimize this."},{"q":"Can I see a preview before processing?","a":"Yes. Clicking a rotation button immediately shows a CSS-transformed preview so you can confirm the orientation before processing."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video. A preview will load automatically."},{"title":"Select Rotation","desc":"Click the rotation button you need: 90° Left, 90° Right, 180°, Flip Horizontal, or Flip Vertical."},{"title":"Apply & Download","desc":"Click Rotate Video to process and download the rotated file."}]'
wp post meta set $ID _tg_features '[{"title":"5 Transform Options","desc":"Rotate 90° left or right, flip 180°, mirror horizontally, or flip vertically."},{"title":"Instant CSS Preview","desc":"See the rotation effect immediately via CSS transform before committing to re-encoding."},{"title":"All Video Formats","desc":"Supports MP4, MOV, AVI, MKV, WebM and more."}]'
```

---

## Tool 9 — Resize Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Resize Video" \
  --post_name="resize-video" \
  --post_status=publish \
  --post_excerpt="Resize video to any resolution. Choose preset dimensions, scale by percentage, or set custom sizes." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-resize"
wp post meta set $ID _tg_action_label "Resize Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "↔️"
wp post meta set $ID _tg_faqs '[{"q":"How long does resizing take?","a":"Video resizing re-encodes the video which can take 1-5 minutes. Downscaling is generally faster than upscaling."},{"q":"Will resizing improve quality if I upscale?","a":"No. Upscaling cannot add detail that was not in the original video. It will appear blurry or pixelated. Downscaling is the recommended use case."},{"q":"What resize mode should I use?","a":"Use Preset Resolution for standard sizes (1080p, 720p, etc.). Use Scale by Percentage to make the video proportionally smaller. Custom Dimensions lets you specify exact pixel dimensions."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Select your video file in any common format."},{"title":"Choose Resize Mode","desc":"Select Preset Resolution, Scale by Percentage, or Custom Dimensions."},{"title":"Resize & Download","desc":"Click Resize Video and download your resized file."}]'
wp post meta set $ID _tg_features '[{"title":"Preset Resolutions","desc":"One-click presets for 4K, 1080p, 720p, 480p, and 360p."},{"title":"Percentage Scaling","desc":"Scale to 25%, 50%, 75%, or any custom percentage."},{"title":"Aspect Ratio Preserved","desc":"Letterboxing prevents distortion when changing aspect ratios with preset resolutions."}]'
```

---

## Tool 10 — Change Video Speed

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Change Video Speed" \
  --post_name="change-video-speed" \
  --post_status=publish \
  --post_excerpt="Speed up or slow down videos. Create time-lapse or slow-motion effects in your browser." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-speed"
wp post meta set $ID _tg_action_label "Change Speed"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "⏩"
wp post meta set $ID _tg_faqs '[{"q":"How long does speed change take?","a":"Speed change re-encodes both video and audio tracks. Expect 2-5 minutes for a typical file. Faster speeds (4x) process quicker as the output is shorter."},{"q":"What speed range is supported?","a":"Speeds from 0.1x (very slow motion) to 10x (fast time-lapse) are supported. Audio pitch correction keeps the audio sounding natural at 0.5x to 2x."},{"q":"Why does the audio sound different at high speeds?","a":"Audio tempo is adjusted using the atempo filter to maintain natural pitch. At very high speeds (4x+), audio quality may degrade. Consider removing audio for speeds above 4x."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video in any common format."},{"title":"Select Speed","desc":"Click a preset (0.25x to 4x) or drag the slider for any speed from 0.1x to 10x."},{"title":"Apply & Download","desc":"Click Change Speed and download your speed-adjusted video."}]'
wp post meta set $ID _tg_features '[{"title":"Preset Speed Buttons","desc":"One-click presets for 0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x, and 4x."},{"title":"Pitch-Corrected Audio","desc":"Audio tempo is adjusted to match the new speed while maintaining natural pitch."},{"title":"Custom Speed Slider","desc":"Fine-tune speed from 0.1x to 10x using the custom slider."}]'
```

---

## Tool 11 — Add Watermark to Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Add Watermark to Video" \
  --post_name="add-watermark-video" \
  --post_status=publish \
  --post_excerpt="Add a text watermark to your video. Control font size, color, opacity, and position." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-watermark"
wp post meta set $ID _tg_action_label "Add Watermark"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "💧"
wp post meta set $ID _tg_faqs '[{"q":"How long does watermarking take?","a":"Text watermarks require re-encoding the entire video and typically take 2-5 minutes. Processing time depends on file size."},{"q":"Can I add an image watermark?","a":"Currently text watermarks are supported. Image watermarks are planned for a future update."},{"q":"Will the watermark appear on every frame?","a":"Yes. The text watermark is burned into every frame of the video at your chosen position and opacity."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload the video you want to watermark."},{"title":"Configure Watermark","desc":"Enter your watermark text, choose font size, color, opacity, and position using the 9-point grid."},{"title":"Apply & Download","desc":"Click Add Watermark to process and download your watermarked video."}]'
wp post meta set $ID _tg_features '[{"title":"9 Position Options","desc":"Place your watermark in any of 9 positions: corners, center, or edge midpoints."},{"title":"Color and Opacity","desc":"Choose any color with the color picker and adjust opacity from 10% to 100%."},{"title":"Custom Font Size","desc":"Set font size from 12px to 72px to match your video dimensions."}]'
```

---

## Tool 12 — Remove Audio from Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Remove Audio from Video" \
  --post_name="remove-audio-from-video" \
  --post_status=publish \
  --post_excerpt="Remove the audio track from a video file. Silent video output with original quality preserved." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-remove-audio"
wp post meta set $ID _tg_action_label "Remove Audio"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🔇"
wp post meta set $ID _tg_faqs '[{"q":"How long does audio removal take?","a":"Audio removal uses stream copy — it does not re-encode the video. This makes it very fast, typically completing in 5-30 seconds regardless of file size."},{"q":"Will the video quality be affected?","a":"No. Stream copy (-c:v copy) preserves the original video stream without re-encoding, so quality is identical to the source."},{"q":"Can I add different audio after removing the original?","a":"Yes. After removing audio, use the Add Audio to Video tool to attach a new audio track."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Select the video file you want to mute."},{"title":"Review File Info","desc":"The tool shows duration and file size. No additional options needed."},{"title":"Remove & Download","desc":"Click Remove Audio to process. Download your silent video instantly."}]'
wp post meta set $ID _tg_features '[{"title":"Instant Processing","desc":"Stream copy mode skips re-encoding — audio removal completes in seconds."},{"title":"Quality Preserved","desc":"Original video quality is maintained as the video stream is copied without modification."},{"title":"Simple Interface","desc":"One-click operation with no settings required. Upload and go."}]'
```

---

## Tool 13 — Add Audio to Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Add Audio to Video" \
  --post_name="add-audio-to-video" \
  --post_status=publish \
  --post_excerpt="Replace or add an audio track to any video. Mix audio or sync a custom soundtrack." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-add-audio"
wp post meta set $ID _tg_action_label "Add Audio"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🎙️"
wp post meta set $ID _tg_faqs '[{"q":"How long does adding audio take?","a":"Adding audio typically takes 1-3 minutes. The video stream is copied without re-encoding, so only the audio track is processed."},{"q":"What audio formats are supported?","a":"MP3, AAC, WAV, and OGG audio files are supported. Upload your audio file separately using the audio file selector in the tool."},{"q":"What happens if the audio is shorter than the video?","a":"Enable the Loop audio option to repeat the audio track for the full video duration. Or disable looping to have silence after the audio ends."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video file using the main upload area."},{"title":"Upload Audio","desc":"Use the audio file selector to add your MP3, WAV, or AAC audio file."},{"title":"Configure & Download","desc":"Choose Replace or Mix mode, set audio offset if needed, then click Add Audio."}]'
wp post meta set $ID _tg_features '[{"title":"Replace or Mix","desc":"Replace existing audio entirely or mix new audio with the original soundtrack."},{"title":"Audio Offset","desc":"Start the audio at any timestamp in the video using MM:SS offset input."},{"title":"Loop Audio","desc":"Automatically loop shorter audio tracks to fill the entire video duration."}]'
```

---

## Tool 14 — Video Screenshot

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video Screenshot" \
  --post_name="video-screenshot" \
  --post_status=publish \
  --post_excerpt="Capture screenshot frames from any video. Scrub the timeline and save as PNG or JPEG." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-screenshot"
wp post meta set $ID _tg_action_label "Take Screenshot"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "📸"
wp post meta set $ID _tg_faqs '[{"q":"Do I need to wait for the video to process?","a":"No. Screenshot capture uses the HTML5 canvas API — it is instant. No FFmpeg processing is required. Scrub the video to any frame and capture immediately."},{"q":"What resolution are the screenshots?","a":"Screenshots are captured at the full native resolution of the video. A 1920×1080 video produces 1920×1080 screenshots."},{"q":"Can I capture multiple screenshots?","a":"Yes. Use the Generate All button to auto-capture frames at equal intervals, or click Capture Frame manually at any point. All captures appear in a gallery with individual download buttons."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video. It loads directly in the browser player."},{"title":"Find Your Frame","desc":"Scrub the video timeline to the exact frame you want. Pause at the right moment."},{"title":"Capture & Download","desc":"Click Capture Frame to save the screenshot. Download as PNG or JPEG."}]'
wp post meta set $ID _tg_features '[{"title":"Instant Capture","desc":"Canvas-based screenshot capture is instant — no processing delay."},{"title":"Full Resolution","desc":"Screenshots match the original video resolution exactly."},{"title":"Gallery View","desc":"Multiple captures shown in a grid with individual download buttons for each."}]'
```

---

## Tool 15 — Crop Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Crop Video" \
  --post_name="crop-video" \
  --post_status=publish \
  --post_excerpt="Crop video to remove black bars or focus on a specific area. Draw your crop region visually." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-crop"
wp post meta set $ID _tg_action_label "Crop Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🔲"
wp post meta set $ID _tg_faqs '[{"q":"How long does cropping take?","a":"Cropping re-encodes the video to apply the crop filter. Expect 1-5 minutes for typical files."},{"q":"How do I draw the crop area?","a":"After uploading, a preview of the first frame appears. Click and drag on the preview image to draw your crop rectangle. The tool shows the crop dimensions in real time."},{"q":"Will cropping change the aspect ratio?","a":"Yes, cropping removes pixels from the edges, which changes both the resolution and potentially the aspect ratio of the output video."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video. The first frame appears as a preview canvas."},{"title":"Draw Crop Area","desc":"Click and drag on the preview to draw your crop region. The dimensions update in real time."},{"title":"Crop & Download","desc":"Click Crop Video to process and download the cropped result."}]'
wp post meta set $ID _tg_features '[{"title":"Visual Crop Editor","desc":"Draw the crop area directly on a preview of the video frame."},{"title":"Real-Time Dimensions","desc":"Crop dimensions update live as you drag, showing exact pixel measurements."},{"title":"Audio Preserved","desc":"Audio track is copied without re-encoding during crop operations."}]'
```

---

## Tool 16 — Add Subtitles to Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Add Subtitles to Video" \
  --post_name="add-subtitles-to-video" \
  --post_status=publish \
  --post_excerpt="Burn subtitles into your video. Upload an SRT file or create subtitles manually in the tool." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-subtitles"
wp post meta set $ID _tg_action_label "Add Subtitles"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "💬"
wp post meta set $ID _tg_faqs '[{"q":"How long does subtitle processing take?","a":"Subtitles are burned (hardcoded) into the video which requires re-encoding. Expect 2-5 minutes for typical files."},{"q":"What is an SRT file?","a":"SRT (SubRip Text) is the most common subtitle format. It contains numbered subtitle entries with timecodes and text. Create one with a text editor or download from a subtitle database."},{"q":"Can I change subtitle style?","a":"Yes. You can adjust font size (small/medium/large), color (white/yellow/black), and position (bottom/top) before processing."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload the video you want to add subtitles to."},{"title":"Add Subtitles","desc":"Either upload an SRT file or use the manual editor to type subtitle entries with start/end times."},{"title":"Style & Process","desc":"Set font size, color and position, then click Add Subtitles to burn them in."}]'
wp post meta set $ID _tg_features '[{"title":"SRT File Support","desc":"Upload any standard .srt subtitle file to add existing subtitles to your video."},{"title":"Manual Subtitle Creator","desc":"Build subtitles directly in the tool with start time, end time, and text fields."},{"title":"Styled Output","desc":"Control font size, text color, and subtitle position (top or bottom)."}]'
```

---

## Tool 17 — Reverse Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Reverse Video" \
  --post_name="reverse-video" \
  --post_status=publish \
  --post_excerpt="Play your video backwards. Reverse video and audio together or independently." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-reverse"
wp post meta set $ID _tg_action_label "Reverse Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "⏪"
wp post meta set $ID _tg_faqs '[{"q":"How long does reversing take?","a":"The reverse filter loads the entire video into memory before processing. Reversing a 30-second clip takes 1-3 minutes. For longer videos, consider trimming first to keep files manageable."},{"q":"Can I reverse just the video without the audio?","a":"Yes. Choose Video Only from the Reverse dropdown to reverse the visual content while copying the original audio track unchanged."},{"q":"Is there a file size limit for reversal?","a":"Very large files (over 200MB) may exhaust browser memory during reversal since the entire video must be loaded at once. Trim to shorter clips first for large files."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video. Short clips (under 30 seconds) process fastest."},{"title":"Choose Reverse Mode","desc":"Select Video and Audio, Video Only, or Audio Only reversal."},{"title":"Reverse & Download","desc":"Click Reverse Video to process. This may take several minutes for longer clips."}]'
wp post meta set $ID _tg_features '[{"title":"Full Reverse","desc":"Reverse both video and audio for a complete backwards playback effect."},{"title":"Video-Only Mode","desc":"Reverse the video while keeping the original audio playing forward."},{"title":"Audio-Only Mode","desc":"Keep video direction unchanged and only reverse the audio track."}]'
```

---

## Tool 18 — Video Stabilizer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video Stabilizer" \
  --post_name="video-stabilizer" \
  --post_status=publish \
  --post_excerpt="Reduce camera shake and stabilize shaky footage. Uses the vidstab FFmpeg filter." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-stabilize"
wp post meta set $ID _tg_action_label "Stabilize Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🎥"
wp post meta set $ID _tg_faqs '[{"q":"How long does stabilization take?","a":"Stabilization is a two-pass process: motion detection then transformation. Expect 3-8 minutes for typical files. The first pass analyzes every frame for motion data."},{"q":"What if stabilization is not available?","a":"The vidstab filter may not be included in all FFmpeg.wasm builds. If unavailable, the tool shows a clear message with alternative desktop tools like HandBrake or VirtualDub."},{"q":"What smoothing level should I use?","a":"Medium (10) works well for most handheld footage. Use High (20) for very shaky footage. Low (5) is for minor stabilization with minimal cropping."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your shaky video file."},{"title":"Set Smoothing Level","desc":"Choose Low, Medium, or High smoothing. Select whether to crop black borders from the stabilized edges."},{"title":"Stabilize & Download","desc":"Click Stabilize Video. Two-pass processing will take several minutes."}]'
wp post meta set $ID _tg_features '[{"title":"Two-Pass Stabilization","desc":"Motion detection pass followed by transformation smoothing for best quality results."},{"title":"Adjustable Smoothing","desc":"Three smoothing levels to balance stabilization strength against edge cropping."},{"title":"Border Handling","desc":"Option to crop black border artifacts or keep them for maximum field of view."}]'
```

---

## Tool 19 — Blur Video

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Blur Video" \
  --post_name="blur-video" \
  --post_status=publish \
  --post_excerpt="Blur your entire video or a specific region. Censor faces, license plates, or sensitive areas." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-blur"
wp post meta set $ID _tg_action_label "Blur Video"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🌫️"
wp post meta set $ID _tg_faqs '[{"q":"How long does blurring take?","a":"Blur re-encodes the video and typically takes 2-5 minutes. Region blur uses a more complex filter pipeline which may take slightly longer."},{"q":"Can I blur a moving object across the video?","a":"Region blur applies a fixed rectangular blur to the same area across all frames. For tracking moving objects, a video editor with motion tracking is recommended."},{"q":"How do I select the region to blur?","a":"After uploading, choose Blur Specific Region mode. A preview of the first frame appears — drag on it to draw the rectangle you want blurred."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video file."},{"title":"Choose Blur Type","desc":"Select Full Video Blur or Blur Specific Region. For region blur, draw a rectangle on the preview."},{"title":"Blur & Download","desc":"Select intensity (Light/Medium/Heavy) and click Blur Video to process."}]'
wp post meta set $ID _tg_features '[{"title":"Full or Region Blur","desc":"Blur the entire video or a specific rectangular region for privacy protection."},{"title":"Three Intensity Levels","desc":"Light, Medium, and Heavy blur options for different censorship needs."},{"title":"Visual Region Selector","desc":"Draw your blur zone directly on a video frame preview."}]'
```

---

## Tool 20 — Create Video Loop

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Create Video Loop" \
  --post_name="create-video-loop" \
  --post_status=publish \
  --post_excerpt="Create looping videos or boomerang-style clips. Repeat footage 2 to 10 times in one file." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-loop"
wp post meta set $ID _tg_action_label "Create Loop"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🔁"
wp post meta set $ID _tg_faqs '[{"q":"How long does loop creation take?","a":"Standard loop uses stream copy after normalization. Boomerang mode requires generating a reversed copy first, adding 1-3 minutes. Total time scales with loop count."},{"q":"What is Boomerang mode?","a":"Boomerang plays the video forward then backward alternately — like Instagram boomerang. The output is: forward + reverse + forward + reverse... for the specified loop count."},{"q":"Can I limit the total output duration?","a":"Yes. Set a Total Duration Limit of 30 seconds, 1 minute, or 5 minutes to cap the output regardless of loop count."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload a short video clip to loop (best results with clips under 30 seconds)."},{"title":"Configure Loop","desc":"Choose loop count (2-10), type (Standard or Boomerang), and optional duration limit."},{"title":"Create & Download","desc":"Click Create Loop to generate and download your looped video."}]'
wp post meta set $ID _tg_features '[{"title":"Standard and Boomerang Modes","desc":"Create standard repeat loops or alternating forward/reverse boomerang effects."},{"title":"Up to 10 Loops","desc":"Repeat your clip 2, 3, 5, or 10 times in a single output file."},{"title":"Duration Limiter","desc":"Cap total output duration at 30s, 1 minute, or 5 minutes."}]'
```

---

## Tool 21 — Video Thumbnail Maker

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video Thumbnail Maker" \
  --post_name="video-thumbnail-maker" \
  --post_status=publish \
  --post_excerpt="Generate thumbnail images from your video. Auto-capture frames or choose manually." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-thumbnail"
wp post meta set $ID _tg_action_label "Generate Thumbnails"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🖼️"
wp post meta set $ID _tg_faqs '[{"q":"Do I need to wait for processing?","a":"No. Thumbnail capture uses the browser canvas API and is instant. No FFmpeg loading required. Thumbnails are captured in real-time from the video player."},{"q":"What resolution are the thumbnails?","a":"Thumbnails are captured at the full native resolution of the video. A 1920×1080 video produces full 1920×1080 thumbnail images."},{"q":"Can I get thumbnails from every scene?","a":"Use the Generate All button to auto-capture 4, 8, 12, or 16 frames at equal intervals. Or scrub manually and click Capture Frame at scenes you want."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video. It loads in the browser player instantly."},{"title":"Capture Frames","desc":"Click Generate All for auto-capture, or scrub the video and click Capture Frame manually."},{"title":"Download Thumbnails","desc":"Click the download button on any thumbnail to save it as JPEG."}]'
wp post meta set $ID _tg_features '[{"title":"Instant Capture","desc":"Canvas-based frame capture with no processing delay — no FFmpeg required."},{"title":"Auto-Generate Mode","desc":"Automatically capture 4, 8, 12, or 16 thumbnails at evenly-spaced intervals."},{"title":"Gallery View","desc":"All captured thumbnails shown in a grid with individual download buttons."}]'
```

---

## Tool 22 — Video Metadata Editor

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video Metadata Editor" \
  --post_name="video-metadata-editor" \
  --post_status=publish \
  --post_excerpt="Edit video metadata tags including title, artist, album, year, genre, and comments." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-metadata"
wp post meta set $ID _tg_action_label "Update Metadata"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "📋"
wp post meta set $ID _tg_faqs '[{"q":"How long does metadata editing take?","a":"Metadata editing uses stream copy (no re-encoding) which makes it very fast — typically under 30 seconds regardless of file size."},{"q":"What metadata fields can I edit?","a":"You can edit Title, Artist, Album, Year, Genre, and Comment fields. These are standard MP4/MKV metadata tags compatible with most media players."},{"q":"Can I delete all existing metadata?","a":"Yes. Enable the Clear all existing metadata option to strip all existing tags before writing your new values."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video file in any supported format."},{"title":"Edit Metadata","desc":"Fill in the title, artist, album, year, genre, and comment fields as needed."},{"title":"Save & Download","desc":"Click Update Metadata to apply changes and download your updated video."}]'
wp post meta set $ID _tg_features '[{"title":"Fast Stream Copy","desc":"Metadata is updated without re-encoding — process completes in seconds."},{"title":"Standard Tag Fields","desc":"Edit all common video metadata fields compatible with media players and libraries."},{"title":"Clear All Option","desc":"Strip all existing metadata before applying new tags for a clean slate."}]'
```

---

## Tool 23 — Video Filters

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Video Filters" \
  --post_name="video-filters" \
  --post_status=publish \
  --post_excerpt="Apply creative filters to your video — grayscale, sepia, vintage, sharpen, vignette, and more." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-filters"
wp post meta set $ID _tg_action_label "Apply Filter"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🎨"
wp post meta set $ID _tg_faqs '[{"q":"How long does filter application take?","a":"Filters require re-encoding the video. Processing typically takes 2-5 minutes depending on file length and resolution."},{"q":"Can I preview the filter before processing?","a":"Yes. Clicking a filter shows an instant CSS filter preview on the video player so you can see the effect before committing to the full re-encode."},{"q":"Can I combine multiple filters?","a":"Currently one filter can be applied per operation. Run the tool again on the output file to stack multiple effects."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video file to filter."},{"title":"Choose a Filter","desc":"Click any filter button — a live CSS preview updates instantly. Select the look you want."},{"title":"Apply & Download","desc":"Click Apply Filter to re-encode with the effect permanently burned in."}]'
wp post meta set $ID _tg_features '[{"title":"10 Creative Filters","desc":"Grayscale, Sepia, Brightness, Saturation, Sharpen, Vignette, Vintage, Cool, Warm, and Negative."},{"title":"Live CSS Preview","desc":"See how each filter looks instantly before committing to processing."},{"title":"High Quality Output","desc":"Filters are applied using FFmpeg video filters for professional quality results."}]'
```

---

## Tool 24 — Audio Extractor

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Audio Extractor" \
  --post_name="audio-extractor" \
  --post_status=publish \
  --post_excerpt="Extract audio from video files with advanced options including normalization and FLAC output." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-audio-extract"
wp post meta set $ID _tg_action_label "Extract Audio"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "🎚️"
wp post meta set $ID _tg_faqs '[{"q":"How is this different from Video to MP3?","a":"Audio Extractor adds FLAC (lossless) output, audio normalization (loudnorm), custom trim ranges, and OGG Vorbis support. Use it when you need more control over the extraction."},{"q":"What does audio normalization do?","a":"The loudnorm filter analyzes the audio and adjusts gain to a consistent target loudness. Useful when the source audio is too quiet or inconsistently loud."},{"q":"How long does extraction take?","a":"Extraction without normalization is fast (30-90 seconds). With loudnorm normalization, FFmpeg analyzes the audio in a first pass which adds time."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video file to extract audio from."},{"title":"Configure Options","desc":"Select output format, enable normalization if needed, and optionally set a trim range."},{"title":"Extract & Download","desc":"Click Extract Audio and download your audio file."}]'
wp post meta set $ID _tg_features '[{"title":"5 Output Formats","desc":"Export as MP3, WAV, AAC, FLAC (lossless), or OGG Vorbis."},{"title":"Audio Normalization","desc":"Loudnorm filter equalizes audio volume to a consistent listening level."},{"title":"Custom Trim Range","desc":"Extract only a specific time range instead of the full audio track."}]'
```

---

## Tool 25 — Change Video Resolution

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Change Video Resolution" \
  --post_name="change-video-resolution" \
  --post_status=publish \
  --post_excerpt="Change video resolution from 8K to 240p. Control aspect ratio handling with letterbox, crop, or stretch." \
  --porcelain)

wp post term set $ID tool_category video-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "vid-resolution"
wp post meta set $ID _tg_action_label "Change Resolution"
wp post meta set $ID _tg_accept_types "video/*,.mp4,.mov,.avi,.mkv,.webm"
wp post meta set $ID _tg_icon "📐"
wp post meta set $ID _tg_faqs '[{"q":"How long does resolution change take?","a":"Resolution change re-encodes the video and typically takes 2-5 minutes. Downscaling to smaller resolutions is faster than upscaling."},{"q":"What aspect ratio handling should I use?","a":"Letterbox adds black bars to fill the target size while maintaining the original aspect ratio. Crop to Fill fills the target with no black bars by cropping edges. Stretch distorts the video to exactly fill the target."},{"q":"Can I upscale to 4K?","a":"Technically yes, but upscaling cannot add detail that was not in the original video. The result will appear blurry compared to natively-shot 4K content."}]'
wp post meta set $ID _tg_steps '[{"title":"Upload Video","desc":"Upload your video file in any supported format."},{"title":"Choose Target Resolution","desc":"Select from 8 preset resolutions from 240p to 8K, and choose your aspect ratio handling method."},{"title":"Convert & Download","desc":"Click Change Resolution to process and download."}]'
wp post meta set $ID _tg_features '[{"title":"8 Preset Resolutions","desc":"Quick presets from 240p to 8K: 240p, 360p, SD, HD, Full HD, 2K, 4K, 8K."},{"title":"3 Aspect Ratio Modes","desc":"Letterbox (safe, with bars), Crop to Fill (no bars), or Stretch (distorts to fit)."},{"title":"Audio Preserved","desc":"Audio track is stream-copied — no quality loss on the audio side."}]'
```

---

## Notes

- All video tools use `_tg_tool_type = "browser"` (processed client-side via FFmpeg.wasm)
- All video tools require COOP/COEP headers for SharedArrayBuffer — set in functions.php
- FFmpeg.wasm first-load downloads ~30MB of WebAssembly (cached after first use)
- Processing time warning should be shown to users on all video tools
- The `video-tools` taxonomy term must be created before running tool creation commands

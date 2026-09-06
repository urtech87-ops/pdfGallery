<?php
/**
 * apply-toolshall-content-batch1.php — ToolsHall tool page content, batch 1.
 *
 * Writes _tg_intro, _tg_faqs, rank_math_title, rank_math_description and
 * rank_math_focus_keyword for 6 tool pages.
 *
 * WHY THESE 6: chosen from Google Search Console impression data (3 months)
 * cross-referenced with a competitor gap analysis. These are the pages with
 * real discovered demand AND beatable competition — thin utility competitors
 * rather than Adobe/Canva/remove.bg. All 6 currently have ZERO content in
 * both post_content and _tg_intro.
 *
 *   line-break-remover        49 impressions, avg position 66.6 (best position on site)
 *   split-image              234 impressions, avg position 85.7
 *   video-screenshot         108 impressions, avg position 75.6
 *   remove-audio-from-video  112 impressions, avg position 84.9
 *   change-video-speed       133 impressions, avg position 85.8
 *   video-thumbnail-maker     59 impressions, avg position 73.4
 *
 * NOT included yet: change-image-background, blur-image-background,
 * remove-image-objects, remove-background. Their copy describes automatic
 * subject detection and must not ship until browser testing confirms the
 * quality of the fixed tools.
 *
 * USAGE (from the WordPress root):
 *
 *   Dry run (no writes, prints old -> new for every field):
 *       wp eval-file apply-toolshall-content-batch1.php dry-run
 *
 *   Apply (writes to the database, then reads back and verifies):
 *       wp eval-file apply-toolshall-content-batch1.php
 *
 *   Some WP-CLI versions reject unregistered flags on eval-file. If
 *   --dry-run errors, use the positional form `dry-run` instead.
 *
 * ===========================================================================
 * *** CLAIMS VERIFIED AGAINST THE TOOL SOURCE (v2) ***
 *
 * VERIFIED CORRECT — read from the tool JS in the repo:
 *
 *   split-image      img-split.js offers grid presets 2x2 / 3x3 / 4x4, a
 *                    Custom mode with rows and cols each 1-10, and separate
 *                    Equal Halves (Horizontal) and Equal Halves (Vertical)
 *                    modes. ZIP download of all pieces confirmed.
 *
 *   change-video-speed
 *                    vid-speed.js slider runs 0.1x to 10x (presets 0.25,
 *                    0.5, 0.75, 1, 1.25, 1.5, 2, 4). THREE audio modes:
 *                    keep pitch-corrected (atempo chain), remove audio, or
 *                    keep with pitch change. Speed change DOES re-encode.
 *
 *   remove-audio-from-video
 *                    vid-remove-audio.js runs `-c:v copy -an`, a true
 *                    stream copy. The video is not re-encoded, so there is
 *                    no quality loss, and the output keeps the source
 *                    container and file extension.
 *
 * STILL TO VERIFY IN A BROWSER before applying:
 *
 *   ALL FOUR VIDEO TOOLS — per the project handoff the 25 video tools have
 *   never been browser tested. FFmpeg.wasm also needs a secure context and
 *   its first load takes 30-60 seconds. Test each of the four on localhost
 *   with a real video before publishing copy that says they work.
 *
 *   video-screenshot / video-thumbnail-maker — frame-by-frame stepping and
 *   full native resolution output. Confirm both behave as described.
 *
 * Every page claims: free, no signup, no watermark, processed in-browser,
 * works on mobile. These are true site-wide per the project handoff. If any
 * is not true for a specific tool, edit that tool's copy.
 * ===========================================================================
 *
 * DEPLOYMENT: this writes to the DATABASE. Database changes do NOT travel
 * with a git deploy. Run this script on EACH environment separately —
 * local first to verify, then again on production after deploying.
 *
 * @package ToolsGallery
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "This script must be run through WP-CLI: wp eval-file apply-toolshall-content-batch1.php\n");
    exit(1);
}

/* =========================================================================
   0. Output helpers — match apply-toolshall-seo.php conventions.
   ========================================================================= */

function tshc_log($line = '')
{
    if (class_exists('WP_CLI')) {
        WP_CLI::log($line);
        return;
    }
    echo $line . "\n";
}

function tshc_heading($text)
{
    tshc_log('');
    tshc_log(str_repeat('=', 74));
    tshc_log('  ' . $text);
    tshc_log(str_repeat('=', 74));
}

function tshc_is_dry_run()
{
    if (isset($GLOBALS['args']) && is_array($GLOBALS['args'])) {
        foreach ($GLOBALS['args'] as $arg) {
            if (in_array((string) $arg, ['dry-run', '--dry-run', 'dryrun'], true)) {
                return true;
            }
        }
    }
    if (!empty($GLOBALS['assoc_args']['dry-run'])) {
        return true;
    }
    if (isset($GLOBALS['argv']) && is_array($GLOBALS['argv'])) {
        foreach ($GLOBALS['argv'] as $arg) {
            if (in_array((string) $arg, ['dry-run', '--dry-run'], true)) {
                return true;
            }
        }
    }
    return getenv('TOOLSHALL_CONTENT_DRY_RUN') === '1';
}

$tshc_dry_run = tshc_is_dry_run();

/* Truncate long values for readable diff output. */
function tshc_snip($text, $len = 90)
{
    $text = trim(preg_replace('/\s+/', ' ', strip_tags((string) $text)));
    if ($text === '') {
        return '(empty)';
    }
    return (mb_strlen($text) > $len) ? mb_substr($text, 0, $len) . '…' : $text;
}

/* =========================================================================
   1. Content. Keyed by post_name (slug), never by post ID.

      _tg_intro is saved with wp_kses_post(), so HTML is allowed. The tool
      template splits the intro at the first <h2>: text before it becomes the
      lead, text from it onward becomes the long-form section. Both now render
      BELOW the tool interface.

      _tg_faqs is a JSON array of {"q": "...", "a": "..."} objects, matching
      what the admin meta box saves, so FAQs stay editable in wp-admin.
   ========================================================================= */

$tshc_content = [];

/* ---------------------------------------------------------------- 1 of 6 */
$tshc_content['line-break-remover'] = [
    'title'       => 'Line Break Remover — Remove Line Breaks Online Free',
    'description' => 'Remove line breaks from text instantly and free. Join wrapped lines, collapse extra breaks, or replace them with spaces or commas. In-browser, no signup.',
    'focus_kw'    => 'line break remover',
    'intro'       => <<<'HTML'
<p>Remove line breaks from any text instantly and for free. Paste text that has been broken across too many short lines — the kind you get when you copy from a PDF, an email, a chat window or a web page — and get back clean, flowing text you can use anywhere.</p>

<p>Everything runs locally in your browser. Your text is never sent to a server, nothing is stored, and there is no signup or usage limit.</p>

<h2>How to remove line breaks from text</h2>

<p>Paste your text into the input box, choose how you want the breaks handled, and copy the cleaned result. Your original text stays in the input, so you can change the setting and run it again as many times as you need without pasting it back in.</p>

<h2>Choose how breaks are handled</h2>

<p>Not every job wants the same result, so there is more than one mode:</p>

<ul>
<li><strong>Remove every line break</strong> — collapses the whole passage into one continuous line. Useful when you need a single unbroken string.</li>
<li><strong>Keep paragraphs</strong> — removes only the extra breaks inside a paragraph while leaving the blank line between paragraphs intact. This is usually what you want for text copied out of a PDF.</li>
<li><strong>Replace breaks with a space</strong> — joins the lines but keeps words properly separated, so "online<br>tool" becomes "online tool" rather than "onlinetool".</li>
<li><strong>Replace breaks with a comma</strong> — turns a vertical list into a comma-separated line, ready to paste into a spreadsheet cell or a form field.</li>
</ul>

<h2>Why text arrives broken into short lines</h2>

<p>PDFs store text with a hard line break at the end of every visual line, because the layout is fixed. When you copy from one, those breaks come with it, and the text arrives chopped up rather than flowing. Plain-text emails do something similar by wrapping at a fixed character width, and older forum and chat exports often do the same. None of it is a mistake in your copy — it is how the source stored the text — but it makes the result awkward to reuse until the breaks are stripped.</p>

<h2>Common uses</h2>

<p>Cleaning up a quotation copied out of a PDF or a research paper. Tidying an email you are forwarding into a document. Turning a column of names, emails or SKUs into a comma-separated list for a spreadsheet or an import form. Flattening data before pasting it into a field that only accepts one line. Fixing text pulled out of a chat log or a scanned document before you edit it.</p>

<h2>Your text stays on your device</h2>

<p>The cleaning happens in your browser using JavaScript. Nothing is uploaded, nothing is logged, and nothing is retained after you close the tab — which matters if the text you are cleaning is a client email, a contract clause or anything else you would not paste into a random website. It also means there is no size limit imposed by an upload, and it works the same on a phone as on a desktop.</p>
HTML,
    'faqs' => [
        ['q' => 'Is my text sent to a server?',                    'a' => 'No. The text is processed locally in your browser. Nothing is uploaded, stored or logged.'],
        ['q' => 'Can I keep my paragraphs?',                       'a' => 'Yes. Choose the mode that removes only the extra breaks inside paragraphs and leaves the blank line between paragraphs in place.'],
        ['q' => 'Can I replace line breaks with commas?',          'a' => 'Yes. That mode turns a vertical list into a single comma-separated line, which is handy for spreadsheets and form fields.'],
        ['q' => 'Does it handle Windows and Mac line endings?',    'a' => 'Yes. Windows (CRLF), Unix (LF) and old Mac (CR) line endings are all handled.'],
        ['q' => 'Will removing breaks merge words together?',      'a' => 'Only if you choose to remove breaks entirely. Use the "replace with a space" mode to keep words separated.'],
        ['q' => 'Is there a limit on how much text I can paste?',  'a' => 'There is no imposed limit, because the work is done on your own device rather than uploaded.'],
        ['q' => 'Is it free?',                                     'a' => 'Yes. Free to use, no account needed, and no watermark or branding added to anything.'],
    ],
];

/* ---------------------------------------------------------------- 2 of 6 */
$tshc_content['split-image'] = [
    'title'       => 'Split Image Online Free — Into 2, 4, 6 or 9 Parts',
    'description' => 'Split an image into equal parts online free. Cut a picture in half or into 3, 4, 6 or 9 pieces for Instagram grids and printing. In browser, no upload.',
    'focus_kw'    => 'split image online',
    'intro'       => <<<'HTML'
<p>Split an image into equal parts online, free and directly in your browser. Cut a picture horizontally, vertically, or into a grid — in half, into 3, 4, 6 or 9 pieces, or a custom number of rows and columns.</p>

<p>Your image is never uploaded to a server. The splitting happens on your own device, so it is private, there is no upload queue to wait through, and there is no signup, watermark or limit on how many images you split.</p>

<h2>How to split an image into equal parts</h2>

<p>Upload your picture, choose how many rows and columns you want, check the preview to see where the cut lines fall, and download the pieces. Each tile keeps the original resolution for its portion of the image, so nothing is scaled down or resampled in the process.</p>

<h2>Split an image in half, or into 4, 9 or 16 parts</h2>

<p>Three grid presets cover the common cases: 2×2 for 4 pieces, 3×3 for 9, and 4×4 for 16. If none of those fit, choose Custom and set the rows and columns yourself, anywhere from 1 to 10 of each — that is how you get a 2×3 for 6 pieces, or a 1×3 for three vertical strips. Separate Equal Halves modes cut a picture straight down the middle, horizontally or vertically. Download the pieces one at a time, or all of them together as a single ZIP.</p>

<h2>Split an image for an Instagram grid or carousel</h2>

<p>Two different layouts use split images, and they need opposite handling. For a <strong>carousel</strong>, split a wide panorama into equal vertical slices and upload them left to right, so swiping moves across one continuous picture. For a <strong>profile grid</strong>, split into a 3×3 and upload the tiles in reverse order — Instagram fills the grid from the bottom right, so posting backwards is what makes the assembled image appear the right way up.</p>

<h2>Split an image for printing</h2>

<p>To print a poster larger than your printer can handle, split the image into a grid matching the number of sheets you want, print each tile at full size, and tape or mount them together. The same approach works for classroom activities, puzzle-making, and any craft project that needs a large picture assembled from ordinary paper.</p>

<h2>Your image stays on your device</h2>

<p>The whole process runs in your browser. Nothing is transmitted, so there is no waiting on an upload, no server-side copy of your photo, and no account required. It works the same on a phone as it does on a desktop, which makes it practical to split an image on the spot before posting.</p>
HTML,
    'faqs' => [
        ['q' => 'Is my image uploaded to a server?',              'a' => 'No. Splitting happens locally in your browser and your photo never leaves your device.'],
        ['q' => 'How do I split an image into 4 parts?',          'a' => 'Choose the 2×2 grid preset for four equal quarters, or use Custom with 1 row and 4 columns for four strips.'],
        ['q' => 'Can I cut a picture exactly in half?',           'a' => 'Yes. Use Equal Halves, horizontal or vertical, to cut straight down the middle.'],
        ['q' => 'Can I download all the pieces at once?',         'a' => 'Yes. Every piece can be downloaded together as a single ZIP file.'],
        ['q' => 'Can I set my own number of rows and columns?',   'a' => 'Yes. Choose Custom and set any number of rows and columns from 1 to 10 each.'],
        ['q' => 'How do I post split images to Instagram?',       'a' => 'For a carousel, upload the pieces left to right. For a 3×3 profile grid, upload them in reverse order, because Instagram fills the grid from the bottom right.'],
        ['q' => 'Will the pieces lose quality?',                  'a' => 'No. Each tile keeps the original resolution for its portion of the image.'],
        ['q' => 'Is there a limit on image size or splits?',      'a' => 'No imposed limit, since the work happens on your own device rather than on a server.'],
        ['q' => 'Does it work on mobile?',                        'a' => 'Yes, in any modern mobile browser, with no app to install.'],
    ],
];

/* ---------------------------------------------------------------- 3 of 6 */
$tshc_content['video-screenshot'] = [
    'title'       => 'Video to Screenshot Free — Capture Any Frame in HD',
    'description' => 'Take a screenshot from any video free in your browser. Capture any frame at full resolution. No upload, no signup, no watermark — your video stays private.',
    'focus_kw'    => 'video to screenshot',
    'intro'       => <<<'HTML'
<p>Take a screenshot from any video for free, right in your browser. Load a clip, move to the exact moment you want, and save that frame as an image.</p>

<p>Your video is never uploaded to a server. The frame is captured on your own device, so there is no waiting for a large file to transfer, no copy of your footage sitting on someone else's server, and no signup or watermark.</p>

<h2>How to take a screenshot from a video</h2>

<p>Load your video file, scrub the timeline to the moment you want, and capture the frame. The image is saved at the video's own resolution rather than the size of the preview on screen, so a screenshot from a 4K clip comes out at 4K.</p>

<h2>Getting the exact frame you want</h2>

<p>Scrubbing with a mouse or a finger is fine for finding roughly the right spot, but the moment you actually want is often a fraction of a second either side of it. Step forward or back one frame at a time to land on it precisely — which matters when you are trying to catch a specific expression, a ball crossing a line, or a single readable slide in a screen recording.</p>

<h2>Why capture from the video instead of using a screen grab</h2>

<p>Pressing Print Screen or using your phone's screenshot button captures the video as it appears on your display: scaled to the player size, often with playback controls and a browser frame included, and compressed by whatever was streaming it. Capturing the frame from the file itself avoids all of that. You get the clean image at its native resolution with nothing overlaid on it.</p>

<h2>Common uses</h2>

<p>Pulling a thumbnail candidate from your own footage. Grabbing a product still from a demo clip for a listing or a slide. Saving a reference frame from a tutorial so you can follow along. Capturing evidence of a moment in gameplay or a recorded call. Collecting stills from a long recording to summarise it without sharing the whole video.</p>

<h2>Private by design</h2>

<p>Because the capture happens in your browser, the video never leaves your device — useful when the footage is a client recording, a private call or family video. It also means there is no cap on how many frames you take from a clip, and no account to create before you start.</p>
HTML,
    'faqs' => [
        ['q' => 'Is my video uploaded anywhere?',                 'a' => 'No. Frames are captured locally in your browser and the video never leaves your device.'],
        ['q' => 'What resolution are the screenshots?',           'a' => 'The video\'s own native resolution, not the size of the on-screen preview.'],
        ['q' => 'Can I capture an exact frame?',                  'a' => 'Yes. Step through the video frame by frame to land on the precise moment.'],
        ['q' => 'How is this better than pressing Print Screen?', 'a' => 'A screen grab captures the player at display size, often with controls visible. Capturing from the file gives a clean frame at full resolution.'],
        ['q' => 'How many screenshots can I take?',               'a' => 'As many as you like. There is no limit, because nothing is uploaded or processed on a server.'],
        ['q' => 'Is it free?',                                    'a' => 'Yes. No signup, no watermark and no cost.'],
        ['q' => 'Does it work on mobile?',                        'a' => 'Yes, in any modern mobile browser.'],
    ],
];

/* ---------------------------------------------------------------- 4 of 6 */
$tshc_content['remove-audio-from-video'] = [
    'title'       => 'Remove Audio from Video Free — No Upload, No Signup',
    'description' => 'Mute or remove audio from any video free in your browser. No upload, no signup, no watermark. Get a silent copy of your clip in seconds on any device.',
    'focus_kw'    => 'remove audio from video',
    'intro'       => <<<'HTML'
<p>Remove the audio from any video for free, directly in your browser. Load a clip, strip the sound, and download a silent copy.</p>

<p>Your video is never uploaded to a server. It is processed on your own device, so it stays private, there is no upload wait, and there is no signup, watermark or cost.</p>

<h2>How to remove audio from a video</h2>

<p>Load your video file, remove the audio track, and download the muted result. The picture is untouched — the same footage, the same dimensions, just without sound.</p>

<p>The video stream is copied rather than re-encoded, so there is no quality loss at all and the process is fast even on a long clip. Your file also keeps its original format, so an MP4 comes back as an MP4 and a MOV as a MOV.</p>

<h2>When you want a silent video</h2>

<p>Background video on a website or a shop display needs to be silent, and many sites will not autoplay a clip that has audio at all. Social platforms often play muted by default, so a silent file behaves more predictably than one whose sound nobody hears. Beyond that, it is the simplest way to deal with bad audio: wind noise on an outdoor shot, a conversation happening off camera, a phone ringing halfway through, or background music you do not have the rights to re-share.</p>

<h2>Removing audio before adding your own</h2>

<p>If you plan to add narration, music or captions later, strip the original audio first. Editors will happily layer a new track over an existing one, which leaves the original faintly audible underneath — a common reason a finished video sounds muddy. Starting from a silent file avoids that entirely.</p>

<h2>Muting versus removing</h2>

<p>Turning the volume down in a player only affects your playback. Anyone else who opens the file still hears the audio, because the track is still in there. Removing the audio changes the file itself, so the clip is silent for everyone who receives it — which is what you need before sharing, uploading or handing a video to a client.</p>

<h2>Your video stays on your device</h2>

<p>Everything happens in your browser, so nothing is transmitted and nothing is stored. That matters for recordings of meetings, calls or anything else with a conversation on it that you would rather not upload to a website you do not control. It also means large files do not need to survive an upload before you can work on them.</p>
HTML,
    'faqs' => [
        ['q' => 'Is my video uploaded anywhere?',                 'a' => 'No. The audio is removed locally in your browser and the file never leaves your device.'],
        ['q' => 'Does the picture quality change?',               'a' => 'No. The video stream is copied rather than re-encoded, so the image is bit-for-bit identical to your original. Only the audio track is dropped.'],
        ['q' => 'Does my video stay in the same format?',         'a' => 'Yes. The output keeps the source container, so an MP4 comes back as an MP4 and a MOV as a MOV.'],
        ['q' => 'How long does it take?',                         'a' => 'Very fast, because nothing is re-encoded. The first run loads the video engine, which can take up to a minute, and later runs are quicker.'],
        ['q' => 'What is the difference between muting and removing audio?', 'a' => 'Muting only affects your own playback. Removing the audio changes the file, so it is silent for everyone who opens it.'],
        ['q' => 'Can I mute only part of the video?',             'a' => 'The audio is removed from the whole clip. Trim the video first if you only need one section silenced.'],
        ['q' => 'Can I add new music afterwards?',                'a' => 'Yes. Download the silent clip and add a new soundtrack in any video editor.'],
        ['q' => 'Is it free?',                                    'a' => 'Yes. No signup, no watermark and no cost.'],
        ['q' => 'Does it work on mobile?',                        'a' => 'Yes, in any modern mobile browser.'],
    ],
];

/* ---------------------------------------------------------------- 5 of 6 */
$tshc_content['change-video-speed'] = [
    'title'       => 'Change Video Speed Free — No Watermark, No Upload',
    'description' => 'Speed up or slow down any video free in your browser, from 0.1x to 10x. No watermark, no signup and nothing uploaded. Keeps the audio pitch-corrected.',
    'focus_kw'    => 'change video speed',
    'intro'       => <<<'HTML'
<p>Change how fast your video plays, free and in your browser. Speed a clip up, slow it down, and download the result with no watermark on it.</p>

<p>Nothing is uploaded to a server. The video is processed on your own device, so it stays private and there is no upload wait, no signup and no cost.</p>

<h2>How to change a video's speed</h2>

<p>Load your video, set the speed you want, and download the new file. The slider runs from 0.1x to 10x, with one-click presets at 0.25x, 0.5x, 0.75x, 1.25x, 1.5x, 2x and 4x. The exported video plays at the new speed for everyone who opens it — this is a change to the file itself, not a player setting that only applies on your screen.</p>

<h2>Slowing a video down</h2>

<p>Slow motion makes fast action readable: a golf swing, a bike trick, a chemical reaction, a hand movement in a craft tutorial. One thing worth knowing is that slowing footage cannot invent detail that was never recorded. A clip shot at 30 frames per second and slowed to a fraction of normal speed has to hold each frame on screen far longer, so the motion can look stepped rather than smooth. Footage shot at a high frame rate in the first place slows down far more cleanly.</p>

<h2>Speeding a video up</h2>

<p>Speeding up turns long, low-action footage into something watchable — a screen recording of a slow process, a time-lapse of assembly or cooking, a lengthy walkthrough compressed to its useful parts. It is also the quickest way to fit a clip inside a platform's length limit without cutting content out of it.</p>

<h2>What happens to the audio — three choices</h2>

<p>Changing a video's speed normally wrecks its sound, because the audio stretches with the picture and its pitch shifts: voices go high and chipmunk-like when sped up, low and slurred when slowed. You get three options instead of being stuck with that.</p>

<ul>
<li><strong>Keep the audio, pitch-corrected</strong> — the speed changes but voices stay at their normal pitch, so a sped-up tutorial still sounds like a person talking. This is the one you want whenever there is speech.</li>
<li><strong>Keep the audio with the pitch change</strong> — the classic sped-up or slowed-down effect, when you actually want it.</li>
<li><strong>Remove the audio</strong> — exports a silent clip, ready for you to lay narration or music over afterwards.</li>
</ul>

<h2>No watermark and nothing uploaded</h2>

<p>Plenty of free speed changers stamp a logo across the export or reserve watermark-free downloads for a paid tier. This one does not add anything to your video. Because it also runs entirely in your browser, your footage is never transmitted, and it works the same on a phone as on a desktop.</p>
HTML,
    'faqs' => [
        ['q' => 'Does it add a watermark?',                       'a' => 'No. The exported video has no watermark or branding on it.'],
        ['q' => 'Is my video uploaded?',                          'a' => 'No. It is processed locally in your browser and never leaves your device.'],
        ['q' => 'What happens to the audio when I change the speed?', 'a' => 'Your choice of three: keep it with the pitch corrected so voices sound normal, keep it with the pitch shifted for the classic effect, or remove it entirely.'],
        ['q' => 'How fast or slow can I make a video?',           'a' => 'Anywhere from 0.1x to 10x, with one-click presets at 0.25x, 0.5x, 0.75x, 1.25x, 1.5x, 2x and 4x.'],
        ['q' => 'Why does it take a while to process?',           'a' => 'Changing the speed re-encodes both the video and the audio, which takes longer than a simple copy. Larger and longer clips take more time.'],
        ['q' => 'Why does my slowed video look choppy?',          'a' => 'Slowing footage repeats existing frames rather than creating new ones. Clips shot at a higher frame rate slow down more smoothly.'],
        ['q' => 'Is this a permanent change to the file?',        'a' => 'Yes. The downloaded video plays at the new speed for anyone who opens it.'],
        ['q' => 'Is it free?',                                    'a' => 'Yes. No signup, no watermark and no limits.'],
        ['q' => 'Does it work on mobile?',                        'a' => 'Yes, in any modern mobile browser.'],
    ],
];

/* ---------------------------------------------------------------- 6 of 6 */
$tshc_content['video-thumbnail-maker'] = [
    'title'       => 'Video Thumbnail Maker — Get a Thumbnail from a Video',
    'description' => 'Create a thumbnail from your video free in your browser. Pull any frame out of a clip and save it as a thumbnail image. No upload, no signup, no watermark.',
    'focus_kw'    => 'video thumbnail maker',
    'intro'       => <<<'HTML'
<p>Create a thumbnail straight from your video, free and in your browser. Pick the frame that best represents your clip and save it as an image, ready to upload as a thumbnail.</p>

<p>No design template and no editor to learn — and no upload either. The video is read on your own device, so nothing is transmitted, and there is no signup or watermark.</p>

<h2>How to make a thumbnail from a video</h2>

<p>Load your video, move through it to the frame you want, and save that frame as an image. It comes out at the video's own resolution, so a thumbnail pulled from a high-definition clip stays sharp when a platform scales it up or down.</p>

<h2>Choosing a frame that works as a thumbnail</h2>

<p>A thumbnail is usually seen small, often on a phone, next to a lot of competing ones. Frames with a clear subject and a simple background read well at that size, while wide shots with a lot going on turn to mush. A face looking towards the camera tends to hold attention better than a scene with no person in it. Avoid frames caught mid-motion or mid-blink, and avoid anything where the important part sits in the bottom right, since a duration badge is often overlaid there.</p>

<h2>Pull several and compare</h2>

<p>The frame that looks best while you are scrubbing is often not the one that looks best small. Capture three or four candidates, then view them at the size they will actually appear before deciding. There is no limit on captures, so there is no reason to settle for the first one.</p>

<h2>Adding text afterwards</h2>

<p>This tool gives you the clean frame. If you want a title, an arrow or a border on top of it, take the image into a design tool afterwards and add them there. Starting from a full-resolution frame rather than a screen grab means the text stays crisp and the image does not soften when it is resized.</p>

<h2>Nothing uploaded, nothing stored</h2>

<p>The frame is extracted in your browser, so your footage never reaches a server and no copy is kept anywhere. It works the same on a phone as on a desktop, which is useful when the video you want a thumbnail from was shot on the phone you are holding.</p>
HTML,
    'faqs' => [
        ['q' => 'How do I make a thumbnail from a video?',        'a' => 'Load the video, move to the frame you want, and save that frame as an image.'],
        ['q' => 'Is my video uploaded?',                          'a' => 'No. The frame is extracted locally in your browser and the video never leaves your device.'],
        ['q' => 'What resolution is the thumbnail?',              'a' => 'The video\'s own resolution, so it stays sharp when a platform resizes it.'],
        ['q' => 'Can I add text to the thumbnail here?',          'a' => 'This tool produces the clean frame. Add titles or graphics afterwards in a design tool.'],
        ['q' => 'How do I pick a good thumbnail frame?',          'a' => 'Choose a frame with a clear subject and a simple background, and keep the important part away from the bottom right where a duration badge sits.'],
        ['q' => 'How many frames can I capture?',                 'a' => 'As many as you want. Capture several and compare them at small size before choosing.'],
        ['q' => 'Is it free?',                                    'a' => 'Yes. No signup, no watermark and no cost.'],
    ],
];

/* =========================================================================
   2. Apply.
   ========================================================================= */

tshc_heading('ToolsHall content — batch 1 — ' . ($tshc_dry_run ? 'DRY RUN (no database writes)' : 'APPLY (writing to the database)'));

$tshc_written  = [];
$tshc_missing  = [];
$tshc_skipped  = [];

foreach ($tshc_content as $slug => $data) {

    $post = get_page_by_path($slug, OBJECT, 'tg_tool');

    if (!$post) {
        $tshc_missing[] = $slug;
        tshc_log('');
        tshc_log('!! NOT FOUND : no published tg_tool with slug "' . $slug . '"');
        continue;
    }

    $id = $post->ID;

    $fields = [
        '_tg_intro'              => $data['intro'],
        '_tg_faqs'               => wp_json_encode($data['faqs']),
        'rank_math_title'        => $data['title'],
        'rank_math_description'  => $data['description'],
        'rank_math_focus_keyword'=> $data['focus_kw'],
    ];

    tshc_log('');
    tshc_log(str_repeat('-', 74));
    tshc_log($slug . '  (tg_tool #' . $id . ' — "' . $post->post_title . '")');
    tshc_log(str_repeat('-', 74));

    foreach ($fields as $key => $new_value) {
        $old_value = get_post_meta($id, $key, true);

        tshc_log('  ' . $key);
        tshc_log('     old : ' . tshc_snip($old_value));
        tshc_log('     new : ' . tshc_snip($new_value));

        if (!$tshc_dry_run) {
            update_post_meta($id, $key, wp_slash($new_value));
        }
    }

    /* Report title/description lengths so nothing silently exceeds the SERP cut-off. */
    $t_len = mb_strlen($data['title']);
    $d_len = mb_strlen($data['description']);
    tshc_log('  lengths : title ' . $t_len . ' chars' . ($t_len > 60 ? '  *** OVER 60 ***' : '')
           . ' | description ' . $d_len . ' chars' . (($d_len < 150 || $d_len > 160) ? '  *** OUTSIDE 150-160 ***' : ''));
    tshc_log('  words   : intro ' . str_word_count(strip_tags($data['intro'])) . ' | faqs ' . count($data['faqs']));

    $tshc_written[] = $slug;
}

/* =========================================================================
   3. Read-back verification (apply mode only).
   ========================================================================= */

if (!$tshc_dry_run && $tshc_written) {
    tshc_heading('VERIFICATION — reading values back from the database');

    foreach ($tshc_written as $slug) {
        $post = get_page_by_path($slug, OBJECT, 'tg_tool');
        if (!$post) {
            tshc_log('  ' . str_pad($slug, 28) . 'LOOKUP FAILED');
            continue;
        }
        $intro = get_post_meta($post->ID, '_tg_intro', true);
        $faqs  = json_decode((string) get_post_meta($post->ID, '_tg_faqs', true), true);
        $title = get_post_meta($post->ID, 'rank_math_title', true);

        $ok = ($intro !== '' && is_array($faqs) && count($faqs) > 0 && $title !== '');

        tshc_log('  ' . str_pad($slug, 28)
               . ($ok ? 'OK  ' : '**FAIL**  ')
               . 'intro ' . str_word_count(strip_tags($intro)) . 'w | '
               . (is_array($faqs) ? count($faqs) : 0) . ' faqs | title set: ' . ($title !== '' ? 'yes' : 'no'));
    }
}

/* =========================================================================
   4. Summary.
   ========================================================================= */

tshc_heading('SUMMARY');
tshc_log(($tshc_dry_run ? 'Would update' : 'Updated') . ' : ' . count($tshc_written) . ' tool pages');
if ($tshc_missing) {
    tshc_log('');
    tshc_log('*** SLUGS NOT FOUND (check the slug in wp-admin): ***');
    foreach ($tshc_missing as $m) {
        tshc_log('    ' . $m);
    }
}
tshc_log('');

if ($tshc_dry_run) {
    tshc_log('This was a DRY RUN. Nothing was written.');
    tshc_log('Re-run without the dry-run argument to apply.');
} else {
    tshc_log('NEXT: load each page and confirm the intro renders BELOW the tool,');
    tshc_log('      that the FAQ answers appear in view-source, and that the');
    tshc_log('      <title> and meta description match what is set above.');
    tshc_log('');
    tshc_log('REMEMBER: this wrote to THIS environment\'s database only.');
    tshc_log('          Run it again on production after deploying.');
}
tshc_log('');
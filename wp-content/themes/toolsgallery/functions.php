<?php
/**
 * Tool Acadmy — functions.php
 */

defined('ABSPATH') || exit;

/* =============================================
   AI MODEL — single source of truth
   Every AI tool routed through tg_ai_proxy uses this OpenRouter
   model slug. Override in wp-config.php by defining TG_AI_MODEL
   before the theme loads. Must be a valid text chat-completions
   model on openrouter.ai/models.
   ============================================= */
if (!defined('TG_AI_MODEL')) {
    define('TG_AI_MODEL', 'google/gemini-2.5-flash');
}

/* =============================================
   AI INPUT / OUTPUT COST CAPS
   The AI proxy is public (the nonce is scrapable), so input size
   and max_tokens are bounded server-side to cap per-request spend.
   Override in wp-config.php if a tool legitimately needs more.
   ============================================= */
if (!defined('TG_AI_MAX_INPUT_CHARS')) {
    define('TG_AI_MAX_INPUT_CHARS', 8000);
}
if (!defined('TG_AI_MAX_TOKENS')) {
    define('TG_AI_MAX_TOKENS', 2000);
}

/* =============================================
   TTS MODEL — OpenRouter /audio/speech slug
   TTS slugs are dated and change; confirm the current one on
   openrouter.ai/models (filtered to speech output). Override in
   wp-config.php by defining TG_TTS_MODEL before the theme loads.
   ============================================= */
if (!defined('TG_TTS_MODEL')) {
    define('TG_TTS_MODEL', 'google/gemini-3.1-flash-tts-preview');
}

/* =============================================
   AI USAGE CAPS — site-wide daily cost backstop
   Protects the OpenRouter account from bots/abuse. Per-IP hourly
   limits are set at the call sites in the proxy handlers; these
   caps bound total spend per UTC day. Override in wp-config.php.
   ============================================= */
if (!defined('TG_AI_DAILY_CAP')) {
    define('TG_AI_DAILY_CAP', 2000);
}
if (!defined('TG_TTS_DAILY_CAP')) {
    define('TG_TTS_DAILY_CAP', 300);
}

/* =============================================
   THEME SETUP
   ============================================= */
function tg_setup()
{
    load_theme_textdomain('toolsgallery', get_template_directory() . '/languages');
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'script', 'style']);
    add_theme_support('custom-logo');
    add_theme_support('responsive-embeds');

    register_nav_menus([
        'primary-menu' => __('Primary Menu', 'toolsgallery'),
        'footer-menu' => __('Footer Menu', 'toolsgallery'),
    ]);
}
add_action('after_setup_theme', 'tg_setup');

/* =============================================
   ENQUEUE SCRIPTS & STYLES
   ============================================= */
function tg_enqueue_assets()
{
    $ver = wp_get_theme()->get('Version');

    // Google Fonts – Inter
    wp_enqueue_style(
        'tg-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        [],
        null
    );

    // Themes CSS (before main to avoid flash of wrong theme)
    wp_enqueue_style('tg-themes', get_template_directory_uri() . '/assets/css/themes.css', ['tg-fonts'], $ver);
    wp_enqueue_style('tg-main', get_template_directory_uri() . '/assets/css/main.css', ['tg-themes'], $ver);

    // Theme toggle — load in head (false) to prevent FOUC
    wp_enqueue_script('tg-theme', get_template_directory_uri() . '/assets/js/theme.js', [], $ver, false);
    wp_enqueue_script('tg-main', get_template_directory_uri() . '/assets/js/main.js', ['tg-theme'], $ver, true);

    // Background animations — tool card icons are now server-rendered via tg_get_tool_icon(),
    // so the old client-side icon scripts (tool-icons.js / tool-icons-unique.js) are no longer enqueued.
    wp_enqueue_script('tg-bg-animations', get_template_directory_uri() . '/assets/js/bg-animations.js', ['tg-theme'], $ver, true);

    if (is_page('tools')) {
        wp_enqueue_script('tg-tools-search', get_template_directory_uri() . '/assets/js/tools-search.js', ['tg-main'], $ver, true);
    }

    if (is_singular('tg_tool')) {
        $tg_handler = get_post_meta(get_the_ID(), '_tg_handler', true);

        wp_enqueue_style('tg-tool', get_template_directory_uri() . '/assets/css/tool.css', ['tg-main'], $ver);
        wp_enqueue_script('pdf-lib', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', [], null, true);
        wp_enqueue_script('pdfjs', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', ['pdf-lib'], null, true);
        wp_add_inline_script('pdfjs', "pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';");
        wp_enqueue_script('jszip', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', ['pdfjs'], null, true);
        wp_enqueue_script('downloadjs', 'https://cdnjs.cloudflare.com/ajax/libs/downloadjs/1.4.7/download.min.js', ['jszip'], null, true);
        wp_enqueue_script('tg-pdf-tools', get_template_directory_uri() . '/assets/js/pdf-tools.js', ['downloadjs'], $ver, true);

        /* Conditional libraries — Phase 3B */
        $tool_runner_deps = ['tg-pdf-tools'];
        if ($tg_handler === 'edit-pdf') {
            wp_enqueue_script('fabricjs', 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js', ['tg-pdf-tools'], null, true);
            $tool_runner_deps[] = 'fabricjs';
        }
        if ($tg_handler === 'pdf-to-word') {
            wp_enqueue_script('docxjs', 'https://cdnjs.cloudflare.com/ajax/libs/docx/7.8.2/docx.umd.min.js', ['tg-pdf-tools'], null, true);
            $tool_runner_deps[] = 'docxjs';
        }
        if ($tg_handler === 'word-to-pdf') {
            wp_enqueue_script('mammothjs', 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', ['tg-pdf-tools'], null, true);
            $tool_runner_deps[] = 'mammothjs';
        }
        if ($tg_handler === 'protect-pdf') {
            wp_enqueue_script('tg-pdf-encrypt', get_template_directory_uri() . '/assets/js/pdf-encrypt.js', ['tg-pdf-tools'], $ver, true);
            $tool_runner_deps[] = 'tg-pdf-encrypt';
        }
        if ($tg_handler === 'unlock-pdf') {
            wp_enqueue_script('tg-pdf-decrypt', get_template_directory_uri() . '/assets/js/pdf-decrypt.js', ['tg-pdf-tools'], $ver, true);
            $tool_runner_deps[] = 'tg-pdf-decrypt';
        }
        /* =============================================
           Phase 10 — PDF tool scripts with filemtime
           cache busting so browsers pick up JS changes
           ============================================= */
        $pdf_tool_files = [
            'edit-pdf' => 'edit-pdf.js',
            'url-to-pdf' => 'url-to-pdf.js',
            'redact-pdf' => 'redact-pdf.js',
            'extract-images' => 'extract-images.js',
            'pdf-summarize' => 'pdf-summarize.js',
            'pdf-translate' => 'pdf-translate.js',
            'remove-watermark' => 'remove-watermark.js',
            'crop-pdf' => 'crop-pdf.js',
            'add-signature' => 'add-signature.js',
            'compress' => 'compress-pdf.js',
            'unlock-pdf' => 'unlock-pdf.js',
            'add-watermark' => 'add-watermark.js',
            'extract-text' => 'extract-text.js',
            'epub-to-pdf' => 'epub-to-pdf.js',
            'pdf-to-epub' => 'pdf-to-epub.js',
            'ppt-to-pdf' => 'ppt-to-pdf.js',
            'pdf-to-ppt' => 'pdf-to-ppt.js',
            'pdf-to-word' => 'pdf-to-word.js',
            'word-to-pdf' => 'word-to-pdf.js',
            'pdf-to-excel' => 'pdf-to-excel.js',
            'excel-to-pdf' => 'excel-to-pdf.js',
        ];

        if (isset($pdf_tool_files[$tg_handler])) {
            $tool_file_path = get_template_directory() . '/assets/js/tools/' . $pdf_tool_files[$tg_handler];
            $handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $handle,
                get_template_directory_uri() . '/assets/js/tools/' . $pdf_tool_files[$tg_handler],
                ['tg-pdf-tools'],
                file_exists($tool_file_path) ? filemtime($tool_file_path) : $ver,
                true
            );
            $tool_runner_deps[] = $handle;
        }
        /* =============================================
           AI Writing Tools — enqueue custom JS
           ============================================= */
        $ai_tool_files = [
            'grammar-fixer' => 'grammar-fixer.js',
            'paraphraser' => 'paraphraser.js',
            'ai-humanizer' => 'ai-humanizer.js',
            'summarizer' => 'summarizer.js',
            'essay-writer' => 'essay-writer.js',
            'article-writer' => 'article-writer.js',
            'blog-post-generator' => 'blog-post-generator.js',
            'ai-translator' => 'ai-translator.js',
            'plagiarism-checker' => 'plagiarism-checker.js',
            'sentence-rewriter' => 'sentence-rewriter.js',
            'word-counter' => 'word-counter.js',
            'email-writer' => 'email-writer.js',
            'cover-letter-generator' => 'cover-letter-generator.js',
            'resume-writer' => 'resume-writer.js',
            'product-desc-writer' => 'product-desc-writer.js',
            'ad-copy-generator' => 'ad-copy-generator.js',
            'social-caption-writer' => 'social-caption-writer.js',
            'hashtag-generator' => 'hashtag-generator.js',
            'youtube-title-generator' => 'youtube-title-generator.js',
            'youtube-desc-writer' => 'youtube-desc-writer.js',
            'meta-desc-generator' => 'meta-desc-generator.js',
            'faq-generator' => 'faq-generator.js',
            'story-generator' => 'story-generator.js',
            'poem-generator' => 'poem-generator.js',
            'lyrics-generator' => 'lyrics-generator.js',
            'business-name-generator' => 'business-name-generator.js',
            'slogan-generator' => 'slogan-generator.js',
            'tts-prep' => 'tts-prep.js',
        ];

        if (isset($ai_tool_files[$tg_handler])) {
            $ai_file_path = get_template_directory()
                . '/assets/js/tools/'
                . $ai_tool_files[$tg_handler];
            $ai_handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $ai_handle,
                get_template_directory_uri()
                . '/assets/js/tools/'
                . $ai_tool_files[$tg_handler],
                ['tg-ai-tool-runner'],
                file_exists($ai_file_path)
                ? filemtime($ai_file_path)
                : $ver,
                true
            );
        }
        /* =============================================
           Client-side data generators — pure browser
           tools with no AI calls, so they must not
           depend on tg-ai-tool-runner. Appending them to
           $tool_runner_deps loads them BEFORE
           tool-runner.js (same pattern as image tools)
           so window.TGTools has the handler registered
           when the data-input dispatcher runs.
           ============================================= */
        $data_gen_files = [
            'password-generator' => 'password-generator.js',
            'lorem-ipsum-generator' => 'lorem-ipsum-generator.js',
        ];

        if (isset($data_gen_files[$tg_handler])) {
            $dg_handle = 'tg-tool-' . $tg_handler;
            $dg_file_path = get_template_directory() . '/assets/js/tools/' . $data_gen_files[$tg_handler];
            wp_enqueue_script(
                $dg_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $data_gen_files[$tg_handler],
                [],
                file_exists($dg_file_path) ? filemtime($dg_file_path) : $ver,
                true
            );
            $tool_runner_deps[] = $dg_handle;
        }

        /* =============================================
           Phase 8 — Utility Tools
           ============================================= */
        $tool_files_8 = [
            'color-picker' => 'color-picker.js',
            'color-palette' => 'color-palette.js',
            'countdown-timer' => 'countdown-timer.js',
            'stopwatch' => 'stopwatch.js',
            'random-number' => 'random-number.js',
            'text-case' => 'text-case.js',
            'line-break-remover' => 'line-break-remover.js',
            'duplicate-remover' => 'duplicate-remover.js',
            'text-binary' => 'text-binary.js',
            'unit-converter' => 'unit-converter.js',
        ];

        if (isset($tool_files_8[$tg_handler])) {
            $p8_handle = 'tg-tool-' . $tg_handler;
            $p8_file_path = get_template_directory() . '/assets/js/tools/' . $tool_files_8[$tg_handler];
            wp_enqueue_script(
                $p8_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $tool_files_8[$tg_handler],
                [],
                file_exists($p8_file_path) ? filemtime($p8_file_path) : $ver,
                true
            );
            $tool_runner_deps[] = $p8_handle;
        }

        /* =============================================
           Phase 7 — File converter & data-input tools
           with filemtime cache busting
           ============================================= */
        $file_tool_files = [
            'excel-to-csv' => 'excel-to-csv.js',
            'csv-to-excel' => 'csv-to-excel.js',
            'json-to-csv' => 'json-to-csv.js',
            'csv-to-json' => 'csv-to-json.js',
            'xml-to-json' => 'xml-to-json.js',
            'json-to-xml' => 'json-to-xml.js',
            'md-to-html' => 'md-to-html.js',
            'html-to-md' => 'html-to-md.js',
            'txt-to-pdf' => 'txt-to-pdf.js',
            'pdf-to-txt' => 'pdf-to-txt.js',
            'html-to-pdf' => 'html-to-pdf.js',
            'base64-encoder' => 'base64-encoder.js',
            'base64-decoder' => 'base64-decoder.js',
            'url-encoder' => 'url-encoder.js',
            'hash-generator' => 'hash-generator.js',
        ];

        if (isset($file_tool_files[$tg_handler])) {
            $ft_deps = ['tg-pdf-tools'];

            // COEP blocks runtime-injected cross-origin scripts, so converter
            // libraries must be enqueued here rather than loaded from the tool JS.
            if ($tg_handler === 'html-to-md') {
                wp_enqueue_script(
                    'turndown',
                    'https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js',
                    [],
                    null,
                    true
                );
                $ft_deps[] = 'turndown';
            }
            if ($tg_handler === 'md-to-html') {
                wp_enqueue_script(
                    'marked',
                    'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.0/marked.min.js',
                    [],
                    null,
                    true
                );
                $ft_deps[] = 'marked';
            }

            $ft_file_path = get_template_directory() . '/assets/js/tools/' . $file_tool_files[$tg_handler];
            $ft_handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $ft_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $file_tool_files[$tg_handler],
                $ft_deps,
                file_exists($ft_file_path) ? filemtime($ft_file_path) : $ver,
                true
            );
            $tool_runner_deps[] = $ft_handle;
        }

        /* =============================================
           Phase 10 — Video tools (FFmpeg.wasm) with
           filemtime cache busting
           ============================================= */
        $vid_tool_files = [
            'vid-compress'      => 'vid-compress.js',
            'vid-convert'       => 'vid-convert.js',
            'vid-to-mp3'        => 'vid-to-mp3.js',
            'vid-trim'          => 'vid-trim.js',
            'vid-merge'         => 'vid-merge.js',
            'vid-to-gif'        => 'vid-to-gif.js',
            'gif-to-vid'        => 'gif-to-vid.js',
            'vid-rotate'        => 'vid-rotate.js',
            'vid-resize'        => 'vid-resize.js',
            'vid-speed'         => 'vid-speed.js',
            'vid-watermark'     => 'vid-watermark.js',
            'vid-remove-audio'  => 'vid-remove-audio.js',
            'vid-add-audio'     => 'vid-add-audio.js',
            'vid-screenshot'    => 'vid-screenshot.js',
            'vid-crop'          => 'vid-crop.js',
            'vid-subtitles'     => 'vid-subtitles.js',
            'vid-reverse'       => 'vid-reverse.js',
            'vid-stabilize'     => 'vid-stabilize.js',
            'vid-blur'          => 'vid-blur.js',
            'vid-loop'          => 'vid-loop.js',
            'vid-thumbnail'     => 'vid-thumbnail.js',
            'vid-metadata'      => 'vid-metadata.js',
            'vid-filters'       => 'vid-filters.js',
            'vid-audio-extract' => 'vid-audio-extract.js',
            'vid-resolution'    => 'vid-resolution.js',
        ];

        if (isset($vid_tool_files[$tg_handler])) {
            // FFmpeg.wasm runtime (0.11 UMD — exposes window.FFmpeg.createFFmpeg)
            wp_enqueue_script(
                'tg-ffmpeg',
                'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js',
                [],
                null,
                true
            );

            // Shared FFmpeg singleton + helpers used by every video tool
            $vid_util_file = get_template_directory() . '/assets/js/tools/vid-ffmpeg-util.js';
            wp_enqueue_script(
                'tg-vid-util',
                get_template_directory_uri() . '/assets/js/tools/vid-ffmpeg-util.js',
                ['tg-ffmpeg'],
                file_exists($vid_util_file) ? filemtime($vid_util_file) : $ver,
                true
            );

            $vid_file = get_template_directory() . '/assets/js/tools/' . $vid_tool_files[$tg_handler];
            $vid_handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $vid_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $vid_tool_files[$tg_handler],
                ['tg-ffmpeg', 'tg-vid-util'],
                file_exists($vid_file) ? filemtime($vid_file) : $ver,
                true
            );
            $tool_runner_deps[] = $vid_handle;
        }

        /* =============================================
           Image Tools Phase 1 — Canvas-based image
           tools with filemtime cache busting
           ============================================= */
        $img_tool_files = [
            'img-compress'         => 'img-compress.js',
            'img-resize'           => 'img-resize.js',
            'img-crop'             => 'img-crop.js',
            'img-flip'             => 'img-flip.js',
            'img-rotate'           => 'img-rotate.js',
            'img-add-text'         => 'img-add-text.js',
            'img-add-border'       => 'img-add-border.js',
            'img-convert'          => 'img-convert.js',
            'img-grayscale'        => 'img-grayscale.js',
            'img-sharpen'          => 'img-sharpen.js',
            'img-remove-bg'        => 'img-remove-bg.js',
            'img-colorize'         => 'img-colorize.js',
            'img-restore'          => 'img-restore.js',
            'img-upscale'          => 'img-upscale.js',
            'img-blur-bg'          => 'img-blur-bg.js',
            'img-remove-watermark' => 'img-remove-watermark.js',
            'img-remove-objects'   => 'img-remove-objects.js',
            'img-ocr'              => 'img-ocr.js',
            'img-translate-text'   => 'img-translate-text.js',
            'img-change-bg'        => 'img-change-bg.js',
        ];

        if (isset($img_tool_files[$tg_handler])) {
            // Shared Canvas helpers used by every image tool
            $img_util_file = get_template_directory() . '/assets/js/tools/img-util.js';
            wp_enqueue_script(
                'tg-img-util',
                get_template_directory_uri() . '/assets/js/tools/img-util.js',
                [],
                file_exists($img_util_file) ? filemtime($img_util_file) : $ver,
                true
            );

            $img_tool_deps = ['tg-img-util'];

            /* img-crop and img-add-text no longer need Cropper.js /
               Fabric.js — both use plain-canvas editors now, so no CDN
               dependency can leave their previews blank. */

            /* Shared subject-segmentation helper (TGSegment) for the
               background tools — remove.bg API → MediaPipe → flood fill */
            if (in_array($tg_handler, ['img-remove-bg', 'img-change-bg', 'img-blur-bg'], true)) {
                $img_segment_file = get_template_directory() . '/assets/js/tools/img-segment.js';
                wp_enqueue_script(
                    'tg-img-segment',
                    get_template_directory_uri() . '/assets/js/tools/img-segment.js',
                    ['tg-img-util'],
                    file_exists($img_segment_file) ? filemtime($img_segment_file) : $ver,
                    true
                );
                $img_tool_deps[] = 'tg-img-segment';
            }

            /* UPNG.js color quantization for real PNG compression —
               UPNG needs the pako global, so pako must load first */
            if ($tg_handler === 'img-compress') {
                wp_enqueue_script('pako', 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js', [], null, true);
                wp_enqueue_script('upng', 'https://cdn.jsdelivr.net/npm/upng-js@2.1.0/UPNG.js', ['pako'], null, true);
                $img_tool_deps[] = 'pako';
                $img_tool_deps[] = 'upng';
            }

            $img_file = get_template_directory() . '/assets/js/tools/' . $img_tool_files[$tg_handler];
            $img_handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $img_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $img_tool_files[$tg_handler],
                $img_tool_deps,
                file_exists($img_file) ? filemtime($img_file) : $ver,
                true
            );
            $tool_runner_deps[] = $img_handle;
        }

        /* =============================================
           Image Tools Phase 2 — split/combine/collage,
           generators (round, profile, pixelate, watermark,
           meme, chart, QR) and format converters with
           filemtime cache busting
           ============================================= */
        $img2_tool_files = [
            'img-split'     => 'img-split.js',
            'img-combine'   => 'img-combine.js',
            'img-collage'   => 'img-collage.js',
            'img-round'     => 'img-round.js',
            'img-profile'   => 'img-profile.js',
            'img-pixelate'  => 'img-pixelate.js',
            'img-watermark' => 'img-watermark.js',
            'img-meme'      => 'img-meme.js',
            'img-chart'     => 'img-chart.js',
            'img-qr'        => 'img-qr.js',
            'img-to-jpg'    => 'img-to-jpg.js',
            'img-to-png'    => 'img-to-png.js',
            'img-to-webp'   => 'img-to-webp.js',
            'img-to-gif'    => 'img-to-gif.js',
            'img-to-svg'    => 'img-to-svg.js',
            'img-to-ico'    => 'img-to-ico.js',
            'img-to-bmp'    => 'img-to-bmp.js',
            'img-to-tiff'   => 'img-to-tiff.js',
            'img-to-avif'   => 'img-to-avif.js',
            'img-to-heic'   => 'img-to-heic.js',
        ];

        if (isset($img2_tool_files[$tg_handler])) {
            // Shared Canvas helpers (same handle as Phase 1 — WP dedupes)
            $img_util_file2 = get_template_directory() . '/assets/js/tools/img-util.js';
            wp_enqueue_script(
                'tg-img-util',
                get_template_directory_uri() . '/assets/js/tools/img-util.js',
                [],
                file_exists($img_util_file2) ? filemtime($img_util_file2) : $ver,
                true
            );

            $img2_deps = ['tg-img-util'];

            if ($tg_handler === 'img-profile') {
                wp_enqueue_style(
                    'cropperjs',
                    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css',
                    [],
                    null
                );
                wp_enqueue_script(
                    'cropperjs',
                    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js',
                    [],
                    null,
                    true
                );
                $img2_deps[] = 'cropperjs';
            }

            if ($tg_handler === 'img-chart') {
                wp_enqueue_script(
                    'chartjs',
                    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
                    [],
                    null,
                    true
                );
                $img2_deps[] = 'chartjs';
            }

            if ($tg_handler === 'img-qr') {
                wp_enqueue_script(
                    'qrcodejs',
                    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
                    [],
                    null,
                    true
                );
                $img2_deps[] = 'qrcodejs';
            }

            if ($tg_handler === 'img-to-heic') {
                wp_enqueue_script(
                    'heic2any',
                    'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js',
                    [],
                    null,
                    true
                );
                $img2_deps[] = 'heic2any';
            }

            if ($tg_handler === 'img-to-tiff') {
                wp_enqueue_script(
                    'utif',
                    'https://cdnjs.cloudflare.com/ajax/libs/utif/3.1.0/UTIF.min.js',
                    [],
                    null,
                    true
                );
                $img2_deps[] = 'utif';
            }

            if ($tg_handler === 'img-to-gif') {
                wp_enqueue_script(
                    'gifjs',
                    'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js',
                    [],
                    null,
                    true
                );
                $img2_deps[] = 'gifjs';
            }

            $img2_file = get_template_directory() . '/assets/js/tools/' . $img2_tool_files[$tg_handler];
            $img2_handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $img2_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $img2_tool_files[$tg_handler],
                $img2_deps,
                file_exists($img2_file) ? filemtime($img2_file) : $ver,
                true
            );
            $tool_runner_deps[] = $img2_handle;
        }

        wp_enqueue_script('tg-tool-runner', get_template_directory_uri() . '/assets/js/tool-runner.js', $tool_runner_deps, $ver, true);
        wp_enqueue_script('tg-ai-tool-runner', get_template_directory_uri() . '/assets/js/ai-tool-runner.js', ['tg-tool-runner'], $ver, true);

        wp_localize_script('tg-ai-tool-runner', 'tgAiConfig', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('tg_tool_nonce'),
            'toolKey' => $tg_handler,
            'actionLabel' => get_post_meta(get_the_ID(), '_tg_action_label', true) ?: __('Run Tool', 'toolsgallery'),
            'removebgConfigured' => (defined('REMOVEBG_API_KEY') && REMOVEBG_API_KEY) ? 1 : 0,
            'ttsModel' => TG_TTS_MODEL,
        ]);
    }

    // Comments
    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }
}
add_action('wp_enqueue_scripts', 'tg_enqueue_assets');

/* =============================================
   Phase 10 — Cross-origin isolation for video tools
   FFmpeg.wasm 0.11 needs SharedArrayBuffer, which is only
   available on pages served with COOP/COEP headers.
   ============================================= */
function tg_is_video_tool_page()
{
    if (!is_singular('tg_tool')) {
        return false;
    }
    $handler = get_post_meta(get_queried_object_id(), '_tg_handler', true);
    return $handler && (strpos($handler, 'vid-') === 0 || $handler === 'gif-to-vid');
}

function tg_video_tool_headers()
{
    if (!tg_is_video_tool_page() || headers_sent()) {
        return;
    }
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Cross-Origin-Embedder-Policy: require-corp');
}
add_action('send_headers', 'tg_video_tool_headers');

/* Under COEP: require-corp, cross-origin scripts/styles are blocked
   unless fetched with CORS. All CDNs used here (unpkg, cdnjs, Google
   Fonts) send Access-Control-Allow-Origin: *, so mark the tags with
   crossorigin="anonymous" on video tool pages. */
function tg_video_tool_crossorigin_script($tag, $handle, $src)
{
    if (tg_is_video_tool_page() && strpos($src, home_url()) !== 0 && strpos($tag, ' crossorigin') === false) {
        $tag = str_replace(' src=', ' crossorigin="anonymous" src=', $tag);
    }
    return $tag;
}
add_filter('script_loader_tag', 'tg_video_tool_crossorigin_script', 10, 3);

function tg_video_tool_crossorigin_style($tag, $handle, $href)
{
    if (tg_is_video_tool_page() && strpos($href, home_url()) !== 0 && strpos($tag, ' crossorigin') === false) {
        $tag = str_replace(' href=', ' crossorigin="anonymous" href=', $tag);
    }
    return $tag;
}
add_filter('style_loader_tag', 'tg_video_tool_crossorigin_style', 10, 3);

/* Preconnect for Google Fonts */
function tg_preconnect_fonts()
{
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}
add_action('wp_head', 'tg_preconnect_fonts', 1);

/* Remove emoji scripts */
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('admin_print_scripts', 'print_emoji_detection_script');
remove_action('admin_print_styles', 'print_emoji_styles');

/* Remove block editor CSS from frontend */
add_action('wp_enqueue_scripts', function () {
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');
    wp_dequeue_style('global-styles');
}, 100);

/* =============================================
   WIDGET AREAS
   ============================================= */
function tg_register_sidebars()
{
    $args = [
        'before_widget' => '<div id="%1$s" class="tg-widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="tg-widget__title">',
        'after_title' => '</h3>',
    ];

    register_sidebar(array_merge($args, [
        'name' => __('AdSense Leaderboard (728×90)', 'toolsgallery'),
        'id' => 'adsense-leaderboard',
        'description' => __('728×90 banner ad area', 'toolsgallery'),
    ]));

    register_sidebar(array_merge($args, [
        'name' => __('AdSense Rectangle (300×250)', 'toolsgallery'),
        'id' => 'adsense-rectangle',
        'description' => __('300×250 rectangle ad area', 'toolsgallery'),
    ]));

    register_sidebar(array_merge($args, [
        'name' => __('AdSense In-Content (Responsive)', 'toolsgallery'),
        'id' => 'adsense-in-content',
        'description' => __('Responsive in-content ad area', 'toolsgallery'),
    ]));

    register_sidebar(array_merge($args, [
        'name' => __('AdSense Sidebar', 'toolsgallery'),
        'id' => 'adsense-sidebar',
        'description' => __('Sidebar ad area', 'toolsgallery'),
    ]));

    register_sidebar(array_merge($args, [
        'name' => __('Sidebar', 'toolsgallery'),
        'id' => 'main-sidebar',
        'description' => __('Main sidebar widget area', 'toolsgallery'),
    ]));
}
add_action('widgets_init', 'tg_register_sidebars');

/* =============================================
   CUSTOM POST TYPE: tg_tool
   ============================================= */
function tg_register_post_types()
{
    register_post_type('tg_tool', [
        'labels' => [
            'name' => __('Tools', 'toolsgallery'),
            'singular_name' => __('Tool', 'toolsgallery'),
            'add_new' => __('Add New Tool', 'toolsgallery'),
            'add_new_item' => __('Add New Tool', 'toolsgallery'),
            'edit_item' => __('Edit Tool', 'toolsgallery'),
            'new_item' => __('New Tool', 'toolsgallery'),
            'view_item' => __('View Tool', 'toolsgallery'),
            'search_items' => __('Search Tools', 'toolsgallery'),
            'not_found' => __('No tools found', 'toolsgallery'),
            'not_found_in_trash' => __('No tools found in trash', 'toolsgallery'),
            'menu_name' => __('Tools', 'toolsgallery'),
        ],
        'public' => true,
        'show_in_rest' => true,
        'has_archive' => false,
        'rewrite' => ['slug' => 'tool'],
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'menu_icon' => 'dashicons-hammer',
        'menu_position' => 5,
    ]);
}
add_action('init', 'tg_register_post_types');

/* =============================================
   TAXONOMY: tool_category
   ============================================= */
function tg_register_taxonomies()
{
    register_taxonomy('tool_category', 'tg_tool', [
        'labels' => [
            'name' => __('Tool Categories', 'toolsgallery'),
            'singular_name' => __('Tool Category', 'toolsgallery'),
            'search_items' => __('Search Tool Categories', 'toolsgallery'),
            'all_items' => __('All Tool Categories', 'toolsgallery'),
            'parent_item' => __('Parent Category', 'toolsgallery'),
            'parent_item_colon' => __('Parent Category:', 'toolsgallery'),
            'edit_item' => __('Edit Category', 'toolsgallery'),
            'update_item' => __('Update Category', 'toolsgallery'),
            'add_new_item' => __('Add New Category', 'toolsgallery'),
            'new_item_name' => __('New Category Name', 'toolsgallery'),
            'menu_name' => __('Tool Categories', 'toolsgallery'),
        ],
        'hierarchical' => true,
        'public' => true,
        'show_in_rest' => true,
        'rewrite' => ['slug' => 'tools'],
    ]);
}
add_action('init', 'tg_register_taxonomies');

/* =============================================
   CUSTOM META FIELDS: tg_tool
   ============================================= */
function tg_register_meta_fields()
{
    $string_fields = [
        '_tg_tool_type',
        '_tg_action_label',
        '_tg_accept_types',
        '_tg_handler',
        '_tg_related',
        '_tg_category_slug',
        '_tg_multi_file',
    ];

    foreach ($string_fields as $key) {
        register_post_meta('tg_tool', $key, [
            'single' => true,
            'type' => 'string',
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_text_field',
        ]);
    }

    $json_fields = ['_tg_faqs', '_tg_features', '_tg_steps', '_tg_intro'];
    foreach ($json_fields as $key) {
        register_post_meta('tg_tool', $key, [
            'single' => true,
            'type' => 'string',
            'show_in_rest' => true,
            'sanitize_callback' => 'wp_kses_post',
        ]);
    }
}
add_action('init', 'tg_register_meta_fields');

/* =============================================
   ADSENSE HELPER
   ============================================= */
function tg_ad_slot($slot_id, $size = 'responsive')
{
    $slot_id = sanitize_text_field($slot_id);
    $size = sanitize_text_field($size);

    if (!defined('ADSENSE_PUBLISHER_ID')) {
        $dimensions = [
            'leaderboard' => 'width:728px;height:90px',
            'rectangle' => 'width:300px;height:250px',
            'sticky-footer' => 'width:320px;height:50px',
            'responsive' => 'width:100%;min-height:100px',
        ];
        $dim = $dimensions[$size] ?? $dimensions['responsive'];
        return '<div class="tg-ad-placeholder" style="' . esc_attr($dim) . ';border:2px dashed var(--color-primary);display:flex;align-items:center;justify-content:center;background:var(--color-primary-light);border-radius:var(--radius-md);margin:1rem auto;" data-ad-slot="' . esc_attr($slot_id) . '"><span style="color:var(--color-primary);font-size:12px;font-weight:500;">Ad Slot: ' . esc_html($slot_id) . ' (' . esc_html($size) . ')</span></div>';
    }

    $slots = json_decode(get_option('tg_adsense_slots', '{}'), true);
    $slot_code = $slots[$slot_id] ?? '';
    if (!$slot_code)
        return '';

    return '<ins class="adsbygoogle"'
        . ' style="display:block"'
        . ' data-ad-client="' . esc_attr(ADSENSE_PUBLISHER_ID) . '"'
        . ' data-ad-slot="' . esc_attr($slot_code) . '"'
        . ' data-ad-format="auto"'
        . ' data-full-width-responsive="true"></ins>'
        . '<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>';
}

/* =============================================
   BREADCRUMBS — single authoritative function
   Called ONLY from header.php; never from templates
   ============================================= */
function tg_breadcrumbs()
{
    if (is_front_page())
        return;

    // Blog listing page (static page set as posts page)
    if (is_home()) {
        $crumbs[] = ['label' => __('Blog', 'toolsgallery'), 'url' => '', 'current' => true];
        // Need at least Home + Blog
        echo '<script type="application/ld+json">' . wp_json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => home_url('/')],
                ['@type' => 'ListItem', 'position' => 2, 'name' => 'Blog', 'item' => get_permalink(get_option('page_for_posts'))],
            ],
        ]) . '</script>' . "\n";
        echo '<nav class="tg-breadcrumb" aria-label="' . esc_attr__('Breadcrumb', 'toolsgallery') . '" itemscope itemtype="https://schema.org/BreadcrumbList">' . "\n";
        echo '<div class="tg-breadcrumb__inner tg-container">' . "\n";
        echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
        echo '<a class="tg-breadcrumb__link" itemprop="item" href="' . esc_url(home_url('/')) . '"><span itemprop="name">' . esc_html__('Home', 'toolsgallery') . '</span></a>';
        echo '<meta itemprop="position" content="1" />';
        echo '</span>';
        echo '<span class="tg-breadcrumb__sep" aria-hidden="true">&rsaquo;</span>';
        echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
        echo '<span class="tg-breadcrumb__current" itemprop="name">' . esc_html__('Blog', 'toolsgallery') . '</span>';
        echo '<meta itemprop="position" content="2" />';
        echo '</span>';
        echo '</div>' . "\n" . '</nav>' . "\n";
        return;
    }

    $crumbs = [];
    $crumbs[] = ['label' => __('Home', 'toolsgallery'), 'url' => home_url('/')];

    if (is_tax('tool_category')) {
        $term = get_queried_object();
        $crumbs[] = ['label' => __('Tools', 'toolsgallery'), 'url' => home_url('/tools/')];
        $crumbs[] = ['label' => $term->name, 'url' => ''];

    } elseif (is_singular('tg_tool')) {
        $crumbs[] = ['label' => __('Tools', 'toolsgallery'), 'url' => home_url('/tools/')];
        $terms = get_the_terms(get_the_ID(), 'tool_category');
        if ($terms && !is_wp_error($terms)) {
            $term = $terms[0];
            $crumbs[] = ['label' => $term->name, 'url' => get_term_link($term)];
        }
        $crumbs[] = ['label' => get_the_title(), 'url' => ''];

    } elseif (is_page('tools') || is_post_type_archive('tg_tool')) {
        $crumbs[] = ['label' => __('Tools', 'toolsgallery'), 'url' => ''];

    } elseif (is_single() && get_post_type() === 'post') {
        $blog_url = get_permalink(get_option('page_for_posts'));
        $crumbs[] = ['label' => __('Blog', 'toolsgallery'), 'url' => $blog_url ?: home_url('/blog/')];
        $cats = get_the_category();
        if ($cats) {
            $valid_cat = null;
            foreach ($cats as $c) {
                if ($c->slug !== 'uncategorized') {
                    $valid_cat = $c;
                    break;
                }
            }
            if ($valid_cat) {
                $crumbs[] = ['label' => $valid_cat->name, 'url' => get_category_link($valid_cat->term_id)];
            }
        }
        $crumbs[] = ['label' => get_the_title(), 'url' => ''];

    } elseif (is_archive()) {
        $crumbs[] = ['label' => __('Blog', 'toolsgallery'), 'url' => ''];

    } elseif (is_search()) {
        $crumbs[] = ['label' => sprintf(__('Search Results for "%s"', 'toolsgallery'), get_search_query()), 'url' => ''];

    } elseif (is_page()) {
        $page = get_queried_object();
        if ($page->post_parent) {
            $parent = get_post($page->post_parent);
            $crumbs[] = ['label' => $parent->post_title, 'url' => get_permalink($parent->ID)];
        }
        $crumbs[] = ['label' => get_the_title(), 'url' => ''];

    } elseif (is_404()) {
        $crumbs[] = ['label' => __('404 — Page Not Found', 'toolsgallery'), 'url' => ''];
    }

    if (count($crumbs) < 2)
        return;

    // JSON-LD
    $ld_items = [];
    foreach ($crumbs as $i => $crumb) {
        $ld_items[] = [
            '@type' => 'ListItem',
            'position' => $i + 1,
            'name' => $crumb['label'],
            'item' => $crumb['url'] ?: (string) get_permalink(),
        ];
    }
    echo '<script type="application/ld+json">' . wp_json_encode([
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        'itemListElement' => $ld_items,
    ]) . '</script>' . "\n";

    // HTML
    echo '<nav class="tg-breadcrumb" aria-label="' . esc_attr__('Breadcrumb', 'toolsgallery') . '" itemscope itemtype="https://schema.org/BreadcrumbList">' . "\n";
    echo '<div class="tg-breadcrumb__inner tg-container">' . "\n";

    $total = count($crumbs);
    foreach ($crumbs as $i => $crumb) {
        $is_last = ($i === $total - 1);
        echo '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
        if (!$is_last && $crumb['url']) {
            echo '<a class="tg-breadcrumb__link" itemprop="item" href="' . esc_url($crumb['url']) . '"><span itemprop="name">' . esc_html($crumb['label']) . '</span></a>';
        } else {
            echo '<span class="tg-breadcrumb__current" itemprop="name">' . esc_html($crumb['label']) . '</span>';
        }
        echo '<meta itemprop="position" content="' . esc_attr($i + 1) . '" />';
        echo '</span>';
        if (!$is_last) {
            echo '<span class="tg-breadcrumb__sep" aria-hidden="true">&rsaquo;</span>';
        }
    }

    echo '</div>' . "\n";
    echo '</nav>' . "\n";
}

/* =============================================
   FAVICON
   ============================================= */
function tg_favicon()
{
    $uri = get_template_directory_uri();
    echo '<link rel="icon" type="image/svg+xml" href="' . esc_url($uri . '/assets/images/logo-icon.svg') . '">' . "\n";
    echo '<link rel="alternate icon" href="' . esc_url($uri . '/assets/images/favicon.png') . '">' . "\n";
    echo '<link rel="apple-touch-icon" href="' . esc_url($uri . '/assets/images/logo-icon.svg') . '">' . "\n";
}
add_action('wp_head', 'tg_favicon', 1);
add_action('admin_head', 'tg_favicon', 1);

/* =============================================
   OPENROUTER AI PROXY
   ============================================= */
add_action('wp_ajax_tg_ai_proxy', 'tg_ai_proxy_handler');
add_action('wp_ajax_nopriv_tg_ai_proxy', 'tg_ai_proxy_handler');

add_action('wp_ajax_tg_tts_proxy', 'tg_tts_proxy_handler');
add_action('wp_ajax_nopriv_tg_tts_proxy', 'tg_tts_proxy_handler');

add_action('wp_ajax_tg_url_to_pdf', 'tg_handle_url_to_pdf');
add_action('wp_ajax_nopriv_tg_url_to_pdf', 'tg_handle_url_to_pdf');

add_action('wp_ajax_tg_removebg', 'tg_handle_removebg');
add_action('wp_ajax_nopriv_tg_removebg', 'tg_handle_removebg');

/**
 * Proxy an uploaded image to the remove.bg API and return the
 * transparent-PNG result as base64. Requires REMOVEBG_API_KEY in
 * wp-config.php; the client falls back to Canvas removal when the
 * key is absent (tgAiConfig.removebgConfigured is 0).
 */
function tg_handle_removebg()
{
    check_ajax_referer('tg_tool_nonce', 'nonce');

    if (!defined('REMOVEBG_API_KEY') || !REMOVEBG_API_KEY) {
        wp_send_json_error(['message' => 'Remove.bg API key not configured.'], 500);
    }

    if (empty($_FILES['image_file']) || !is_uploaded_file($_FILES['image_file']['tmp_name'])) {
        wp_send_json_error(['message' => 'No image uploaded.'], 400);
    }

    $file = $_FILES['image_file'];
    if ($file['size'] > 12 * 1024 * 1024) {
        wp_send_json_error(['message' => 'Image too large (max 12 MB).'], 400);
    }

    $type = wp_check_filetype($file['name']);
    $allowed = ['jpg', 'jpeg', 'png', 'webp'];
    if (!in_array(strtolower((string) $type['ext']), $allowed, true)) {
        wp_send_json_error(['message' => 'Unsupported image type.'], 400);
    }

    $response = wp_remote_post('https://api.remove.bg/v1.0/removebg', [
        'timeout' => 60,
        'headers' => [
            'X-Api-Key' => REMOVEBG_API_KEY,
            'Content-Type' => 'application/json',
        ],
        'body' => wp_json_encode([
            'image_file_b64' => base64_encode(file_get_contents($file['tmp_name'])),
            'size' => 'auto',
        ]),
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Remove.bg request failed: ' . $response->get_error_message()], 500);
    }

    $code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);

    if ($code !== 200) {
        $data = json_decode($body, true);
        $msg = $data['errors'][0]['title'] ?? ('Remove.bg returned HTTP ' . $code);
        wp_send_json_error(['message' => $msg], 500);
    }

    wp_send_json_success(['image' => base64_encode($body)]);
}

function tg_handle_url_to_pdf()
{
    $url = isset($_POST['url']) ? esc_url_raw(wp_unslash($_POST['url'])) : '';
    if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
        wp_send_json_error(['message' => 'Invalid URL provided.'], 400);
    }

    $response = wp_remote_get($url, [
        'timeout' => 20,
        'user-agent' => 'Mozilla/5.0 (compatible; ToolsGallery/1.0)',
        'sslverify' => true,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Could not fetch URL: ' . $response->get_error_message()], 500);
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code < 200 || $code >= 400) {
        wp_send_json_error(['message' => 'URL returned HTTP ' . $code], 500);
    }

    $html = wp_remote_retrieve_body($response);
    wp_send_json_success(['html' => $html, 'url' => $url]);
}

function tg_get_client_ip()
{
    // Cloudflare gives the true visitor IP here; trust it only if present.
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $ip = sanitize_text_field(wp_unslash($_SERVER['HTTP_CF_CONNECTING_IP']));
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // First entry is the original client.
        $parts = explode(',', sanitize_text_field(wp_unslash($_SERVER['HTTP_X_FORWARDED_FOR'])));
        $ip = trim($parts[0]);
    } else {
        $ip = sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'] ?? ''));
    }
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
}

function tg_check_rate_limit($prefix, $max, $window = HOUR_IN_SECONDS)
{
    if (current_user_can('manage_options')) {
        return true;   // admins exempt (our own testing)
    }
    $key  = $prefix . md5(tg_get_client_ip());
    $data = get_transient($key);
    $now  = time();
    if (!is_array($data) || empty($data['reset']) || $data['reset'] <= $now) {
        $data = ['count' => 0, 'reset' => $now + $window];   // start a fresh window
    }
    if ($data['count'] >= $max) {
        $mins = max(1, (int) ceil(($data['reset'] - $now) / 60));
        wp_send_json_error([
            'message' => sprintf('You have reached the free usage limit (%d per hour). Please try again in %d minute%s.', $max, $mins, $mins === 1 ? '' : 's'),
        ], 429);
    }
    $data['count']++;
    // Keep the ORIGINAL window — do not extend the TTL on each request.
    set_transient($key, $data, max(60, $data['reset'] - $now));
    return true;
}

function tg_check_daily_cap($prefix, $cap)
{
    if (current_user_can('manage_options')) {
        return true;   // admins exempt (our own testing)
    }
    $day_key = $prefix . gmdate('Y-m-d');
    $day = (int) get_transient($day_key);
    if ($day >= $cap) {
        wp_send_json_error(['message' => 'Daily capacity reached. Please try again tomorrow.'], 429);
    }
    // Date-keyed, so a refreshed TTL never stretches the window past the day.
    set_transient($day_key, $day + 1, DAY_IN_SECONDS);
    return true;
}

function tg_ai_proxy_handler()
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        wp_send_json_error(['message' => 'Invalid request.'], 405);
    }

    check_ajax_referer('tg_tool_nonce', 'nonce');

    if (!defined('OPENROUTER_API_KEY')) {
        wp_send_json_error(['message' => 'API not configured'], 500);
    }

    $tool = sanitize_text_field(wp_unslash($_POST['tool'] ?? ''));
    $payload = isset($_POST['payload']) && is_array($_POST['payload']) ? $_POST['payload'] : [];

    // Junk requests without a tool key shouldn't burn a rate-limit slot.
    if ($tool === '' || !isset(tg_get_tool_prompts()[$tool])) {
        wp_send_json_error(['message' => 'Invalid request.'], 400);
    }

    // Reject oversized input up front — before it burns a rate-limit slot
    // or reaches the API. 20k chars is far beyond any real tool input
    // (per-field prompts are capped at TG_AI_MAX_INPUT_CHARS anyway).
    $payload_size = 0;
    foreach ($payload as $value) {
        if (is_string($value)) {
            $payload_size += strlen($value);
        }
    }
    if ($payload_size > 20000) {
        wp_send_json_error(['message' => 'Input too long.'], 413);
    }

    tg_check_rate_limit('tg_rate_', 30);
    tg_check_daily_cap('tg_ai_daily_', TG_AI_DAILY_CAP);

    $result = tg_call_openrouter($tool, $payload);
    if (isset($result['error'])) {
        wp_send_json_error(['message' => $result['error']], 500);
    }
    wp_send_json_success($result);
}

function tg_call_openrouter($tool_key, $payload)
{
    $api_key = defined('OPENROUTER_API_KEY')
        ? OPENROUTER_API_KEY : '';
    if (!$api_key) {
        return ['error' => 'API key not configured.'];
    }

    $prompts = tg_get_tool_prompts();
    if (!isset($prompts[$tool_key])) {
        return ['error' => 'Unknown tool: ' . $tool_key];
    }

    $config = $prompts[$tool_key];

    // Build user prompt
    $user_prompt = tg_build_user_prompt(
        $config,
        $payload
    );

    if (empty(trim($user_prompt))) {
        return ['error' => 'Empty prompt.'];
    }

    // Clamp per-tool max_tokens so a misconfigured value can't run up cost.
    $max_tokens = min((int) ($config['max_tokens'] ?? 1500), TG_AI_MAX_TOKENS);

    $request_body = wp_json_encode([
        'model' => $config['model'] ?? TG_AI_MODEL,
        'messages' => [
            [
                'role' => 'system',
                'content' => $config['system'] ?? 'You are a helpful assistant.',
            ],
            [
                'role' => 'user',
                'content' => $user_prompt,
            ],
        ],
        'max_tokens' => $max_tokens,
        'temperature' => 0.7,
    ]);

    $response = wp_remote_post(
        'https://openrouter.ai/api/v1/chat/completions',
        [
            'timeout' => 60,
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => home_url(),
                'X-Title' => get_bloginfo('name'),
            ],
            'body' => $request_body,
        ]
    );

    if (is_wp_error($response)) {
        return ['error' => $response->get_error_message()];
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    // Full-body logging is debug-only: it bloats the log and stores user text.
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('OpenRouter response for [' .
            $tool_key . ']: ' . $body);
    }

    // Check for API error
    if (isset($data['error'])) {
        $err_msg = is_array($data['error'])
            ? ($data['error']['message'] ?? json_encode($data['error']))
            : $data['error'];
        $status = wp_remote_retrieve_response_code($response);
        error_log('OpenRouter error [' . $tool_key . '] HTTP ' . $status . ': ' . $err_msg);
        return ['error' => $err_msg];
    }

    // Extract content from response
    $content = $data['choices'][0]['message']['content']
        ?? $data['choices'][0]['text']
        ?? $data['output']
        ?? $data['response']
        ?? '';

    if (empty(trim($content))) {
        error_log('OpenRouter empty content for [' . $tool_key . ']');
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('OpenRouter empty-content full body: ' . $body);
        }
        return ['error' => 'AI returned an empty response. Please try again.'];
    }

    return ['result' => $content];
}

/* =============================================
   TEXT-TO-SPEECH PROXY (tts-prep) — OpenRouter /audio/speech
   ============================================= */
function tg_tts_proxy_handler()
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        wp_send_json_error(['message' => 'Invalid request.'], 405);
    }

    check_ajax_referer('tg_tool_nonce', 'nonce');

    if (!defined('OPENROUTER_API_KEY') || !OPENROUTER_API_KEY) {
        wp_send_json_error(['message' => 'Text-to-Speech is not configured yet (missing OPENROUTER_API_KEY). Please contact the site administrator.'], 500);
    }

    tg_check_rate_limit('tg_tts_rate_', 15);
    tg_check_daily_cap('tg_tts_daily_', TG_TTS_DAILY_CAP);

    $text = trim((string) wp_unslash($_POST['text'] ?? ''));
    $text = wp_strip_all_tags($text);
    if ($text === '') {
        wp_send_json_error(['message' => 'Please enter some text to convert to speech.'], 400);
    }
    if (strlen($text) > 12000) {
        wp_send_json_error(['message' => 'Text is too long (maximum 12,000 characters).'], 400);
    }

    $is_gemini = (stripos(TG_TTS_MODEL, 'gemini') !== false);

    $openai_voices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse'];
    $gemini_voices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Leda', 'Orus'];
    $allowed_voices = $is_gemini ? $gemini_voices : $openai_voices;
    $voice = sanitize_text_field(wp_unslash($_POST['voice'] ?? ''));
    if (!in_array($voice, $allowed_voices, true)) {
        $voice = $is_gemini ? 'Zephyr' : 'alloy';
    }

    $instructions = sanitize_textarea_field(wp_unslash($_POST['instructions'] ?? ''));
    $instructions = substr($instructions, 0, 1000);

    $speed = (float) ($_POST['speed'] ?? 1.0);
    $speed = max(0.5, min(2.0, $speed));

    // The TTS endpoint caps input at ~4096 chars per request — chunk long
    // text on sentence boundaries and concatenate the audio bytes.
    $chunks = tg_tts_split_text($text, 4000);
    $audio = '';
    // Gemini TTS only supports response_format "pcm" (it errors on "mp3"),
    // so the Gemini path always returns raw PCM that gets WAV-wrapped below.
    $got_pcm = $is_gemini;
    $pcm_rate = 24000;
    $pcm_channels = 1;
    foreach ($chunks as $chunk) {
        if ($is_gemini) {
            // Gemini TTS has no `instructions` field and ignores `speed`.
            // Emotion/vibe is steered through the prompt itself: prepend the
            // style directive (which may carry inline tags like [whispers])
            // to every chunk so delivery stays consistent across chunks.
            $body = [
                'model' => TG_TTS_MODEL,
                'input' => $instructions !== '' ? $instructions . ' ' . $chunk : $chunk,
                'voice' => $voice,
                'response_format' => 'pcm',
            ];
        } else {
            $body = [
                'model' => TG_TTS_MODEL,
                'input' => $chunk,
                'voice' => $voice,
                'speed' => $speed,
                'response_format' => 'mp3',
            ];
            if ($instructions !== '') {
                // Via OpenRouter, OpenAI's `instructions` field must go under
                // provider.options.openai — not top-level.
                $body['provider'] = [
                    'options' => [
                        'openai' => ['instructions' => $instructions],
                    ],
                ];
            }
        }

        $response = wp_remote_post('https://openrouter.ai/api/v1/audio/speech', [
            'timeout' => 120,
            'headers' => [
                'Authorization' => 'Bearer ' . OPENROUTER_API_KEY,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => home_url(),
                'X-Title' => get_bloginfo('name'),
            ],
            'body' => wp_json_encode($body),
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'TTS request failed: ' . $response->get_error_message()], 500);
        }

        $code = wp_remote_retrieve_response_code($response);
        // On HTTP 200 the body is raw audio bytes, NOT JSON —
        // only non-2xx responses carry a JSON error payload.
        $bytes = wp_remote_retrieve_body($response);

        if ($code < 200 || $code >= 300) {
            $data = json_decode($bytes, true);
            $err = $data['error']['message'] ?? ('TTS provider returned HTTP ' . $code);
            error_log('OpenRouter TTS error HTTP ' . $code . ': ' . $err);
            wp_send_json_error(['message' => $err], 500);
        }

        // Raw PCM chunks concatenate cleanly; the WAV header is added once
        // at the end. The Content-Type may carry the stream parameters
        // (e.g. "audio/pcm;rate=24000;channels=1") — honor them when present.
        $ctype = strtolower((string) wp_remote_retrieve_header($response, 'content-type'));
        if (strpos($ctype, 'pcm') !== false || strpos($ctype, 'l16') !== false) {
            $got_pcm = true;
        }
        if (preg_match('/rate=(\d+)/', $ctype, $m)) {
            $pcm_rate = (int) $m[1];
        }
        if (preg_match('/channels=(\d+)/', $ctype, $m)) {
            $pcm_channels = (int) $m[1];
        }

        $audio .= $bytes;
    }

    if ($audio === '') {
        wp_send_json_error(['message' => 'TTS provider returned no audio. Please try again.'], 500);
    }

    if ($got_pcm) {
        // Wrap the raw 16-bit PCM in a WAV header so the browser <audio>
        // element can play it (Gemini default: 24kHz mono).
        $audio = tg_tts_pcm_to_wav($audio, $pcm_rate, $pcm_channels, 16);
        $mime = 'audio/wav';
        $format = 'wav';
    } else {
        $mime = 'audio/mpeg';
        $format = 'mp3';
    }

    wp_send_json_success([
        'audio' => base64_encode($audio),
        'mime' => $mime,
        'format' => $format,
        'ext' => $format,
    ]);
}

/* Wrap raw little-endian PCM samples in a standard RIFF/WAV header. */
function tg_tts_pcm_to_wav($pcm, $sample_rate, $channels, $bits)
{
    $data_len = strlen($pcm);
    $block_align = $channels * ($bits / 8);
    $byte_rate = $sample_rate * $block_align;
    return 'RIFF' . pack('V', 36 + $data_len) . 'WAVE'
        . 'fmt ' . pack('V', 16)
        . pack('v', 1)              // PCM format
        . pack('v', $channels)
        . pack('V', $sample_rate)
        . pack('V', $byte_rate)
        . pack('v', $block_align)
        . pack('v', $bits)
        . 'data' . pack('V', $data_len)
        . $pcm;
}

/* Split text into <= $max_len chunks, preferring sentence boundaries. */
function tg_tts_split_text($text, $max_len)
{
    if (strlen($text) <= $max_len) {
        return [$text];
    }
    $sentences = preg_split('/(?<=[.!?])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
    $chunks = [];
    $current = '';
    foreach ($sentences as $sentence) {
        // A single sentence longer than the cap gets hard-split.
        while (strlen($sentence) > $max_len) {
            if ($current !== '') {
                $chunks[] = $current;
                $current = '';
            }
            $chunks[] = substr($sentence, 0, $max_len);
            $sentence = substr($sentence, $max_len);
        }
        $candidate = $current === '' ? $sentence : $current . ' ' . $sentence;
        if (strlen($candidate) > $max_len) {
            $chunks[] = $current;
            $current = $sentence;
        } else {
            $current = $candidate;
        }
    }
    if ($current !== '') {
        $chunks[] = $current;
    }
    return $chunks;
}

function tg_get_tool_prompts()
{
    return [
        'pdf-summarize' => [
            'max_tokens' => 2000,
            'system' => 'You are an expert document analyst. Summarize the provided text clearly and accurately. Be concise but comprehensive.',
            'user_template' => "Summarize the following document text {format} ({length} summary):\n\n{text}",
        ],
        'pdf-translate' => [
            'max_tokens' => 3000,
            'system' => 'You are a professional translator. Translate the provided text accurately while preserving meaning, tone, and formatting.',
            'user_template' => "Translate the following text to {language}. Provide only the translation without any explanation:\n\n{text}",
        ],
        'grammar-fixer' => [
            'max_tokens' => 2000,
            'system' => 'You are an expert proofreader and editor. Fix grammar, spelling, and punctuation errors. Return only the corrected text without explanations.',
            'user_template' => "Fix all grammar, spelling, and punctuation errors in the following text. Correction level: {level}. Return only the corrected text. {show_corrections}\n\nText:\n{text}",
        ],
        'paraphraser' => [
            'max_tokens' => 2000,
            'system' => 'You are an expert writer. Paraphrase text while preserving the original meaning. Return only the paraphrased text with no commentary. If more than one version is requested, number each version on its own line.',
            'user_template' => "Paraphrase the following text in a {mode} style. Provide {count} version(s). Each version should be {length}:\n\n{text}",
        ],
        'ai-humanizer' => [
            'max_tokens' => 2000,
            'system' => 'You are an expert writer. Rewrite AI-generated text to sound natural and human. Vary sentence length, use contractions, and add personality. Return only the rewritten text.',
            'user_template' => "Rewrite the following AI-generated text to sound natural and human-written. Humanization level: {level}. Writing style: {style}. {additions}\n\nText:\n{text}",
        ],
        'summarizer' => [
            'max_tokens' => 1500,
            'system' => 'You are an expert at summarizing content. Create clear, accurate summaries. Return only the summary.',
            'user_template' => "Summarize the following text as a {type} summary. Focus on: {focus}. Write the summary in {language}:\n\n{text}",
        ],
        'essay-writer' => [
            'max_tokens' => 3000,
            'system' => 'You are an expert academic writer. Write well-structured essays with clear introduction, body paragraphs, and conclusion.',
            'user_template' => "Write a {type} essay of about {length} words on the following topic. Academic level: {level}. Tone: {tone}. Required structure elements: {structure}.\n\nTopic: {topic}",
        ],
        'article-writer' => [
            'max_tokens' => 3000,
            'system' => 'You are an expert content writer. Write engaging, well-structured articles.',
            'user_template' => "Write a {type} article of about {length} words about: {topic}. Target audience: {audience}. Tone: {tone}. Include: {includes}. SEO keywords to work in naturally: {keywords}.",
        ],
        'blog-post-generator' => [
            'max_tokens' => 3000,
            'system' => 'You are an expert blogger. Write engaging, SEO-friendly blog posts with proper headings and structure.',
            'user_template' => "Write a {style} blog post of about {length} words about: {topic}. Blog niche: {niche}. SEO keywords to work in naturally: {keywords}. {cta_instruction} {meta_description}",
        ],
        'ai-translator' => [
            'max_tokens' => 3000,
            'system' => 'You are a professional translator. Translate text accurately while preserving meaning and tone. Provide only the translation, no commentary.',
            'user_template' => "Translate the following text from {source} to {target}. Tone: {tone}. {preserve_formatting}\n\nText:\n{text}",
        ],
        'sentence-rewriter' => [
            'max_tokens' => 1000,
            'system' => 'You are an expert editor. Rewrite sentences to improve clarity, tone, or style. Output ONLY a numbered list ("1.", "2.", ...) with one rewritten alternative per number, no commentary.',
            'user_template' => "Rewrite the following text. Goal: {goal}. Provide exactly {count} alternative rewrites. {keep_meaning}\n\nText:\n{text}",
        ],
        'plagiarism-checker' => [
            'max_tokens' => 1000,
            'system' => 'You are an expert at detecting AI-generated and plagiarized content. Respond with ONLY a raw JSON object (no markdown, no code fences) with these keys: "originality" (integer 0-100), "ai_likelihood" (integer 0-100), "repeated_phrases" (array of strings), "assessment" (short paragraph string).',
            'user_template' => "Analyze the following text for signs of AI generation or plagiarism. Check type: {type}.\n\nText:\n{text}",
        ],
        'cover-letter-generator' => [
            'max_tokens' => 1500,
            'system' => 'You are an expert career coach. Write professional, compelling cover letters.',
            'user_template' => "Write a {tone}, {length} cover letter for the position of {job_title} at {company}. Applicant name: {name}. Key skills and experience: {skills}. Why this company: {why_company}. Be sure to include: {includes}.",
        ],
        'resume-writer' => [
            'max_tokens' => 2000,
            'system' => 'You are an expert resume writer. Create professional, ATS-optimized resume content.',
            'user_template' => "Write professional, ATS-optimized resume content in a {style} style for: {name}, applying as {job_title}. Professional summary: {summary}. Work experience: {experience}. Education: {education}. Skills: {skills}. Languages: {languages}.",
        ],
        'email-writer' => [
            'max_tokens' => 1000,
            'system' => 'You are an expert business writer. Begin the output with a line "Subject: <subject>", then the email body.',
            'user_template' => "Write a {tone}, {length} {type} email. From: {sender}. To: {recipient}. Purpose and context: {context}. Be sure to include: {includes}.",
        ],
        'product-desc-writer' => [
            'max_tokens' => 1000,
            'system' => 'You are an expert copywriter. Write compelling product descriptions that convert.',
            'user_template' => "Write a {tone}, {length} product description for \"{name}\" ({category}) optimized for {platform}. Key features: {features}. Target customer: {customer}. Be sure to include: {includes}.",
        ],
        'ad-copy-generator' => [
            'max_tokens' => 1000,
            'system' => 'You are an expert advertising copywriter. Write compelling ad copy that drives clicks and conversions. Structure the output in plain text using ONLY these section headers on their own lines (include only requested sections): HEADLINES, BODY COPY, CALL TO ACTION, DISPLAY URL. No markdown.',
            'user_template' => "Write {platform} ad copy for: {product}. Campaign goal: {goal}. Target audience: {audience}. Unique selling point: {usp}. Tone: {tone}. Generate these sections: {generate}.",
        ],
        'social-caption-writer' => [
            'max_tokens' => 500,
            'system' => 'You are a social media expert. Write engaging captions that drive engagement. If more than one caption is requested, output a numbered list ("1.", "2.", ...) with one caption per number. No commentary.',
            'user_template' => "Write exactly {count} {tone}, {length} {platform} caption(s) about: {topic}. Be sure to include: {includes}.",
        ],
        'hashtag-generator' => [
            'max_tokens' => 500,
            'system' => 'You are a social media expert. Generate relevant, trending hashtags. Output ONLY one hashtag per line in the exact format "#hashtag SIZE" where SIZE is one of HUGE, LARGE, MEDIUM, or NICHE (its popularity tier). No commentary, numbering, or markdown.',
            'user_template' => "Generate exactly {count} relevant hashtags for a {platform} post about: {topic}. Niche: {niche}. Popularity mix: {mix}.",
        ],
        'slogan-generator' => [
            'max_tokens' => 500,
            'system' => 'You are an expert brand strategist and copywriter. Output ONLY a numbered list, one slogan per line, no commentary.',
            'user_template' => "Generate exactly {count} {tone} slogans (each {length}) for the brand \"{brand}\". Product or service: {product}. Key value or USP: {value}.",
        ],
        'business-name-generator' => [
            'max_tokens' => 800,
            'system' => 'You are an expert brand consultant. Generate creative, memorable business names. For each name output exactly two lines: "NAME: <name>" then "TAGLINE: <short tagline>", with a blank line between entries. No commentary, numbering, or markdown.',
            'user_template' => "Generate exactly {count} unique business names for a {industry} business. Keywords to draw from: {keywords}. Naming style: {style}. Name length: {length}. Target market: {market}.",
        ],
        'story-generator' => [
            'max_tokens' => 3000,
            'system' => 'You are a creative fiction writer. Write engaging stories with compelling characters and plot.',
            'user_template' => "Write a {length} {genre} short story with a {tone} tone, told from {pov} point of view, about: {premise}. Setting: {setting}. Main character: {character}.",
        ],
        'poem-generator' => [
            'max_tokens' => 1000,
            'system' => 'You are an expert poet. Write beautiful, evocative poems in the requested style.',
            'user_template' => "Write a {length} {style} poem with a {mood} mood about: {topic}. Occasion: {occasion}.",
        ],
        'lyrics-generator' => [
            'max_tokens' => 1500,
            'system' => 'You are an expert songwriter. Write creative, rhyming song lyrics with verses and chorus.',
            'user_template' => "Write {genre} song lyrics with a {mood} mood about: {topic}. Song structure: {structure}. Rhyme scheme: {rhyme}. Style influence: {artist_note}.",
        ],
        'faq-generator' => [
            'max_tokens' => 2000,
            'system' => 'You are an expert content strategist. Generate realistic, non-repetitive FAQs. Output ONLY the FAQs, each as a line "Q: <question>" followed by a line "A: <answer>", with a blank line between items. No markdown, numbering, bullets, or headings.',
            'user_template' => "Generate exactly {count} frequently asked questions about: {topic}. Focus area: {type}. Target audience level: {audience}. Answer length: {length}.",
        ],
        'meta-desc-generator' => [
            'max_tokens' => 500,
            'system' => 'You are an SEO expert. Write compelling meta descriptions under 160 characters that improve click-through rates. Output ONLY a numbered list ("1.", "2.", ...), one description per number, no commentary or markdown.',
            'user_template' => "Write exactly {count} SEO-optimized meta descriptions (under 160 characters each) for a page titled \"{title}\". Page content summary: {summary}. Primary keyword: {keyword}. Secondary keywords: {secondary}. Call to action: {cta}.",
        ],
        'youtube-title-generator' => [
            'max_tokens' => 500,
            'system' => 'You are a YouTube SEO expert. Generate click-worthy, SEO-optimized video titles. Output ONLY a numbered list ("1.", "2.", ...), one title per number, no commentary or markdown.',
            'user_template' => "Generate exactly {count} compelling {style} YouTube titles for a {type} video about: {topic}. Target audience: {audience}. Keywords to include: {keywords}.",
        ],
        'youtube-desc-writer' => [
            'max_tokens' => 1000,
            'system' => 'You are a YouTube SEO expert. Write engaging, keyword-rich video descriptions.',
            'user_template' => "Write an SEO-optimized YouTube description for a video titled \"{title}\". Video content: {topic}. Channel niche: {niche}. Keywords to include: {keywords}. Chapters/timestamps: {chapters}. Be sure to include: {includes}.",
        ],
        'word-counter' => [
            'max_tokens' => 200,
            'system' => 'Count words accurately.',
            'user_template' => "{text}",
        ],
    ];
}

function tg_build_user_prompt($config, $payload)
{
    $template = $config['user_template'] ?? '{text}';

    if (!is_array($payload) || empty($payload)) {
        return $template;
    }

    // Many tools send the primary input as topic/brand/context/etc. Normalize to `text`.
    if (empty($payload['text'])) {
        foreach (['topic', 'brand', 'context', 'keywords', 'subject', 'prompt', 'input', 'description', 'content'] as $alias) {
            if (isset($payload[$alias]) && $payload[$alias] !== '') {
                $payload['text'] = $payload[$alias];
                break;
            }
        }
    }

    foreach ($payload as $key => $value) {
        $clean = sanitize_textarea_field(wp_unslash($value));
        // Per-field cap so one huge value can't blow up the prompt.
        if (strlen($clean) > TG_AI_MAX_INPUT_CHARS) {
            $clean = substr($clean, 0, TG_AI_MAX_INPUT_CHARS);
        }
        $template = str_replace('{' . $key . '}', $clean, $template);
    }

    $template = preg_replace('/\{[a-zA-Z0-9_]+\}/', '', $template);

    // Hard cap on the final prompt regardless of how many fields fed it.
    if (strlen($template) > TG_AI_MAX_INPUT_CHARS) {
        $template = substr($template, 0, TG_AI_MAX_INPUT_CHARS);
    }

    return trim($template);
}

/* =============================================
   SEO JSON-LD — tool pages (Phase 2 + Phase 9 B2)
   ============================================= */
add_action('wp_head', 'tg_tool_json_ld', 5);
function tg_tool_json_ld()
{
    if (!is_singular('tg_tool'))
        return;

    $post_id = get_queried_object_id();
    $title = get_the_title($post_id);
    $excerpt = get_post_field('post_excerpt', $post_id);
    if (!$excerpt) {
        $excerpt = wp_trim_words(wp_strip_all_tags(get_post_field('post_content', $post_id)), 30, '…');
    }
    $tool_url = get_permalink($post_id);
    $faqs_raw = get_post_meta($post_id, '_tg_faqs', true);
    $features_raw = get_post_meta($post_id, '_tg_features', true);
    $steps_raw = get_post_meta($post_id, '_tg_steps', true);
    $faqs = $faqs_raw ? json_decode($faqs_raw, true) : [];
    $features = $features_raw ? json_decode($features_raw, true) : [];
    $steps = $steps_raw ? json_decode($steps_raw, true) : [];

    $terms = get_the_terms($post_id, 'tool_category');
    $cat = ($terms && !is_wp_error($terms)) ? $terms[0] : null;
    $cat_name = $cat ? $cat->name : 'Online Tool';
    $cat_slug = $cat ? $cat->slug . '/' : '';

    $schema_graph = [];

    /* 1. WebPage */
    $schema_graph[] = [
        '@type' => 'WebPage',
        '@id' => $tool_url . '#webpage',
        'url' => $tool_url,
        'name' => $title . ' - Free Online Tool',
        'description' => $excerpt,
        'isPartOf' => ['@id' => 'https://toolacadmy.com/#website'],
        'breadcrumb' => ['@id' => $tool_url . '#breadcrumb'],
        'dateModified' => get_the_modified_date('c', $post_id),
        'datePublished' => get_the_date('c', $post_id),
        'inLanguage' => 'en-US',
        'potentialAction' => ['@type' => 'UseAction', 'target' => $tool_url],
    ];

    /* 2. SoftwareApplication */
    $feature_list = [];
    foreach ($features as $f) {
        $feature_list[] = ($f['title'] ?? '') . ': ' . ($f['desc'] ?? '');
    }
    $schema_graph[] = [
        '@type' => 'SoftwareApplication',
        '@id' => $tool_url . '#software',
        'name' => $title,
        'description' => $excerpt,
        'url' => $tool_url,
        'applicationCategory' => 'WebApplication',
        'applicationSubCategory' => $cat_name,
        'operatingSystem' => 'Web Browser',
        'offers' => [
            '@type' => 'Offer',
            'price' => '0',
            'priceCurrency' => 'USD',
            'availability' => 'https://schema.org/InStock',
        ],
        'featureList' => $feature_list ?: ['Free to use', 'No signup required', 'Browser-based', 'Privacy-first'],
        'isAccessibleForFree' => true,
        'browserRequirements' => 'Requires JavaScript. Works in Chrome, Firefox, Safari, Edge.',
        'provider' => ['@id' => 'https://toolacadmy.com/#organization'],
    ];

    /* 3. HowTo */
    if (!empty($steps)) {
        $how_to_steps = [];
        foreach ($steps as $i => $step) {
            $how_to_steps[] = [
                '@type' => 'HowToStep',
                'position' => $i + 1,
                'name' => $step['step'] ?? '',
                'text' => $step['desc'] ?? '',
            ];
        }
        $schema_graph[] = [
            '@type' => 'HowTo',
            '@id' => $tool_url . '#howto',
            'name' => 'How to Use ' . $title,
            'description' => 'Follow these steps to use the free ' . $title . ' tool.',
            'totalTime' => 'PT2M',
            'tool' => ['@type' => 'HowToTool', 'name' => 'Web Browser'],
            'supply' => ['@type' => 'HowToSupply', 'name' => 'Your file or content'],
            'step' => $how_to_steps,
        ];
    }

    /* 4. FAQPage */
    if (!empty($faqs)) {
        $faq_entities = [];
        foreach ($faqs as $faq) {
            $faq_entities[] = [
                '@type' => 'Question',
                'name' => $faq['q'] ?? '',
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $faq['a'] ?? ''],
            ];
        }
        $schema_graph[] = [
            '@type' => 'FAQPage',
            '@id' => $tool_url . '#faq',
            'mainEntity' => $faq_entities,
        ];
    }

    /* 5. BreadcrumbList */
    $crumb_items = [
        ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => home_url('/')],
        ['@type' => 'ListItem', 'position' => 2, 'name' => 'Tools', 'item' => home_url('/tools/')],
    ];
    if ($cat) {
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 3, 'name' => $cat_name, 'item' => get_term_link($cat)];
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 4, 'name' => $title, 'item' => $tool_url];
    } else {
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 3, 'name' => $title, 'item' => $tool_url];
    }
    $schema_graph[] = [
        '@type' => 'BreadcrumbList',
        '@id' => $tool_url . '#breadcrumb',
        'itemListElement' => $crumb_items,
    ];

    /* 5b. SpeakableSpecification (AEO — voice search) */
    $schema_graph[] = [
        '@type' => 'WebPage',
        '@id' => $tool_url . '#speakable',
        'speakable' => [
            '@type' => 'SpeakableSpecification',
            'cssSelector' => ['.tg-definition-box', '.tg-quick-answer', '.tg-tool-meta-bar'],
        ],
    ];

    $full_schema = [
        '@context' => 'https://schema.org',
        '@graph' => $schema_graph,
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($full_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>' . "\n";
}

/* =============================================
   HELPERS
   ============================================= */
function tg_get_the_excerpt_safe($length = 140)
{
    $excerpt = has_excerpt() ? get_the_excerpt() : wp_strip_all_tags(get_the_content());
    return wp_trim_words($excerpt, $length, '…');
}

/* =============================================
   PHASE 9 — SEO / AEO / GEO OPTIMIZATION
   ============================================= */

/* --- A3: Critical Meta Tags --- */
function tg_add_seo_meta_tags()
{
    if (is_admin())
        return;

    echo '<meta name="theme-color" content="#F97316">' . "\n";
    echo '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">' . "\n";
    echo '<meta name="googlebot" content="index,follow">' . "\n";
    echo '<meta name="bingbot" content="index,follow">' . "\n";

    if (is_singular('tg_tool')) {
        global $post;
        $title = get_the_title() . ' - Free Online Tool | Tool Acadmy';
        $desc = wp_strip_all_tags(get_the_excerpt());
        $url = get_permalink();
        $img = get_template_directory_uri() . '/assets/images/og-default.jpg';

        echo '<meta property="og:type" content="website">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($desc) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
        echo '<meta property="og:site_name" content="Tool Acadmy">' . "\n";
        echo '<meta property="og:image" content="' . esc_url($img) . '">' . "\n";
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($desc) . '">' . "\n";
        echo '<meta name="twitter:image" content="' . esc_url($img) . '">' . "\n";
    } elseif (is_front_page()) {
        $title = 'Free Online Tools for PDF, Images, AI Writing & More | Tool Acadmy';
        $desc = 'Tool Acadmy offers 150+ free online tools for PDF editing, image conversion, AI writing, video processing, file conversion and more. No signup required.';
        $img = get_template_directory_uri() . '/assets/images/og-default.jpg';

        echo '<meta property="og:type" content="website">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($desc) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url(home_url('/')) . '">' . "\n";
        echo '<meta property="og:site_name" content="Tool Acadmy">' . "\n";
        echo '<meta property="og:image" content="' . esc_url($img) . '">' . "\n";
    }
}
add_action('wp_head', 'tg_add_seo_meta_tags', 1);

/* --- A4: Performance — remove unnecessary WP head items --- */
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_shortlink_wp_head');
remove_action('wp_head', 'adjacent_posts_rel_link_wp_head', 10);
add_filter('xmlrpc_enabled', '__return_false');
add_filter('wp_lazy_loading_enabled', '__return_true');

function tg_resource_hints($hints, $relation_type)
{
    if ('dns-prefetch' === $relation_type) {
        $hints[] = '//pagead2.googlesyndication.com';
        $hints[] = '//www.google-analytics.com';
        $hints[] = '//fonts.googleapis.com';
    }
    return $hints;
}
add_filter('wp_resource_hints', 'tg_resource_hints', 10, 2);

/* --- B1: Organization + WebSite Schema --- */
function tg_organization_schema()
{
    if (is_admin())
        return;
    $schema = [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'Organization',
                '@id' => 'https://toolacadmy.com/#organization',
                'name' => 'Tool Acadmy',
                'url' => 'https://toolacadmy.com',
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => get_template_directory_uri() . '/assets/images/logo.png',
                    'width' => 200,
                    'height' => 60,
                ],
                'description' => 'Tool Acadmy provides 150+ free online tools for PDF, image, AI writing, video, file conversion and utility tasks.',
                'foundingDate' => '2025',
                'sameAs' => [
                    'https://twitter.com/toolacadmy',
                    'https://facebook.com/toolacadmy',
                    'https://linkedin.com/company/toolacadmy',
                ],
            ],
            [
                '@type' => 'WebSite',
                '@id' => 'https://toolacadmy.com/#website',
                'url' => 'https://toolacadmy.com',
                'name' => 'Tool Acadmy',
                'description' => '150+ Free Online Tools',
                'publisher' => ['@id' => 'https://toolacadmy.com/#organization'],
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => [
                        '@type' => 'EntryPoint',
                        'urlTemplate' => 'https://toolacadmy.com/tools/?s={search_term_string}',
                    ],
                    'query-input' => 'required name=search_term_string',
                ],
            ],
        ],
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>' . "\n";
}
add_action('wp_head', 'tg_organization_schema');

/* --- C1: Dynamic Meta Titles & Descriptions (RankMath filters) --- */
function tg_dynamic_meta()
{
    if (is_singular('tg_tool')) {
        $tool_name = get_the_title();
        $excerpt = wp_strip_all_tags(get_the_excerpt());
        $category = wp_get_post_terms(get_the_ID(), 'tool_category');
        $cat_name = (!empty($category) && !is_wp_error($category)) ? $category[0]->name : 'Online';

        $title = $tool_name . ' - Free Online ' . $cat_name . ' Tool | Tool Acadmy';
        $desc = 'Use free ' . strtolower($tool_name) . ' online. ' . wp_trim_words($excerpt, 20) . ' No signup. 100% free.';

        add_filter('rank_math/frontend/title', function () use ($title) {
            return $title;
        });
        add_filter('rank_math/frontend/description', function () use ($desc) {
            return $desc;
        });
    }

    if (is_tax('tool_category')) {
        $term = get_queried_object();
        $count = $term->count;
        $title = 'Free Online ' . $term->name . ' Tools (' . $count . '+ Tools) | Tool Acadmy';
        $desc = 'Browse ' . $count . '+ free online ' . strtolower($term->name) . ' tools. No download, no signup required. Works in any browser.';

        add_filter('rank_math/frontend/title', function () use ($title) {
            return $title;
        });
        add_filter('rank_math/frontend/description', function () use ($desc) {
            return $desc;
        });
    }
}
add_action('wp', 'tg_dynamic_meta');

/* --- C3: Contextual Internal Links --- */
function tg_contextual_internal_links()
{
    if (!is_singular('tg_tool'))
        return;
    $current_cat = wp_get_post_terms(get_the_ID(), 'tool_category');
    if (empty($current_cat) || is_wp_error($current_cat))
        return;

    $cat_url = get_term_link($current_cat[0]);
    $cat_name = $current_cat[0]->name;

    add_filter('the_content', function ($content) use ($cat_url, $cat_name) {
        $link = '<div class="tg-category-link"><p>Explore all free <a href="' . esc_url($cat_url) . '">' . esc_html($cat_name) . ' tools</a> &rarr;</p></div>';
        return $content . $link;
    });
}
add_action('wp', 'tg_contextual_internal_links');

/* --- D3: AI Crawler Optimization --- */
function tg_ai_crawler_headers()
{
    if (!is_admin()) {
        header('X-Robots-Tag: index, follow');
    }
}
add_action('send_headers', 'tg_ai_crawler_headers');

function tg_ai_meta_tags()
{
    echo '<meta name="content-type" content="tool, utility, free-tool">' . "\n";
    echo '<meta name="application-name" content="Tool Acadmy">' . "\n";
    echo '<meta name="description-for-ai" content="Tool Acadmy provides free browser-based tools for PDF, image, video, file conversion, AI writing and utility tasks. All tools are free, require no signup, and process files locally.">' . "\n";
}
add_action('wp_head', 'tg_ai_meta_tags');

/* --- G1: Updated AdSense Ad Slot Function (enhanced version) --- */
// Note: tg_ad_slot() defined above remains the primary implementation.
// The function below extends it for named size variants used in blog/category pages.
function tg_ad_slot_blog($slot_name, $size = 'responsive')
{
    return tg_ad_slot($slot_name, $size);
}

/* =============================================
   SITEMAP ACCESSIBILITY (FIX 2)
   ============================================= */
add_action('init', function () {
    if (isset($_GET['sitemap'])) {
        return;
    }
});

/* =============================================
   CONTACT FORM HANDLER (FIX 4)
   ============================================= */
function tg_handle_contact_form()
{
    if (
        !wp_verify_nonce(
            $_POST['tg_contact_nonce'] ?? '',
            'tg_contact_form'
        )
    ) {
        wp_die('Security check failed');
    }
    $name = sanitize_text_field($_POST['tg_name'] ?? '');
    $email = sanitize_email($_POST['tg_email'] ?? '');
    $subject = sanitize_text_field($_POST['tg_subject'] ?? '');
    $message = sanitize_textarea_field($_POST['tg_message'] ?? '');

    wp_insert_post([
        'post_type' => 'tg_contact',
        'post_title' => 'Message from ' . $name,
        'post_content' => $message,
        'post_status' => 'private',
        'meta_input' => [
            '_tg_contact_email' => $email,
            '_tg_contact_subject' => $subject,
        ],
    ]);

    wp_mail(
        get_option('admin_email'),
        '[Tool Acadmy Contact] ' . $subject . ' from ' . $name,
        "Name: $name\nEmail: $email\nSubject: $subject\n\nMessage:\n$message",
        ['From: noreply@toolacadmy.com']
    );

    wp_redirect(home_url('/contact/?sent=1'));
    exit;
}
add_action('admin_post_nopriv_tg_contact_submit', 'tg_handle_contact_form');
add_action('admin_post_tg_contact_submit', 'tg_handle_contact_form');

/* =============================================
   PART F FIX 1 — Canonical URLs
   ============================================= */
function tg_canonical_url()
{
    if (is_singular()) {
        $url = get_permalink();
    } elseif (is_tax('tool_category')) {
        $obj = get_queried_object();
        $url = $obj ? get_term_link($obj) : home_url('/tools/');
        if (is_wp_error($url))
            $url = home_url('/tools/');
    } elseif (is_home()) {
        $page_for_posts = get_option('page_for_posts');
        $url = $page_for_posts ? get_permalink($page_for_posts) : home_url('/blog/');
    } elseif (is_front_page()) {
        $url = home_url('/');
    } elseif (is_search()) {
        $url = home_url('/?s=' . rawurlencode(get_search_query()));
    } else {
        $url = home_url(sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI'] ?? '/')));
    }
    echo '<link rel="canonical" href="' . esc_url($url) . '">' . "\n";
}
add_action('wp_head', 'tg_canonical_url', 2);

/* =============================================
   PART F FIX 2 — Noindex search/archive pages
   ============================================= */
function tg_noindex_pages()
{
    if (is_search() || is_author() || is_date() || is_tag()) {
        echo '<meta name="robots" content="noindex, follow">' . "\n";
    }
}
add_action('wp_head', 'tg_noindex_pages', 2);

/* =============================================
   PART F FIX 5 — Internal linking: blog → tools
   ============================================= */
function tg_get_blog_related_tools()
{
    $cats = get_the_category();
    $map = [
        'pdf-guides' => ['merge-pdf' => 'Merge PDF', 'compress-pdf' => 'Compress PDF', 'pdf-to-jpg' => 'PDF to JPG'],
        'image-guides' => ['img-remove-bg' => 'Remove Background', 'img-compress' => 'Compress Image', 'img-resize' => 'Resize Image'],
        'ai-writing-guides' => ['grammar-fixer' => 'Grammar Checker', 'paraphraser' => 'Paraphraser', 'summarizer' => 'Text Summarizer'],
        'video-guides' => ['video-compressor' => 'Video Compressor', 'video-to-mp3' => 'Video to MP3', 'trim-video' => 'Trim Video'],
    ];
    foreach ((array) $cats as $cat) {
        if (isset($map[$cat->slug]))
            return $map[$cat->slug];
    }
    return [];
}

/* =============================================
   CATEGORY ICON HELPER
   ============================================= */
function tg_get_category_icon($slug)
{
    $icons = [
        'pdf-tools' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        'image-tools' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        'ai-tools' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
        'video-tools' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
        'file-tools' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
        'utility-tools' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>',
    ];
    return $icons[$slug] ?? $icons['pdf-tools'];
}

/* =============================================
   TOOL CARD ICON
   ============================================= */
/* Returns a colored rounded-square SVG icon for a tool card.
   Color comes from the tool category; the glyph from a keyword in the slug. */
function tg_get_tool_icon($slug = '', $category_slug = '') {
    $colors = [
        'pdf-tools'     => '#F4511E',
        'image-tools'   => '#3B82F6',
        'ai-tools'      => '#8B5CF6',
        'video-tools'   => '#EC4899',
        'file-tools'    => '#10B981',
        'utility-tools' => '#64748B',
    ];
    $color = $colors[$category_slug] ?? '#F97316';

    // Feather-style white glyph paths, keyed by an operation keyword found in the slug.
    $glyphs = [
        'merge'     => '<path d="M8 3v5l-4 4M16 3v5l4 4M12 12v9"/>',
        'split'     => '<path d="M8 21V8l-4 4M16 21V8l4 4M12 3v9"/>',
        'compress'  => '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>',
        'convert'   => '<path d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14-3M4 16a8 8 0 0014 3"/>',
        'to-'       => '<path d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14-3M4 16a8 8 0 0014 3"/>',
        'edit'      => '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
        'rotate'    => '<path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15"/>',
        'crop'      => '<path d="M6 2v14a2 2 0 002 2h14M18 22V8a2 2 0 00-2-2H2"/>',
        'resize'    => '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
        'remove'    => '<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14H6L5 6"/>',
        'watermark' => '<path d="M12 2l3 6 6 .5-4.5 4 1.5 6-6-3.5L6 18l1.5-6L3 8l6-.5z"/>',
        'sign'      => '<path d="M3 17c3 0 3-6 6-6s3 6 6 6 3-3 6-3M3 21h18"/>',
        'protect'   => '<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>',
        'lock'      => '<path d="M5 11h14v10H5zM8 11V7a4 4 0 018 0v4"/>',
        'unlock'    => '<path d="M5 11h14v10H5zM8 11V7a4 4 0 019-1"/>',
        'qr'        => '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2z"/>',
        'chart'     => '<path d="M3 3v18h18M8 17V9M13 17V5M18 17v-6"/>',
        'collage'   => '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>',
        'translate' => '<path d="M12 2a10 10 0 100 20 10 10 0 000-20M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20"/>',
        'summarize' => '<path d="M4 6h16M4 10h16M4 14h10M4 18h10"/>',
        'writer'    => '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
        'grammar'   => '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    ];
    $glyphDefaults = [
        'pdf-tools'     => '<path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7"/>',
        'image-tools'   => '<path d="M3 3h18v18H3zM3 15l5-5 4 4 3-3 6 6"/>',
        'ai-tools'      => '<path d="M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
        'video-tools'   => '<path d="M23 7l-7 5 7 5V7zM1 5h15v14H1z"/>',
        'file-tools'    => '<path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7"/>',
        'utility-tools' => '<path d="M14.7 6.3a4 4 0 01-5 5L4 17v3h3l5.7-5.7a4 4 0 015-5z"/>',
    ];

    $glyph = $glyphDefaults[$category_slug] ?? $glyphDefaults['pdf-tools'];
    foreach ($glyphs as $kw => $path) {
        if (strpos($slug, $kw) !== false) { $glyph = $path; break; }
    }

    return '<span class="tg-tool-icon" style="--tg-ic:' . esc_attr($color) . '">'
         . '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" '
         . 'stroke-linecap="round" stroke-linejoin="round" width="26" height="26">'
         . $glyph . '</svg></span>';
}

/* =============================================
   COMMENT CALLBACK
   ============================================= */
function tg_comment_callback($comment, $args, $depth)
{
    $add_below = 'comment';
    ?>
    <li <?php comment_class('tg-comment', $comment); ?> id="comment-<?php comment_ID(); ?>">
        <article class="tg-comment__body">
            <header class="tg-comment__header">
                <div class="tg-comment__avatar">
                    <?php echo get_avatar($comment, 48, '', '', ['class' => 'tg-comment__img']); ?>
                </div>
                <div class="tg-comment__meta">
                    <span class="tg-comment__author"><?php comment_author(); ?></span>
                    <time class="tg-comment__time"
                        datetime="<?php comment_date('c'); ?>"><?php comment_date('F j, Y'); ?></time>
                </div>
            </header>
            <div class="tg-comment__text"><?php comment_text(); ?></div>
            <footer class="tg-comment__actions">
                <?php comment_reply_link(array_merge($args, [
                    'add_below' => $add_below,
                    'depth' => $depth,
                    'max_depth' => $args['max_depth'],
                    'before' => '<div class="tg-comment__reply">',
                    'after' => '</div>',
                ])); ?>
            </footer>
        </article>



        <?php
}

// =============================================
// TOOL META BOXES — Admin UI for Steps/FAQs/Features
// =============================================

add_action('add_meta_boxes', 'tg_register_tool_meta_boxes');
function tg_register_tool_meta_boxes()
{
    add_meta_box(
        'tg_tool_steps',
        'How to Use Steps',
        'tg_render_steps_meta_box',
        'tg_tool',
        'normal',
        'high'
    );
    add_meta_box(
        'tg_tool_features',
        'Tool Features',
        'tg_render_features_meta_box',
        'tg_tool',
        'normal',
        'high'
    );
    add_meta_box(
        'tg_tool_faqs',
        'FAQs',
        'tg_render_faqs_meta_box',
        'tg_tool',
        'normal',
        'default'
    );
    add_meta_box(
        'tg_tool_settings',
        'Tool Settings',
        'tg_render_settings_meta_box',
        'tg_tool',
        'side',
        'high'
    );
}

// =============================================
// STEPS META BOX
// =============================================
function tg_render_steps_meta_box($post)
{
    $steps_raw = get_post_meta($post->ID, '_tg_steps', true);
    $steps = $steps_raw ? json_decode($steps_raw, true) : [];
    if (empty($steps)) {
        $steps = [
            ['step' => '', 'desc' => ''],
            ['step' => '', 'desc' => ''],
            ['step' => '', 'desc' => ''],
        ];
    }
    wp_nonce_field('tg_tool_meta_save', 'tg_tool_meta_nonce');
    $tg_intro = get_post_meta($post->ID, '_tg_intro', true);
    ?>
        <div class="tg-meta-intro"
            style="background:#f0f6fc;border:1px solid #c3d9ed;border-radius:6px;padding:12px;margin-bottom:14px;">
            <label for="tg_intro"
                style="font-weight:600;display:block;margin-bottom:4px;font-size:13px;">Intro (unique tool description)</label>
            <textarea id="tg_intro" name="tg_intro" style="width:100%;height:130px;"
                placeholder="~80–150 words of original prose about THIS specific tool. Shown in the &quot;What is …?&quot; box above the tool. Leave blank to fall back to the excerpt."><?php echo esc_textarea($tg_intro); ?></textarea>
            <p style="font-size:12px;color:#666;margin:6px 0 0;">Write unique copy for this tool (~80–150 words). Replaces the
                old templated intro so pages aren't near-duplicates.</p>
        </div>
        <style>
            .tg-meta-step {
                background: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 10px;
            }

            .tg-meta-step label {
                font-weight: 600;
                display: block;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .tg-meta-step input,
            .tg-meta-step textarea {
                width: 100%;
                margin-bottom: 8px;
            }

            .tg-meta-step textarea {
                height: 60px;
            }

            .tg-add-btn {
                background: #F97316;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }

            .tg-remove-btn {
                background: #ef4444;
                color: white;
                border: none;
                padding: 4px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                float: right;
            }
        </style>
        <div id="tg-steps-wrap">
            <?php foreach ($steps as $i => $step): ?>
                <div class="tg-meta-step">
                    <button type="button" class="tg-remove-btn" onclick="this.parentNode.remove()">Remove</button>
                    <label>Step Title</label>
                    <input type="text" name="tg_steps[<?php echo $i; ?>][step]"
                        value="<?php echo esc_attr($step['step'] ?? ''); ?>" placeholder="e.g. Upload your file" />
                    <label>Step Description</label>
                    <textarea name="tg_steps[<?php echo $i; ?>][desc]"
                        placeholder="Describe this step..."><?php echo esc_textarea($step['desc'] ?? ''); ?></textarea>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="tg-add-btn" onclick="tgAddStep()">+ Add Step</button>
        <script>
            var tgStepCount = <?php echo count($steps); ?>;
            function tgAddStep() {
                tgStepCount++;
                var wrap = document.getElementById('tg-steps-wrap');
                var div = document.createElement('div');
                div.className = 'tg-meta-step';
                div.innerHTML =
                    '<button type="button" class="tg-remove-btn" onclick="this.parentNode.remove()">Remove</button>' +
                    '<label>Step Title</label>' +
                    '<input type="text" name="tg_steps[' + tgStepCount + '][step]" placeholder="e.g. Upload your file"/>' +
                    '<label>Step Description</label>' +
                    '<textarea name="tg_steps[' + tgStepCount + '][desc]" placeholder="Describe this step..."></textarea>';
                wrap.appendChild(div);
            }
        </script>
        <?php
}

// =============================================
// FEATURES META BOX
// =============================================
function tg_render_features_meta_box($post)
{
    $features_raw = get_post_meta($post->ID, '_tg_features', true);
    $features = $features_raw ? json_decode($features_raw, true) : [];
    if (empty($features)) {
        $features = [
            ['icon' => '', 'title' => '', 'desc' => ''],
            ['icon' => '', 'title' => '', 'desc' => ''],
            ['icon' => '', 'title' => '', 'desc' => ''],
        ];
    }
    ?>
        <style>
            .tg-meta-feature {
                background: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 10px;
            }

            .tg-meta-feature label {
                font-weight: 600;
                display: block;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .tg-meta-feature input,
            .tg-meta-feature textarea {
                width: 100%;
                margin-bottom: 8px;
            }

            .tg-meta-feature textarea {
                height: 60px;
            }
        </style>
        <p style="color:#666;font-size:12px;margin-bottom:10px;">
            Icon field accepts Lucide icon names e.g: <strong>shield, zap, download, eye, lock, file, image, star,
                check</strong>
        </p>
        <div id="tg-features-wrap">
            <?php foreach ($features as $i => $feature): ?>
                <div class="tg-meta-feature">
                    <button type="button" class="tg-remove-btn" onclick="this.parentNode.remove()">Remove</button>
                    <label>Icon Name</label>
                    <input type="text" name="tg_features[<?php echo $i; ?>][icon]"
                        value="<?php echo esc_attr($feature['icon'] ?? ''); ?>" placeholder="e.g. shield, zap, download, eye" />
                    <label>Feature Title</label>
                    <input type="text" name="tg_features[<?php echo $i; ?>][title]"
                        value="<?php echo esc_attr($feature['title'] ?? ''); ?>" placeholder="e.g. Fast Processing" />
                    <label>Feature Description</label>
                    <textarea name="tg_features[<?php echo $i; ?>][desc]"
                        placeholder="Describe this feature..."><?php echo esc_textarea($feature['desc'] ?? ''); ?></textarea>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="tg-add-btn" onclick="tgAddFeature()">+ Add Feature</button>
        <script>
            var tgFeatureCount = <?php echo count($features); ?>;
            function tgAddFeature() {
                tgFeatureCount++;
                var wrap = document.getElementById('tg-features-wrap');
                var div = document.createElement('div');
                div.className = 'tg-meta-feature';
                div.innerHTML =
                    '<button type="button" class="tg-remove-btn" onclick="this.parentNode.remove()">Remove</button>' +
                    '<label>Icon Name</label>' +
                    '<input type="text" name="tg_features[' + tgFeatureCount + '][icon]" placeholder="e.g. shield, zap, download"/>' +
                    '<label>Feature Title</label>' +
                    '<input type="text" name="tg_features[' + tgFeatureCount + '][title]" placeholder="e.g. Fast Processing"/>' +
                    '<label>Feature Description</label>' +
                    '<textarea name="tg_features[' + tgFeatureCount + '][desc]" placeholder="Describe this feature..."></textarea>';
                wrap.appendChild(div);
            }
        </script>
        <?php
}

// =============================================
// FAQs META BOX
// =============================================
function tg_render_faqs_meta_box($post)
{
    $faqs_raw = get_post_meta($post->ID, '_tg_faqs', true);
    $faqs = $faqs_raw ? json_decode($faqs_raw, true) : [];
    if (empty($faqs)) {
        $faqs = [
            ['q' => '', 'a' => ''],
            ['q' => '', 'a' => ''],
        ];
    }
    ?>
        <div id="tg-faqs-wrap">
            <?php foreach ($faqs as $i => $faq): ?>
                <div class="tg-meta-step">
                    <button type="button" class="tg-remove-btn" onclick="this.parentNode.remove()">Remove</button>
                    <label>Question</label>
                    <input type="text" name="tg_faqs[<?php echo $i; ?>][q]" value="<?php echo esc_attr($faq['q'] ?? ''); ?>"
                        placeholder="e.g. Is this tool free?" />
                    <label>Answer</label>
                    <textarea name="tg_faqs[<?php echo $i; ?>][a]"
                        placeholder="Answer this question..."><?php echo esc_textarea($faq['a'] ?? ''); ?></textarea>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="tg-add-btn" onclick="tgAddFaq()">+ Add FAQ</button>
        <script>
            var tgFaqCount = <?php echo count($faqs); ?>;
            function tgAddFaq() {
                tgFaqCount++;
                var wrap = document.getElementById('tg-faqs-wrap');
                var div = document.createElement('div');
                div.className = 'tg-meta-step';
                div.innerHTML =
                    '<button type="button" class="tg-remove-btn" onclick="this.parentNode.remove()">Remove</button>' +
                    '<label>Question</label>' +
                    '<input type="text" name="tg_faqs[' + tgFaqCount + '][q]" placeholder="e.g. Is this tool free?"/>' +
                    '<label>Answer</label>' +
                    '<textarea name="tg_faqs[' + tgFaqCount + '][a]" placeholder="Answer this question..."></textarea>';
                wrap.appendChild(div);
            }
        </script>
        <?php
}

// =============================================
// TOOL SETTINGS META BOX (sidebar)
// =============================================
function tg_render_settings_meta_box($post)
{
    $handler = get_post_meta($post->ID, '_tg_handler', true);
    $action_label = get_post_meta($post->ID, '_tg_action_label', true);
    $accept_types = get_post_meta($post->ID, '_tg_accept_types', true);
    ?>
        <table class="form-table" style="font-size:13px;">
            <tr>
                <td><label><strong>Handler Key</strong></label></td>
                <td><input type="text" name="tg_handler" value="<?php echo esc_attr($handler); ?>" style="width:100%"
                        placeholder="e.g. merge-pdf" /></td>
            </tr>
            <tr>
                <td><label><strong>Button Label</strong></label></td>
                <td><input type="text" name="tg_action_label" value="<?php echo esc_attr($action_label); ?>"
                        style="width:100%" placeholder="e.g. Merge PDFs" /></td>
            </tr>
            <tr>
                <td><label><strong>Accept File Types</strong></label></td>
                <td><input type="text" name="tg_accept_types" value="<?php echo esc_attr($accept_types); ?>"
                        style="width:100%" placeholder="e.g. .pdf,.doc" /></td>
            </tr>
        </table>
        <?php
}

// =============================================
// SAVE ALL META BOX DATA
// =============================================
add_action('save_post_tg_tool', 'tg_save_tool_meta_boxes');
function tg_save_tool_meta_boxes($post_id)
{
    // Security checks
    if (!isset($_POST['tg_tool_meta_nonce']))
        return;
    if (!wp_verify_nonce($_POST['tg_tool_meta_nonce'], 'tg_tool_meta_save'))
        return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
        return;
    if (!current_user_can('edit_post', $post_id))
        return;

    // Save Intro (unique per-tool description)
    if (isset($_POST['tg_intro'])) {
        update_post_meta(
            $post_id,
            '_tg_intro',
            wp_kses_post(wp_unslash($_POST['tg_intro']))
        );
    }

    // Save Steps
    if (isset($_POST['tg_steps']) && is_array($_POST['tg_steps'])) {
        $steps = [];
        foreach ($_POST['tg_steps'] as $step) {
            $s = sanitize_text_field($step['step'] ?? '');
            $d = sanitize_textarea_field($step['desc'] ?? '');
            if ($s || $d) {
                $steps[] = ['step' => $s, 'desc' => $d];
            }
        }
        update_post_meta(
            $post_id,
            '_tg_steps',
            wp_json_encode($steps)
        );
    }

    // Save Features
    if (isset($_POST['tg_features']) && is_array($_POST['tg_features'])) {
        $features = [];
        foreach ($_POST['tg_features'] as $feature) {
            $icon = sanitize_text_field($feature['icon'] ?? '');
            $title = sanitize_text_field($feature['title'] ?? '');
            $desc = sanitize_textarea_field($feature['desc'] ?? '');
            if ($title || $desc) {
                $features[] = [
                    'icon' => $icon,
                    'title' => $title,
                    'desc' => $desc,
                ];
            }
        }
        update_post_meta(
            $post_id,
            '_tg_features',
            wp_json_encode($features)
        );
    }

    // Save FAQs
    if (isset($_POST['tg_faqs']) && is_array($_POST['tg_faqs'])) {
        $faqs = [];
        foreach ($_POST['tg_faqs'] as $faq) {
            $q = sanitize_text_field($faq['q'] ?? '');
            $a = sanitize_textarea_field($faq['a'] ?? '');
            if ($q || $a) {
                $faqs[] = ['q' => $q, 'a' => $a];
            }
        }
        update_post_meta(
            $post_id,
            '_tg_faqs',
            wp_json_encode($faqs)
        );
    }

    // Save Tool Settings
    if (isset($_POST['tg_handler'])) {
        update_post_meta(
            $post_id,
            '_tg_handler',
            sanitize_text_field($_POST['tg_handler'])
        );
    }
    if (isset($_POST['tg_action_label'])) {
        update_post_meta(
            $post_id,
            '_tg_action_label',
            sanitize_text_field($_POST['tg_action_label'])
        );
    }
    if (isset($_POST['tg_accept_types'])) {
        update_post_meta(
            $post_id,
            '_tg_accept_types',
            sanitize_text_field($_POST['tg_accept_types'])
        );
    }
}

/* Sync required tool meta on every environment (laptop, production).
   Runs once per $seed_version — bump it whenever this list changes. */
add_action('init', 'tg_sync_tool_meta_defaults', 20);
function tg_sync_tool_meta_defaults() {
    $seed_version = '2026-07-15a';
    if (get_option('tg_tool_meta_seed') === $seed_version) return;

    $map = [
        'img-qr'         => ['_tg_tool_type' => 'data-input'],
        'img-chart'      => ['_tg_tool_type' => 'data-input'],
        'base64-encoder' => ['_tg_tool_type' => 'data-input'],
        'base64-decoder' => ['_tg_tool_type' => 'data-input'],
        'url-encoder'    => ['_tg_tool_type' => 'data-input'],
        'hash-generator' => ['_tg_tool_type' => 'data-input'],
        'lorem-ipsum-generator' => ['_tg_tool_type' => 'data-input'],
        'password-generator'    => ['_tg_tool_type' => 'data-input'],
        'img-compress'   => ['_tg_multi_file' => 'true'],
        'img-convert'    => ['_tg_multi_file' => 'true'],
        'img-to-jpg'     => ['_tg_multi_file' => 'true'],
        'img-to-png'     => ['_tg_multi_file' => 'true'],
        'img-to-webp'    => ['_tg_multi_file' => 'true'],
        'img-to-gif'     => ['_tg_multi_file' => 'true'],
        'img-to-bmp'     => ['_tg_multi_file' => 'true'],
        'pdf-summarize'  => ['_tg_tool_type' => 'browser', '_tg_accept_types' => '.pdf'],
        'pdf-translate'  => ['_tg_tool_type' => 'browser', '_tg_accept_types' => '.pdf'],
    ];

    foreach ($map as $handler => $metas) {
        $ids = get_posts([
            'post_type'      => 'tg_tool',
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_key'       => '_tg_handler',
            'meta_value'     => $handler,
        ]);
        if (empty($ids)) continue;
        foreach ($metas as $k => $v) {
            if (get_post_meta($ids[0], $k, true) !== $v) {
                update_post_meta($ids[0], $k, $v);
            }
        }
    }
    update_option('tg_tool_meta_seed', $seed_version);
}

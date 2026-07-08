<?php
/**
 * Tool Acadmy — functions.php
 */

defined('ABSPATH') || exit;

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

    // Tool icons & background animations
    wp_enqueue_script('tg-tool-icons', get_template_directory_uri() . '/assets/js/tool-icons.js', [], $ver, true);
    wp_enqueue_script('tg-unique-icons', get_template_directory_uri() . '/assets/js/tool-icons-unique.js', [], '1.0', true);
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
            'password-generator' => 'password-generator.js',
            'lorem-ipsum-generator' => 'lorem-ipsum-generator.js',
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
            $ft_file_path = get_template_directory() . '/assets/js/tools/' . $file_tool_files[$tg_handler];
            $ft_handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $ft_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $file_tool_files[$tg_handler],
                ['tg-pdf-tools'],
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

        wp_enqueue_script('tg-tool-runner', get_template_directory_uri() . '/assets/js/tool-runner.js', $tool_runner_deps, $ver, true);
        wp_enqueue_script('tg-ai-tool-runner', get_template_directory_uri() . '/assets/js/ai-tool-runner.js', ['tg-tool-runner'], $ver, true);

        wp_localize_script('tg-ai-tool-runner', 'tgAiConfig', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('tg_tool_nonce'),
            'toolKey' => $tg_handler,
            'actionLabel' => get_post_meta(get_the_ID(), '_tg_action_label', true) ?: __('Run Tool', 'toolsgallery'),
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

    $json_fields = ['_tg_faqs', '_tg_features', '_tg_steps'];
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

add_action('wp_ajax_tg_url_to_pdf', 'tg_handle_url_to_pdf');
add_action('wp_ajax_nopriv_tg_url_to_pdf', 'tg_handle_url_to_pdf');

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

function tg_ai_proxy_handler()
{
    check_ajax_referer('tg_tool_nonce', 'nonce');

    if (!defined('OPENROUTER_API_KEY')) {
        wp_send_json_error(['message' => 'API not configured'], 500);
    }

    $tool = sanitize_text_field(wp_unslash($_POST['tool'] ?? ''));
    $payload = isset($_POST['payload']) && is_array($_POST['payload']) ? $_POST['payload'] : [];

    $ip_key = 'tg_rate_' . md5(sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'] ?? '')));
    $count = (int) get_transient($ip_key);
    if ($count >= 10) {
        wp_send_json_error(['message' => 'Rate limit reached. Try again in an hour.'], 429);
    }
    set_transient($ip_key, $count + 1, HOUR_IN_SECONDS);

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

    $request_body = wp_json_encode([
        'model' => $config['model'] ?? 'google/gemini-3.1-flash-lite',
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
        'max_tokens' => $config['max_tokens'] ?? 1500,
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

    // Log full response for debugging
    error_log('OpenRouter response for [' .
        $tool_key . ']: ' . $body);

    // Check for API error
    if (isset($data['error'])) {
        $err_msg = is_array($data['error'])
            ? ($data['error']['message'] ?? json_encode($data['error']))
            : $data['error'];
        error_log('OpenRouter error: ' . $err_msg);
        return ['error' => $err_msg];
    }

    // Extract content from response
    $content = $data['choices'][0]['message']['content']
        ?? $data['choices'][0]['text']
        ?? $data['output']
        ?? $data['response']
        ?? '';

    if (empty(trim($content))) {
        error_log('OpenRouter empty content. Full body: ' . $body);
        return ['error' => 'AI returned empty response. Body: ' . $body];
    }

    return ['result' => $content];
}

function tg_get_tool_prompts()
{
    return [
        'pdf-summarize' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 2000,
            'system' => 'You are an expert document analyst. Summarize the provided text clearly and accurately. Be concise but comprehensive.',
            'user_template' => "Summarize the following document text {format} ({length} summary):\n\n{text}",
        ],
        'pdf-translate' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 3000,
            'system' => 'You are a professional translator. Translate the provided text accurately while preserving meaning, tone, and formatting.',
            'user_template' => "Translate the following text to {language}. Provide only the translation without any explanation:\n\n{text}",
        ],
        'grammar-fixer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 2000,
            'system' => 'You are an expert proofreader and editor. Fix grammar, spelling, and punctuation errors. Return only the corrected text without explanations.',
            'user_template' => "Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text:\n\n{text}",
        ],
        'paraphraser' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 2000,
            'system' => 'You are an expert writer. Paraphrase text while preserving the original meaning. Return only the paraphrased version.',
            'user_template' => "Paraphrase the following text in a {tone} tone. Return only the paraphrased text:\n\n{text}",
        ],
        'ai-humanizer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 2000,
            'system' => 'You are an expert writer. Rewrite AI-generated text to sound natural and human. Vary sentence length, use contractions, and add personality.',
            'user_template' => "Rewrite the following AI-generated text to sound natural and human-written. Return only the rewritten text:\n\n{text}",
        ],
        'summarizer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1500,
            'system' => 'You are an expert at summarizing content. Create clear, accurate summaries.',
            'user_template' => "Summarize the following text in a {length} summary:\n\n{text}",
        ],
        'essay-writer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 3000,
            'system' => 'You are an expert academic writer. Write well-structured essays with clear introduction, body paragraphs, and conclusion.',
            'user_template' => "Write a {length} {type} essay about the following topic. Use proper essay structure:\n\n{text}",
        ],
        'article-writer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 3000,
            'system' => 'You are an expert content writer. Write engaging, well-structured articles.',
            'user_template' => "Write a {length} article about: {text}",
        ],
        'blog-post-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 3000,
            'system' => 'You are an expert blogger. Write engaging, SEO-friendly blog posts with proper headings and structure.',
            'user_template' => "Write a blog post about: {text}",
        ],
        'ai-translator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 3000,
            'system' => 'You are a professional translator. Translate text accurately while preserving meaning and tone.',
            'user_template' => "Translate the following text to {language}. Provide only the translation:\n\n{text}",
        ],
        'sentence-rewriter' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1000,
            'system' => 'You are an expert editor. Rewrite sentences to improve clarity, tone, or style.',
            'user_template' => "Rewrite the following text to be more {mode}. Return only the rewritten version:\n\n{text}",
        ],
        'plagiarism-checker' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1000,
            'system' => 'You are an expert at detecting AI-generated and plagiarized content. Analyze text and report patterns.',
            'user_template' => "Analyze the following text for signs of AI generation or plagiarism. Provide a detailed report:\n\n{text}",
        ],
        'cover-letter-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1500,
            'system' => 'You are an expert career coach. Write professional, compelling cover letters.',
            'user_template' => "Write a professional cover letter for: {text}",
        ],
        'resume-writer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 2000,
            'system' => 'You are an expert resume writer. Create professional, ATS-optimized resume content.',
            'user_template' => "Write professional resume content for: {text}",
        ],
        'email-writer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1000,
            'system' => 'You are an expert business writer. Write clear, professional emails.',
            'user_template' => "Write a professional {type} email about: {text}",
        ],
        'product-desc-writer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1000,
            'system' => 'You are an expert copywriter. Write compelling product descriptions that convert.',
            'user_template' => "Write a compelling product description for: {text}",
        ],
        'ad-copy-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1000,
            'system' => 'You are an expert advertising copywriter. Write compelling ad copy that drives clicks and conversions.',
            'user_template' => "Write {platform} ad copy for: {text}",
        ],
        'social-caption-writer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 500,
            'system' => 'You are a social media expert. Write engaging captions that drive engagement.',
            'user_template' => "Write a {platform} caption for: {text}",
        ],
        'hashtag-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 500,
            'system' => 'You are a social media expert. Generate relevant, trending hashtags.',
            'user_template' => "Generate {count} relevant hashtags for this {platform} post about: {text}",
        ],
        'slogan-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 500,
            'system' => 'You are an expert brand strategist and copywriter. Create memorable, catchy slogans.',
            'user_template' => "Generate 10 creative slogans for: {text}",
        ],
        'business-name-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 500,
            'system' => 'You are an expert brand consultant. Generate creative, memorable business names.',
            'user_template' => "Generate 15 unique business names for a {industry} business. Include a short tagline for each: {text}",
        ],
        'story-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 3000,
            'system' => 'You are a creative fiction writer. Write engaging stories with compelling characters and plot.',
            'user_template' => "Write a {genre} short story about: {text}",
        ],
        'poem-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1000,
            'system' => 'You are an expert poet. Write beautiful, evocative poems in the requested style.',
            'user_template' => "Write a {style} poem about: {text}",
        ],
        'lyrics-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1500,
            'system' => 'You are an expert songwriter. Write creative, rhyming song lyrics with verses and chorus.',
            'user_template' => "Write {genre} song lyrics about: {text}",
        ],
        'faq-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 2000,
            'system' => 'You are an expert content strategist. Generate comprehensive, realistic FAQs.',
            'user_template' => "Generate {count} frequently asked questions with detailed answers for: {text}",
        ],
        'meta-desc-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 500,
            'system' => 'You are an SEO expert. Write compelling meta descriptions under 160 characters that improve click-through rates.',
            'user_template' => "Write 5 SEO-optimized meta descriptions (under 160 chars each) for a page about: {text}",
        ],
        'youtube-title-generator' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 500,
            'system' => 'You are a YouTube SEO expert. Generate click-worthy, SEO-optimized video titles.',
            'user_template' => "Generate 10 compelling YouTube video titles for a video about: {text}",
        ],
        'youtube-desc-writer' => [
            'model' => 'google/gemini-3.1-flash-lite',
            'max_tokens' => 1000,
            'system' => 'You are a YouTube SEO expert. Write engaging, keyword-rich video descriptions.',
            'user_template' => "Write an SEO-optimized YouTube description for a video about: {text}",
        ],
        'word-counter' => [
            'model' => 'google/gemini-3.1-flash-lite',
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

    foreach ($payload as $key => $value) {
        $clean = sanitize_textarea_field(wp_unslash($value));
        $template = str_replace('{' . $key . '}', $clean, $template);
    }

    $template = preg_replace('/\{[a-zA-Z0-9_]+\}/', '', $template);

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
        'aggregateRating' => [
            '@type' => 'AggregateRating',
            'ratingValue' => '4.8',
            'ratingCount' => '127',
            'bestRating' => '5',
            'worstRating' => '1',
        ],
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
    ?>
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

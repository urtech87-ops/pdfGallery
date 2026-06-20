<?php
/**
 * ToolsGallery — functions.php
 */

defined('ABSPATH') || exit;

/* =============================================
   THEME SETUP
   ============================================= */
function tg_setup() {
    load_theme_textdomain('toolsgallery', get_template_directory() . '/languages');
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'script', 'style']);
    add_theme_support('custom-logo');
    add_theme_support('responsive-embeds');

    register_nav_menus([
        'primary-menu' => __('Primary Menu', 'toolsgallery'),
        'footer-menu'  => __('Footer Menu', 'toolsgallery'),
    ]);
}
add_action('after_setup_theme', 'tg_setup');

/* =============================================
   ENQUEUE SCRIPTS & STYLES
   ============================================= */
function tg_enqueue_assets() {
    $ver = wp_get_theme()->get('Version');

    // Google Fonts – Inter
    wp_enqueue_style(
        'tg-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        [],
        null
    );

    wp_enqueue_style('tg-main', get_template_directory_uri() . '/assets/css/main.css', ['tg-fonts'], $ver);
    wp_enqueue_script('tg-main', get_template_directory_uri() . '/assets/js/main.js', [], $ver, true);

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
            wp_enqueue_script('docxjs', 'https://unpkg.com/docx@7.8.2/build/index.umd.js', ['tg-pdf-tools'], null, true);
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

        /* Phase 3C — individual tool files */
        $tool_files_3c = [
            'pdf-to-excel'     => 'pdf-to-excel.js',
            'excel-to-pdf'     => 'excel-to-pdf.js',
            'pdf-to-ppt'       => 'pdf-to-ppt.js',
            'ppt-to-pdf'       => 'ppt-to-pdf.js',
            'pdf-to-epub'      => 'pdf-to-epub.js',
            'epub-to-pdf'      => 'epub-to-pdf.js',
            'add-signature'    => 'add-signature.js',
            'crop-pdf'         => 'crop-pdf.js',
            'remove-watermark' => 'remove-watermark.js',
            'pdf-translate'    => 'pdf-translate.js',
            'pdf-summarize'    => 'pdf-summarize.js',
            'extract-images'   => 'extract-images.js',
            'redact-pdf'       => 'redact-pdf.js',
            'url-to-pdf'       => 'url-to-pdf.js',
            'pdf-to-word'      => 'pdf-to-word.js',
            // Core PDF tools
            'merge'            => 'merge-pdf.js',
            'compress'         => 'compress-pdf.js',
            'split'            => 'split-pdf.js',
            'pdf-to-jpg'       => 'pdf-to-jpg.js',
            'jpg-to-pdf'       => 'jpg-to-pdf.js',
            'rotate-pdf'       => 'rotate-pdf.js',
            'edit-pdf'         => 'edit-pdf.js',
            'unlock-pdf'       => 'unlock-pdf.js',
            'protect-pdf'      => 'protect-pdf.js',
            'word-to-pdf'      => 'word-to-pdf.js',
            'pdf-to-png'       => 'pdf-to-png.js',
            'add-watermark'    => 'add-watermark.js',
            'add-page-numbers' => 'add-page-numbers.js',
            'extract-text'     => 'extract-text.js',
            'rearrange-pdf'    => 'rearrange-pdf.js',
        ];
        if (isset($tool_files_3c[$tg_handler])) {
            $tool_script_deps = ['tg-pdf-tools'];
            if ($tg_handler === 'pdf-to-word') {
                $tool_script_deps[] = 'docxjs';
            }
            wp_enqueue_script(
                'tg-tool-' . $tg_handler,
                get_template_directory_uri() . '/assets/js/tools/' . $tool_files_3c[$tg_handler],
                $tool_script_deps,
                $ver,
                true
            );
            $tool_runner_deps[] = 'tg-tool-' . $tg_handler;
        }

        /* html2canvas — for URL to PDF */
        if ($tg_handler === 'url-to-pdf') {
            wp_enqueue_script('html2canvas', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', ['tg-pdf-tools'], null, true);
            $tool_runner_deps[] = 'html2canvas';
        }

        /* SheetJS — for Excel tools */
        if (in_array($tg_handler, ['pdf-to-excel', 'excel-to-pdf'], true)) {
            wp_enqueue_script('sheetjs', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', ['tg-pdf-tools'], null, true);
            $tool_runner_deps[] = 'sheetjs';
        }

        /* PptxGenJS — for PPT tools */
        if (in_array($tg_handler, ['pdf-to-ppt', 'ppt-to-pdf'], true)) {
            wp_enqueue_script('pptxgenjs', 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js', ['tg-pdf-tools'], null, true);
            $tool_runner_deps[] = 'pptxgenjs';
        }

        /* =============================================
           Phase 4 — Image Tools
           ============================================= */
        $tool_files_4 = [
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
            'img-split'            => 'img-split.js',
            'img-combine'          => 'img-combine.js',
            'img-collage'          => 'img-collage.js',
            'img-round'            => 'img-round.js',
            'img-profile'          => 'img-profile.js',
            'img-pixelate'         => 'img-pixelate.js',
            'img-watermark'        => 'img-watermark.js',
            'img-meme'             => 'img-meme.js',
            'img-chart'            => 'img-chart.js',
            'img-qr'               => 'img-qr.js',
            // Format converters — dedicated files
            'img-to-jpg'           => 'img-to-jpg.js',
            'img-to-png'           => 'img-to-png.js',
            'img-to-webp'          => 'img-to-webp.js',
            'img-to-gif'           => 'img-to-gif.js',
            'img-to-bmp'           => 'img-to-bmp.js',
            'img-to-ico'           => 'img-to-ico.js',
            'img-to-svg'           => 'img-to-svg.js',
            'img-to-tiff'          => 'img-to-tiff.js',
            'img-to-avif'          => 'img-to-avif.js',
            'img-to-heic'          => 'img-to-heic.js',
        ];

        if (isset($tool_files_4[$tg_handler])) {
            $img_tool_deps = ['tg-pdf-tools'];

            /* Cropper.js — for crop and profile-photo tools */
            if (in_array($tg_handler, ['img-crop', 'img-profile'], true)) {
                wp_enqueue_style('cropperjs-css', 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css', [], null);
                wp_enqueue_script('cropperjs', 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js', [], null, true);
                $img_tool_deps[] = 'cropperjs';
            }

            /* Fabric.js — for add-text tool */
            if ($tg_handler === 'img-add-text') {
                wp_enqueue_script('fabricjs', 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js', ['tg-pdf-tools'], null, true);
                $img_tool_deps[] = 'fabricjs';
            }

            /* heic2any — for HEIC conversion */
            if (in_array($tg_handler, ['img-convert', 'img-to-heic', 'img-to-jpg', 'img-to-png', 'img-to-webp'], true)) {
                wp_enqueue_script('heic2any', 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js', [], null, true);
                $img_tool_deps[] = 'heic2any';
            }

            /* Chart.js — for chart maker */
            if ($tg_handler === 'img-chart') {
                wp_enqueue_script('chartjs', 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js', [], null, true);
                $img_tool_deps[] = 'chartjs';
            }

            /* QRCode.js — for QR code generator */
            if ($tg_handler === 'img-qr') {
                wp_enqueue_script('qrcodejs', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', [], null, true);
                $img_tool_deps[] = 'qrcodejs';
            }

            $img_script_handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $img_script_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $tool_files_4[$tg_handler],
                $img_tool_deps,
                $ver,
                true
            );
            $tool_runner_deps[] = $img_script_handle;
        }

        /* =============================================
           Phase 5 — AI Writing Tools
           ============================================= */
        $tool_files_5 = [
            'grammar-fixer'           => 'grammar-fixer.js',
            'paraphraser'             => 'paraphraser.js',
            'ai-humanizer'            => 'ai-humanizer.js',
            'summarizer'              => 'summarizer.js',
            'essay-writer'            => 'essay-writer.js',
            'article-writer'          => 'article-writer.js',
            'blog-post-generator'     => 'blog-post-generator.js',
            'ai-translator'           => 'ai-translator.js',
            'plagiarism-checker'      => 'plagiarism-checker.js',
            'sentence-rewriter'       => 'sentence-rewriter.js',
            'word-counter'            => 'word-counter.js',
            'email-writer'            => 'email-writer.js',
            'cover-letter-generator'  => 'cover-letter-generator.js',
            'resume-writer'           => 'resume-writer.js',
            'product-desc-writer'     => 'product-desc-writer.js',
            'ad-copy-generator'       => 'ad-copy-generator.js',
            'social-caption-writer'   => 'social-caption-writer.js',
            'hashtag-generator'       => 'hashtag-generator.js',
            'youtube-title-generator' => 'youtube-title-generator.js',
            'youtube-desc-writer'     => 'youtube-desc-writer.js',
            'meta-desc-generator'     => 'meta-desc-generator.js',
            'faq-generator'           => 'faq-generator.js',
            'story-generator'         => 'story-generator.js',
            'poem-generator'          => 'poem-generator.js',
            'lyrics-generator'        => 'lyrics-generator.js',
            'business-name-generator' => 'business-name-generator.js',
            'slogan-generator'        => 'slogan-generator.js',
            'password-generator'      => 'password-generator.js',
            'lorem-ipsum-generator'   => 'lorem-ipsum-generator.js',
            'tts-prep'                => 'tts-prep.js',
        ];
        if (isset($tool_files_5[$tg_handler])) {
            wp_enqueue_script(
                'tg-tool-' . $tg_handler,
                get_template_directory_uri() . '/assets/js/tools/' . $tool_files_5[$tg_handler],
                [],
                $ver,
                true
            );
        }

        /* =============================================
           Phase 6 — Video Tools (FFmpeg.wasm)
           ============================================= */
        $tool_files_6 = [
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

        if (isset($tool_files_6[$tg_handler])) {
            // FFmpeg.wasm — loaded before the tool file
            wp_enqueue_script(
                'ffmpeg-wasm',
                'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js',
                [],
                null,
                true
            );
            wp_enqueue_script(
                'ffmpeg-util',
                'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js',
                ['ffmpeg-wasm'],
                null,
                true
            );
            // Expose globals expected by tool files
            wp_add_inline_script('ffmpeg-util', 'window.FFmpegWASM=FFmpegWASM;window.FFmpegUtil=FFmpegUtil;', 'after');

            wp_enqueue_script(
                'tg-tool-' . $tg_handler,
                get_template_directory_uri() . '/assets/js/tools/' . $tool_files_6[$tg_handler],
                ['ffmpeg-util'],
                $ver,
                true
            );
            $tool_runner_deps[] = 'tg-tool-' . $tg_handler;
        }

        wp_enqueue_script('tg-tool-runner', get_template_directory_uri() . '/assets/js/tool-runner.js', $tool_runner_deps, $ver, true);
        wp_enqueue_script('tg-ai-tool-runner', get_template_directory_uri() . '/assets/js/ai-tool-runner.js', ['tg-tool-runner'], $ver, true);

        wp_localize_script('tg-ai-tool-runner', 'tgAiConfig', [
            'ajaxUrl'     => admin_url('admin-ajax.php'),
            'nonce'       => wp_create_nonce('tg_tool_nonce'),
            'toolKey'     => $tg_handler,
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
   CORS headers required by FFmpeg.wasm
   (SharedArrayBuffer needs COOP + COEP)
   ============================================= */
add_action('send_headers', function () {
    if (!is_singular('tg_tool')) return;
    $handler = get_post_meta(get_the_ID(), '_tg_handler', true);
    if (!$handler) return;
    $is_vid = str_starts_with($handler, 'vid-') || $handler === 'gif-to-vid';
    if (!$is_vid) return;
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Cross-Origin-Embedder-Policy: require-corp');
});

/* Preconnect for Google Fonts */
function tg_preconnect_fonts() {
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
function tg_register_sidebars() {
    $args = [
        'before_widget' => '<div id="%1$s" class="tg-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="tg-widget__title">',
        'after_title'   => '</h3>',
    ];

    register_sidebar(array_merge($args, [
        'name'        => __('AdSense Leaderboard (728×90)', 'toolsgallery'),
        'id'          => 'adsense-leaderboard',
        'description' => __('728×90 banner ad area', 'toolsgallery'),
    ]));

    register_sidebar(array_merge($args, [
        'name'        => __('AdSense Rectangle (300×250)', 'toolsgallery'),
        'id'          => 'adsense-rectangle',
        'description' => __('300×250 rectangle ad area', 'toolsgallery'),
    ]));

    register_sidebar(array_merge($args, [
        'name'        => __('AdSense In-Content (Responsive)', 'toolsgallery'),
        'id'          => 'adsense-in-content',
        'description' => __('Responsive in-content ad area', 'toolsgallery'),
    ]));

    register_sidebar(array_merge($args, [
        'name'        => __('AdSense Sidebar', 'toolsgallery'),
        'id'          => 'adsense-sidebar',
        'description' => __('Sidebar ad area', 'toolsgallery'),
    ]));

    register_sidebar(array_merge($args, [
        'name'        => __('Sidebar', 'toolsgallery'),
        'id'          => 'main-sidebar',
        'description' => __('Main sidebar widget area', 'toolsgallery'),
    ]));
}
add_action('widgets_init', 'tg_register_sidebars');

/* =============================================
   CUSTOM POST TYPE: tg_tool
   ============================================= */
function tg_register_post_types() {
    register_post_type('tg_tool', [
        'labels' => [
            'name'               => __('Tools', 'toolsgallery'),
            'singular_name'      => __('Tool', 'toolsgallery'),
            'add_new'            => __('Add New Tool', 'toolsgallery'),
            'add_new_item'       => __('Add New Tool', 'toolsgallery'),
            'edit_item'          => __('Edit Tool', 'toolsgallery'),
            'new_item'           => __('New Tool', 'toolsgallery'),
            'view_item'          => __('View Tool', 'toolsgallery'),
            'search_items'       => __('Search Tools', 'toolsgallery'),
            'not_found'          => __('No tools found', 'toolsgallery'),
            'not_found_in_trash' => __('No tools found in trash', 'toolsgallery'),
            'menu_name'          => __('Tools', 'toolsgallery'),
        ],
        'public'       => true,
        'show_in_rest' => true,
        'has_archive'  => false,
        'rewrite'      => ['slug' => 'tool'],
        'supports'     => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'menu_icon'    => 'dashicons-hammer',
        'menu_position' => 5,
    ]);
}
add_action('init', 'tg_register_post_types');

/* =============================================
   TAXONOMY: tool_category
   ============================================= */
function tg_register_taxonomies() {
    register_taxonomy('tool_category', 'tg_tool', [
        'labels' => [
            'name'              => __('Tool Categories', 'toolsgallery'),
            'singular_name'     => __('Tool Category', 'toolsgallery'),
            'search_items'      => __('Search Tool Categories', 'toolsgallery'),
            'all_items'         => __('All Tool Categories', 'toolsgallery'),
            'parent_item'       => __('Parent Category', 'toolsgallery'),
            'parent_item_colon' => __('Parent Category:', 'toolsgallery'),
            'edit_item'         => __('Edit Category', 'toolsgallery'),
            'update_item'       => __('Update Category', 'toolsgallery'),
            'add_new_item'      => __('Add New Category', 'toolsgallery'),
            'new_item_name'     => __('New Category Name', 'toolsgallery'),
            'menu_name'         => __('Tool Categories', 'toolsgallery'),
        ],
        'hierarchical' => true,
        'public'       => true,
        'show_in_rest' => true,
        'rewrite'      => ['slug' => 'tools'],
    ]);
}
add_action('init', 'tg_register_taxonomies');

/* =============================================
   CUSTOM META FIELDS: tg_tool
   ============================================= */
function tg_register_meta_fields() {
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
            'single'       => true,
            'type'         => 'string',
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_text_field',
        ]);
    }

    $json_fields = ['_tg_faqs', '_tg_features', '_tg_steps'];
    foreach ($json_fields as $key) {
        register_post_meta('tg_tool', $key, [
            'single'       => true,
            'type'         => 'string',
            'show_in_rest' => true,
            'sanitize_callback' => 'wp_kses_post',
        ]);
    }

    // Phase 4 extra fields
    foreach (['_tg_input_format', '_tg_output_format'] as $key) {
        register_post_meta('tg_tool', $key, [
            'single'            => true,
            'type'              => 'string',
            'show_in_rest'      => true,
            'sanitize_callback' => 'sanitize_text_field',
        ]);
    }
}
add_action('init', 'tg_register_meta_fields');

/* =============================================
   ADSENSE HELPER
   ============================================= */
function tg_ad_slot($slot_id, $size = 'responsive') {
    $slot_id = sanitize_text_field($slot_id);
    $size    = sanitize_text_field($size);

    if (!defined('ADSENSE_PUBLISHER_ID')) {
        $dimensions = [
            'leaderboard'   => 'width:728px;height:90px',
            'rectangle'     => 'width:300px;height:250px',
            'sticky-footer' => 'width:320px;height:50px',
            'responsive'    => 'width:100%;min-height:100px',
        ];
        $dim = $dimensions[$size] ?? $dimensions['responsive'];
        return '<div class="tg-ad-placeholder" style="' . esc_attr($dim) . ';border:2px dashed var(--color-primary);display:flex;align-items:center;justify-content:center;background:var(--color-primary-light);border-radius:var(--radius-md);margin:1rem auto;" data-ad-slot="' . esc_attr($slot_id) . '"><span style="color:var(--color-primary);font-size:12px;font-weight:500;">Ad Slot: ' . esc_html($slot_id) . ' (' . esc_html($size) . ')</span></div>';
    }

    $slots     = json_decode(get_option('tg_adsense_slots', '{}'), true);
    $slot_code = $slots[$slot_id] ?? '';
    if (!$slot_code) return '';

    return '<ins class="adsbygoogle"'
        . ' style="display:block"'
        . ' data-ad-client="' . esc_attr(ADSENSE_PUBLISHER_ID) . '"'
        . ' data-ad-slot="' . esc_attr($slot_code) . '"'
        . ' data-ad-format="auto"'
        . ' data-full-width-responsive="true"></ins>'
        . '<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>';
}

/* =============================================
   BREADCRUMBS
   ============================================= */
function tg_breadcrumbs() {
    $crumbs   = [];
    $crumbs[] = ['label' => __('Home', 'toolsgallery'), 'url' => home_url('/')];

    if (is_singular('tg_tool')) {
        $crumbs[] = ['label' => __('Tools', 'toolsgallery'), 'url' => home_url('/tools/')];

        $terms = get_the_terms(get_the_ID(), 'tool_category');
        if ($terms && !is_wp_error($terms)) {
            $term     = $terms[0];
            $crumbs[] = ['label' => $term->name, 'url' => get_term_link($term)];
        }

        $crumbs[] = ['label' => get_the_title(), 'url' => ''];

    } elseif (is_page('tools') || (is_post_type_archive('tg_tool'))) {
        $crumbs[] = ['label' => __('Tools', 'toolsgallery'), 'url' => ''];

    } elseif (is_single()) {
        $crumbs[] = ['label' => __('Blog', 'toolsgallery'), 'url' => get_permalink(get_option('page_for_posts'))];

        $cats = get_the_category();
        if ($cats) {
            $crumbs[] = ['label' => $cats[0]->name, 'url' => get_category_link($cats[0]->term_id)];
        }

        $crumbs[] = ['label' => get_the_title(), 'url' => ''];

    } elseif (is_archive()) {
        $crumbs[] = ['label' => __('Blog', 'toolsgallery'), 'url' => ''];

    } elseif (is_search()) {
        $crumbs[] = ['label' => sprintf(__('Search Results for "%s"', 'toolsgallery'), get_search_query()), 'url' => ''];

    } elseif (is_page()) {
        $crumbs[] = ['label' => get_the_title(), 'url' => ''];

    } elseif (is_home()) {
        $crumbs[] = ['label' => __('Blog', 'toolsgallery'), 'url' => ''];
    }

    if (count($crumbs) < 2) return;

    // JSON-LD
    $ld_items = [];
    foreach ($crumbs as $i => $crumb) {
        $ld_items[] = [
            '@type'    => 'ListItem',
            'position' => $i + 1,
            'name'     => $crumb['label'],
            'item'     => $crumb['url'] ?: (string) get_permalink(),
        ];
    }
    $ld = [
        '@context'        => 'https://schema.org',
        '@type'           => 'BreadcrumbList',
        'itemListElement' => $ld_items,
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($ld) . '</script>' . "\n";

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
   OPENROUTER AI PROXY
   ============================================= */
add_action('wp_ajax_tg_ai_proxy', 'tg_ai_proxy_handler');
add_action('wp_ajax_nopriv_tg_ai_proxy', 'tg_ai_proxy_handler');

function tg_ai_proxy_handler() {
    check_ajax_referer('tg_tool_nonce', 'nonce');

    if (!defined('OPENROUTER_API_KEY')) {
        wp_send_json_error(['message' => 'API not configured. Add OPENROUTER_API_KEY to wp-config.php.'], 500);
    }

    $tool    = sanitize_text_field(wp_unslash($_POST['tool'] ?? ''));
    $payload = isset($_POST['payload']) && is_array($_POST['payload']) ? $_POST['payload'] : [];

    $ip_key = 'tg_rate_' . md5(sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'] ?? '')));
    $count  = (int) get_transient($ip_key);
    if ($count >= 10) {
        wp_send_json_error(['message' => 'Rate limit reached. Try again in an hour.'], 429);
    }
    set_transient($ip_key, $count + 1, HOUR_IN_SECONDS);

    $result = tg_call_openrouter($tool, $payload);

    if (isset($result['error'])) {
        wp_send_json_error(['message' => $result['error']]);
        return;
    }

    $text = $result['result'] ?? '';
    if (empty(trim($text))) {
        wp_send_json_error(['message' => 'AI returned an empty response. Please try again or rephrase your input.']);
        return;
    }

    wp_send_json_success(['result' => $text]);
}

function tg_replace_placeholders($template, $vars) {
    if (!is_array($vars)) return $template;
    foreach ($vars as $key => $value) {
        $safe_key = preg_replace('/[^a-z0-9_]/', '', strtolower((string) $key));
        if ($safe_key === '') continue;
        $template = str_replace('{' . $safe_key . '}', (string) $value, $template);
    }
    // Remove any remaining unreplaced placeholders
    $template = preg_replace('/\{[a-z0-9_]+\}/', '', $template);
    return $template;
}

function tg_call_openrouter($tool, $raw_payload) {
    $prompts = tg_get_tool_prompts();
    $config  = $prompts[$tool] ?? null;
    if (!$config) return ['error' => 'Unknown tool: ' . $tool];

    // Extract and sanitize all payload fields
    $p = function ($key, $default = '') use ($raw_payload) {
        return sanitize_text_field(wp_unslash($raw_payload[$key] ?? $default));
    };
    $pa = function ($key, $default = '') use ($raw_payload) {
        return sanitize_textarea_field(wp_unslash($raw_payload[$key] ?? $default));
    };

    $text       = $pa('text');
    $topic      = $pa('topic');
    $type       = $p('type', 'standard');
    $format     = $p('format');
    $length     = $p('length');
    $language   = $p('language', 'English');
    $tone       = $p('tone');
    $style      = $p('style');
    $mode       = $p('mode');
    $count      = $p('count', '3');
    $level      = $p('level');
    $goal       = $p('goal');
    $platform   = $p('platform');
    $genre      = $p('genre');
    $mood       = $p('mood');
    $occasion   = $p('occasion');
    $audience   = $p('audience');
    $keywords   = $p('keywords');
    $focus      = $p('focus');
    $niche      = $p('niche');
    $structure  = $p('structure');
    $rhyme      = $p('rhyme');
    $pov        = $p('pov');
    $source     = $p('source', 'Auto-detect');
    $target     = $p('target', 'English');
    $context    = $pa('context');
    $name       = $p('name');
    $company    = $p('company');
    $brand      = $p('brand');
    $product    = $p('product');
    $industry   = $p('industry');
    $market     = $p('market');
    $value      = $p('value');
    $usp        = $p('usp');
    $features   = $pa('features');
    $skills     = $pa('skills');
    $summary    = $pa('summary');
    $experience = $pa('experience');
    $education  = $p('education');
    $cta        = $p('cta');
    $sender     = $p('sender');
    $recipient  = $p('recipient');
    $premise    = $pa('premise');
    $setting    = $p('setting');
    $character  = $p('character');
    $artist     = $p('artist');
    $chapters   = $p('chapters');
    $secondary  = $p('secondary');
    $mix        = $p('mix');
    $additions  = $p('additions');
    $word_limit = $p('word_limit');
    $include    = $p('include');
    $includes   = $p('includes');
    $variations = $p('variations', '1');
    $job_title  = $p('job_title');
    $why_company = $pa('why_company');
    $title      = $p('title');
    $keyword    = $p('keyword');
    $customer   = $p('customer');
    $category   = $p('category');
    $languages  = $p('languages');
    $show_corrections_raw = $p('show_corrections');
    $keep_meaning_raw     = $p('keep_meaning');

    $show_corrections = $show_corrections_raw === 'yes'
        ? 'List all changes made after the corrected text.' : '';
    $keep_meaning = $keep_meaning_raw === 'strict'
        ? 'Keep the meaning strictly.' : 'Allow creative rewording.';
    $artist_note = $artist
        ? 'Style inspired by ' . $artist . '.' : '';
    $cta_instruction = $cta
        ? 'End with CTA: ' . $cta : '';

    // Build comprehensive vars map for placeholder replacement
    $vars = [
        'text'             => $text,
        'topic'            => $topic ?: $text,
        'type'             => $type,
        'format'           => $format ?: $type,
        'length'           => $length,
        'language'         => $language,
        'tone'             => $tone,
        'style'            => $style,
        'mode'             => $mode,
        'count'            => $count,
        'level'            => $level,
        'goal'             => $goal,
        'platform'         => $platform,
        'genre'            => $genre,
        'mood'             => $mood,
        'occasion'         => $occasion,
        'audience'         => $audience,
        'keywords'         => $keywords,
        'keyword'          => $keyword ?: $keywords,
        'focus'            => $focus,
        'niche'            => $niche,
        'structure'        => $structure,
        'rhyme'            => $rhyme,
        'pov'              => $pov,
        'source'           => $source,
        'target'           => $target,
        'context'          => $context,
        'name'             => $name,
        'company'          => $company,
        'brand'            => $brand,
        'product'          => $product,
        'industry'         => $industry,
        'market'           => $market,
        'value'            => $value,
        'usp'              => $usp,
        'features'         => $features,
        'skills'           => $skills,
        'summary'          => $summary,
        'experience'       => $experience,
        'education'        => $education,
        'cta'              => $cta,
        'cta_instruction'  => $cta_instruction,
        'sender'           => $sender,
        'recipient'        => $recipient,
        'premise'          => $premise ?: $text,
        'setting'          => $setting,
        'character'        => $character,
        'artist_note'      => $artist_note,
        'chapters'         => $chapters,
        'secondary'        => $secondary,
        'mix'              => $mix,
        'show_corrections' => $show_corrections,
        'additions'        => $additions,
        'keep_meaning'     => $keep_meaning,
        'word_limit'       => $word_limit,
        'include'          => $include ?: $includes,
        'includes'         => $includes ?: $include,
        'variations'       => $variations,
        // Alias fields used by specific prompts
        'job_title'        => $job_title ?: $topic,
        'why_company'      => $why_company ?: $context,
        'title'            => $title ?: $topic,
        'customer'         => $customer ?: $audience,
        'category'         => $category,
        'languages'        => $languages,
        'preserve_formatting' => '',
    ];

    $main_input = $text ?: $topic ?: $premise ?: $context ?: $job_title;
    if (empty(trim($main_input))) {
        return ['error' => 'Please enter some text or topic first.'];
    }

    $system = tg_replace_placeholders($config['system'] ?? '', $vars);
    $user   = tg_replace_placeholders($config['user_template'] ?? '{text}', $vars);

    $body = [
        'model'      => $config['model'] ?? 'google/gemini-flash-1.5',
        'messages'   => [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user',   'content' => $user],
        ],
        'max_tokens' => $config['max_tokens'] ?? 2000,
    ];

    $response = wp_remote_post('https://openrouter.ai/api/v1/chat/completions', [
        'timeout' => 60,
        'headers' => [
            'Authorization' => 'Bearer ' . OPENROUTER_API_KEY,
            'Content-Type'  => 'application/json',
            'HTTP-Referer'  => home_url(),
            'X-Title'       => 'ToolsGallery',
        ],
        'body' => wp_json_encode($body),
    ]);

    if (is_wp_error($response)) {
        return ['error' => $response->get_error_message()];
    }

    $raw  = wp_remote_retrieve_body($response);
    $data = json_decode($raw, true);

    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('OpenRouter [' . $tool . '] response: ' . substr($raw, 0, 500));
    }

    // Handle different response formats
    $result = '';
    if (isset($data['choices'][0]['message']['content'])) {
        $result = $data['choices'][0]['message']['content'];
    } elseif (isset($data['choices'][0]['text'])) {
        $result = $data['choices'][0]['text'];
    } elseif (isset($data['content'][0]['text'])) {
        $result = $data['content'][0]['text'];
    }

    if (empty(trim($result))) {
        $error_msg = $data['error']['message'] ?? 'AI returned empty response. Please try again.';
        return ['error' => $error_msg];
    }

    return ['result' => $result];
}

function tg_get_tool_prompts() {
    return [
        /* ── PDF tools (legacy) ── */
        'pdf-translate' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 4000,
            'system'        => 'You are a professional translator. Translate the provided text accurately. Preserve paragraph structure, headings, and formatting. Return only the translated text with the same structure as the input.',
            'user_template' => "Translate the following text to {language}:\n\n{text}",
        ],
        'pdf-summarize' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 2000,
            'system'        => 'You are an expert document analyst. Summarize the provided document text clearly and accurately. Format: {format}. Length: {length}. Focus on key points, main arguments, and important conclusions. Do not add information not present in the document.',
            'user_template' => "Please summarize this document:\n\n{text}",
        ],

        /* ── Phase 5: AI Writing Tools ── */
        'grammar-fixer' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 4000,
            'system'        => 'You are an expert grammar editor. Fix all grammar, spelling, punctuation and syntax errors. {level} Preserve the original meaning and voice. {show_corrections}',
            'user_template' => "Fix the grammar in this text:\n\n{text}",
        ],
        'paraphraser' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 4000,
            'system'        => 'You are an expert writer. Rewrite the provided text in a {mode} style while preserving the original meaning. Generate {count} variation(s). Make it {length}.',
            'user_template' => "Paraphrase this text:\n\n{text}",
        ],
        'ai-humanizer' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 4000,
            'system'        => 'You are an expert at making AI-generated text sound naturally human. Transform the text to sound like it was written by a real person with {style} writing style. Level: {level}. Make it feel genuine, varied and authentic. Avoid repetitive sentence structures. {additions}',
            'user_template' => "Humanize this text:\n\n{text}",
        ],
        'summarizer' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 3000,
            'system'        => 'You are an expert at summarizing documents. Create a {type} summary focusing on {focus}. Output in {language}.',
            'user_template' => "Summarize this:\n\n{text}",
        ],
        'essay-writer' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 6000,
            'system'        => 'You are an expert essay writer. Write a {type} essay at {level} level. Target length: ~{length} words. Use {tone} tone. Structure: {structure}. Write clearly, coherently and with strong arguments.',
            'user_template' => "Write an essay about: {topic}",
        ],
        'article-writer' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 6000,
            'system'        => 'You are an expert content writer specializing in {type}. Write for {audience}. Target: ~{length} words. Tone: {tone}. Include: {includes}. Use proper headings (##) for structure. If keywords provided, naturally include them.',
            'user_template' => "Write an article about: {topic}\nKeywords: {keywords}",
        ],
        'blog-post-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 6000,
            'system'        => 'You are an expert blog writer for the {niche} niche. Write engaging, SEO-friendly content in {style} style. Include proper H2/H3 headings. Naturally use provided keywords. {cta_instruction} End with meta description if requested.',
            'user_template' => "Write a blog post about: {topic}\nKeywords: {keywords}",
        ],
        'ai-translator' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 4000,
            'system'        => 'You are a professional translator. Translate accurately from {source} to {target}. Use {tone} tone. {preserve_formatting} Return only the translation, nothing else.',
            'user_template' => "{text}",
        ],
        'plagiarism-checker' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 2000,
            'system'        => 'Analyze the provided text for: 1. Originality score (0-100): how unique is the writing 2. AI likelihood score (0-100): does it sound AI-written 3. Repeated phrases: list any phrases used 3+ times 4. Writing assessment: brief style analysis. Return ONLY valid JSON with keys: originality (number), ai_likelihood (number), repeated_phrases (array of strings), assessment (string).',
            'user_template' => "Analyze: {text}",
        ],
        'sentence-rewriter' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 3000,
            'system'        => 'You are an expert editor. Rewrite the provided text to {goal}. Generate {count} alternative version(s). {keep_meaning}',
            'user_template' => "Rewrite this:\n\n{text}",
        ],
        'email-writer' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 2000,
            'system'        => 'You are an expert at writing professional emails. Write a {type} email with {tone} tone. Length: {length}. Include: {includes}. Make it clear, concise and effective.',
            'user_template' => "Email context: {context}\nFrom: {sender}  To: {recipient}",
        ],
        'cover-letter-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 3000,
            'system'        => 'You are an expert career coach and cover letter writer. Write a compelling, personalized cover letter that stands out. {tone} tone. {length}. Include: {includes}. Make it specific, not generic.',
            'user_template' => "Job: {job_title} at {company}\nApplicant: {name}\nSkills/Experience: {skills}\nWhy this company: {why_company}",
        ],
        'resume-writer' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 4000,
            'system'        => 'You are an expert resume writer. Create a professional, ATS-friendly resume in {style} style. Use bullet points for responsibilities. Quantify achievements where possible. Format with clear sections using markdown.',
            'user_template' => "Create resume for:\nName: {name}, Title: {job_title}\nSummary: {summary}\nExperience: {experience}\nEducation: {education}\nSkills: {skills}\nLanguages: {languages}",
        ],
        'product-desc-writer' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 2000,
            'system'        => 'You are an expert e-commerce copywriter. Write a compelling {platform} product description in {tone} tone. Target: {customer}. ~{length} words. Include: {includes}. Focus on benefits not just features.',
            'user_template' => "Product: {name} ({category})\nFeatures: {features}",
        ],
        'ad-copy-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 2000,
            'system'        => 'You are an expert digital advertising copywriter. Create high-converting {platform} ad copy for {goal}. Target: {audience}. Tone: {tone}. Follow platform-specific best practices and character limits.',
            'user_template' => "Product/Service: {product}\nKey benefit: {usp}",
        ],
        'social-caption-writer' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 2000,
            'system'        => 'You are a social media expert. Write {count} {platform} caption(s) in {tone} tone. Include: {includes}. Optimize for {platform} engagement. Use platform-appropriate style.',
            'user_template' => "Post about: {topic}",
        ],
        'hashtag-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 2000,
            'system'        => 'You are a social media hashtag expert. Generate {count} {platform} hashtags for {niche} content. Mix: {mix}. Format: return ONLY the hashtags with their estimated size category. Format each line as: #hashtag [SIZE]   SIZE options: HUGE, LARGE, MEDIUM, NICHE',
            'user_template' => "Content: {topic}",
        ],
        'youtube-title-generator' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 1000,
            'system'        => 'You are a YouTube SEO expert. Generate {count} YouTube video titles for {type} content. Style: {style}. Include keywords naturally. Optimize for CTR and search. Keep under 70 chars where possible. Return numbered list only.',
            'user_template' => "Topic: {topic}\nAudience: {audience}\nKeywords: {keywords}",
        ],
        'youtube-desc-writer' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 3000,
            'system'        => 'You are a YouTube SEO expert. Write an optimized YouTube video description. Include keywords naturally in the first 150 chars (shown before "Show more"). Structure: hook, description, links section, subscribe CTA, hashtags.',
            'user_template' => "Title: {title}\nTopic: {topic}\nChannel: {niche}\nKeywords: {keywords}\nChapters: {chapters}",
        ],
        'meta-desc-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 1000,
            'system'        => 'You are an SEO expert. Write {count} meta descriptions for the given page. Each must: be 120-158 characters (ideal for Google), include the target keyword naturally, have a compelling CTA, be unique. Format: number each option, then show character count in brackets e.g. "1. Description text here [142 chars]"',
            'user_template' => "Page: {title}\nContent: {summary}\nKeyword: {keyword}\nSecondary: {secondary}\nCTA: {cta}",
        ],
        'faq-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 4000,
            'system'        => 'You are an FAQ writing expert. Generate {count} {type} FAQs for {audience} audience. Answers should be {length}. Format strictly as:\nQ: [question]\nA: [answer]\n\n(blank line between each Q&A pair)',
            'user_template' => "Topic: {topic}",
        ],
        'story-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 8000,
            'system'        => 'You are an expert creative fiction writer. Write a {genre} story approximately {length} words. POV: {pov}. Tone: {tone}. Include vivid descriptions, compelling characters and a satisfying arc. Do not summarize — write the actual story.',
            'user_template' => "Story idea: {premise}\nSetting: {setting}\nMain character: {character}",
        ],
        'poem-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 2000,
            'system'        => 'You are an expert poet. Write a {style} poem about {topic}. Mood: {mood}. Length: {length}. Occasion: {occasion}. Follow the conventions of {style} poetry strictly. Make it beautiful and emotionally resonant.',
            'user_template' => "Topic: {topic}, Occasion: {occasion}",
        ],
        'lyrics-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 3000,
            'system'        => 'You are an expert songwriter in {genre}. Write song lyrics with {mood} mood. Structure: {structure}. Rhyme scheme: {rhyme}. {artist_note} Use genre-appropriate vocabulary, rhythm and imagery. Label each section clearly (Verse 1:, Chorus:, Bridge:, etc.)',
            'user_template' => "Theme: {topic}",
        ],
        'business-name-generator' => [
            'model'         => 'openai/gpt-4o',
            'max_tokens'    => 3000,
            'system'        => 'You are a creative brand naming expert. Generate {count} unique business names for a {industry} business targeting {market}. Style: {style}. Length: {length}. For each name provide a brief tagline. Format strictly:\nNAME: [name]\nTAGLINE: [one sentence tagline]\n\n(blank line between each)',
            'user_template' => "Business: {industry}\nKeywords: {keywords}",
        ],
        'slogan-generator' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 1000,
            'system'        => 'You are an expert brand copywriter. Create {count} memorable slogans for {brand}. Tone: {tone}. Length: {length} words. Make them catchy, memorable and brand-aligned. Return ONLY the slogans, one per line, numbered.',
            'user_template' => "Brand: {brand}\nProduct/Service: {product}\nKey value: {value}",
        ],
        'password-generator' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 10,
            'system'        => 'Browser-side only tool.',
            'user_template' => "{text}",
        ],
        'lorem-ipsum-generator' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 10,
            'system'        => 'Browser-side only tool.',
            'user_template' => "{text}",
        ],
        'tts-prep' => [
            'model'         => 'google/gemini-flash-1.5',
            'max_tokens'    => 10,
            'system'        => 'Browser-side only tool.',
            'user_template' => "{text}",
        ],
    ];
}

/* =============================================
   IMAGE AI PROXY (Phase 4)
   Handles OCR, translation, colorize, etc.
   via OpenRouter vision API
   ============================================= */
add_action('wp_ajax_tg_image_ai', 'tg_image_ai_handler');
add_action('wp_ajax_nopriv_tg_image_ai', 'tg_image_ai_handler');

function tg_image_ai_handler() {
    check_ajax_referer('tg_tool_nonce', 'nonce');

    if (!defined('OPENROUTER_API_KEY')) {
        wp_send_json_error(['message' => 'API not configured'], 500);
    }

    $tool       = sanitize_text_field(wp_unslash($_POST['tool'] ?? ''));
    $image_b64  = isset($_POST['image']) ? wp_unslash($_POST['image']) : '';
    $lang       = sanitize_text_field(wp_unslash($_POST['language'] ?? 'English'));

    if (empty($image_b64)) {
        wp_send_json_error(['message' => 'No image data provided'], 400);
    }

    // Strip data URI prefix if present
    $image_b64 = preg_replace('/^data:image\/[a-z+]+;base64,/', '', $image_b64);

    $tool_configs = [
        'img-ocr' => [
            'system' => 'You are an OCR engine. Extract all text from the image exactly as it appears. Preserve line breaks and paragraph structure. Return only the extracted text with no commentary.',
            'user'   => 'Extract all text from this image.',
        ],
        'img-translate-text' => [
            'system' => 'You are an OCR engine and professional translator. First extract all text from the image, then translate it to ' . $lang . '. Return format: ORIGINAL TEXT:\n{original}\n\nTRANSLATED TEXT:\n{translation}',
            'user'   => 'Extract and translate all text in this image to ' . $lang . '.',
        ],
        'img-colorize' => [
            'system' => 'You are an image colorization AI. Describe in detail how this grayscale image should be colorized, specifying colors for each major element. Return a JSON object with key "regions" containing an array of {element, suggestedColor} objects.',
            'user'   => 'Describe how to colorize this image.',
        ],
        'img-restore' => [
            'system' => 'You are a photo restoration AI. Analyze this old or damaged photo and suggest enhancement parameters. Return a JSON object with keys: brightness (-50 to 50), contrast (-50 to 50), saturation (-50 to 50), sharpness (0 to 100), denoise (0 to 100).',
            'user'   => 'Suggest restoration parameters for this photo.',
        ],
    ];

    $config = $tool_configs[$tool] ?? null;
    if (!$config) {
        wp_send_json_error(['message' => 'Unknown image tool: ' . $tool], 400);
    }

    $body = [
        'model'   => 'google/gemini-flash-1.5',
        'messages' => [
            ['role' => 'system', 'content' => $config['system']],
            ['role' => 'user', 'content' => [
                ['type' => 'text', 'text' => $config['user']],
                ['type' => 'image_url', 'image_url' => ['url' => 'data:image/jpeg;base64,' . $image_b64]],
            ]],
        ],
        'max_tokens' => 4000,
    ];

    $ip_key = 'tg_imgai_' . md5(sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'] ?? '')));
    $count  = (int) get_transient($ip_key);
    if ($count >= 20) {
        wp_send_json_error(['message' => 'Rate limit reached. Try again in an hour.'], 429);
    }
    set_transient($ip_key, $count + 1, HOUR_IN_SECONDS);

    $response = wp_remote_post('https://openrouter.ai/api/v1/chat/completions', [
        'timeout' => 60,
        'headers' => [
            'Authorization' => 'Bearer ' . OPENROUTER_API_KEY,
            'Content-Type'  => 'application/json',
            'HTTP-Referer'  => home_url(),
            'X-Title'       => 'ToolsGallery',
        ],
        'body' => wp_json_encode($body),
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => $response->get_error_message()], 500);
    }

    $data   = json_decode(wp_remote_retrieve_body($response), true);
    $result = $data['choices'][0]['message']['content'] ?? '';
    wp_send_json_success(['result' => $result]);
}

/* =============================================
   REMOVE.BG PROXY (Phase 4)
   ============================================= */
add_action('wp_ajax_tg_removebg', 'tg_removebg_handler');
add_action('wp_ajax_nopriv_tg_removebg', 'tg_removebg_handler');

function tg_removebg_handler() {
    check_ajax_referer('tg_tool_nonce', 'nonce');

    if (!defined('REMOVEBG_API_KEY')) {
        wp_send_json_error(['message' => 'remove.bg API key not configured. Using browser-side fallback.'], 501);
    }

    if (empty($_FILES['image']['tmp_name'])) {
        wp_send_json_error(['message' => 'No image uploaded'], 400);
    }

    $tmp = $_FILES['image']['tmp_name'];
    if (!is_uploaded_file($tmp)) {
        wp_send_json_error(['message' => 'Invalid upload'], 400);
    }

    $ip_key = 'tg_rmbg_' . md5(sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'] ?? '')));
    $count  = (int) get_transient($ip_key);
    if ($count >= 5) {
        wp_send_json_error(['message' => 'Rate limit reached. Try again in an hour.'], 429);
    }
    set_transient($ip_key, $count + 1, HOUR_IN_SECONDS);

    $boundary = wp_generate_password(24, false);
    $filename  = sanitize_file_name($_FILES['image']['name'] ?? 'image.jpg');
    $mime_type = mime_content_type($tmp) ?: 'image/jpeg';
    $file_data = file_get_contents($tmp);

    $body  = "--{$boundary}\r\n";
    $body .= "Content-Disposition: form-data; name=\"image_file\"; filename=\"{$filename}\"\r\n";
    $body .= "Content-Type: {$mime_type}\r\n\r\n";
    $body .= $file_data . "\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Disposition: form-data; name=\"size\"\r\n\r\nauto\r\n";
    $body .= "--{$boundary}--\r\n";

    $response = wp_remote_post('https://api.remove.bg/v1.0/removebg', [
        'timeout' => 60,
        'headers' => [
            'X-Api-Key'    => REMOVEBG_API_KEY,
            'Content-Type' => 'multipart/form-data; boundary=' . $boundary,
        ],
        'body' => $body,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => $response->get_error_message()], 500);
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code !== 200) {
        $err = json_decode(wp_remote_retrieve_body($response), true);
        wp_send_json_error(['message' => $err['errors'][0]['title'] ?? 'remove.bg error'], $code);
    }

    $png_data = wp_remote_retrieve_body($response);
    $b64      = base64_encode($png_data);
    wp_send_json_success(['image' => 'data:image/png;base64,' . $b64]);
}

/* =============================================
   SEO JSON-LD — tool pages (Phase 2)
   ============================================= */
add_action('wp_head', 'tg_tool_json_ld', 5);
function tg_tool_json_ld() {
    if (!is_singular('tg_tool')) return;

    $post_id   = get_queried_object_id();
    $title     = get_the_title($post_id);
    $excerpt   = get_post_field('post_excerpt', $post_id);
    if (!$excerpt) {
        $excerpt = wp_trim_words(wp_strip_all_tags(get_post_field('post_content', $post_id)), 30, '…');
    }
    $faqs_raw = get_post_meta($post_id, '_tg_faqs', true);
    $faqs     = $faqs_raw ? json_decode($faqs_raw, true) : [];

    /* BreadcrumbList */
    $crumb_items = [
        ['@type' => 'ListItem', 'position' => 1, 'name' => __('Home', 'toolsgallery'),  'item' => home_url('/')],
        ['@type' => 'ListItem', 'position' => 2, 'name' => __('Tools', 'toolsgallery'), 'item' => home_url('/tools/')],
    ];
    $terms = get_the_terms($post_id, 'tool_category');
    if ($terms && !is_wp_error($terms)) {
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 3, 'name' => $terms[0]->name, 'item' => get_term_link($terms[0])];
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 4, 'name' => $title,           'item' => get_permalink($post_id)];
    } else {
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 3, 'name' => $title, 'item' => get_permalink($post_id)];
    }
    echo '<script type="application/ld+json">' . wp_json_encode([
        '@context'        => 'https://schema.org',
        '@type'           => 'BreadcrumbList',
        'itemListElement' => $crumb_items,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\n";

    /* SoftwareApplication */
    echo '<script type="application/ld+json">' . wp_json_encode([
        '@context'            => 'https://schema.org',
        '@type'               => 'SoftwareApplication',
        'name'                => $title,
        'applicationCategory' => 'UtilitiesApplication',
        'operatingSystem'     => 'Web Browser',
        'offers'              => ['@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'USD'],
        'description'         => $excerpt,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\n";

    /* FAQPage — only if FAQs are set */
    if (!empty($faqs)) {
        $entities = [];
        foreach ($faqs as $faq) {
            $entities[] = [
                '@type'          => 'Question',
                'name'           => $faq['q'] ?? '',
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $faq['a'] ?? ''],
            ];
        }
        echo '<script type="application/ld+json">' . wp_json_encode([
            '@context'   => 'https://schema.org',
            '@type'      => 'FAQPage',
            'mainEntity' => $entities,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
    }
}

/* =============================================
   URL TO PDF PROXY (Phase 3C)
   ============================================= */
add_action('wp_ajax_tg_url_to_pdf', 'tg_url_to_pdf_handler');
add_action('wp_ajax_nopriv_tg_url_to_pdf', 'tg_url_to_pdf_handler');

function tg_url_to_pdf_handler() {
    check_ajax_referer('tg_tool_nonce', 'nonce');

    $url = esc_url_raw(wp_unslash($_POST['url'] ?? ''));
    if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
        wp_send_json_error(['message' => 'Please enter a valid URL including https://']);
    }

    // Security: block private/reserved IP ranges
    $host = parse_url($url, PHP_URL_HOST);
    if (!$host) {
        wp_send_json_error(['message' => 'Invalid URL format']);
    }
    $ip = gethostbyname($host);
    if (filter_var($ip, FILTER_VALIDATE_IP, ['flags' => FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE]) === false) {
        wp_send_json_error(['message' => 'Private or internal URLs are not allowed for security reasons']);
    }

    $response = wp_remote_get($url, [
        'timeout'    => 30,
        'user-agent' => 'Mozilla/5.0 (compatible; ToolsGallery/1.0)',
        'sslverify'  => false,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Could not fetch the URL: ' . $response->get_error_message()]);
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code !== 200) {
        wp_send_json_error(['message' => 'URL returned error ' . $code . '. Please check the URL and try again.']);
    }

    $html = wp_remote_retrieve_body($response);
    wp_send_json_success(['html' => $html, 'url' => $url]);
}

/* =============================================
   HELPERS
   ============================================= */
function tg_get_the_excerpt_safe($length = 140) {
    $excerpt = has_excerpt() ? get_the_excerpt() : wp_strip_all_tags(get_the_content());
    return wp_trim_words($excerpt, $length, '…');
}

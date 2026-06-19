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
            // Format converters (reuse img-convert.js)
            'img-to-jpg'           => 'img-convert.js',
            'img-to-png'           => 'img-convert.js',
            'img-to-webp'          => 'img-convert.js',
            'img-to-gif'           => 'img-convert.js',
            'img-to-bmp'           => 'img-convert.js',
            'img-to-ico'           => 'img-convert.js',
            'img-to-svg'           => 'img-convert.js',
            'img-to-tiff'          => 'img-convert.js',
            'img-to-avif'          => 'img-convert.js',
            'img-to-heic'          => 'img-convert.js',
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
        wp_send_json_error(['message' => 'API not configured'], 500);
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
    wp_send_json_success($result);
}

function tg_call_openrouter($tool, $payload) {
    $prompts = tg_get_tool_prompts();
    $config  = $prompts[$tool] ?? null;
    if (!$config) return ['error' => 'Unknown tool'];

    $language = sanitize_text_field(wp_unslash($payload['language'] ?? 'English'));
    $format   = sanitize_text_field(wp_unslash($payload['format'] ?? 'bullet points'));
    $length   = sanitize_text_field(wp_unslash($payload['length'] ?? 'standard'));
    $system   = $config['system'] ?? '';
    $system   = str_replace('{language}', $language, $system);
    $system   = str_replace('{format}',   $format,   $system);
    $system   = str_replace('{length}',   $length,   $system);

    $body = [
        'model'      => $config['model'] ?? 'google/gemini-flash-1.5',
        'messages'   => [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user',   'content' => tg_build_user_prompt($config, $payload)],
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

    if (is_wp_error($response)) return ['error' => $response->get_error_message()];

    $data = json_decode(wp_remote_retrieve_body($response), true);
    return ['result' => $data['choices'][0]['message']['content'] ?? ''];
}

function tg_get_tool_prompts() {
    return [
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
    ];
}

function tg_build_user_prompt($config, $payload) {
    $template = $config['user_template'] ?? '{text}';
    $text     = sanitize_textarea_field(wp_unslash($payload['text'] ?? ''));
    $language = sanitize_text_field(wp_unslash($payload['language'] ?? 'English'));
    $format   = sanitize_text_field(wp_unslash($payload['format'] ?? 'bullet points'));
    $length   = sanitize_text_field(wp_unslash($payload['length'] ?? 'standard'));
    $result   = str_replace('{text}',     $text,     $template);
    $result   = str_replace('{language}', $language, $result);
    $result   = str_replace('{format}',   $format,   $result);
    $result   = str_replace('{length}',   $length,   $result);
    return $result;
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

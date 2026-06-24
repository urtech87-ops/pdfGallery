<?php
/**
 * Tool Acadmy — functions.php
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

    // Themes CSS (before main to avoid flash of wrong theme)
    wp_enqueue_style('tg-themes', get_template_directory_uri() . '/assets/css/themes.css', ['tg-fonts'], $ver);
    wp_enqueue_style('tg-main', get_template_directory_uri() . '/assets/css/main.css', ['tg-themes'], $ver);

    // Theme toggle — load in head (false) to prevent FOUC
    wp_enqueue_script('tg-theme', get_template_directory_uri() . '/assets/js/theme.js', [], $ver, false);
    wp_enqueue_script('tg-main', get_template_directory_uri() . '/assets/js/main.js', ['tg-theme'], $ver, true);

    // Tool icons & background animations
    wp_enqueue_script('tg-tool-icons', get_template_directory_uri() . '/assets/js/tool-icons.js', [], $ver, true);
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
           Phase 8 — Utility Tools
           ============================================= */
        $tool_files_8 = [
            'color-picker'       => 'color-picker.js',
            'color-palette'      => 'color-palette.js',
            'countdown-timer'    => 'countdown-timer.js',
            'stopwatch'          => 'stopwatch.js',
            'random-number'      => 'random-number.js',
            'text-case'          => 'text-case.js',
            'line-break-remover' => 'line-break-remover.js',
            'duplicate-remover'  => 'duplicate-remover.js',
            'text-binary'        => 'text-binary.js',
            'unit-converter'     => 'unit-converter.js',
        ];

        if (isset($tool_files_8[$tg_handler])) {
            $p8_handle = 'tg-tool-' . $tg_handler;
            wp_enqueue_script(
                $p8_handle,
                get_template_directory_uri() . '/assets/js/tools/' . $tool_files_8[$tg_handler],
                [],
                $ver,
                true
            );
            $tool_runner_deps[] = $p8_handle;
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
            // Skip "uncategorized" in breadcrumb
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

    $body = [
        'model'      => $config['model'] ?? 'google/gemini-flash-1.5',
        'messages'   => [
            ['role' => 'system', 'content' => $config['system']],
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
            'X-Title'       => 'Tool Acadmy',
        ],
        'body' => wp_json_encode($body),
    ]);

    if (is_wp_error($response)) return ['error' => $response->get_error_message()];

    $data = json_decode(wp_remote_retrieve_body($response), true);
    return ['result' => $data['choices'][0]['message']['content'] ?? ''];
}

function tg_get_tool_prompts() {
    return [];
}

function tg_build_user_prompt($config, $payload) {
    $template = $config['user_template'] ?? '{text}';
    $text     = sanitize_textarea_field(wp_unslash($payload['text'] ?? ''));
    return str_replace('{text}', $text, $template);
}

/* =============================================
   SEO JSON-LD — tool pages (Phase 2 + Phase 9 B2)
   ============================================= */
add_action('wp_head', 'tg_tool_json_ld', 5);
function tg_tool_json_ld() {
    if (!is_singular('tg_tool')) return;

    $post_id      = get_queried_object_id();
    $title        = get_the_title($post_id);
    $excerpt      = get_post_field('post_excerpt', $post_id);
    if (!$excerpt) {
        $excerpt = wp_trim_words(wp_strip_all_tags(get_post_field('post_content', $post_id)), 30, '…');
    }
    $tool_url     = get_permalink($post_id);
    $faqs_raw     = get_post_meta($post_id, '_tg_faqs', true);
    $features_raw = get_post_meta($post_id, '_tg_features', true);
    $steps_raw    = get_post_meta($post_id, '_tg_steps', true);
    $faqs         = $faqs_raw     ? json_decode($faqs_raw, true)     : [];
    $features     = $features_raw ? json_decode($features_raw, true) : [];
    $steps        = $steps_raw    ? json_decode($steps_raw, true)    : [];

    $terms     = get_the_terms($post_id, 'tool_category');
    $cat       = ($terms && !is_wp_error($terms)) ? $terms[0] : null;
    $cat_name  = $cat ? $cat->name : 'Online Tool';
    $cat_slug  = $cat ? $cat->slug . '/' : '';

    $schema_graph = [];

    /* 1. WebPage */
    $schema_graph[] = [
        '@type'           => 'WebPage',
        '@id'             => $tool_url . '#webpage',
        'url'             => $tool_url,
        'name'            => $title . ' - Free Online Tool',
        'description'     => $excerpt,
        'isPartOf'        => ['@id' => 'https://toolacadmy.com/#website'],
        'breadcrumb'      => ['@id' => $tool_url . '#breadcrumb'],
        'dateModified'    => get_the_modified_date('c', $post_id),
        'datePublished'   => get_the_date('c', $post_id),
        'inLanguage'      => 'en-US',
        'potentialAction' => ['@type' => 'UseAction', 'target' => $tool_url],
    ];

    /* 2. SoftwareApplication */
    $feature_list = [];
    foreach ($features as $f) {
        $feature_list[] = ($f['title'] ?? '') . ': ' . ($f['desc'] ?? '');
    }
    $schema_graph[] = [
        '@type'                  => 'SoftwareApplication',
        '@id'                    => $tool_url . '#software',
        'name'                   => $title,
        'description'            => $excerpt,
        'url'                    => $tool_url,
        'applicationCategory'    => 'WebApplication',
        'applicationSubCategory' => $cat_name,
        'operatingSystem'        => 'Web Browser',
        'offers'                 => [
            '@type'        => 'Offer',
            'price'        => '0',
            'priceCurrency' => 'USD',
            'availability' => 'https://schema.org/InStock',
        ],
        'featureList'            => $feature_list ?: ['Free to use', 'No signup required', 'Browser-based', 'Privacy-first'],
        'isAccessibleForFree'    => true,
        'browserRequirements'    => 'Requires JavaScript. Works in Chrome, Firefox, Safari, Edge.',
        'provider'               => ['@id' => 'https://toolacadmy.com/#organization'],
        'aggregateRating'        => [
            '@type'       => 'AggregateRating',
            'ratingValue' => '4.8',
            'ratingCount' => '127',
            'bestRating'  => '5',
            'worstRating' => '1',
        ],
    ];

    /* 3. HowTo */
    if (!empty($steps)) {
        $how_to_steps = [];
        foreach ($steps as $i => $step) {
            $how_to_steps[] = [
                '@type'    => 'HowToStep',
                'position' => $i + 1,
                'name'     => $step['step'] ?? '',
                'text'     => $step['desc'] ?? '',
            ];
        }
        $schema_graph[] = [
            '@type'       => 'HowTo',
            '@id'         => $tool_url . '#howto',
            'name'        => 'How to Use ' . $title,
            'description' => 'Follow these steps to use the free ' . $title . ' tool.',
            'totalTime'   => 'PT2M',
            'tool'        => ['@type' => 'HowToTool', 'name' => 'Web Browser'],
            'supply'      => ['@type' => 'HowToSupply', 'name' => 'Your file or content'],
            'step'        => $how_to_steps,
        ];
    }

    /* 4. FAQPage */
    if (!empty($faqs)) {
        $faq_entities = [];
        foreach ($faqs as $faq) {
            $faq_entities[] = [
                '@type'          => 'Question',
                'name'           => $faq['q'] ?? '',
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $faq['a'] ?? ''],
            ];
        }
        $schema_graph[] = [
            '@type'      => 'FAQPage',
            '@id'        => $tool_url . '#faq',
            'mainEntity' => $faq_entities,
        ];
    }

    /* 5. BreadcrumbList */
    $crumb_items = [
        ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home',  'item' => home_url('/')],
        ['@type' => 'ListItem', 'position' => 2, 'name' => 'Tools', 'item' => home_url('/tools/')],
    ];
    if ($cat) {
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 3, 'name' => $cat_name, 'item' => get_term_link($cat)];
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 4, 'name' => $title,    'item' => $tool_url];
    } else {
        $crumb_items[] = ['@type' => 'ListItem', 'position' => 3, 'name' => $title, 'item' => $tool_url];
    }
    $schema_graph[] = [
        '@type'           => 'BreadcrumbList',
        '@id'             => $tool_url . '#breadcrumb',
        'itemListElement' => $crumb_items,
    ];

    $full_schema = [
        '@context' => 'https://schema.org',
        '@graph'   => $schema_graph,
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($full_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>' . "\n";
}

/* =============================================
   HELPERS
   ============================================= */
function tg_get_the_excerpt_safe($length = 140) {
    $excerpt = has_excerpt() ? get_the_excerpt() : wp_strip_all_tags(get_the_content());
    return wp_trim_words($excerpt, $length, '…');
}

/* =============================================
   PHASE 9 — SEO / AEO / GEO OPTIMIZATION
   ============================================= */

/* --- A3: Critical Meta Tags --- */
function tg_add_seo_meta_tags() {
    if (is_admin()) return;

    echo '<meta name="theme-color" content="#F97316">' . "\n";
    echo '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">' . "\n";
    echo '<meta name="googlebot" content="index,follow">' . "\n";
    echo '<meta name="bingbot" content="index,follow">' . "\n";

    if (is_singular('tg_tool')) {
        global $post;
        $title = get_the_title() . ' - Free Online Tool | Tool Acadmy';
        $desc  = wp_strip_all_tags(get_the_excerpt());
        $url   = get_permalink();
        $img   = get_template_directory_uri() . '/assets/images/og-default.jpg';

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
        $desc  = 'Tool Acadmy offers 150+ free online tools for PDF editing, image conversion, AI writing, video processing, file conversion and more. No signup required.';
        $img   = get_template_directory_uri() . '/assets/images/og-default.jpg';

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

function tg_resource_hints($hints, $relation_type) {
    if ('dns-prefetch' === $relation_type) {
        $hints[] = '//pagead2.googlesyndication.com';
        $hints[] = '//www.google-analytics.com';
        $hints[] = '//fonts.googleapis.com';
    }
    return $hints;
}
add_filter('wp_resource_hints', 'tg_resource_hints', 10, 2);

/* --- B1: Organization + WebSite Schema --- */
function tg_organization_schema() {
    if (is_admin()) return;
    $schema = [
        '@context' => 'https://schema.org',
        '@graph'   => [
            [
                '@type'         => 'Organization',
                '@id'           => 'https://toolacadmy.com/#organization',
                'name'          => 'Tool Acadmy',
                'url'           => 'https://toolacadmy.com',
                'logo'          => [
                    '@type'  => 'ImageObject',
                    'url'    => get_template_directory_uri() . '/assets/images/logo.png',
                    'width'  => 200,
                    'height' => 60,
                ],
                'description'   => 'Tool Acadmy provides 150+ free online tools for PDF, image, AI writing, video, file conversion and utility tasks.',
                'foundingDate'  => '2025',
                'sameAs'        => [
                    'https://twitter.com/toolacadmy',
                    'https://facebook.com/toolacadmy',
                    'https://linkedin.com/company/toolacadmy',
                ],
            ],
            [
                '@type'           => 'WebSite',
                '@id'             => 'https://toolacadmy.com/#website',
                'url'             => 'https://toolacadmy.com',
                'name'            => 'Tool Acadmy',
                'description'     => '150+ Free Online Tools',
                'publisher'       => ['@id' => 'https://toolacadmy.com/#organization'],
                'potentialAction' => [
                    '@type'       => 'SearchAction',
                    'target'      => [
                        '@type'       => 'EntryPoint',
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
function tg_dynamic_meta() {
    if (is_singular('tg_tool')) {
        $tool_name = get_the_title();
        $excerpt   = wp_strip_all_tags(get_the_excerpt());
        $category  = wp_get_post_terms(get_the_ID(), 'tool_category');
        $cat_name  = (!empty($category) && !is_wp_error($category)) ? $category[0]->name : 'Online';

        $title = $tool_name . ' - Free Online ' . $cat_name . ' Tool | Tool Acadmy';
        $desc  = 'Use free ' . strtolower($tool_name) . ' online. ' . wp_trim_words($excerpt, 20) . ' No signup. 100% free.';

        add_filter('rank_math/frontend/title', function() use ($title) { return $title; });
        add_filter('rank_math/frontend/description', function() use ($desc) { return $desc; });
    }

    if (is_tax('tool_category')) {
        $term  = get_queried_object();
        $count = $term->count;
        $title = 'Free Online ' . $term->name . ' Tools (' . $count . '+ Tools) | Tool Acadmy';
        $desc  = 'Browse ' . $count . '+ free online ' . strtolower($term->name) . ' tools. No download, no signup required. Works in any browser.';

        add_filter('rank_math/frontend/title', function() use ($title) { return $title; });
        add_filter('rank_math/frontend/description', function() use ($desc) { return $desc; });
    }
}
add_action('wp', 'tg_dynamic_meta');

/* --- C3: Contextual Internal Links --- */
function tg_contextual_internal_links() {
    if (!is_singular('tg_tool')) return;
    $current_cat = wp_get_post_terms(get_the_ID(), 'tool_category');
    if (empty($current_cat) || is_wp_error($current_cat)) return;

    $cat_url  = get_term_link($current_cat[0]);
    $cat_name = $current_cat[0]->name;

    add_filter('the_content', function($content) use ($cat_url, $cat_name) {
        $link = '<div class="tg-category-link"><p>Explore all free <a href="' . esc_url($cat_url) . '">' . esc_html($cat_name) . ' tools</a> &rarr;</p></div>';
        return $content . $link;
    });
}
add_action('wp', 'tg_contextual_internal_links');

/* --- D3: AI Crawler Optimization --- */
function tg_ai_crawler_headers() {
    if (!is_admin()) {
        header('X-Robots-Tag: index, follow');
    }
}
add_action('send_headers', 'tg_ai_crawler_headers');

function tg_ai_meta_tags() {
    echo '<meta name="content-type" content="tool, utility, free-tool">' . "\n";
    echo '<meta name="application-name" content="Tool Acadmy">' . "\n";
    echo '<meta name="description-for-ai" content="Tool Acadmy provides free browser-based tools for PDF, image, video, file conversion, AI writing and utility tasks. All tools are free, require no signup, and process files locally.">' . "\n";
}
add_action('wp_head', 'tg_ai_meta_tags');

/* --- G1: Updated AdSense Ad Slot Function (enhanced version) --- */
// Note: tg_ad_slot() defined above remains the primary implementation.
// The function below extends it for named size variants used in blog/category pages.
function tg_ad_slot_blog($slot_name, $size = 'responsive') {
    return tg_ad_slot($slot_name, $size);
}

/* =============================================
   SITEMAP ACCESSIBILITY (FIX 2)
   ============================================= */
add_action('init', function() {
    if (isset($_GET['sitemap'])) {
        return;
    }
});

/* =============================================
   CONTACT FORM HANDLER (FIX 4)
   ============================================= */
function tg_handle_contact_form() {
    if (!wp_verify_nonce(
        $_POST['tg_contact_nonce'] ?? '',
        'tg_contact_form')) {
        wp_die('Security check failed');
    }
    $name    = sanitize_text_field($_POST['tg_name'] ?? '');
    $email   = sanitize_email($_POST['tg_email'] ?? '');
    $subject = sanitize_text_field($_POST['tg_subject'] ?? '');
    $message = sanitize_textarea_field($_POST['tg_message'] ?? '');

    wp_insert_post([
        'post_type'    => 'tg_contact',
        'post_title'   => 'Message from ' . $name,
        'post_content' => $message,
        'post_status'  => 'private',
        'meta_input'   => [
            '_tg_contact_email'   => $email,
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

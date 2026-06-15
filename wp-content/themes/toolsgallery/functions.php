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

    if (is_singular('tg_tool')) {
        wp_enqueue_style('tg-tool', get_template_directory_uri() . '/assets/css/tool.css', ['tg-main'], $ver);
        wp_enqueue_script('tg-tool-runner', get_template_directory_uri() . '/assets/js/tool-runner.js', [], $ver, true);
        wp_enqueue_script('tg-ai-tool-runner', get_template_directory_uri() . '/assets/js/ai-tool-runner.js', ['tg-tool-runner'], $ver, true);

        wp_localize_script('tg-ai-tool-runner', 'tgAiConfig', [
            'ajaxUrl'     => admin_url('admin-ajax.php'),
            'nonce'       => wp_create_nonce('tg_tool_nonce'),
            'toolKey'     => get_post_meta(get_the_ID(), '_tg_handler', true),
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
            'X-Title'       => 'ToolsGallery',
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
   HELPERS
   ============================================= */
function tg_get_the_excerpt_safe($length = 140) {
    $excerpt = has_excerpt() ? get_the_excerpt() : wp_strip_all_tags(get_the_content());
    return wp_trim_words($excerpt, $length, '…');
}

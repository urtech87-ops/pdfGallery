<?php
/**
 * Template: Tool Category Archive
 * Phase 9 B3: CollectionPage + ItemList schema
 */

$term      = get_queried_object();
$term_name = $term ? $term->name : '';
$term_url  = $term ? get_term_link($term) : home_url('/tools/');

/* Output CollectionPage + ItemList schema */
$tools = get_posts([
    'post_type'      => 'tg_tool',
    'posts_per_page' => -1,
    'tax_query'      => [[ // phpcs:ignore WordPress.DB.SlowDBQuery
        'taxonomy' => 'tool_category',
        'field'    => 'slug',
        'terms'    => $term ? $term->slug : '',
    ]],
]);

$item_list = [];
foreach ($tools as $i => $tool) {
    $item_list[] = [
        '@type'       => 'ListItem',
        'position'    => $i + 1,
        'name'        => $tool->post_title,
        'url'         => get_permalink($tool->ID),
        'description' => $tool->post_excerpt,
    ];
}

$schema = [
    '@context' => 'https://schema.org',
    '@graph'   => [
        [
            '@type'         => 'CollectionPage',
            'name'          => $term_name . ' - Free Online Tools',
            'description'   => 'Free online ' . $term_name . ' tools. No signup required.',
            'url'           => $term_url,
            'numberOfItems' => count($tools),
            'hasPart'       => array_slice($item_list, 0, 10),
        ],
        [
            '@type'           => 'ItemList',
            'name'            => $term_name . ' Tools',
            'itemListElement' => $item_list,
        ],
        [
            '@type'           => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home',  'item' => home_url('/')],
                ['@type' => 'ListItem', 'position' => 2, 'name' => 'Tools', 'item' => home_url('/tools/')],
                ['@type' => 'ListItem', 'position' => 3, 'name' => $term_name, 'item' => $term_url],
            ],
        ],
    ],
];
?>
<?php get_header(); ?>
<script>document.body.dataset.category = '<?php echo esc_js($term ? $term->slug : 'default'); ?>';</script>

<!-- Schema output -->
<script type="application/ld+json"><?php echo wp_json_encode($schema, JSON_UNESCAPED_SLASHES); ?></script>

<!-- Breadcrumb -->
<?php tg_breadcrumbs(); ?>

<div class="tg-container" style="padding-top:2rem;padding-bottom:4rem;">

  <!-- Page Header -->
  <header class="tg-archive-header">
    <h1 class="tg-archive-title"><?php echo esc_html('Free Online ' . $term_name . ' Tools'); ?></h1>
    <p class="tg-archive-desc">
      <?php printf(
          esc_html__('Browse %d free online %s tools. No download, no signup required. Works in any browser.', 'toolsgallery'),
          count($tools),
          esc_html(strtolower($term_name))
      ); ?>
    </p>
  </header>

  <!-- Tools Grid -->
  <?php if (!empty($tools)) : ?>
    <div class="tg-tools-grid">
      <?php foreach ($tools as $tool) :
        $icon = get_post_meta($tool->ID, '_tg_icon', true) ?: '🔧';
      ?>
        <a class="tg-tool-card" href="<?php echo esc_url(get_permalink($tool->ID)); ?>" data-tool-handler="<?php echo esc_attr(get_post_meta($tool->ID, '_tg_handler', true)); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo esc_html($icon); ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($tool->post_title); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html(wp_trim_words($tool->post_excerpt, 12, '…')); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  <?php else : ?>
    <p><?php esc_html_e('No tools found in this category.', 'toolsgallery'); ?></p>
  <?php endif; ?>

  <!-- Category SEO text -->
  <section class="tg-seo-content" style="margin-top:3rem;">
    <h2><?php echo esc_html('Free ' . $term_name . ' — No Signup Required'); ?></h2>
    <p>
      <?php printf(
          esc_html__('Tool Acadmy\'s free %s work entirely in your browser. No software to install, no account to create, and your files never leave your device. Fast, private, and always free.', 'toolsgallery'),
          esc_html(strtolower($term_name))
      ); ?>
    </p>
    <p><a href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('Browse all free online tools &rarr;', 'toolsgallery'); ?></a></p>
  </section>

</div>

<?php get_footer(); ?>

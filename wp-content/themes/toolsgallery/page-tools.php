<?php
/**
 * Template Name: Tools Page
 * Template for /tools/ — TinyWow-style tools directory.
 */

// Gather all tool_category terms
$tg_categories = get_terms([
    'taxonomy'   => 'tool_category',
    'hide_empty' => false,
    'orderby'    => 'name',
    'order'      => 'ASC',
]);
if (is_wp_error($tg_categories)) {
    $tg_categories = [];
}

// Build per-category tool lists and a flat array for JSON search data
$tg_sections   = [];
$tg_tools_json = [];

foreach ($tg_categories as $term) {
    $q = new WP_Query([
        'post_type'      => 'tg_tool',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
        'tax_query'      => [[
            'taxonomy' => 'tool_category',
            'field'    => 'slug',
            'terms'    => $term->slug,
        ]],
    ]);

    $all_tools = $q->posts;
    wp_reset_postdata();

    $tg_sections[$term->slug] = [
        'term'     => $term,
        'featured' => array_slice($all_tools, 0, 3),
        'others'   => array_slice($all_tools, 3),
        'all'      => $all_tools,
    ];

    foreach ($all_tools as $p) {
        $excerpt = $p->post_excerpt ?: wp_trim_words(wp_strip_all_tags($p->post_content), 20, '…');
        $tg_tools_json[] = [
            'id'       => $p->ID,
            'name'     => $p->post_title,
            'desc'     => wp_trim_words(wp_strip_all_tags($excerpt), 20, '…'),
            'url'      => get_permalink($p),
            'category' => $term->slug,
        ];
    }
}

// Generic document SVG fallback
function tg_fallback_svg() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
}

// Return SVG if meta is SVG, else fallback
function tg_tool_icon_svg($post_id) {
    $icon = get_post_meta($post_id, '_tg_icon', true);
    if ($icon && strpos(trim($icon), '<svg') === 0) {
        return $icon; // already SVG — caller must not escape
    }
    return tg_fallback_svg();
}

get_header();
?>

<!-- Tools Hero -->
<section class="tg-tools-hero" aria-labelledby="tools-hero-title">
  <div class="tg-container">
    <nav class="tg-breadcrumb tg-breadcrumb--inline" aria-label="<?php esc_attr_e('Breadcrumb', 'toolsgallery'); ?>">
      <a class="tg-breadcrumb__link" href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e('Home', 'toolsgallery'); ?></a>
      <span class="tg-breadcrumb__sep" aria-hidden="true">&rsaquo;</span>
      <span class="tg-breadcrumb__current"><?php esc_html_e('Tools', 'toolsgallery'); ?></span>
    </nav>

    <h1 class="tg-tools-hero__title" id="tools-hero-title">
      <?php esc_html_e('All Free Online Tools', 'toolsgallery'); ?>
    </h1>
    <p class="tg-tools-hero__subtitle">
      <?php esc_html_e('130+ tools for PDF, images, video, writing and more — all free, no sign-up required', 'toolsgallery'); ?>
    </p>

    <div class="tg-tools-search" role="search">
      <label for="tg-search-input" class="screen-reader-text"><?php esc_html_e('Search tools', 'toolsgallery'); ?></label>
      <div class="tg-tools-search__wrap">
        <svg class="tg-tools-search__icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          id="tg-search-input"
          class="tg-tools-search__input"
          type="search"
          placeholder="<?php esc_attr_e('Search tools…', 'toolsgallery'); ?>"
          autocomplete="off"
          spellcheck="false"
        >
      </div>
    </div>
  </div>
</section>

<!-- Ad: leaderboard -->
<div class="tg-ad-leaderboard tg-container">
  <?php echo tg_ad_slot('tools-page-leaderboard', 'leaderboard'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
</div>

<!-- Category Tabs -->
<div class="tg-tools-tabs-wrap" id="tg-tools-tabs">
  <div class="tg-container">
    <div class="tg-tools-tabs" role="tablist" aria-label="<?php esc_attr_e('Filter by category', 'toolsgallery'); ?>">
      <button
        class="tg-tools-tab is-active"
        role="tab"
        data-cat="all"
        aria-selected="true"
        aria-controls="tg-tools-sections"
      ><?php esc_html_e('All Tools', 'toolsgallery'); ?></button>
      <?php foreach ($tg_categories as $term) : ?>
      <button
        class="tg-tools-tab"
        role="tab"
        data-cat="<?php echo esc_attr($term->slug); ?>"
        aria-selected="false"
        aria-controls="tg-tools-sections"
      ><?php echo esc_html($term->name); ?></button>
      <?php endforeach; ?>
    </div>
  </div>
</div>

<!-- Search Results (hidden until search active) -->
<div id="tg-search-results" class="tg-container tg-search-results" hidden aria-live="polite">
  <p class="tg-search-results__count" id="tg-search-count"></p>
  <div class="tg-tools-grid tg-tools-grid--featured" id="tg-search-cards"></div>
  <p class="tg-search-results__empty" id="tg-search-empty" hidden></p>
</div>

<!-- Tool Sections -->
<div id="tg-tools-sections" class="tg-container tg-tools-sections">
  <?php
  $section_index = 0;
  foreach ($tg_sections as $slug => $section) :
      $term     = $section['term'];
      $featured = $section['featured'];
      $others   = $section['others'];
      $count    = count($section['all']);
      $section_index++;
  ?>
  <section
    class="tg-tools-section"
    data-category="<?php echo esc_attr($slug); ?>"
    aria-labelledby="section-<?php echo esc_attr($slug); ?>"
  >
    <div class="tg-tools-section__header">
      <h2 class="tg-tools-section__title" id="section-<?php echo esc_attr($slug); ?>">
        <?php echo esc_html($term->name); ?>
      </h2>
      <?php if ($count > 0) : ?>
      <a
        class="tg-tools-section__see-all"
        href="<?php echo esc_url(home_url('/tools/?cat=' . $slug)); ?>"
      ><?php
        /* translators: %d: number of tools in category */
        printf(esc_html__('See all %d tools →', 'toolsgallery'), $count);
      ?></a>
      <?php endif; ?>
    </div>

    <?php if (empty($section['all'])) : ?>
      <p class="tg-tools-section__empty"><em><?php esc_html_e('Tools coming soon — check back shortly.', 'toolsgallery'); ?></em></p>
    <?php else : ?>

      <?php if (!empty($featured)) : ?>
      <div class="tg-tools-grid tg-tools-grid--featured">
        <?php foreach ($featured as $post) :
          // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
          $icon_svg = tg_tool_icon_svg($post->ID);
          $excerpt  = $post->post_excerpt ?: wp_trim_words(wp_strip_all_tags($post->post_content), 20, '…');
        ?>
        <div class="tg-tool-card tg-tool-card--featured">
          <span class="tg-tool-card__badge tg-tool-card__badge--green"><?php esc_html_e('FREE', 'toolsgallery'); ?></span>
          <div class="tg-tool-card__svg" aria-hidden="true">
            <?php echo $icon_svg; // phpcs:ignore WordPress.Security.EscapeOutput — sanitized SVG or our own SVG ?>
          </div>
          <h3 class="tg-tool-card__title"><?php echo esc_html($post->post_title); ?></h3>
          <p class="tg-tool-card__desc"><?php echo esc_html(wp_trim_words(wp_strip_all_tags($excerpt), 14, '…')); ?></p>
          <a class="tg-tool-card__cta" href="<?php echo esc_url(get_permalink($post)); ?>">
            <?php esc_html_e('Use Free →', 'toolsgallery'); ?>
          </a>
        </div>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>

      <?php if (!empty($others)) : ?>
      <ul class="tg-tools-list">
        <?php foreach ($others as $post) : ?>
        <li class="tg-tools-list__item">
          <a class="tg-tools-list__link" href="<?php echo esc_url(get_permalink($post)); ?>">
            <span class="tg-tools-list__arrow" aria-hidden="true">→</span>
            <?php echo esc_html($post->post_title); ?>
          </a>
        </li>
        <?php endforeach; ?>
      </ul>
      <?php endif; ?>

    <?php endif; ?>
  </section>

  <?php if ($section_index === 2 && count($tg_sections) > 2) : ?>
  <!-- Ad: mid-page between 2nd and 3rd section -->
  <div class="tg-ad-mid">
    <?php echo tg_ad_slot('tools-page-mid', 'responsive'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
  </div>
  <?php endif; ?>

  <?php endforeach; ?>
</div><!-- .tg-tools-sections -->

<!-- JSON data for search -->
<script id="tg-tools-data">
window.TGTools = <?php echo wp_json_encode($tg_tools_json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
</script>

<?php get_footer(); ?>

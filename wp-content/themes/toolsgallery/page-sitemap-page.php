<?php
/**
 * Template Name: HTML Sitemap
 * Phase 9 F6: Dynamic sitemap of all tools by category
 */
get_header();
?>

<?php tg_breadcrumbs(); ?>

<div class="tg-container" style="padding-top:2rem;padding-bottom:4rem;">

  <h1><?php the_title(); ?></h1>
  <p><?php esc_html_e('A complete list of all free online tools available on Tool Acadmy, organized by category.', 'toolsgallery'); ?></p>

  <?php
  $categories = get_terms([
      'taxonomy'   => 'tool_category',
      'hide_empty' => false,
  ]);

  if ($categories && !is_wp_error($categories)) :
      foreach ($categories as $cat) :
          $cat_tools = get_posts([
              'post_type'      => 'tg_tool',
              'posts_per_page' => -1,
              'tax_query'      => [[ // phpcs:ignore WordPress.DB.SlowDBQuery
                  'taxonomy' => 'tool_category',
                  'field'    => 'slug',
                  'terms'    => $cat->slug,
              ]],
              'orderby' => 'title',
              'order'   => 'ASC',
          ]);
          if (empty($cat_tools)) continue;
  ?>
    <section class="tg-sitemap-section">
      <h2>
        <a href="<?php echo esc_url(get_term_link($cat)); ?>"><?php echo esc_html($cat->name); ?></a>
        <span style="font-size:0.75em;font-weight:400;color:#666;">(<?php echo count($cat_tools); ?> tools)</span>
      </h2>
      <ul class="tg-sitemap-list">
        <?php foreach ($cat_tools as $tool) : ?>
          <li>
            <a href="<?php echo esc_url(get_permalink($tool->ID)); ?>"><?php echo esc_html($tool->post_title); ?></a>
            <?php if ($tool->post_excerpt) : ?>
              &mdash; <span><?php echo esc_html(wp_trim_words($tool->post_excerpt, 10, '…')); ?></span>
            <?php endif; ?>
          </li>
        <?php endforeach; ?>
      </ul>
    </section>
  <?php
      endforeach;
  endif;
  ?>

  <!-- Static Pages -->
  <section class="tg-sitemap-section">
    <h2><?php esc_html_e('Pages', 'toolsgallery'); ?></h2>
    <ul class="tg-sitemap-list">
      <li><a href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e('Home', 'toolsgallery'); ?></a></li>
      <li><a href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('All Tools', 'toolsgallery'); ?></a></li>
      <li><a href="<?php echo esc_url(home_url('/blog/')); ?>"><?php esc_html_e('Blog', 'toolsgallery'); ?></a></li>
      <li><a href="<?php echo esc_url(home_url('/about/')); ?>"><?php esc_html_e('About', 'toolsgallery'); ?></a></li>
      <li><a href="<?php echo esc_url(home_url('/contact/')); ?>"><?php esc_html_e('Contact', 'toolsgallery'); ?></a></li>
      <li><a href="<?php echo esc_url(home_url('/privacy-policy/')); ?>"><?php esc_html_e('Privacy Policy', 'toolsgallery'); ?></a></li>
      <li><a href="<?php echo esc_url(home_url('/terms-and-conditions/')); ?>"><?php esc_html_e('Terms &amp; Conditions', 'toolsgallery'); ?></a></li>
    </ul>
  </section>

</div>

<?php get_footer(); ?>

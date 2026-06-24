<?php
/**
 * Template: Blog Listing Page (home.php)
 * Phase 9 E1: SEO blog listing with Article schema
 */
get_header();

function tg_reading_time($post_id) {
    $content    = get_post_field('post_content', $post_id);
    $word_count = str_word_count(wp_strip_all_tags($content));
    $minutes    = max(1, (int) ceil($word_count / 200));
    return $minutes;
}
?>

<?php tg_breadcrumbs(); ?>

<div class="tg-container" style="padding-top:2rem;padding-bottom:4rem;">
  <div class="tg-layout--sidebar">

    <div class="tg-layout__main">

      <header class="tg-archive-header">
        <h1 class="tg-archive-title"><?php esc_html_e('Tool Acadmy Blog &mdash; Guides, Tips &amp; Tutorials', 'toolsgallery'); ?></h1>
        <p class="tg-archive-desc"><?php esc_html_e('Free guides on PDF tools, image editing, AI writing, video conversion and more. Learn how to get the most out of our free online tools.', 'toolsgallery'); ?></p>
      </header>

      <?php if (have_posts()) : ?>

        <div class="tg-blog-grid">
          <?php while (have_posts()) : the_post(); ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class('tg-blog-card'); ?>>

              <?php if (has_post_thumbnail()) : ?>
                <a href="<?php the_permalink(); ?>" class="tg-blog-card__img-wrap">
                  <?php the_post_thumbnail('medium_large', ['class' => 'tg-blog-card__img', 'alt' => get_the_title()]); ?>
                </a>
              <?php endif; ?>

              <div class="tg-blog-card__body">

                <?php $cats = get_the_category(); if ($cats) : ?>
                  <a class="tg-blog-card__cat" href="<?php echo esc_url(get_category_link($cats[0]->term_id)); ?>">
                    <?php echo esc_html($cats[0]->name); ?>
                  </a>
                <?php endif; ?>

                <h2 class="tg-blog-card__title">
                  <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                </h2>

                <p class="tg-blog-card__excerpt">
                  <?php echo esc_html(wp_trim_words(get_the_excerpt(), 25, '…')); ?>
                </p>

                <div class="tg-blog-card__meta">
                  <span><?php echo esc_html(get_the_date()); ?></span>
                  <span><?php printf(esc_html__('%d min read', 'toolsgallery'), tg_reading_time(get_the_ID())); ?></span>
                </div>

                <a href="<?php the_permalink(); ?>" class="tg-btn tg-btn--outline tg-btn--sm">
                  <?php esc_html_e('Read More &rarr;', 'toolsgallery'); ?>
                </a>

              </div>
            </article>
          <?php endwhile; ?>
        </div>

        <!-- Pagination -->
        <div class="tg-pagination">
          <?php the_posts_pagination(['mid_size' => 2, 'prev_text' => '&larr; Newer', 'next_text' => 'Older &rarr;']); ?>
        </div>

      <?php else : ?>
        <p><?php esc_html_e('No blog posts found. Check back soon!', 'toolsgallery'); ?></p>
      <?php endif; ?>

    </div><!-- .tg-layout__main -->

    <aside class="tg-layout__sidebar">
      <div class="tg-sidebar-widget">
        <h3 class="tg-sidebar-widget__title"><?php esc_html_e('Popular Tools', 'toolsgallery'); ?></h3>
        <ul class="tg-sidebar-tools-list">
          <?php
          $pop = get_posts(['post_type' => 'tg_tool', 'posts_per_page' => 6, 'orderby' => 'menu_order', 'order' => 'ASC']);
          foreach ($pop as $pt) :
              $ic = get_post_meta($pt->ID, '_tg_icon', true) ?: '🔧';
          ?>
            <li>
              <a href="<?php echo esc_url(get_permalink($pt->ID)); ?>" class="tg-sidebar-tool-link">
                <span aria-hidden="true"><?php echo esc_html($ic); ?></span>
                <?php echo esc_html($pt->post_title); ?>
              </a>
            </li>
          <?php endforeach; ?>
        </ul>
      </div>

      <?php echo tg_ad_slot('blog-sidebar', 'rectangle'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
    </aside>

  </div>
</div>

<?php get_footer(); ?>

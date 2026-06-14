<?php get_header(); ?>

<div class="tg-page-header">
  <div class="tg-container">
    <h1 class="tg-page-header__title"><?php esc_html_e('Blog', 'toolsgallery'); ?></h1>
    <p class="tg-page-header__desc"><?php esc_html_e('Tips, guides and news about PDF and image tools.', 'toolsgallery'); ?></p>
  </div>
</div>

<div class="tg-container" style="padding-top:2.5rem;padding-bottom:4rem;">
  <div class="tg-layout--sidebar">

    <div class="tg-layout__main">
      <?php if (have_posts()) : ?>
        <div class="tg-posts-grid">
          <?php while (have_posts()) : the_post(); ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class('tg-post-card'); ?>>
              <?php if (has_post_thumbnail()) : ?>
                <div class="tg-post-card__thumb">
                  <a href="<?php the_permalink(); ?>"><?php the_post_thumbnail('medium_large'); ?></a>
                </div>
              <?php endif; ?>
              <div class="tg-post-card__body">
                <?php $cats = get_the_category(); if ($cats) : ?>
                  <a class="tg-post-card__cat" href="<?php echo esc_url(get_category_link($cats[0]->term_id)); ?>"><?php echo esc_html($cats[0]->name); ?></a>
                <?php endif; ?>
                <div class="tg-post-card__title">
                  <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                </div>
                <div class="tg-post-card__excerpt"><?php echo esc_html(tg_get_the_excerpt_safe(18)); ?></div>
                <div class="tg-post-card__meta">
                  <span><?php echo esc_html(get_the_date()); ?></span>
                  <span><?php echo esc_html(get_the_author()); ?></span>
                </div>
              </div>
            </article>
          <?php endwhile; ?>
        </div>

        <div class="tg-pagination">
          <?php echo paginate_links(['prev_text' => '&laquo;', 'next_text' => '&raquo;', 'type' => 'plain']); // phpcs:ignore WordPress.Security.EscapeOutput ?>
        </div>

      <?php else : ?>
        <p><?php esc_html_e('No posts found.', 'toolsgallery'); ?></p>
      <?php endif; ?>
    </div>

    <aside class="tg-layout__sidebar" aria-label="<?php esc_attr_e('Blog sidebar', 'toolsgallery'); ?>">
      <?php get_sidebar(); ?>
    </aside>

  </div>
</div>

<?php get_footer(); ?>

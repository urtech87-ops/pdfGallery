<?php get_header(); ?>

<div class="tg-container" style="padding-top:3rem;padding-bottom:4rem;">
  <div class="tg-layout--sidebar">

    <div class="tg-layout__main">
      <?php while (have_posts()) : the_post(); ?>

        <!-- Leaderboard Ad -->
        <?php echo tg_ad_slot('single-post-top', 'leaderboard'); // phpcs:ignore WordPress.Security.EscapeOutput ?>

        <article id="post-<?php the_ID(); ?>" <?php post_class('tg-entry'); ?>>
          <header class="tg-entry__header">
            <?php
            $cats = get_the_category();
            if ($cats) :
            ?>
              <a class="tg-entry__cat" href="<?php echo esc_url(get_category_link($cats[0]->term_id)); ?>">
                <?php echo esc_html($cats[0]->name); ?>
              </a>
            <?php endif; ?>

            <h1 class="tg-entry__title"><?php the_title(); ?></h1>

            <div class="tg-entry__meta">
              <span><?php echo esc_html(get_the_date()); ?></span>
              <span><?php printf(esc_html__('By %s', 'toolsgallery'), esc_html(get_the_author())); ?></span>
              <?php if (has_category()) : ?>
                <span><?php the_category(', '); ?></span>
              <?php endif; ?>
            </div>
          </header>

          <?php if (has_post_thumbnail()) : ?>
            <div class="tg-entry__featured-img">
              <?php the_post_thumbnail('large'); ?>
            </div>
          <?php endif; ?>

          <div class="tg-entry__content">
            <?php the_content(); ?>
            <?php
            wp_link_pages([
              'before' => '<div class="tg-page-links">' . esc_html__('Pages:', 'toolsgallery'),
              'after'  => '</div>',
            ]);
            ?>
          </div>
        </article>

        <!-- In-content Ad -->
        <?php echo tg_ad_slot('single-post-bottom', 'in-content'); // phpcs:ignore WordPress.Security.EscapeOutput ?>

        <!-- Comments -->
        <?php if (comments_open() || get_comments_number()) : ?>
          <div style="margin-top:3rem;"><?php comments_template(); ?></div>
        <?php endif; ?>

      <?php endwhile; ?>
    </div><!-- .tg-layout__main -->

    <aside class="tg-layout__sidebar" aria-label="<?php esc_attr_e('Blog sidebar', 'toolsgallery'); ?>">
      <?php get_sidebar(); ?>
    </aside>

  </div>
</div>

<?php get_footer(); ?>

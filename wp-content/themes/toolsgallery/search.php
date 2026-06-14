<?php get_header(); ?>

<div class="tg-page-header">
  <div class="tg-container">
    <h1 class="tg-page-header__title">
      <?php printf(esc_html__('Search Results for "%s"', 'toolsgallery'), '<span>' . esc_html(get_search_query()) . '</span>'); ?>
    </h1>
  </div>
</div>

<div class="tg-container" style="padding-top:2.5rem;padding-bottom:4rem;">

  <div style="margin-bottom:2.5rem;">
    <?php get_search_form(); ?>
  </div>

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
            <div class="tg-post-card__title">
              <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
            </div>
            <div class="tg-post-card__excerpt"><?php echo esc_html(tg_get_the_excerpt_safe(18)); ?></div>
            <div class="tg-post-card__meta">
              <span><?php echo esc_html(get_the_date()); ?></span>
              <span><?php echo esc_html(get_post_type_object(get_post_type())->labels->singular_name); ?></span>
            </div>
          </div>
        </article>
      <?php endwhile; ?>
    </div>

    <div class="tg-pagination">
      <?php echo paginate_links(['prev_text' => '&laquo;', 'next_text' => '&raquo;', 'type' => 'plain']); // phpcs:ignore WordPress.Security.EscapeOutput ?>
    </div>

  <?php else : ?>
    <div style="text-align:center;padding:3rem 0;">
      <p style="font-size:1.125rem;color:var(--color-gray-600);margin-bottom:1.5rem;">
        <?php printf(esc_html__('No results found for "%s". Try a different search.', 'toolsgallery'), esc_html(get_search_query())); ?>
      </p>
      <a class="tg-btn tg-btn--primary" href="<?php echo esc_url(home_url('/tools/')); ?>">
        <?php esc_html_e('Browse All Tools', 'toolsgallery'); ?>
      </a>
    </div>
  <?php endif; ?>

</div>

<?php get_footer(); ?>

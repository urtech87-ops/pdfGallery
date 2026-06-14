<?php get_header(); ?>

<div class="tg-container" style="padding-top:3rem;padding-bottom:4rem;">
  <?php while (have_posts()) : the_post(); ?>
    <article id="post-<?php the_ID(); ?>" <?php post_class('tg-entry'); ?>>
      <header class="tg-entry__header">
        <h1 class="tg-entry__title"><?php the_title(); ?></h1>
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
  <?php endwhile; ?>
</div>

<?php get_footer(); ?>

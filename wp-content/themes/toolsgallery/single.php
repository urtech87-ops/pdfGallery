<?php get_header(); ?>

<?php
/* Article Schema (Phase 9 E1) */
if (have_posts()) :
    the_post();
    rewind_posts();
    $article_schema = [
        '@context'          => 'https://schema.org',
        '@type'             => 'Article',
        'headline'          => get_the_title(),
        'description'       => get_the_excerpt(),
        'datePublished'     => get_the_date('c'),
        'dateModified'      => get_the_modified_date('c'),
        'author'            => ['@type' => 'Organization', 'name' => 'Tool Acadmy', 'url' => 'https://toolacadmy.com'],
        'publisher'         => [
            '@type' => 'Organization',
            'name'  => 'Tool Acadmy',
            'logo'  => ['@type' => 'ImageObject', 'url' => get_template_directory_uri() . '/assets/images/logo.png'],
        ],
        'mainEntityOfPage'  => ['@type' => 'WebPage', '@id' => get_permalink()],
    ];
    if (has_post_thumbnail()) {
        $article_schema['image'] = get_the_post_thumbnail_url(null, 'large');
    }
    echo '<script type="application/ld+json">' . wp_json_encode($article_schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
endif;
?>

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
            $valid_cat = null;
            foreach ((array) $cats as $c) {
                if ($c->slug !== 'uncategorized') { $valid_cat = $c; break; }
            }
            if ($valid_cat) : ?>
              <a class="tg-entry__cat" href="<?php echo esc_url(get_category_link($valid_cat->term_id)); ?>">
                <?php echo esc_html($valid_cat->name); ?>
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

          <?php
          $related_tools = tg_get_blog_related_tools();
          if (!empty($related_tools)) : ?>
          <div class="tg-blog-tools-cta" style="margin-top:2rem;padding:1.5rem;background:var(--color-primary-light,#fff7ed);border-radius:8px;border-left:4px solid var(--color-primary,#F97316);">
            <h3 style="margin-top:0;"><?php esc_html_e('Try These Free Tools', 'toolsgallery'); ?></h3>
            <div class="tg-blog-tools-grid" style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1rem;">
              <?php foreach ($related_tools as $slug => $name) :
                $tool = get_page_by_path($slug, OBJECT, 'tg_tool');
                if ($tool) : ?>
                <a href="<?php echo esc_url(get_permalink($tool->ID)); ?>"
                   class="tg-btn tg-btn--primary"
                   style="font-size:0.875rem;padding:0.5rem 1rem;">
                  <?php echo esc_html($name); ?> &mdash; Try Free &rarr;
                </a>
              <?php endif; endforeach; ?>
            </div>
          </div>
          <?php endif; ?>

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

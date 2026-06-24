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

                <?php
                $cats = get_the_category();
                $valid_cat = null;
                foreach ((array) $cats as $c) {
                    if ($c->slug !== 'uncategorized') { $valid_cat = $c; break; }
                }
                if ($valid_cat) : ?>
                  <a class="tg-blog-card__cat" href="<?php echo esc_url(get_category_link($valid_cat->term_id)); ?>">
                    <?php echo esc_html($valid_cat->name); ?>
                  </a>
                <?php elseif ($cats) : ?>
                  <span class="tg-blog-card__cat">Tool Tips</span>
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

    <aside class="tg-blog-sidebar">

      <!-- Popular Tools -->
      <div class="tg-sidebar-widget">
        <h3 class="tg-sidebar-title">🔥 <?php esc_html_e('Popular Tools', 'toolsgallery'); ?></h3>
        <ul class="tg-sidebar-tools-list">
          <?php
          $popular_tools = [
            ['name' => 'Merge PDF',          'slug' => 'merge-pdf',      'cat' => 'PDF'],
            ['name' => 'Remove Background',  'slug' => 'img-remove-bg',  'cat' => 'Image'],
            ['name' => 'Grammar Checker',    'slug' => 'grammar-fixer',  'cat' => 'AI'],
            ['name' => 'Compress PDF',       'slug' => 'compress-pdf',   'cat' => 'PDF'],
            ['name' => 'JPG to PDF',         'slug' => 'jpg-to-pdf',     'cat' => 'PDF'],
            ['name' => 'Compress Image',     'slug' => 'img-compress',   'cat' => 'Image'],
            ['name' => 'Paraphraser',        'slug' => 'paraphraser',    'cat' => 'AI'],
            ['name' => 'Video to MP3',       'slug' => 'video-to-mp3',   'cat' => 'Video'],
          ];
          foreach ($popular_tools as $t) :
            $tool_url = home_url('/tool/' . $t['slug'] . '/');
          ?>
          <li class="tg-sidebar-tool-item">
            <a href="<?php echo esc_url($tool_url); ?>">
              <span class="tg-sidebar-tool-name"><?php echo esc_html($t['name']); ?></span>
              <span class="tg-sidebar-tool-cat"><?php echo esc_html($t['cat']); ?></span>
            </a>
          </li>
          <?php endforeach; ?>
        </ul>
        <a href="<?php echo esc_url(home_url('/tools/')); ?>" class="tg-sidebar-view-all">
          <?php esc_html_e('View all 150+ tools →', 'toolsgallery'); ?>
        </a>
      </div>

      <!-- Tool Categories -->
      <div class="tg-sidebar-widget">
        <h3 class="tg-sidebar-title">📂 <?php esc_html_e('Browse by Category', 'toolsgallery'); ?></h3>
        <div class="tg-sidebar-cats">
          <?php
          $sidebar_cats = get_terms(['taxonomy' => 'tool_category', 'hide_empty' => false]);
          $cat_icons = [
            'pdf-tools'     => '📄',
            'image-tools'   => '🖼️',
            'ai-tools'      => '🤖',
            'video-tools'   => '🎬',
            'file-tools'    => '📁',
            'utility-tools' => '⚙️',
          ];
          if (!is_wp_error($sidebar_cats)) :
            foreach ($sidebar_cats as $cat) :
              $cat_icon = $cat_icons[$cat->slug] ?? '🔧';
              $cat_url  = get_term_link($cat);
          ?>
          <a href="<?php echo esc_url(is_wp_error($cat_url) ? '#' : $cat_url); ?>" class="tg-sidebar-cat-link">
            <span class="tg-sidebar-cat-icon"><?php echo $cat_icon; // phpcs:ignore ?></span>
            <span class="tg-sidebar-cat-name"><?php echo esc_html($cat->name); ?></span>
            <span class="tg-sidebar-cat-count"><?php echo absint($cat->count); ?></span>
          </a>
          <?php endforeach; endif; ?>
        </div>
      </div>

      <!-- Recent Posts -->
      <div class="tg-sidebar-widget">
        <h3 class="tg-sidebar-title">📝 <?php esc_html_e('Recent Articles', 'toolsgallery'); ?></h3>
        <ul class="tg-sidebar-posts">
          <?php
          $recent_posts = get_posts(['posts_per_page' => 4, 'post_status' => 'publish']);
          foreach ($recent_posts as $rp) :
          ?>
          <li class="tg-sidebar-post-item">
            <a href="<?php echo esc_url(get_permalink($rp->ID)); ?>"><?php echo esc_html($rp->post_title); ?></a>
            <span class="tg-sidebar-post-date"><?php echo esc_html(get_the_date('M j', $rp->ID)); ?></span>
          </li>
          <?php endforeach; ?>
        </ul>
      </div>

      <!-- Try Tools CTA -->
      <div class="tg-sidebar-cta">
        <p><?php esc_html_e('Need a free online tool?', 'toolsgallery'); ?></p>
        <a href="<?php echo esc_url(home_url('/tools/')); ?>" class="tg-btn tg-btn--primary" style="width:100%;justify-content:center;">
          <?php esc_html_e('Browse Free Tools →', 'toolsgallery'); ?>
        </a>
      </div>

      <?php echo tg_ad_slot('blog-sidebar', 'rectangle'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
    </aside>

  </div>
</div>

<?php get_footer(); ?>

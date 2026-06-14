<?php get_header(); ?>

<!-- Hero -->
<section class="tg-hero" aria-labelledby="hero-title">
  <div class="tg-container">
    <div class="tg-hero__badge">⚡ 100% Free — No Sign-up Required</div>

    <h1 class="tg-hero__title" id="hero-title">
      <?php esc_html_e('Free PDF Tools —', 'toolsgallery'); ?><br>
      <span><?php esc_html_e('Edit Your Documents Without Limits', 'toolsgallery'); ?></span>
    </h1>

    <p class="tg-hero__subtitle">
      <?php esc_html_e('Merge, split, compress, convert PDFs and images — instantly in your browser. Fast, free, and private.', 'toolsgallery'); ?>
    </p>

    <div class="tg-hero__actions">
      <a class="tg-btn tg-btn--primary tg-btn--lg" href="<?php echo esc_url(home_url('/tools/')); ?>">
        <?php esc_html_e('Explore All Tools', 'toolsgallery'); ?>
      </a>
      <a class="tg-btn tg-btn--outline tg-btn--lg" href="<?php echo esc_url(home_url('/tool/merge-pdf/')); ?>">
        <?php esc_html_e('Merge PDF Free', 'toolsgallery'); ?>
      </a>
    </div>

    <div class="tg-hero__stats">
      <div class="tg-hero__stat">
        <div class="tg-hero__stat-value">20+</div>
        <div class="tg-hero__stat-label"><?php esc_html_e('Free Tools', 'toolsgallery'); ?></div>
      </div>
      <div class="tg-hero__stat">
        <div class="tg-hero__stat-value">0</div>
        <div class="tg-hero__stat-label"><?php esc_html_e('Sign-ups Required', 'toolsgallery'); ?></div>
      </div>
      <div class="tg-hero__stat">
        <div class="tg-hero__stat-value">100%</div>
        <div class="tg-hero__stat-label"><?php esc_html_e('Private & Secure', 'toolsgallery'); ?></div>
      </div>
    </div>
  </div>
</section>

<!-- Leaderboard Ad -->
<div class="tg-ad-leaderboard tg-container">
  <?php echo tg_ad_slot('homepage-leaderboard', 'leaderboard'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
</div>

<!-- PDF Tools Section -->
<section class="tg-section" aria-labelledby="pdf-tools-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('PDF', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="pdf-tools-heading"><?php esc_html_e('PDF Tools', 'toolsgallery'); ?></h2>
      <p class="tg-section__desc"><?php esc_html_e('Everything you need to work with PDF files — no software install required.', 'toolsgallery'); ?></p>
    </div>
    <div class="tg-tools-grid">
      <?php
      $pdf_tools = [
        ['title' => 'Merge PDF',    'desc' => 'Combine multiple PDFs into one.',     'icon' => '📄', 'slug' => 'merge-pdf'],
        ['title' => 'Split PDF',    'desc' => 'Separate pages into individual PDFs.', 'icon' => '✂️', 'slug' => 'split-pdf'],
        ['title' => 'Compress PDF', 'desc' => 'Reduce PDF size without quality loss.','icon' => '📦', 'slug' => 'compress-pdf'],
        ['title' => 'PDF to Word',  'desc' => 'Convert PDF to editable Word doc.',   'icon' => '📝', 'slug' => 'pdf-to-word'],
        ['title' => 'PDF to JPG',   'desc' => 'Extract pages as high-quality images.','icon' => '🖼️', 'slug' => 'pdf-to-jpg'],
        ['title' => 'JPG to PDF',   'desc' => 'Turn images into a PDF instantly.',   'icon' => '🔄', 'slug' => 'jpg-to-pdf'],
        ['title' => 'Rotate PDF',   'desc' => 'Rotate pages to the correct angle.',  'icon' => '🔃', 'slug' => 'rotate-pdf'],
        ['title' => 'PDF to PNG',   'desc' => 'Convert PDF pages to PNG format.',    'icon' => '🖼️', 'slug' => 'pdf-to-png'],
      ];

      // Try to pull from CPT first; fall back to static list
      $cpt_query = new WP_Query([
        'post_type'      => 'tg_tool',
        'posts_per_page' => 8,
        'tax_query'      => [['taxonomy' => 'tool_category', 'field' => 'slug', 'terms' => 'pdf-tools']],
        'no_found_rows'  => true,
      ]);

      if ($cpt_query->have_posts()) :
        while ($cpt_query->have_posts()) : $cpt_query->the_post();
      ?>
        <a class="tg-tool-card" href="<?php the_permalink(); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true">
            <?php echo esc_html(get_post_meta(get_the_ID(), '_tg_icon', true) ?: '📄'); ?>
          </div>
          <div class="tg-tool-card__title"><?php the_title(); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html(tg_get_the_excerpt_safe(12)); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php
        endwhile;
        wp_reset_postdata();
      else :
        foreach ($pdf_tools as $t) :
      ?>
        <a class="tg-tool-card" href="<?php echo esc_url(home_url('/tool/' . $t['slug'] . '/')); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo esc_html($t['icon']); ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($t['title']); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html($t['desc']); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php
        endforeach;
      endif;
      ?>
    </div>
    <div style="text-align:center;margin-top:2.5rem;">
      <a class="tg-btn tg-btn--outline" href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('View All PDF Tools', 'toolsgallery'); ?></a>
    </div>
  </div>
</section>

<!-- Image Tools Section -->
<section class="tg-section tg-section--gray" aria-labelledby="image-tools-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('Images', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="image-tools-heading"><?php esc_html_e('Image Tools', 'toolsgallery'); ?></h2>
      <p class="tg-section__desc"><?php esc_html_e('Compress, resize, convert and enhance images in seconds.', 'toolsgallery'); ?></p>
    </div>
    <div class="tg-tools-grid">
      <?php
      $image_tools = [
        ['title' => 'Background Remover', 'desc' => 'Remove image backgrounds with AI.',        'icon' => '✂️', 'slug' => 'background-remover'],
        ['title' => 'Compress Image',     'desc' => 'Shrink image size while keeping quality.',  'icon' => '📦', 'slug' => 'compress-image'],
        ['title' => 'Resize Image',       'desc' => 'Resize to any dimension instantly.',        'icon' => '↔️', 'slug' => 'resize-image'],
        ['title' => 'JPG to PNG',         'desc' => 'Convert JPEG images to PNG format.',        'icon' => '🔄', 'slug' => 'jpg-to-png'],
        ['title' => 'PNG to JPG',         'desc' => 'Convert PNG to compressed JPEG.',           'icon' => '🔄', 'slug' => 'png-to-jpg'],
        ['title' => 'Crop Image',         'desc' => 'Crop your image to the perfect size.',      'icon' => '✂️', 'slug' => 'crop-image'],
      ];
      foreach ($image_tools as $t) :
      ?>
        <a class="tg-tool-card" href="<?php echo esc_url(home_url('/tool/' . $t['slug'] . '/')); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo esc_html($t['icon']); ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($t['title']); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html($t['desc']); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
    <div style="text-align:center;margin-top:2.5rem;">
      <a class="tg-btn tg-btn--outline" href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('View All Image Tools', 'toolsgallery'); ?></a>
    </div>
  </div>
</section>

<!-- Why ToolsGallery -->
<section class="tg-section" aria-labelledby="why-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('Why Us', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="why-heading"><?php esc_html_e('Why Choose ToolsGallery?', 'toolsgallery'); ?></h2>
    </div>
    <div class="tg-features-grid">
      <?php
      $features = [
        ['icon' => '⚡', 'title' => 'Lightning Fast',   'desc' => 'Tools run directly in your browser — no upload wait, instant results.'],
        ['icon' => '🔒', 'title' => 'Privacy First',    'desc' => 'Files never leave your device for browser tools. Your data stays yours.'],
        ['icon' => '💸', 'title' => 'Always Free',      'desc' => 'No subscriptions, no credit card, no watermarks. Completely free, forever.'],
        ['icon' => '📱', 'title' => 'Works Everywhere', 'desc' => 'Fully responsive — use on desktop, tablet, or mobile with ease.'],
      ];
      foreach ($features as $f) :
      ?>
        <div class="tg-feature-card">
          <div class="tg-feature-card__icon" aria-hidden="true"><?php echo esc_html($f['icon']); ?></div>
          <div class="tg-feature-card__title"><?php echo esc_html($f['title']); ?></div>
          <div class="tg-feature-card__desc"><?php echo esc_html($f['desc']); ?></div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- In-content Ad -->
<div class="tg-container" style="text-align:center;padding-bottom:2rem;">
  <?php echo tg_ad_slot('homepage-in-content', 'rectangle'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
</div>

<?php get_footer(); ?>

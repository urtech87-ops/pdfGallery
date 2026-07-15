<?php get_header(); ?>

<!-- Hero -->
<section class="tg-hero" aria-labelledby="hero-title">
  <div class="tg-container">
    <div class="tg-hero__badge">⚡ 100% Free — No Sign-up Required</div>

<!--     <h1 class="tg-hero__title" id="hero-title">
      <?php esc_html_e('Free Online Tools for PDF, Images,', 'toolsgallery'); ?><br>
      <span><?php esc_html_e('AI Writing &amp; More', 'toolsgallery'); ?></span>
    </h1> -->
	  <h1 class="tg-hero__title" id="hero-title">
		  Free Online Tools related to
		  <span class="flip-wrapper">
			  <span class="flip-text">
				  <span>Business</span>
				  <span>Education</span>
				  <span>Office</span>
				  <span>Enterprise</span>
			  </span>
		  </span>
		  Solutions
	  </h1>

    <p class="tg-hero__subtitle">
      <?php esc_html_e('150+ free browser-based tools. No signup. No download. No limits. Tool Acadmy — your academy for free online tools.', 'toolsgallery'); ?>
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
        <div class="tg-hero__stat-value">150+</div>
        <div class="tg-hero__stat-label"><?php esc_html_e('Free Tools', 'toolsgallery'); ?></div>
      </div>
      <div class="tg-hero__stat">
        <div class="tg-hero__stat-value">6</div>
        <div class="tg-hero__stat-label"><?php esc_html_e('Categories', 'toolsgallery'); ?></div>
      </div>
      <div class="tg-hero__stat">
        <div class="tg-hero__stat-value">0</div>
        <div class="tg-hero__stat-label"><?php esc_html_e('Signups Required', 'toolsgallery'); ?></div>
      </div>
      <div class="tg-hero__stat">
        <div class="tg-hero__stat-value">100%</div>
        <div class="tg-hero__stat-label"><?php esc_html_e('Free Forever', 'toolsgallery'); ?></div>
      </div>
    </div>
  </div>
</section>

<!-- Leaderboard Ad -->
<div class="tg-ad-leaderboard tg-container">
  <?php echo tg_ad_slot('homepage-leaderboard', 'leaderboard'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
</div>

<!-- How It Works -->
<section class="tg-section tg-section--gray" aria-labelledby="hiw-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('HOW IT WORKS', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="hiw-heading"><?php esc_html_e('Get Started in Seconds', 'toolsgallery'); ?></h2>
      <p class="tg-section__desc"><?php esc_html_e('No installation, no account, no learning curve.', 'toolsgallery'); ?></p>
    </div>
    <div class="tg-hiw-steps">
      <div class="tg-hiw-step">
        <div class="tg-hiw-step__number" aria-hidden="true">1</div>
        <div class="tg-hiw-step__icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div class="tg-hiw-step__title"><?php esc_html_e('Upload', 'toolsgallery'); ?></div>
        <div class="tg-hiw-step__desc"><?php esc_html_e('Choose a file from your device or drag and drop it into the tool.', 'toolsgallery'); ?></div>
      </div>
      <div class="tg-hiw-step">
        <div class="tg-hiw-step__number" aria-hidden="true">2</div>
        <div class="tg-hiw-step__icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div class="tg-hiw-step__title"><?php esc_html_e('Process', 'toolsgallery'); ?></div>
        <div class="tg-hiw-step__desc"><?php esc_html_e('Your file is processed instantly, right in your browser — nothing is uploaded to a server.', 'toolsgallery'); ?></div>
      </div>
      <div class="tg-hiw-step">
        <div class="tg-hiw-step__number" aria-hidden="true">3</div>
        <div class="tg-hiw-step__icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div class="tg-hiw-step__title"><?php esc_html_e('Download', 'toolsgallery'); ?></div>
        <div class="tg-hiw-step__desc"><?php esc_html_e('Get your result immediately. No waiting, no email required.', 'toolsgallery'); ?></div>
      </div>
    </div>
  </div>
</section>

<!-- Popular Tools (filterable) -->
<section class="tg-section tg-popular-tools" aria-labelledby="popular-tools-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('POPULAR', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="popular-tools-heading"><?php esc_html_e('Our Most Popular Tools', 'toolsgallery'); ?></h2>
      <p class="tg-section__desc"><?php esc_html_e('The tools people use most — filter by category and jump straight in.', 'toolsgallery'); ?></p>
    </div>

    <?php
    // Curated list. 's' is the tool handler/slug, 'c' the category slug, 'cl' the label shown on the card.
    $tg_popular = [
      ['t' => 'Merge PDF',          's' => 'merge-pdf',        'c' => 'pdf-tools',     'cl' => 'PDF',       'd' => 'Combine PDFs into one file.'],
      ['t' => 'Compress PDF',       's' => 'compress-pdf',     'c' => 'pdf-tools',     'cl' => 'PDF',       'd' => 'Shrink PDF size.'],
      ['t' => 'PDF to Word',        's' => 'pdf-to-word',      'c' => 'pdf-tools',     'cl' => 'PDF',       'd' => 'Convert PDF to editable Word.'],
      ['t' => 'Background Remover', 's' => 'img-remove-bg',    'c' => 'image-tools',   'cl' => 'Image',     'd' => 'Remove image backgrounds.'],
      ['t' => 'Compress Image',     's' => 'img-compress',     'c' => 'image-tools',   'cl' => 'Image',     'd' => 'Reduce image file size.'],
      ['t' => 'Resize Image',       's' => 'img-resize',       'c' => 'image-tools',   'cl' => 'Image',     'd' => 'Resize to any dimension.'],
      ['t' => 'Essay Writer',       's' => 'essay-writer',     'c' => 'ai-tools',      'cl' => 'AI Write',  'd' => 'Write essays with AI.'],
      ['t' => 'Grammar Fixer',      's' => 'grammar-fixer',    'c' => 'ai-tools',      'cl' => 'AI Write',  'd' => 'Fix grammar instantly.'],
      ['t' => 'Paraphraser',        's' => 'paraphraser',      'c' => 'ai-tools',      'cl' => 'AI Write',  'd' => 'Reword any text.'],
      ['t' => 'Trim Video',         's' => 'trim-video',       'c' => 'video-tools',   'cl' => 'Video',     'd' => 'Cut a clip from a video.'],
      ['t' => 'Compress Video',     's' => 'video-compressor', 'c' => 'video-tools',   'cl' => 'Video',     'd' => 'Reduce video size.'],
      ['t' => 'Excel to CSV',       's' => 'excel-to-csv',     'c' => 'file-tools',    'cl' => 'Converter', 'd' => 'Convert Excel to CSV.'],
      ['t' => 'HTML to Markdown',   's' => 'html-to-md',       'c' => 'file-tools',    'cl' => 'Converter', 'd' => 'Convert HTML to Markdown.'],
      ['t' => 'Color Picker',       's' => 'color-picker',     'c' => 'utility-tools', 'cl' => 'Other',     'd' => 'Pick colors + get hex/rgb.'],
      ['t' => 'Unit Converter',     's' => 'unit-converter',   'c' => 'utility-tools', 'cl' => 'Other',     'd' => 'Convert units fast.'],
    ];

    // Resolve real permalinks by handler where the CPT post exists; fall back to /tool/<slug>/.
    $tg_pop_links = [];
    $tg_pop_posts = get_posts([
      'post_type'      => 'tg_tool',
      'posts_per_page' => -1,
      'no_found_rows'  => true,
      'meta_query'     => [[ // phpcs:ignore WordPress.DB.SlowDBQuery
        'key'     => '_tg_handler',
        'value'   => wp_list_pluck($tg_popular, 's'),
        'compare' => 'IN',
      ]],
    ]);
    foreach ($tg_pop_posts as $tg_pop_post) {
      $tg_pop_links[get_post_meta($tg_pop_post->ID, '_tg_handler', true)] = get_permalink($tg_pop_post);
    }

    $tg_filters = [
      'all'           => __('All', 'toolsgallery'),
      'pdf-tools'     => __('PDF', 'toolsgallery'),
      'image-tools'   => __('Image', 'toolsgallery'),
      'ai-tools'      => __('AI Write', 'toolsgallery'),
      'video-tools'   => __('Video', 'toolsgallery'),
      'file-tools'    => __('Converter', 'toolsgallery'),
      'utility-tools' => __('Other', 'toolsgallery'),
    ];
    ?>

    <div class="tg-filter-bar" role="group" aria-label="<?php esc_attr_e('Filter popular tools by category', 'toolsgallery'); ?>">
      <?php foreach ($tg_filters as $tg_f_slug => $tg_f_label) : ?>
        <button type="button" class="tg-filter-btn<?php echo $tg_f_slug === 'all' ? ' active' : ''; ?>"
                data-filter="<?php echo esc_attr($tg_f_slug); ?>"
                aria-pressed="<?php echo $tg_f_slug === 'all' ? 'true' : 'false'; ?>">
          <?php echo esc_html($tg_f_label); ?>
        </button>
      <?php endforeach; ?>
    </div>

    <div class="tg-tools-grid tg-popular-grid">
      <?php foreach ($tg_popular as $item) :
        $item_url = $tg_pop_links[$item['s']] ?? home_url('/tool/' . $item['s'] . '/');
      ?>
        <a class="tg-tool-card" href="<?php echo esc_url($item_url); ?>" data-category="<?php echo esc_attr($item['c']); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo tg_get_tool_icon($item['s'], $item['c']); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($item['t']); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html($item['d']); ?></div>
          <span class="tg-tool-card__cat"><?php echo esc_html($item['cl']); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>

  <script>
  (function () {
    var section = document.querySelector('.tg-popular-tools');
    if (!section) return;
    var bar = section.querySelector('.tg-filter-bar');
    var cards = section.querySelectorAll('.tg-popular-grid .tg-tool-card');
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.tg-filter-btn');
      if (!btn) return;
      bar.querySelectorAll('.tg-filter-btn').forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      var filter = btn.dataset.filter;
      cards.forEach(function (card) {
        card.classList.toggle('is-hidden', filter !== 'all' && card.dataset.category !== filter);
      });
    });
  })();
  </script>
</section>

<!-- PDF Tools Section -->
<section class="tg-section" aria-labelledby="pdf-tools-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('PDF', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="pdf-tools-heading"><?php esc_html_e('PDF Tools', 'toolsgallery'); ?></h2>
      <p class="tg-section__desc"><?php esc_html_e('Our free PDF tools let you merge, split, compress, convert and edit PDF files directly in your browser. No software installation required.', 'toolsgallery'); ?></p>
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
        'posts_per_page' => 6,
        'tax_query'      => [['taxonomy' => 'tool_category', 'field' => 'slug', 'terms' => 'pdf-tools']],
        'no_found_rows'  => true,
      ]);

      if ($cpt_query->have_posts()) :
        while ($cpt_query->have_posts()) : $cpt_query->the_post();
      ?>
        <a class="tg-tool-card" href="<?php the_permalink(); ?>" data-tool-handler="<?php echo esc_attr(get_post_meta(get_the_ID(), '_tg_handler', true)); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true">
            <?php echo tg_get_tool_icon(get_post_meta(get_the_ID(), '_tg_handler', true) ?: get_post()->post_name, 'pdf-tools'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
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
        <a class="tg-tool-card" href="<?php echo esc_url(home_url('/tool/' . $t['slug'] . '/')); ?>" data-tool-handler="<?php echo esc_attr($t['slug']); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo tg_get_tool_icon($t['slug'], 'pdf-tools'); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($t['title']); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html($t['desc']); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php
        endforeach;
      endif;
      ?>
    </div>
    <div class="tg-section__cta">
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
      <p class="tg-section__desc"><?php esc_html_e('Powerful free image tools for compression, resizing, cropping, background removal, format conversion and more. All processing happens locally.', 'toolsgallery'); ?></p>
    </div>
    <div class="tg-tools-grid">
      <?php
      $image_tools_static = [
        ['title' => 'Background Remover', 'desc' => 'Remove image backgrounds with AI.',        'icon' => '✂️', 'slug' => 'background-remover'],
        ['title' => 'Compress Image',     'desc' => 'Shrink image size while keeping quality.',  'icon' => '📦', 'slug' => 'compress-image'],
        ['title' => 'Resize Image',       'desc' => 'Resize to any dimension instantly.',        'icon' => '↔️', 'slug' => 'resize-image'],
        ['title' => 'JPG to PNG',         'desc' => 'Convert JPEG images to PNG format.',        'icon' => '🔄', 'slug' => 'img-to-png'],
        ['title' => 'PNG to JPG',         'desc' => 'Convert PNG to compressed JPEG.',           'icon' => '🔄', 'slug' => 'img-to-jpg'],
        ['title' => 'Crop Image',         'desc' => 'Crop your image to the perfect size.',      'icon' => '✂️', 'slug' => 'crop-image'],
      ];

      // Try to pull from CPT first; fall back to static list
      $img_cpt_query = new WP_Query([
        'post_type'      => 'tg_tool',
        'posts_per_page' => 6,
        'tax_query'      => [['taxonomy' => 'tool_category', 'field' => 'slug', 'terms' => 'image-tools']],
        'no_found_rows'  => true,
      ]);

      if ($img_cpt_query->have_posts()) :
        while ($img_cpt_query->have_posts()) : $img_cpt_query->the_post();
      ?>
        <a class="tg-tool-card" href="<?php the_permalink(); ?>" data-tool-handler="<?php echo esc_attr(get_post_meta(get_the_ID(), '_tg_handler', true)); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true">
            <?php echo tg_get_tool_icon(get_post_meta(get_the_ID(), '_tg_handler', true) ?: get_post()->post_name, 'image-tools'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
          </div>
          <div class="tg-tool-card__title"><?php the_title(); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html(tg_get_the_excerpt_safe(12)); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php
        endwhile;
        wp_reset_postdata();
      else :
        foreach ($image_tools_static as $t) :
      ?>
        <a class="tg-tool-card" href="<?php echo esc_url(home_url('/tool/' . $t['slug'] . '/')); ?>" data-tool-handler="<?php echo esc_attr($t['slug']); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo tg_get_tool_icon($t['slug'], 'image-tools'); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($t['title']); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html($t['desc']); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php
        endforeach;
      endif;
      ?>
    </div>
    <div class="tg-section__cta">
      <a class="tg-btn tg-btn--outline" href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('View All Image Tools', 'toolsgallery'); ?></a>
    </div>
  </div>
</section>

<!-- AI Writing Tools Section -->
<section class="tg-section" aria-labelledby="ai-tools-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('AI WRITING', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="ai-tools-heading"><?php esc_html_e('AI Writing Tools', 'toolsgallery'); ?></h2>
      <p class="tg-section__desc"><?php esc_html_e('Write, edit, and improve content with AI — fast and free.', 'toolsgallery'); ?></p>
    </div>
    <div class="tg-tools-grid">
      <?php
      $ai_tools_cpt = new WP_Query([
        'post_type'      => 'tg_tool',
        'posts_per_page' => 6,
        'tax_query'      => [['taxonomy' => 'tool_category', 'field' => 'slug', 'terms' => 'ai-tools']],
        'no_found_rows'  => true,
      ]);

      if ($ai_tools_cpt->have_posts()) :
        while ($ai_tools_cpt->have_posts()) : $ai_tools_cpt->the_post();
      ?>
        <a class="tg-tool-card" href="<?php the_permalink(); ?>" data-tool-handler="<?php echo esc_attr(get_post_meta(get_the_ID(), '_tg_handler', true)); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true">
            <?php echo tg_get_tool_icon(get_post_meta(get_the_ID(), '_tg_handler', true) ?: get_post()->post_name, 'ai-tools'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
          </div>
          <div class="tg-tool-card__title"><?php the_title(); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html(tg_get_the_excerpt_safe(12)); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php
        endwhile;
        wp_reset_postdata();
      else :
        $ai_placeholders = [
          ['title' => 'Grammar Fixer',      'desc' => 'Fix grammar and spelling errors instantly.',    'slug' => 'grammar-fixer'],
          ['title' => 'Paraphraser',         'desc' => 'Rewrite any text in a fresh, clear style.',    'slug' => 'paraphraser'],
          ['title' => 'Article Writer',      'desc' => 'Generate full articles from a simple prompt.', 'slug' => 'article-writer'],
          ['title' => 'Content Summarizer',  'desc' => 'Summarize long content into key points.',      'slug' => 'summarizer'],
          ['title' => 'AI Humanizer',        'desc' => 'Make AI-generated text sound more human.',     'slug' => 'ai-humanizer'],
          ['title' => 'Essay Writer',        'desc' => 'Write structured essays on any topic fast.',   'slug' => 'essay-writer'],
        ];
        foreach ($ai_placeholders as $t) :
      ?>
        <div class="tg-tool-card">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo tg_get_tool_icon($t['slug'], 'ai-tools'); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($t['title']); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html($t['desc']); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('FREE', 'toolsgallery'); ?></span>
        </div>
      <?php
        endforeach;
      endif;
      ?>
    </div>
    <div class="tg-section__cta">
      <a class="tg-btn tg-btn--outline" href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('View All AI Tools', 'toolsgallery'); ?></a>
    </div>
  </div>
</section>

<!-- Video Tools Section -->
<section class="tg-section tg-section--gray" aria-labelledby="video-tools-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('VIDEO', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="video-tools-heading"><?php esc_html_e('Video Tools', 'toolsgallery'); ?></h2>
      <p class="tg-section__desc"><?php esc_html_e('Compress, convert, trim and edit videos entirely in your browser — powered by FFmpeg.wasm.', 'toolsgallery'); ?></p>
    </div>
    <div class="tg-tools-grid">
      <?php
      $video_tools_static = [
        ['title' => 'Video Compressor',   'desc' => 'Reduce video file size without quality loss.', 'icon' => '🎬', 'slug' => 'video-compressor'],
        ['title' => 'Video Converter',    'desc' => 'Convert between MP4, WebM, AVI, MOV and GIF.', 'icon' => '🔄', 'slug' => 'video-converter'],
        ['title' => 'Video to MP3',       'desc' => 'Extract audio from any video file.',            'icon' => '🎵', 'slug' => 'video-to-mp3'],
        ['title' => 'Trim Video',         'desc' => 'Cut videos to the exact clip you need.',        'icon' => '✂️', 'slug' => 'trim-video'],
        ['title' => 'Video to GIF',       'desc' => 'Turn any video clip into an animated GIF.',     'icon' => '🖼️', 'slug' => 'video-to-gif'],
        ['title' => 'Rotate Video',       'desc' => 'Rotate or flip a video in seconds.',            'icon' => '🔃', 'slug' => 'rotate-video'],
      ];

      $vid_cpt_query = new WP_Query([
        'post_type'      => 'tg_tool',
        'posts_per_page' => 6,
        'tax_query'      => [['taxonomy' => 'tool_category', 'field' => 'slug', 'terms' => 'video-tools']],
        'no_found_rows'  => true,
      ]);

      if ($vid_cpt_query->have_posts()) :
        while ($vid_cpt_query->have_posts()) : $vid_cpt_query->the_post();
      ?>
        <a class="tg-tool-card" href="<?php the_permalink(); ?>" data-tool-handler="<?php echo esc_attr(get_post_meta(get_the_ID(), '_tg_handler', true)); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true">
            <?php echo tg_get_tool_icon(get_post_meta(get_the_ID(), '_tg_handler', true) ?: get_post()->post_name, 'video-tools'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
          </div>
          <div class="tg-tool-card__title"><?php the_title(); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html(tg_get_the_excerpt_safe(12)); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php
        endwhile;
        wp_reset_postdata();
      else :
        foreach ($video_tools_static as $t) :
      ?>
        <a class="tg-tool-card" href="<?php echo esc_url(home_url('/tool/' . $t['slug'] . '/')); ?>" data-tool-handler="<?php echo esc_attr($t['slug']); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo tg_get_tool_icon($t['slug'], 'video-tools'); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($t['title']); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html($t['desc']); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php
        endforeach;
      endif;
      ?>
    </div>
    <div class="tg-section__cta">
      <a class="tg-btn tg-btn--outline" href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('View All Video Tools', 'toolsgallery'); ?></a>
    </div>
  </div>
</section>

<!-- Why ToolsGallery -->
<section class="tg-section" aria-labelledby="why-heading">
  <div class="tg-container">
    <div class="tg-section__header">
      <div class="tg-section__tag"><?php esc_html_e('Why Us', 'toolsgallery'); ?></div>
      <h2 class="tg-section__title" id="why-heading"><?php esc_html_e('Why Choose Tool Acadmy?', 'toolsgallery'); ?></h2>
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

<!-- Homepage Leaderboard Ad -->
<div class="tg-ad-section">
  <div class="tg-container tg-ad-section__inner">
    <?php echo tg_ad_slot('homepage-leaderboard-2', 'leaderboard'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
  </div>
</div>

<!-- SEO Content Section -->
<section class="tg-section tg-seo-content" aria-labelledby="seo-heading">
  <div class="tg-container">

    <h2 id="seo-heading">Free Online Tools &mdash; No Download, No Signup, No Cost</h2>

    <p>Tool Acadmy is a free collection of 150+ browser-based tools for everyday digital tasks. Whether you are a student who needs to compress a PDF before uploading an assignment, a freelancer editing product photos, a marketer writing social media captions with AI, or a developer converting JSON to CSV &mdash; we have a free tool for that.</p>

    <p>Every tool on Tool Acadmy runs directly in your web browser. That means no software to download, no account to create, and no files sent to our servers. Your documents, images, and videos stay private on your device the entire time.</p>

    <h3>Why Tool Acadmy is Different</h3>

    <p>Most online tool sites either charge monthly fees, add watermarks to your output, or make you sign up before you can use anything. Tool Acadmy does none of those things. Every tool is free, every download is clean, and you can start immediately without entering an email address.</p>

    <h3>What Types of Tools Are Available?</h3>

    <p>Tool Acadmy currently offers tools in six categories:</p>

    <ul>
      <li><a href="<?php echo esc_url(home_url('/tools/pdf-tools/')); ?>"><strong>PDF Tools</strong></a> &mdash; Merge, split, compress, convert, edit, protect and manipulate PDF files. 29 free PDF tools in total.</li>
      <li><a href="<?php echo esc_url(home_url('/tools/image-tools/')); ?>"><strong>Image Tools</strong></a> &mdash; Compress, resize, crop, convert, remove backgrounds, add watermarks and more. 40 free image tools.</li>
      <li><a href="<?php echo esc_url(home_url('/tools/ai-tools/')); ?>"><strong>AI Writing Tools</strong></a> &mdash; Grammar checker, paraphraser, summarizer, essay writer, email generator and more. 30 free AI tools.</li>
      <li><a href="<?php echo esc_url(home_url('/tools/video-tools/')); ?>"><strong>Video Tools</strong></a> &mdash; Compress, convert, trim, add subtitles and extract audio from videos. 25 free video tools.</li>
      <li><a href="<?php echo esc_url(home_url('/tools/file-tools/')); ?>"><strong>File Converter Tools</strong></a> &mdash; Excel to CSV, JSON to XML, Markdown to HTML, Base64 encoding and more. 15 free file tools.</li>
      <li><a href="<?php echo esc_url(home_url('/tools/utility-tools/')); ?>"><strong>Utility Tools</strong></a> &mdash; Color picker, unit converter, countdown timer, random number generator and more. 10 free utility tools.</li>
    </ul>

    <h3>How It Works</h3>

    <p>Using any Tool Acadmy tool takes three steps: choose the tool you need, upload your file or enter your text, and get your result. Most tools complete in under 10 seconds. Video tools may take longer due to the processing requirements of video files.</p>

    <p>Tool Acadmy is built using modern web technologies including WebAssembly (for video processing), PDF-lib and PDF.js (for PDF tools), the Canvas API (for image tools), and OpenRouter AI (for writing tools). This combination allows professional-grade results entirely in your browser.</p>

  </div>
</section>

<?php get_footer(); ?>

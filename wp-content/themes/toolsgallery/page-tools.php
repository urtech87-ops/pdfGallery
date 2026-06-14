<?php
/**
 * Template Name: Tools Page
 * Template for /tools/ — lists all tools by category.
 */
get_header();
?>

<div class="tg-page-header">
  <div class="tg-container">
    <h1 class="tg-page-header__title"><?php esc_html_e('All Free Tools', 'toolsgallery'); ?></h1>
    <p class="tg-page-header__desc"><?php esc_html_e('Choose from 20+ free PDF and image tools — no sign-up required.', 'toolsgallery'); ?></p>
  </div>
</div>

<!-- Leaderboard Ad -->
<div class="tg-ad-leaderboard tg-container">
  <?php echo tg_ad_slot('tools-leaderboard', 'leaderboard'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
</div>

<div class="tg-container" style="padding-top:2rem;padding-bottom:4rem;">

  <?php
  $categories = get_terms([
    'taxonomy' => 'tool_category',
    'hide_empty' => false,
    'orderby'    => 'term_order',
    'order'      => 'ASC',
  ]);

  if (!empty($categories) && !is_wp_error($categories)) :
    foreach ($categories as $cat) :
      $tools = get_posts([
        'post_type'      => 'tg_tool',
        'posts_per_page' => -1,
        'tax_query'      => [['taxonomy' => 'tool_category', 'field' => 'term_id', 'terms' => $cat->term_id]],
        'orderby'        => 'title',
        'order'          => 'ASC',
      ]);
      if (empty($tools)) continue;
  ?>
    <section class="tg-section" style="padding-top:2.5rem;padding-bottom:2.5rem;" aria-labelledby="cat-<?php echo esc_attr($cat->slug); ?>">
      <h2 class="tg-section__title" id="cat-<?php echo esc_attr($cat->slug); ?>" style="text-align:left;margin-bottom:1.25rem;">
        <?php echo esc_html($cat->name); ?>
      </h2>
      <?php if ($cat->description) : ?>
        <p style="color:var(--color-gray-600);font-size:0.9375rem;margin-bottom:1.5rem;"><?php echo esc_html($cat->description); ?></p>
      <?php endif; ?>
      <div class="tg-tools-grid">
        <?php foreach ($tools as $tool) :
          $icon = get_post_meta($tool->ID, '_tg_icon', true) ?: '🔧';
        ?>
          <a class="tg-tool-card" href="<?php echo esc_url(get_permalink($tool)); ?>">
            <div class="tg-tool-card__icon" aria-hidden="true"><?php echo esc_html($icon); ?></div>
            <div class="tg-tool-card__title"><?php echo esc_html($tool->post_title); ?></div>
            <div class="tg-tool-card__desc"><?php echo esc_html(wp_trim_words($tool->post_excerpt ?: wp_strip_all_tags($tool->post_content), 12, '…')); ?></div>
            <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
          </a>
        <?php endforeach; ?>
      </div>
    </section>
  <?php
    endforeach;
  else :
    // Fallback: show static tool list when no CPT items exist yet
    $static_sections = [
      [
        'title' => __('PDF Tools', 'toolsgallery'),
        'tools' => [
          ['Merge PDF', 'Combine multiple PDFs into one file.', '📄', 'merge-pdf'],
          ['Split PDF', 'Separate PDF pages into individual files.', '✂️', 'split-pdf'],
          ['Compress PDF', 'Reduce PDF file size significantly.', '📦', 'compress-pdf'],
          ['PDF to Word', 'Convert PDF to editable Word document.', '📝', 'pdf-to-word'],
          ['PDF to JPG', 'Extract PDF pages as JPEG images.', '🖼️', 'pdf-to-jpg'],
          ['JPG to PDF', 'Convert images to PDF format.', '🔄', 'jpg-to-pdf'],
          ['Rotate PDF', 'Rotate PDF pages to correct orientation.', '🔃', 'rotate-pdf'],
          ['PDF to PNG', 'Convert PDF pages to PNG images.', '🖼️', 'pdf-to-png'],
        ],
      ],
      [
        'title' => __('Image Tools', 'toolsgallery'),
        'tools' => [
          ['Background Remover', 'Remove image backgrounds with AI.', '✂️', 'background-remover'],
          ['Compress Image', 'Compress images without quality loss.', '📦', 'compress-image'],
          ['Resize Image', 'Resize images to any dimension.', '↔️', 'resize-image'],
          ['JPG to PNG', 'Convert JPEG to PNG format.', '🔄', 'jpg-to-png'],
          ['PNG to JPG', 'Convert PNG to JPEG format.', '🔄', 'png-to-jpg'],
          ['Crop Image', 'Crop images to any size.', '✂️', 'crop-image'],
        ],
      ],
    ];

    foreach ($static_sections as $section) :
  ?>
    <section class="tg-section" style="padding-top:2.5rem;padding-bottom:2.5rem;">
      <h2 class="tg-section__title" style="text-align:left;margin-bottom:1.25rem;"><?php echo esc_html($section['title']); ?></h2>
      <div class="tg-tools-grid">
        <?php foreach ($section['tools'] as [$title, $desc, $icon, $slug]) : ?>
          <a class="tg-tool-card" href="<?php echo esc_url(home_url('/tool/' . $slug . '/')); ?>">
            <div class="tg-tool-card__icon" aria-hidden="true"><?php echo esc_html($icon); ?></div>
            <div class="tg-tool-card__title"><?php echo esc_html($title); ?></div>
            <div class="tg-tool-card__desc"><?php echo esc_html($desc); ?></div>
            <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
          </a>
        <?php endforeach; ?>
      </div>
    </section>
  <?php endforeach; endif; ?>

</div><!-- .tg-container -->

<?php get_footer(); ?>

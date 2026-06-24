<?php get_header(); ?>

<div class="tg-container">
  <div class="tg-404">
    <div class="tg-404__code" aria-hidden="true">404</div>
    <h1 class="tg-404__title"><?php esc_html_e('Oops! Page Not Found', 'toolsgallery'); ?></h1>
    <p class="tg-404__desc"><?php esc_html_e("The page you're looking for doesn't exist or has been moved. Try searching below or browse our free tools.", 'toolsgallery'); ?></p>

    <!-- Search Box -->
    <div class="tg-404__search">
      <?php get_search_form(); ?>
    </div>

    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin:1.5rem 0;">
      <a class="tg-btn tg-btn--primary tg-btn--lg" href="<?php echo esc_url(home_url('/')); ?>">
        <?php esc_html_e('Go Home', 'toolsgallery'); ?>
      </a>
      <a class="tg-btn tg-btn--outline tg-btn--lg" href="<?php echo esc_url(home_url('/tools/')); ?>">
        <?php esc_html_e('Browse All Tools', 'toolsgallery'); ?>
      </a>
    </div>

    <!-- Quick links to categories -->
    <div class="tg-404__categories">
      <h2><?php esc_html_e('Browse Tool Categories', 'toolsgallery'); ?></h2>
      <div class="tg-404__cat-grid">
        <?php
        $cat_links = [
          'PDF Tools'     => '/tools/pdf-tools/',
          'Image Tools'   => '/tools/image-tools/',
          'AI Tools'      => '/tools/ai-tools/',
          'Video Tools'   => '/tools/video-tools/',
          'File Tools'    => '/tools/file-tools/',
          'Utility Tools' => '/tools/utility-tools/',
        ];
        foreach ($cat_links as $label => $path) :
        ?>
          <a class="tg-btn tg-btn--outline" href="<?php echo esc_url(home_url($path)); ?>">
            <?php echo esc_html($label); ?>
          </a>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- Popular Tools Quick Links -->
    <div class="tg-404__popular">
      <h2><?php esc_html_e('Popular Free Tools', 'toolsgallery'); ?></h2>
      <ul class="tg-404__tool-list">
        <?php
        $popular_tools = [
          'Merge PDF'          => '/tool/merge-pdf/',
          'Compress PDF'       => '/tool/compress-pdf/',
          'JPG to PDF'         => '/tool/jpg-to-pdf/',
          'Remove Background'  => '/tool/background-remover/',
          'Compress Image'     => '/tool/compress-image/',
          'Grammar Checker'    => '/tool/grammar-checker/',
        ];
        foreach ($popular_tools as $name => $path) :
        ?>
          <li><a href="<?php echo esc_url(home_url($path)); ?>"><?php echo esc_html($name); ?> &rarr;</a></li>
        <?php endforeach; ?>
      </ul>
      <p><a href="<?php echo esc_url(home_url('/sitemap-page/')); ?>"><?php esc_html_e('View all tools in our sitemap &rarr;', 'toolsgallery'); ?></a></p>
    </div>
  </div>
</div>

<?php get_footer(); ?>

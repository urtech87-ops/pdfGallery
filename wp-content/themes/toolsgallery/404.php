<?php get_header(); ?>

<div class="tg-container">
  <div class="tg-404">
    <div class="tg-404__code" aria-hidden="true">404</div>
    <h1 class="tg-404__title"><?php esc_html_e('Page Not Found', 'toolsgallery'); ?></h1>
    <p class="tg-404__desc"><?php esc_html_e('The page you\'re looking for doesn\'t exist or has been moved.', 'toolsgallery'); ?></p>
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
      <a class="tg-btn tg-btn--primary tg-btn--lg" href="<?php echo esc_url(home_url('/')); ?>">
        <?php esc_html_e('Go Home', 'toolsgallery'); ?>
      </a>
      <a class="tg-btn tg-btn--outline tg-btn--lg" href="<?php echo esc_url(home_url('/tools/')); ?>">
        <?php esc_html_e('Browse Tools', 'toolsgallery'); ?>
      </a>
    </div>
  </div>
</div>

<?php get_footer(); ?>

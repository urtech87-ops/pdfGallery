<?php
if (!is_active_sidebar('main-sidebar') && !is_active_sidebar('adsense-sidebar')) {
    return;
}
?>

<div class="tg-sidebar">
  <?php if (is_active_sidebar('adsense-sidebar')) : ?>
    <div><?php dynamic_sidebar('adsense-sidebar'); ?></div>
  <?php endif; ?>

  <?php if (is_active_sidebar('main-sidebar')) : ?>
    <?php dynamic_sidebar('main-sidebar'); ?>
  <?php else : ?>
    <!-- Default sidebar content when no widgets added -->
    <div class="tg-widget">
      <h3 class="tg-widget__title"><?php esc_html_e('Popular Tools', 'toolsgallery'); ?></h3>
      <ul style="display:flex;flex-direction:column;gap:0.625rem;">
        <?php
        $popular_tools = [
          __('Merge PDF', 'toolsgallery')        => '/tool/merge-pdf/',
          __('Compress PDF', 'toolsgallery')     => '/tool/compress-pdf/',
          __('PDF to Word', 'toolsgallery')      => '/tool/pdf-to-word/',
          __('Background Remover', 'toolsgallery') => '/tool/background-remover/',
          __('Compress Image', 'toolsgallery')   => '/tool/compress-image/',
        ];
        foreach ($popular_tools as $label => $path) :
        ?>
          <li>
            <a href="<?php echo esc_url(home_url($path)); ?>" style="font-size:0.875rem;color:var(--color-gray-700);display:flex;align-items:center;gap:0.375rem;transition:color var(--transition);" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-gray-700)'">
              <span aria-hidden="true">→</span> <?php echo esc_html($label); ?>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  <?php endif; ?>
</div>

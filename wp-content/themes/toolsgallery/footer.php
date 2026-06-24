</main><!-- #main-content -->

<footer class="tg-footer" role="contentinfo">
  <div class="tg-container">
    <div class="tg-footer__grid">

      <!-- Col 1: Brand -->
      <div class="tg-footer__col">
        <div class="tg-footer__logo">
          <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/logo.svg'); ?>" width="32" height="32" alt="">
          <span class="tg-footer__logo-text"><?php bloginfo('name'); ?></span>
        </div>
        <p class="tg-footer__tagline"><?php esc_html_e('150+ Free Online Tools — No Signup Required', 'toolsgallery'); ?></p>
        <p class="tg-footer__desc"><?php esc_html_e('Fast, free, and privacy-friendly tools for PDF, images, AI writing, video, files and more — your files never leave your device.', 'toolsgallery'); ?></p>
      </div>

      <!-- Col 2: PDF Tools -->
      <div class="tg-footer__col">
        <h3 class="tg-footer__col-title"><?php esc_html_e('PDF Tools', 'toolsgallery'); ?></h3>
        <ul class="tg-footer__links">
          <?php
          $pdf_tools = [
            __('Merge PDF', 'toolsgallery')    => '/tool/merge-pdf/',
            __('Split PDF', 'toolsgallery')    => '/tool/split-pdf/',
            __('Compress PDF', 'toolsgallery') => '/tool/compress-pdf/',
            __('PDF to Word', 'toolsgallery')  => '/tool/pdf-to-word/',
            __('PDF to JPG', 'toolsgallery')   => '/tool/pdf-to-jpg/',
            __('All PDF Tools', 'toolsgallery') => '/tools/',
          ];
          foreach ($pdf_tools as $label => $path) :
          ?>
            <li><a class="tg-footer__link" href="<?php echo esc_url(home_url($path)); ?>"><?php echo esc_html($label); ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>

      <!-- Col 3: Image Tools -->
      <div class="tg-footer__col">
        <h3 class="tg-footer__col-title"><?php esc_html_e('Image Tools', 'toolsgallery'); ?></h3>
        <ul class="tg-footer__links">
          <?php
          $image_tools = [
            __('Background Remover', 'toolsgallery') => '/tool/background-remover/',
            __('Compress Image', 'toolsgallery')     => '/tool/compress-image/',
            __('Resize Image', 'toolsgallery')       => '/tool/resize-image/',
            __('JPG to PNG', 'toolsgallery')         => '/tool/jpg-to-png/',
            __('All Image Tools', 'toolsgallery')    => '/tools/',
          ];
          foreach ($image_tools as $label => $path) :
          ?>
            <li><a class="tg-footer__link" href="<?php echo esc_url(home_url($path)); ?>"><?php echo esc_html($label); ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>

      <!-- Col 4: Company -->
      <div class="tg-footer__col">
        <h3 class="tg-footer__col-title"><?php esc_html_e('Company', 'toolsgallery'); ?></h3>
        <ul class="tg-footer__links">
          <?php
          $company = [
            __('About', 'toolsgallery')            => '/about/',
            __('Blog', 'toolsgallery')             => '/blog/',
            __('Contact', 'toolsgallery')          => '/contact/',
            __('Privacy Policy', 'toolsgallery')   => '/privacy-policy/',
            __('Terms & Conditions', 'toolsgallery') => '/terms-and-conditions/',
          ];
          foreach ($company as $label => $path) :
          ?>
            <li><a class="tg-footer__link" href="<?php echo esc_url(home_url($path)); ?>"><?php echo esc_html($label); ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>

    </div><!-- .tg-footer__grid -->

    <!-- Trust Signals (D2 E-E-A-T) -->
    <div class="tg-trust-signals">
      <span>&#x1F512; <?php esc_html_e('Privacy First — Files Never Uploaded', 'toolsgallery'); ?></span>
      <span>&#x26A1; <?php esc_html_e('150+ Free Tools', 'toolsgallery'); ?></span>
      <span>&#x2705; <?php esc_html_e('No Signup Required', 'toolsgallery'); ?></span>
      <span>&#x1F310; <?php esc_html_e('Works in Any Browser', 'toolsgallery'); ?></span>
    </div>

    <div class="tg-footer__bottom">
      <span class="tg-footer__copyright">
        &copy; <?php echo esc_html(gmdate('Y')); ?> <?php bloginfo('name'); ?>. <?php esc_html_e('All rights reserved.', 'toolsgallery'); ?>
      </span>
      <span class="tg-footer__bottom-tagline"><a href="<?php echo esc_url(home_url('/sitemap-page/')); ?>"><?php esc_html_e('Sitemap', 'toolsgallery'); ?></a> &mdash; <?php esc_html_e('Free tools for everyone', 'toolsgallery'); ?></span>
    </div>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>

<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="profile" href="https://gmpg.org/xfn/11">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="tg-skip-link" href="#main-content"><?php esc_html_e('Skip to content', 'toolsgallery'); ?></a>

<header class="tg-header" role="banner">
  <div class="tg-container tg-header__inner">

    <!-- Logo -->
    <a href="<?php echo esc_url(home_url('/')); ?>" class="tg-logo" aria-label="Tool Acadmy">
      <div class="tg-logo-icon" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
          <rect width="40" height="40" rx="10" fill="#F97316"/>
          <rect x="6" y="9" width="28" height="6" rx="3" fill="white"/>
          <rect x="15" y="15" width="10" height="18" rx="5" fill="white"/>
          <circle cx="34" cy="9" r="4" fill="white" opacity="0.85"/>
          <circle cx="34" cy="9" r="2" fill="#F97316"/>
        </svg>
      </div>
      <span class="tg-logo-text">Tool<span class="tg-logo-accent">Acadmy</span></span>
    </a>

    <!-- Desktop nav -->
    <nav class="tg-header__nav" aria-label="<?php esc_attr_e('Primary navigation', 'toolsgallery'); ?>">
      <?php
      wp_nav_menu([
        'theme_location' => 'primary-menu',
        'menu_class'     => 'tg-nav__list',
        'container'      => false,
        'fallback_cb'    => 'tg_fallback_nav',
        'link_class'     => 'tg-nav__link',
      ]);
      ?>
    </nav>

    <!-- Theme Toggle -->
    <button class="tg-theme-toggle" aria-label="<?php esc_attr_e('Toggle dark mode', 'toolsgallery'); ?>" title="Toggle dark/light mode"></button>

    <!-- CTA -->
    <a class="tg-header__cta-btn" href="<?php echo esc_url(home_url('/tools/')); ?>">
      <?php esc_html_e('Try Free Tools', 'toolsgallery'); ?>
    </a>

    <!-- Mobile menu button -->
    <button class="tg-mobile-menu-btn" id="tg-mobile-menu-btn" aria-label="<?php esc_attr_e('Open menu', 'toolsgallery'); ?>" aria-expanded="false" aria-controls="tg-mobile-menu">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 5h16M3 11h16M3 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

  </div>
</header>

<!-- Mobile overlay -->
<div class="tg-mobile-overlay" id="tg-mobile-overlay" aria-hidden="true"></div>

<!-- Mobile drawer -->
<div class="tg-mobile-menu" id="tg-mobile-menu" role="dialog" aria-label="<?php esc_attr_e('Navigation menu', 'toolsgallery'); ?>" aria-hidden="true">

  <div class="tg-mobile-menu-header">
    <a href="<?php echo esc_url(home_url('/')); ?>" class="tg-logo">
      <div class="tg-logo-icon">
        <svg viewBox="0 0 40 40" fill="none" width="32" height="32">
          <rect width="40" height="40" rx="10" fill="#F97316"/>
          <rect x="6" y="9" width="28" height="6" rx="3" fill="white"/>
          <rect x="15" y="15" width="10" height="18" rx="5" fill="white"/>
          <circle cx="34" cy="9" r="4" fill="white" opacity="0.85"/>
          <circle cx="34" cy="9" r="2" fill="#F97316"/>
        </svg>
      </div>
      <span class="tg-logo-text">Tool<span class="tg-logo-accent">Acadmy</span></span>
    </a>
    <button class="tg-mobile-close-btn" id="tg-mobile-close-btn" aria-label="<?php esc_attr_e('Close menu', 'toolsgallery'); ?>">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <nav class="tg-mobile-nav">
    <?php
    $tg_mobile_pages = [
      __('Home', 'toolsgallery')    => home_url('/'),
      __('Tools', 'toolsgallery')   => home_url('/tools/'),
      __('Blog', 'toolsgallery')    => home_url('/blog/'),
      __('About', 'toolsgallery')   => home_url('/about/'),
      __('Contact', 'toolsgallery') => home_url('/contact/'),
    ];
    foreach ($tg_mobile_pages as $label => $url) :
      $req_path  = rtrim(parse_url(esc_url_raw(wp_unslash($_SERVER['REQUEST_URI'] ?? '')), PHP_URL_PATH), '/');
      $link_path = rtrim(parse_url($url, PHP_URL_PATH), '/');
      $active    = ($req_path === $link_path) ? ' tg-mobile-nav-active' : '';
    ?>
    <a href="<?php echo esc_url($url); ?>" class="tg-mobile-nav-link<?php echo esc_attr($active); ?>"><?php echo esc_html($label); ?></a>
    <?php endforeach; ?>
  </nav>

  <div class="tg-mobile-menu-footer">
    <a href="<?php echo esc_url(home_url('/tools/')); ?>" class="tg-btn tg-btn-primary" style="width:100%;text-align:center;justify-content:center;"><?php esc_html_e('Try Free Tools', 'toolsgallery'); ?></a>
    <div class="tg-mobile-theme-row">
      <span><?php esc_html_e('Theme', 'toolsgallery'); ?></span>
      <button class="tg-theme-toggle" aria-label="<?php esc_attr_e('Toggle theme', 'toolsgallery'); ?>"></button>
    </div>
  </div>

</div>

<?php
// Breadcrumbs — output once from here only; the function itself skips homepage/blog-listing
if (!is_front_page()) {
    tg_breadcrumbs();
}
?>

<main id="main-content" class="tg-main" role="main">
<?php
// Fallback nav helpers
function tg_fallback_nav() {
    echo '<ul class="tg-nav__list">';
    echo '<li><a class="tg-nav__link" href="' . esc_url(home_url('/')) . '">' . esc_html__('Home', 'toolsgallery') . '</a></li>';
    echo '<li><a class="tg-nav__link" href="' . esc_url(home_url('/tools/')) . '">' . esc_html__('Tools', 'toolsgallery') . '</a></li>';
    echo '<li><a class="tg-nav__link" href="' . esc_url(home_url('/blog/')) . '">' . esc_html__('Blog', 'toolsgallery') . '</a></li>';
    echo '<li><a class="tg-nav__link" href="' . esc_url(home_url('/about/')) . '">' . esc_html__('About', 'toolsgallery') . '</a></li>';
    echo '<li><a class="tg-nav__link" href="' . esc_url(home_url('/contact/')) . '">' . esc_html__('Contact', 'toolsgallery') . '</a></li>';
    echo '</ul>';
}

function tg_fallback_mobile_nav() {
    $links = [
        __('Home', 'toolsgallery')    => home_url('/'),
        __('Tools', 'toolsgallery')   => home_url('/tools/'),
        __('Blog', 'toolsgallery')    => home_url('/blog/'),
        __('About', 'toolsgallery')   => home_url('/about/'),
        __('Contact', 'toolsgallery') => home_url('/contact/'),
    ];
    foreach ($links as $label => $url) {
        echo '<a class="tg-mobile-nav__link" href="' . esc_url($url) . '">' . esc_html($label) . '</a>';
    }
}

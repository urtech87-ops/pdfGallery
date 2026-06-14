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
    <a class="tg-header__logo" href="<?php echo esc_url(home_url('/')); ?>" aria-label="<?php bloginfo('name'); ?> – <?php esc_attr_e('Home', 'toolsgallery'); ?>">
      <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/logo.svg'); ?>" width="36" height="36" alt="" aria-hidden="true">
      <span class="tg-header__logo-text"><?php bloginfo('name'); ?></span>
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

    <!-- CTA -->
    <a class="tg-header__cta-btn" href="<?php echo esc_url(home_url('/tools/')); ?>">
      <?php esc_html_e('Try Free Tools', 'toolsgallery'); ?>
    </a>

    <!-- Hamburger -->
    <button class="tg-header__hamburger" aria-label="<?php esc_attr_e('Open menu', 'toolsgallery'); ?>" aria-expanded="false" aria-controls="tg-mobile-nav">
      <span></span>
      <span></span>
      <span></span>
    </button>

  </div>
</header>

<!-- Mobile nav overlay -->
<nav class="tg-mobile-nav" id="tg-mobile-nav" aria-label="<?php esc_attr_e('Mobile navigation', 'toolsgallery'); ?>">
  <?php
  wp_nav_menu([
    'theme_location' => 'primary-menu',
    'menu_class'     => 'tg-mobile-nav__menu',
    'container'      => false,
    'fallback_cb'    => 'tg_fallback_mobile_nav',
    'link_class'     => 'tg-mobile-nav__link',
  ]);
  ?>
  <a class="tg-mobile-nav__cta" href="<?php echo esc_url(home_url('/tools/')); ?>">
    <?php esc_html_e('Try Free Tools', 'toolsgallery'); ?>
  </a>
</nav>

<?php
// Breadcrumbs — not shown on front page or 404
if (!is_front_page() && !is_404()) {
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

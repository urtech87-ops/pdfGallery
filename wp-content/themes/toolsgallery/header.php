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

  <!-- Header -->
  <div class="tg-mobile-menu__head">
    <a href="<?php echo esc_url(home_url('/')); ?>" class="tg-logo">
      <div class="tg-logo-icon">
        <svg viewBox="0 0 40 40" fill="none" width="32" height="32">
          <rect width="40" height="40" rx="10" fill="#F97316"/>
          <rect x="6" y="9" width="28" height="6" rx="3" fill="white"/>
          <rect x="15" y="15" width="10" height="18" rx="5" fill="white"/>
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

  <!-- Search -->
  <div class="tg-mobile-menu__search">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
    <input type="text" placeholder="<?php esc_attr_e('Search tools...', 'toolsgallery'); ?>" class="tg-mobile-search-input" id="tg-mobile-search"/>
  </div>

  <!-- Nav -->
  <nav class="tg-mobile-nav">
    <a href="<?php echo esc_url(home_url('/')); ?>" class="tg-mobile-nav__link"><?php esc_html_e('Home', 'toolsgallery'); ?></a>
    <a href="<?php echo esc_url(home_url('/blog/')); ?>" class="tg-mobile-nav__link"><?php esc_html_e('Blog', 'toolsgallery'); ?></a>
    <a href="<?php echo esc_url(home_url('/about/')); ?>" class="tg-mobile-nav__link"><?php esc_html_e('About', 'toolsgallery'); ?></a>
    <a href="<?php echo esc_url(home_url('/contact/')); ?>" class="tg-mobile-nav__link"><?php esc_html_e('Contact', 'toolsgallery'); ?></a>

    <div class="tg-mobile-nav__divider"><?php esc_html_e('Tools by Category', 'toolsgallery'); ?></div>

    <?php
    $tg_mob_cats = get_terms([
        'taxonomy'   => 'tool_category',
        'hide_empty' => true,
        'orderby'    => 'count',
        'order'      => 'DESC',
    ]);
    $tg_cat_colors = [
        'pdf-tools'     => '#EF4444',
        'image-tools'   => '#8B5CF6',
        'ai-tools'      => '#22C55E',
        'video-tools'   => '#F97316',
        'file-tools'    => '#3B82F6',
        'utility-tools' => '#F59E0B',
    ];
    if (!is_wp_error($tg_mob_cats)) :
        foreach ($tg_mob_cats as $tg_mob_cat) :
            $tg_mob_color = $tg_cat_colors[$tg_mob_cat->slug] ?? '#F97316';
            $tg_mob_tools = get_posts([
                'post_type'      => 'tg_tool',
                'posts_per_page' => 8,
                'post_status'    => 'publish',
                'tax_query'      => [[
                    'taxonomy' => 'tool_category',
                    'field'    => 'term_id',
                    'terms'    => $tg_mob_cat->term_id,
                ]],
            ]);
    ?>
    <div class="tg-mobile-cat" data-cat="<?php echo esc_attr($tg_mob_cat->slug); ?>">
      <button class="tg-mobile-cat__btn" aria-expanded="false">
        <span class="tg-mobile-cat__dot" style="background:<?php echo esc_attr($tg_mob_color); ?>"></span>
        <span class="tg-mobile-cat__name"><?php echo esc_html($tg_mob_cat->name); ?></span>
        <span class="tg-mobile-cat__count"><?php echo esc_html($tg_mob_cat->count); ?></span>
        <svg class="tg-mobile-cat__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="tg-mobile-cat__tools" hidden>
        <?php foreach ($tg_mob_tools as $tg_mob_tool) : ?>
        <a href="<?php echo esc_url(get_permalink($tg_mob_tool->ID)); ?>" class="tg-mobile-cat__tool">
          <?php echo esc_html($tg_mob_tool->post_title); ?>
        </a>
        <?php endforeach; ?>
        <a href="<?php echo esc_url(get_term_link($tg_mob_cat)); ?>" class="tg-mobile-cat__viewall">
          <?php printf(esc_html__('View all %d tools &rarr;', 'toolsgallery'), (int) $tg_mob_cat->count); ?>
        </a>
      </div>
    </div>
    <?php
        endforeach;
    endif;
    ?>
  </nav>

  <!-- Footer -->
  <div class="tg-mobile-menu__foot">
    <a href="<?php echo esc_url(home_url('/tools/')); ?>" class="tg-btn tg-btn-primary" style="width:100%;text-align:center;justify-content:center;display:flex;">
      <?php esc_html_e('Try Free Tools', 'toolsgallery'); ?>
    </a>
    <div class="tg-mobile-theme-row">
      <span><?php esc_html_e('Switch Theme', 'toolsgallery'); ?></span>
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

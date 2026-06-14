<?php get_header(); ?>

<?php while (have_posts()) : the_post();
  $tool_type    = get_post_meta(get_the_ID(), '_tg_tool_type', true);
  $action_label = get_post_meta(get_the_ID(), '_tg_action_label', true) ?: __('Run Tool', 'toolsgallery');
  $accept_types = get_post_meta(get_the_ID(), '_tg_accept_types', true) ?: 'application/pdf,.pdf';
  $handler      = get_post_meta(get_the_ID(), '_tg_handler', true);
  $faqs_raw     = get_post_meta(get_the_ID(), '_tg_faqs', true);
  $features_raw = get_post_meta(get_the_ID(), '_tg_features', true);
  $steps_raw    = get_post_meta(get_the_ID(), '_tg_steps', true);
  $related_ids  = array_filter(array_map('absint', explode(',', get_post_meta(get_the_ID(), '_tg_related', true))));

  $faqs     = $faqs_raw     ? json_decode($faqs_raw, true)     : [];
  $features = $features_raw ? json_decode($features_raw, true) : [];
  $steps    = $steps_raw    ? json_decode($steps_raw, true)    : [];

  $terms = get_the_terms(get_the_ID(), 'tool_category');
  $cat   = ($terms && !is_wp_error($terms)) ? $terms[0] : null;
?>

<!-- Tool Hero -->
<div class="tg-tool-hero">
  <div class="tg-container">
    <div class="tg-tool-hero__inner">
      <div class="tg-tool-hero__icon" aria-hidden="true">
        <?php echo esc_html(get_post_meta(get_the_ID(), '_tg_icon', true) ?: '🔧'); ?>
      </div>
      <div class="tg-tool-hero__meta">
        <?php if ($cat) : ?>
          <div class="tg-tool-hero__cat">
            <a href="<?php echo esc_url(get_term_link($cat)); ?>" style="color:inherit;"><?php echo esc_html($cat->name); ?></a>
          </div>
        <?php endif; ?>
        <h1 class="tg-tool-hero__title"><?php the_title(); ?></h1>
        <?php if (has_excerpt()) : ?>
          <p class="tg-tool-hero__desc"><?php the_excerpt(); ?></p>
        <?php endif; ?>
      </div>
    </div>
  </div>
</div>

<!-- Tool Runner -->
<div class="tg-container">
  <div class="tg-tool-runner" role="region" aria-label="<?php esc_attr_e('Tool Interface', 'toolsgallery'); ?>">
    <div class="tg-tool-runner__body">

      <?php if ($tool_type === 'ai') : ?>
        <!-- AI Tool Interface -->
        <form class="tg-ai-form" novalidate>
          <label for="tg-ai-input" style="display:block;font-weight:600;font-size:0.9375rem;color:var(--color-gray-700);margin-bottom:0.5rem;">
            <?php esc_html_e('Enter your text below:', 'toolsgallery'); ?>
          </label>
          <textarea class="tg-ai-input" id="tg-ai-input" placeholder="<?php esc_attr_e('Paste or type your text here…', 'toolsgallery'); ?>" rows="6"></textarea>
          <div class="tg-tool-actions">
            <button type="button" class="tg-btn tg-btn--primary tg-ai-run-btn">
              <?php echo esc_html($action_label); ?>
            </button>
            <button type="button" class="tg-btn tg-btn--ghost tg-ai-copy-btn">
              <?php esc_html_e('Copy Result', 'toolsgallery'); ?>
            </button>
          </div>
        </form>
        <div class="tg-ai-output" aria-live="polite"></div>

      <?php else : ?>
        <!-- File Tool Interface -->
        <div class="tg-dropzone" role="button" tabindex="0" aria-label="<?php esc_attr_e('Click or drag files here', 'toolsgallery'); ?>">
          <input class="tg-dropzone__input" type="file" accept="<?php echo esc_attr($accept_types); ?>" multiple aria-label="<?php esc_attr_e('Select files', 'toolsgallery'); ?>">
          <div class="tg-dropzone__icon" aria-hidden="true">📂</div>
          <div class="tg-dropzone__title">
            <?php esc_html_e('Drag & drop files here', 'toolsgallery'); ?>
          </div>
          <p class="tg-dropzone__hint">
            <?php esc_html_e('or', 'toolsgallery'); ?> <span class="tg-dropzone__browse"><?php esc_html_e('browse files', 'toolsgallery'); ?></span>
          </p>
        </div>

        <div class="tg-file-list" aria-live="polite"></div>

        <div class="tg-progress" aria-live="polite">
          <div class="tg-progress__bar-track">
            <div class="tg-progress__bar-fill" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
          </div>
          <div class="tg-progress__label"><?php esc_html_e('Processing…', 'toolsgallery'); ?></div>
        </div>

        <div class="tg-tool-result" aria-live="polite"></div>

        <div class="tg-tool-actions">
          <button type="button" class="tg-btn tg-btn--primary tg-run-btn" data-handler="<?php echo esc_attr($handler); ?>">
            <?php echo esc_html($action_label); ?>
          </button>
        </div>
      <?php endif; ?>

    </div>
  </div>

  <!-- In-content ad after tool -->
  <?php echo tg_ad_slot('tool-in-content', 'in-content'); // phpcs:ignore WordPress.Security.EscapeOutput ?>

  <!-- Tool content layout -->
  <div class="tg-tool-content">
    <div class="tg-tool-content__layout">
      <div class="tg-tool-content__main">

        <!-- Tool description content -->
        <?php if (get_the_content()) : ?>
          <div class="tg-entry__content">
            <?php the_content(); ?>
          </div>
        <?php endif; ?>

        <!-- How it works -->
        <?php if (!empty($steps)) : ?>
          <div>
            <h2 class="tg-tool-content__title"><?php esc_html_e('How It Works', 'toolsgallery'); ?></h2>
            <div class="tg-steps">
              <?php foreach ($steps as $i => $step) : ?>
                <div class="tg-step">
                  <div class="tg-step__number" aria-hidden="true"><?php echo esc_html($i + 1); ?></div>
                  <div class="tg-step__title"><?php echo esc_html($step['step'] ?? ''); ?></div>
                  <div class="tg-step__desc"><?php echo esc_html($step['desc'] ?? ''); ?></div>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endif; ?>

        <!-- Features -->
        <?php if (!empty($features)) : ?>
          <div>
            <h2 class="tg-tool-content__title"><?php esc_html_e('Features', 'toolsgallery'); ?></h2>
            <div class="tg-features-grid">
              <?php foreach ($features as $feature) : ?>
                <div class="tg-feature-card">
                  <?php if (!empty($feature['icon'])) : ?>
                    <div class="tg-feature-card__icon" aria-hidden="true"><?php echo esc_html($feature['icon']); ?></div>
                  <?php endif; ?>
                  <div class="tg-feature-card__title"><?php echo esc_html($feature['title'] ?? ''); ?></div>
                  <div class="tg-feature-card__desc"><?php echo esc_html($feature['desc'] ?? ''); ?></div>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endif; ?>

        <!-- FAQ -->
        <?php if (!empty($faqs)) : ?>
          <div>
            <h2 class="tg-tool-content__title"><?php esc_html_e('Frequently Asked Questions', 'toolsgallery'); ?></h2>
            <div class="tg-faq" itemscope itemtype="https://schema.org/FAQPage">
              <?php foreach ($faqs as $faq) : ?>
                <div class="tg-faq__item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                  <button class="tg-faq__question" itemprop="name" aria-expanded="false">
                    <?php echo esc_html($faq['q'] ?? ''); ?>
                    <span class="tg-faq__icon" aria-hidden="true">+</span>
                  </button>
                  <div class="tg-faq__answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                    <div itemprop="text"><?php echo wp_kses_post($faq['a'] ?? ''); ?></div>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endif; ?>

        <!-- Related Tools -->
        <?php if (!empty($related_ids)) : ?>
          <div>
            <h2 class="tg-tool-content__title"><?php esc_html_e('Related Tools', 'toolsgallery'); ?></h2>
            <div class="tg-related-tools">
              <?php
              $related_posts = get_posts(['post_type' => 'tg_tool', 'post__in' => $related_ids, 'posts_per_page' => 6, 'orderby' => 'post__in']);
              foreach ($related_posts as $rt) :
                $rt_icon = get_post_meta($rt->ID, '_tg_icon', true) ?: '🔧';
              ?>
                <a class="tg-tool-card" href="<?php echo esc_url(get_permalink($rt)); ?>">
                  <div class="tg-tool-card__icon" aria-hidden="true"><?php echo esc_html($rt_icon); ?></div>
                  <div class="tg-tool-card__title"><?php echo esc_html($rt->post_title); ?></div>
                </a>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endif; ?>

      </div><!-- .tg-tool-content__main -->

      <!-- Sidebar -->
      <aside class="tg-tool-content__sidebar" aria-label="<?php esc_attr_e('Tool sidebar', 'toolsgallery'); ?>">
        <?php echo tg_ad_slot('tool-sidebar', 'rectangle'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
        <?php get_sidebar(); ?>
      </aside>

    </div>
  </div>
</div><!-- .tg-container -->

<?php endwhile; ?>

<?php get_footer(); ?>

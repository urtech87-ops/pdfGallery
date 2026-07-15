<?php
/**
 * Template: Single Tool Page (tg_tool CPT)
 * Phase 2: SEO, AdSense, tool UI shells
 */

get_header();

while (have_posts()):
    the_post();

    $post_id = get_the_ID();
    $tg_cats = wp_get_post_terms($post_id, 'tool_category');
    $tg_cat_slug = (!empty($tg_cats) && !is_wp_error($tg_cats)) ? $tg_cats[0]->slug : 'default';
    echo '<script>document.body.dataset.category = \'' . esc_js($tg_cat_slug) . '\';</script>' . "\n";
    $tool_type = get_post_meta($post_id, '_tg_tool_type', true) ?: 'browser';
    $action_label = get_post_meta($post_id, '_tg_action_label', true) ?: __('Process File', 'toolsgallery');
    $accept_types = get_post_meta($post_id, '_tg_accept_types', true) ?: '';
    $handler = get_post_meta($post_id, '_tg_handler', true);
    /* Tools with no stored accept types fall back to their category's
       file family so valid uploads aren't rejected by validation. */
    if (!$accept_types) {
        if ($tg_cat_slug === 'image-tools') {
            $accept_types = 'image/*';
        } elseif ($tg_cat_slug === 'video-tools') {
            $accept_types = 'video/*';
        } elseif ($tg_cat_slug === 'pdf-tools') {
            $accept_types = '.pdf';
        }
    }
    $faqs_raw = get_post_meta($post_id, '_tg_faqs', true);
    $features_raw = get_post_meta($post_id, '_tg_features', true);
    $steps_raw = get_post_meta($post_id, '_tg_steps', true);
    $related_raw = get_post_meta($post_id, '_tg_related', true);
    $multi_file = get_post_meta($post_id, '_tg_multi_file', true) === 'true';
    /* These tools cannot work with a single image — force multi upload
       regardless of stored meta. */
    if (in_array($handler, ['img-combine', 'img-collage'], true)) {
        $multi_file = true;
    }
    $input_format = get_post_meta($post_id, '_tg_input_format', true) ?: '';
    $output_format = get_post_meta($post_id, '_tg_output_format', true) ?: '';

    $faqs = $faqs_raw ? json_decode($faqs_raw, true) : [];
    $features = $features_raw ? json_decode($features_raw, true) : [];
    $steps = $steps_raw ? json_decode($steps_raw, true) : [];
    $related_ids = array_filter(array_map('absint', explode(',', $related_raw)));

    $terms = get_the_terms($post_id, 'tool_category');
    $cat = ($terms && !is_wp_error($terms)) ? $terms[0] : null;
    ?>

    <!-- Leaderboard ad — desktop only -->
    <div class="tg-leaderboard-wrap">
        <div class="tg-container">
            <?php echo tg_ad_slot('tool-leaderboard', 'leaderboard'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
        </div>
    </div>

    <div class="tg-container">
        <div class="tg-tool-page-layout">

            <!-- ================================================================
             MAIN COLUMN
             ================================================================ -->
            <main class="tg-tool-page-main" id="main-tool-content">

                <!-- 1. H1 -->
                <?php if ($cat): ?>
                    <div class="tg-tool-cat-badge">
                        <a href="<?php echo esc_url(get_term_link($cat)); ?>">
                            <?php echo tg_get_category_icon($cat->slug); // phpcs:ignore WordPress.Security.EscapeOutput ?>
                            <?php echo esc_html(strtoupper($cat->name)); ?>
                        </a>
                    </div>
                <?php endif; ?>
                <h1 class="tg-tool-title"><?php the_title(); ?></h1>

                <!-- 2. Quick Answer Box (D1 — Featured Snippet + AEO) -->
                <div class="tg-quick-answer" itemscope itemtype="https://schema.org/HowTo">
                    <p itemprop="description">
                        <strong><?php the_title(); ?></strong> is a free online tool by Tool Acadmy.
                        <?php if (has_excerpt()): ?>        <?php echo wp_kses_post(get_the_excerpt()); ?>    <?php endif; ?>
                        No signup required. Works in any browser.
                    </p>
                </div>

                <!-- 2b. Definition Box (AEO — AI assistants + featured snippets) -->
                <div class="tg-definition-box">
                    <strong>What is <?php the_title(); ?>?</strong>
                    <p>
                        <?php the_title(); ?> is a free online tool that
                        <?php echo has_excerpt() ? strtolower(wp_strip_all_tags(get_the_excerpt())) : 'helps you process files quickly and easily.'; ?>
                        Tool Acadmy's <?php the_title(); ?> runs entirely in your web browser — no software installation or
                        account required.
                    </p>
                </div>

                <!-- 2c. Trust meta bar -->
                <div class="tg-tool-meta-bar">
                    <span class="tg-tool-meta-item">&#x2705; Free Forever</span>
                    <span class="tg-tool-meta-item">&#x1F512; Files Stay on Your Device</span>
                    <span class="tg-tool-meta-item">&#x26A1; No Signup Required</span>
                    <span class="tg-tool-meta-item">&#x1F310; Works in Any Browser</span>
                </div>

                <!-- 3. TOOL UI BOX -->
                <?php if ($tool_type === 'url-input'): ?>

                    <!-- URL Input Tool Box -->
                    <div class="tg-tool-box" data-tool-type="url-input" data-handler="<?php echo esc_attr($handler); ?>"
                        data-accept="">

                        <div class="tg-url-input-box" style="margin-bottom:16px;">
                            <label for="tg-url-field"
                                style="display:block;font-weight:600;margin-bottom:6px;"><?php esc_html_e('Enter website URL', 'toolsgallery'); ?></label>
                            <div class="tg-url-input-wrap"
                                style="display:flex;align-items:center;border:1px solid #ccc;border-radius:6px;overflow:hidden;">
                                <span class="tg-url-prefix"
                                    style="padding:0 10px;background:#f5f5f5;font-size:18px;line-height:42px;">&#127760;</span>
                                <input type="url" class="tg-url-input" id="tg-url-field" placeholder="https://example.com"
                                    pattern="https?://.+" autocomplete="url"
                                    style="flex:1;border:none;padding:10px;font-size:15px;outline:none;">
                            </div>
                            <p class="tg-url-hint" style="font-size:13px;color:#666;margin:4px 0 0;">
                                <?php esc_html_e('Enter the full URL including https://', 'toolsgallery'); ?></p>
                        </div>

                        <div class="tg-options" hidden></div>

                        <button class="tg-action-btn" disabled>
                            <?php echo esc_html($action_label); ?>
                        </button>

                        <div class="tg-progress" hidden>
                            <div class="tg-progress-track">
                                <div class="tg-progress-bar"></div>
                            </div>
                            <span class="tg-progress-label"><?php esc_html_e('Fetching page...', 'toolsgallery'); ?></span>
                        </div>

                        <div class="tg-result" hidden>
                            <div class="tg-success-banner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                                    aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <?php esc_html_e('Page fetched! Follow the steps in the print window to save as PDF.', 'toolsgallery'); ?>
                            </div>
                            <div class="tg-error-banner" hidden>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                    aria-hidden="true">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span class="tg-error-msg"></span>
                            </div>
                            <a href="#" class="tg-reset"><?php esc_html_e('Convert another URL', 'toolsgallery'); ?></a>
                        </div>

                        <?php wp_nonce_field('tg_tool_nonce', 'tg_nonce'); ?>
                    </div>

                <?php elseif ($tool_type === 'data-input'): ?>

                    <!-- Data-input Tool Box (no file upload — e.g. Chart Maker, QR Code) -->
                    <div class="tg-tool-box" data-tool-type="data-input" data-handler="<?php echo esc_attr($handler); ?>"
                        data-accept="" data-multi="false">

                        <div class="tg-options" hidden></div>

                        <button class="tg-action-btn">
                            <?php echo esc_html($action_label); ?>
                        </button>

                        <div class="tg-progress" hidden>
                            <div class="tg-progress-track">
                                <div class="tg-progress-bar"></div>
                            </div>
                            <span class="tg-progress-label"><?php esc_html_e('Processing...', 'toolsgallery'); ?></span>
                        </div>

                        <div class="tg-result" hidden>
                            <div class="tg-success-banner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                                    aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <?php esc_html_e('Done! Your file is ready', 'toolsgallery'); ?>
                            </div>
                            <div class="tg-error-banner" hidden>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                    aria-hidden="true">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span class="tg-error-msg"></span>
                            </div>
                            <button class="tg-download-btn"><?php esc_html_e('Download File', 'toolsgallery'); ?></button>
                            <a href="#" class="tg-reset"><?php esc_html_e('Generate another', 'toolsgallery'); ?></a>
                        </div>

                        <?php wp_nonce_field('tg_tool_nonce', 'tg_nonce'); ?>
                    </div>

                <?php elseif ($tool_type === 'ai'): ?>

                    <!-- AI Tool Box -->
                    <div class="tg-tool-box tg-ai-box" data-tool-type="ai" data-handler="<?php echo esc_attr($handler); ?>">

                        <div class="tg-ai-input">
                            <label
                                for="tg-text-input"><?php esc_html_e('Enter your text or topic', 'toolsgallery'); ?></label>
                            <textarea id="tg-text-input" class="tg-text-input" rows="6"
                                placeholder="<?php esc_attr_e('Type here...', 'toolsgallery'); ?>"></textarea>
                        </div>

                        <div class="tg-ai-options"></div>

                        <button class="tg-action-btn tg-generate-btn">
                            <?php echo esc_html($action_label); ?>
                        </button>

                        <div class="tg-ai-loading" hidden>
                            <svg class="tg-spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" aria-hidden="true">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            <span><?php esc_html_e('AI is working...', 'toolsgallery'); ?></span>
                        </div>

                        <div class="tg-ai-output" hidden>
                            <div class="tg-output-toolbar">
                                <span class="tg-word-count"></span>
                                <button class="tg-copy-btn"><?php esc_html_e('Copy Text', 'toolsgallery'); ?></button>
                                <button class="tg-download-txt"><?php esc_html_e('Download .txt', 'toolsgallery'); ?></button>
                            </div>
                            <div class="tg-output-content"></div>
                        </div>

                        <?php wp_nonce_field('tg_tool_nonce', 'tg_nonce'); ?>
                    </div>

                <?php else: ?>

                    <!-- Browser / Server file-based Tool Box -->
                    <!-- server-side handlers will be implemented in a later phase -->
                    <div class="tg-tool-box" data-tool-type="<?php echo esc_attr($tool_type); ?>"
                        data-handler="<?php echo esc_attr($handler); ?>"
                        data-accept="<?php echo esc_attr($accept_types); ?>"
                        data-multi="<?php echo $multi_file ? 'true' : 'false'; ?>" <?php if ($input_format)
                                   echo 'data-input-format="' . esc_attr($input_format) . '" '; ?>         <?php if ($output_format)
                                                          echo 'data-output-format="' . esc_attr($output_format) . '" '; ?>>

                        <div class="tg-upload-zone" id="upload-zone" role="button" tabindex="0"
                            aria-label="<?php echo $multi_file ? esc_attr__('Drop your files here or click to browse', 'toolsgallery') : esc_attr__('Drop your file here or click to browse', 'toolsgallery'); ?>">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                                aria-hidden="true" class="tg-upload-icon">
                                <polyline points="16 16 12 12 8 16"></polyline>
                                <line x1="12" y1="12" x2="12" y2="21"></line>
                                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                            </svg>
                            <p class="tg-upload-title">
                                <?php echo $multi_file ? esc_html__('Drop your files here', 'toolsgallery') : esc_html__('Drop your file here', 'toolsgallery'); ?>
                            </p>
                            <span class="tg-upload-sub"><?php esc_html_e('or click to browse', 'toolsgallery'); ?></span>
                            <?php if ($accept_types): ?>
                                <p class="tg-upload-hint">
                                    <?php
                                    /* translators: %s: comma-separated list of accepted file types */
                                    echo esc_html(sprintf(__('Accepted: %s', 'toolsgallery'), $accept_types));
                                    ?>
                                </p>
                            <?php endif; ?>
                            <input type="file" id="file-input" <?php echo $multi_file ? ' multiple' : ''; ?> hidden>
                        </div>

                        <!-- Single-file selected row (used when data-multi="false") -->
                        <div class="tg-file-selected" hidden>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                aria-hidden="true" class="tg-file-icon">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <span class="tg-filename"></span>
                            <span class="tg-filesize"></span>
                            <button class="tg-remove-file"
                                aria-label="<?php esc_attr_e('Remove file', 'toolsgallery'); ?>">&#x00D7;</button>
                        </div>

                        <!-- Multi-file list (used when data-multi="true") -->
                        <div class="tg-file-list" hidden></div>

                        <div class="tg-options" hidden></div>

                        <button class="tg-action-btn" disabled>
                            <?php echo esc_html($action_label); ?>
                        </button>

                        <div class="tg-progress" hidden>
                            <div class="tg-progress-track">
                                <div class="tg-progress-bar"></div>
                            </div>
                            <span class="tg-progress-label"><?php esc_html_e('Processing...', 'toolsgallery'); ?></span>
                        </div>

                        <div class="tg-result" hidden>
                            <div class="tg-success-banner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                                    aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <?php esc_html_e('Done! Your file is ready', 'toolsgallery'); ?>
                            </div>
                            <div class="tg-error-banner" hidden>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                    aria-hidden="true">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span class="tg-error-msg"></span>
                            </div>
                            <button class="tg-download-btn"><?php esc_html_e('Download File', 'toolsgallery'); ?></button>
                            <a href="#" class="tg-reset"><?php esc_html_e('Process another file', 'toolsgallery'); ?></a>
                        </div>

                        <?php wp_nonce_field('tg_tool_nonce', 'tg_nonce'); ?>
                    </div>

                <?php endif; ?>

                <!-- 4. In-content responsive ad -->
                <?php echo tg_ad_slot('tool-in-content', 'responsive'); // phpcs:ignore WordPress.Security.EscapeOutput ?>

                <!-- 5. How to use -->
                <section class="tg-tool-section tg-how-to-use" id="how-to-use">
                    <h2><?php esc_html_e('How to Use', 'toolsgallery'); ?>     <?php the_title(); ?></h2>
                    <ol class="tg-steps-list">
                        <?php if (!empty($steps)):
                            foreach ($steps as $i => $step): ?>
                                <li class="tg-step-item">
                                    <span class="tg-step-num" aria-hidden="true"><?php echo esc_html($i + 1); ?></span>
                                    <div class="tg-step-body">
                                        <strong class="tg-step-title"><?php echo esc_html($step['step'] ?? ''); ?></strong>
                                        <?php if (!empty($step['desc'])): ?>
                                            <p class="tg-step-desc"><?php echo esc_html($step['desc']); ?></p>
                                        <?php endif; ?>
                                    </div>
                                </li>
                            <?php endforeach;
                        else: ?>
                            <li class="tg-step-item">
                                <span class="tg-step-num" aria-hidden="true">1</span>
                                <div class="tg-step-body"><strong
                                        class="tg-step-title"><?php esc_html_e('Upload your file', 'toolsgallery'); ?></strong>
                                </div>
                            </li>
                            <li class="tg-step-item">
                                <span class="tg-step-num" aria-hidden="true">2</span>
                                <div class="tg-step-body"><strong
                                        class="tg-step-title"><?php esc_html_e('We process it instantly in your browser', 'toolsgallery'); ?></strong>
                                </div>
                            </li>
                            <li class="tg-step-item">
                                <span class="tg-step-num" aria-hidden="true">3</span>
                                <div class="tg-step-body"><strong
                                        class="tg-step-title"><?php esc_html_e('Download the result', 'toolsgallery'); ?></strong>
                                </div>
                            </li>
                        <?php endif; ?>
                    </ol>
                </section>

                <!-- 6. Features -->
                <div class="tg-tool-section">
                    <h2><?php esc_html_e('Features', 'toolsgallery'); ?></h2>
                    <div class="tg-features-grid">
                        <?php if (!empty($features)):
                            foreach ($features as $feature): ?>
                                <div class="tg-feature-card">
                                    <?php if (!empty($feature['icon'])): ?>
                                        <div class="tg-feature-card__icon" aria-hidden="true">
                                            <?php
                                            $icon_name = $feature['icon'] ?? '';
                                            $icon_svgs = [
                                                'eye' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
                                                'paint' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M2 13.5V20a2 2 0 002 2h16a2 2 0 002-2v-6.5"/><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>',
                                                'paintbrush' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 00-3-3z"/><path d="M9 8c-2 3-4 3.5-7 4l8 8c1-.5 3.5-2 4-7"/></svg>',
                                                'file' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
                                                'file-text' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
                                                'download' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
                                                'upload' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
                                                'image' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
                                                'images' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
                                                'zap' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
                                                'shield' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
                                                'lock' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
                                                'unlock' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>',
                                                'scissors' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
                                                'crop' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/></svg>',
                                                'rotate-cw' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>',
                                                'refresh-cw' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
                                                'settings' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>',
                                                'sliders' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
                                                'type' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
                                                'code' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
                                                'globe' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
                                                'languages' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>',
                                                'message-square' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
                                                'align-left' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
                                                'list' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
                                                'check' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="20 6 9 17 4 12"/></svg>',
                                                'check-circle' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                                                'star' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
                                                'sparkles' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 3l1.88 5.76L19.5 9l-5.62 4.09L15.76 19 12 15.77 8.24 19l2.38-5.91L4.5 9l5.62-.24z"/></svg>',
                                                'wand' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2L19 5"/><path d="M3 21l9-9"/><path d="M12.2 6.2L11 5"/></svg>',
                                                'wand-2' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2L19 5"/><path d="M3 21l9-9"/></svg>',
                                                'pen-tool' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
                                                'edit' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
                                                'edit-3' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
                                                'copy' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
                                                'clipboard' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
                                                'layers' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
                                                'grid' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
                                                'layout' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
                                                'music' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
                                                'video' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
                                                'film' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
                                                'volume-2' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>',
                                                'mic' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
                                                'hash' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
                                                'at-sign' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></svg>',
                                                'mail' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>',
                                                'send' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
                                                'cpu' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
                                                'terminal' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
                                                'package' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
                                                'database' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
                                                'bar-chart' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
                                                'pie-chart' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>',
                                                'trending-up' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
                                                'clock' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                                                'calendar' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                                                'search' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
                                                'filter' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
                                                'tag' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
                                                'bookmark' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
                                                'heart' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
                                                'smile' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
                                                'user' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                                                'users' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
                                                'key' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
                                                'link' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
                                                'external-link' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
                                                'maximize' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>',
                                                'minimize' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>',
                                                'compress' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>',
                                                'merge' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/></svg>',
                                                'split' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 00-1.172-2.872L3 3"/><path d="M12 22v-8.3a4 4 0 011.172-2.872L21 3"/></svg>',
                                                'move' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
                                                'printer' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
                                                'trash' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
                                                'alert-circle' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
                                                'info' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
                                                'help-circle' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                                                'loader' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
                                                'feather' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>',
                                                'award' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
                                                'target' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
                                                'tool' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
                                                'monitor' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
                                                'smartphone' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
                                                'wifi' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
                                                'arrow-right' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
                                                'arrow-left' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
                                                'plus' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
                                                'minus' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
                                                'x' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
                                                'sun' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>',
                                                'moon' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
                                            ];
                                            // Output SVG if found, otherwise show a generic tool icon
                                            if (isset($icon_svgs[$icon_name])) {
                                                echo $icon_svgs[$icon_name];
                                            } else {
                                                // Generic fallback icon
                                                echo '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>';
                                            }
                                            ?>
                                        </div>
                                    <?php endif; ?>
                                    <h3 class="tg-feature-card__title"><?php echo esc_html($feature['title'] ?? ''); ?></h3>
                                    <p class="tg-feature-card__desc"><?php echo esc_html($feature['desc'] ?? ''); ?></p>
                                </div>
                            <?php endforeach;
                        else: ?>
                            <div class="tg-feature-card">
                                <div class="tg-feature-card__icon" aria-hidden="true">🆓</div>
                                <h3 class="tg-feature-card__title"><?php esc_html_e('100% Free', 'toolsgallery'); ?></h3>
                                <p class="tg-feature-card__desc">
                                    <?php esc_html_e('No subscription or account required. Always free to use.', 'toolsgallery'); ?>
                                </p>
                            </div>
                            <div class="tg-feature-card">
                                <div class="tg-feature-card__icon" aria-hidden="true">🌐</div>
                                <h3 class="tg-feature-card__title">
                                    <?php esc_html_e('Works in your browser', 'toolsgallery'); ?></h3>
                                <p class="tg-feature-card__desc">
                                    <?php esc_html_e('Files are processed locally — nothing is uploaded to our servers.', 'toolsgallery'); ?>
                                </p>
                            </div>
                            <div class="tg-feature-card">
                                <div class="tg-feature-card__icon" aria-hidden="true">📂</div>
                                <h3 class="tg-feature-card__title"><?php esc_html_e('No file size limits', 'toolsgallery'); ?>
                                </h3>
                                <p class="tg-feature-card__desc">
                                    <?php esc_html_e('Process files of any size directly in your browser without restrictions.', 'toolsgallery'); ?>
                                </p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- 6b. Why Use This Tool (AEO content) -->
                <section class="tg-tool-section tg-why-use" id="why-use">
                    <h2><?php esc_html_e('Why Use', 'toolsgallery'); ?>     <?php the_title(); ?>
                        <?php esc_html_e('Online?', 'toolsgallery'); ?></h2>
                    <p><?php the_title(); ?> by Tool Acadmy is a free browser-based tool that requires no signup, no
                        download, and no installation. Your files are processed locally in your browser and never uploaded
                        to any server, ensuring complete privacy.</p>
                    <?php if (!empty($features)): ?>
                        <ul>
                            <?php foreach ($features as $feature): ?>
                                <li><strong><?php echo esc_html($feature['title'] ?? ''); ?>:</strong>
                                    <?php echo esc_html($feature['desc'] ?? ''); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </section>

                <!-- 6c. Key Benefits (AEO featured snippet target) -->
                <section class="tg-tool-section tg-benefits" id="benefits">
                    <h2>Key Benefits of Using This Free <?php echo esc_html($cat ? $cat->name : 'Online'); ?> Tool</h2>
                    <ul class="tg-benefits-list">
                        <li><strong>Completely free</strong> &mdash; No hidden fees, no premium tier, no credit card
                            required. Tool Acadmy is free to use forever.</li>
                        <li><strong>No account needed</strong> &mdash; Start using <?php the_title(); ?> immediately without
                            registering or entering your email address.</li>
                        <li><strong>Privacy guaranteed</strong> &mdash; All processing happens locally in your browser. We
                            never receive or store your files.</li>
                        <li><strong>Works everywhere</strong> &mdash; Compatible with Windows, Mac, Linux, iPhone, and
                            Android through any modern browser.</li>
                        <li><strong>Fast processing</strong> &mdash; Get results in seconds using WebAssembly and modern
                            browser APIs.</li>
                        <li><strong>No downloads</strong> &mdash; No software installation needed. Run directly in your
                            browser tab.</li>
                    </ul>
                </section>

                <!-- 6d. Mid-content ad — between Benefits and FAQ -->
                <?php echo tg_ad_slot('tool-mid-content', 'responsive'); // phpcs:ignore WordPress.Security.EscapeOutput ?>

                <!-- 7. FAQ — only if non-empty -->
                <?php if (!empty($faqs)): ?>
                    <section class="tg-tool-section tg-faq-section" id="faq">
                        <h2><?php esc_html_e('Frequently Asked Questions', 'toolsgallery'); ?></h2>
                        <div class="tg-faq-accordion">
                            <?php foreach ($faqs as $faq): ?>
                                <details class="tg-faq-item">
                                    <summary class="tg-faq-question">
                                        <?php echo esc_html($faq['q'] ?? ''); ?>
                                        <span class="tg-faq-chevron" aria-hidden="true"></span>
                                    </summary>
                                    <div class="tg-faq-answer">
                                        <?php echo wp_kses_post($faq['a'] ?? ''); ?>
                                    </div>
                                </details>
                            <?php endforeach; ?>
                        </div>
                    </section>
                <?php endif; ?>

                <!-- Ad after FAQ -->
                <?php echo tg_ad_slot('tool-below-faq', 'responsive'); // phpcs:ignore WordPress.Security.EscapeOutput ?>

                <!-- 8. Related Tools -->
                <?php
                if (!empty($related_ids)) {
                    $related_args = [
                        'post_type' => 'tg_tool',
                        'post__in' => $related_ids,
                        'posts_per_page' => 6,
                        'orderby' => 'post__in',
                    ];
                } elseif ($cat) {
                    $related_args = [
                        'post_type' => 'tg_tool',
                        'posts_per_page' => 6,
                        'post__not_in' => [$post_id],
                        'tax_query' => [
                            [ // phpcs:ignore WordPress.DB.SlowDBQuery
                                'taxonomy' => 'tool_category',
                                'field' => 'term_id',
                                'terms' => $cat->term_id,
                            ]
                        ],
                    ];
                } else {
                    $related_args = null;
                }

                if ($related_args):
                    $related_posts = get_posts($related_args);
                    if (!empty($related_posts)): ?>
                        <div class="tg-tool-section">
                            <h2><?php esc_html_e('Related Tools', 'toolsgallery'); ?></h2>
                            <div class="tg-related-grid">
                                <?php foreach ($related_posts as $rt):
                                    $rt_terms = get_the_terms($rt->ID, 'tool_category');
                                    $rt_cat   = ($rt_terms && !is_wp_error($rt_terms)) ? $rt_terms[0]->slug : '';
                                    $rt_slug  = get_post_meta($rt->ID, '_tg_handler', true) ?: $rt->post_name; ?>
                                    <a href="<?php echo esc_url(get_permalink($rt)); ?>" class="tg-related-card">
                                        <span class="tg-related-card__icon"
                                            aria-hidden="true"><?php echo tg_get_tool_icon($rt_slug, $rt_cat); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
                                        <span class="tg-related-card__name"><?php echo esc_html($rt->post_title); ?></span>
                                    </a>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif;
                endif; ?>

            </main><!-- .tg-tool-page-main -->

            <!-- ================================================================
             SIDEBAR
             ================================================================ -->
            <aside class="tg-tool-page-sidebar" aria-label="<?php esc_attr_e('Tool sidebar', 'toolsgallery'); ?>">

                <!-- 1. Rectangle ad -->
                <?php echo tg_ad_slot('tool-rectangle', 'rectangle'); // phpcs:ignore WordPress.Security.EscapeOutput ?>

                <!-- 2. Popular Tools widget -->
                <div class="tg-sidebar-widget">
                    <h3 class="tg-sidebar-widget__title"><?php esc_html_e('Popular Tools', 'toolsgallery'); ?></h3>
                    <ul class="tg-sidebar-tools-list">
                        <?php
                        $popular = get_posts([
                            'post_type' => 'tg_tool',
                            'posts_per_page' => 6,
                            'post__not_in' => [$post_id],
                            'orderby' => 'menu_order',
                            'order' => 'ASC',
                        ]);
                        foreach ($popular as $pt):
                            $pt_terms = get_the_terms($pt->ID, 'tool_category');
                            $pt_cat   = ($pt_terms && !is_wp_error($pt_terms)) ? $pt_terms[0]->slug : '';
                            $pt_slug  = get_post_meta($pt->ID, '_tg_handler', true) ?: $pt->post_name; ?>
                            <li>
                                <a href="<?php echo esc_url(get_permalink($pt)); ?>" class="tg-sidebar-tool-link">
                                    <span aria-hidden="true"><?php echo tg_get_tool_icon($pt_slug, $pt_cat); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
                                    <?php echo esc_html($pt->post_title); ?>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>

                <!-- 3. Categories widget -->
                <div class="tg-sidebar-widget">
                    <h3 class="tg-sidebar-widget__title"><?php esc_html_e('Categories', 'toolsgallery'); ?></h3>
                    <ul class="tg-sidebar-cats-list">
                        <?php
                        $all_cats = get_terms(['taxonomy' => 'tool_category', 'hide_empty' => false]);
                        if ($all_cats && !is_wp_error($all_cats)):
                            foreach ($all_cats as $tcat): ?>
                                <li>
                                    <a href="<?php echo esc_url(home_url('/tools/?category=' . urlencode($tcat->slug))); ?>"
                                        class="tg-sidebar-cat-link<?php echo ($cat && $cat->term_id === $tcat->term_id) ? ' is-current' : ''; ?>">
                                        <?php echo esc_html($tcat->name); ?>
                                        <span class="tg-sidebar-cat-count"><?php echo absint($tcat->count); ?></span>
                                    </a>
                                </li>
                            <?php endforeach;
                        endif; ?>
                    </ul>
                </div>

                <!-- 4. Sidebar bottom ad -->
                <?php echo tg_ad_slot('tool-sidebar-bottom', 'rectangle'); // phpcs:ignore WordPress.Security.EscapeOutput ?>

            </aside><!-- .tg-tool-page-sidebar -->

        </div><!-- .tg-tool-page-layout -->
    </div><!-- .tg-container -->

<?php endwhile; ?>

<?php get_footer(); ?>
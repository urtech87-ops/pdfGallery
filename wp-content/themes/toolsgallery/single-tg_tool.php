<?php
/**
 * Template: Single Tool Page (tg_tool CPT)
 * Phase 2: SEO, AdSense, tool UI shells
 */

get_header();

while ( have_posts() ) :
    the_post();

    $post_id      = get_the_ID();
    $tool_type    = get_post_meta( $post_id, '_tg_tool_type', true ) ?: 'browser';
    $action_label = get_post_meta( $post_id, '_tg_action_label', true ) ?: __( 'Process File', 'toolsgallery' );
    $accept_types = get_post_meta( $post_id, '_tg_accept_types', true ) ?: '';
    $handler      = get_post_meta( $post_id, '_tg_handler', true );
    $faqs_raw     = get_post_meta( $post_id, '_tg_faqs', true );
    $features_raw = get_post_meta( $post_id, '_tg_features', true );
    $steps_raw    = get_post_meta( $post_id, '_tg_steps', true );
    $related_raw  = get_post_meta( $post_id, '_tg_related', true );
    $multi_file   = get_post_meta( $post_id, '_tg_multi_file', true ) === 'true';

    $faqs        = $faqs_raw     ? json_decode( $faqs_raw,     true ) : [];
    $features    = $features_raw ? json_decode( $features_raw, true ) : [];
    $steps       = $steps_raw    ? json_decode( $steps_raw,    true ) : [];
    $related_ids = array_filter( array_map( 'absint', explode( ',', $related_raw ) ) );

    $terms = get_the_terms( $post_id, 'tool_category' );
    $cat   = ( $terms && ! is_wp_error( $terms ) ) ? $terms[0] : null;
?>

<!-- Leaderboard ad — desktop only -->
<div class="tg-leaderboard-wrap">
    <div class="tg-container">
        <?php echo tg_ad_slot( 'tool-leaderboard', 'leaderboard' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
    </div>
</div>

<div class="tg-container">
    <div class="tg-tool-page-layout">

        <!-- ================================================================
             MAIN COLUMN
             ================================================================ -->
        <main class="tg-tool-page-main" id="main-tool-content">

            <!-- 1. H1 -->
            <?php if ( $cat ) : ?>
                <div class="tg-tool-cat-badge">
                    <a href="<?php echo esc_url( get_term_link( $cat ) ); ?>"><?php echo esc_html( $cat->name ); ?></a>
                </div>
            <?php endif; ?>
            <h1 class="tg-tool-title"><?php the_title(); ?></h1>

            <!-- 2. Description / excerpt -->
            <?php if ( has_excerpt() ) : ?>
                <p class="tg-tool-desc"><?php the_excerpt(); ?></p>
            <?php endif; ?>

            <!-- 3. TOOL UI BOX -->
            <?php if ( $tool_type === 'ai' ) : ?>

                <!-- AI Tool Box -->
                <div class="tg-tool-box tg-ai-box"
                     data-tool-type="ai"
                     data-handler="<?php echo esc_attr( $handler ); ?>">

                    <div class="tg-ai-input">
                        <label for="tg-text-input"><?php esc_html_e( 'Enter your text or topic', 'toolsgallery' ); ?></label>
                        <textarea id="tg-text-input" class="tg-text-input" rows="6"
                            placeholder="<?php esc_attr_e( 'Type here...', 'toolsgallery' ); ?>"></textarea>
                    </div>

                    <div class="tg-ai-options"></div>

                    <button class="tg-action-btn tg-generate-btn">
                        <?php echo esc_html( $action_label ); ?>
                    </button>

                    <div class="tg-ai-loading" hidden>
                        <svg class="tg-spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        <span><?php esc_html_e( 'AI is working...', 'toolsgallery' ); ?></span>
                    </div>

                    <div class="tg-ai-output" hidden>
                        <div class="tg-output-toolbar">
                            <span class="tg-word-count"></span>
                            <button class="tg-copy-btn"><?php esc_html_e( 'Copy Text', 'toolsgallery' ); ?></button>
                            <button class="tg-download-txt"><?php esc_html_e( 'Download .txt', 'toolsgallery' ); ?></button>
                        </div>
                        <div class="tg-output-content"></div>
                    </div>

                    <?php wp_nonce_field( 'tg_tool_nonce', 'tg_nonce' ); ?>
                </div>

            <?php else : ?>

                <!-- Browser / Server file-based Tool Box -->
                <!-- server-side handlers will be implemented in a later phase -->
                <div class="tg-tool-box"
                     data-tool-type="<?php echo esc_attr( $tool_type ); ?>"
                     data-handler="<?php echo esc_attr( $handler ); ?>"
                     data-accept="<?php echo esc_attr( $accept_types ); ?>"
                     data-multi="<?php echo $multi_file ? 'true' : 'false'; ?>">

                    <div class="tg-upload-zone" id="upload-zone" role="button" tabindex="0"
                         aria-label="<?php echo $multi_file ? esc_attr__( 'Drop your files here or click to browse', 'toolsgallery' ) : esc_attr__( 'Drop your file here or click to browse', 'toolsgallery' ); ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="tg-upload-icon">
                            <polyline points="16 16 12 12 8 16"></polyline>
                            <line x1="12" y1="12" x2="12" y2="21"></line>
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                        </svg>
                        <p class="tg-upload-title"><?php echo $multi_file ? esc_html__( 'Drop your files here', 'toolsgallery' ) : esc_html__( 'Drop your file here', 'toolsgallery' ); ?></p>
                        <span class="tg-upload-sub"><?php esc_html_e( 'or click to browse', 'toolsgallery' ); ?></span>
                        <input type="file" id="file-input"<?php echo $multi_file ? ' multiple' : ''; ?> hidden>
                    </div>

                    <!-- Single-file selected row (used when data-multi="false") -->
                    <div class="tg-file-selected" hidden>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="tg-file-icon">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                        <span class="tg-filename"></span>
                        <span class="tg-filesize"></span>
                        <button class="tg-remove-file" aria-label="<?php esc_attr_e( 'Remove file', 'toolsgallery' ); ?>">&#x00D7;</button>
                    </div>

                    <!-- Multi-file list (used when data-multi="true") -->
                    <div class="tg-file-list" hidden></div>

                    <div class="tg-options" hidden></div>

                    <button class="tg-action-btn" disabled>
                        <?php echo esc_html( $action_label ); ?>
                    </button>

                    <div class="tg-progress" hidden>
                        <div class="tg-progress-track">
                            <div class="tg-progress-bar"></div>
                        </div>
                        <span class="tg-progress-label"><?php esc_html_e( 'Processing...', 'toolsgallery' ); ?></span>
                    </div>

                    <div class="tg-result" hidden>
                        <div class="tg-success-banner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <?php esc_html_e( 'Done! Your file is ready', 'toolsgallery' ); ?>
                        </div>
                        <button class="tg-download-btn"><?php esc_html_e( 'Download File', 'toolsgallery' ); ?></button>
                        <a href="#" class="tg-reset"><?php esc_html_e( 'Process another file', 'toolsgallery' ); ?></a>
                    </div>

                    <?php wp_nonce_field( 'tg_tool_nonce', 'tg_nonce' ); ?>
                </div>

            <?php endif; ?>

            <!-- 4. In-content responsive ad -->
            <?php echo tg_ad_slot( 'tool-in-content', 'responsive' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>

            <!-- 5. How to use -->
            <div class="tg-tool-section">
                <h2><?php esc_html_e( 'How to Use', 'toolsgallery' ); ?></h2>
                <ol class="tg-steps-list">
                    <?php if ( ! empty( $steps ) ) :
                        foreach ( $steps as $i => $step ) : ?>
                            <li class="tg-step-item">
                                <span class="tg-step-num" aria-hidden="true"><?php echo esc_html( $i + 1 ); ?></span>
                                <div class="tg-step-body">
                                    <strong class="tg-step-title"><?php echo esc_html( $step['step'] ?? '' ); ?></strong>
                                    <?php if ( ! empty( $step['desc'] ) ) : ?>
                                        <p class="tg-step-desc"><?php echo esc_html( $step['desc'] ); ?></p>
                                    <?php endif; ?>
                                </div>
                            </li>
                        <?php endforeach;
                    else : ?>
                        <li class="tg-step-item">
                            <span class="tg-step-num" aria-hidden="true">1</span>
                            <div class="tg-step-body"><strong class="tg-step-title"><?php esc_html_e( 'Upload your file', 'toolsgallery' ); ?></strong></div>
                        </li>
                        <li class="tg-step-item">
                            <span class="tg-step-num" aria-hidden="true">2</span>
                            <div class="tg-step-body"><strong class="tg-step-title"><?php esc_html_e( 'We process it instantly in your browser', 'toolsgallery' ); ?></strong></div>
                        </li>
                        <li class="tg-step-item">
                            <span class="tg-step-num" aria-hidden="true">3</span>
                            <div class="tg-step-body"><strong class="tg-step-title"><?php esc_html_e( 'Download the result', 'toolsgallery' ); ?></strong></div>
                        </li>
                    <?php endif; ?>
                </ol>
            </div>

            <!-- 6. Features -->
            <div class="tg-tool-section">
                <h2><?php esc_html_e( 'Features', 'toolsgallery' ); ?></h2>
                <div class="tg-features-grid">
                    <?php if ( ! empty( $features ) ) :
                        foreach ( $features as $feature ) : ?>
                            <div class="tg-feature-card">
                                <?php if ( ! empty( $feature['icon'] ) ) : ?>
                                    <div class="tg-feature-card__icon" aria-hidden="true"><?php echo esc_html( $feature['icon'] ); ?></div>
                                <?php endif; ?>
                                <h3 class="tg-feature-card__title"><?php echo esc_html( $feature['title'] ?? '' ); ?></h3>
                                <p class="tg-feature-card__desc"><?php echo esc_html( $feature['desc'] ?? '' ); ?></p>
                            </div>
                        <?php endforeach;
                    else : ?>
                        <div class="tg-feature-card">
                            <div class="tg-feature-card__icon" aria-hidden="true">🆓</div>
                            <h3 class="tg-feature-card__title"><?php esc_html_e( '100% Free', 'toolsgallery' ); ?></h3>
                            <p class="tg-feature-card__desc"><?php esc_html_e( 'No subscription or account required. Always free to use.', 'toolsgallery' ); ?></p>
                        </div>
                        <div class="tg-feature-card">
                            <div class="tg-feature-card__icon" aria-hidden="true">🌐</div>
                            <h3 class="tg-feature-card__title"><?php esc_html_e( 'Works in your browser', 'toolsgallery' ); ?></h3>
                            <p class="tg-feature-card__desc"><?php esc_html_e( 'Files are processed locally — nothing is uploaded to our servers.', 'toolsgallery' ); ?></p>
                        </div>
                        <div class="tg-feature-card">
                            <div class="tg-feature-card__icon" aria-hidden="true">📂</div>
                            <h3 class="tg-feature-card__title"><?php esc_html_e( 'No file size limits', 'toolsgallery' ); ?></h3>
                            <p class="tg-feature-card__desc"><?php esc_html_e( 'Process files of any size directly in your browser without restrictions.', 'toolsgallery' ); ?></p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- 6b. Mid-content ad — between Features and FAQ -->
            <?php echo tg_ad_slot( 'tool-mid-content', 'responsive' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>

            <!-- 7. FAQ — only if non-empty -->
            <?php if ( ! empty( $faqs ) ) : ?>
                <div class="tg-tool-section">
                    <h2><?php esc_html_e( 'Frequently Asked Questions', 'toolsgallery' ); ?></h2>
                    <div class="tg-faq-accordion">
                        <?php foreach ( $faqs as $faq ) : ?>
                            <details class="tg-faq-item">
                                <summary class="tg-faq-question">
                                    <?php echo esc_html( $faq['q'] ?? '' ); ?>
                                    <span class="tg-faq-chevron" aria-hidden="true"></span>
                                </summary>
                                <div class="tg-faq-answer">
                                    <?php echo wp_kses_post( $faq['a'] ?? '' ); ?>
                                </div>
                            </details>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <!-- 8. Related Tools -->
            <?php
            if ( ! empty( $related_ids ) ) {
                $related_args = [
                    'post_type'      => 'tg_tool',
                    'post__in'       => $related_ids,
                    'posts_per_page' => 6,
                    'orderby'        => 'post__in',
                ];
            } elseif ( $cat ) {
                $related_args = [
                    'post_type'      => 'tg_tool',
                    'posts_per_page' => 6,
                    'post__not_in'   => [ $post_id ],
                    'tax_query'      => [ [ // phpcs:ignore WordPress.DB.SlowDBQuery
                        'taxonomy' => 'tool_category',
                        'field'    => 'term_id',
                        'terms'    => $cat->term_id,
                    ] ],
                ];
            } else {
                $related_args = null;
            }

            if ( $related_args ) :
                $related_posts = get_posts( $related_args );
                if ( ! empty( $related_posts ) ) : ?>
                    <div class="tg-tool-section">
                        <h2><?php esc_html_e( 'Related Tools', 'toolsgallery' ); ?></h2>
                        <div class="tg-related-grid">
                            <?php foreach ( $related_posts as $rt ) :
                                $rt_icon = get_post_meta( $rt->ID, '_tg_icon', true ) ?: '🔧'; ?>
                                <a href="<?php echo esc_url( get_permalink( $rt ) ); ?>" class="tg-related-card">
                                    <span class="tg-related-card__icon" aria-hidden="true"><?php echo esc_html( $rt_icon ); ?></span>
                                    <span class="tg-related-card__name"><?php echo esc_html( $rt->post_title ); ?></span>
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
        <aside class="tg-tool-page-sidebar" aria-label="<?php esc_attr_e( 'Tool sidebar', 'toolsgallery' ); ?>">

            <!-- 1. Rectangle ad -->
            <?php echo tg_ad_slot( 'tool-rectangle', 'rectangle' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>

            <!-- 2. Popular Tools widget -->
            <div class="tg-sidebar-widget">
                <h3 class="tg-sidebar-widget__title"><?php esc_html_e( 'Popular Tools', 'toolsgallery' ); ?></h3>
                <ul class="tg-sidebar-tools-list">
                    <?php
                    $popular = get_posts( [
                        'post_type'      => 'tg_tool',
                        'posts_per_page' => 6,
                        'post__not_in'   => [ $post_id ],
                        'orderby'        => 'menu_order',
                        'order'          => 'ASC',
                    ] );
                    foreach ( $popular as $pt ) :
                        $pt_icon = get_post_meta( $pt->ID, '_tg_icon', true ) ?: '🔧'; ?>
                        <li>
                            <a href="<?php echo esc_url( get_permalink( $pt ) ); ?>" class="tg-sidebar-tool-link">
                                <span aria-hidden="true"><?php echo esc_html( $pt_icon ); ?></span>
                                <?php echo esc_html( $pt->post_title ); ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>

            <!-- 3. Categories widget -->
            <div class="tg-sidebar-widget">
                <h3 class="tg-sidebar-widget__title"><?php esc_html_e( 'Categories', 'toolsgallery' ); ?></h3>
                <ul class="tg-sidebar-cats-list">
                    <?php
                    $all_cats = get_terms( [ 'taxonomy' => 'tool_category', 'hide_empty' => false ] );
                    if ( $all_cats && ! is_wp_error( $all_cats ) ) :
                        foreach ( $all_cats as $tcat ) : ?>
                            <li>
                                <a href="<?php echo esc_url( home_url( '/tools/?category=' . urlencode( $tcat->slug ) ) ); ?>"
                                   class="tg-sidebar-cat-link<?php echo ( $cat && $cat->term_id === $tcat->term_id ) ? ' is-current' : ''; ?>">
                                    <?php echo esc_html( $tcat->name ); ?>
                                    <span class="tg-sidebar-cat-count"><?php echo absint( $tcat->count ); ?></span>
                                </a>
                            </li>
                        <?php endforeach;
                    endif; ?>
                </ul>
            </div>

            <!-- 4. Sidebar bottom ad -->
            <?php echo tg_ad_slot( 'tool-sidebar-bottom', 'rectangle' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>

        </aside><!-- .tg-tool-page-sidebar -->

    </div><!-- .tg-tool-page-layout -->
</div><!-- .tg-container -->

<?php endwhile; ?>

<?php get_footer(); ?>

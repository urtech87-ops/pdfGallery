<?php
/**
 * Template: Tool Category Archive
 * Phase 9 B3: CollectionPage + ItemList schema
 */

$term      = get_queried_object();
$term_name = $term ? $term->name : '';
$term_url  = $term ? get_term_link($term) : home_url('/tools/');

/* Output CollectionPage + ItemList schema */
$tools = get_posts([
    'post_type'      => 'tg_tool',
    'posts_per_page' => -1,
    'tax_query'      => [[ // phpcs:ignore WordPress.DB.SlowDBQuery
        'taxonomy' => 'tool_category',
        'field'    => 'slug',
        'terms'    => $term ? $term->slug : '',
    ]],
]);

$item_list = [];
foreach ($tools as $i => $tool) {
    $item_list[] = [
        '@type'       => 'ListItem',
        'position'    => $i + 1,
        'name'        => $tool->post_title,
        'url'         => get_permalink($tool->ID),
        'description' => $tool->post_excerpt,
    ];
}

$schema = [
    '@context' => 'https://schema.org',
    '@graph'   => [
        [
            '@type'         => 'CollectionPage',
            'name'          => $term_name . ' - Free Online Tools',
            'description'   => 'Free online ' . $term_name . ' tools. No signup required.',
            'url'           => $term_url,
            'numberOfItems' => count($tools),
            'hasPart'       => array_slice($item_list, 0, 10),
        ],
        [
            '@type'           => 'ItemList',
            'name'            => $term_name . ' Tools',
            'itemListElement' => $item_list,
        ],
        [
            '@type'           => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home',  'item' => home_url('/')],
                ['@type' => 'ListItem', 'position' => 2, 'name' => 'Tools', 'item' => home_url('/tools/')],
                ['@type' => 'ListItem', 'position' => 3, 'name' => $term_name, 'item' => $term_url],
            ],
        ],
    ],
];
?>
<?php get_header(); ?>
<script>document.body.dataset.category = '<?php echo esc_js($term ? $term->slug : 'default'); ?>';</script>

<!-- Schema output -->
<script type="application/ld+json"><?php echo wp_json_encode($schema, JSON_UNESCAPED_SLASHES); ?></script>


<div class="tg-container" style="padding-top:2rem;padding-bottom:4rem;">

  <!-- Page Header -->
  <header class="tg-archive-header">
    <h1 class="tg-archive-title"><?php echo esc_html('Free Online ' . $term_name . ' Tools'); ?></h1>
    <p class="tg-archive-desc">
      <?php printf(
          esc_html__('Browse %d free online %s tools. No download, no signup required. Works in any browser.', 'toolsgallery'),
          count($tools),
          esc_html(strtolower($term_name))
      ); ?>
    </p>
  </header>

  <!-- Tools Grid -->
  <?php if (!empty($tools)) : ?>
    <div class="tg-tools-grid">
      <?php foreach ($tools as $tool) :
        $tool_slug = get_post_meta($tool->ID, '_tg_handler', true) ?: $tool->post_name;
      ?>
        <a class="tg-tool-card" href="<?php echo esc_url(get_permalink($tool->ID)); ?>" data-tool-handler="<?php echo esc_attr(get_post_meta($tool->ID, '_tg_handler', true)); ?>">
          <div class="tg-tool-card__icon" aria-hidden="true"><?php echo tg_get_tool_icon($tool_slug, $term ? $term->slug : ''); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
          <div class="tg-tool-card__title"><?php echo esc_html($tool->post_title); ?></div>
          <div class="tg-tool-card__desc"><?php echo esc_html(wp_trim_words($tool->post_excerpt, 12, '…')); ?></div>
          <span class="tg-tool-card__badge"><?php esc_html_e('Free', 'toolsgallery'); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  <?php else : ?>
    <p><?php esc_html_e('No tools found in this category.', 'toolsgallery'); ?></p>
  <?php endif; ?>

  <?php
  $cat_seo = [
    'pdf-tools' => [
      'intro' => 'PDF files are everywhere — from contracts and invoices to reports and ebooks. Our free PDF tools help you work with PDF documents without paying for expensive software like Adobe Acrobat. Every tool runs directly in your browser, which means your sensitive documents never leave your device.',
      'uses'  => [
        'Merge multiple PDFs into a single document for easier sharing and organization',
        'Compress large PDF files before emailing them to stay within attachment limits',
        'Convert PDF pages to JPG images for use in presentations or social media',
        'Split long PDFs into individual chapters or extract specific pages you need',
        'Protect sensitive PDFs with passwords to control who can access them',
        'Remove passwords from PDFs you own when you no longer need the protection',
      ],
      'faq_extra' => [
        ['q' => 'Are these PDF tools really free?', 'a' => 'Yes. All PDF tools on Tool Acadmy are completely free to use with no limits, no watermarks, and no account required.'],
        ['q' => 'Is my PDF safe when I use these tools?', 'a' => 'Absolutely. All PDF processing happens locally in your browser using PDF-lib and PDF.js. Your files are never uploaded to any server.'],
      ],
    ],
    'image-tools' => [
      'intro' => 'Whether you need to compress photos for a website, remove a background for an e-commerce store, or convert images between formats, our free image tools handle it all directly in your browser. No plugins, no subscriptions, and no quality loss from server-side compression.',
      'uses'  => [
        'Compress JPG and PNG images to reduce file size without visible quality loss',
        'Remove backgrounds from product photos for Amazon, Shopify, or social media',
        'Resize images to exact pixel dimensions for social media, websites, or email',
        'Convert images between JPG, PNG, WebP, AVIF, and other formats instantly',
        'Add watermarks to protect your photos from unauthorized use',
        'Crop images to the exact frame you need in seconds',
      ],
      'faq_extra' => [
        ['q' => 'What image formats are supported?', 'a' => 'Tool Acadmy supports JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, ICO, and SVG formats for input and output depending on the tool.'],
      ],
    ],
    'ai-tools' => [
      'intro' => 'Our AI writing tools use advanced language models to help you write better content faster. From fixing grammar mistakes to generating entire articles, these tools save hours of writing time. All AI tools are free and require no account — just type and get results.',
      'uses'  => [
        'Fix grammar and spelling errors in emails, essays, and documents instantly',
        'Paraphrase text to improve readability or adapt content for a new audience',
        'Summarize long documents into key points in seconds',
        'Generate blog posts, product descriptions, social media captions, and more',
        'Check text for AI patterns and rewrite it to sound more human',
        'Create professional cover letters and resumes tailored to specific jobs',
      ],
      'faq_extra' => [
        ['q' => 'Which AI model powers these tools?', 'a' => 'Our AI tools use OpenRouter to access models including GPT-4o and Google Gemini Flash depending on the specific task.'],
        ['q' => 'Is the AI output accurate?', 'a' => 'AI tools can make mistakes. Always review AI-generated content before publishing or submitting it. Use the results as a starting point, not a final product.'],
      ],
    ],
    'video-tools' => [
      'intro' => 'Video editing no longer requires expensive software like Premiere Pro or Final Cut. Our free browser-based video tools handle common video tasks using FFmpeg.wasm — a full video processing engine running entirely in your browser. No uploads to servers, no waiting for cloud processing.',
      'uses'  => [
        'Compress large video files before uploading to YouTube, TikTok, or sending by email',
        'Extract audio from videos to save as MP3 for podcasts or music',
        'Trim clips to remove unwanted beginning or ending footage',
        'Add subtitles to videos for better accessibility and viewer engagement',
        'Convert videos between MP4, WebM, AVI, and other popular formats',
        'Create animated GIFs from short video clips for social media',
      ],
      'faq_extra' => [
        ['q' => 'Why do video tools take longer to process?', 'a' => 'Video tools use FFmpeg.wasm, a WebAssembly port of FFmpeg that runs in your browser. The first load downloads about 30MB. Processing time depends on file size and your device speed.'],
      ],
    ],
    'file-tools' => [
      'intro' => 'Data conversion is a common need for developers, analysts, and content creators. Our free file converter tools handle the most common format conversions including Excel to CSV, JSON to XML, Markdown to HTML, and many more — all without uploading your files to a server.',
      'uses'  => [
        'Convert Excel spreadsheets to CSV for use in databases and analysis tools',
        'Transform JSON data to CSV format for spreadsheet analysis',
        'Convert XML files to JSON for modern API and web development',
        'Transform Markdown documents to HTML for web publishing',
        'Encode files to Base64 for embedding in HTML, CSS, or APIs',
        'Generate MD5, SHA-256, and other hashes to verify file integrity',
      ],
      'faq_extra' => [
        ['q' => 'Are these file converters accurate?', 'a' => 'Yes. File conversions use well-established JavaScript libraries including SheetJS for Excel/CSV and native browser APIs for other formats.'],
      ],
    ],
    'utility-tools' => [
      'intro' => 'Small tasks deserve fast, free tools. Our utility tools cover the everyday digital tasks that take too long to do manually — from converting units and generating random numbers to picking the perfect color for your design project. All tools work instantly in your browser.',
      'uses'  => [
        'Pick any color and instantly get the HEX, RGB, HSL, and CMYK codes',
        'Generate beautiful color palettes for design projects',
        'Set countdown timers for productivity and the Pomodoro technique',
        'Convert between hundreds of units across 12 measurement categories',
        'Convert text between uppercase, lowercase, camelCase, and more',
        'Generate cryptographically secure random numbers for any purpose',
      ],
      'faq_extra' => [
        ['q' => 'Do utility tools require any setup?', 'a' => 'No. All utility tools on Tool Acadmy work instantly in your browser with no setup, no download, and no account required.'],
      ],
    ],
  ];

  $cat_content = $cat_seo[$term ? $term->slug : ''] ?? null;
  ?>

</div>

<!-- Category SEO text — rich per-category content -->
<?php if ($cat_content) : ?>
<section class="tg-section tg-seo-content" aria-labelledby="cat-seo-heading">
  <div class="tg-container">
    <div class="tg-seo-content__inner">

      <h2 id="cat-seo-heading">Free <?php echo esc_html($term_name); ?> &mdash; No Signup Required</h2>

      <p><?php echo esc_html($cat_content['intro']); ?></p>

      <h3>What You Can Do With Our Free <?php echo esc_html($term_name); ?>:</h3>

      <ul class="tg-benefits-list">
        <?php foreach ($cat_content['uses'] as $use) : ?>
          <li><?php echo esc_html($use); ?></li>
        <?php endforeach; ?>
      </ul>

      <?php if (!empty($cat_content['faq_extra'])) : ?>
      <h3>Common Questions</h3>

      <div class="tg-faq-accordion">
        <?php foreach ($cat_content['faq_extra'] as $faq) : ?>
        <details class="tg-faq-item">
          <summary class="tg-faq-question">
            <?php echo esc_html($faq['q']); ?>
            <span class="tg-faq-chevron" aria-hidden="true"></span>
          </summary>
          <div class="tg-faq-answer">
            <p><?php echo esc_html($faq['a']); ?></p>
          </div>
        </details>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>

      <div class="tg-category-cta-bar">
        <p>All <?php echo esc_html($term_name); ?> are free, browser-based, and require no account. Your files never leave your device.</p>
        <p><a href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('Browse all free online tools &rarr;', 'toolsgallery'); ?></a></p>
      </div>

    </div>
  </div>
</section>
<?php else : ?>
<section class="tg-section tg-seo-content" aria-labelledby="cat-seo-heading">
  <div class="tg-container">
    <div class="tg-seo-content__inner">
      <h2 id="cat-seo-heading"><?php echo esc_html('Free ' . $term_name . ' — No Signup Required'); ?></h2>
      <p>
        <?php printf(
            esc_html__('Tool Acadmy\'s free %s work entirely in your browser. No software to install, no account to create, and your files never leave your device. Fast, private, and always free.', 'toolsgallery'),
            esc_html(strtolower($term_name))
        ); ?>
      </p>
      <p><a href="<?php echo esc_url(home_url('/tools/')); ?>"><?php esc_html_e('Browse all free online tools &rarr;', 'toolsgallery'); ?></a></p>
    </div>
  </div>
</section>
<?php endif; ?>

<?php get_footer(); ?>

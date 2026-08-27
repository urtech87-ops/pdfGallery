<?php
/**
 * apply-toolshall-seo.php — ToolsHall RankMath SEO meta.
 *
 * Writes rank_math_title / rank_math_description / rank_math_focus_keyword for:
 *
 *   PART A — the 9 core pages (hand-written copy, set verbatim):
 *            homepage, the six tool_category archives, About, Contact.
 *   PART B — every published tg_tool (formula, unique per tool).
 *
 * USAGE (from the WordPress root):
 *
 *   Dry run (no writes, prints the full plan + verification):
 *       wp eval-file apply-toolshall-seo.php dry-run
 *       wp eval-file apply-toolshall-seo.php --dry-run
 *
 *   Apply (writes to the database, then reads back and verifies):
 *       wp eval-file apply-toolshall-seo.php
 *
 *   Note: some WP-CLI versions reject unregistered flags on `eval-file`. If
 *   `--dry-run` errors with "unknown parameter", use the positional form
 *   `dry-run` instead — it is handled identically. The mode is echoed in a
 *   banner at the top of the run, so there is never any doubt which one ran.
 *
 * WHY THE THEME WAS ALSO CHANGED (read this before re-running on production):
 *
 *   functions.php::tg_dynamic_meta() used to add `rank_math/frontend/title`
 *   and `rank_math/frontend/description` filters for every tg_tool single and
 *   every tool_category archive, returning a hard-coded string and ignoring
 *   the value passed in. RankMath applies those filters AFTER resolving the
 *   stored meta, so the filters won every time — meaning meta written by
 *   this script would never have reached the page. The filters are now
 *   fallbacks: they only register when no meta is stored. Deploy the theme
 *   change together with this script, or the data change has no visible
 *   effect.
 *
 * WHAT THIS SCRIPT WILL AND WILL NOT OVERWRITE (PART B):
 *
 *   An earlier script (fix-rankmath.php) wrote "Tool Acadmy"-branded meta to
 *   every tool. A plain "skip if rank_math_title is non-empty" rule would
 *   therefore skip all of them and leave the misspelled brand in place. So
 *   each field is judged on its own:
 *
 *     - empty                      -> write
 *     - contains the legacy brand  -> overwrite (it is not hand-tuned)
 *     - anything else              -> keep (hand-tuned; e.g. Merge PDF)
 *
 *   Merge PDF's title and description carry no legacy brand, so they survive
 *   untouched. Its focus keyword still holds the old "free online merge pdf"
 *   pattern, which is replaced with "merge pdf" per the agreed formula.
 *
 * @package ToolsGallery
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "This script must be run through WP-CLI: wp eval-file apply-toolshall-seo.php\n");
    exit(1);
}

/* =========================================================================
   0. Output helpers — work under WP-CLI, degrade to echo otherwise.
   ========================================================================= */

function tsh_log($line = '')
{
    if (class_exists('WP_CLI')) {
        WP_CLI::log($line);
        return;
    }
    echo $line . "\n";
}

function tsh_rule($char = '-')
{
    tsh_log(str_repeat($char, 78));
}

function tsh_heading($text)
{
    tsh_log('');
    tsh_rule('=');
    tsh_log($text);
    tsh_rule('=');
}

/** Character length, multibyte-safe (the copy contains em dashes). */
function tsh_len($string)
{
    return function_exists('mb_strlen') ? mb_strlen($string, 'UTF-8') : strlen($string);
}

function tsh_substr($string, $start, $length = null)
{
    if (function_exists('mb_substr')) {
        return mb_substr($string, $start, $length, 'UTF-8');
    }
    return $length === null ? substr($string, $start) : substr($string, $start, $length);
}

function tsh_lower($string)
{
    return function_exists('mb_strtolower') ? mb_strtolower($string, 'UTF-8') : strtolower($string);
}

/* =========================================================================
   1. Mode detection.
   ========================================================================= */

function tsh_is_dry_run()
{
    // Positional args handed to `wp eval-file <file> <arg>...`.
    if (isset($GLOBALS['args']) && is_array($GLOBALS['args'])) {
        foreach ($GLOBALS['args'] as $arg) {
            if (in_array((string) $arg, ['dry-run', '--dry-run', 'dryrun'], true)) {
                return true;
            }
        }
    }

    // Associative args, if this version of WP-CLI passed the flag through.
    if (isset($GLOBALS['assoc_args']) && is_array($GLOBALS['assoc_args'])) {
        if (!empty($GLOBALS['assoc_args']['dry-run'])) {
            return true;
        }
    }

    // Raw command line, as a last resort.
    if (isset($GLOBALS['argv']) && is_array($GLOBALS['argv'])) {
        foreach ($GLOBALS['argv'] as $arg) {
            if (in_array((string) $arg, ['dry-run', '--dry-run'], true)) {
                return true;
            }
        }
    }

    // Escape hatch for shells that mangle flags.
    return getenv('TOOLSHALL_SEO_DRY_RUN') === '1';
}

$tsh_dry_run = tsh_is_dry_run();

/* =========================================================================
   2. Brand hygiene helpers.
   ========================================================================= */

/**
 * Replace every spelling of the old brand with ToolsHall.
 *
 * Applied to text taken from post content (_tg_intro, excerpts) before it
 * becomes a meta description, so generated copy never reintroduces the
 * misspelled brand.
 */
function tsh_rebrand($text)
{
    $replacements = [
        '/https?:\/\/(www\.)?toolacadmy\.com/iu' => 'https://toolshall.com',
        '/\btoolacadmy\b/iu' => 'ToolsHall',
        '/\bTool\s+Acadmy\b/iu' => 'ToolsHall',
        '/\bTools?\s*Acadmy\b/iu' => 'ToolsHall',
        '/\bAcadmy\b/iu' => 'ToolsHall',
    ];

    foreach ($replacements as $pattern => $replacement) {
        $text = preg_replace($pattern, $replacement, $text);
    }

    return $text;
}

/** True when a stored value still carries the old brand (so it is not hand-tuned). */
function tsh_is_legacy_brand($value)
{
    return $value !== '' && preg_match('/acadmy/iu', $value) === 1;
}

/**
 * True when a stored title was machine-generated by an earlier script.
 *
 * fix-rankmath.php wrote "{post_title} - Free Online Tool | Tool Acadmy" to
 * every tool, so the brand match catches those. A title that is just the post
 * title adds nothing over RankMath's own default and is replaced too.
 */
function tsh_is_legacy_title($value, $post)
{
    if ($value === '') {
        return true;
    }
    if (tsh_is_legacy_brand($value)) {
        return true;
    }

    return trim($value) === trim($post->post_title);
}

/**
 * True when a stored description was machine-generated rather than written.
 *
 * fix-rankmath.php stored `substr($post_excerpt, 0, 155)` when an excerpt
 * existed, and a "Use free ... online." boilerplate line when it did not.
 * Neither carries the old brand, so the brand match alone would mistake all of
 * them for hand-written copy and leave them in place. A description that is
 * the excerpt (or a prefix of it) was not written for search results; a real
 * hand-written one, like Merge PDF's, differs from the excerpt and survives.
 */
function tsh_is_legacy_description($value, $post)
{
    if ($value === '') {
        return true;
    }
    if (tsh_is_legacy_brand($value)) {
        return true;
    }

    $value = trim($value);
    $excerpt = trim(wp_strip_all_tags((string) $post->post_excerpt));

    if ($excerpt !== '' && strpos($excerpt, $value) === 0) {
        return true;
    }

    // Boilerplate written by fix-rankmath.php and by the theme's old fallback.
    if (preg_match('/^Use free .+ online\./iu', $value)) {
        return true;
    }
    if (preg_match('/No signup( required)?\.\s*100% free\./iu', $value)) {
        return true;
    }

    return false;
}

/* =========================================================================
   3. Text builders.
   ========================================================================= */

/**
 * Trim to a maximum character count on a word boundary, ending in a full stop.
 */
function tsh_trim_to($text, $max, $add_period = true)
{
    $text = trim(preg_replace('/\s+/u', ' ', $text));

    if (tsh_len($text) <= $max) {
        return $text;
    }

    $cut = tsh_substr($text, 0, $max);
    $space = function_exists('mb_strrpos') ? mb_strrpos($cut, ' ', 0, 'UTF-8') : strrpos($cut, ' ');

    if ($space !== false && $space > (int) ($max * 0.5)) {
        $cut = tsh_substr($cut, 0, $space);
    }

    $cut = rtrim($cut, " \t\n\r\0\x0B,;:-—–");

    if ($add_period && !preg_match('/[.!?]$/u', $cut)) {
        $cut .= '.';
    }

    return $cut;
}

/**
 * "{post_title} — Free Online Tool | ToolsHall", capped at 60 characters.
 *
 * Falls back through progressively shorter variants rather than truncating
 * the tool name, which would produce titles like "Remove Backgro...".
 */
function tsh_build_tool_title($post_title)
{
    $post_title = trim(tsh_rebrand($post_title));

    $variants = [
        $post_title . ' — Free Online Tool | ToolsHall',
        $post_title . ' — Free Online Tool',
        $post_title . ' — Free Tool',
        $post_title,
    ];

    foreach ($variants as $variant) {
        if (tsh_len($variant) <= 60) {
            return $variant;
        }
    }

    // Even the bare tool name exceeds 60 characters. Return it whole rather
    // than cutting it mid-phrase: Google trims the displayed title itself,
    // and a stored "Convert Microsoft Excel Spreadsheets To Comma Separ" is
    // worse than a long one. The length check below reports these so the
    // tool name itself can be shortened.
    return $post_title;
}

/** Split text into sentences. */
function tsh_sentences($text)
{
    $parts = preg_split('/(?<=[.!?])\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY);
    return is_array($parts) ? $parts : [];
}

/**
 * Build a unique meta description from the tool's own content.
 *
 * Seeded from the first sentence of _tg_intro (or the excerpt). A first
 * sentence on its own is often well under the 150-160 character target, so
 * following sentences are appended while the result is still short. The
 * result is trimmed to ~150 characters and the standard suffix is appended
 * when it fits inside 160.
 */
function tsh_build_tool_description($post)
{
    $source = trim(wp_strip_all_tags((string) get_post_meta($post->ID, '_tg_intro', true)));

    if ($source === '') {
        $source = trim(wp_strip_all_tags((string) $post->post_excerpt));
    }

    if ($source === '') {
        // Documented fallback for tools with neither an intro nor an excerpt.
        return $post->post_title . ': a free online tool that runs in your browser. No signup, no downloads.';
    }

    $source = tsh_rebrand($source);
    $sentences = tsh_sentences($source);

    if (empty($sentences)) {
        return $post->post_title . ': a free online tool that runs in your browser. No signup, no downloads.';
    }

    $description = $sentences[0];
    $index = 1;

    while (tsh_len($description) < 110 && isset($sentences[$index])) {
        $description .= ' ' . $sentences[$index];
        $index++;
    }

    $description = tsh_trim_to($description, 150);

    $suffix = ' Free, no signup — runs in your browser.';
    if (tsh_len($description . $suffix) <= 160) {
        $description .= $suffix;
    }

    return $description;
}

/** Lowercased tool name, e.g. "merge pdf". */
function tsh_build_focus_keyword($post_title)
{
    return tsh_lower(trim(preg_replace('/\s+/u', ' ', tsh_rebrand($post_title))));
}

/* =========================================================================
   4. Part A copy — hand-written, set verbatim.
   ========================================================================= */

$tsh_core_copy = [
    'home' => [
        'label' => 'Homepage (front page)',
        'title' => 'Free Online Tools — PDF, Image, AI & Video | ToolsHall',
        'description' => '150+ free online tools for PDF, image, video, AI writing and file conversion. No signup, no downloads — everything runs in your browser. Fast, private, free forever.',
        'focus' => 'free online tools',
    ],
    'pdf-tools' => [
        'label' => 'PDF category (tool_category: pdf-tools)',
        'title' => 'Free PDF Tools Online — Merge, Compress, Convert & Edit',
        'description' => 'Free online PDF tools to merge, split, compress, convert, edit and sign PDFs. Merge up to 100 files. No signup, no watermarks — runs in your browser.',
        'focus' => 'free pdf tools',
    ],
    'image-tools' => [
        'label' => 'Image category (tool_category: image-tools)',
        'title' => 'Free Image Tools Online — Compress, Resize, Convert & More',
        'description' => 'Free online image tools to compress, resize, crop, convert and remove backgrounds. Batch support, no quality loss control, no signup — all in your browser.',
        'focus' => 'free image tools',
    ],
    'ai-tools' => [
        'label' => 'AI category (tool_category: ai-tools)',
        'title' => 'Free AI Writing Tools — Grammar, Paraphrase, Essays & More',
        'description' => 'Free AI writing tools: grammar checker, paraphraser, summarizer, essay and email writers, and more. No signup required — get results in seconds.',
        'focus' => 'free ai writing tools',
    ],
    'video-tools' => [
        'label' => 'Video category (tool_category: video-tools)',
        'title' => 'Free Video Tools Online — Trim, Compress & Convert Video',
        'description' => 'Free online video tools to trim, compress, convert, and extract audio or frames. Processed in your browser — your files never leave your device. No signup.',
        'focus' => 'free video tools',
    ],
    'file-tools' => [
        'label' => 'File category (tool_category: file-tools)',
        'title' => 'Free File Converter Tools — CSV, JSON, XML, Markdown',
        'description' => 'Free online file converters: Excel to CSV, JSON to XML, Markdown to HTML, Base64 and more. Fast, browser-based, no signup, no upload to servers.',
        'focus' => 'free file converter',
    ],
    'utility-tools' => [
        'label' => 'Utility category (tool_category: utility-tools)',
        'title' => 'Free Online Utility Tools — Color Picker, Converters & More',
        'description' => 'Handy free utility tools: color picker, unit converter, password generator, countdown timer, text tools and more. No signup — instant results in your browser.',
        'focus' => 'online utility tools',
    ],
    'about' => [
        'label' => 'About page',
        'title' => 'About ToolsHall — Free Browser-Based Online Tools',
        'description' => 'ToolsHall offers 150+ free online tools that run entirely in your browser. No signup, no downloads, no files sent to servers. Learn what makes us different.',
        'focus' => 'about toolshall',
    ],
    'contact' => [
        'label' => 'Contact page',
        'title' => 'Contact ToolsHall — Questions, Feedback & Support',
        'description' => "Get in touch with the ToolsHall team. Questions, feedback, or a tool request? Reach us via our contact form or email — we'd love to hear from you.",
        'focus' => 'contact toolshall',
    ],
];

/* =========================================================================
   5. Target resolution.
   ========================================================================= */

/**
 * Locate a WordPress page by slug, then by page template, then by title.
 *
 * @return WP_Post|null
 */
function tsh_find_page(array $slugs, $template, array $titles)
{
    foreach ($slugs as $slug) {
        $page = get_page_by_path($slug, OBJECT, 'page');
        if ($page instanceof WP_Post) {
            return $page;
        }
    }

    if ($template) {
        $by_template = get_posts([
            'post_type' => 'page',
            'post_status' => ['publish', 'draft', 'private'],
            'posts_per_page' => 1,
            'meta_key' => '_wp_page_template',
            'meta_value' => $template,
            'suppress_filters' => false,
        ]);
        if (!empty($by_template)) {
            return $by_template[0];
        }
    }

    foreach ($titles as $title) {
        $by_title = get_posts([
            'post_type' => 'page',
            'post_status' => ['publish', 'draft', 'private'],
            'posts_per_page' => 1,
            'title' => $title,
            'suppress_filters' => false,
        ]);
        if (!empty($by_title)) {
            return $by_title[0];
        }
    }

    return null;
}

/**
 * Build the list of Part A write targets.
 *
 * Each entry: key, label, kind (post|term|option), id, copy, note.
 */
function tsh_resolve_core_targets(array $copy)
{
    $targets = [];

    /* --- Homepage ------------------------------------------------------ */
    $front_id = (int) get_option('page_on_front');
    $shows_page = get_option('show_on_front') === 'page' && $front_id > 0;

    if ($shows_page) {
        $targets[] = [
            'key' => 'home',
            'label' => $copy['home']['label'],
            'kind' => 'post',
            'id' => $front_id,
            'copy' => $copy['home'],
            'note' => 'static front page #' . $front_id . ' ("' . get_the_title($front_id) . '")',
        ];
    } else {
        // Blog-index homepage: RankMath reads these from its Titles options,
        // not from post meta (see Paper\Blog::title()).
        $targets[] = [
            'key' => 'home',
            'label' => $copy['home']['label'],
            'kind' => 'option',
            'id' => 'rank-math-options-titles',
            'copy' => $copy['home'],
            'note' => 'no static front page set — writing homepage_title / homepage_description into the rank-math-options-titles option',
        ];
    }

    /* --- Category terms ------------------------------------------------- */
    $category_slugs = ['pdf-tools', 'image-tools', 'ai-tools', 'video-tools', 'file-tools', 'utility-tools'];

    foreach ($category_slugs as $slug) {
        $term = get_term_by('slug', $slug, 'tool_category');

        if (!$term || is_wp_error($term)) {
            $targets[] = [
                'key' => $slug,
                'label' => $copy[$slug]['label'],
                'kind' => 'missing',
                'id' => 0,
                'copy' => $copy[$slug],
                'note' => 'NOT FOUND: no tool_category term with slug "' . $slug . '"',
            ];
            continue;
        }

        $targets[] = [
            'key' => $slug,
            'label' => $copy[$slug]['label'],
            'kind' => 'term',
            'id' => (int) $term->term_id,
            'copy' => $copy[$slug],
            'note' => 'term #' . $term->term_id . ' ("' . $term->name . '", ' . (int) $term->count . ' tools)',
        ];
    }

    /* --- About / Contact ------------------------------------------------ */
    $pages = [
        'about' => [['about', 'about-us'], 'page-about.php', ['About', 'About Us']],
        'contact' => [['contact', 'contact-us'], 'page-contact.php', ['Contact', 'Contact Us']],
    ];

    foreach ($pages as $key => [$slugs, $template, $titles]) {
        $page = tsh_find_page($slugs, $template, $titles);

        if (!$page) {
            $targets[] = [
                'key' => $key,
                'label' => $copy[$key]['label'],
                'kind' => 'missing',
                'id' => 0,
                'copy' => $copy[$key],
                'note' => 'NOT FOUND: no page matched slugs [' . implode(', ', $slugs) . '], template ' . $template . ', or titles [' . implode(', ', $titles) . ']',
            ];
            continue;
        }

        $targets[] = [
            'key' => $key,
            'label' => $copy[$key]['label'],
            'kind' => 'post',
            'id' => (int) $page->ID,
            'copy' => $copy[$key],
            'note' => 'page #' . $page->ID . ' ("' . $page->post_title . '", /' . $page->post_name . '/)',
        ];
    }

    return $targets;
}

/* =========================================================================
   6. Write helpers.
   ========================================================================= */

function tsh_read_meta($kind, $id, $key)
{
    if ($kind === 'post') {
        return (string) get_post_meta($id, $key, true);
    }
    if ($kind === 'term') {
        return (string) get_term_meta($id, $key, true);
    }
    return '';
}

function tsh_write_meta($kind, $id, $key, $value)
{
    if ($kind === 'post') {
        update_post_meta($id, $key, $value);
        return;
    }
    if ($kind === 'term') {
        update_term_meta($id, $key, $value);
    }
}

/* =========================================================================
   7. Run.
   ========================================================================= */

tsh_heading('ToolsHall RankMath SEO — ' . ($tsh_dry_run ? 'DRY RUN (no database writes)' : 'APPLY (writing to the database)'));

$rank_math_active = defined('RANK_MATH_VERSION') || defined('RANK_MATH_FILE') || class_exists('RankMath');

tsh_log('RankMath active          : ' . ($rank_math_active ? 'yes' . (defined('RANK_MATH_VERSION') ? ' (v' . RANK_MATH_VERSION . ')' : '') : 'NO — meta will be stored but nothing will read it'));
tsh_log('Meta keys               : rank_math_title, rank_math_description, rank_math_focus_keyword');
tsh_log('Site URL                : ' . home_url('/'));
tsh_log('Front page              : ' . (get_option('show_on_front') === 'page' ? 'static page #' . (int) get_option('page_on_front') : 'blog index (posts page)'));

if (!$rank_math_active) {
    tsh_log('');
    tsh_log('WARNING: RankMath does not appear to be loaded. Activate seo-by-rank-math');
    tsh_log('         before relying on these values on the front end.');
}

/* ---------------------------------------------------------------------
   PART A — core pages.
   --------------------------------------------------------------------- */

tsh_heading('PART A — core pages (hand-written copy)');

$core_targets = tsh_resolve_core_targets($tsh_core_copy);
$core_written = 0;
$core_missing = [];
$core_rows = [];

$handled_post_ids = [];
$handled_term_ids = [];

foreach ($core_targets as $target) {
    $copy = $target['copy'];

    if ($target['kind'] === 'post') {
        $handled_post_ids[] = (int) $target['id'];
    } elseif ($target['kind'] === 'term') {
        $handled_term_ids[] = (int) $target['id'];
    }

    tsh_log('');
    tsh_log($target['label']);
    tsh_log('  target : ' . $target['note']);

    if ($target['kind'] === 'missing') {
        $core_missing[] = $target['label'] . ' — ' . $target['note'];
        tsh_log('  status : SKIPPED (target not found)');
        continue;
    }

    if ($target['kind'] === 'option') {
        if (!$tsh_dry_run) {
            $titles_option = get_option('rank-math-options-titles', []);
            if (!is_array($titles_option)) {
                $titles_option = [];
            }
            $titles_option['homepage_title'] = $copy['title'];
            $titles_option['homepage_description'] = $copy['description'];
            update_option('rank-math-options-titles', $titles_option);
        }

        tsh_log('  title  : ' . $copy['title'] . '   (' . tsh_len($copy['title']) . ' chars)');
        tsh_log('  desc   : ' . $copy['description'] . '   (' . tsh_len($copy['description']) . ' chars)');
        tsh_log('  focus  : ' . $copy['focus'] . '   (NOTE: RankMath has no homepage focus-keyword option when the');
        tsh_log('           homepage is the blog index — set it in Titles & Meta > Homepage manually)');
        tsh_log('  status : ' . ($tsh_dry_run ? 'WOULD WRITE option rank-math-options-titles' : 'WRITTEN to option rank-math-options-titles'));

        $core_written++;
        $core_rows[] = [$target['label'], $copy['title'], $copy['description'], $copy['focus']];
        continue;
    }

    $fields = [
        'rank_math_title' => $copy['title'],
        'rank_math_description' => $copy['description'],
        'rank_math_focus_keyword' => $copy['focus'],
    ];

    foreach ($fields as $key => $value) {
        $before = tsh_read_meta($target['kind'], $target['id'], $key);

        if (!$tsh_dry_run) {
            tsh_write_meta($target['kind'], $target['id'], $key, $value);
        }

        $changed = $before !== $value;
        $label = str_pad(str_replace('rank_math_', '', $key), 13);
        tsh_log('  ' . $label . ': ' . $value . '   (' . tsh_len($value) . ' chars)');

        if ($before !== '' && $changed) {
            tsh_log('  ' . str_repeat(' ', 13) . '  was: ' . tsh_substr($before, 0, 90));
        }
    }

    tsh_log('  status : ' . ($tsh_dry_run ? 'WOULD WRITE' : 'WRITTEN'));
    $core_written++;
    $core_rows[] = [$target['label'], $copy['title'], $copy['description'], $copy['focus']];
}

/* ---------------------------------------------------------------------
   PART B — tool pages.
   --------------------------------------------------------------------- */

tsh_heading('PART B — tg_tool pages (formula)');

$tools = get_posts([
    'post_type' => 'tg_tool',
    'post_status' => 'publish',
    'posts_per_page' => -1,
    'orderby' => 'title',
    'order' => 'ASC',
    'suppress_filters' => false,
]);

tsh_log('Published tg_tool posts  : ' . count($tools));
tsh_log('');

$updated = [];            // posts where at least one field changed
$skipped = [];            // posts left entirely alone (hand-tuned)
$cleaned_legacy = [];     // posts whose old "Tool Acadmy" meta was replaced
$final_values = [];       // post_id => [title, description, focus]
$description_owner = [];  // description => first post that produced it
$duplicates = [];

foreach ($tools as $tool) {
    $handled_post_ids[] = (int) $tool->ID;
    $existing_title = (string) get_post_meta($tool->ID, 'rank_math_title', true);
    $existing_desc = (string) get_post_meta($tool->ID, 'rank_math_description', true);
    $existing_focus = (string) get_post_meta($tool->ID, 'rank_math_focus_keyword', true);

    // Per-field decision: write when the stored value is empty or was
    // machine-generated by an earlier script; keep anything hand-written.
    $write_title = tsh_is_legacy_title($existing_title, $tool);
    $write_desc = tsh_is_legacy_description($existing_desc, $tool);
    $write_focus = ($existing_focus === ''
        || tsh_is_legacy_brand($existing_focus)
        || $existing_focus === 'free online ' . tsh_lower($tool->post_title));

    $legacy_title = $existing_title !== '' && $write_title;
    $legacy_desc = $existing_desc !== '' && $write_desc;
    $legacy_focus = $existing_focus !== '' && $write_focus;

    $new_title = $write_title ? tsh_build_tool_title($tool->post_title) : $existing_title;
    $new_desc = $write_desc ? tsh_build_tool_description($tool) : $existing_desc;
    $new_focus = $write_focus ? tsh_build_focus_keyword($tool->post_title) : $existing_focus;

    // Uniqueness: never emit the same description twice.
    if ($write_desc && isset($description_owner[$new_desc])) {
        $duplicates[] = [
            'post' => $tool->post_title,
            'clashed_with' => $description_owner[$new_desc],
            'description' => $new_desc,
        ];
        $new_desc = tsh_trim_to($tool->post_title . ': ' . $new_desc, 158);
    }

    if ($new_desc !== '') {
        $description_owner[$new_desc] = $tool->post_title;
    }

    $changes = [];

    if ($write_title && $new_title !== $existing_title) {
        $changes['rank_math_title'] = $new_title;
    }
    if ($write_desc && $new_desc !== $existing_desc) {
        $changes['rank_math_description'] = $new_desc;
    }
    if ($write_focus && $new_focus !== $existing_focus) {
        $changes['rank_math_focus_keyword'] = $new_focus;
    }

    if (!$tsh_dry_run) {
        foreach ($changes as $key => $value) {
            update_post_meta($tool->ID, $key, $value);
        }
    }

    $final_values[$tool->ID] = [
        'post_title' => $tool->post_title,
        'permalink' => get_permalink($tool->ID),
        'title' => $new_title,
        'description' => $new_desc,
        'focus' => $new_focus,
        'changed' => array_keys($changes),
    ];

    if (empty($changes)) {
        $skipped[] = $tool->post_title;
        continue;
    }

    $updated[] = $tool->post_title;

    if ($legacy_title || $legacy_desc || $legacy_focus) {
        $cleaned_legacy[] = $tool->post_title;
    }
}

tsh_log(($tsh_dry_run ? 'Would update' : 'Updated') . '             : ' . count($updated) . ' tool pages');
tsh_log('Skipped (hand-tuned)     : ' . count($skipped) . ' tool pages');
tsh_log('  of the updated, carrying legacy "Acadmy" meta that was replaced: ' . count($cleaned_legacy));

if (!empty($skipped)) {
    tsh_log('');
    tsh_log('Skipped tools (existing non-empty, non-legacy meta left untouched):');
    foreach ($skipped as $name) {
        tsh_log('  - ' . $name);
    }
}

/* =========================================================================
   8. Verification report.
   ========================================================================= */

tsh_heading('VERIFICATION REPORT' . ($tsh_dry_run ? ' (values planned; nothing was written)' : ' (values read back from the database)'));

/* --- Core pages ------------------------------------------------------- */

tsh_log('');
tsh_log('CORE PAGES ' . ($tsh_dry_run ? 'PLANNED' : 'UPDATED') . ': ' . $core_written . ' of 9 expected');
tsh_log('');

foreach ($core_rows as [$label, $title, $description, $focus]) {
    tsh_log('  ' . $label);
    tsh_log('    title (' . str_pad(tsh_len($title), 3, ' ', STR_PAD_LEFT) . ') ' . $title);
    tsh_log('    desc  (' . str_pad(tsh_len($description), 3, ' ', STR_PAD_LEFT) . ') ' . $description);
    tsh_log('    focus       ' . $focus);
    tsh_log('');
}

if (!empty($core_missing)) {
    tsh_log('  CORE TARGETS NOT FOUND (' . count($core_missing) . ') — these need a human:');
    foreach ($core_missing as $miss) {
        tsh_log('    - ' . $miss);
    }
    tsh_log('');
}

/* --- Read back tool values -------------------------------------------- */

$verify = [];

foreach ($final_values as $post_id => $row) {
    if ($tsh_dry_run) {
        $verify[$post_id] = $row;
        continue;
    }

    $verify[$post_id] = [
        'post_title' => $row['post_title'],
        'permalink' => $row['permalink'],
        'title' => (string) get_post_meta($post_id, 'rank_math_title', true),
        'description' => (string) get_post_meta($post_id, 'rank_math_description', true),
        'focus' => (string) get_post_meta($post_id, 'rank_math_focus_keyword', true),
        'changed' => $row['changed'],
    ];
}

/* --- 5 random samples -------------------------------------------------- */

tsh_log('SAMPLE OF 5 RANDOM TOOL PAGES');
tsh_log('');

$sample_ids = array_keys($verify);
if (count($sample_ids) > 5) {
    shuffle($sample_ids);
    $sample_ids = array_slice($sample_ids, 0, 5);
}

foreach ($sample_ids as $post_id) {
    $row = $verify[$post_id];
    tsh_log('  #' . $post_id . ' ' . $row['post_title']);
    tsh_log('    title (' . str_pad(tsh_len($row['title']), 3, ' ', STR_PAD_LEFT) . ') ' . $row['title']);
    tsh_log('    desc  (' . str_pad(tsh_len($row['description']), 3, ' ', STR_PAD_LEFT) . ') ' . $row['description']);
    tsh_log('    focus       ' . $row['focus']);
    tsh_log('');
}

/* --- Checks ------------------------------------------------------------ */

$long_titles = [];
$desc_in_band = 0;
$desc_short = [];
$desc_long = [];
$empty_fields = [];
$acadmy_hits = [];
$seen_descriptions = [];
$dupe_report = [];

foreach ($verify as $post_id => $row) {
    if (tsh_len($row['title']) > 60) {
        $long_titles[] = $row['post_title'] . ' (' . tsh_len($row['title']) . ' chars) — ' . $row['title'];
    }

    $desc_len = tsh_len($row['description']);
    if ($desc_len >= 150 && $desc_len <= 160) {
        $desc_in_band++;
    } elseif ($desc_len < 150) {
        $desc_short[] = $row['post_title'] . ' (' . $desc_len . ' chars)';
    } else {
        $desc_long[] = $row['post_title'] . ' (' . $desc_len . ' chars)';
    }

    if (trim($row['title']) === '') {
        $empty_fields[] = $row['post_title'] . ' — empty rank_math_title';
    }
    if (trim($row['description']) === '') {
        $empty_fields[] = $row['post_title'] . ' — empty rank_math_description';
    }
    if (trim($row['focus']) === '') {
        $empty_fields[] = $row['post_title'] . ' — empty rank_math_focus_keyword';
    }

    foreach (['title', 'description', 'focus'] as $field) {
        if (preg_match('/acadmy/iu', $row[$field])) {
            $acadmy_hits[] = $row['post_title'] . ' — rank_math_' . ($field === 'focus' ? 'focus_keyword' : $field) . ': ' . $row[$field];
        }
    }

    if (isset($seen_descriptions[$row['description']])) {
        $dupe_report[] = '"' . $seen_descriptions[$row['description']] . '" and "' . $row['post_title'] . '" share: ' . tsh_substr($row['description'], 0, 80) . '...';
    } else {
        $seen_descriptions[$row['description']] = $row['post_title'];
    }
}

// Core targets are checked for the same problems.
$core_desc_long = [];

foreach ($core_rows as [$label, $title, $description, $focus]) {
    if (tsh_len($title) > 60) {
        $long_titles[] = $label . ' (' . tsh_len($title) . ' chars) — ' . $title;
    }
    if (tsh_len($description) > 160) {
        $core_desc_long[] = $label . ' (' . tsh_len($description) . ' chars)';
    }
    if (trim($title) === '' || trim($description) === '') {
        $empty_fields[] = $label . ' — empty title or description';
    }
    foreach ([$title, $description, $focus] as $value) {
        if (preg_match('/acadmy/iu', $value)) {
            $acadmy_hits[] = $label . ' — ' . $value;
        }
    }
}

tsh_log('CHECKS');
tsh_log('');

tsh_rule();
tsh_log('  Title length <= 60 chars');
tsh_rule();
if (empty($long_titles)) {
    tsh_log('  PASS — all ' . (count($verify) + count($core_rows)) . ' titles are 60 characters or fewer.');
} else {
    tsh_log('  ' . count($long_titles) . ' over 60 characters:');
    foreach ($long_titles as $line) {
        tsh_log('    - ' . $line);
    }
}

tsh_log('');
tsh_rule();
tsh_log('  Description length (target 150-160 chars)');
tsh_rule();
tsh_log('  Tool pages, in band 150-160 : ' . $desc_in_band . ' of ' . count($verify));
tsh_log('  Tool pages, under 150       : ' . count($desc_short) . '  (source intro/excerpt too short to reach the band)');
tsh_log('  Tool pages, over 160        : ' . count($desc_long));

if (!empty($desc_long)) {
    foreach ($desc_long as $line) {
        tsh_log('    - ' . $line);
    }
}
if (!empty($core_desc_long)) {
    tsh_log('');
    tsh_log('  Core pages over 160 characters (hand-written copy, set verbatim as');
    tsh_log('  specified — Google truncates the snippet around 155-160 chars, so the');
    tsh_log('  tail of these will not be shown. Shortening them is a copy decision):');
    foreach ($core_desc_long as $line) {
        tsh_log('    - ' . $line);
    }
}
if (!empty($desc_short)) {
    tsh_log('  Shortest 10:');
    $shortest = array_slice($desc_short, 0, 10);
    foreach ($shortest as $line) {
        tsh_log('    - ' . $line);
    }
    tsh_log('  These are honest descriptions built from short source content, not');
    tsh_log('  truncation errors. Lengthen _tg_intro on those tools to lift them.');
}

tsh_log('');
tsh_rule();
tsh_log('  Description uniqueness');
tsh_rule();
if (empty($dupe_report)) {
    tsh_log('  PASS — all ' . count($verify) . ' tool descriptions are unique.');
} else {
    tsh_log('  ' . count($dupe_report) . ' duplicate description(s):');
    foreach ($dupe_report as $line) {
        tsh_log('    - ' . $line);
    }
}
if (!empty($duplicates)) {
    tsh_log('  ' . count($duplicates) . ' collision(s) were resolved during generation by prefixing the tool name:');
    foreach ($duplicates as $dupe) {
        tsh_log('    - "' . $dupe['post'] . '" clashed with "' . $dupe['clashed_with'] . '"');
    }
}

tsh_log('');
tsh_rule();
tsh_log('  Legacy "Acadmy" branding in RankMath meta');
tsh_rule();
if (empty($acadmy_hits)) {
    tsh_log('  PASS — no "Acadmy" text in any rank_math_* value handled by this script.');
} else {
    tsh_log('  ' . count($acadmy_hits) . ' occurrence(s) remaining:');
    foreach ($acadmy_hits as $line) {
        tsh_log('    - ' . $line);
    }
}

/*
 * Scan every rank_math_* meta row that this script does NOT handle — blog
 * posts, standalone pages, other taxonomies — so any remaining "Acadmy"
 * branding is visible rather than silently left behind. Rows this run covers
 * are excluded: in dry-run they still hold their pre-change values, so
 * including them would report problems the apply run is about to fix.
 */
global $wpdb;

$exclude_posts = !empty($handled_post_ids) ? ' AND pm.post_id NOT IN (' . implode(',', array_map('intval', $handled_post_ids)) . ')' : '';
$exclude_terms = !empty($handled_term_ids) ? ' AND tm.term_id NOT IN (' . implode(',', array_map('intval', $handled_term_ids)) . ')' : '';

$stray_posts = $wpdb->get_results(
    "SELECT p.post_title, p.post_type, pm.meta_key, pm.meta_value
       FROM {$wpdb->postmeta} pm
       JOIN {$wpdb->posts} p ON p.ID = pm.post_id
      WHERE pm.meta_key LIKE 'rank\\_math\\_%'
        AND pm.meta_value LIKE '%acadmy%'" . $exclude_posts . "
      LIMIT 50"
);
$stray_terms = $wpdb->get_results(
    "SELECT t.name, tm.meta_key, tm.meta_value
       FROM {$wpdb->termmeta} tm
       JOIN {$wpdb->terms} t ON t.term_id = tm.term_id
      WHERE tm.meta_key LIKE 'rank\\_math\\_%'
        AND tm.meta_value LIKE '%acadmy%'" . $exclude_terms . "
      LIMIT 50"
);

tsh_log('');
tsh_log('  Site-wide scan of rank_math_* meta on objects this script does not touch:');
if (empty($stray_posts) && empty($stray_terms)) {
    tsh_log('    PASS — nothing outside this script\'s scope contains "Acadmy".');
} else {
    foreach ($stray_posts as $stray) {
        tsh_log('    - ' . $stray->post_type . ' "' . $stray->post_title . '" / ' . $stray->meta_key . ': ' . substr($stray->meta_value, 0, 80));
    }
    foreach ($stray_terms as $stray) {
        tsh_log('    - term "' . $stray->name . '" / ' . $stray->meta_key . ': ' . substr($stray->meta_value, 0, 80));
    }
    tsh_log('    NEEDS A HUMAN: these are blog posts and other objects outside this');
    tsh_log('    script\'s brief. Rebrand them in a follow-up pass.');
}

// _tg_intro still carries the old brand on some tools; descriptions generated
// here are rebranded on the way out, but the on-page copy is not.
$intro_hits = $wpdb->get_col(
    "SELECT p.post_title
       FROM {$wpdb->postmeta} pm
       JOIN {$wpdb->posts} p ON p.ID = pm.post_id
      WHERE pm.meta_key = '_tg_intro'
        AND pm.meta_value LIKE '%acadmy%'
      LIMIT 50"
);
if (!empty($intro_hits)) {
    tsh_log('');
    tsh_log('  NOTE: ' . count($intro_hits) . ' tool(s) still have "Acadmy" in their on-page _tg_intro copy.');
    tsh_log('  Generated meta descriptions are rebranded to ToolsHall, but the visible');
    tsh_log('  intro text is a content change and is deliberately NOT touched here:');
    foreach (array_slice($intro_hits, 0, 10) as $name) {
        tsh_log('    - ' . $name);
    }
}

tsh_log('');
tsh_rule();
tsh_log('  Empty title / description / focus keyword');
tsh_rule();
if (empty($empty_fields)) {
    tsh_log('  PASS — no page ended up with an empty title, description or focus keyword.');
} else {
    tsh_log('  ' . count($empty_fields) . ' empty value(s):');
    foreach ($empty_fields as $line) {
        tsh_log('    - ' . $line);
    }
}

/* --- Spot-check URLs --------------------------------------------------- */

tsh_heading('NEEDS A HUMAN — browser spot-check');

tsh_log('This environment has no running site, so nobody has loaded a page and');
tsh_log('confirmed RankMath renders the new snippet. Open each URL below, view');
tsh_log('source, and check <title> and <meta name="description">:');
tsh_log('');
tsh_log('  ' . home_url('/'));

foreach ($core_targets as $target) {
    if ($target['kind'] === 'term') {
        $link = get_term_link($target['id'], 'tool_category');
        if (!is_wp_error($link)) {
            tsh_log('  ' . $link);
        }
    } elseif ($target['kind'] === 'post' && $target['key'] !== 'home') {
        tsh_log('  ' . get_permalink($target['id']));
    }
}

foreach ($sample_ids as $post_id) {
    tsh_log('  ' . $verify[$post_id]['permalink']);
}

tsh_log('');
tsh_log('Also worth checking in wp-admin: Rank Math > Titles & Meta > Homepage,');
tsh_log('and the Rank Math box on one tool page, to confirm the stored values');
tsh_log('appear in the SERP preview.');

tsh_heading('DONE — ' . ($tsh_dry_run ? 'DRY RUN, nothing was written' : 'changes applied to the database'));

if ($tsh_dry_run) {
    tsh_log('Re-run without the dry-run argument to apply:');
    tsh_log('  wp eval-file apply-toolshall-seo.php');
} else {
    tsh_log('Remember: this is a DATABASE change. It must be run again on the live');
    tsh_log('site after migration — deploying the repo does not carry meta values.');
}

tsh_log('');

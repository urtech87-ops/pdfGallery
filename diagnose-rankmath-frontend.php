<?php
/**
 * diagnose-rankmath-frontend.php — why is RankMath not printing head tags?
 *
 * READ-ONLY. Writes nothing: no options, no post meta, no term meta.
 *
 * USAGE (from the WordPress root):
 *     wp eval-file diagnose-rankmath-frontend.php
 *
 * WHAT IT ANSWERS
 *
 *   Pages were shipping a bare <title> and no <meta name="description">
 *   even though rank_math_title / rank_math_description are populated in the
 *   database. RankMath boots its entire front end only when its registration
 *   is valid — see rank-math.php::init_frontend():
 *
 *       public function init_frontend() {
 *           if ( $this->container['registration']->invalid ) { return; }
 *           $this->container['frontend'] = new \RankMath\Frontend\Frontend();
 *       }
 *
 *   and Helper::is_invalid_registration() is true unless the site is
 *   connected to rankmath.com, the setup wizard was explicitly skipped
 *   (option rank_math_registration_skip), or RANK_MATH_REGISTRATION_SKIP is
 *   defined. When it bails, RANK_MATH_VERSION is still defined, so anything
 *   that gates on the constant wrongly concludes RankMath is handling the
 *   head.
 *
 *   This script prints each of those switches so the state can be confirmed
 *   rather than guessed.
 *
 * @package ToolsGallery
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run through WP-CLI: wp eval-file diagnose-rankmath-frontend.php\n");
    exit(1);
}

function tgd_line($label, $value)
{
    echo '  ' . str_pad($label, 34) . ': ' . $value . "\n";
}

function tgd_bool($value)
{
    return $value ? 'YES' : 'no';
}

function tgd_heading($text)
{
    echo "\n" . $text . "\n" . str_repeat('-', strlen($text)) . "\n";
}

echo "\n=== RankMath front-end diagnosis ===\n";

/* --- 1. Is the plugin even loaded? ---------------------------------- */
tgd_heading('1. Plugin');
$loaded = defined('RANK_MATH_VERSION');
tgd_line('RANK_MATH_VERSION defined', tgd_bool($loaded) . ($loaded ? ' (' . RANK_MATH_VERSION . ')' : ''));
tgd_line('rank_math() available', tgd_bool(function_exists('rank_math')));

if (!$loaded) {
    echo "\nRankMath is not loaded at all. The theme now renders the title and\n";
    echo "description itself, so nothing further is required here.\n";
    return;
}

/* --- 2. Registration: the switch that disables the whole front end -- */
tgd_heading('2. Registration (gates init_frontend)');

$connected = class_exists('RankMath\Helper') && method_exists('RankMath\Helper', 'is_site_connected')
    ? (bool) RankMath\Helper::is_site_connected()
    : null;
$invalid = class_exists('RankMath\Helper') && method_exists('RankMath\Helper', 'is_invalid_registration')
    ? (bool) RankMath\Helper::is_invalid_registration()
    : null;

tgd_line('site connected to rankmath.com', $connected === null ? 'unknown' : tgd_bool($connected));
tgd_line('option rank_math_registration_skip', tgd_bool(get_option('rank_math_registration_skip')));
tgd_line('const RANK_MATH_REGISTRATION_SKIP', defined('RANK_MATH_REGISTRATION_SKIP') ? tgd_bool(RANK_MATH_REGISTRATION_SKIP) : 'not defined');
tgd_line('=> registration INVALID', $invalid === null ? 'unknown' : tgd_bool($invalid));

if ($invalid) {
    echo "\n  *** ROOT CAUSE: registration is invalid, so init_frontend() returns\n";
    echo "      early. RankMath\\Frontend\\Head is never constructed, which means\n";
    echo "      no pre_get_document_title filter and no meta description on any\n";
    echo "      page — while RANK_MATH_VERSION stays defined.\n";
    echo "\n      Fix (any one of these):\n";
    echo "        - connect the site: WP Admin > Rank Math SEO > Dashboard > Connect\n";
    echo "        - or finish/skip the setup wizard (sets rank_math_registration_skip)\n";
    echo "        - or add to wp-config.php: define('RANK_MATH_REGISTRATION_SKIP', true);\n";
}

/* --- 3. Modules and options ----------------------------------------- */
tgd_heading('3. Modules and options');
$modules = get_option('rank_math_modules', []);
tgd_line('option rank_math_modules', is_array($modules) ? (empty($modules) ? '(empty)' : implode(', ', $modules)) : var_export($modules, true));
if (class_exists('RankMath\Helper') && method_exists('RankMath\Helper', 'get_active_modules')) {
    $active = RankMath\Helper::get_active_modules();
    tgd_line('Helper::get_active_modules()', is_array($active) ? (empty($active) ? '(empty)' : implode(', ', $active)) : var_export($active, true));
}
echo "  (note: there is no 'frontend' module — the head output is core plugin\n";
echo "   behaviour, controlled by the registration check above, not by modules)\n";

$general = get_option('rank-math-options-general', []);
$titles = get_option('rank-math-options-titles', []);
tgd_line('rank-math-options-general keys', is_array($general) ? count($general) . ' keys' : var_export($general, true));
tgd_line('rank-math-options-titles keys', is_array($titles) ? count($titles) . ' keys' : var_export($titles, true));

foreach (['homepage_title', 'homepage_description', 'noindex_empty_taxonomies', 'rewrite_title', 'pt_page_title', 'pt_tg_tool_title', 'tax_tool_category_title'] as $key) {
    if (is_array($titles) && isset($titles[$key])) {
        tgd_line('  titles.' . $key, is_scalar($titles[$key]) ? (string) $titles[$key] : wp_json_encode($titles[$key]));
    }
}

/* --- 4. Head hooks --------------------------------------------------- */
tgd_heading('4. Head hooks (as seen from this request)');
tgd_line("has_action('rank_math/head')", has_action('rank_math/head') === false ? 'no' : 'YES (priority ' . has_action('rank_math/head') . ')');
$rm = function_exists('rank_math') ? rank_math() : null;
tgd_line('rank_math()->head set', is_object($rm) && isset($rm->head) ? 'YES' : 'no');
tgd_line('rank_math()->frontend set', is_object($rm) && isset($rm->frontend) ? 'YES' : 'no');
echo "  (WP-CLI is not a front-end request, so these are expected to read 'no'\n";
echo "   here even on a healthy site — the registration section above is the\n";
echo "   reliable signal. The theme performs the same check at render time in\n";
echo "   tg_rank_math_head_active().)\n";

/* --- 5. Stored meta spot check --------------------------------------- */
tgd_heading('5. Stored meta (what the theme will render)');

$front_id = (int) get_option('page_on_front');
if ($front_id > 0) {
    tgd_line('front page', '#' . $front_id . ' "' . get_the_title($front_id) . '"');
    tgd_line('  rank_math_title', (string) get_post_meta($front_id, 'rank_math_title', true) ?: '(empty — theme fallback)');
    tgd_line('  rank_math_description', (string) get_post_meta($front_id, 'rank_math_description', true) ?: '(empty — theme fallback)');
} else {
    tgd_line('front page', 'blog index (no page_on_front)');
    tgd_line('  titles.homepage_title', (is_array($titles) && !empty($titles['homepage_title'])) ? $titles['homepage_title'] : '(empty — theme fallback)');
    tgd_line('  titles.homepage_description', (is_array($titles) && !empty($titles['homepage_description'])) ? $titles['homepage_description'] : '(empty — theme fallback)');
}

$counts = ['tg_tool' => 0, 'page' => 0, 'post' => 0];
$missing = ['tg_tool' => 0, 'page' => 0, 'post' => 0];
foreach (array_keys($counts) as $type) {
    $ids = get_posts([
        'post_type' => $type,
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'fields' => 'ids',
        'suppress_filters' => false,
    ]);
    foreach ($ids as $id) {
        $counts[$type]++;
        if ((string) get_post_meta($id, 'rank_math_title', true) === '' || (string) get_post_meta($id, 'rank_math_description', true) === '') {
            $missing[$type]++;
        }
    }
    tgd_line($type, $counts[$type] . ' published, ' . $missing[$type] . ' missing a stored title or description');
}

$terms = get_terms(['taxonomy' => 'tool_category', 'hide_empty' => false]);
if (!is_wp_error($terms)) {
    $term_missing = 0;
    foreach ($terms as $term) {
        if ((string) get_term_meta($term->term_id, 'rank_math_title', true) === '' || (string) get_term_meta($term->term_id, 'rank_math_description', true) === '') {
            $term_missing++;
        }
    }
    tgd_line('tool_category terms', count($terms) . ' terms, ' . $term_missing . ' missing a stored title or description');
}

echo "\n  Anything counted as missing above still renders — the theme falls back\n";
echo "  to tg_seo_fallback_title() / tg_seo_fallback_description().\n";

echo "\n=== DONE ===\n";

<?php
/**
 * Merge PDF — SEO + content update (DATA ONLY).
 *
 * Updates ONLY the tg_tool post whose _tg_handler meta is 'merge'.
 * Does not touch the post title, slug, content, any other tool, or any theme code.
 *
 * Run with WP-CLI (from the WordPress root):
 *
 *   Windows / XAMPP:
 *     D:\xampp\php\php.exe D:\xampp\htdocs\wp-cli.phar --path=D:\xampp\htdocs\toolsgallery ^
 *       eval-file update-merge-pdf-seo.php
 *
 *   Production:
 *     wp eval-file update-merge-pdf-seo.php
 *
 * Add --dry-run to preview without writing:
 *     wp eval-file update-merge-pdf-seo.php --dry-run
 *
 * The script is idempotent: re-running it produces no further changes.
 * It verifies every value by reading it back after the write and reports PASS/FAIL.
 *
 * This file is saved as UTF-8. Values are defined here rather than passed on the
 * command line so that em dashes (—), en dashes (–) and apostrophes survive on
 * Windows shells, where console codepages mangle non-ASCII arguments.
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "This script must be run through WP-CLI: wp eval-file update-merge-pdf-seo.php\n");
    exit(1);
}

$dry_run = in_array('--dry-run', (array) ($args ?? []), true)
    || in_array('--dry-run', (array) ($GLOBALS['argv'] ?? []), true);

/* -------------------------------------------------------------------------
   1. Locate the Merge PDF tool by handler, and refuse to run on anything else.
   ------------------------------------------------------------------------- */
global $wpdb;

$post_id = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_tg_handler' AND meta_value = %s LIMIT 1",
    'merge'
));

if (!$post_id) {
    WP_CLI::error("No tg_tool post found with _tg_handler = 'merge'. Nothing was changed.");
}

$post = get_post($post_id);

if (!$post) {
    WP_CLI::error("Post ID {$post_id} does not exist. Nothing was changed.");
}
if ($post->post_type !== 'tg_tool') {
    WP_CLI::error("Post ID {$post_id} is a '{$post->post_type}', not a tg_tool. Nothing was changed.");
}
if ($post->post_title !== 'Merge PDF') {
    WP_CLI::error(
        "Safety check failed: post {$post_id} is titled '{$post->post_title}', expected 'Merge PDF'. Nothing was changed."
    );
}

$title_before = $post->post_title;
$slug_before  = $post->post_name;

WP_CLI::log("Target: post ID {$post_id} — \"{$title_before}\" (slug: {$slug_before})");
WP_CLI::log('Permalink: ' . get_permalink($post_id));
if ($dry_run) {
    WP_CLI::log('DRY RUN — no changes will be written.');
}
WP_CLI::log('');

/* -------------------------------------------------------------------------
   2. The new content.

   Storage formats were taken from the theme itself:
     - _tg_faqs / _tg_features / _tg_steps are JSON strings (wp_json_encode),
       decoded with json_decode() in functions.php and single-tg_tool.php.
     - Item keys are q/a (FAQs), icon/title/desc (features), step/desc (steps).
     - _tg_intro and the excerpt are plain text.
     - Feature icons must be names present in the $icon_svgs map in
       single-tg_tool.php, otherwise a generic fallback icon is rendered.
       'layers', 'move', 'rotate-cw', 'shield' and 'zap' all exist there.
   ------------------------------------------------------------------------- */

$rank_math_title = 'Merge PDF Free — Combine Up to 100 Files Online';

$rank_math_description = 'Merge up to 100 PDF files into one, free and online. Reorder and rotate files before combining. No signup, no uploads — everything runs in your browser.';

$intro = "Merge PDF lets you combine up to 100 PDF files into a single document, right in your browser. Most free merge tools stop at 15 or 20 files — Tool Acadmy handles large batches like scanned chapters, invoice sets, or multi-section reports in one go. Add your files, drag the preview frames to set the exact order, rotate any file that came in sideways, then download the merged PDF. It's completely free, needs no account, and your documents never leave your device.";

$excerpt = 'Combine up to 100 PDF files into one, free and in your browser. Reorder and rotate files before merging — no signup, no uploads.';

$faqs = [
    [
        'q' => 'How many PDF files can I merge at once?',
        'a' => 'You can merge up to 100 PDF files in a single batch — far more than most free tools, which usually cap you at 15 to 20. That makes it ideal for combining large sets like scanned book chapters, monthly invoices, or reports made of many separate sections.',
    ],
    [
        'q' => 'Can I choose the order the files are merged in?',
        'a' => 'Yes. After you add your files, each appears as a preview frame. Drag the frames into any order — the final PDF follows the order shown on screen, not the order you uploaded them in.',
    ],
    [
        'q' => 'Can I rotate a PDF before merging?',
        'a' => "Yes. If a file came in sideways or upside down, use the rotate button on its preview frame, and that rotation is applied to the file's pages in the merged document.",
    ],
    [
        'q' => 'Are my files uploaded to a server?',
        'a' => 'No. Merging happens entirely in your browser, so your PDFs are never sent to or stored on any server and your documents stay private.',
    ],
    [
        'q' => 'Is there a limit on file size?',
        'a' => "There's no fixed size limit, but because everything runs in your browser, very large batches use your device's memory and can be slower on older phones. For big jobs, a desktop browser works best.",
    ],
    [
        'q' => 'Is Merge PDF free to use?',
        'a' => 'Yes — completely free, with no signup, no watermarks, and no limit on how often you use it.',
    ],
];

$features = [
    [
        'icon'  => 'layers',
        'title' => 'Merge Up to 100 Files',
        'desc'  => 'Combine large batches in one go, far beyond the 15–20 file limit of most free tools.',
    ],
    [
        'icon'  => 'move',
        'title' => 'Drag to Reorder',
        'desc'  => 'Arrange files visually before merging; the output follows your chosen order.',
    ],
    [
        'icon'  => 'rotate-cw',
        'title' => 'Rotate Any File',
        'desc'  => 'Fix sideways or upside-down PDFs with one click before combining.',
    ],
    [
        'icon'  => 'shield',
        'title' => '100% Private',
        'desc'  => 'Files merge in your browser and are never uploaded to a server.',
    ],
    [
        'icon'  => 'zap',
        'title' => 'Free & No Signup',
        'desc'  => 'No account, no watermarks, no usage limits.',
    ],
];

$steps = [
    ['step' => 'Upload your PDFs',  'desc' => 'Select or drop up to 100 PDF files.'],
    ['step' => 'Arrange & rotate',  'desc' => 'Drag the preview frames to set the order; rotate any file if needed.'],
    ['step' => 'Merge & download',  'desc' => 'Click Merge PDF and download your combined file.'],
];

$meta_updates = [
    'rank_math_title'       => $rank_math_title,
    'rank_math_description' => $rank_math_description,
    '_tg_intro'             => $intro,
    '_tg_faqs'              => wp_json_encode($faqs),
    '_tg_features'          => wp_json_encode($features),
    '_tg_steps'             => wp_json_encode($steps),
];

/* -------------------------------------------------------------------------
   3. Suppress the wp_kses_post sanitize callback for the _tg_* JSON fields
      while we write.

      functions.php registers these keys via register_post_meta() with
      'sanitize_callback' => 'wp_kses_post'. update_post_meta() runs that
      callback, and wp_kses_normalize_entities() rewrites a bare "&" to
      "&amp;". The template then prints the value through esc_html(), so
      "Free & No Signup" would render on the page as the literal text
      "Free &amp; No Signup".

      The values above are trusted, hardcoded, plain-text strings with no
      markup, so bypassing kses for this write is safe. Everything is
      verified by read-back below regardless.
   ------------------------------------------------------------------------- */
$kses_keys    = ['_tg_faqs', '_tg_features', '_tg_steps', '_tg_intro'];
$removed_hooks = [];

foreach ($kses_keys as $key) {
    foreach (["sanitize_post_meta_{$key}_for_tg_tool", "sanitize_post_meta_{$key}"] as $hook) {
        if (has_filter($hook, 'wp_kses_post') !== false) {
            remove_filter($hook, 'wp_kses_post', 10);
            $removed_hooks[] = $hook;
        }
    }
}

/* -------------------------------------------------------------------------
   4. Write.
   ------------------------------------------------------------------------- */
if (!$dry_run) {
    foreach ($meta_updates as $key => $value) {
        update_post_meta($post_id, $key, $value);
    }

    // Excerpt only — title, slug, content and status are deliberately untouched.
    $result = wp_update_post([
        'ID'           => $post_id,
        'post_excerpt' => $excerpt,
    ], true);

    if (is_wp_error($result)) {
        WP_CLI::error('Failed to update the excerpt: ' . $result->get_error_message());
    }
}

// Restore the filters we removed so normal admin saves behave as before.
foreach ($removed_hooks as $hook) {
    add_filter($hook, 'wp_kses_post', 10);
}

/* -------------------------------------------------------------------------
   5. Flush caches, then verify by reading everything back.
   ------------------------------------------------------------------------- */
clean_post_cache($post_id);
wp_cache_delete($post_id, 'post_meta');
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
}

$failures = [];

$check = function ($label, $expected, $actual) use (&$failures) {
    $ok = ($expected === $actual);
    if (!$ok) {
        $failures[] = $label;
    }
    WP_CLI::log(sprintf('  [%s] %s', $ok ? 'PASS' : 'FAIL', $label));
    if (!$ok) {
        WP_CLI::log('        expected: ' . substr((string) $expected, 0, 160));
        WP_CLI::log('        actual  : ' . substr((string) $actual, 0, 160));
    }
};

WP_CLI::log('Verification (read back from the database):');
WP_CLI::log('');

// Plain-text meta.
foreach (['rank_math_title', 'rank_math_description', '_tg_intro'] as $key) {
    $check($key, $meta_updates[$key], get_post_meta($post_id, $key, true));
}

// Excerpt.
$check('post_excerpt', $excerpt, get_post_field('post_excerpt', $post_id));

// JSON meta: must be present, valid JSON, and decode back to exactly what we wrote.
$json_expectations = [
    '_tg_faqs'     => [$faqs, 6, ['q', 'a']],
    '_tg_features' => [$features, 5, ['icon', 'title', 'desc']],
    '_tg_steps'    => [$steps, 3, ['step', 'desc']],
];

foreach ($json_expectations as $key => [$expected_array, $expected_count, $expected_keys]) {
    $raw     = get_post_meta($post_id, $key, true);
    $decoded = json_decode($raw, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        $failures[] = $key;
        WP_CLI::log("  [FAIL] {$key} — invalid JSON: " . json_last_error_msg());
        continue;
    }

    $check("{$key} round-trips exactly", $expected_array, $decoded);
    $check("{$key} item count = {$expected_count}", $expected_count, is_array($decoded) ? count($decoded) : 0);

    $keys_ok = is_array($decoded) && $decoded !== [];
    foreach ((array) $decoded as $item) {
        foreach ($expected_keys as $k) {
            if (!array_key_exists($k, (array) $item)) {
                $keys_ok = false;
            }
        }
    }
    $check("{$key} uses keys (" . implode('/', $expected_keys) . ')', true, $keys_ok);

    // Catch double-encoded entities and mojibake from a bad write.
    if (preg_match('/&amp;|&#\d+;|Ã.|â€/u', $raw)) {
        $failures[] = "{$key} encoding";
        WP_CLI::log("  [FAIL] {$key} — contains escaped entities or mojibake");
    } else {
        WP_CLI::log("  [PASS] {$key} — no entity/mojibake damage");
    }
}

// Title and slug must be untouched.
$post_after = get_post($post_id);
WP_CLI::log('');
$check('post_title unchanged ("Merge PDF")', $title_before, $post_after->post_title);
$check('post_name (slug) unchanged', $slug_before, $post_after->post_name);

WP_CLI::log('');
WP_CLI::log('Permalink: ' . get_permalink($post_id));

if ($dry_run) {
    WP_CLI::warning('DRY RUN — nothing was written, so the checks above reflect the current stored values.');
    exit(0);
}

if ($failures) {
    WP_CLI::error('Finished with ' . count($failures) . ' failed check(s): ' . implode(', ', $failures));
}

WP_CLI::success("Merge PDF (post {$post_id}) updated: 6 FAQs, 5 features, 3 steps, intro, excerpt and RankMath meta all verified.");

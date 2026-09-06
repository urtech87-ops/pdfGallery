<?php
/**
 * migrate-content-to-intro.php — copy post_content into _tg_intro for tools
 * whose intro is empty. The tool template renders _tg_intro only, so this
 * content is currently invisible on the site.
 *
 * Dry run: wp eval-file migrate-content-to-intro.php dry-run
 * Apply:   wp eval-file migrate-content-to-intro.php
 *
 * post_content is left untouched as a backup. Run per environment.
 */
if (!defined('ABSPATH')) { fwrite(STDERR, "Run via WP-CLI\n"); exit(1); }

$dry = false;
foreach ((array)($GLOBALS['args'] ?? []) as $a) {
    if (in_array((string)$a, ['dry-run','--dry-run','dryrun'], true)) $dry = true;
}
if (!$dry && isset($GLOBALS['argv'])) {
    foreach ($GLOBALS['argv'] as $a) {
        if (in_array((string)$a, ['dry-run','--dry-run'], true)) $dry = true;
    }
}

echo "\n=== MIGRATE post_content -> _tg_intro — " . ($dry ? 'DRY RUN' : 'APPLY') . " ===\n\n";

$tools = get_posts(['post_type'=>'tg_tool','post_status'=>'publish','posts_per_page'=>-1]);
$done = 0; $skipped = 0; $flagged = [];

foreach ($tools as $t) {
    $intro = get_post_meta($t->ID, '_tg_intro', true);
    $words = str_word_count(strip_tags($t->post_content));

    if (trim($intro) !== '') { $skipped++; continue; }  // never overwrite
    if ($words < 50)         { $skipped++; continue; }  // nothing worth moving

    // Flag any legacy branding so it can be reviewed.
    if (preg_match('/Tool\s*Acadmy|toolacadmy|ToolsGallery/i', $t->post_content)) {
        $flagged[] = $t->post_name;
    }

    echo str_pad($t->post_name, 34) . $words . "w\n";
    if (!$dry) {
        update_post_meta($t->ID, '_tg_intro', wp_kses_post($t->post_content));
    }
    $done++;
}

echo "\n--- SUMMARY ---\n";
echo ($dry ? 'Would migrate' : 'Migrated') . " : $done tools\n";
echo "Skipped (intro already set or content too short) : $skipped\n";
if ($flagged) {
    echo "\n*** LEGACY BRAND TEXT — review these after migrating: ***\n";
    foreach ($flagged as $f) echo "  $f\n";
}
echo "\n";
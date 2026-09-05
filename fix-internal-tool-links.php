<?php
/**
 * fix-internal-tool-links.php — repair /tool/<slug>/ links in post content.
 *
 * Internal links were written using _tg_handler values instead of post_name,
 * so ~27 distinct slugs resolve to 404. This maps handler -> real slug and
 * rewrites the hrefs.
 *
 * USAGE (from the WordPress root):
 *   Dry run:  wp eval-file fix-internal-tool-links.php dry-run
 *   Apply:    wp eval-file fix-internal-tool-links.php
 *
 * Must be run on EACH environment (local and production) separately.
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run via WP-CLI: wp eval-file fix-internal-tool-links.php\n");
    exit(1);
}

function tgl_log($l = '') { if (class_exists('WP_CLI')) { WP_CLI::log($l); } else { echo $l . "\n"; } }

$dry = false;
foreach ((array) ($GLOBALS['args'] ?? []) as $a) {
    if (in_array((string) $a, ['dry-run', '--dry-run', 'dryrun'], true)) { $dry = true; }
}
if (!$dry && isset($GLOBALS['argv'])) {
    foreach ($GLOBALS['argv'] as $a) {
        if (in_array((string) $a, ['dry-run', '--dry-run'], true)) { $dry = true; }
    }
}

tgl_log("\n=== FIX INTERNAL TOOL LINKS — " . ($dry ? 'DRY RUN (no writes)' : 'APPLY (writing)') . " ===\n");

/* 1. Build maps from the database. Never hard-code slugs. */
$tools = get_posts([
    'post_type'      => 'tg_tool',
    'post_status'    => 'any',
    'posts_per_page' => -1,
]);

$valid_slugs   = [];  // post_name => true
$handler_to_slug = []; // _tg_handler => post_name

foreach ($tools as $t) {
    $valid_slugs[$t->post_name] = true;
    $h = get_post_meta($t->ID, '_tg_handler', true);
    if ($h && !isset($handler_to_slug[$h])) {
        $handler_to_slug[$h] = $t->post_name;
    }
}
tgl_log('Tools found        : ' . count($tools));
tgl_log('Handler mappings   : ' . count($handler_to_slug) . "\n");

/* 2. Scan all published content for /tool/<slug>/ links. */
global $wpdb;
$rows = $wpdb->get_results(
    "SELECT ID, post_type, post_name, post_content
     FROM {$wpdb->posts}
     WHERE post_status = 'publish'
       AND post_content LIKE '%/tool/%'"
);

$fixed_count = 0;
$unresolved  = [];
$changed_posts = 0;

foreach ($rows as $r) {
    if (!preg_match_all('#/tool/([a-z0-9\-]+)/#i', $r->post_content, $m)) { continue; }

    $new_content = $r->post_content;
    $changes = [];

    foreach (array_unique($m[1]) as $slug) {
        if (isset($valid_slugs[$slug])) { continue; }          // already fine
        if (!isset($handler_to_slug[$slug])) {                  // cannot resolve
            $unresolved[$slug][] = $r->post_type . ' #' . $r->ID;
            continue;
        }
        $correct = $handler_to_slug[$slug];
        $before  = $new_content;
        $new_content = str_replace('/tool/' . $slug . '/', '/tool/' . $correct . '/', $new_content);
        if ($before !== $new_content) {
            $changes[] = $slug . ' -> ' . $correct;
            $fixed_count++;
        }
    }

    if ($changes) {
        $changed_posts++;
        tgl_log($r->post_type . ' #' . $r->ID . ' (' . $r->post_name . ')');
        foreach ($changes as $c) { tgl_log('    ' . $c); }
        if (!$dry) {
            $wpdb->update($wpdb->posts, ['post_content' => $new_content], ['ID' => $r->ID]);
            clean_post_cache($r->ID);
        }
    }
}

/* 3. Report. */
tgl_log("\n--- SUMMARY ---");
tgl_log(($dry ? 'Would fix' : 'Fixed') . ' : ' . $fixed_count . ' link slugs across ' . $changed_posts . ' posts');

if ($unresolved) {
    tgl_log("\n*** UNRESOLVED — no tool has this slug OR handler (needs manual review): ***");
    foreach ($unresolved as $slug => $where) {
        tgl_log('  ' . str_pad($slug, 30) . implode(', ', array_unique($where)));
    }
} else {
    tgl_log('Unresolved : none');
}
tgl_log('');
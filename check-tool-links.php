<?php
if (!defined('ABSPATH')) { fwrite(STDERR, "Run via WP-CLI\n"); exit(1); }
global $wpdb;

$rows = $wpdb->get_results(
    "SELECT ID, post_type, post_name, post_title, post_content
     FROM {$wpdb->posts}
     WHERE post_status = 'publish'
       AND post_content LIKE '%/tool/%'"
);

$found = [];
foreach ($rows as $r) {
    if (preg_match_all('#/tool/([a-z0-9\-]+)/#i', $r->post_content, $m)) {
        foreach (array_unique($m[1]) as $slug) {
            $found[$slug][] = $r->post_type . ' #' . $r->ID . ' (' . $r->post_name . ')';
        }
    }
}

echo "\n=== /tool/ links found in published content ===\n";
foreach ($found as $slug => $where) {
    $exists = get_page_by_path($slug, OBJECT, 'tg_tool');
    $status = $exists ? 'OK' : '*** BROKEN — no tg_tool with this slug ***';
    echo str_pad($slug, 34) . $status . "\n";
    foreach (array_unique($where) as $w) { echo "      linked from: $w\n"; }
}
echo "\nTotal distinct slugs: " . count($found) . "\n";
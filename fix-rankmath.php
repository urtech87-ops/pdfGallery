<?php
echo "=== Setting RankMath Meta for All Tools ===\n\n";

// Set focus keywords for all tools
$tools = get_posts([
    'post_type' => 'tg_tool',
    'posts_per_page' => -1,
    'post_status' => 'publish',
]);

$count = 0;
foreach ($tools as $tool) {
    $kw = 'free online ' . strtolower($tool->post_title);
    update_post_meta($tool->ID, 'rank_math_focus_keyword', $kw);
    update_post_meta($tool->ID, 'rank_math_robots', ['index', 'follow']);
    update_post_meta($tool->ID, 'rank_math_title', $tool->post_title . ' - Free Online Tool | Tool Acadmy');
    $excerpt = $tool->post_excerpt;
    if (empty($excerpt)) {
        $excerpt = 'Use free ' . strtolower($tool->post_title) . ' online. No signup required. 100% free. Works in any browser.';
    }
    update_post_meta($tool->ID, 'rank_math_description', substr($excerpt, 0, 155));
    echo "  Updated: " . $tool->post_title . "\n";
    $count++;
}
echo "\nDone: $count tools updated with RankMath meta\n\n";

// Set category meta
echo "=== Setting Category Meta ===\n\n";
$cats = get_terms(['taxonomy' => 'tool_category', 'hide_empty' => false]);
foreach ($cats as $cat) {
    $tools_in_cat = count(get_posts([
        'post_type' => 'tg_tool',
        'posts_per_page' => -1,
        'tax_query' => [
            [
                'taxonomy' => 'tool_category',
                'field' => 'slug',
                'terms' => $cat->slug,
            ]
        ],
    ]));
    update_term_meta($cat->term_id, 'rank_math_title', 'Free Online ' . $cat->name . ' (' . $tools_in_cat . '+ Tools) | Tool Acadmy');
    update_term_meta($cat->term_id, 'rank_math_description', 'Browse ' . $tools_in_cat . '+ free online ' . strtolower($cat->name) . '. No download, no signup required. Works in any browser instantly.');
    update_term_meta($cat->term_id, 'rank_math_focus_keyword', 'free online ' . strtolower($cat->name));
    echo "  Updated: " . $cat->name . " ($tools_in_cat tools)\n";
}

echo "\n=== DONE ===\n";
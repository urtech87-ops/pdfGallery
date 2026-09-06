<?php
if (!defined('ABSPATH')) { exit(1); }
$tools = get_posts(['post_type'=>'tg_tool','post_status'=>'any','posts_per_page'=>-1]);
$seen = [];
foreach ($tools as $t) {
    $h = get_post_meta($t->ID, '_tg_handler', true);
    if (!$h) {
        echo "MISSING handler : #{$t->ID} ({$t->post_name})\n";
    } elseif (isset($seen[$h])) {
        echo "DUPLICATE '{$h}' : #{$t->ID} ({$t->post_name}) also on #{$seen[$h]}\n";
    } else {
        $seen[$h] = $t->ID;
    }
}
echo "Checked " . count($tools) . " tools, " . count($seen) . " unique handlers\n";
<?php
if (!defined('ABSPATH')) { exit(1); }
$tools = get_posts(['post_type'=>'tg_tool','post_status'=>'publish','posts_per_page'=>-1]);
$both = $pc_only = $intro_only = $neither = 0;
echo str_pad('SLUG', 34) . str_pad('post_content', 14) . "_tg_intro\n";
echo str_repeat('-', 62) . "\n";
foreach ($tools as $t) {
    $pc = str_word_count(strip_tags($t->post_content));
    $in = str_word_count(strip_tags(get_post_meta($t->ID, '_tg_intro', true)));
    if ($pc > 50 && $in > 50)      { $both++; }
    elseif ($pc > 50)              { $pc_only++; }
    elseif ($in > 50)              { $intro_only++; }
    else                           { $neither++; }
    if ($pc > 50 || $in < 100) {
        echo str_pad($t->post_name, 34) . str_pad($pc . 'w', 14) . $in . "w\n";
    }
}
echo "\nSUMMARY (>50 words counts as 'has content')\n";
echo "  Both fields   : $both\n";
echo "  post_content only (INVISIBLE on site) : $pc_only\n";
echo "  _tg_intro only : $intro_only\n";
echo "  Neither (thin) : $neither\n";
echo "  Total: " . count($tools) . "\n";
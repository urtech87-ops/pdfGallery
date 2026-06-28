<?php
error_reporting(E_ERROR | E_PARSE);

echo "=== Word Count Audit ===\n\n";

$tools = get_posts([
  'post_type' => 'tg_tool',
  'posts_per_page' => -1,
  'post_status' => 'publish',
]);

$thin = [];
$ok = [];

foreach ($tools as $t) {
  $content = $t->post_content . ' ' . $t->post_excerpt;
  $steps = get_post_meta($t->ID, '_tg_steps', true);
  $faqs = get_post_meta($t->ID, '_tg_faqs', true);
  $features = get_post_meta($t->ID, '_tg_features', true);
  $content .= ' ' . $steps . ' ' . $faqs . ' ' . $features;
  $words = str_word_count(strip_tags($content));
  if ($words < 150) {
    $thin[] = "  THIN ({$words}w): {$t->post_title}";
  } else {
    $ok[] = "  OK ({$words}w): {$t->post_title}";
  }
}

echo "THIN CONTENT PAGES (" . count($thin) . "):\n";
foreach ($thin as $t) echo $t . "\n";
echo "\nOK PAGES (" . count($ok) . "):\n";
foreach (array_slice($ok, 0, 5) as $o) echo $o . "\n";
echo "  ... and " . max(0, count($ok)-5) . " more OK\n";

echo "\n=== Blog Posts ===\n";
$posts = get_posts([
  'post_type' => 'post',
  'post_status' => 'publish',
  'posts_per_page' => -1,
]);
foreach ($posts as $p) {
  $words = str_word_count(strip_tags($p->post_content));
  $status = $words >= 500 ? 'OK' : 'SHORT';
  echo "  [{$status}] ({$words}w): {$p->post_title}\n";
}

echo "\n=== Static Pages ===\n";
$pages = get_posts([
  'post_type' => 'page',
  'post_status' => 'publish',
  'posts_per_page' => -1,
]);
foreach ($pages as $p) {
  $words = str_word_count(strip_tags($p->post_content));
  $status = $words >= 200 ? 'OK' : 'THIN';
  echo "  [{$status}] ({$words}w): {$p->post_title}\n";
}

echo "\n=== Summary ===\n";
echo "Total tools: " . count($tools) . "\n";
echo "Thin tools: " . count($thin) . "\n";
echo "OK tools: " . count($ok) . "\n";
echo "Blog posts: " . count($posts) . "\n";
echo "Pages: " . count($pages) . "\n";
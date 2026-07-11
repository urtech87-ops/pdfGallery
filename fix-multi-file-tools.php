<?php
/**
 * One-off maintenance script: set _tg_multi_file = 'true' for the compress
 * tool and every image converter. Without this meta the runner stays in
 * single-file mode, so box._tgFiles only ever holds one file and the
 * per-file results + "Download All (ZIP)" UI can never appear.
 *
 * Run with: wp eval-file fix-multi-file-tools.php
 * Then flush permalinks: wp-admin → Settings → Permalinks → Save.
 */
error_reporting(E_ERROR | E_PARSE);

echo "=== Enabling multi-file on compress + converters ===\n\n";

$multi_file_handlers = [
  'img-compress',
  'img-convert',
  'img-to-jpg',
  'img-to-png',
  'img-to-webp',
  'img-to-gif',
  'img-to-svg',
  'img-to-ico',
  'img-to-bmp',
  'img-to-tiff',
  'img-to-avif',
  'img-to-heic',
];

global $wpdb;

$updated = 0;
$already = 0;
$missing = 0;

foreach ($multi_file_handlers as $handler) {
  $post_id = $wpdb->get_var($wpdb->prepare(
    "SELECT post_id FROM {$wpdb->prefix}postmeta WHERE meta_key='_tg_handler' AND meta_value=%s LIMIT 1",
    $handler
  ));

  if (!$post_id) {
    echo "  NOT FOUND: {$handler} (tool post missing — create/check it)\n";
    $missing++;
    continue;
  }

  $current = get_post_meta($post_id, '_tg_multi_file', true);
  if ($current === 'true') {
    echo "  OK [{$handler}]: post {$post_id} already multi-file\n";
    $already++;
    continue;
  }

  update_post_meta($post_id, '_tg_multi_file', 'true');
  echo "  Updated [{$handler}]: post {$post_id} " . ($current ?: 'empty') . " → true\n";
  $updated++;
}

echo "\nUpdated: {$updated}  Already correct: {$already}  Missing: {$missing}\n";
echo "Now flush permalinks (Settings → Permalinks → Save) and hard-refresh.\n";
echo "=== Done ===\n";

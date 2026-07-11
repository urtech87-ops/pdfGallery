<?php
/**
 * One-off maintenance script: set _tg_tool_type = 'data-input' for every
 * tool whose JS handler is a data-input tool (no file upload). Without
 * this meta the template renders a file-upload box and the tool's UI
 * never appears ("no box, just a button").
 *
 * Run with: wp eval-file fix-data-input-tool-types.php
 * Then flush permalinks: wp-admin → Settings → Permalinks → Save.
 */
error_reporting(E_ERROR | E_PARSE);

echo "=== Fixing data-input tool types ===\n\n";

// Handlers registered as data-input tools in assets/js/tools/*.js
// (CONFIG.inputType === 'data' or CONFIG.dataInput === true)
$data_input_handlers = [
  'img-qr',
  'img-chart',
  'base64-encoder',
  'base64-decoder',
  'url-encoder',
  'hash-generator',
  'color-palette',
  'color-picker',
  'countdown-timer',
  'duplicate-remover',
  'line-break-remover',
  'random-number',
  'stopwatch',
  'text-binary',
  'text-case',
  'unit-converter',
];

global $wpdb;

$updated = 0;
$already = 0;
$missing = 0;

foreach ($data_input_handlers as $handler) {
  $post_id = $wpdb->get_var($wpdb->prepare(
    "SELECT post_id FROM {$wpdb->prefix}postmeta WHERE meta_key='_tg_handler' AND meta_value=%s LIMIT 1",
    $handler
  ));

  if (!$post_id) {
    echo "  NOT FOUND: {$handler} (tool post missing — create/check it)\n";
    $missing++;
    continue;
  }

  $current = get_post_meta($post_id, '_tg_tool_type', true);
  if ($current === 'data-input') {
    echo "  OK [{$handler}]: post {$post_id} already data-input\n";
    $already++;
    continue;
  }

  update_post_meta($post_id, '_tg_tool_type', 'data-input');
  echo "  Updated [{$handler}]: post {$post_id} " . ($current ?: 'empty') . " → data-input\n";
  $updated++;
}

echo "\nUpdated: {$updated}  Already correct: {$already}  Missing: {$missing}\n";
echo "Now flush permalinks (Settings → Permalinks → Save) and hard-refresh.\n";
echo "=== Done ===\n";

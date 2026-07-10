<?php
/**
 * One-off maintenance script: set correct _tg_accept_types for every
 * file-based tool so uploads pass validation.
 *
 * Run with: wp eval-file fix-image-accept-types.php
 */
error_reporting(E_ERROR | E_PARSE);

echo "=== Fixing Image Tool Accept Types ===\n\n";

// Map of handler => accepted file types
$image_accept = [
  // Image editing tools — accept images
  'img-compress'         => 'image/*',
  'img-resize'           => 'image/*',
  'img-crop'             => 'image/*',
  'img-flip'             => 'image/*',
  'img-rotate'           => 'image/*',
  'img-add-text'         => 'image/*',
  'img-add-border'       => 'image/*',
  'img-convert'          => 'image/*',
  'img-grayscale'        => 'image/*',
  'img-sharpen'          => 'image/*',
  'img-remove-bg'        => 'image/*',
  'img-colorize'         => 'image/*',
  'img-restore'          => 'image/*',
  'img-upscale'          => 'image/*',
  'img-blur-bg'          => 'image/*',
  'img-remove-watermark' => 'image/*',
  'img-remove-objects'   => 'image/*',
  'img-ocr'              => 'image/*',
  'img-translate-text'   => 'image/*',
  'img-change-bg'        => 'image/*',
  'img-split'            => 'image/*',
  'img-combine'          => 'image/*',
  'img-collage'          => 'image/*',
  'img-round'            => 'image/*',
  'img-profile'          => 'image/*',
  'img-pixelate'         => 'image/*',
  'img-watermark'        => 'image/*',
  'img-meme'             => 'image/*',
  'img-to-jpg'           => 'image/*',
  'img-to-png'           => 'image/*',
  'img-to-webp'          => 'image/*',
  'img-to-gif'           => 'image/*',
  'img-to-bmp'           => 'image/*',
  'img-to-ico'           => 'image/*',
  'img-to-svg'           => 'image/*',
  'img-to-tiff'          => 'image/*',
  'img-to-avif'          => 'image/*',
  'img-to-heic'          => 'image/*',

  // Chart and QR are data-input tools — no file upload, skipped

  // PDF tools
  'merge'                => '.pdf',
  'compress'             => '.pdf',
  'split'                => '.pdf',
  'rotate-pdf'           => '.pdf',
  'pdf-to-jpg'           => '.pdf',
  'jpg-to-pdf'           => '.jpg,.jpeg,.png,.webp',
  'pdf-to-word'          => '.pdf',
  'word-to-pdf'          => '.doc,.docx',
  'unlock-pdf'           => '.pdf',
  'protect-pdf'          => '.pdf',
  'edit-pdf'             => '.pdf',
  'add-watermark'        => '.pdf',
  'remove-watermark'     => '.pdf',
  'add-page-numbers'     => '.pdf',
  'rearrange-pdf'        => '.pdf',
  'extract-text'         => '.pdf',
  'extract-images'       => '.pdf',
  'redact-pdf'           => '.pdf',
  'crop-pdf'             => '.pdf',
  'add-signature'        => '.pdf',
  'pdf-to-excel'         => '.pdf',
  'excel-to-pdf'         => '.xlsx,.xls,.csv',
  'pdf-to-ppt'           => '.pdf',
  'ppt-to-pdf'           => '.pptx,.ppt',
  'pdf-to-epub'          => '.pdf',
  'epub-to-pdf'          => '.epub',
  'pdf-translate'        => '.pdf',
  'pdf-summarize'        => '.pdf',

  // Video tools
  'vid-compress'         => 'video/*',
  'vid-convert'          => 'video/*',
  'vid-to-mp3'           => 'video/*',
  'vid-trim'             => 'video/*',
  'vid-rotate'           => 'video/*',
  'vid-resize'           => 'video/*',
  'vid-speed'            => 'video/*',
  'vid-watermark'        => 'video/*',
  'vid-remove-audio'     => 'video/*',
  'vid-screenshot'       => 'video/*',
  'vid-crop'             => 'video/*',
  'vid-reverse'          => 'video/*',
  'vid-stabilize'        => 'video/*',
  'vid-blur'             => 'video/*',
  'vid-loop'             => 'video/*',
  'vid-thumbnail'        => 'video/*',
  'vid-filters'          => 'video/*',
  'vid-resolution'       => 'video/*',
  'vid-audio-extract'    => 'video/*',
  'vid-to-gif'           => 'video/*',
  'gif-to-vid'           => '.gif',
  'vid-subtitles'        => 'video/*',

  // File tools
  'excel-to-csv'         => '.xlsx,.xls',
  'csv-to-excel'         => '.csv',
  'json-to-csv'          => '.json',
  'csv-to-json'          => '.csv',
  'xml-to-json'          => '.xml',
  'json-to-xml'          => '.json',
  'md-to-html'           => '.md,.markdown',
  'html-to-md'           => '.html,.htm',
  'txt-to-pdf'           => '.txt',
  'pdf-to-txt'           => '.pdf',
  'html-to-pdf'          => '.html,.htm',
];

// Get all tools
$tools = get_posts([
  'post_type'      => 'tg_tool',
  'posts_per_page' => -1,
  'post_status'    => 'publish',
]);

$updated = 0;
$skipped = 0;

foreach ($tools as $tool) {
  $handler = get_post_meta($tool->ID, '_tg_handler', true);

  if (!$handler) {
    echo "  NO HANDLER: {$tool->post_title}\n";
    $skipped++;
    continue;
  }

  if (!isset($image_accept[$handler])) {
    $skipped++;
    continue;
  }

  $new_accept = $image_accept[$handler];
  $current = get_post_meta($tool->ID, '_tg_accept_types', true);

  update_post_meta($tool->ID, '_tg_accept_types', $new_accept);

  echo "  Updated [{$handler}]: " . ($current ?: 'empty') . " → {$new_accept}\n";
  $updated++;
}

echo "\nUpdated: {$updated} tools\n";
echo "Skipped: {$skipped} tools\n";
echo "=== Done ===\n";

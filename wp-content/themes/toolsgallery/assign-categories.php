<?php
/**
 * Blog Category Seeder
 * Run via: wp eval-file wp-content/themes/toolsgallery/assign-categories.php
 */

echo "=== Blog Category Setup ===\n\n";

// Create categories if they don't exist
$categories = [
    ['name' => 'PDF Guides',       'slug' => 'pdf-guides'],
    ['name' => 'Image Guides',     'slug' => 'image-guides'],
    ['name' => 'AI Writing Guides','slug' => 'ai-writing-guides'],
    ['name' => 'Tool Tips',        'slug' => 'tool-tips'],
];

foreach ($categories as $cat_data) {
    $existing = get_term_by('slug', $cat_data['slug'], 'category');
    if (!$existing) {
        $result = wp_insert_term($cat_data['name'], 'category', ['slug' => $cat_data['slug']]);
        if (is_wp_error($result)) {
            echo "  FAILED to create category: {$cat_data['name']} — " . $result->get_error_message() . "\n";
        } else {
            echo "  Created category: {$cat_data['name']}\n";
        }
    } else {
        echo "  Already exists: {$cat_data['name']}\n";
    }
}

echo "\n=== Assigning Categories to Posts ===\n\n";

// post slug => category slug
$post_category_map = [
    'how-to-merge-pdf-files-online-free'           => 'pdf-guides',
    'how-to-compress-pdf-without-losing-quality'   => 'pdf-guides',
    'how-to-convert-jpg-to-pdf-free-online'        => 'pdf-guides',
    'best-free-image-background-remover-online'    => 'image-guides',
    'free-grammar-checker-online'                  => 'ai-writing-guides',
];

foreach ($post_category_map as $post_slug => $cat_slug) {
    $post = get_page_by_path($post_slug, OBJECT, 'post');
    if (!$post) {
        echo "  NOT FOUND: $post_slug\n";
        continue;
    }

    $cat = get_term_by('slug', $cat_slug, 'category');
    if (!$cat) {
        echo "  CATEGORY NOT FOUND: $cat_slug\n";
        continue;
    }

    // Replace all categories (removes uncategorized)
    $result = wp_set_post_categories($post->ID, [$cat->term_id], false);
    if (is_wp_error($result)) {
        echo "  FAILED: " . $post->post_title . "\n";
    } else {
        echo "  Assigned: " . $post->post_title . " → " . $cat->name . "\n";
    }
}

echo "\n=== Done ===\n";

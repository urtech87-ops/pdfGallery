<?php
echo "=== Assigning Blog Post Categories ===\n\n";

// Step 1: Create categories if they don't exist
$categories_to_create = [
    ['name' => 'PDF Guides', 'slug' => 'pdf-guides'],
    ['name' => 'Image Guides', 'slug' => 'image-guides'],
    ['name' => 'AI Writing Guides', 'slug' => 'ai-writing-guides'],
    ['name' => 'Tool Tips', 'slug' => 'tool-tips'],
];

echo "Creating categories...\n";
foreach ($categories_to_create as $cat) {
    $existing = get_term_by('slug', $cat['slug'], 'category');
    if ($existing) {
        echo "  Already exists: {$cat['name']}\n";
    } else {
        $result = wp_insert_term($cat['name'], 'category', ['slug' => $cat['slug']]);
        if (is_wp_error($result)) {
            echo "  FAILED: {$cat['name']} — " . $result->get_error_message() . "\n";
        } else {
            echo "  Created: {$cat['name']}\n";
        }
    }
}

// Step 2: Assign posts to categories
echo "\nAssigning posts to categories...\n";

$assignments = [
    'how-to-merge-pdf-files-online-free' => 'pdf-guides',
    'how-to-compress-pdf-without-losing-quality' => 'pdf-guides',
    'how-to-convert-jpg-to-pdf-free-online' => 'pdf-guides',
    'best-free-image-background-remover-online' => 'image-guides',
    'free-grammar-checker-online' => 'ai-writing-guides',
];

foreach ($assignments as $post_slug => $cat_slug) {
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

    // Remove uncategorized and assign correct category
    $uncategorized = get_term_by('slug', 'uncategorized', 'category');
    wp_remove_object_terms(
        $post->ID,
        $uncategorized ? $uncategorized->term_id : 1,
        'category'
    );

    $result = wp_set_post_categories(
        $post->ID,
        [$cat->term_id],
        false
    );

    if (is_wp_error($result)) {
        echo "  FAILED: {$post->post_title}\n";
    } else {
        echo "  ✓ {$post->post_title}\n";
        echo "    → {$cat->name}\n";
    }
}

// Step 3: Verify assignments
echo "\nVerification:\n";
$posts = get_posts([
    'post_type' => 'post',
    'post_status' => 'publish',
    'posts_per_page' => -1,
]);

foreach ($posts as $p) {
    $cats = get_the_category($p->ID);
    $cat_names = array_map(function ($c) {
        return $c->name;
    }, $cats);
    echo "  {$p->post_title}\n";
    echo "    Categories: "
        . implode(', ', $cat_names) . "\n";
}

echo "\n=== Done ===\n";
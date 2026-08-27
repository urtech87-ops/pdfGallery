<?php
/**
 * rebrand-toolshall.php — database content rebrand, "Tool Acadmy" -> "ToolsHall".
 *
 * The theme files were rebranded in the same change that added this script.
 * Everything below fixes the copy that lives in the database instead:
 *
 *   posts table    post_content, post_excerpt
 *   postmeta       _tg_intro, _tg_faqs, _tg_features, _tg_steps
 *   postmeta       every rank_math_* value carrying the old brand
 *
 * The rank_math_* sweep is the reason this script exists alongside
 * apply-toolshall-seo.php. That script writes RankMath meta for the nine core
 * pages and for every published tg_tool, and deliberately leaves everything
 * else alone — so the blog posts still carry "Tool Acadmy" in their
 * rank_math_title / rank_math_description ("How to Merge PDF...", "How to
 * Compress a PDF...", "Best Free Image Background Remover...", "Free Grammar
 * Checker..." and friends). Those are picked up here, together with any other
 * rank_math_* key (og_title, twitter_description, schema, focus_keyword, ...)
 * whose stored value mentions the old brand: the rule is the same for all of
 * them, so restricting the sweep to two keys would only leave the brand
 * misspelled somewhere less visible.
 *
 * USAGE (from the WordPress root):
 *
 *   Dry run (no writes, prints the full plan and the before/after counts):
 *       wp eval-file rebrand-toolshall.php dry-run
 *       wp eval-file rebrand-toolshall.php --dry-run
 *
 *   Apply (writes to the database, then reads the rows back and verifies):
 *       wp eval-file rebrand-toolshall.php
 *
 *   Some WP-CLI versions reject unregistered flags on `eval-file`. If
 *   `--dry-run` errors with "unknown parameter", use the positional form
 *   `dry-run` instead — the two are handled identically. The mode is echoed
 *   in a banner at the top of every run, so there is never any doubt which
 *   one ran.
 *
 * WHAT IS AND IS NOT CHANGED
 *
 *   Changed  the brand *name*: "Tool Acadmy", "Tools Acadmy", "ToolAcadmy"
 *            and a bare leftover "Acadmy" all become "ToolsHall".
 *            Possessives need no special case — the match stops before the
 *            apostrophe, so "Tool Acadmy's" comes out as "ToolsHall's".
 *
 *   Kept     domains, emails and social handles: toolacadmy.com,
 *            contact@toolacadmy.com, twitter.com/toolacadmy. Swapping the
 *            live domain in post content belongs with the site migration
 *            (the `wp search-replace` step), not here, and doing half of it
 *            from this script would leave the two out of step. Every such
 *            occurrence is masked before the brand pass and restored
 *            afterwards, byte for byte, then counted in the final report so
 *            the migration knows what is still waiting for it.
 *
 * FORMAT SAFETY
 *
 *   _tg_faqs, _tg_features and _tg_steps are stored as JSON strings (see
 *   tg_register_meta_fields() and single-tg_tool.php, which json_decode them).
 *   "ToolsHall" contains no character that is special inside a JSON string,
 *   so a plain text replacement keeps the document byte-identical apart from
 *   the brand — no re-encoding, so no reordered keys, changed escaping or
 *   lost formatting. Every value that parsed as JSON before the replacement
 *   is re-parsed afterwards and skipped if it somehow no longer parses.
 *
 *   PHP-serialized values cannot be text-replaced that way: the length
 *   prefixes (s:11:"Tool Acadmy") would stop matching the strings. Those are
 *   unserialized, walked recursively, and re-serialized.
 *
 *   Rows are written with $wpdb->update rather than wp_update_post, for two
 *   reasons: wp_update_post runs the content through wp_kses when no user is
 *   logged in (which WP-CLI is not), which would quietly strip markup out of
 *   the tool pages, and it would bump post_modified on every touched post.
 *   post_modified is preserved here — a brand fix is not a content update and
 *   should not reshuffle the sitemap's lastmod dates.
 *
 * @package ToolsGallery
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "This script must be run through WP-CLI: wp eval-file rebrand-toolshall.php\n");
    exit(1);
}

/* =========================================================================
   0. Output helpers — work under WP-CLI, degrade to echo otherwise.
   ========================================================================= */

function tshdb_log($line = '')
{
    if (class_exists('WP_CLI')) {
        WP_CLI::log($line);
        return;
    }
    echo $line . "\n";
}

function tshdb_rule($char = '-')
{
    tshdb_log(str_repeat($char, 78));
}

function tshdb_heading($text)
{
    tshdb_log('');
    tshdb_rule('=');
    tshdb_log($text);
    tshdb_rule('=');
}

/** Collapse a value to one short line so the report stays readable. */
function tshdb_snippet($text, $length = 96)
{
    $text = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags((string) $text)));

    if (function_exists('mb_strlen') && mb_strlen($text, 'UTF-8') > $length) {
        return mb_substr($text, 0, $length - 1, 'UTF-8') . '…';
    }

    if (!function_exists('mb_strlen') && strlen($text) > $length) {
        return substr($text, 0, $length - 1) . '…';
    }

    return $text;
}

/* =========================================================================
   1. Mode detection. Mirrors apply-toolshall-seo.php so both scripts take
      the same arguments.
   ========================================================================= */

function tshdb_is_dry_run()
{
    // Positional args handed to `wp eval-file <file> <arg>...`.
    if (isset($GLOBALS['args']) && is_array($GLOBALS['args'])) {
        foreach ($GLOBALS['args'] as $arg) {
            if (in_array((string) $arg, ['dry-run', '--dry-run', 'dryrun'], true)) {
                return true;
            }
        }
    }

    // Associative args, if this version of WP-CLI passed the flag through.
    if (isset($GLOBALS['assoc_args']) && is_array($GLOBALS['assoc_args'])) {
        if (!empty($GLOBALS['assoc_args']['dry-run'])) {
            return true;
        }
    }

    // Raw command line, as a last resort.
    if (isset($GLOBALS['argv']) && is_array($GLOBALS['argv'])) {
        foreach ($GLOBALS['argv'] as $arg) {
            if (in_array((string) $arg, ['dry-run', '--dry-run'], true)) {
                return true;
            }
        }
    }

    // Escape hatch for shells that mangle flags.
    return getenv('TOOLSHALL_REBRAND_DRY_RUN') === '1';
}

$dry_run = tshdb_is_dry_run();

/* =========================================================================
   2. The rebrand itself.
   ========================================================================= */

/**
 * Spellings of the old brand, most specific first.
 *
 * Order matters: "Tool Acadmy" has to be consumed as a unit before the bare
 * "Acadmy" rule runs, or it would come out as "Tool ToolsHall".
 */
function tshdb_brand_patterns()
{
    return [
        '/\bToolAcadmy\b/u' => 'ToolsHall',
        '/\bTools?\s+Acadmy\b/iu' => 'ToolsHall',
        '/\bAcadmy\b/iu' => 'ToolsHall',
    ];
}

/**
 * Domains, emails and handles, which the brand pass must not touch.
 *
 * Matched before the brand patterns and restored verbatim afterwards. The
 * lookbehind arm catches bare handles like twitter.com/toolacadmy, where
 * there is no ".com" to anchor on.
 */
function tshdb_preserve_patterns()
{
    return [
        '/(?:https?:\/\/)?(?:www\.)?toolacadmy\.com/iu',
        '/(?<=[\/@])toolacadmy\b/iu',
    ];
}

/** Number of old-brand occurrences in a string, ignoring preserved domains. */
function tshdb_count_brand($text)
{
    $text = (string) $text;

    if ($text === '') {
        return 0;
    }

    list($masked, $preserved) = tshdb_mask_preserved($text);
    unset($preserved);

    $count = 0;

    foreach (tshdb_brand_patterns() as $pattern => $replacement) {
        $masked = preg_replace($pattern, $replacement, $masked, -1, $hits);
        $count += (int) $hits;
    }

    return $count;
}

/** Number of preserved domain/handle occurrences in a string. */
function tshdb_count_domains($text)
{
    $text = (string) $text;
    $count = 0;

    foreach (tshdb_preserve_patterns() as $pattern) {
        $count += preg_match_all($pattern, $text);
    }

    return $count;
}

/**
 * Swap every domain/handle occurrence for a placeholder.
 *
 * Returns [masked string, list of the exact substrings that were masked], so
 * they can be put back exactly as they were found — including their original
 * casing and whether they carried a scheme.
 */
function tshdb_mask_preserved($text)
{
    $preserved = [];

    foreach (tshdb_preserve_patterns() as $pattern) {
        $text = preg_replace_callback(
            $pattern,
            function ($match) use (&$preserved) {
                $token = '{{TSHDB-KEEP-' . count($preserved) . '}}';
                $preserved[$token] = $match[0];
                return $token;
            },
            $text
        );
    }

    return [$text, $preserved];
}

/** Rebrand one string, leaving domains, emails and handles untouched. */
function tshdb_rebrand_string($text)
{
    $text = (string) $text;

    if ($text === '') {
        return $text;
    }

    // A placeholder colliding with real content would survive into the
    // database, so bail out rather than write something corrupted.
    if (strpos($text, '{{TSHDB-KEEP-') !== false) {
        return $text;
    }

    list($masked, $preserved) = tshdb_mask_preserved($text);

    foreach (tshdb_brand_patterns() as $pattern => $replacement) {
        $masked = preg_replace($pattern, $replacement, $masked);
    }

    if ($preserved) {
        $masked = strtr($masked, $preserved);
    }

    return $masked;
}

/**
 * Rebrand a stored meta value of any shape.
 *
 * Plain strings (including the JSON that _tg_faqs and friends hold) are
 * replaced as text, which leaves the encoding untouched. Serialized values
 * are walked instead, because a text replacement would desynchronise their
 * length prefixes.
 */
function tshdb_rebrand_value($value)
{
    if (is_string($value)) {
        if (is_serialized($value)) {
            $walked = tshdb_rebrand_deep(maybe_unserialize($value));
            return maybe_serialize($walked);
        }

        return tshdb_rebrand_string($value);
    }

    return tshdb_rebrand_deep($value);
}

/** Recursively rebrand every string inside an array or object. */
function tshdb_rebrand_deep($value)
{
    if (is_string($value)) {
        return tshdb_rebrand_string($value);
    }

    if (is_array($value)) {
        $out = [];
        foreach ($value as $key => $item) {
            $out[is_string($key) ? tshdb_rebrand_string($key) : $key] = tshdb_rebrand_deep($item);
        }
        return $out;
    }

    if (is_object($value)) {
        foreach (get_object_vars($value) as $key => $item) {
            $value->$key = tshdb_rebrand_deep($item);
        }
        return $value;
    }

    return $value;
}

/** Count old-brand occurrences in a value of any shape. */
function tshdb_count_value($value)
{
    if (is_string($value)) {
        if (is_serialized($value)) {
            $value = maybe_unserialize($value);
        } else {
            return tshdb_count_brand($value);
        }
    }

    if (is_array($value) || is_object($value)) {
        $count = 0;
        foreach ((array) $value as $key => $item) {
            if (is_string($key)) {
                $count += tshdb_count_brand($key);
            }
            $count += tshdb_count_value($item);
        }
        return $count;
    }

    return 0;
}

/**
 * Guard the encoding of a rewritten value.
 *
 * Returns an error string when the replacement broke the format, or '' when
 * the value is safe to write.
 */
function tshdb_format_error($before, $after)
{
    if (!is_string($before) || !is_string($after)) {
        return '';
    }

    $trimmed = trim($before);

    if ($trimmed === '' || ($trimmed[0] !== '{' && $trimmed[0] !== '[')) {
        return '';
    }

    json_decode($trimmed, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        return ''; // Was not valid JSON to begin with; nothing to protect.
    }

    json_decode(trim($after), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        return 'replacement produced invalid JSON (' . json_last_error_msg() . ')';
    }

    return '';
}

/* =========================================================================
   3. Banner.
   ========================================================================= */

global $wpdb;

tshdb_heading('ToolsHall DB rebrand — ' . ($dry_run ? 'DRY RUN (no database writes)' : 'APPLY (writing to the database)'));

tshdb_log('Old brand               : Tool Acadmy / Tools Acadmy / ToolAcadmy / Acadmy');
tshdb_log('New brand               : ToolsHall');
tshdb_log('Post fields             : post_content, post_excerpt');
tshdb_log('Meta fields             : _tg_intro, _tg_faqs, _tg_features, _tg_steps, rank_math_*');
tshdb_log('Left alone              : toolacadmy.com, contact@toolacadmy.com, /toolacadmy handles');
tshdb_log('                          (domain migration is a separate search-replace step)');
tshdb_log('Site                    : ' . home_url());

/* =========================================================================
   4. Collect the work — posts table.
   ========================================================================= */

$skipped_types = "'revision', 'nav_menu_item', 'oembed_cache', 'customize_changeset', 'custom_css'";

$post_rows = $wpdb->get_results(
    "SELECT ID, post_type, post_status, post_title, post_content, post_excerpt
       FROM {$wpdb->posts}
      WHERE post_type NOT IN ({$skipped_types})
        AND post_status NOT IN ('auto-draft', 'trash')
        AND (post_content LIKE '%Acadmy%' OR post_excerpt LIKE '%Acadmy%')
      ORDER BY post_type, ID"
);

$post_plan = [];
$post_domain_hits = 0;

foreach ($post_rows as $row) {
    $changes = [];

    foreach (['post_content', 'post_excerpt'] as $field) {
        $before = (string) $row->$field;
        $after = tshdb_rebrand_string($before);

        $post_domain_hits += tshdb_count_domains($before);

        if ($after === $before) {
            continue;
        }

        $changes[$field] = [
            'before' => $before,
            'after' => $after,
            'count' => tshdb_count_brand($before),
        ];
    }

    if ($changes) {
        $post_plan[] = [
            'id' => (int) $row->ID,
            'type' => $row->post_type,
            'status' => $row->post_status,
            'title' => $row->post_title,
            'changes' => $changes,
        ];
    }
}

/* =========================================================================
   5. Collect the work — postmeta.
   ========================================================================= */

$tg_meta_keys = ['_tg_intro', '_tg_faqs', '_tg_features', '_tg_steps'];

$meta_rows = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT pm.meta_id, pm.post_id, pm.meta_key, pm.meta_value,
                p.post_type, p.post_status, p.post_title
           FROM {$wpdb->postmeta} pm
           INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
          WHERE pm.meta_value LIKE %s
            AND (pm.meta_key IN ('_tg_intro', '_tg_faqs', '_tg_features', '_tg_steps')
                 OR pm.meta_key LIKE %s)
            AND p.post_type NOT IN ('revision', 'nav_menu_item', 'oembed_cache', 'customize_changeset', 'custom_css')
            AND p.post_status NOT IN ('auto-draft', 'trash')
          ORDER BY p.post_type, pm.post_id, pm.meta_key",
        '%Acadmy%',
        $wpdb->esc_like('rank_math_') . '%'
    )
);

$meta_plan = [];
$meta_domain_hits = 0;
$format_failures = [];

foreach ($meta_rows as $row) {
    $before = $row->meta_value;
    $after = tshdb_rebrand_value($before);

    $meta_domain_hits += tshdb_count_domains((string) $before);

    if ($after === $before) {
        continue;
    }

    $error = tshdb_format_error($before, $after);

    if ($error !== '') {
        $format_failures[] = [
            'post_id' => (int) $row->post_id,
            'title' => $row->post_title,
            'key' => $row->meta_key,
            'error' => $error,
        ];
        continue;
    }

    $meta_plan[] = [
        'meta_id' => (int) $row->meta_id,
        'post_id' => (int) $row->post_id,
        'type' => $row->post_type,
        'status' => $row->post_status,
        'title' => $row->post_title,
        'key' => $row->meta_key,
        'before' => $before,
        'after' => $after,
        'count' => tshdb_count_value($before),
    ];
}

/* =========================================================================
   6. Before counts.
   ========================================================================= */

tshdb_heading('BEFORE — old-brand occurrences found');

$before_by_field = [];
$before_total = 0;

foreach ($post_plan as $entry) {
    foreach ($entry['changes'] as $field => $change) {
        $before_by_field[$field] = ($before_by_field[$field] ?? 0) + $change['count'];
        $before_total += $change['count'];
    }
}

foreach ($meta_plan as $entry) {
    $before_by_field[$entry['key']] = ($before_by_field[$entry['key']] ?? 0) + $entry['count'];
    $before_total += $entry['count'];
}

if (!$before_by_field) {
    tshdb_log('None. Every scanned field is already on the ToolsHall brand.');
} else {
    ksort($before_by_field);
    foreach ($before_by_field as $field => $count) {
        tshdb_log('  ' . str_pad($field, 30) . str_pad((string) $count, 6, ' ', STR_PAD_LEFT) . ' occurrence(s)');
    }
    tshdb_rule();
    tshdb_log('  ' . str_pad('TOTAL', 30) . str_pad((string) $before_total, 6, ' ', STR_PAD_LEFT) . ' occurrence(s)');
    tshdb_log('  ' . str_pad('rows to update', 30) . str_pad((string) (count($post_plan) + count($meta_plan)), 6, ' ', STR_PAD_LEFT));
}

/* =========================================================================
   7. The plan, grouped by post.
   ========================================================================= */

tshdb_heading('PLAN — ' . ($dry_run ? 'what would change' : 'what is being changed'));

$by_post = [];

foreach ($post_plan as $entry) {
    $by_post[$entry['id']]['meta'] = [
        'type' => $entry['type'],
        'status' => $entry['status'],
        'title' => $entry['title'],
    ];
    foreach ($entry['changes'] as $field => $change) {
        $by_post[$entry['id']]['fields'][] = [
            'name' => $field,
            'count' => $change['count'],
            'before' => $change['before'],
            'after' => $change['after'],
        ];
    }
}

foreach ($meta_plan as $entry) {
    $by_post[$entry['post_id']]['meta'] = [
        'type' => $entry['type'],
        'status' => $entry['status'],
        'title' => $entry['title'],
    ];
    $by_post[$entry['post_id']]['fields'][] = [
        'name' => $entry['key'],
        'count' => $entry['count'],
        'before' => $entry['before'],
        'after' => $entry['after'],
    ];
}

if (!$by_post) {
    tshdb_log('Nothing to do.');
} else {
    ksort($by_post);

    foreach ($by_post as $post_id => $group) {
        tshdb_log('');
        tshdb_log('#' . $post_id . '  [' . $group['meta']['type'] . '/' . $group['meta']['status'] . ']  ' . $group['meta']['title']);

        foreach ($group['fields'] as $field) {
            tshdb_log('    ' . str_pad($field['name'], 26) . $field['count'] . 'x');

            // Show the actual copy for the short, human-read fields. Long
            // bodies would bury the report, and their counts say enough.
            if (in_array($field['name'], ['rank_math_title', 'rank_math_description', 'post_excerpt'], true)
                || strpos($field['name'], 'rank_math_') === 0 && strlen((string) $field['before']) < 400) {
                tshdb_log('      before: ' . tshdb_snippet($field['before']));
                tshdb_log('      after : ' . tshdb_snippet($field['after']));
            }
        }
    }
}

/* =========================================================================
   8. Blog-post RankMath meta, called out on its own.
   ========================================================================= */

tshdb_heading('BLOG POSTS — RankMath title / description');

$blog_meta = array_filter($meta_plan, function ($entry) {
    return $entry['type'] === 'post'
        && in_array($entry['key'], ['rank_math_title', 'rank_math_description'], true);
});

if (!$blog_meta) {
    tshdb_log('No blog post carries the old brand in rank_math_title or rank_math_description.');
} else {
    $blog_ids = [];

    foreach ($blog_meta as $entry) {
        $blog_ids[$entry['post_id']] = true;
        tshdb_log('');
        tshdb_log('#' . $entry['post_id'] . '  ' . $entry['title']);
        tshdb_log('  ' . $entry['key']);
        tshdb_log('    before: ' . tshdb_snippet($entry['before'], 140));
        tshdb_log('    after : ' . tshdb_snippet($entry['after'], 140));
    }

    tshdb_log('');
    tshdb_log(count($blog_meta) . ' field(s) across ' . count($blog_ids) . ' blog post(s).');
}

/* =========================================================================
   9. Write.
   ========================================================================= */

tshdb_heading($dry_run ? 'WRITE — skipped, this is a dry run' : 'WRITE — applying changes');

$posts_written = 0;
$post_fields_written = 0;
$meta_written = 0;
$write_failures = [];
$touched_ids = [];

foreach ($post_plan as $entry) {
    $data = [];

    foreach ($entry['changes'] as $field => $change) {
        $data[$field] = $change['after'];
    }

    $touched_ids[$entry['id']] = true;

    if ($dry_run) {
        $posts_written++;
        $post_fields_written += count($data);
        continue;
    }

    // Direct update: keeps post_modified as it was and skips the kses
    // filtering wp_update_post would apply with no logged-in user.
    $result = $wpdb->update($wpdb->posts, $data, ['ID' => $entry['id']]);

    if ($result === false) {
        $write_failures[] = '#' . $entry['id'] . ' posts row: ' . $wpdb->last_error;
        continue;
    }

    $posts_written++;
    $post_fields_written += count($data);
}

foreach ($meta_plan as $entry) {
    $touched_ids[$entry['post_id']] = true;

    if ($dry_run) {
        $meta_written++;
        continue;
    }

    $result = $wpdb->update(
        $wpdb->postmeta,
        ['meta_value' => $entry['after']],
        ['meta_id' => $entry['meta_id']]
    );

    if ($result === false) {
        $write_failures[] = '#' . $entry['post_id'] . ' ' . $entry['key'] . ': ' . $wpdb->last_error;
        continue;
    }

    $meta_written++;
}

if (!$dry_run) {
    foreach (array_keys($touched_ids) as $post_id) {
        clean_post_cache($post_id);
    }

    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
}

tshdb_log(($dry_run ? 'Would update' : 'Updated') . ' posts rows      : ' . $posts_written . ' (' . $post_fields_written . ' field(s))');
tshdb_log(($dry_run ? 'Would update' : 'Updated') . ' postmeta rows   : ' . $meta_written);
tshdb_log(($dry_run ? 'Would touch ' : 'Touched     ') . ' posts total     : ' . count($touched_ids));

if (!$dry_run) {
    tshdb_log('Object cache flushed, post caches cleaned.');
}

if ($write_failures) {
    tshdb_log('');
    tshdb_log('WRITE FAILURES (' . count($write_failures) . '):');
    foreach ($write_failures as $failure) {
        tshdb_log('  ' . $failure);
    }
}

if ($format_failures) {
    tshdb_log('');
    tshdb_log('SKIPPED to protect their encoding (' . count($format_failures) . '):');
    foreach ($format_failures as $failure) {
        tshdb_log('  #' . $failure['post_id'] . ' ' . $failure['key'] . ' — ' . $failure['error']);
    }
}

/* =========================================================================
   10. After counts, read back from the database.
   ========================================================================= */

tshdb_heading('AFTER — ' . ($dry_run ? 'projected (nothing was written)' : 'read back from the database'));

if ($dry_run) {
    $after_total = 0;

    foreach ($post_plan as $entry) {
        foreach ($entry['changes'] as $change) {
            $after_total += tshdb_count_brand($change['after']);
        }
    }

    foreach ($meta_plan as $entry) {
        $after_total += tshdb_count_value($entry['after']);
    }

    foreach ($format_failures as $failure) {
        $after_total += 1; // Left as it was; still carries the brand.
    }

    tshdb_log('Old-brand occurrences before : ' . $before_total);
    tshdb_log('Old-brand occurrences after  : ' . $after_total . ' (projected)');
} else {
    $remaining_posts = $wpdb->get_results(
        "SELECT ID, post_type, post_title, post_content, post_excerpt
           FROM {$wpdb->posts}
          WHERE post_type NOT IN ({$skipped_types})
            AND post_status NOT IN ('auto-draft', 'trash')
            AND (post_content LIKE '%Acadmy%' OR post_excerpt LIKE '%Acadmy%')"
    );

    $remaining_meta = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT pm.post_id, pm.meta_key, pm.meta_value, p.post_title
               FROM {$wpdb->postmeta} pm
               INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
              WHERE pm.meta_value LIKE %s
                AND (pm.meta_key IN ('_tg_intro', '_tg_faqs', '_tg_features', '_tg_steps')
                     OR pm.meta_key LIKE %s)
                AND p.post_type NOT IN ('revision', 'nav_menu_item', 'oembed_cache', 'customize_changeset', 'custom_css')
                AND p.post_status NOT IN ('auto-draft', 'trash')",
            '%Acadmy%',
            $wpdb->esc_like('rank_math_') . '%'
        )
    );

    $after_total = 0;
    $stragglers = [];

    foreach ($remaining_posts as $row) {
        foreach (['post_content', 'post_excerpt'] as $field) {
            $count = tshdb_count_brand($row->$field);
            if ($count > 0) {
                $after_total += $count;
                $stragglers[] = '#' . $row->ID . ' ' . $field . ' (' . $count . 'x) — ' . $row->post_title;
            }
        }
    }

    foreach ($remaining_meta as $row) {
        $count = tshdb_count_value($row->meta_value);
        if ($count > 0) {
            $after_total += $count;
            $stragglers[] = '#' . $row->post_id . ' ' . $row->meta_key . ' (' . $count . 'x) — ' . $row->post_title;
        }
    }

    tshdb_log('Old-brand occurrences before : ' . $before_total);
    tshdb_log('Old-brand occurrences after  : ' . $after_total);

    if ($stragglers) {
        tshdb_log('');
        tshdb_log('STILL CARRYING THE OLD BRAND:');
        foreach ($stragglers as $straggler) {
            tshdb_log('  ' . $straggler);
        }
    }
}

/* =========================================================================
   11. Domain occurrences, reported but deliberately untouched.
   ========================================================================= */

tshdb_heading('DOMAINS — left for the migration step');

$domain_total = $post_domain_hits + $meta_domain_hits;

tshdb_log('toolacadmy.com / handle occurrences seen in the scanned rows: ' . $domain_total);
tshdb_log('  post_content + post_excerpt : ' . $post_domain_hits);
tshdb_log('  postmeta                    : ' . $meta_domain_hits);

if ($domain_total > 0) {
    tshdb_log('');
    tshdb_log('These were preserved exactly as stored. Swap them when the site moves,');
    tshdb_log('together with the home/siteurl options, e.g.:');
    tshdb_log('');
    tshdb_log('  wp search-replace "toolacadmy.com" "toolshall.com" --all-tables --precise --dry-run');
    tshdb_log('  wp search-replace "toolacadmy.com" "toolshall.com" --all-tables --precise');
}

/* =========================================================================
   12. Done.
   ========================================================================= */

tshdb_heading('DONE — ' . ($dry_run ? 'DRY RUN, nothing was written' : 'changes applied to the database'));

if ($dry_run) {
    tshdb_log('Re-run without the dry-run argument to apply:');
    tshdb_log('  wp eval-file rebrand-toolshall.php');
} else {
    tshdb_log('Spot-check a rebranded blog post and a tool page in the browser,');
    tshdb_log('then confirm the RankMath title/description in the post editor.');
}

tshdb_log('');

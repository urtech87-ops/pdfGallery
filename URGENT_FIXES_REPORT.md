# Urgent Fixes Report

## Breadcrumb fix
**Done** — Replaced old `tg_breadcrumbs()` with a single authoritative version in `functions.php` that correctly handles `is_tax('tool_category')` before `is_archive()`, so category pages show `Home › Tools › PDF Tools` instead of `Home › Blog`.

## Double breadcrumb
**Fixed** — Removed duplicate `tg_breadcrumbs()` calls from:
- `taxonomy-tool_category.php`
- `page-sitemap-page.php`
- `home.php`

Breadcrumb is now output exclusively from `header.php` (once).

## Category breadcrumb correct
**Yes** — `is_tax('tool_category')` is now handled as the first branch, producing `Home › Tools › {Category Name}`.

## Logo updated
**Yes** — Inline SVG logo in header and footer (no external file dependency). New files created:
- `assets/images/logo.svg` (full horizontal lockup)
- `assets/images/logo-dark.svg` (dark variant)
- `assets/images/logo-icon.svg` (icon-only, used as favicon)
- `assets/images/favicon.png` (64×64 PNG generated via PHP GD)

## Footer logo clickable
**Yes** — Footer logo is now wrapped in `<a href="/">` anchor tag.

## Mobile menu
**Working** — Replaced old hamburger + full-screen overlay with a proper right-side drawer: overlay backdrop, slide-in animation, close button, Escape key support, body scroll lock, resize-to-desktop auto-close.

## Favicon
**Showing** — `tg_favicon()` function added to `functions.php`, hooked to `wp_head` and `admin_head`, serving `logo-icon.svg` as primary and `favicon.png` as fallback.

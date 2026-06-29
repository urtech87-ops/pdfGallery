# Fixes Report

| Fix | Status |
|-----|--------|
| breadcrumb blog | Fixed |
| comments.php | Created |
| mobile menu categories | Done |
| dark theme text | Fixed |
| category icons | Fixed |
| About page content | OK (page-about.php already has full content) |
| single.php comments_template | Already present |

## Details

### Fix 1 — Blog Breadcrumb
- `functions.php`: Removed `is_home()` from early-return guard
- Added dedicated `is_home()` branch that renders `Home › Blog` breadcrumb inline

### Fix 2 — comments.php
- Created `wp-content/themes/toolsgallery/comments.php` with styled form
- Added `tg_comment_callback()` to `functions.php`
- Added comment + comment-form CSS to `main.css`
- `single.php` already called `comments_template()` — no change needed

### Fix 3 — About Page
- `page-about.php` already contained full E-E-A-T content — no change needed

### Fix 4 — Category Icons
- Added `tg_get_category_icon($slug)` to `functions.php`
- Updated `single-tg_tool.php` category badge to output SVG icon + label

### Fix 5 — Mobile Menu with Category Accordion
- Rewrote mobile drawer in `header.php` with search bar + category accordion
- Added accordion CSS to `main.css`
- Added accordion + search filter JS to `assets/js/main.js`

### Fix 6 — Dark Theme Nuclear Text Fix
- Appended nuclear CSS overrides to `assets/css/themes.css`
- Forces all headings/text/links to readable colours in dark mode

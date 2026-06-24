# Dark Theme Fix Report

## Summary

A comprehensive "nuclear override" CSS block was appended to the bottom of
`wp-content/themes/toolsgallery/assets/css/main.css`. All rules use
`!important` and are scoped to `[data-theme="dark"]` (or unscopedfor
footer/header which are always dark-styled) so they override any hardcoded
inline or earlier-declared colors.

---

## Pages / Components Addressed

### 1. Homepage (dark)
| Element | Status |
|---|---|
| Logo text | ✓ White (`#FFFFFF`) |
| Nav links | ✓ White (`#F0F0F0`), orange on hover |
| Theme toggle | ✓ Dark bg (`#2a2a2a`), white icon |
| Hero headings | ✓ White via `h1–h6` rule |
| Stats numbers | ✓ White (`.tg-stat strong`) |
| Stats labels | ✓ Grey (`#A0A0A0`) |
| Tool cards | ✓ Dark bg (`#1e1e1e`), white text |
| Section headings | ✓ White |
| "See all X tools" links | ✓ Orange (`#F97316`) |
| FREE badges | ✓ Green bg, green text |

### 2. Tools Page (dark)
| Element | Status |
|---|---|
| Page header text | ✓ White |
| Search box | ✓ Dark bg, white text, grey placeholder |
| Filter pills (inactive) | ✓ Grey text, transparent bg |
| Filter pills (active) | ✓ Orange bg, white text |
| Pill counts | ✓ Subtle overlay |
| Category headings | ✓ White |
| Tool card titles | ✓ White |
| Tool card descriptions | ✓ Grey (`#A0A0A0`) |
| FREE badges | ✓ Green |

### 3. Single Tool Page (dark)
| Element | Status |
|---|---|
| Quick answer box | ✓ Orange-tinted bg, orange left border |
| Tool title | ✓ White |
| Upload zone | ✓ Orange-tinted bg, orange border, grey text |
| Upload SVG icons | ✓ Grey stroke |
| Action button (enabled) | ✓ Orange bg, white text |
| Action button (disabled) | ✓ Dark bg, grey text |
| How to Use steps | ✓ Grey text, white bold |
| Why Use section | ✓ Dark bg (`#1a1a1a`) |
| FAQ items | ✓ Dark bg, white question, grey answer |
| FAQ open state | ✓ Orange question, orange icon |
| Related tools | ✓ Dark cards, white text |
| Sidebar headings | ✓ Grey (subdued) |
| Sidebar tool links | ✓ White, orange on hover |
| Sidebar category counts | ✓ Dark bg, grey text |

### 4. Blog Page (dark)
| Element | Status |
|---|---|
| Blog card background | ✓ Dark (`#1e1e1e`) |
| Blog card titles | ✓ White |
| Blog card excerpts | ✓ Grey (`#A0A0A0`) |
| Category badges | ✓ Orange tint bg, orange text |
| Date/meta | ✓ Grey (`#707070`) |
| Read More button | ✓ Orange outline, transparent bg |
| Sidebar widgets | ✓ Dark bg |

### 5. About Page (dark)
| Element | Status |
|---|---|
| Body text | ✓ Grey (`#C0C0C0`) |
| Headings | ✓ White |
| Stat boxes | ✓ Orange tint bg |
| Stat numbers | ✓ Orange |
| Stat labels | ✓ Grey |
| Contact block | ✓ Orange tint bg + border |

### 6. Contact Page (dark)
| Element | Status |
|---|---|
| Info card | ✓ Dark (`#222222`) |
| Info labels | ✓ Grey |
| Info values | ✓ Light grey |
| Topics list | ✓ Light grey text |
| Form inputs | ✓ Dark bg, white text, grey placeholder |
| Labels | ✓ Light grey |

### 7. Legal Pages (Privacy/Terms) (dark)
| Element | Status |
|---|---|
| Body paragraphs | ✓ Grey (`#C0C0C0`) |
| List items | ✓ Grey |
| H1 | ✓ White |
| H2 | ✓ Near-white (`#F0F0F0`) |
| H3 | ✓ Light grey (`#D0D0D0`) |
| "Last updated" date | ✓ Muted grey |

### 8. Footer (always dark, both themes)
| Element | Status |
|---|---|
| Background | ✓ Black (`#0a0a0a`) |
| Headings | ✓ White |
| Body text / links | ✓ 60% white opacity |
| Link hover | ✓ Orange |
| Logo text | ✓ White |
| Tagline | ✓ Orange |
| Divider | ✓ Subtle white border |
| Footer bottom bar | ✓ 40% white, orange links |

### 9. Header
| Element | Status |
|---|---|
| Dark: background | ✓ Near-black with blur |
| Dark: nav links | ✓ White, orange hover |
| Dark: logo text | ✓ White |
| Dark: theme toggle | ✓ Dark bg, white icon |
| Light: background | ✓ White |
| Light: nav links | ✓ Dark (`#0F0F0F`) |
| Light: logo text | ✓ Dark |

---

## Implementation Notes

- All rules appended to the **bottom** of `main.css` for cascade priority.
- `!important` used throughout to defeat any inline styles or earlier rules.
- Breadcrumb, trust signals bar, forms, range/color inputs, and icon brightness
  are also covered.
- Footer rules are **not** scoped to `[data-theme]` — footer is always dark
  on both light and dark themes.

# Utility Tools Fix Report

Audit + fix of the 10 Phase 8 utility tools (Pattern B: `CONFIG.dataInput = true`,
self-contained `init(container)`, no `getOptionsHTML()`/`run()`).

## Cache Busting Fixed
- filemtime added to $tool_files_8: **Yes** — the Phase 8 enqueue block in
  `functions.php` used the fixed theme `$ver` for all 10 utility tools; it now uses
  `filemtime()` of the tool file (falling back to `$ver` if the file is missing),
  matching the Phase 7 and Phase 10 blocks.
- Missing tools added to array: **No — none were missing.** All 10 handlers
  (`color-picker`, `color-palette`, `countdown-timer`, `stopwatch`, `random-number`,
  `text-case`, `line-break-remover`, `duplicate-remover`, `text-binary`,
  `unit-converter`) were already registered in `$tool_files_8`.

## data-tool-type Attribute
- single-tg_tool.php has correct attribute: **Yes** — the `data-input` branch renders
  `<div class="tg-tool-box" data-tool-type="data-input" data-handler="…">` (line 154),
  and `tool-runner.js` finds it and calls `TGTools[handler].init(diBox)` (lines
  2239–2263). The `_tg_tool_type = "data-input"` post meta is set per tool via the
  WP-CLI commands in `PHASE8_SETUP.md`.

## Tool Status

Verified two ways: `node --check` syntax pass on every file, plus a headless-Chromium
functional run that loads each tool exactly the way tool-runner does (inject script,
call `init()` on the data-input box) and exercises the UI. 79/79 functional
assertions passed.

| Tool | Init Works | UI Renders | Functions Work |
|------|-----------|-----------|---------------|
| color-picker | ✅ | ✅ | ✅ |
| color-palette | ✅ | ✅ | ✅ |
| countdown-timer | ✅ | ✅ | ✅ |
| stopwatch | ✅ | ✅ | ✅ |
| random-number | ✅ | ✅ | ✅ |
| text-case | ✅ | ✅ | ✅ |
| line-break-remover | ✅ | ✅ | ✅ |
| duplicate-remover | ✅ | ✅ | ✅ |
| text-binary | ✅ | ✅ | ✅ |
| unit-converter | ✅ | ✅ | ✅ |

Behaviors confirmed in the browser run:

- **color-picker** — color change updates HEX/RGB/RGBA/HSL/HSLA/HSV/CMYK, nearest
  CSS named color, 10 tints + 10 shades, 4 harmony sets; copy buttons write to the
  clipboard; manual hex entry syncs the picker.
- **color-palette** — auto-generates on load, count/type changes regenerate, CSS
  variable export copies correctly, Randomize sets a valid base color.
- **countdown-timer** — presets set the display, Start counts down, Pause freezes,
  Reset returns to 00:00:00, completion restores the Start button (plus alarm
  sound/notification/flash paths).
- **stopwatch** — Start runs (requestAnimationFrame at display precision of 10 ms),
  Lap records rows with fastest/slowest highlighting, Pause freezes, Reset clears
  laps and stats.
- **random-number** — Single (crypto.getRandomValues), Multiple with sort/duplicate
  options, Random-from-List, Dice roller (d4–d100), Coin flip with history all work;
  tab switching works.
- **text-case** — all 17 conversions (verified UPPERCASE and camelCase end-to-end),
  live char/word stats, Copy Result and Swap work.
- **line-break-remover** — removes breaks, replaces with space or custom text (with
  live re-processing on option change), stats report break/space counts, custom
  input toggles.
- **duplicate-remover** — removes duplicate lines with case-sensitivity, trim,
  keep-first/last, sort, and duplicates-only views; stats report removed count.
- **text-binary** — Text↔Binary ("Hi" → `01001000 01101001` and back), Decimal, Hex
  ("Hi" → `48 69`), Octal, and Morse ("SOS" → `... --- ...` and back); tab switching
  and copy buttons work.
- **unit-converter** — 12 categories; 1 km → 1000 m / 0.6213711922 mile table,
  100 °C → 212 °F (special-cased temperature math), fuel-economy inversion
  special-cased; per-row copy works.

## Code Changes (minimal by design)

1. `functions.php` — Phase 8 enqueue now uses `filemtime()` cache busting
   (the only broken thing the audit found).
2. `color-picker.js` — wrapped the recent-colors `localStorage` read/write in
   try/catch so `init()` can't die in browsers that block site data (a storage
   `SecurityError` previously aborted the whole tool UI).

Everything else was already correct: every tool registers
`window.TGTools[handler] = { init, CONFIG }`, and every inline `onclick` handler
(`cpCopy`, `cpSetColor`, `cpalGenerate`, `ctStart/ctPause/ctReset`, `swStart/swLap`,
`rngTab/rngSingle/rngMulti/rngFromList/rngDice/rngCoin`, `tcConvert/tcCopy/tcSwap`,
`lbrProcess/lbrToggleCustom`, `drProcess/drSwap`, `tbTab/tbTextToBin/tbBinToText/
tbConvertBase/tbTextToMorse/tbMorseToText/tbPlayMorse`, `ucSetCat/ucConvert`) is
already defined on `window`. `line-break-remover.js` and `duplicate-remover.js` were
already complete, working implementations (richer than the reference versions), so
they were kept — no rewrite needed. No standard `getOptionsHTML()`/`run()` functions
were added anywhere.

## Verification
- `php -l functions.php` — no syntax errors.
- `node --check` on all 10 tool files — pass.
- `node test-phase8.js` — 154/154 checks pass.
- Headless Chromium functional test (init + UI interaction per tool) — 79/79 pass.

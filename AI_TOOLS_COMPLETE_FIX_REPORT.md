# AI Tools Fix Report

## Root Causes Fixed

- **Wrong model name: Fixed** — `tg_call_openrouter()` hardcoded
  `google/gemini-2.5-flash-preview` (a non-existent model) for every request,
  ignoring the per-tool `model` config. It now uses
  `$config['model'] ?? 'google/gemini-flash-1.5'`. The one remaining bad
  entry in `tg_get_tool_prompts()` (`pdf-summarize` had
  `google/gemini-3.5-flash`) was corrected to `google/gemini-flash-1.5`.
  All 32 prompt configs now use `google/gemini-flash-1.5`.
- **foreach null warning: Fixed** — `tg_build_user_prompt()` now guards with
  `is_array($payload) || empty($payload)` before iterating, uses a
  `{[a-zA-Z0-9_]+}` regex for leftover-placeholder cleanup (previous regex
  missed uppercase/digit keys), and trims the final prompt.
- **AI JS files not enqueued: Fixed** — the `$ai_tool_files` enqueue block
  (30 tools, dependency `tg-ai-tool-runner`, `filemtime` cache busting) is in
  place in the enqueue section of functions.php.
- **ai-tool-runner conflict: Fixed** — `ai-tool-runner.js` wraps its init in
  `setTimeout(initAiToolRunner, 100)` and skips any tool whose handler is
  registered in `window.TGTools`, so custom tool UIs (grammar-fixer,
  paraphraser, …) are never wiped or double-bound. Tools without a custom JS
  file still get the runner's default UI, since `window.TGTools[handler]` is
  undefined for them.
- **Output display: Fixed** — errors from `tg_call_openrouter()` were being
  sent through `wp_send_json_success()`, so the frontend saw
  `success: true` with no `result` and displayed a misleading
  "AI returned an empty response" message. `tg_ai_proxy_handler()` now sends
  `wp_send_json_error(['message' => …], 500)` when the call fails, so every
  tool's `onError` path shows the real error. All 30 custom AI tool JS files
  were audited: each registers `window.TGTools[HANDLER]`, creates its result
  element before the AJAX call, and makes it visible in `onSuccess`
  (`resultEl.classList.add('show')` → `.tg-ai5-result.show{display:block}`,
  or an equivalent `innerHTML`/`style.display` mechanism for dashboard-style
  tools like word-counter and plagiarism-checker).

## Files Changed

- `wp-content/themes/toolsgallery/functions.php` — model fix in
  `tg_call_openrouter()` and `tg_get_tool_prompts()`, null-safe
  `tg_build_user_prompt()`, error propagation in `tg_ai_proxy_handler()`;
  `$ai_tool_files` enqueue block verified in place.
- `wp-content/themes/toolsgallery/assets/js/ai-tool-runner.js` — init
  delayed to `setTimeout(…, 100)` with `window.TGTools[handler]` skip check.
- AI tool JS files (grammar-fixer.js and 29 others) — audited; all already
  follow the correct display pattern, no changes required.

## Verification (code-level)

| Check | Result |
|-------|--------|
| `php -l functions.php` | ✅ No syntax errors |
| `grep gemini functions.php \| grep -v flash-1.5` | ✅ Empty |
| ai-tool-runner has setTimeout + TGTools + initAiToolRunner | ✅ |
| `$ai_tool_files` enqueue present | ✅ |
| All 30 AI tool JS files register `window.TGTools[HANDLER]` | ✅ |
| grammar-fixer onSuccess shows result (`.show` class) | ✅ |
| `node --check ai-tool-runner.js` | ✅ |

## Test Results (manual browser tests — to be run on localhost)

| Tool | API Response | Output Displays |
|------|-------------|-----------------|
| grammar-fixer | pending manual test | pending manual test |
| paraphraser | pending manual test | pending manual test |
| summarizer | pending manual test | pending manual test |
| ai-humanizer | pending manual test | pending manual test |

Manual test checklist (requires the local WordPress site + OpenRouter key):

1. Visit `localhost/toolsgallery/tool/grammar-fixer/`, open console (F12),
   run `console.log(window.TGTools)` — should show `{grammar-fixer: {…}}`.
2. Type text, click **Fix Grammar** — loading dots show, result appears,
   Copy/Download buttons appear, no console errors.
3. Repeat on `/tool/paraphraser/` and `/tool/summarizer/`.
4. `tail -20 wp-content/debug.log` — should show successful OpenRouter
   responses and no `foreach()` warnings or model-not-found errors.

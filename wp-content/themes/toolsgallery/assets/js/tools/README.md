# ToolsGallery — Tool Files

Each file in this folder = one tool.

## How to add a new tool

1. Create a new file: `tools/your-handler.js`
2. Copy the template from any existing simple tool file (e.g. `merge-pdf.js`)
3. Change `run()`, `getOptionsHTML()`, `getOptions()`
4. Add the handler to the `$tool_files` array in `functions.php`
5. Create the WordPress post via WP-CLI or wp-admin
6. Test at `/tool/your-slug/`

## File naming convention

Filename = handler key with dashes  
Handler `pdf-to-jpg` → file `pdf-to-jpg.js`

## window.TGTools registry

Every tool registers itself:

```js
window.TGTools['handler-key'] = { run, getOptionsHTML, getOptions }
```

`tool-runner.js` reads this registry to dispatch tool actions.

## Required methods

| Method | Called when | Returns |
|--------|------------|---------|
| `run(files, options, callbacks)` | User clicks action button | `Promise<void>` |
| `getOptionsHTML()` | After file selected (or on load) | HTML string |
| `getOptions()` | Just before `run()` | Plain object |

## Optional methods

| Method | Called when | Purpose |
|--------|------------|---------|
| `afterOptionsInjected(container)` | After options HTML injected | Wire up event listeners |
| `onFileReady(file, toolBox)` | After file selected | Build complex interactive UI (rotate, rearrange, edit) |
| `reset(toolBox)` | User resets/removes file | Clean up module state and DOM |

## Callbacks passed to run()

```js
callbacks = {
  onProgress(percent, message)       // update progress bar
  onSuccess(blob, filename, extra)   // finish with downloadable file
  onError(message)                   // show error banner
  onInlineError(message)             // show inline validation message
  getBox()                           // returns .tg-tool-box element
  getActionBtn()                     // returns action button element
  getResultEl()                      // returns result element
  getSuccessBanner()                 // returns success banner element
  getErrorBanner()                   // returns error banner element
  getDownloadBtn()                   // returns download button element
  getProgressBar()                   // returns progress bar element
}
```

## Special cases

- **word-to-pdf**: `run()` opens a new window; call `onSuccess(null, 'word-to-pdf')` to end progress
- **extract-text**: `run()` builds its own result UI; call `onSuccess(null, null)` to end progress
- **rotate-pdf / rearrange-pdf / edit-pdf**: use `onFileReady()` to build interactive UI; `run()` exports the final PDF

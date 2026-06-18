/**
 * ============================================================
 * ToolsGallery — Summarizer Tool
 * ============================================================
 * Handler key: summarizer
 * Tool URL: /tool/summarizer/
 *
 * AI tools are processed server-side via ai-tool-runner.js.
 * This file registers the tool so tool-runner.js recognises it.
 *
 * To add custom option UI, implement getOptionsHTML() here.
 * ============================================================
 */
(function () {
  'use strict';

  window.TGTools = window.TGTools || {};
  window.TGTools['summarizer'] = {
    run: async function (files, options, callbacks) {
      /* AI processing is handled by ai-tool-runner.js via AJAX */
    },
    getOptionsHTML: function () { return ''; },
    getOptions:     function () { return {}; },
  };
})();

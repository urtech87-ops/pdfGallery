/* ToolsGallery — url-to-pdf.js
   Handler: url-to-pdf
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'url-to-pdf',
    downloadName: 'webpage.pdf',
  };

  function getOptionsHTML(pageCount) {
    return '<p class="tg-opt-info">The webpage will be fetched and opened in a print window. Select "Save as PDF" in your print dialog.</p>';
  }

  function getOptions(optionsEl) {
    return {};
  }

  async function run(file, options, onProgress) {
    // url-to-pdf is handled entirely by the url-input tool type in tool-runner.js
    // This stub exists to register the handler
    return { blob: new Blob(['url-to-pdf'], { type: 'text/plain' }), filename: 'url-to-pdf.txt' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

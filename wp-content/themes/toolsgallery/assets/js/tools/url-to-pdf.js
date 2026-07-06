/* ToolsGallery — url-to-pdf.js
   Handler: url-to-pdf
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'url-to-pdf',
    downloadName: 'webpage.pdf',
  };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Page Size</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="url-size" value="A4" checked> A4</label>' +
        '<label><input type="radio" name="url-size" value="Letter"> Letter</label>' +
      '</div>' +
    '</div>' +
    '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;font-size:13px;margin-top:8px;">' +
      '<strong style="color:#1e40af;">How URL to PDF works:</strong>' +
      '<ol style="margin:8px 0 0;padding-left:18px;color:#1e3a8a;line-height:1.8;">' +
        '<li>Enter a public webpage URL</li>' +
        '<li>Click Convert to PDF</li>' +
        '<li>The page opens in a new tab</li>' +
        '<li>Press <strong>Ctrl+P</strong> and choose <strong>Save as PDF</strong></li>' +
      '</ol>' +
    '</div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var size = optionsEl.querySelector('input[name="url-size"]:checked');
    return {
      size: size ? size.value : 'A4',
    };
  }

  async function run(file, options, onProgress) {
    throw new Error('Please enter a URL in the input field above and click Convert.');
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = {
    run: run,
    getOptionsHTML: getOptionsHTML,
    getOptions: getOptions,
    CONFIG: CONFIG,
  };
})();

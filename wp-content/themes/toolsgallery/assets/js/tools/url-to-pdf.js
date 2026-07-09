/* ToolsGallery — url-to-pdf.js
   Handler: url-to-pdf
   Opens the target URL inside a print-ready wrapper window with an
   orange "Save as PDF" toolbar; window.print() with destination
   "Save as PDF" produces the downloadable PDF. (Browsers do not allow
   JavaScript to silently download another URL as a PDF, so the print
   dialog is the reliable cross-browser path.)
   The url-input branch of tool-runner.js delegates here via convertUrl().
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'url-to-pdf',
    downloadName: 'webpage.pdf',
  };

  function getOptionsHTML() {
    return '<div class="tg-opt-section">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="urlpdf-size">Page Size</label>' +
        '<select id="urlpdf-size" class="tg-select">' +
          '<option value="A4">A4</option>' +
          '<option value="Letter">Letter (US)</option>' +
          '<option value="Legal">Legal</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="urlpdf-orient">Orientation</label>' +
        '<select id="urlpdf-orient" class="tg-select">' +
          '<option value="portrait">Portrait</option>' +
          '<option value="landscape">Landscape</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-info-box">' +
        '<strong>&#128161; How to save as PDF:</strong>' +
        '<ol style="margin:8px 0 0;padding-left:18px;line-height:1.8;">' +
          '<li>Enter the URL above and click the convert button</li>' +
          '<li>The webpage opens in a new window ready for printing</li>' +
          '<li>Click the <strong>Save as PDF</strong> button in the new window (or press <kbd>Ctrl+P</kbd>)</li>' +
          '<li>Set <strong>Destination</strong> to <strong>Save as PDF</strong> and click Save</li>' +
        '</ol>' +
      '</div>' +
    '</div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { size: 'A4', orient: 'portrait' };
    var size = optionsEl.querySelector('#urlpdf-size');
    var orient = optionsEl.querySelector('#urlpdf-orient');
    return {
      size: size ? size.value : 'A4',
      orient: orient ? orient.value : 'portrait',
    };
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildPrintPage(url, size, orient) {
    var safeUrl = escapeHtml(encodeURI(url));
    return '<!DOCTYPE html>' +
      '<html><head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width">' +
      '<title>PDF - ' + escapeHtml(url) + '</title>' +
      '<style>' +
      'body{margin:0;font-family:Arial,sans-serif;}' +
      '#tg-toolbar{position:fixed;top:0;left:0;right:0;z-index:99999;' +
        'background:linear-gradient(135deg,#F97316,#ea580c);color:#fff;' +
        'padding:12px 20px;display:flex;align-items:center;gap:12px;' +
        'box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:14px;}' +
      '#tg-save-btn{background:#fff;color:#F97316;border:none;padding:8px 20px;' +
        'border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;' +
        'box-shadow:0 2px 4px rgba(0,0,0,0.15);}' +
      '#tg-save-btn:hover{background:#fff7ed;}' +
      '#tg-hide-btn{background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);' +
        'color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;}' +
      '#tg-url-label{margin-left:auto;opacity:0.85;font-size:12px;max-width:300px;' +
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      '#tg-frame-wrap{margin-top:54px;height:calc(100vh - 54px);}' +
      '#tg-frame{width:100%;height:100%;border:none;}' +
      '@media print{' +
        '#tg-toolbar{display:none!important;}' +
        '#tg-frame-wrap{margin:0;height:100vh;}' +
        '@page{size:' + size + ' ' + orient + ';margin:1cm;}' +
      '}' +
      '</style></head><body>' +
      '<div id="tg-toolbar">' +
        '<span>&#128196; Tool Acadmy — URL to PDF</span>' +
        '<button id="tg-save-btn" onclick="window.print()">&#11015;&#65039; Save as PDF</button>' +
        '<button id="tg-hide-btn" onclick="document.getElementById(\'tg-toolbar\').style.display=\'none\';window.print()">Hide toolbar &amp; Print</button>' +
        '<span id="tg-url-label">' + escapeHtml(url) + '</span>' +
      '</div>' +
      '<div id="tg-frame-wrap">' +
        '<iframe id="tg-frame" src="' + safeUrl + '" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>' +
      '</div>' +
      '<scr' + 'ipt>' +
      '(function(){' +
        'var frame=document.getElementById("tg-frame");' +
        'if(frame){frame.addEventListener("load",function(){' +
          'setTimeout(function(){try{window.print();}catch(e){}},1500);' +
        '});}' +
      '})();' +
      '</scr' + 'ipt>' +
      '</body></html>';
  }

  /**
   * Called by the url-input tool box in tool-runner.js.
   * Returns true when the wrapper window opened, false if the popup
   * was blocked.
   */
  function convertUrl(url, options) {
    options = options || {};
    var html = buildPrintPage(url, options.size || 'A4', options.orient || 'portrait');
    var blob = new Blob([html], { type: 'text/html' });
    var blobUrl = URL.createObjectURL(blob);
    var newWin = window.open(blobUrl, '_blank', 'width=1024,height=768');
    setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 10000);
    return !!newWin;
  }

  /* run() only fires if this tool is ever mounted as a file-based box */
  async function run(file, options, onProgress) {
    throw new Error('Please enter a URL in the input field above and click Convert.');
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = {
    run: run,
    convertUrl: convertUrl,
    getOptionsHTML: getOptionsHTML,
    getOptions: getOptions,
    CONFIG: CONFIG,
  };
})();

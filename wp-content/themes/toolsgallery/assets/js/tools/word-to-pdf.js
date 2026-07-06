/**
 * ToolsGallery — Word to PDF
 * Handler: word-to-pdf
 * URL: /tool/word-to-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'word-to-pdf' };

  var _lastHtml = '';
  var _lastFileName = '';

  function getOptionsHTML() {
    return '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;font-size:14px">' +
      '<p style="margin:0 0 12px;font-weight:600;color:#0369a1">How to convert Word to PDF:</p>' +
      '<ol style="margin:0;padding-left:20px;color:#0c4a6e;line-height:1.8">' +
        '<li>Upload your .docx file above</li>' +
        '<li>Click <strong>Convert</strong> — a print dialog will open</li>' +
        '<li>Choose <strong>Save as PDF</strong> in the print dialog</li>' +
      '</ol>' +
    '</div>' +
    '<div id="wtp-result" style="margin-top:12px"></div>';
  }

  function getOptions(optionsEl) {
    return {};
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function run(file, options, onProgress) {
    if (!window.mammoth) {
      onProgress && onProgress(0.05, 'Loading converter...');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
      if (!window.mammoth) throw new Error('Document library failed to load. Please refresh and try again.');
    }

    onProgress && onProgress(0.2, 'Converting document...');
    var ab = await file.arrayBuffer();
    var result = await mammoth.convertToHtml({ arrayBuffer: ab });
    _lastHtml = result.value;
    _lastFileName = file.name.replace(/\.docx?$/i, '');

    onProgress && onProgress(0.8, 'Opening print dialog...');

    var printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Popup blocked — please allow popups and try again.');

    printWindow.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
      '<title>' + escHtml(_lastFileName) + '</title>' +
      '<style>' +
        'body{font-family:serif;font-size:12pt;line-height:1.6;max-width:800px;margin:40px auto;padding:0 40px;color:#000}' +
        'h1,h2,h3{font-weight:bold;margin-top:1.2em}' +
        'p{margin:0.6em 0}' +
        'table{border-collapse:collapse;width:100%}' +
        'td,th{border:1px solid #ccc;padding:6px}' +
        '@media print{body{margin:0;padding:20px}}' +
      '</style></head><body>' +
      _lastHtml +
      '<hr style="margin-top:40px"><p style="font-size:10pt;color:#666;text-align:center">Converted from ' + escHtml(file.name) + ' — Print or Save as PDF</p>' +
      '</body></html>'
    );
    printWindow.document.close();

    // Show re-open button in options area
    var resultEl = document.getElementById('wtp-result');
    if (resultEl) {
      resultEl.innerHTML = '<button type="button" class="tg-btn-secondary" id="wtp-reopen">Open Document Again</button>';
      document.getElementById('wtp-reopen').addEventListener('click', function () {
        var w2 = window.open('', '_blank');
        if (w2) {
          w2.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escHtml(_lastFileName) + '</title></head><body>' + _lastHtml + '</body></html>');
          w2.document.close();
          setTimeout(function () { w2.print(); }, 500);
        }
      });
    }

    setTimeout(function () { printWindow.print(); }, 600);

    onProgress && onProgress(1, 'Done! Use the print dialog to save as PDF.');
    return {
      blob: new Blob([''], { type: 'text/plain' }),
      filename: _lastFileName + '.pdf',
      noDownload: true,
    };
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/**
 * ============================================================
 * ToolsGallery — Word to PDF Tool
 * ============================================================
 * Handler key: word-to-pdf
 * Tool URL: /tool/word-to-pdf/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - mammoth.js (window.mammoth)
 * ============================================================
 */
(function () {
  'use strict';

  async function run(files, options, callbacks) {
    var onProgress  = callbacks.onProgress;
    var onSuccess   = callbacks.onSuccess;
    var onError     = callbacks.onError;
    var getBox      = callbacks.getBox;
    var getDownloadBtn = callbacks.getDownloadBtn;
    var getResultEl    = callbacks.getResultEl;
    var getSuccessBanner = callbacks.getSuccessBanner;
    var getErrorBanner   = callbacks.getErrorBanner;

    if (!window.mammoth) { onError('Conversion library not loaded. Please refresh the page.'); return; }

    onProgress(30, 'Converting Word document…');
    var ab     = await files[0].arrayBuffer();
    var result = await window.mammoth.convertToHtml({ arrayBuffer: ab });

    var html      = result.value;
    var filename  = files[0].name;
    var printHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + filename + '</title><style>' +
      'body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.5;margin:2cm;color:#000}' +
      'h1,h2,h3{page-break-after:avoid}p{page-break-inside:avoid;margin:0 0 0.5em}' +
      '@media print{body{margin:0}.no-print{display:none}}' +
      '</style></head><body>' +
      '<div class="no-print" style="background:#fff3cd;padding:12px;margin-bottom:20px;border-radius:6px;font-size:13px;">' +
      '<strong>To save as PDF:</strong> Press Ctrl+P &rarr; Select &ldquo;Save as PDF&rdquo; as printer &rarr; Click Save' +
      '</div>' + html + '</body></html>';

    var win = window.open('', '_blank');
    if (!win) { onError('Popup blocked. Please allow popups for this site and try again.'); return; }
    win.document.write(printHtml);
    win.document.close();
    win.focus();

    /* Show instructions in result area */
    var resultEl    = getResultEl    ? getResultEl()    : null;
    var successBanner = getSuccessBanner ? getSuccessBanner() : null;
    var errorBanner   = getErrorBanner   ? getErrorBanner()   : null;
    var downloadBtn   = getDownloadBtn   ? getDownloadBtn()   : null;
    var box           = getBox ? getBox() : null;

    if (resultEl) {
      resultEl.hidden = false;
      if (successBanner) successBanner.hidden = false;
      if (errorBanner)   errorBanner.hidden   = true;
    }
    var msgEl = resultEl ? resultEl.querySelector('.tg-success-msg') : null;
    if (msgEl) {
      msgEl.innerHTML = '&#10003; Document opened in new tab.<br><strong>To save as PDF:</strong>' +
        '<ol style="margin:8px 0 0 16px">' +
        '<li>Switch to the new tab that opened</li>' +
        '<li>Press <kbd>Ctrl+P</kbd> (or <kbd>Cmd+P</kbd> on Mac)</li>' +
        '<li>Choose <strong>Save as PDF</strong> as the printer, then Save</li>' +
        '</ol>';
      msgEl.hidden = false;
    }
    if (downloadBtn) {
      downloadBtn.textContent = 'Open Document Again';
      downloadBtn.hidden = false;
      if (box) box._wordToPdfHtml = printHtml;
      downloadBtn.onclick = function (e) {
        e.preventDefault();
        var w = window.open('', '_blank');
        if (w) { w.document.write(box ? (box._wordToPdfHtml || '') : printHtml); w.document.close(); w.focus(); }
      };
    }

    /* Signal tool-runner that processing is done (no blob) */
    onSuccess(null, 'word-to-pdf');
  }

  function getOptionsHTML() { return ''; }
  function getOptions() { return {}; }

  window.TGTools = window.TGTools || {};
  window.TGTools['word-to-pdf'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions };
})();

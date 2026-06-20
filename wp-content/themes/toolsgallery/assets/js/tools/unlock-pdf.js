/**
 * ToolsGallery — Unlock PDF
 * Handler: unlock-pdf
 * URL: /tool/unlock-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'unlock-pdf' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:4px">' +
      '<label class="tg-opt-label" for="up-password">Password (if required)</label>' +
      '<input type="password" id="up-password" class="tg-text-input" placeholder="Leave blank for owner-only protected PDFs" autocomplete="off">' +
    '</div>' +
    '<p style="font-size:12px;color:var(--color-gray-600);margin:4px 0 0">For owner-restricted PDFs (no open password), leave blank.</p>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { password: '' };
    var pw = optionsEl.querySelector('#up-password');
    return { password: pw ? pw.value : '' };
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();

    var pdfDoc;
    try {
      var loadOpts = { ignoreEncryption: true };
      if (options.password) loadOpts.password = options.password;
      pdfDoc = await PDFDocument.load(ab, loadOpts);
    } catch (e) {
      if (options.password) {
        throw new Error('Wrong password or could not decrypt this PDF.');
      }
      throw new Error('Could not load PDF: ' + e.message);
    }

    onProgress && onProgress(0.7, 'Removing encryption...');
    // pdf-lib saves without encryption by default when loaded with ignoreEncryption
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-unlocked.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

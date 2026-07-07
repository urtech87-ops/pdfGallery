/**
 * ToolsGallery — Unlock PDF
 * Handler: unlock-pdf
 * URL: /tool/unlock-pdf/
 *
 * Uses the pdf-decrypt engine (RC4 40/128-bit, AES-128 V=4/R=4 and
 * AES-256 V=5/R=6) when available, with a pdf-lib fallback for PDFs that
 * only carry owner/permission restrictions.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'unlock-pdf' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:4px">' +
      '<label class="tg-opt-label" for="unlock-password">PDF Password (if required)</label>' +
      '<input type="password" id="unlock-password" class="tg-text-input" placeholder="Enter PDF password (leave empty if unknown)" autocomplete="off" style="width:100%;box-sizing:border-box;">' +
    '</div>' +
    '<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:10px;margin-top:8px;font-size:13px;">' +
      '<strong>Note:</strong> Supports RC4, AES-128 and AES-256 encrypted PDFs. ' +
      'For PDFs that require a password to open, the correct password must be provided. ' +
      'For owner-restricted PDFs (open without a password), leave the field blank.' +
    '</div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { password: '' };
    var pw = optionsEl.querySelector('#unlock-password');
    return { password: pw ? pw.value : '' };
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('PDF library not loaded. Please refresh.');

    var password = options.password || '';

    onProgress && onProgress(0.1, 'Reading PDF...');
    var ab = await file.arrayBuffer();
    var bytes = new Uint8Array(ab);

    var outBytes = null;

    /* Preferred path: full decryption via pdf-decrypt */
    if (window.pdfDecryptLib) {
      try {
        var info = await pdfDecryptLib.isEncrypted(bytes);
        if (!info.encrypted) {
          onProgress && onProgress(1, 'This PDF is not password protected.');
          return { blob: new Blob([bytes], { type: 'application/pdf' }), filename: file.name.replace(/\.pdf$/i, '') + '-unlocked.pdf' };
        }
        onProgress && onProgress(0.4, 'Decrypting (' + (info.algorithm || 'standard') + ')...');
        outBytes = await pdfDecryptLib.decryptPDF(bytes, password);
      } catch (e) {
        if (e && /Incorrect password/i.test(e.message || '')) {
          throw new Error(password
            ? 'Incorrect password. Please check the password and try again.'
            : 'This PDF requires a password to unlock. Please enter it above.');
        }
        /* Unsupported / parse errors — fall through to pdf-lib below */
        outBytes = null;
      }
    }

    /* Fallback: pdf-lib with ignoreEncryption (removes owner restrictions) */
    if (!outBytes) {
      onProgress && onProgress(0.5, 'Removing password protection...');
      var pdfDoc;
      try {
        pdfDoc = await PDFLib.PDFDocument.load(ab, { ignoreEncryption: true });
      } catch (e2) {
        throw new Error('Could not unlock this PDF. This tool supports standard RC4, AES-128 and AES-256 protected PDFs. Error: ' + (e2 && e2.message ? e2.message : 'unknown'));
      }
      outBytes = await pdfDoc.save();
    }

    onProgress && onProgress(0.9, 'Saving unlocked PDF...');
    var blob = new Blob([outBytes], { type: 'application/pdf' });

    onProgress && onProgress(1.0, 'PDF unlocked successfully!');
    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '-unlocked.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

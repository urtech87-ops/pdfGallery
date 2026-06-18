/**
 * ============================================================
 * ToolsGallery — Unlock PDF Tool
 * ============================================================
 * Handler key: unlock-pdf
 * Tool URL: /tool/unlock-pdf/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-decrypt (window.pdfDecryptLib)
 * ============================================================
 */
(function () {
  'use strict';

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;

    var decryptLib = window.pdfDecryptLib;
    if (!decryptLib) { onError('PDF decrypt library not loaded.'); return; }

    onProgress(20, 'Reading PDF…');
    var ab    = await files[0].arrayBuffer();
    var bytes = new Uint8Array(ab);

    var isEnc = await decryptLib.isEncrypted(bytes);
    if (!isEnc.encrypted) {
      return onSuccess(new Blob([bytes], { type: 'application/pdf' }), 'unlocked.pdf');
    }

    onProgress(60, 'Removing protection…');
    var decrypted;
    try {
      decrypted = await decryptLib.decryptPDF(bytes, options.password || '');
    } catch (e) {
      if (e && e.message && /password|incorrect/i.test(e.message)) {
        onError('Incorrect password. Please try again.');
      } else {
        onError('Could not unlock PDF: ' + (e && e.message ? e.message : 'unknown error'));
      }
      return;
    }
    onSuccess(new Blob([decrypted], { type: 'application/pdf' }), 'unlocked.pdf');
  }

  function getOptionsHTML() {
    return '<label class="tg-opt-label" for="unlock-password">PDF Password</label>' +
      '<input type="password" id="unlock-password" class="tg-text-input" placeholder="Enter PDF password">' +
      '<p class="tg-opt-info">Leave blank to remove owner/permissions restrictions only.</p>';
  }

  function getOptions() {
    var el = document.querySelector('#unlock-password');
    return { password: el ? el.value : '' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['unlock-pdf'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions };
})();

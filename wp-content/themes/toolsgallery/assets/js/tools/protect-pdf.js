/**
 * ============================================================
 * ToolsGallery — Protect PDF Tool
 * ============================================================
 * Handler key: protect-pdf
 * Tool URL: /tool/protect-pdf/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-encrypt (window.pdfEncryptLib)
 * ============================================================
 */
(function () {
  'use strict';

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;

    if (!options.password1) {
      if (callbacks.onInlineError) callbacks.onInlineError('Please enter a password.');
      return;
    }
    if (options.password1.length < 4) {
      if (callbacks.onInlineError) callbacks.onInlineError('Password must be at least 4 characters.');
      return;
    }
    if (options.password1 !== options.password2) {
      if (callbacks.onInlineError) callbacks.onInlineError('Passwords do not match.');
      return;
    }

    var encryptFn = window.pdfEncryptLib && window.pdfEncryptLib.encryptPDF;
    if (!encryptFn) { onError('PDF encryption library not loaded.'); return; }

    var ownerPw = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');

    onProgress(30, 'Encrypting PDF…');
    var ab        = await files[0].arrayBuffer();
    var bytes     = new Uint8Array(ab);
    var perms     = options.permissions || {};
    var encrypted = await encryptFn(bytes, options.password1, {
      ownerPassword:         ownerPw,
      algorithm:             'AES-256',
      allowPrinting:         perms.printing   !== false,
      allowHighQualityPrint: perms.printing   !== false,
      allowModifying:        perms.modifying  !== false,
      allowCopying:          perms.copying    !== false,
      allowAnnotating:       perms.annotating !== false,
      allowFillingForms:     perms.annotating !== false,
      allowExtraction:       perms.copying    !== false,
      allowAssembly:         false,
    });

    onSuccess(
      new Blob([encrypted], { type: 'application/pdf' }),
      'protected.pdf',
      { message: '⚠️ Important: Save your password somewhere safe. If you forget it, the PDF cannot be recovered.' }
    );
  }

  function getOptionsHTML() {
    return '<label class="tg-opt-label" for="protect-pw">Open Password <span class="tg-opt-hint">(required to open the PDF)</span></label>' +
      '<input type="password" id="protect-pw" class="tg-text-input" placeholder="Set a password to open this PDF">' +
      '<label class="tg-opt-label" for="protect-pw2" style="margin-top:10px">Confirm Password</label>' +
      '<input type="password" id="protect-pw2" class="tg-text-input" placeholder="Repeat the password">' +
      '<details style="margin-top:12px"><summary class="tg-opt-label" style="cursor:pointer">Advanced permissions</summary>' +
      '<div class="tg-checkbox-group" style="margin-top:8px">' +
        '<label><input type="checkbox" id="perm-print" checked> Allow Printing</label>' +
        '<label><input type="checkbox" id="perm-copy" checked> Allow Copying Text</label>' +
        '<label><input type="checkbox" id="perm-edit" checked> Allow Editing</label>' +
        '<label><input type="checkbox" id="perm-comment" checked> Allow Commenting</label>' +
      '</div></details>';
  }

  function getOptions() {
    var p1 = document.querySelector('#protect-pw');
    var p2 = document.querySelector('#protect-pw2');
    var pp = document.querySelector('#perm-print');
    var pc = document.querySelector('#perm-copy');
    var pe = document.querySelector('#perm-edit');
    var pco= document.querySelector('#perm-comment');
    return {
      password1: p1 ? p1.value : '',
      password2: p2 ? p2.value : '',
      permissions: {
        printing:   pp  ? pp.checked  : true,
        copying:    pc  ? pc.checked  : true,
        modifying:  pe  ? pe.checked  : true,
        annotating: pco ? pco.checked : true,
      },
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['protect-pdf'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions };
})();

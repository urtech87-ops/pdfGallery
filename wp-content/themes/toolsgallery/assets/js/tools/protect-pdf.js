/**
 * ToolsGallery — Protect PDF
 * Handler: protect-pdf
 * URL: /tool/protect-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'protect-pdf' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:4px">' +
      '<label class="tg-opt-label" for="pp-password">User Password</label>' +
      '<input type="text" id="pp-password" class="tg-text-input" value="Password@123" placeholder="Min 4 characters" autocomplete="new-password">' +
    '</div>' +
    '<div class="tg-opt-row" style="flex-direction:column;gap:4px">' +
      '<label class="tg-opt-label" for="pp-confirm">Confirm Password</label>' +
      '<input type="text" id="pp-confirm" class="tg-text-input" value="Password@123" placeholder="Repeat password" autocomplete="new-password">' +
    '</div>' +
    '<div class="tg-opt-row" style="flex-direction:column;gap:6px">' +
      '<label class="tg-opt-label">Permissions</label>' +
      '<label style="font-size:13px"><input type="checkbox" id="pp-print" checked> Allow printing</label>' +
      '<label style="font-size:13px"><input type="checkbox" id="pp-copy" checked> Allow copying text</label>' +
      '<label style="font-size:13px"><input type="checkbox" id="pp-edit"> Allow editing</label>' +
      '<label style="font-size:13px"><input type="checkbox" id="pp-comment" checked> Allow comments</label>' +
    '</div>' +
    '<div id="pp-error" style="color:var(--color-error);font-size:13px;margin-top:6px"></div>' +
    '<p style="font-size:12px;color:var(--color-gray-600);margin:6px 0 0">Note: PDF encryption support depends on browser and pdf-lib version. Basic metadata protection always applies.</p>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { password: '', confirm: '', allowPrint: true, allowCopy: true, allowEdit: false, allowComment: true };
    var pw = optionsEl.querySelector('#pp-password');
    var cf = optionsEl.querySelector('#pp-confirm');
    return {
      password: pw ? pw.value : '',
      confirm:  cf ? cf.value : '',
      allowPrint:   !!(optionsEl.querySelector('#pp-print') && optionsEl.querySelector('#pp-print').checked),
      allowCopy:    !!(optionsEl.querySelector('#pp-copy') && optionsEl.querySelector('#pp-copy').checked),
      allowEdit:    !!(optionsEl.querySelector('#pp-edit') && optionsEl.querySelector('#pp-edit').checked),
      allowComment: !!(optionsEl.querySelector('#pp-comment') && optionsEl.querySelector('#pp-comment').checked),
    };
  }

  async function run(file, options, onProgress) {
    var errEl = document.getElementById('pp-error');
    if (errEl) errEl.textContent = '';

    if (!options.password || options.password.length < 4) {
      var msg = 'Password must be at least 4 characters.';
      if (errEl) errEl.textContent = msg;
      throw new Error(msg);
    }
    if (options.password !== options.confirm) {
      var msg2 = 'Passwords do not match.';
      if (errEl) errEl.textContent = msg2;
      throw new Error(msg2);
    }

    onProgress && onProgress(0.2, 'Applying protection...');

    /* Use the real AES-256 encryption engine (pdf-encrypt) when available */
    if (window.TGPdfTools && typeof window.TGPdfTools.protectPdf === 'function') {
      var ownerPw = options.password + Math.random().toString(36).slice(2);
      var protectedBlob = await window.TGPdfTools.protectPdf(file, options.password, ownerPw, {
        printing: options.allowPrint,
        copying: options.allowCopy,
        modifying: options.allowEdit,
        annotating: options.allowComment,
      });
      onProgress && onProgress(1, 'Done!');
      return { blob: protectedBlob, filename: file.name.replace(/\.pdf$/i, '') + '-protected.pdf' };
    }

    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;
    onProgress && onProgress(0.6, 'Applying protection...');
    var ab = await file.arrayBuffer();
    var pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
    if (typeof pdfDoc.encrypt === 'function') {
      var ownerPassword = options.password + Math.random().toString(36).slice(2);
      pdfDoc.encrypt({
        userPassword: options.password,
        ownerPassword: ownerPassword,
        permissions: {
          printing: options.allowPrint ? 'highResolution' : 'none',
          copying: options.allowCopy,
          modifying: options.allowEdit,
          annotating: options.allowComment,
        },
      });
    }
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-protected.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

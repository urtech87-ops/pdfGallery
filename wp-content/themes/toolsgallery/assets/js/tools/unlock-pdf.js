/**
 * ToolsGallery — Unlock PDF
 * Handler: unlock-pdf
 * URL: /tool/unlock-pdf/
 *
 * Decryption is done by the pdf-decrypt engine (RC4 40/128-bit, AES-128
 * V=4/R=4 and AES-256 V=5/R=6). pdf-lib cannot decrypt PDFs — its
 * ignoreEncryption flag only skips the /Encrypt check and produces output
 * whose streams are still encrypted — so pdf-lib is used ONLY to rebuild
 * unencrypted, permission-restricted files. The output is verified to be
 * free of encryption before it is offered for download; a still-locked
 * file is never delivered.
 */
(function () {
  'use strict';
  var CONFIG = {
    handler: 'unlock-pdf',
    downloadName: 'unlocked.pdf',
  };

  function getOptionsHTML() {
    return '<div class="tg-opt-section">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="unlock-pw">&#128275; PDF Password</label>' +
        '<div style="position:relative;">' +
          '<input type="password" id="unlock-pw" class="tg-input" placeholder="Enter PDF password" autocomplete="off" style="padding-right:44px;">' +
          '<button type="button" id="unlock-pw-eye" aria-label="Show password" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;color:#6b7280;">&#128065;</button>' +
        '</div>' +
        '<p style="font-size:12px;color:#6b7280;margin:6px 0 0;">Leave empty if the PDF opens without a password but has restricted permissions only.</p>' +
      '</div>' +
      '<div class="tg-info-box">' +
        '<strong>&#8505;&#65039; Note:</strong> This tool removes password protection from PDFs you own. ' +
        'Supports RC4, AES-128 and AES-256 encryption. For PDFs that require a password to open, the correct password must be provided.' +
      '</div>' +
    '</div>';
  }

  /* Inline <script> tags in injected markup never execute — the
     show/hide toggle is wired here instead. */
  function wireOptions(optionsEl) {
    if (!optionsEl || optionsEl.dataset.unlockWired) return;
    optionsEl.dataset.unlockWired = '1';
    var eye = optionsEl.querySelector('#unlock-pw-eye');
    var pw  = optionsEl.querySelector('#unlock-pw');
    if (eye && pw) {
      eye.addEventListener('click', function () {
        pw.type = pw.type === 'password' ? 'text' : 'password';
        eye.textContent = pw.type === 'password' ? '👁' : '🙈';
      });
    }
  }

  function onFileReady(file, optionsEl) {
    wireOptions(optionsEl);
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { password: '' };
    var pw = optionsEl.querySelector('#unlock-pw');
    return { password: pw ? pw.value : '' };
  }

  /* Scan the output for a live /Encrypt entry in the trailer so a
     still-locked file is never handed to the user. */
  async function verifyNotEncrypted(bytes) {
    if (window.pdfDecryptLib) {
      try {
        var info = await pdfDecryptLib.isEncrypted(bytes);
        return !info.encrypted;
      } catch (e) { /* fall through to text scan */ }
    }
    var tail = bytes.length > 4096 ? bytes.subarray(bytes.length - 4096) : bytes;
    var tailStr = '';
    for (var i = 0; i < tail.length; i++) tailStr += String.fromCharCode(tail[i]);
    return tailStr.indexOf('/Encrypt') === -1;
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('PDF library not loaded. Please refresh the page.');

    var password = options.password || '';

    onProgress && onProgress(0.1, 'Reading PDF file...');
    var ab = await file.arrayBuffer();
    var bytes = new Uint8Array(ab);

    var outBytes = null;
    var isEncryptedFile = false;

    /* Preferred path: full decryption via the pdf-decrypt engine */
    if (window.pdfDecryptLib) {
      try {
        var info = await pdfDecryptLib.isEncrypted(bytes);
        isEncryptedFile = !!info.encrypted;
        if (!isEncryptedFile) {
          /* Not encrypted at all — rebuild via pdf-lib below to strip
             any permission flags, or return as-is if that fails. */
          outBytes = null;
        } else {
          onProgress && onProgress(0.4, 'Decrypting (' + (info.algorithm || 'standard') + ')...');
          outBytes = await pdfDecryptLib.decryptPDF(bytes, password);
        }
      } catch (e) {
        if (e && /Incorrect password/i.test(e.message || '')) {
          throw new Error(password
            ? 'Incorrect password. Please check the password and try again.'
            : 'This PDF is password-protected. Please enter the password in the field above and try again.');
        }
        /* Encrypted but engine could not handle it — do NOT fall through
           to pdf-lib: it cannot decrypt and would output a broken file. */
        if (isEncryptedFile) {
          throw new Error('Could not decrypt this PDF (' + (e && e.message ? e.message : 'unsupported encryption') + '). Supported: RC4, AES-128, AES-256.');
        }
        outBytes = null;
      }
    }

    /* Unencrypted (permission-restricted only) files: rebuild with
       pdf-lib, which drops permission flags on save. */
    if (!outBytes) {
      if (isEncryptedFile) {
        throw new Error('This PDF is encrypted and the decryption engine is unavailable. Please refresh the page and try again.');
      }
      onProgress && onProgress(0.5, 'Removing restrictions...');
      var pdfDoc;
      try {
        pdfDoc = await PDFLib.PDFDocument.load(ab, { ignoreEncryption: true });
      } catch (e2) {
        throw new Error('Could not unlock this PDF. This tool supports standard RC4, AES-128 and AES-256 protected PDFs. Error: ' + (e2 && e2.message ? e2.message : 'unknown'));
      }
      outBytes = await pdfDoc.save({ useObjectStreams: false });
    }

    onProgress && onProgress(0.85, 'Verifying output...');
    if (!outBytes || outBytes.length < 100) {
      throw new Error('Failed to generate unlocked PDF.');
    }
    var clean = await verifyNotEncrypted(outBytes instanceof Uint8Array ? outBytes : new Uint8Array(outBytes));
    if (!clean) {
      throw new Error('Verification failed: the output still contains encryption. Please make sure the correct password was entered and try again.');
    }

    onProgress && onProgress(0.95, 'Saving unlocked PDF...');
    var blob = new Blob([outBytes], { type: 'application/pdf' });

    onProgress && onProgress(1.0, 'PDF unlocked successfully!');
    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '-unlocked.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = {
    run: run,
    getOptionsHTML: getOptionsHTML,
    getOptions: getOptions,
    onFileReady: onFileReady,
    wireOptions: wireOptions,
    CONFIG: CONFIG,
  };
})();

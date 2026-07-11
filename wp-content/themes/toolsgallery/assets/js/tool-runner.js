/* ToolsGallery — tool-runner.js
   Browser-side file tool UI shell.
   Targets .tg-tool-box[data-tool-type="browser|server"].
*/
(function () {
  'use strict';

  /* ── Processing loader (spinner + message + progress bar) ──
     Shared by the file-tool box and the data-input box so every
     tool category gets a visible loading indicator. */
  function tgShowLoading(container, msg, extraClass) {
    if (!container) return;
    var btn = container.querySelector('.tg-action-btn');
    if (btn && !btn.hidden && !btn.disabled) {
      btn._tgOrigText = btn.textContent;
      btn._tgLoadingDisabled = true;
      btn.disabled = true;
      btn.textContent = '⏳ Processing...';
    }
    var loader = container.querySelector('.tg-proc-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'tg-proc-loader';
      loader.innerHTML =
        '<div class="tg-proc-spinner"></div>' +
        '<div class="tg-proc-msg"></div>' +
        '<div class="tg-proc-bar-wrap"><div class="tg-proc-bar"><div class="tg-proc-fill"></div></div></div>';
      var anchor = container.querySelector('.tg-progress');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(loader, anchor);
      } else {
        container.appendChild(loader);
      }
    }
    if (extraClass) loader.classList.add(extraClass);
    var msgEl = loader.querySelector('.tg-proc-msg');
    if (msgEl) msgEl.textContent = msg || 'Processing...';
    var fill = loader.querySelector('.tg-proc-fill');
    if (fill) fill.style.width = '0%';
    loader.hidden = false;
  }

  function tgUpdateLoading(container, pct, msg) {
    if (!container) return;
    var loader = container.querySelector('.tg-proc-loader');
    if (!loader || loader.hidden) return;
    if (msg) {
      var msgEl = loader.querySelector('.tg-proc-msg');
      if (msgEl) msgEl.textContent = msg;
    }
    if (typeof pct === 'number' && !isNaN(pct)) {
      var fill = loader.querySelector('.tg-proc-fill');
      if (fill) fill.style.width = Math.max(0, Math.min(100, pct * 100)) + '%';
    }
  }

  function tgHideLoading(container) {
    if (!container) return;
    var btn = container.querySelector('.tg-action-btn');
    if (btn && btn._tgLoadingDisabled) {
      btn._tgLoadingDisabled = false;
      btn.disabled = false;
      if (btn._tgOrigText) btn.textContent = btn._tgOrigText;
    }
    var loader = container.querySelector('.tg-proc-loader');
    if (loader) loader.hidden = true;
  }

  /* ── URL-input tool type handler (Phase 3C) ── */
  var urlBox = document.querySelector('.tg-tool-box[data-tool-type="url-input"]');
  if (urlBox) {
    var urlField      = urlBox.querySelector('#tg-url-field');
    var urlActionBtn  = urlBox.querySelector('.tg-action-btn');
    var urlProgress   = urlBox.querySelector('.tg-progress');
    var urlResult     = urlBox.querySelector('.tg-result');
    var urlError      = urlBox.querySelector('.tg-error-banner');
    var urlErrorMsg   = urlBox.querySelector('.tg-error-msg');
    var urlSuccess    = urlBox.querySelector('.tg-success-banner');
    var urlReset      = urlBox.querySelector('.tg-reset');
    var urlHandler    = urlBox.dataset.handler || '';
    var urlOptionsEl  = urlBox.querySelector('.tg-options');
    var urlTool       = (window.TGTools && window.TGTools[urlHandler]) ? window.TGTools[urlHandler] : null;

    /* Inject the tool's options panel (e.g. page size / orientation) */
    if (urlTool && urlTool.getOptionsHTML && urlOptionsEl) {
      urlOptionsEl.innerHTML = urlTool.getOptionsHTML();
      urlOptionsEl.hidden = false;
      if (typeof urlTool.wireOptions === 'function') {
        try { urlTool.wireOptions(urlOptionsEl); } catch (e) {}
      }
    }

    if (urlField && urlActionBtn) {
      urlActionBtn.disabled = urlField.value.trim() === '';
      urlField.addEventListener('input', function () {
        urlActionBtn.disabled = urlField.value.trim() === '';
      });

      var showUrlError = function (msg) {
        if (urlError) {
          if (urlErrorMsg) urlErrorMsg.textContent = msg;
          urlError.hidden = false;
          if (urlResult) urlResult.hidden = false;
          if (urlSuccess) urlSuccess.hidden = true;
        } else {
          alert(msg);
        }
      };

      urlActionBtn.addEventListener('click', function () {
        var url = urlField.value.trim();
        if (!url) {
          showUrlError('Please enter a URL first.');
          return;
        }
        if (!url.match(/^https?:\/\//i)) {
          url = 'https://' + url;
          urlField.value = url;
        }
        try {
          new URL(url);
        } catch (e) {
          showUrlError('Please enter a valid URL (e.g. https://example.com)');
          return;
        }

        var opened;
        if (urlTool && typeof urlTool.convertUrl === 'function') {
          /* Delegate to the tool: opens a print-ready wrapper window
             with a "Save as PDF" toolbar (see url-to-pdf.js). */
          var urlOpts = urlTool.getOptions ? urlTool.getOptions(urlOptionsEl) : {};
          opened = urlTool.convertUrl(url, urlOpts);
        } else {
          /* Fallback: open the raw URL and try to print it. Cross-origin
             pages block scripted print() — the try/catch keeps the flow
             working and the instructions below cover that case. */
          var newTab = window.open(url, '_blank');
          opened = !!newTab;
          if (opened) {
            setTimeout(function () {
              try { newTab.focus(); newTab.print(); } catch (e) {}
            }, 2500);
          }
        }

        if (!opened) {
          showUrlError('Popup was blocked. Please allow popups for this site (look for the popup icon in the address bar) and try again.');
          return;
        }

        if (urlProgress) urlProgress.hidden = true;
        if (urlError)    urlError.hidden    = true;
        if (urlResult)   urlResult.hidden   = false;
        if (urlSuccess)  urlSuccess.hidden  = false;
        // Show success instruction
        var msgEl = urlBox.querySelector('.tg-url-msg, .tg-inline-msg');
        if (!msgEl && urlResult) {
          msgEl = document.createElement('p');
          msgEl.className = 'tg-url-msg';
          urlResult.insertBefore(msgEl, urlResult.firstChild);
        }
        if (msgEl) {
          msgEl.textContent = 'Page opened in a new window! Click the "Save as PDF" button in its orange toolbar (or press Ctrl+P) and choose "Save as PDF" as the destination.';
          msgEl.style.color = '#16a34a';
          msgEl.hidden = false;
        }
      });

      if (urlReset) {
        urlReset.addEventListener('click', function (e) {
          e.preventDefault();
          urlField.value = '';
          urlActionBtn.disabled = true;
          if (urlResult) urlResult.hidden = true;
        });
      }
    }
  }

  /* -----------------------------------------------
     DATA-INPUT TOOL BOX (Phase 4 — Chart Maker, QR Code)
     No file upload; button always enabled.
  ----------------------------------------------- */
  (function () {
    var diBox = document.querySelector('.tg-tool-box[data-tool-type="data-input"]');
    if (!diBox) return;

    var diHandler    = diBox.dataset.handler || '';
    var diOptionsEl  = diBox.querySelector('.tg-options');
    var diActionBtn  = diBox.querySelector('.tg-action-btn');
    var diProgressEl = diBox.querySelector('.tg-progress');
    var diProgressBar = diBox.querySelector('.tg-progress-bar');
    var diResultEl   = diBox.querySelector('.tg-result');
    var diSuccessBanner = diResultEl ? diResultEl.querySelector('.tg-success-banner') : null;
    var diErrorBanner   = diResultEl ? diResultEl.querySelector('.tg-error-banner') : null;
    var diDownloadBtn   = diBox.querySelector('.tg-download-btn');
    var diResetLink     = diBox.querySelector('.tg-reset');
    var diBlobUrl = null;
    var diFilename = 'output';

    if (window.TGTools && window.TGTools[diHandler]) {
      var diTool = window.TGTools[diHandler];
      /* Tools that manage their own UI via init() */
      if (typeof diTool.init === 'function') {
        if (diOptionsEl) { diOptionsEl.hidden = false; }
        diTool.init(diBox);
        /* Hide default action button — tool manages its own actions */
        if (diActionBtn) diActionBtn.hidden = true;
        return; /* tool is fully self-contained */
      }
      if (diTool.getOptionsHTML && diOptionsEl) {
        diOptionsEl.innerHTML = diTool.getOptionsHTML();
        diOptionsEl.hidden = false;
        /* Inline <script> tags in injected HTML never execute — tools wire
           their option events through this hook instead. */
        if (typeof diTool.wireOptions === 'function') {
          try { diTool.wireOptions(diOptionsEl); } catch (e) {}
        }
      }
    }

    if (diActionBtn) diActionBtn.disabled = false;

    if (diActionBtn) {
      diActionBtn.addEventListener('click', function () {
        if (!window.TGTools || !window.TGTools[diHandler]) return;
        var diTool2 = window.TGTools[diHandler];
        var opts = diTool2.getOptions ? diTool2.getOptions(diOptionsEl) : {};

        diActionBtn.hidden = true;
        if (diProgressEl) { diProgressEl.hidden = true; if (diProgressBar) diProgressBar.style.width = '0%'; }
        if (diResultEl)   diResultEl.hidden = true;
        if (diErrorBanner) diErrorBanner.hidden = true;
        tgShowLoading(diBox, 'Processing...');

        diTool2.run(null, opts, function (pct, msg) {
          if (diProgressBar) diProgressBar.style.width = (pct * 100) + '%';
          var lbl = diProgressEl ? diProgressEl.querySelector('.tg-progress-label') : null;
          if (lbl && msg) lbl.textContent = msg;
          tgUpdateLoading(diBox, pct, msg);
        }).then(function (result) {
          if (diProgressEl) diProgressEl.hidden = true;
          tgHideLoading(diBox);
          if (diBlobUrl) URL.revokeObjectURL(diBlobUrl);
          diBlobUrl = URL.createObjectURL(result.blob);
          diFilename = result.filename || 'output';
          if (diResultEl) diResultEl.hidden = false;
          if (diSuccessBanner) diSuccessBanner.hidden = false;
          if (diErrorBanner)   diErrorBanner.hidden = true;
          if (diDownloadBtn)   diDownloadBtn.hidden = false;
          diActionBtn.hidden = false;
        }).catch(function (e) {
          if (diProgressEl) diProgressEl.hidden = true;
          tgHideLoading(diBox);
          diActionBtn.hidden = false;
          if (diResultEl) diResultEl.hidden = false;
          if (diSuccessBanner) diSuccessBanner.hidden = true;
          if (diErrorBanner) {
            diErrorBanner.hidden = false;
            var em = diErrorBanner.querySelector('.tg-error-msg');
            if (em) em.textContent = e && e.message ? e.message : 'An error occurred.';
          }
        });
      });
    }

    if (diDownloadBtn) {
      diDownloadBtn.addEventListener('click', function () {
        if (!diBlobUrl) return;
        var a = document.createElement('a');
        a.href = diBlobUrl;
        a.download = diFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }

    if (diResetLink) {
      diResetLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (diResultEl) diResultEl.hidden = true;
        if (diActionBtn) { diActionBtn.hidden = false; diActionBtn.disabled = false; }
      });
    }
  })();

  var box = document.querySelector('.tg-tool-box[data-tool-type="browser"], .tg-tool-box[data-tool-type="server"]');
  if (!box) return;

  var uploadZone    = box.querySelector('#upload-zone');
  var fileInput     = box.querySelector('#file-input');
  var fileSelected  = box.querySelector('.tg-file-selected');
  var filenameEl    = box.querySelector('.tg-filename');
  var filesizeEl    = box.querySelector('.tg-filesize');
  var removeBtn     = box.querySelector('.tg-remove-file');
  var fileListEl    = box.querySelector('.tg-file-list');
  var optionsEl     = box.querySelector('.tg-options');
  var actionBtn     = box.querySelector('.tg-action-btn');
  var progressEl    = box.querySelector('.tg-progress');
  var progressBar   = box.querySelector('.tg-progress-bar');
  var resultEl      = box.querySelector('.tg-result');
  var successBanner = resultEl ? resultEl.querySelector('.tg-success-banner') : null;
  var errorBanner   = resultEl ? resultEl.querySelector('.tg-error-banner') : null;
  var downloadBtn   = box.querySelector('.tg-download-btn');
  var resetLink     = box.querySelector('.tg-reset');

  var accept   = box.dataset.accept || '';
  var handler  = box.dataset.handler || '';
  var isMulti  = box.dataset.multi === 'true';
  var MAX_FILES = 20;

  var currentFile      = null;
  var currentFiles     = [];
  var blobUrl          = null;
  var downloadFilename = 'toolsgallery-output.txt';

  /* rotation state for rotate-pdf */
  var rotationState    = {};
  var rotationOriginal = {};

  /* Phase 3B state */
  var editPdfOps       = [];    /* edit-pdf: operation stack */
  var editPdfDeleted   = [];    /* edit-pdf: deleted page indices */
  var editPdfRotations = {};    /* edit-pdf: per-page rotation degrees */
  var editPdfPageIdx   = 0;     /* edit-pdf: current page index (0-based) */
  var editPdfPdfDoc    = null;  /* edit-pdf: pdfjsLib document */
  var editPdfFabric    = null;  /* edit-pdf: Fabric.js canvas */
  var editPdfPageObjects = {};  /* edit-pdf: fabricObjects per page index */
  var editPdfRenderScale = 1.5;
  var editPdfUndoHistory = [];
  var editPdfRedoHistory = [];

  var rearrangeOrder   = [];    /* rearrange-pdf: current page order (0-based indices) */
  var rearrangeDeleted = {};    /* rearrange-pdf: deleted original indices */

  var extractResults   = null;  /* extract-text: last results */

  if (accept && fileInput) fileInput.setAttribute('accept', accept);

  /* -----------------------------------------------
     HELPERS
  ----------------------------------------------- */
  function formatBytes(bytes) {
    if (bytes < 1024)    return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function validateFile(file) {
    if (!accept) return true;
    var fileName = file.name.toLowerCase();
    var fileType = (file.type || '').toLowerCase();
    return accept.split(',').some(function (t) {
      t = t.trim().toLowerCase();
      if (!t) return false;

      /* Wildcard MIME — e.g. "image/*" accepts any image. Some OSes
         report no MIME type for valid files, so an empty type passes
         and the tool itself surfaces a real error if the file is bad. */
      if (t.slice(-2) === '/*') {
        if (!fileType) return true;
        return fileType.indexOf(t.slice(0, -1)) === 0;
      }

      /* Exact MIME type — e.g. "image/jpeg" (prefix-tolerant for
         variants like "image/svg" vs "image/svg+xml") */
      if (t.indexOf('/') !== -1) {
        return fileType === t || fileType.indexOf(t) === 0;
      }

      /* Extension — ".pdf", "pdf" */
      var ext = t.charAt(0) === '.' ? t : '.' + t;
      return fileName.slice(-ext.length) === ext;
    });
  }

  function isPdfFile(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  function parseSimpleRange(str, total) {
    var result = [];
    var parts = str.split(',');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (!part) continue;
      var rangeMatch = part.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        var s = parseInt(rangeMatch[1], 10);
        var e = parseInt(rangeMatch[2], 10);
        if (isNaN(s) || isNaN(e) || s < 1 || e > total || s > e) {
          throw new Error('Invalid range: ' + part + ' (document has ' + total + ' pages)');
        }
        for (var p = s; p <= e; p++) result.push(p);
      } else {
        var n = parseInt(part, 10);
        if (isNaN(n) || n < 1 || n > total) {
          throw new Error('Page ' + (isNaN(n) ? part : n) + ' does not exist in this document (' + total + ' pages total)');
        }
        result.push(n);
      }
    }
    if (!result.length) throw new Error('No valid pages specified.');
    return result;
  }

  /* Inline validation message */
  var inlineMsgEl = null;
  function getInlineMsgEl() {
    if (!inlineMsgEl) {
      inlineMsgEl = document.createElement('p');
      inlineMsgEl.className = 'tg-inline-msg';
      inlineMsgEl.hidden = true;
      if (actionBtn && actionBtn.parentNode) {
        actionBtn.parentNode.insertBefore(inlineMsgEl, actionBtn);
      }
    }
    return inlineMsgEl;
  }
  function showInlineMsg(msg) {
    var el = getInlineMsgEl();
    el.textContent = msg;
    el.hidden = false;
  }
  function clearInlineMsg() {
    if (inlineMsgEl) inlineMsgEl.hidden = true;
  }

  function showSuccessResult() {
    if (successBanner) successBanner.hidden = false;
    if (errorBanner)   errorBanner.hidden   = true;
    if (downloadBtn)   downloadBtn.hidden   = false;
    if (resultEl)      resultEl.hidden      = false;
  }

  function showErrorResult(msg) {
    if (errorBanner) {
      var msgEl = errorBanner.querySelector('.tg-error-msg');
      if (msgEl) msgEl.textContent = msg;
      errorBanner.hidden = false;
    }
    if (successBanner) successBanner.hidden = true;
    if (downloadBtn)   downloadBtn.hidden   = true;
    if (resultEl)      resultEl.hidden      = false;
  }

  /* Video tools run FFmpeg.wasm and take noticeably longer — give
     their loader a distinct dark style. */
  var loaderClass = (handler.indexOf('vid-') === 0 || handler === 'gif-to-vid') ? 'tg-ffmpeg-loader' : '';

  function startProgress() {
    if (fileSelected) fileSelected.hidden = true;
    if (fileListEl)   fileListEl.hidden   = true;
    if (actionBtn)    actionBtn.hidden    = true;
    /* The legacy .tg-progress bar is replaced by the richer
       .tg-proc-loader (spinner + message + bar); keep updating the old
       bar's width for any code that reads it, but keep it hidden. */
    if (progressEl) {
      progressEl.hidden = true;
      if (progressBar) progressBar.style.width = '0%';
    }
    tgShowLoading(box, loaderClass ? 'Loading FFmpeg engine...' : 'Processing...', loaderClass);
    /* animate to 85% */
    var startTime = Date.now();
    box._progressInterval = setInterval(function () {
      var pct = Math.min(85, ((Date.now() - startTime) / 2000) * 85);
      if (progressBar) progressBar.style.width = pct + '%';
      tgUpdateLoading(box, pct / 100);
    }, 50);
  }

  function finishProgress(isError) {
    clearInterval(box._progressInterval);
    if (progressBar) progressBar.style.width = isError ? '0%' : '100%';
    tgUpdateLoading(box, isError ? 0 : 1);
    setTimeout(function () {
      if (progressEl) progressEl.hidden = true;
      tgHideLoading(box);
      if (isError && actionBtn) actionBtn.hidden = false;
      if (isError && (fileSelected || fileListEl)) {
        if (fileSelected && currentFile)  fileSelected.hidden = false;
        if (fileListEl   && currentFiles.length) fileListEl.hidden = false;
      }
    }, 200);
  }

  /* -----------------------------------------------
     OPTIONS INJECTION
  ----------------------------------------------- */
  function tgInjectOptions(h, container) {
    if (!container) return;
    container.innerHTML = '';

    if (h === 'compress') {
      container.innerHTML =
        '<label class="tg-opt-label">Compression level</label>' +
        '<div class="tg-radio-group">' +
          '<label><input type="radio" name="compress-quality" value="standard" checked> Standard <span class="tg-opt-hint">(removes redundant data)</span></label>' +
          '<label><input type="radio" name="compress-quality" value="aggressive"> Aggressive <span class="tg-opt-hint">(also strips metadata)</span></label>' +
        '</div>' +
        '<p class="tg-opt-info">&#8505;&#65039; Browser-based compression optimizes PDF structure. For image-heavy PDFs, results may vary.</p>';
    }

    if (h === 'split') {
      container.innerHTML =
        '<label class="tg-opt-label">Split mode</label>' +
        '<div class="tg-radio-group" id="split-mode-group">' +
          '<label><input type="radio" name="split-mode" value="extract" checked> Extract pages</label>' +
          '<label><input type="radio" name="split-mode" value="every"> Split every N pages</label>' +
          '<label><input type="radio" name="split-mode" value="half"> Split in half</label>' +
        '</div>' +
        '<div id="split-extract-wrap">' +
          '<label class="tg-opt-label" for="split-pages-input">Pages to extract <span class="tg-opt-hint">e.g. 1,3,5-8</span></label>' +
          '<input type="text" id="split-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
        '</div>' +
        '<div id="split-every-wrap" hidden>' +
          '<label class="tg-opt-label" for="split-every-input">Split every N pages</label>' +
          '<input type="number" id="split-every-input" class="tg-text-input" min="1" value="1" style="width:80px">' +
        '</div>';

      /* show/hide sub-inputs based on selected mode */
      container.querySelectorAll('input[name="split-mode"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
          var extractWrap = container.querySelector('#split-extract-wrap');
          var everyWrap   = container.querySelector('#split-every-wrap');
          if (extractWrap) extractWrap.hidden = radio.value !== 'extract';
          if (everyWrap)   everyWrap.hidden   = radio.value !== 'every';
        });
      });
    }

    if (h === 'pdf-to-jpg') {
      container.innerHTML =
        '<label class="tg-opt-label">Quality</label>' +
        '<div class="tg-radio-group">' +
          '<label><input type="radio" name="jpg-quality" value="web"> Web (72 DPI)</label>' +
          '<label><input type="radio" name="jpg-quality" value="standard" checked> Standard (150 DPI)</label>' +
          '<label><input type="radio" name="jpg-quality" value="print"> Print (300 DPI)</label>' +
        '</div>' +
        '<label class="tg-opt-label" style="margin-top:12px">Pages</label>' +
        '<div class="tg-radio-group">' +
          '<label><input type="radio" name="jpg-pages" value="all" checked> All pages</label>' +
          '<label><input type="radio" name="jpg-pages" value="specific"> Specific pages</label>' +
        '</div>' +
        '<div id="jpg-pages-wrap" hidden>' +
          '<input type="text" id="jpg-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
        '</div>';

      container.querySelectorAll('input[name="jpg-pages"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
          var wrap = container.querySelector('#jpg-pages-wrap');
          if (wrap) wrap.hidden = radio.value !== 'specific';
        });
      });
    }

    if (h === 'jpg-to-pdf') {
      container.innerHTML =
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="page-size-sel">Page size</label>' +
          '<select name="page-size" id="page-size-sel" class="tg-select">' +
            '<option value="A4" selected>A4</option>' +
            '<option value="Letter">Letter</option>' +
            '<option value="auto">Auto-fit (match image)</option>' +
          '</select>' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="orientation-sel">Orientation</label>' +
          '<select name="orientation" id="orientation-sel" class="tg-select">' +
            '<option value="portrait" selected>Portrait</option>' +
            '<option value="landscape">Landscape</option>' +
          '</select>' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="margin-sel">Margin</label>' +
          '<select name="margin" id="margin-sel" class="tg-select">' +
            '<option value="none">None</option>' +
            '<option value="small">Small (10 pt)</option>' +
            '<option value="normal" selected>Normal (20 pt)</option>' +
          '</select>' +
        '</div>';
    }

    if (h === 'unlock-pdf') {
      container.innerHTML =
        '<label class="tg-opt-label" for="unlock-password">PDF Password</label>' +
        '<input type="password" id="unlock-password" class="tg-text-input" placeholder="Enter PDF password">' +
        '<p class="tg-opt-info">Leave blank to remove owner/permissions restrictions only.</p>';
    }

    if (h === 'protect-pdf') {
      container.innerHTML =
        '<label class="tg-opt-label" for="protect-pw">Open Password <span class="tg-opt-hint">(required to open the PDF)</span></label>' +
        '<input type="password" id="protect-pw" class="tg-text-input" value="Password@123" placeholder="Set a password to open this PDF">' +
        '<label class="tg-opt-label" for="protect-pw2" style="margin-top:10px">Confirm Password</label>' +
        '<input type="password" id="protect-pw2" class="tg-text-input" value="Password@123" placeholder="Repeat the password">' +
        '<details style="margin-top:12px"><summary class="tg-opt-label" style="cursor:pointer">Advanced permissions</summary>' +
        '<div class="tg-checkbox-group" style="margin-top:8px">' +
          '<label><input type="checkbox" id="perm-print" checked> Allow Printing</label>' +
          '<label><input type="checkbox" id="perm-copy" checked> Allow Copying Text</label>' +
          '<label><input type="checkbox" id="perm-edit" checked> Allow Editing</label>' +
          '<label><input type="checkbox" id="perm-comment" checked> Allow Commenting</label>' +
        '</div></details>';
    }

    if (h === 'pdf-to-png') {
      container.innerHTML =
        '<label class="tg-opt-label">Resolution</label>' +
        '<div class="tg-radio-group">' +
          '<label><input type="radio" name="png-res" value="standard" checked> Standard (150 DPI, scale 2×)</label>' +
          '<label><input type="radio" name="png-res" value="high"> High (300 DPI, scale 4×)</label>' +
          '<label><input type="radio" name="png-res" value="ultra"> Ultra (600 DPI, scale 8×)</label>' +
        '</div>' +
        '<label class="tg-opt-label" style="margin-top:12px">Pages</label>' +
        '<div class="tg-radio-group">' +
          '<label><input type="radio" name="png-pages" value="all" checked> All pages</label>' +
          '<label><input type="radio" name="png-pages" value="specific"> Specific pages</label>' +
        '</div>' +
        '<div id="png-pages-wrap" hidden>' +
          '<input type="text" id="png-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
        '</div>';
      container.querySelectorAll('input[name="png-pages"]').forEach(function (r) {
        r.addEventListener('change', function () {
          var w = container.querySelector('#png-pages-wrap');
          if (w) w.hidden = r.value !== 'specific';
        });
      });
    }

    if (h === 'add-watermark') {
      container.innerHTML =
        '<div class="tg-tab-group" style="margin-bottom:12px">' +
          '<button type="button" class="tg-tab-btn tg-tab-btn--active" data-tab="wm-text">Text Watermark</button>' +
          '<button type="button" class="tg-tab-btn" data-tab="wm-image">Image Watermark</button>' +
        '</div>' +
        '<div id="wm-text" class="tg-tab-pane">' +
          '<label class="tg-opt-label">Watermark Text</label>' +
          '<input type="text" id="wm-text-input" class="tg-text-input" placeholder="e.g. CONFIDENTIAL">' +
          '<div class="tg-opt-row" style="margin-top:10px">' +
            '<label class="tg-opt-label" for="wm-font">Font</label>' +
            '<select id="wm-font" class="tg-select"><option value="Helvetica" selected>Helvetica</option><option value="Times Roman">Times Roman</option><option value="Courier">Courier</option></select>' +
          '</div>' +
          '<div class="tg-opt-row">' +
            '<label class="tg-opt-label" for="wm-size">Font Size</label>' +
            '<input type="range" id="wm-size" min="12" max="120" value="48" style="flex:1"> <span id="wm-size-val">48</span>' +
          '</div>' +
          '<div class="tg-opt-row">' +
            '<label class="tg-opt-label" for="wm-color">Color</label>' +
            '<input type="color" id="wm-color" value="#FF0000">' +
          '</div>' +
          '<div class="tg-opt-row">' +
            '<label class="tg-opt-label" for="wm-opacity">Opacity</label>' +
            '<input type="range" id="wm-opacity" min="5" max="100" value="30" style="flex:1"> <span id="wm-opacity-val">30%</span>' +
          '</div>' +
          '<div class="tg-opt-row">' +
            '<label class="tg-opt-label" for="wm-rotation">Rotation</label>' +
            '<input type="range" id="wm-rotation" min="-180" max="180" value="-45" style="flex:1"> <span id="wm-rotation-val">-45°</span>' +
          '</div>' +
          '<label class="tg-opt-label" style="margin-top:8px">Position</label>' +
          '<div class="tg-wm-pos-grid">' +
            '<button type="button" class="tg-pos-btn" data-pos="top-left">↖ Top Left</button>' +
            '<button type="button" class="tg-pos-btn" data-pos="top-center">↑ Top Center</button>' +
            '<button type="button" class="tg-pos-btn" data-pos="top-right">↗ Top Right</button>' +
            '<button type="button" class="tg-pos-btn" data-pos="middle-left">← Mid Left</button>' +
            '<button type="button" class="tg-pos-btn tg-pos-btn--active" data-pos="center">Center</button>' +
            '<button type="button" class="tg-pos-btn" data-pos="middle-right">→ Mid Right</button>' +
            '<button type="button" class="tg-pos-btn" data-pos="bottom-left">↙ Bot Left</button>' +
            '<button type="button" class="tg-pos-btn" data-pos="bottom-center">↓ Bot Center</button>' +
            '<button type="button" class="tg-pos-btn" data-pos="bottom-right">↘ Bot Right</button>' +
            '<button type="button" class="tg-pos-btn" data-pos="diagonal" style="grid-column:1/-1">⟋ Diagonal (Tiled)</button>' +
          '</div>' +
          '<label class="tg-opt-label" style="margin-top:8px">Apply to</label>' +
          '<div class="tg-radio-group">' +
            '<label><input type="radio" name="wm-pages" value="all" checked> All pages</label>' +
            '<label><input type="radio" name="wm-pages" value="first"> First page only</label>' +
            '<label><input type="radio" name="wm-pages" value="custom"> Custom range</label>' +
          '</div>' +
          '<input type="text" id="wm-page-range" class="tg-text-input" placeholder="e.g. 1,3,5-8" hidden>' +
        '</div>' +
        '<div id="wm-image" class="tg-tab-pane" hidden>' +
          '<label class="tg-opt-label">Watermark Image <span class="tg-opt-hint">(PNG recommended for transparency)</span></label>' +
          '<input type="file" id="wm-image-file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" class="tg-text-input">' +
          '<div class="tg-opt-row" style="margin-top:10px">' +
            '<label class="tg-opt-label" for="wm-img-opacity">Opacity</label>' +
            '<input type="range" id="wm-img-opacity" min="5" max="100" value="30" style="flex:1"> <span id="wm-img-opacity-val">30%</span>' +
          '</div>' +
          '<div class="tg-opt-row">' +
            '<label class="tg-opt-label" for="wm-img-scale">Scale (% of page width)</label>' +
            '<input type="range" id="wm-img-scale" min="10" max="100" value="50" style="flex:1"> <span id="wm-img-scale-val">50%</span>' +
          '</div>' +
          '<label class="tg-opt-label" style="margin-top:8px">Position</label>' +
          '<div class="tg-wm-pos-grid" id="wm-img-pos-grid">' +
            '<button type="button" class="tg-pos-btn" data-imgpos="top-left">↖ Top Left</button>' +
            '<button type="button" class="tg-pos-btn" data-imgpos="top-center">↑ Top Center</button>' +
            '<button type="button" class="tg-pos-btn" data-imgpos="top-right">↗ Top Right</button>' +
            '<button type="button" class="tg-pos-btn" data-imgpos="middle-left">← Mid Left</button>' +
            '<button type="button" class="tg-pos-btn tg-pos-btn--active" data-imgpos="center">Center</button>' +
            '<button type="button" class="tg-pos-btn" data-imgpos="middle-right">→ Mid Right</button>' +
            '<button type="button" class="tg-pos-btn" data-imgpos="bottom-left">↙ Bot Left</button>' +
            '<button type="button" class="tg-pos-btn" data-imgpos="bottom-center">↓ Bot Center</button>' +
            '<button type="button" class="tg-pos-btn" data-imgpos="bottom-right">↘ Bot Right</button>' +
          '</div>' +
          '<label class="tg-opt-label" style="margin-top:8px">Apply to</label>' +
          '<div class="tg-radio-group">' +
            '<label><input type="radio" name="wm-img-pages" value="all" checked> All pages</label>' +
            '<label><input type="radio" name="wm-img-pages" value="first"> First page only</label>' +
            '<label><input type="radio" name="wm-img-pages" value="custom"> Custom range</label>' +
          '</div>' +
          '<input type="text" id="wm-img-page-range" class="tg-text-input" placeholder="e.g. 1,3,5-8" hidden>' +
        '</div>';

      /* Tab switching */
      container.querySelectorAll('.tg-tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          container.querySelectorAll('.tg-tab-btn').forEach(function (b) { b.classList.remove('tg-tab-btn--active'); });
          container.querySelectorAll('.tg-tab-pane').forEach(function (p) { p.hidden = true; });
          btn.classList.add('tg-tab-btn--active');
          var pane = container.querySelector('#' + btn.dataset.tab);
          if (pane) pane.hidden = false;
        });
      });
      /* Slider live labels */
      function linkSlider(id, valId, suffix) {
        var sl = container.querySelector('#' + id), vl = container.querySelector('#' + valId);
        if (sl && vl) sl.addEventListener('input', function () { vl.textContent = sl.value + suffix; });
      }
      linkSlider('wm-size', 'wm-size-val', '');
      linkSlider('wm-opacity', 'wm-opacity-val', '%');
      linkSlider('wm-rotation', 'wm-rotation-val', '°');
      linkSlider('wm-img-opacity', 'wm-img-opacity-val', '%');
      linkSlider('wm-img-scale', 'wm-img-scale-val', '%');
      /* Position buttons */
      container.querySelectorAll('.tg-pos-btn[data-pos]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          container.querySelectorAll('.tg-pos-btn[data-pos]').forEach(function (b) { b.classList.remove('tg-pos-btn--active'); });
          btn.classList.add('tg-pos-btn--active');
        });
      });
      container.querySelectorAll('.tg-pos-btn[data-imgpos]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          container.querySelectorAll('.tg-pos-btn[data-imgpos]').forEach(function (b) { b.classList.remove('tg-pos-btn--active'); });
          btn.classList.add('tg-pos-btn--active');
        });
      });
      /* Custom page range visibility */
      container.querySelectorAll('input[name="wm-pages"]').forEach(function (r) {
        r.addEventListener('change', function () {
          var el = container.querySelector('#wm-page-range');
          if (el) el.hidden = r.value !== 'custom';
        });
      });
      container.querySelectorAll('input[name="wm-img-pages"]').forEach(function (r) {
        r.addEventListener('change', function () {
          var el = container.querySelector('#wm-img-page-range');
          if (el) el.hidden = r.value !== 'custom';
        });
      });
    }

    if (h === 'add-page-numbers') {
      container.innerHTML =
        '<label class="tg-opt-label">Position</label>' +
        '<div class="tg-pn-pos-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">' +
          '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="top-left"> Top Left</label>' +
          '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="top-center"> Top Center</label>' +
          '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="top-right"> Top Right</label>' +
          '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="bottom-left"> Bottom Left</label>' +
          '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="bottom-center" checked> Bottom Center</label>' +
          '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="bottom-right"> Bottom Right</label>' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="pn-format">Format</label>' +
          '<select id="pn-format" class="tg-select">' +
            '<option value="1">1</option><option value="Page 1">Page 1</option>' +
            '<option value="1 of N">1 of N</option><option value="Page 1 of N">Page 1 of N</option>' +
            '<option value="- 1 -">- 1 -</option>' +
          '</select>' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="pn-start">Starting Number</label>' +
          '<input type="number" id="pn-start" class="tg-text-input" value="1" min="1" style="width:80px">' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="pn-font">Font</label>' +
          '<select id="pn-font" class="tg-select"><option value="Helvetica" selected>Helvetica</option><option value="Times Roman">Times Roman</option><option value="Courier">Courier</option></select>' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="pn-size">Font Size</label>' +
          '<input type="range" id="pn-size" min="8" max="24" value="10" style="flex:1"> <span id="pn-size-val">10</span>' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="pn-color">Color</label>' +
          '<input type="color" id="pn-color" value="#000000">' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="pn-margin">Margin from edge</label>' +
          '<input type="range" id="pn-margin" min="20" max="60" value="30" style="flex:1"> <span id="pn-margin-val">30pt</span>' +
        '</div>' +
        '<label class="tg-opt-label"><input type="checkbox" id="pn-skip-first"> Skip first page (cover page)</label>';

      var sl2 = container.querySelector('#pn-size'), vl2 = container.querySelector('#pn-size-val');
      if (sl2 && vl2) sl2.addEventListener('input', function () { vl2.textContent = sl2.value; });
      var sl3 = container.querySelector('#pn-margin'), vl3 = container.querySelector('#pn-margin-val');
      if (sl3 && vl3) sl3.addEventListener('input', function () { vl3.textContent = sl3.value + 'pt'; });
    }

    if (h === 'extract-text') {
      container.innerHTML =
        '<label class="tg-opt-label">Pages</label>' +
        '<div class="tg-radio-group">' +
          '<label><input type="radio" name="et-pages" value="all" checked> All pages</label>' +
          '<label><input type="radio" name="et-pages" value="specific"> Specific page</label>' +
        '</div>' +
        '<div id="et-page-wrap" hidden>' +
          '<input type="number" id="et-page-num" class="tg-text-input" min="1" value="1" placeholder="Page number" style="width:100px">' +
        '</div>';
      container.querySelectorAll('input[name="et-pages"]').forEach(function (r) {
        r.addEventListener('change', function () {
          var w = container.querySelector('#et-page-wrap');
          if (w) w.hidden = r.value !== 'specific';
        });
      });
    }

    /* Phase 3C: delegate to TGTools */
    if (window.TGTools && window.TGTools[h]) {
      var t3c = window.TGTools[h];
      if (t3c.getOptionsHTML) {
        container.innerHTML = t3c.getOptionsHTML(0);
        container.hidden = false;
      }
      /* Inline <script> tags in injected HTML never execute — tools wire
         their option events through this hook instead. */
      if (typeof t3c.wireOptions === 'function') {
        try { t3c.wireOptions(container); } catch (e) {}
      }
    }
  }

  /* -----------------------------------------------
     PAGE COUNT & ASYNC FILE INIT
  ----------------------------------------------- */
  function onFileReadyForPageCountTools(file) {
    if (handler === 'split' || handler === 'pdf-to-jpg') {
      window.TGPdfTools.getPageCount(file).then(function (count) {
        box.dataset.pageCount = count;
        var infoEl = optionsEl ? optionsEl.querySelector('.tg-page-count-info') : null;
        if (!infoEl && optionsEl) {
          infoEl = document.createElement('p');
          infoEl.className = 'tg-opt-info tg-page-count-info';
          optionsEl.insertBefore(infoEl, optionsEl.firstChild);
        }
        if (infoEl) infoEl.textContent = 'Your PDF has ' + count + ' page' + (count !== 1 ? 's' : '') + '.';
        if (optionsEl) optionsEl.hidden = false;
        /* update every-N max */
        if (handler === 'split') {
          var everyInput = optionsEl ? optionsEl.querySelector('#split-every-input') : null;
          if (everyInput) everyInput.max = count - 1;
        }
      }).catch(function () {
        if (optionsEl) optionsEl.hidden = false;
      });
    }

    if (handler === 'rotate-pdf') {
      buildRotateUI(file);
    }

    if (handler === 'pdf-to-png' || handler === 'extract-text') {
      window.TGPdfTools.getPageCount(file).then(function (count) {
        box.dataset.pageCount = count;
        var infoEl2 = optionsEl ? optionsEl.querySelector('.tg-page-count-info') : null;
        if (!infoEl2 && optionsEl) {
          infoEl2 = document.createElement('p');
          infoEl2.className = 'tg-opt-info tg-page-count-info';
          optionsEl.insertBefore(infoEl2, optionsEl.firstChild);
        }
        if (infoEl2) infoEl2.textContent = 'Your PDF has ' + count + ' page' + (count !== 1 ? 's' : '') + '.';
        if (optionsEl) optionsEl.hidden = false;
        /* update specific-page max */
        if (handler === 'extract-text') {
          var etInput = optionsEl ? optionsEl.querySelector('#et-page-num') : null;
          if (etInput) etInput.max = count;
        }
      }).catch(function () { if (optionsEl) optionsEl.hidden = false; });
    }

    if (handler === 'rearrange-pdf') {
      buildRearrangeUI(file);
    }

    if (handler === 'edit-pdf') {
      buildEditPdfUI(file);
    }

    if (handler === 'unlock-pdf' || handler === 'protect-pdf' || handler === 'add-watermark' || handler === 'add-page-numbers' || handler === 'word-to-pdf') {
      if (optionsEl) optionsEl.hidden = false;
    }

    /* Phase 10: TGTools-based tools — show options and let the tool
       prepare its UI (render previews, wire canvas events) */
    if (window.TGTools && window.TGTools[handler]) {
      if (optionsEl) optionsEl.hidden = false;
      if (typeof window.TGTools[handler].onFileReady === 'function') {
        try { window.TGTools[handler].onFileReady(file, optionsEl); } catch (e) {}
      }
    }
  }

  /* -----------------------------------------------
     ROTATE PDF THUMBNAIL UI
  ----------------------------------------------- */
  var thumbnailGrid = null;

  function buildRotateUI(file) {
    /* Remove existing grid if any */
    var existing = box.querySelector('.tg-rotate-grid');
    if (existing) existing.parentNode.removeChild(existing);

    var grid = document.createElement('div');
    grid.className = 'tg-rotate-grid';

    var quickBar = document.createElement('div');
    quickBar.className = 'tg-rotate-quickbar';
    quickBar.innerHTML =
      '<button type="button" class="tg-btn-secondary" data-rotate-all="-90">&#8634; Rotate All Left (90&deg;)</button>' +
      '<button type="button" class="tg-btn-secondary" data-rotate-all="90">&#8635; Rotate All Right (90&deg;)</button>' +
      '<button type="button" class="tg-btn-secondary" data-rotate-all="180">&#8634; Rotate All 180&deg;</button>';
    grid.appendChild(quickBar);

    var thumbsWrap = document.createElement('div');
    thumbsWrap.className = 'tg-rotate-thumbs';
    thumbsWrap.innerHTML = '<p class="tg-opt-info">Rendering thumbnails...</p>';
    grid.appendChild(thumbsWrap);

    /* Insert grid before action button */
    if (actionBtn && actionBtn.parentNode) {
      actionBtn.parentNode.insertBefore(grid, actionBtn);
    }
    thumbnailGrid = grid;

    window.TGPdfTools.renderAllThumbnails(file, 0.3, null).then(function (pages) {
      thumbsWrap.innerHTML = '';
      rotationState    = {};
      rotationOriginal = {};

      pages.forEach(function (p) {
        rotationState[p.pageNum]    = p.originalRotation;
        rotationOriginal[p.pageNum] = p.originalRotation;

        var cell = document.createElement('div');
        cell.className = 'tg-rotate-cell';
        cell.dataset.page = p.pageNum;

        var canvasWrap = document.createElement('div');
        canvasWrap.className = 'tg-rotate-canvas-wrap';
        p.canvas.style.transform = 'rotate(' + p.originalRotation + 'deg)';
        canvasWrap.appendChild(p.canvas);
        cell.appendChild(canvasWrap);

        var label = document.createElement('p');
        label.className = 'tg-rotate-pagelabel';
        label.textContent = 'Page ' + p.pageNum;
        cell.appendChild(label);

        var btnRow = document.createElement('div');
        btnRow.className = 'tg-rotate-btnrow';
        btnRow.innerHTML =
          '<button type="button" class="tg-btn-xs" data-dir="-90">&#8634; 90&deg;</button>' +
          '<button type="button" class="tg-btn-xs" data-dir="90">&#8635; 90&deg;</button>' +
          '<button type="button" class="tg-btn-xs" data-dir="180">180&deg;</button>';
        cell.appendChild(btnRow);

        btnRow.querySelectorAll('[data-dir]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            rotatePage(p.pageNum, parseInt(btn.dataset.dir, 10));
          });
        });

        thumbsWrap.appendChild(cell);
      });

      /* Quick-action buttons */
      quickBar.querySelectorAll('[data-rotate-all]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var deg = parseInt(btn.dataset.rotateAll, 10);
          pages.forEach(function (p) { rotatePage(p.pageNum, deg); });
        });
      });
    }).catch(function () {
      thumbsWrap.innerHTML = '<p class="tg-opt-info" style="color:red">Could not render thumbnails.</p>';
    });
  }

  function rotatePage(pageNum, deltaDeg) {
    rotationState[pageNum] = ((rotationState[pageNum] || 0) + deltaDeg + 360) % 360;
    var cell = thumbnailGrid ? thumbnailGrid.querySelector('[data-page="' + pageNum + '"]') : null;
    if (cell) {
      var canvas = cell.querySelector('canvas');
      if (canvas) canvas.style.transform = 'rotate(' + rotationState[pageNum] + 'deg)';
    }
  }

  function rotationChanged() {
    for (var pg in rotationState) {
      if (rotationState[pg] !== rotationOriginal[pg]) return true;
    }
    return false;
  }

  function getRotationMap() {
    return rotationState;
  }

  /* -----------------------------------------------
     SINGLE-FILE MODE
  ----------------------------------------------- */
  function selectFile(file) {
    if (!validateFile(file)) {
      alert('Please select a valid file.\nAccepted formats: ' + accept +
        '\n\nFile selected: ' + file.name + ' (' + (file.type || 'unknown type') + ')');
      return;
    }
    currentFile = file;
    if (filenameEl) filenameEl.textContent = file.name;
    if (filesizeEl) filesizeEl.textContent = formatBytes(file.size);
    if (uploadZone)   uploadZone.hidden   = true;
    if (fileSelected) fileSelected.hidden = false;
    if (actionBtn)    actionBtn.disabled  = false;
    onFileReadyForPageCountTools(file);
  }

  /* -----------------------------------------------
     MULTI-FILE MODE
  ----------------------------------------------- */
  function addFiles(filesList) {
    var invalid = [];
    for (var i = 0; i < filesList.length; i++) {
      var file = filesList[i];
      if (!validateFile(file)) { invalid.push(file.name); continue; }
      if (currentFiles.length >= MAX_FILES) { showMaxFilesMessage(); break; }
      var dup = currentFiles.some(function (f) { return f.name === file.name && f.size === file.size; });
      if (!dup) { currentFiles.push(file); }
    }
    if (invalid.length) {
      alert('Skipped invalid file(s): ' + invalid.join(', ') + '\nAccepted formats: ' + accept);
    }
    renderFileList();
    if (uploadZone) uploadZone.hidden = currentFiles.length > 0;
    if (actionBtn)  actionBtn.disabled = currentFiles.length === 0;
    /* Multi-file mode needs the same file-ready hook single-file mode
       gets (show options, call the tool's onFileReady) */
    if (currentFiles.length > 0) onFileReadyForPageCountTools(currentFiles[0]);
  }

  function removeFileAt(index) {
    currentFiles.splice(index, 1);
    renderFileList();
    if (uploadZone) uploadZone.hidden = currentFiles.length > 0;
    if (actionBtn)  actionBtn.disabled = currentFiles.length === 0;
    if (currentFiles.length > 0) onFileReadyForPageCountTools(currentFiles[0]);
  }

  function renderFileList() {
    if (!fileListEl) return;
    fileListEl.innerHTML = '';
    if (currentFiles.length === 0) { fileListEl.hidden = true; return; }
    fileListEl.hidden = false;
    currentFiles.forEach(function (file, idx) {
      var row = document.createElement('div');
      row.className = 'tg-file-list-item';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'tg-file-list-item__name';
      nameSpan.textContent = file.name;
      nameSpan.title = file.name;
      var sizeSpan = document.createElement('span');
      sizeSpan.className = 'tg-file-list-item__size';
      sizeSpan.textContent = formatBytes(file.size);
      var xBtn = document.createElement('button');
      xBtn.className = 'tg-file-list-item__remove';
      xBtn.setAttribute('aria-label', 'Remove ' + file.name);
      xBtn.textContent = '×';
      xBtn.type = 'button';
      (function (i) { xBtn.addEventListener('click', function () { removeFileAt(i); }); })(idx);
      row.appendChild(nameSpan);
      row.appendChild(sizeSpan);
      row.appendChild(xBtn);
      fileListEl.appendChild(row);
    });
    if (isMulti && currentFiles.length < MAX_FILES) {
      var addMoreBtn = document.createElement('button');
      addMoreBtn.type = 'button';
      addMoreBtn.className = 'tg-add-more-btn';
      addMoreBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add more files';
      addMoreBtn.addEventListener('click', function () { if (fileInput) fileInput.click(); });
      fileListEl.appendChild(addMoreBtn);
    }
  }

  function showMaxFilesMessage() {
    if (!fileListEl) return;
    var existing = fileListEl.querySelector('.tg-file-list-max-msg');
    if (existing) return;
    var msg = document.createElement('p');
    msg.className = 'tg-file-list-max-msg';
    msg.textContent = 'Maximum ' + MAX_FILES + ' files';
    fileListEl.appendChild(msg);
    setTimeout(function () { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 3000);
  }

  /* -----------------------------------------------
     RESET
  ----------------------------------------------- */
  function resetState() {
    clearInterval(box._progressInterval);
    tgHideLoading(box);
    currentFile  = null;
    currentFiles = [];
    rotationState    = {};
    rotationOriginal = {};
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    downloadFilename = 'toolsgallery-output.txt';
    if (uploadZone)    uploadZone.hidden    = false;
    if (fileSelected)  fileSelected.hidden  = true;
    if (fileListEl)  { fileListEl.hidden = true; fileListEl.innerHTML = ''; }
    if (actionBtn)   { actionBtn.disabled = true; actionBtn.hidden = false; }
    if (progressEl)    progressEl.hidden   = true;
    if (progressBar)   progressBar.style.width = '0%';
    if (resultEl)      resultEl.hidden     = true;
    if (successBanner) successBanner.hidden = false;
    if (errorBanner)   errorBanner.hidden   = true;
    if (downloadBtn)   downloadBtn.hidden   = false;
    if (fileInput)     fileInput.value     = '';
    clearInlineMsg();
    if (uploadZone) delete uploadZone.dataset.dragover;
    /* re-inject fresh options */
    if (optionsEl) {
      tgInjectOptions(handler, optionsEl);
      if (handler === 'rotate-pdf') optionsEl.hidden = true;
      else if (handler === 'compress' || handler === 'jpg-to-pdf') optionsEl.hidden = false;
      else optionsEl.hidden = true;
    }
    /* remove rotate grid */
    var rg = box.querySelector('.tg-rotate-grid');
    if (rg) rg.parentNode.removeChild(rg);
    thumbnailGrid = null;
    box.dataset.pageCount = '';

    /* Phase 3B cleanup */
    editPdfOps = []; editPdfDeleted = []; editPdfRotations = {}; editPdfPageIdx = 0;
    editPdfPdfDoc = null; editPdfPageObjects = {}; editPdfUndoHistory = []; editPdfRedoHistory = [];
    if (editPdfFabric) { try { editPdfFabric.dispose(); } catch (e) {} editPdfFabric = null; }
    var editWrap = box.querySelector('.tg-edit-pdf-wrap');
    if (editWrap) editWrap.parentNode.removeChild(editWrap);

    rearrangeOrder = []; rearrangeDeleted = {};
    var rrWrap = box.querySelector('.tg-rearrange-wrap');
    if (rrWrap) rrWrap.parentNode.removeChild(rrWrap);

    extractResults = null;
    var etWrap = box.querySelector('.tg-extract-result-wrap');
    if (etWrap) etWrap.parentNode.removeChild(etWrap);
  }

  /* -----------------------------------------------
     DRAG & DROP
  ----------------------------------------------- */
  if (uploadZone) {
    uploadZone.addEventListener('dragover', function (e) { e.preventDefault(); uploadZone.dataset.dragover = ''; });
    uploadZone.addEventListener('dragleave', function (e) { if (!uploadZone.contains(e.relatedTarget)) delete uploadZone.dataset.dragover; });
    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault(); delete uploadZone.dataset.dragover;
      if (!e.dataTransfer.files.length) return;
      if (isMulti) { addFiles(e.dataTransfer.files); } else { selectFile(e.dataTransfer.files[0]); }
    });
    uploadZone.addEventListener('click', function (e) { if (fileInput && e.target !== fileInput) fileInput.click(); });
    uploadZone.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (fileInput) fileInput.click(); } });
  }

  if (fileListEl && isMulti) {
    fileListEl.addEventListener('dragover', function (e) { e.preventDefault(); fileListEl.dataset.dragover = ''; });
    fileListEl.addEventListener('dragleave', function (e) { if (!fileListEl.contains(e.relatedTarget)) delete fileListEl.dataset.dragover; });
    fileListEl.addEventListener('drop', function (e) { e.preventDefault(); delete fileListEl.dataset.dragover; if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
  }

  if (fileInput) {
    fileInput.addEventListener('click', function (e) { e.stopPropagation(); });
    fileInput.addEventListener('change', function () {
      if (!fileInput.files.length) return;
      if (isMulti) { addFiles(fileInput.files); } else { selectFile(fileInput.files[0]); }
      fileInput.value = '';
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', function () { resetState(); });
  }

  /* -----------------------------------------------
     ACTION BUTTON
  ----------------------------------------------- */
  if (actionBtn) {
    actionBtn.addEventListener('click', function () {
      clearInlineMsg();

      /* ── MERGE ── */
      if (handler === 'merge' && isMulti) {
        if (currentFiles.length < 2) { showInlineMsg('Please add at least 2 PDF files to merge.'); return; }
        for (var i = 0; i < currentFiles.length; i++) {
          if (!isPdfFile(currentFiles[i])) { showInlineMsg(currentFiles[i].name + ' is not a valid PDF file.'); return; }
        }
        if (fileListEl) fileListEl.hidden = true;
        actionBtn.hidden = true;
        if (progressEl) { progressEl.hidden = false; if (progressBar) progressBar.style.width = '0%'; }
        var startTime = Date.now();
        var progressInterval = setInterval(function () {
          var pct = Math.min(85, ((Date.now() - startTime) / 2000) * 85);
          if (progressBar) progressBar.style.width = pct + '%';
        }, 50);
        var filesToMerge = currentFiles.slice();
        window.TGPdfTools.merge(filesToMerge).then(function (blob) {
          clearInterval(progressInterval);
          if (progressBar) progressBar.style.width = '100%';
          setTimeout(function () {
            if (progressEl) progressEl.hidden = true;
            blobUrl = URL.createObjectURL(blob);
            downloadFilename = 'merged.pdf';
            showSuccessResult();
          }, 200);
        }).catch(function () {
          clearInterval(progressInterval);
          if (progressEl) progressEl.hidden = true;
          actionBtn.hidden = false;
          if (fileListEl) fileListEl.hidden = false;
          showErrorResult('We couldn\'t process one of your files. Please make sure all files are valid PDFs and try again.');
        });
        return;
      }

      /* When a dedicated TGTools implementation is loaded for one of these
         handlers it takes precedence over the legacy inline branch below —
         the generic dispatcher at the bottom runs it. */
      var hasTgTool = !!(window.TGTools && window.TGTools[handler]);

      /* ── COMPRESS ── */
      if (handler === 'compress' && !hasTgTool) {
        if (!currentFile) return;
        var qualityInput = optionsEl ? optionsEl.querySelector('input[name="compress-quality"]:checked') : null;
        var quality = qualityInput ? qualityInput.value : 'standard';
        startProgress();
        window.TGPdfTools.compress(currentFile, quality).then(function (res) {
          blobUrl = URL.createObjectURL(res.blob);
          downloadFilename = 'compressed.pdf';
          finishProgress();
          var origKB = (res.originalSize / 1024).toFixed(1);
          var compKB = (res.compressedSize / 1024).toFixed(1);
          var pct    = (((res.originalSize - res.compressedSize) / res.originalSize) * 100).toFixed(0);
          var msgEl  = resultEl ? resultEl.querySelector('.tg-success-msg') : null;
          if (msgEl) {
            if (res.compressedSize < res.originalSize) {
              msgEl.textContent = 'Original: ' + origKB + ' KB → Compressed: ' + compKB + ' KB (' + pct + '% smaller)';
            } else {
              msgEl.textContent = 'Your PDF is already well-optimized (' + origKB + ' KB). Downloaded anyway.';
            }
            msgEl.hidden = false;
          }
          showSuccessResult();
        }).catch(function (e) {
          finishProgress(true);
          showErrorResult('Could not compress PDF: ' + (e && e.message ? e.message : 'unknown error'));
        });
        return;
      }

      /* ── SPLIT ── */
      if (handler === 'split') {
        if (!currentFile) return;
        var splitModeInput = optionsEl ? optionsEl.querySelector('input[name="split-mode"]:checked') : null;
        var splitMode = splitModeInput ? splitModeInput.value : 'extract';
        var splitParam = '';
        if (splitMode === 'extract') {
          var extractInput = optionsEl ? optionsEl.querySelector('#split-pages-input') : null;
          splitParam = extractInput ? extractInput.value.trim() : '1';
          if (!splitParam) { showInlineMsg('Please enter page numbers to extract.'); return; }
        } else if (splitMode === 'every') {
          var everyInput = optionsEl ? optionsEl.querySelector('#split-every-input') : null;
          splitParam = everyInput ? everyInput.value.trim() : '1';
          if (!splitParam || parseInt(splitParam, 10) < 1) { showInlineMsg('Please enter a valid number of pages.'); return; }
        }
        startProgress();
        window.TGPdfTools.split(currentFile, splitMode, splitParam).then(function (res) {
          blobUrl = URL.createObjectURL(res.blob);
          downloadFilename = res.filename;
          finishProgress();
          showSuccessResult();
        }).catch(function (e) {
          finishProgress(true);
          showInlineMsg(e && e.message ? e.message : 'Could not split PDF.');
        });
        return;
      }

      /* ── PDF TO JPG ── */
      if (handler === 'pdf-to-jpg') {
        if (!currentFile) return;
        var scaleMap   = { web: 1.0, standard: 2.0, print: 4.0 };
        var qualityInp = optionsEl ? optionsEl.querySelector('input[name="jpg-quality"]:checked') : null;
        var scale      = scaleMap[qualityInp ? qualityInp.value : 'standard'] || 2.0;
        var pageModeInp = optionsEl ? optionsEl.querySelector('input[name="jpg-pages"]:checked') : null;
        var pageMode    = pageModeInp ? pageModeInp.value : 'all';
        var totalPgsForJpg = parseInt(box.dataset.pageCount || '1', 10);
        var selectedPages = [];
        if (pageMode === 'all') {
          for (var pi = 1; pi <= totalPgsForJpg; pi++) selectedPages.push(pi);
        } else {
          var specificPagesInp = optionsEl ? optionsEl.querySelector('#jpg-pages-input') : null;
          try {
            selectedPages = parseSimpleRange(specificPagesInp ? specificPagesInp.value.trim() : '1', totalPgsForJpg);
          } catch (err) {
            showInlineMsg(err.message);
            return;
          }
        }
        startProgress();
        window.TGPdfTools.pdfToJpg(currentFile, selectedPages, scale, function (done, total) {
          if (progressBar) progressBar.style.width = Math.round((done / total) * 90) + '%';
        }).then(function (results) {
          finishProgress();
          if (results.length === 1) {
            blobUrl = URL.createObjectURL(results[0].blob);
            downloadFilename = 'page-1.jpg';
            showSuccessResult();
          } else {
            var zip = new JSZip();
            results.forEach(function (r) { zip.file(r.name, r.blob); });
            zip.generateAsync({ type: 'blob' }).then(function (zipBlob) {
              blobUrl = URL.createObjectURL(zipBlob);
              downloadFilename = 'pdf-images.zip';
              showSuccessResult();
            });
          }
        }).catch(function (e) {
          finishProgress(true);
          showErrorResult('Could not convert PDF to images: ' + (e && e.message ? e.message : 'unknown error'));
        });
        return;
      }

      /* ── JPG TO PDF ── */
      if (handler === 'jpg-to-pdf') {
        if (!currentFiles.length) return;
        var pageSizeEl    = optionsEl ? optionsEl.querySelector('select[name="page-size"]') : null;
        var orientationEl = optionsEl ? optionsEl.querySelector('select[name="orientation"]') : null;
        var marginEl      = optionsEl ? optionsEl.querySelector('select[name="margin"]') : null;
        var pageSize    = pageSizeEl    ? pageSizeEl.value    : 'A4';
        var orientation = orientationEl ? orientationEl.value : 'portrait';
        var margin      = marginEl      ? marginEl.value      : 'normal';
        startProgress();
        window.TGPdfTools.jpgToPdf(currentFiles.slice(), pageSize, orientation, margin).then(function (blob) {
          blobUrl = URL.createObjectURL(blob);
          downloadFilename = 'images.pdf';
          finishProgress();
          showSuccessResult();
        }).catch(function (e) {
          finishProgress(true);
          showErrorResult('Could not convert images to PDF: ' + (e && e.message ? e.message : 'unknown error'));
        });
        return;
      }

      /* ── ROTATE PDF ── */
      if (handler === 'rotate-pdf') {
        if (!currentFile) return;
        if (!rotationChanged()) {
          showInlineMsg('No changes made — please rotate at least one page.');
          return;
        }
        startProgress();
        window.TGPdfTools.rotatePdf(currentFile, getRotationMap()).then(function (blob) {
          blobUrl = URL.createObjectURL(blob);
          downloadFilename = 'rotated.pdf';
          finishProgress();
          showSuccessResult();
        }).catch(function (e) {
          finishProgress(true);
          showErrorResult('Could not rotate PDF: ' + (e && e.message ? e.message : 'unknown error'));
        });
        return;
      }

      /* ── PDF TO WORD ── */
      if (handler === 'pdf-to-word' && !hasTgTool) {
        if (!currentFile) return;
        startProgress();
        window.TGPdfTools.pdfToWord(currentFile, function (done, total) {
          if (progressBar) progressBar.style.width = Math.round((done / total) * 90) + '%';
        }).then(function (blob) {
          blobUrl = URL.createObjectURL(blob);
          downloadFilename = 'converted.docx';
          finishProgress();
          var msgEl = resultEl ? resultEl.querySelector('.tg-success-msg') : null;
          if (msgEl) { msgEl.textContent = '✓ Text extracted successfully. Complex layouts and images are not preserved — this works best for text-heavy PDFs.'; msgEl.hidden = false; }
          showSuccessResult();
        }).catch(function (e) { finishProgress(true); showErrorResult('Could not convert PDF: ' + (e && e.message ? e.message : 'unknown error')); });
        return;
      }

      /* ── WORD TO PDF ── */
      if (handler === 'word-to-pdf') {
        if (!currentFile) return;
        startProgress();
        if (!window.mammoth) {
          finishProgress(true);
          showErrorResult('Conversion library not loaded. Please refresh the page.');
          return;
        }
        currentFile.arrayBuffer().then(function (ab) {
          return window.mammoth.convertToHtml({ arrayBuffer: ab });
        }).then(function (result) {
          finishProgress();
          var html = result.value;
          var printHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + currentFile.name + '</title><style>' +
            'body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.5;margin:2cm;color:#000}' +
            'h1,h2,h3{page-break-after:avoid}p{page-break-inside:avoid;margin:0 0 0.5em}' +
            '@media print{body{margin:0}.no-print{display:none}}' +
            '</style></head><body>' +
            '<div class="no-print" style="background:#fff3cd;padding:12px;margin-bottom:20px;border-radius:6px;font-size:13px;">' +
            '<strong>To save as PDF:</strong> Press Ctrl+P &rarr; Select &ldquo;Save as PDF&rdquo; as printer &rarr; Click Save' +
            '</div>' +
            html + '</body></html>';
          /* Store for "Open Document" button */
          box._wordToPdfHtml = printHtml;
          /* Open in new window immediately */
          var win = window.open('', '_blank');
          if (!win) {
            showErrorResult('Popup blocked. Please allow popups for this site and try again.');
            return;
          }
          win.document.write(printHtml);
          win.document.close();
          win.focus();
          /* Show instruction result */
          if (resultEl) {
            resultEl.hidden = false;
            if (successBanner) successBanner.hidden = false;
            if (errorBanner) errorBanner.hidden = true;
          }
          var msgEl = resultEl ? resultEl.querySelector('.tg-success-msg') : null;
          if (msgEl) {
            msgEl.innerHTML = '&#10003; Document opened in new tab.<br><strong>To save as PDF:</strong><ol style="margin:8px 0 0 16px">' +
              '<li>Switch to the new tab that opened</li>' +
              '<li>Press <kbd>Ctrl+P</kbd> (or <kbd>Cmd+P</kbd> on Mac)</li>' +
              '<li>Choose <strong>Save as PDF</strong> as the printer, then Save</li></ol>';
            msgEl.hidden = false;
          }
          if (downloadBtn) {
            downloadBtn.textContent = 'Open Document Again';
            downloadBtn.hidden = false;
            downloadBtn.onclick = function (e) {
              e.preventDefault();
              var w = window.open('', '_blank');
              if (w) { w.document.write(box._wordToPdfHtml || ''); w.document.close(); w.focus(); }
            };
          }
        }).catch(function (e) { finishProgress(true); showErrorResult('Could not convert Word file: ' + (e && e.message ? e.message : 'unknown error')); });
        return;
      }

      /* ── UNLOCK PDF ── */
      if (handler === 'unlock-pdf' && !hasTgTool) {
        if (!currentFile) return;
        var pwInput = optionsEl ? optionsEl.querySelector('#unlock-password') : null;
        var pw = pwInput ? pwInput.value : '';
        startProgress();
        window.TGPdfTools.unlockPdf(currentFile, pw).then(function (blob) {
          blobUrl = URL.createObjectURL(blob);
          downloadFilename = 'unlocked.pdf';
          finishProgress();
          showSuccessResult();
        }).catch(function (e) {
          finishProgress(true);
          if (e && e.message === 'WRONG_PASSWORD') {
            showErrorResult('Incorrect password. Please try again.');
          } else {
            showErrorResult('Could not unlock PDF: ' + (e && e.message ? e.message : 'unknown error'));
          }
        });
        return;
      }

      /* ── PROTECT PDF ── */
      if (handler === 'protect-pdf' && !hasTgTool) {
        if (!currentFile) return;
        var pw1El = optionsEl ? optionsEl.querySelector('#protect-pw') : null;
        var pw2El = optionsEl ? optionsEl.querySelector('#protect-pw2') : null;
        var pw1 = pw1El ? pw1El.value : '';
        var pw2 = pw2El ? pw2El.value : '';
        if (!pw1) { showInlineMsg('Please enter a password.'); return; }
        if (pw1.length < 4) { showInlineMsg('Password must be at least 4 characters.'); return; }
        if (pw1 !== pw2) { showInlineMsg('Passwords do not match.'); return; }
        var perms = {
          printing:  optionsEl && optionsEl.querySelector('#perm-print')   ? optionsEl.querySelector('#perm-print').checked   : true,
          copying:   optionsEl && optionsEl.querySelector('#perm-copy')    ? optionsEl.querySelector('#perm-copy').checked    : true,
          modifying: optionsEl && optionsEl.querySelector('#perm-edit')    ? optionsEl.querySelector('#perm-edit').checked    : true,
          annotating:optionsEl && optionsEl.querySelector('#perm-comment') ? optionsEl.querySelector('#perm-comment').checked : true,
        };
        /* Random owner password */
        var ownerPw = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(function (b) { return b.toString(16).padStart(2,'0'); }).join('');
        startProgress();
        window.TGPdfTools.protectPdf(currentFile, pw1, ownerPw, perms).then(function (blob) {
          blobUrl = URL.createObjectURL(blob);
          downloadFilename = 'protected.pdf';
          finishProgress();
          var msgEl2 = resultEl ? resultEl.querySelector('.tg-success-msg') : null;
          if (msgEl2) { msgEl2.textContent = '⚠️ Important: Save your password somewhere safe. If you forget it, the PDF cannot be recovered.'; msgEl2.hidden = false; }
          showSuccessResult();
        }).catch(function (e) { finishProgress(true); showErrorResult('Could not protect PDF: ' + (e && e.message ? e.message : 'unknown error')); });
        return;
      }

      /* ── EDIT PDF ── */
      if (handler === 'edit-pdf') {
        if (!currentFile) return;
        if (editPdfDeleted.length >= (parseInt(box.dataset.pageCount || '1', 10))) {
          showInlineMsg('Cannot delete all pages — keep at least one page.'); return;
        }
        /* Save current page canvas JSON */
        if (editPdfFabric) {
          editPdfPageObjects[editPdfPageIdx] = editPdfFabric.toJSON(['tgType','tgData']);
        }
        startProgress();
        /* Build operations from fabric objects across all pages */
        var scale = editPdfRenderScale;
        var ops = [];
        var renderedHeights = box._editPdfRenderedHeights || {};

        Object.keys(editPdfPageObjects).forEach(function (pgIdx) {
          var pgIdxN = parseInt(pgIdx, 10);
          var canvasJson = editPdfPageObjects[pgIdx];
          var rh = renderedHeights[pgIdx] || 800;
          var objects = (canvasJson && canvasJson.objects) ? canvasJson.objects : [];
          objects.forEach(function (j) {
            var tgType = j.tgType;
            var tgData = j.tgData || {};
            if (tgType === 'text') {
              ops.push({ type: 'text', pageIndex: pgIdxN, text: j.text, x: j.left / scale, y: (rh - j.top - (j.fontSize || 12)) / scale, size: j.fontSize || 12, color: j.fill || '#000000', fontName: tgData.fontName || 'Helvetica', bold: !!tgData.bold });
            } else if (tgType === 'whiteout' || tgType === 'highlight' || tgType === 'rect') {
              var fill = j.fill || (tgType === 'highlight' ? '#FFFF00' : '#FFFFFF');
              ops.push({ type: 'rect', pageIndex: pgIdxN, x: j.left / scale, y: j.top / scale, width: j.width * (j.scaleX||1) / scale, height: j.height * (j.scaleY||1) / scale, color: fill, fill: true, opacity: j.opacity || (tgType === 'highlight' ? 0.3 : 1), borderColor: j.stroke || null, borderWidth: j.strokeWidth || 0 });
            } else if (tgType === 'image' || tgType === 'signature') {
              if (tgData && tgData.imageData) {
                ops.push({ type: 'image', pageIndex: pgIdxN, x: j.left / scale, y: j.top / scale, width: j.width * (j.scaleX||1) / scale, height: j.height * (j.scaleY||1) / scale, imageData: tgData.imageData, isPng: tgData.isPng !== false });
              }
            } else if (tgType === 'line') {
              ops.push({ type: 'line', pageIndex: pgIdxN, x1: (j.left + j.x1) / scale, y1: j.top / scale, x2: (j.left + j.x2) / scale, y2: (j.top + j.height * (j.scaleY||1)) / scale, color: j.stroke || '#000000', thickness: j.strokeWidth || 1 });
            } else if (tgType === 'ellipse') {
              ops.push({ type: 'ellipse', pageIndex: pgIdxN, x: (j.left + j.width/2 * (j.scaleX||1)) / scale, y: (rh - j.top - j.height/2*(j.scaleY||1)) / scale, rx: (j.rx || 0) * (j.scaleX||1) / scale, ry: (j.ry || 0) * (j.scaleY||1) / scale, color: j.stroke || '#000000', borderWidth: j.strokeWidth || 1 });
            }
          });
        });

        window.TGPdfTools.applyEditsAndSave(currentFile, ops, editPdfDeleted.slice(), editPdfRotations).then(function (blob) {
          blobUrl = URL.createObjectURL(blob);
          downloadFilename = 'edited.pdf';
          finishProgress();
          showSuccessResult();
        }).catch(function (e) { finishProgress(true); showErrorResult('Could not save edited PDF: ' + (e && e.message ? e.message : 'unknown error')); });
        return;
      }

      /* ── PDF TO PNG ── */
      if (handler === 'pdf-to-png') {
        if (!currentFile) return;
        var scaleMapPng = { standard: 2.0, high: 4.0, ultra: 8.0 };
        var resInp = optionsEl ? optionsEl.querySelector('input[name="png-res"]:checked') : null;
        var pngScale = scaleMapPng[resInp ? resInp.value : 'standard'] || 2.0;
        var pngPageModeInp = optionsEl ? optionsEl.querySelector('input[name="png-pages"]:checked') : null;
        var pngPageMode = pngPageModeInp ? pngPageModeInp.value : 'all';
        var totalPngPages = parseInt(box.dataset.pageCount || '1', 10);
        var pngPages = [];
        if (pngPageMode === 'all') {
          for (var pi2 = 1; pi2 <= totalPngPages; pi2++) pngPages.push(pi2);
        } else {
          var pngSpecInp = optionsEl ? optionsEl.querySelector('#png-pages-input') : null;
          try { pngPages = parseSimpleRange(pngSpecInp ? pngSpecInp.value.trim() : '1', totalPngPages); } catch (e2) { showInlineMsg(e2.message); return; }
        }
        startProgress();
        window.TGPdfTools.pdfToPng(currentFile, pngPages, pngScale, function (done, total) {
          if (progressBar) progressBar.style.width = Math.round((done / total) * 90) + '%';
        }).then(function (results) {
          finishProgress();
          if (results.length === 1) {
            blobUrl = URL.createObjectURL(results[0].blob);
            downloadFilename = 'page-1.png';
            showSuccessResult();
          } else {
            var zip = new JSZip();
            results.forEach(function (r) { zip.file(r.name, r.blob); });
            zip.generateAsync({ type: 'blob' }).then(function (zb) {
              blobUrl = URL.createObjectURL(zb);
              downloadFilename = 'pdf-images-png.zip';
              showSuccessResult();
            });
          }
        }).catch(function (e) { finishProgress(true); showErrorResult('Could not convert to PNG: ' + (e && e.message ? e.message : 'unknown error')); });
        return;
      }

      /* ── ADD WATERMARK ── */
      if (handler === 'add-watermark' && !hasTgTool) {
        if (!currentFile) return;
        var activeTab = optionsEl ? optionsEl.querySelector('.tg-tab-btn--active') : null;
        var isImgTab = activeTab && activeTab.dataset.tab === 'wm-image';

        if (!isImgTab) {
          var wmText = optionsEl ? (optionsEl.querySelector('#wm-text-input') ? optionsEl.querySelector('#wm-text-input').value.trim() : '') : '';
          if (!wmText) { showInlineMsg('Please enter watermark text.'); return; }
          var wmOpts = {
            type: 'text',
            text: wmText,
            font: optionsEl && optionsEl.querySelector('#wm-font') ? optionsEl.querySelector('#wm-font').value : 'Helvetica',
            fontSize: optionsEl && optionsEl.querySelector('#wm-size') ? parseInt(optionsEl.querySelector('#wm-size').value) : 48,
            color: optionsEl && optionsEl.querySelector('#wm-color') ? optionsEl.querySelector('#wm-color').value : '#FF0000',
            opacity: optionsEl && optionsEl.querySelector('#wm-opacity') ? parseInt(optionsEl.querySelector('#wm-opacity').value) : 30,
            rotation: optionsEl && optionsEl.querySelector('#wm-rotation') ? parseInt(optionsEl.querySelector('#wm-rotation').value) : -45,
            position: (function () { var pb = optionsEl ? optionsEl.querySelector('.tg-pos-btn[data-pos].tg-pos-btn--active') : null; return pb ? pb.dataset.pos : 'center'; })(),
            pages: (function () { var pr = optionsEl ? optionsEl.querySelector('input[name="wm-pages"]:checked') : null; return pr ? pr.value : 'all'; })(),
            pageRange: optionsEl && optionsEl.querySelector('#wm-page-range') ? optionsEl.querySelector('#wm-page-range').value : '',
          };
          startProgress();
          window.TGPdfTools.addWatermark(currentFile, wmOpts).then(function (blob) {
            blobUrl = URL.createObjectURL(blob); downloadFilename = 'watermarked.pdf'; finishProgress(); showSuccessResult();
          }).catch(function (e) { finishProgress(true); showErrorResult('Could not add watermark: ' + (e && e.message ? e.message : 'unknown error')); });
        } else {
          var wmImgFile = optionsEl && optionsEl.querySelector('#wm-image-file') ? optionsEl.querySelector('#wm-image-file').files[0] : null;
          if (!wmImgFile) { showInlineMsg('Please select a watermark image.'); return; }
          var wmImgOpts = {
            type: 'image',
            imageFile: wmImgFile,
            opacity: optionsEl && optionsEl.querySelector('#wm-img-opacity') ? parseInt(optionsEl.querySelector('#wm-img-opacity').value) : 30,
            scale: optionsEl && optionsEl.querySelector('#wm-img-scale') ? parseInt(optionsEl.querySelector('#wm-img-scale').value) : 50,
            position: (function () { var pb2 = optionsEl ? optionsEl.querySelector('.tg-pos-btn[data-imgpos].tg-pos-btn--active') : null; return pb2 ? pb2.dataset.imgpos : 'center'; })(),
            pages: (function () { var pr2 = optionsEl ? optionsEl.querySelector('input[name="wm-img-pages"]:checked') : null; return pr2 ? pr2.value : 'all'; })(),
            pageRange: optionsEl && optionsEl.querySelector('#wm-img-page-range') ? optionsEl.querySelector('#wm-img-page-range').value : '',
          };
          startProgress();
          window.TGPdfTools.addWatermark(currentFile, wmImgOpts).then(function (blob) {
            blobUrl = URL.createObjectURL(blob); downloadFilename = 'watermarked.pdf'; finishProgress(); showSuccessResult();
          }).catch(function (e) { finishProgress(true); showErrorResult('Could not add image watermark: ' + (e && e.message ? e.message : 'unknown error')); });
        }
        return;
      }

      /* ── ADD PAGE NUMBERS ── */
      if (handler === 'add-page-numbers') {
        if (!currentFile) return;
        var startVal = optionsEl && optionsEl.querySelector('#pn-start') ? parseInt(optionsEl.querySelector('#pn-start').value) : 1;
        if (!startVal || startVal < 1) { showInlineMsg('Starting number must be at least 1.'); return; }
        var pnOpts = {
          position:    (function () { var r = optionsEl ? optionsEl.querySelector('input[name="pn-pos"]:checked') : null; return r ? r.value : 'bottom-center'; })(),
          format:      optionsEl && optionsEl.querySelector('#pn-format') ? optionsEl.querySelector('#pn-format').value : '1',
          startNumber: startVal,
          font:        optionsEl && optionsEl.querySelector('#pn-font') ? optionsEl.querySelector('#pn-font').value : 'Helvetica',
          fontSize:    optionsEl && optionsEl.querySelector('#pn-size') ? parseInt(optionsEl.querySelector('#pn-size').value) : 10,
          color:       optionsEl && optionsEl.querySelector('#pn-color') ? optionsEl.querySelector('#pn-color').value : '#000000',
          margin:      optionsEl && optionsEl.querySelector('#pn-margin') ? parseInt(optionsEl.querySelector('#pn-margin').value) : 30,
          skipFirst:   optionsEl && optionsEl.querySelector('#pn-skip-first') ? optionsEl.querySelector('#pn-skip-first').checked : false,
        };
        startProgress();
        window.TGPdfTools.addPageNumbers(currentFile, pnOpts).then(function (blob) {
          blobUrl = URL.createObjectURL(blob); downloadFilename = 'numbered.pdf'; finishProgress(); showSuccessResult();
        }).catch(function (e) { finishProgress(true); showErrorResult('Could not add page numbers: ' + (e && e.message ? e.message : 'unknown error')); });
        return;
      }

      /* ── EXTRACT TEXT ── */
      if (handler === 'extract-text' && !hasTgTool) {
        if (!currentFile) return;
        var etPageMode = optionsEl ? optionsEl.querySelector('input[name="et-pages"]:checked') : null;
        var etTargetPage = null;
        if (etPageMode && etPageMode.value === 'specific') {
          var etNumInp = optionsEl ? optionsEl.querySelector('#et-page-num') : null;
          etTargetPage = etNumInp ? parseInt(etNumInp.value) : 1;
          if (!etTargetPage || etTargetPage < 1) { showInlineMsg('Please enter a valid page number.'); return; }
        }
        startProgress();
        window.TGPdfTools.extractText(currentFile, etTargetPage, function (done, total) {
          if (progressBar) progressBar.style.width = Math.round((done / total) * 90) + '%';
        }).then(function (results) {
          finishProgress();
          extractResults = results;
          var allText = results.map(function (r) { return '--- Page ' + r.page + ' ---\n' + r.text; }).join('\n\n');
          if (!allText.trim()) {
            showErrorResult('No text found. This PDF may contain scanned images only.');
            return;
          }
          /* Build result UI */
          var existing = box.querySelector('.tg-extract-result-wrap');
          if (existing) existing.parentNode.removeChild(existing);
          var etWrap2 = document.createElement('div');
          etWrap2.className = 'tg-extract-result-wrap';
          etWrap2.innerHTML =
            '<div class="tg-tab-group" style="margin-bottom:8px">' +
              '<button type="button" class="tg-tab-btn tg-tab-btn--active" data-etfmt="plain">Plain Text</button>' +
              '<button type="button" class="tg-tab-btn" data-etfmt="markdown">Markdown</button>' +
              '<button type="button" class="tg-tab-btn" data-etfmt="json">JSON</button>' +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-bottom:8px">' +
              '<button type="button" class="tg-btn-secondary et-copy-btn">Copy All</button>' +
              '<button type="button" class="tg-btn-secondary et-dl-txt-btn">Download .txt</button>' +
              '<button type="button" class="tg-btn-secondary et-dl-md-btn">Download .md</button>' +
              '<button type="button" class="tg-btn-secondary et-dl-json-btn">Download .json</button>' +
            '</div>' +
            '<textarea class="tg-extract-textarea" readonly style="width:100%;height:300px;font-family:monospace;font-size:12px;resize:vertical;box-sizing:border-box"></textarea>' +
            '<p class="tg-opt-info et-stats" style="margin-top:6px"></p>';
          if (actionBtn && actionBtn.parentNode) {
            actionBtn.parentNode.insertBefore(etWrap2, actionBtn);
          }

          function getFormattedText(fmt) {
            if (fmt === 'json') return JSON.stringify(results, null, 2);
            if (fmt === 'markdown') {
              return results.map(function (r) {
                return '## Page ' + r.page + '\n\n' +
                  r.lines.map(function (l) { return l.fontSize > 14 ? '### ' + l.text : l.text; }).join('\n') + '\n';
              }).join('\n---\n\n');
            }
            return allText;
          }

          var ta = etWrap2.querySelector('.tg-extract-textarea');
          var stats = etWrap2.querySelector('.et-stats');
          function updateDisplay(fmt) {
            var txt = getFormattedText(fmt);
            ta.value = txt;
            stats.textContent = txt.length + ' characters · ' + txt.split(/\s+/).filter(Boolean).length + ' words';
          }
          updateDisplay('plain');

          etWrap2.querySelectorAll('.tg-tab-btn[data-etfmt]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              etWrap2.querySelectorAll('.tg-tab-btn[data-etfmt]').forEach(function (b) { b.classList.remove('tg-tab-btn--active'); });
              btn.classList.add('tg-tab-btn--active');
              updateDisplay(btn.dataset.etfmt);
            });
          });

          function dlText(filename, content) {
            var b = new Blob([content], { type: 'text/plain' });
            var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }

          var copyBtn = etWrap2.querySelector('.et-copy-btn');
          if (copyBtn) copyBtn.addEventListener('click', function () {
            navigator.clipboard.writeText(ta.value).then(function () { copyBtn.textContent = 'Copied!'; setTimeout(function () { copyBtn.textContent = 'Copy All'; }, 2000); }).catch(function () { ta.select(); document.execCommand('copy'); });
          });
          var dlTxtBtn = etWrap2.querySelector('.et-dl-txt-btn');
          if (dlTxtBtn) dlTxtBtn.addEventListener('click', function () { dlText('extracted-text.txt', getFormattedText('plain')); });
          var dlMdBtn = etWrap2.querySelector('.et-dl-md-btn');
          if (dlMdBtn) dlMdBtn.addEventListener('click', function () { dlText('extracted-text.md', getFormattedText('markdown')); });
          var dlJsonBtn = etWrap2.querySelector('.et-dl-json-btn');
          if (dlJsonBtn) dlJsonBtn.addEventListener('click', function () { dlText('extracted-text.json', getFormattedText('json')); });

          /* Show result area without download button */
          if (resultEl) resultEl.hidden = false;
          if (successBanner) successBanner.hidden = false;
          if (errorBanner) errorBanner.hidden = true;
          if (downloadBtn) downloadBtn.hidden = true;
        }).catch(function (e) { finishProgress(true); showErrorResult('Could not extract text: ' + (e && e.message ? e.message : 'unknown error')); });
        return;
      }

      /* ── REARRANGE PDF ── */
      if (handler === 'rearrange-pdf') {
        if (!currentFile) return;
        var active = rearrangeOrder.filter(function (idx) { return !rearrangeDeleted[idx]; });
        if (active.length === 0) { showInlineMsg('Cannot delete all pages — keep at least one page.'); return; }
        startProgress();
        window.TGPdfTools.rearrangePdf(currentFile, active).then(function (blob) {
          blobUrl = URL.createObjectURL(blob); downloadFilename = 'rearranged.pdf'; finishProgress(); showSuccessResult();
        }).catch(function (e) { finishProgress(true); showErrorResult('Could not rearrange PDF: ' + (e && e.message ? e.message : 'unknown error')); });
        return;
      }

      /* ── Generic TGTools dispatcher for Phase 3C tools ── */
      if (window.TGTools && window.TGTools[handler]) {
        var tool3c = window.TGTools[handler];
        /* Expose the full selection — multi-file tools (vid-merge,
           img-to-* batch converters) read box._tgFiles. */
        box._tgFiles = isMulti ? currentFiles.slice() : (currentFile ? [currentFile] : []);
        var toolFile = isMulti ? currentFiles[0] : currentFile;
        var isDataInputTool = tool3c.CONFIG && tool3c.CONFIG.inputType === 'data';
        if (!toolFile && handler !== 'url-to-pdf' && !isDataInputTool) return;

        var opts3c = tool3c.getOptions ? tool3c.getOptions(optionsEl) : {};

        if (fileSelected) fileSelected.hidden = true;
        if (fileListEl)   fileListEl.hidden   = true;
        actionBtn.hidden = true;
        startProgress();

        tool3c.run(toolFile, opts3c, function (pct, msg) {
          /* Real progress from the tool — stop the fake 85% animation
             so it doesn't overwrite these updates. */
          clearInterval(box._progressInterval);
          if (progressBar) progressBar.style.width = (pct * 100) + '%';
          var labelEl = progressEl ? progressEl.querySelector('.tg-progress-label') : null;
          if (labelEl && msg) labelEl.textContent = msg;
          tgUpdateLoading(box, pct, msg);
        }).then(function (result) {
          finishProgress();
          /* Keep the tool usable after a successful run: restore the action
             button and file row so the user can tweak options (radio buttons,
             boxes, pages) and process again without re-uploading. */
          setTimeout(function () {
            actionBtn.hidden = false;
            if (fileSelected && currentFile) fileSelected.hidden = false;
            if (fileListEl && isMulti && currentFiles.length) fileListEl.hidden = false;
          }, 250);
          if (!result) {
            showErrorResult('Tool returned no result. Please try again.');
            return;
          }
          if (result && result.noDownload) {
            if (resultEl)      resultEl.hidden      = false;
            if (successBanner) successBanner.hidden = false;
            if (errorBanner)   errorBanner.hidden   = true;
            if (downloadBtn)   downloadBtn.hidden   = true;
            return;
          }
          if (result && result.html && !result.blob) {
            // Inline HTML result (e.g. ppt-to-pdf instructions panel)
            var inlineWrap = document.createElement('div');
            inlineWrap.className = 'tg-inline-html-result';
            inlineWrap.innerHTML = result.html;
            if (resultEl) {
              resultEl.hidden = false;
              var sb = resultEl.querySelector('.tg-success-banner');
              if (sb) sb.after(inlineWrap);
              else resultEl.appendChild(inlineWrap);
            }
            if (successBanner) successBanner.hidden = false;
            if (errorBanner)   errorBanner.hidden   = true;
            if (downloadBtn)   downloadBtn.hidden   = true;
          } else {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            blobUrl = URL.createObjectURL(result.blob);
            downloadFilename = result.filename
              || (tool3c.CONFIG && tool3c.CONFIG.downloadName)
              || 'output.pdf';
            showSuccessResult();
          }
        }).catch(function (e) {
          finishProgress(true);
          actionBtn.hidden = false;
          if (fileSelected && currentFile) fileSelected.hidden = false;
          if (fileListEl && isMulti && currentFiles.length) fileListEl.hidden = false;
          showErrorResult(e && e.message ? e.message : 'An error occurred. Please try again.');
        });
        return;
      }

      /* ── FALLBACK placeholder ── */
      var fileForHandler = isMulti ? (currentFiles[0] || null) : currentFile;
      if (!fileForHandler) return;
      if (fileSelected) fileSelected.hidden = true;
      if (fileListEl)   fileListEl.hidden   = true;
      actionBtn.hidden = true;
      if (progressEl) { progressEl.hidden = true; if (progressBar) progressBar.style.width = '0%'; }
      tgShowLoading(box, 'Processing...');
      var startAnim = null;
      var duration  = 1500;
      function animate(ts) {
        if (!startAnim) startAnim = ts;
        var pct = Math.min(100, ((ts - startAnim) / duration) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        tgUpdateLoading(box, pct / 100);
        if (pct < 100) {
          requestAnimationFrame(animate);
        } else {
          if (progressEl) progressEl.hidden = true;
          tgHideLoading(box);
          var blob = new Blob(['ToolsGallery placeholder output'], { type: 'text/plain' });
          blobUrl = URL.createObjectURL(blob);
          downloadFilename = 'toolsgallery-output.txt';
          showSuccessResult();
        }
      }
      requestAnimationFrame(animate);
    });
  }

  /* --- Download button --- */
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      if (!blobUrl) return;
      var a = document.createElement('a');
      a.href     = blobUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  /* --- Reset --- */
  if (resetLink) {
    resetLink.addEventListener('click', function (e) { e.preventDefault(); resetState(); });
  }

  /* -----------------------------------------------
     REARRANGE PDF UI
  ----------------------------------------------- */
  function buildRearrangeUI(file) {
    var existing = box.querySelector('.tg-rearrange-wrap');
    if (existing) existing.parentNode.removeChild(existing);

    var wrap = document.createElement('div');
    wrap.className = 'tg-rearrange-wrap';
    wrap.innerHTML =
      '<div class="tg-rearrange-toolbar" style="margin-bottom:8px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary" id="rr-reverse">⇅ Reverse Order</button>' +
        '<button type="button" class="tg-btn-secondary" id="rr-select-all">Select All</button>' +
        '<button type="button" class="tg-btn-secondary" id="rr-deselect">Deselect All</button>' +
        '<button type="button" class="tg-btn-secondary" id="rr-to-front">Move to Front</button>' +
      '</div>' +
      '<div class="tg-rearrange-grid" style="display:flex;flex-wrap:wrap;gap:10px"></div>' +
      '<p class="tg-opt-info" style="margin-top:8px">Drag thumbnails to reorder · Click thumbnail to select · 🗑 to delete</p>';

    if (actionBtn && actionBtn.parentNode) actionBtn.parentNode.insertBefore(wrap, actionBtn);

    var grid = wrap.querySelector('.tg-rearrange-grid');
    grid.innerHTML = '<p class="tg-opt-info">Rendering thumbnails…</p>';

    window.TGPdfTools.renderAllThumbnails(file, 0.2, null).then(function (pages) {
      grid.innerHTML = '';
      rearrangeOrder = pages.map(function (p) { return p.pageNum - 1; });
      rearrangeDeleted = {};
      var selectedSet = {};

      function renderCards() {
        grid.innerHTML = '';
        rearrangeOrder.forEach(function (origIdx, pos) {
          var card = document.createElement('div');
          card.className = 'tg-rr-card' + (selectedSet[origIdx] ? ' tg-rr-card--selected' : '') + (rearrangeDeleted[origIdx] ? ' tg-rr-card--deleted' : '');
          card.dataset.origIdx = origIdx;
          card.dataset.pos = pos;
          card.draggable = true;
          card.style.cssText = 'position:relative;border:2px solid #ccc;border-radius:6px;padding:4px;cursor:grab;width:100px;text-align:center;flex-shrink:0;opacity:' + (rearrangeDeleted[origIdx] ? '0.4' : '1');
          if (selectedSet[origIdx]) card.style.borderColor = '#E07B39';

          var thumb = pages[origIdx].canvas.cloneNode(true);
          thumb.style.cssText = 'max-width:90px;height:auto;display:block;margin:0 auto';
          card.appendChild(thumb);

          var lbl = document.createElement('p');
          lbl.style.cssText = 'margin:4px 0 0;font-size:11px;color:#555';
          lbl.textContent = 'Page ' + (pos + 1);
          card.appendChild(lbl);

          var delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.title = 'Delete page';
          delBtn.textContent = '🗑';
          delBtn.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(255,255,255,.8);border:none;cursor:pointer;font-size:14px;padding:0 2px;border-radius:3px';
          delBtn.addEventListener('click', function (e) { e.stopPropagation(); rearrangeDeleted[origIdx] = !rearrangeDeleted[origIdx]; renderCards(); });
          card.appendChild(delBtn);

          /* Selection */
          card.addEventListener('click', function (e) {
            if (e.shiftKey && Object.keys(selectedSet).length > 0) {
              var lastSel = parseInt(Object.keys(selectedSet).pop(), 10);
              var from = Math.min(rearrangeOrder.indexOf(lastSel), pos);
              var to   = Math.max(rearrangeOrder.indexOf(lastSel), pos);
              for (var si = from; si <= to; si++) selectedSet[rearrangeOrder[si]] = true;
            } else {
              selectedSet[origIdx] ? delete selectedSet[origIdx] : (selectedSet[origIdx] = true);
            }
            renderCards();
          });

          /* Drag */
          card.addEventListener('dragstart', function () { card.style.opacity = '0.4'; card.dataset.dragging = '1'; });
          card.addEventListener('dragend', function () { card.style.opacity = rearrangeDeleted[origIdx] ? '0.4' : '1'; delete card.dataset.dragging; });
          card.addEventListener('dragover', function (e) { e.preventDefault(); card.style.borderStyle = 'dashed'; card.style.borderColor = '#E07B39'; });
          card.addEventListener('dragleave', function () { card.style.borderStyle = 'solid'; card.style.borderColor = selectedSet[origIdx] ? '#E07B39' : '#ccc'; });
          card.addEventListener('drop', function (e) {
            e.preventDefault();
            card.style.borderStyle = 'solid'; card.style.borderColor = '#ccc';
            var dragged = grid.querySelector('[data-dragging="1"]');
            if (!dragged || dragged === card) return;
            var fromPos = parseInt(dragged.dataset.pos, 10);
            var toPos = parseInt(card.dataset.pos, 10);
            var moved = rearrangeOrder.splice(fromPos, 1)[0];
            rearrangeOrder.splice(toPos, 0, moved);
            renderCards();
          });

          grid.appendChild(card);
        });
      }

      renderCards();

      wrap.querySelector('#rr-reverse').addEventListener('click', function () { rearrangeOrder.reverse(); renderCards(); });
      wrap.querySelector('#rr-select-all').addEventListener('click', function () { rearrangeOrder.forEach(function (i) { selectedSet[i] = true; }); renderCards(); });
      wrap.querySelector('#rr-deselect').addEventListener('click', function () { selectedSet = {}; renderCards(); });
      wrap.querySelector('#rr-to-front').addEventListener('click', function () {
        var sel = rearrangeOrder.filter(function (i) { return selectedSet[i]; });
        var rest = rearrangeOrder.filter(function (i) { return !selectedSet[i]; });
        rearrangeOrder = sel.concat(rest);
        renderCards();
      });
    }).catch(function () {
      grid.innerHTML = '<p style="color:red">Could not render thumbnails.</p>';
    });
  }

  /* -----------------------------------------------
     EDIT PDF — FABRIC.JS EDITOR
  ----------------------------------------------- */
  function buildEditPdfUI(file) {
    var existing = box.querySelector('.tg-edit-pdf-wrap');
    if (existing) existing.parentNode.removeChild(existing);

    editPdfOps = []; editPdfDeleted = []; editPdfRotations = {}; editPdfPageIdx = 0; editPdfPageObjects = {};
    editPdfUndoHistory = []; editPdfRedoHistory = [];
    box._editPdfRenderedHeights = {};

    var wrap = document.createElement('div');
    wrap.className = 'tg-edit-pdf-wrap';
    wrap.style.cssText = 'margin-top:12px';
    wrap.innerHTML =
      /* toolbar */
      '<div class="tg-edit-toolbar" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f5f5f5;border-radius:6px;margin-bottom:0;position:sticky;top:0;z-index:10;align-items:center;border-bottom:2px solid #E07B39">' +
        '<button type="button" class="tg-ep-mode-btn tg-btn-xs" data-mode="text">✏ Text</button>' +
        '<button type="button" class="tg-ep-mode-btn tg-btn-xs" data-mode="highlight">🖍 Highlight</button>' +
        '<button type="button" class="tg-ep-mode-btn tg-btn-xs" data-mode="whiteout">⬜ Whiteout</button>' +
        '<div style="position:relative;display:inline-block">' +
          '<button type="button" id="ep-shapes-btn" class="tg-btn-xs">⬡ Shapes ▾</button>' +
          '<div id="ep-shapes-menu" style="display:none;position:absolute;top:100%;left:0;background:#fff;border:1px solid #ddd;border-radius:4px;z-index:20;min-width:130px;box-shadow:0 2px 8px rgba(0,0,0,.15);margin-top:2px">' +
            '<button type="button" class="tg-ep-mode-btn" data-mode="rectangle" style="display:block;width:100%;text-align:left;padding:7px 12px;border:none;background:none;cursor:pointer;font-size:13px">▭ Rectangle</button>' +
            '<button type="button" class="tg-ep-mode-btn" data-mode="ellipse" style="display:block;width:100%;text-align:left;padding:7px 12px;border:none;background:none;cursor:pointer;font-size:13px">⬤ Ellipse</button>' +
            '<button type="button" class="tg-ep-mode-btn" data-mode="line" style="display:block;width:100%;text-align:left;padding:7px 12px;border:none;background:none;cursor:pointer;font-size:13px">╱ Line</button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="tg-ep-mode-btn tg-btn-xs" data-mode="sign">✍ Sign</button>' +
        '<button type="button" class="tg-btn-xs" id="ep-insert-img" title="Insert image">🖼 Image</button>' +
        '<span style="width:1px;height:22px;background:#ccc;flex-shrink:0"></span>' +
        '<select id="ep-font" class="tg-select" style="font-size:12px"><option value="Helvetica">Helvetica</option><option value="TimesRoman">Times Roman</option><option value="Courier">Courier</option></select>' +
        '<select id="ep-fontsize" class="tg-select" style="font-size:12px;width:58px">' +
          '<option>8</option><option>10</option><option value="12" selected>12</option><option>14</option><option>16</option><option>18</option><option>24</option><option>36</option><option>48</option>' +
        '</select>' +
        '<input type="color" id="ep-color" value="#000000" title="Color" style="width:30px;height:26px;padding:0;border:1px solid #ccc;cursor:pointer;border-radius:3px">' +
        '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" id="ep-bold"> Bold</label>' +
        '<span style="width:1px;height:22px;background:#ccc;flex-shrink:0"></span>' +
        '<button type="button" class="tg-btn-xs" id="ep-undo">↩ Undo</button>' +
        '<button type="button" class="tg-btn-xs" id="ep-redo">↪ Redo</button>' +
        '<input type="file" id="ep-img-input" accept="image/*" style="display:none">' +
      '</div>' +
      /* hint box */
      '<div id="ep-hint" style="background:#E07B39;color:#fff;padding:7px 14px;font-size:13px;font-weight:500;border-radius:0 0 4px 4px;margin-bottom:8px">💡 Click anywhere on the page to add text</div>' +
      /* body: side panel + main canvas */
      '<div style="display:flex;gap:10px">' +
        '<div class="tg-edit-sidepanel" style="width:110px;flex-shrink:0;overflow-y:auto;max-height:600px;border:1px solid #eee;border-radius:4px;padding:4px" id="ep-side"></div>' +
        '<div style="flex:1;overflow-x:auto">' +
          '<div class="tg-edit-canvas-wrap" style="position:relative;display:inline-block" id="ep-canvas-wrap">' +
            '<canvas id="pdf-base-canvas" style="display:block"></canvas>' +
            '<canvas id="pdf-edit-canvas" style="position:absolute;top:0;left:0;cursor:text"></canvas>' +
          '</div>' +
          '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<button type="button" class="tg-btn-xs" id="ep-prev">◀ Prev</button>' +
            '<span id="ep-page-label" style="font-size:13px">Page 1</span>' +
            '<button type="button" class="tg-btn-xs" id="ep-next">Next ▶</button>' +
            '<button type="button" class="tg-btn-xs" id="ep-del-page" style="margin-left:12px;color:#c00">🗑 Delete page</button>' +
            '<button type="button" class="tg-btn-xs" id="ep-zoom-in">🔍+</button>' +
            '<button type="button" class="tg-btn-xs" id="ep-zoom-out">🔍−</button>' +
            '<button type="button" class="tg-btn-xs" id="ep-rot-cw">↻ Rotate</button>' +
          '</div>' +
          /* Signature pad (hidden by default) */
          '<div id="ep-sign-pad" style="display:none;margin-top:8px;border:1px solid #ccc;border-radius:4px;padding:8px">' +
            '<p style="margin:0 0 6px;font-size:13px;font-weight:600">Draw your signature:</p>' +
            '<canvas id="ep-sig-canvas" width="400" height="120" style="border:1px solid #ddd;background:#fff;cursor:crosshair;touch-action:none"></canvas>' +
            '<div style="margin-top:6px;display:flex;gap:6px">' +
              '<button type="button" class="tg-btn-xs" id="ep-sig-clear">Clear</button>' +
              '<button type="button" class="tg-btn-xs" id="ep-sig-add">Add to PDF</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    if (actionBtn && actionBtn.parentNode) actionBtn.parentNode.insertBefore(wrap, actionBtn);

    /* Controls */
    var currentMode = 'text';
    var hintFirstTextAdded = false;
    var colorEl   = wrap.querySelector('#ep-color');
    var fontEl    = wrap.querySelector('#ep-font');
    var sizeEl    = wrap.querySelector('#ep-fontsize');
    var boldEl    = wrap.querySelector('#ep-bold');
    var imgInput  = wrap.querySelector('#ep-img-input');
    var signPad   = wrap.querySelector('#ep-sign-pad');
    var sigCanvas = wrap.querySelector('#ep-sig-canvas');
    var hintEl    = wrap.querySelector('#ep-hint');
    var shapesBtn = wrap.querySelector('#ep-shapes-btn');
    var shapesMenu= wrap.querySelector('#ep-shapes-menu');
    var modeBtns  = wrap.querySelectorAll('.tg-ep-mode-btn');

    /* ── Mode management ── */
    function updateCursor(mode) {
      /* Fabric wraps our canvas in a container and creates .upper-canvas */
      var upperCanvas = wrap.querySelector('.upper-canvas');
      var cursor = (mode === 'text') ? 'text' : (['highlight','whiteout','rectangle','ellipse','line'].indexOf(mode) !== -1 ? 'crosshair' : 'default');
      if (upperCanvas) upperCanvas.style.cursor = cursor;
      var editCanvasEl = wrap.querySelector('#pdf-edit-canvas');
      if (editCanvasEl) editCanvasEl.style.cursor = cursor;
    }

    function setMode(mode) {
      currentMode = mode;
      /* Button active styles */
      modeBtns.forEach(function (btn) {
        var bm = btn.getAttribute('data-mode');
        if (bm === mode) {
          btn.style.background = '#E07B39'; btn.style.color = '#fff';
        } else {
          btn.style.background = ''; btn.style.color = '';
        }
      });
      /* Shapes parent button highlight */
      if (shapesBtn) {
        var isShape = ['rectangle','ellipse','line'].indexOf(mode) !== -1;
        shapesBtn.style.background = isShape ? '#E07B39' : '';
        shapesBtn.style.color = isShape ? '#fff' : '';
      }
      /* Hint text */
      if (hintEl) {
        if (mode === 'text' && !hintFirstTextAdded) {
          hintEl.textContent = '💡 Click anywhere on the page to add text';
          hintEl.style.display = '';
        } else if (mode === 'highlight') {
          hintEl.textContent = '💡 Click and drag to highlight an area';
          hintEl.style.display = '';
        } else if (mode === 'whiteout') {
          hintEl.textContent = '💡 Click and drag to cover content';
          hintEl.style.display = '';
        } else if (['rectangle','ellipse','line'].indexOf(mode) !== -1) {
          hintEl.textContent = '💡 Click and drag to draw a shape';
          hintEl.style.display = '';
        } else if (mode === 'sign') {
          hintEl.textContent = '💡 Draw your signature below, then drag it into position';
          hintEl.style.display = '';
        } else {
          hintEl.style.display = 'none';
        }
      }
      updateCursor(mode);
      if (signPad) signPad.style.display = (mode === 'sign') ? '' : 'none';
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var mode = btn.getAttribute('data-mode');
        if (!mode) return;
        if (shapesMenu) shapesMenu.style.display = 'none';
        setMode(mode);
        e.stopPropagation();
      });
    });

    /* Shapes dropdown */
    if (shapesBtn) {
      shapesBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (shapesMenu) shapesMenu.style.display = (shapesMenu.style.display === 'none' || shapesMenu.style.display === '') ? 'block' : 'none';
      });
    }
    document.addEventListener('click', function () { if (shapesMenu) shapesMenu.style.display = 'none'; });

    /* Image insert button */
    var insertImgBtn = wrap.querySelector('#ep-insert-img');
    if (insertImgBtn) insertImgBtn.addEventListener('click', function () { if (imgInput) imgInput.click(); });
    if (imgInput) imgInput.addEventListener('change', function () {
      var f = imgInput.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var dataUrl = ev.target.result;
        var isPng = f.name.toLowerCase().endsWith('.png');
        fabric.Image.fromURL(dataUrl, function (img) {
          img.set({ left: 50, top: 50, scaleX: 1, scaleY: 1 });
          img.tgType = 'image';
          img.tgData = { imageData: null, isPng: isPng, dataUrl: dataUrl };
          f.arrayBuffer().then(function (imgAb) { img.tgData.imageData = new Uint8Array(imgAb); });
          if (editPdfFabric) { editPdfFabric.add(img); editPdfFabric.renderAll(); pushUndo(); }
        });
      };
      reader.readAsDataURL(f);
      imgInput.value = '';
    });

    /* Signature pad */
    if (sigCanvas) {
      var sigCtx = sigCanvas.getContext('2d');
      var sigDrawing = false;
      sigCanvas.addEventListener('mousedown', function (e) { sigDrawing = true; sigCtx.beginPath(); sigCtx.moveTo(e.offsetX, e.offsetY); });
      sigCanvas.addEventListener('mousemove', function (e) { if (!sigDrawing) return; sigCtx.lineTo(e.offsetX, e.offsetY); sigCtx.stroke(); });
      sigCanvas.addEventListener('mouseup', function () { sigDrawing = false; });
      sigCanvas.addEventListener('mouseleave', function () { sigDrawing = false; });
      sigCtx.strokeStyle = '#000'; sigCtx.lineWidth = 2; sigCtx.lineCap = 'round';
      var sigClearBtn = wrap.querySelector('#ep-sig-clear');
      if (sigClearBtn) sigClearBtn.addEventListener('click', function () { sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height); });
      var sigAddBtn = wrap.querySelector('#ep-sig-add');
      if (sigAddBtn) sigAddBtn.addEventListener('click', function () {
        var dataUrl2 = sigCanvas.toDataURL('image/png');
        fabric.Image.fromURL(dataUrl2, function (img) {
          img.set({ left: 50, top: 50, scaleX: 0.5, scaleY: 0.5 });
          img.tgType = 'signature';
          var byteStr = atob(dataUrl2.split(',')[1]);
          var arr = new Uint8Array(byteStr.length);
          for (var bi = 0; bi < byteStr.length; bi++) arr[bi] = byteStr.charCodeAt(bi);
          img.tgData = { imageData: arr, isPng: true };
          if (editPdfFabric) { editPdfFabric.add(img); editPdfFabric.renderAll(); pushUndo(); }
        });
        if (signPad) signPad.style.display = 'none';
        setMode('text');
      });
    }

    /* ── Undo/Redo (snapshot-based) ── */
    function pushUndo() {
      if (!editPdfFabric) return;
      editPdfUndoHistory.push(JSON.stringify(editPdfFabric.toJSON(['tgType','tgData'])));
      editPdfRedoHistory = [];
    }

    function doUndo() {
      if (!editPdfFabric || !editPdfUndoHistory.length) return;
      editPdfRedoHistory.push(JSON.stringify(editPdfFabric.toJSON(['tgType','tgData'])));
      var prev = JSON.parse(editPdfUndoHistory.pop());
      editPdfFabric.loadFromJSON(prev, function () { editPdfFabric.renderAll(); });
    }

    function doRedo() {
      if (!editPdfFabric || !editPdfRedoHistory.length) return;
      editPdfUndoHistory.push(JSON.stringify(editPdfFabric.toJSON(['tgType','tgData'])));
      var next = JSON.parse(editPdfRedoHistory.pop());
      editPdfFabric.loadFromJSON(next, function () { editPdfFabric.renderAll(); });
    }

    var undoBtn = wrap.querySelector('#ep-undo');
    var redoBtn = wrap.querySelector('#ep-redo');
    if (undoBtn) undoBtn.addEventListener('click', doUndo);
    if (redoBtn) redoBtn.addEventListener('click', doRedo);

    /* Keyboard shortcuts: Undo, Redo, Delete selected object */
    document.addEventListener('keydown', function (e) {
      if (!currentFile || handler !== 'edit-pdf') return;
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { doUndo(); e.preventDefault(); return; }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) { doRedo(); e.preventDefault(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && editPdfFabric) {
        var activeObj = editPdfFabric.getActiveObject();
        if (activeObj && activeObj.type !== 'i-text') {
          pushUndo();
          editPdfFabric.remove(activeObj);
          editPdfFabric.renderAll();
          e.preventDefault();
        }
      }
    });

    /* Page nav */
    var prevBtn = wrap.querySelector('#ep-prev');
    var nextBtn = wrap.querySelector('#ep-next');
    var delPageBtn = wrap.querySelector('#ep-del-page');
    var zoomInBtn  = wrap.querySelector('#ep-zoom-in');
    var zoomOutBtn = wrap.querySelector('#ep-zoom-out');
    var rotCwBtn   = wrap.querySelector('#ep-rot-cw');

    if (prevBtn) prevBtn.addEventListener('click', function () { if (editPdfPageIdx > 0) navigateEditPage(editPdfPageIdx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (editPdfPdfDoc && editPdfPageIdx < editPdfPdfDoc.numPages - 1) navigateEditPage(editPdfPageIdx + 1);
    });
    if (delPageBtn) delPageBtn.addEventListener('click', function () {
      var actv = (editPdfPdfDoc ? editPdfPdfDoc.numPages : 1) - editPdfDeleted.length;
      if (actv <= 1) { showInlineMsg('Cannot delete all pages — keep at least one page.'); return; }
      if (editPdfDeleted.indexOf(editPdfPageIdx) === -1) editPdfDeleted.push(editPdfPageIdx);
      else editPdfDeleted.splice(editPdfDeleted.indexOf(editPdfPageIdx), 1);
      delPageBtn.textContent = editPdfDeleted.indexOf(editPdfPageIdx) !== -1 ? '✓ Restore page' : '🗑 Delete page';
      buildEditSidePanel(editPdfPdfDoc);
    });
    if (zoomInBtn)  zoomInBtn.addEventListener('click', function () { editPdfRenderScale = Math.min(editPdfRenderScale + 0.25, 4); navigateEditPage(editPdfPageIdx); });
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', function () { editPdfRenderScale = Math.max(editPdfRenderScale - 0.25, 0.5); navigateEditPage(editPdfPageIdx); });
    if (rotCwBtn)   rotCwBtn.addEventListener('click', function () {
      editPdfRotations[editPdfPageIdx] = ((editPdfRotations[editPdfPageIdx] || 0) + 90) % 360;
      rotCwBtn.textContent = '↻ ' + (editPdfRotations[editPdfPageIdx] || 0) + '°';
    });

    /* ── Fabric mouse handler ── */
    function onFabricMouseDown(e) {
      if (!editPdfFabric) return;
      /* If user clicked an existing object (other than background), let Fabric handle it */
      if (e.target) return;

      var mode   = currentMode;
      var color  = colorEl ? colorEl.value : '#000000';
      var fontSize = sizeEl ? parseInt(sizeEl.value, 10) : 12;
      var fontName = fontEl ? fontEl.value : 'Helvetica';
      var isBold = boldEl ? boldEl.checked : false;

      if (mode === 'text') {
        var pointer = editPdfFabric.getPointer(e.e);
        var fbFontFamily = fontName.replace('TimesRoman', 'Times New Roman');
        var itext = new fabric.IText('Click to edit', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: fbFontFamily,
          fontSize: fontSize,
          fill: color,
          fontWeight: isBold ? 'bold' : 'normal',
          editable: true,
          selectable: true,
        });
        itext.tgType = 'text';
        itext.tgData = { fontName: fontName, bold: isBold };
        editPdfFabric.add(itext);
        editPdfFabric.setActiveObject(itext);
        itext.enterEditing();
        itext.selectAll();
        editPdfFabric.renderAll();
        /* Hide hint after first text is placed */
        if (!hintFirstTextAdded) {
          hintFirstTextAdded = true;
          if (hintEl) hintEl.style.display = 'none';
        }
        itext.on('editing:exited', function () { pushUndo(); });
        return;
      }

      var pointer2 = editPdfFabric.getPointer(e.e);
      var startX = pointer2.x, startY = pointer2.y;
      var shape = null;

      if (mode === 'whiteout') {
        shape = new fabric.Rect({ left: startX, top: startY, width: 1, height: 1, fill: 'rgba(255,255,255,1)', selectable: false });
        shape.tgType = 'whiteout';
      } else if (mode === 'highlight') {
        shape = new fabric.Rect({ left: startX, top: startY, width: 1, height: 1, fill: 'rgba(255,255,0,0.35)', selectable: false });
        shape.tgType = 'highlight';
      } else if (mode === 'rectangle') {
        shape = new fabric.Rect({ left: startX, top: startY, width: 1, height: 1, fill: 'transparent', stroke: color, strokeWidth: 2, selectable: false });
        shape.tgType = 'rect';
      } else if (mode === 'ellipse') {
        shape = new fabric.Ellipse({ left: startX, top: startY, rx: 1, ry: 1, fill: 'transparent', stroke: color, strokeWidth: 2, selectable: false });
        shape.tgType = 'ellipse';
      } else if (mode === 'line') {
        shape = new fabric.Line([startX, startY, startX, startY], { stroke: color, strokeWidth: 2, selectable: false });
        shape.tgType = 'line';
      }

      if (shape) {
        editPdfFabric.add(shape);
        var onMove = function (me) {
          var p = editPdfFabric.getPointer(me.e);
          if (mode === 'whiteout' || mode === 'highlight' || mode === 'rectangle') {
            shape.set({ width: Math.max(1, Math.abs(p.x - startX)), height: Math.max(1, Math.abs(p.y - startY)), left: Math.min(p.x, startX), top: Math.min(p.y, startY) });
          } else if (mode === 'ellipse') {
            var rx = Math.max(1, Math.abs(p.x - startX) / 2), ry = Math.max(1, Math.abs(p.y - startY) / 2);
            shape.set({ rx: rx, ry: ry, left: Math.min(p.x, startX), top: Math.min(p.y, startY) });
          } else if (mode === 'line') {
            shape.set({ x2: p.x, y2: p.y });
          }
          editPdfFabric.renderAll();
        };
        editPdfFabric.on('mouse:move', onMove);
        editPdfFabric.once('mouse:up', function () {
          editPdfFabric.off('mouse:move', onMove);
          shape.set('selectable', true);
          editPdfFabric.setActiveObject(shape);
          editPdfFabric.renderAll();
          pushUndo();
        });
      }
    }

    function setupFabricCanvas(w, h) {
      if (editPdfFabric) {
        editPdfFabric.off('mouse:down', onFabricMouseDown);
        editPdfFabric.dispose();
        editPdfFabric = null;
      }
      var fc = new fabric.Canvas('pdf-edit-canvas', { selection: true, preserveObjectStacking: true });
      fc.setWidth(w);
      fc.setHeight(h);
      /* Fabric wraps canvas in a div (wrapperEl) with position:relative by default,
         which places it in document flow after the PDF base canvas instead of overlaying it.
         Force it to absolute so it sits on top of #pdf-base-canvas. */
      if (fc.wrapperEl) {
        fc.wrapperEl.style.position = 'absolute';
        fc.wrapperEl.style.top = '0';
        fc.wrapperEl.style.left = '0';
        fc.wrapperEl.style.zIndex = '10';
      }
      editPdfFabric = fc;
      fc.on('mouse:down', onFabricMouseDown);
      updateCursor(currentMode);
      return fc;
    }

    function renderEditPage(pageIdx) {
      if (!editPdfPdfDoc) return;
      var pageNum = pageIdx + 1;
      editPdfPdfDoc.getPage(pageNum).then(function (page) {
        var viewport = page.getViewport({ scale: editPdfRenderScale });
        var pdfCanvas = box.querySelector('#pdf-base-canvas');
        if (!pdfCanvas) return;
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        box._editPdfRenderedHeights[pageIdx] = viewport.height;

        /* Size the wrapper to match the base canvas so the Fabric overlay aligns exactly */
        var canvasWrap = box.querySelector('#ep-canvas-wrap');
        if (canvasWrap) {
          canvasWrap.style.width = viewport.width + 'px';
          canvasWrap.style.height = viewport.height + 'px';
        }
        var ctx3 = pdfCanvas.getContext('2d');
        page.render({ canvasContext: ctx3, viewport: viewport }).promise.then(function () {
          var fc = setupFabricCanvas(viewport.width, viewport.height);
          /* Restore saved canvas JSON for this page */
          if (editPdfPageObjects[pageIdx]) {
            fc.loadFromJSON(editPdfPageObjects[pageIdx], function () { fc.renderAll(); });
          }
          var lbl2 = box.querySelector('#ep-page-label');
          if (lbl2) lbl2.textContent = 'Page ' + pageNum + ' of ' + editPdfPdfDoc.numPages;
          var delPg = box.querySelector('#ep-del-page');
          if (delPg) delPg.textContent = editPdfDeleted.indexOf(pageIdx) !== -1 ? '✓ Restore page' : '🗑 Delete page';
        });
      });
    }

    function navigateEditPage(newIdx) {
      /* Persist current page annotations */
      if (editPdfFabric) {
        editPdfPageObjects[editPdfPageIdx] = editPdfFabric.toJSON(['tgType','tgData']);
      }
      editPdfPageIdx = newIdx;
      editPdfUndoHistory = []; editPdfRedoHistory = [];
      renderEditPage(newIdx);
      var cards = box.querySelectorAll('.tg-ep-thumb');
      cards.forEach(function (c, ci) { c.style.borderColor = ci === newIdx ? '#E07B39' : '#ccc'; });
    }

    function buildEditSidePanel(pdfDoc) {
      var side = box.querySelector('#ep-side');
      if (!side) return;
      side.innerHTML = '';
      window.TGPdfTools.renderAllThumbnails(file, 0.15, null).then(function (pages) {
        pages.forEach(function (p, idx) {
          var card2 = document.createElement('div');
          card2.className = 'tg-ep-thumb';
          card2.style.cssText = 'border:2px solid ' + (idx === editPdfPageIdx ? '#E07B39' : '#ccc') + ';border-radius:4px;padding:3px;margin-bottom:6px;cursor:pointer;text-align:center;opacity:' + (editPdfDeleted.indexOf(idx) !== -1 ? '0.4' : '1');
          var tc = p.canvas.cloneNode(true);
          tc.style.cssText = 'max-width:90px;height:auto;display:block;margin:0 auto';
          card2.appendChild(tc);
          var pg2 = document.createElement('span');
          pg2.style.cssText = 'font-size:10px;color:#666';
          pg2.textContent = idx + 1;
          card2.appendChild(pg2);
          card2.addEventListener('click', function () { navigateEditPage(idx); });
          side.appendChild(card2);
        });
      });
    }

    /* Load PDF.js doc */
    file.arrayBuffer().then(function (ab) {
      return pdfjsLib.getDocument({ data: ab }).promise;
    }).then(function (pdfDoc) {
      editPdfPdfDoc = pdfDoc;
      box.dataset.pageCount = pdfDoc.numPages;
      renderEditPage(0);
      buildEditSidePanel(pdfDoc);
    }).catch(function () {
      wrap.innerHTML += '<p style="color:red">Could not load PDF for editing.</p>';
    });

    /* Activate text mode by default */
    setMode('text');
  }

  /* -----------------------------------------------
     INIT — inject options for tools that need them up-front
  ----------------------------------------------- */
  if (optionsEl) {
    tgInjectOptions(handler, optionsEl);
    /* These tools show options immediately (before file select) */
    var showOptsImmediately = ['compress', 'jpg-to-pdf', 'protect-pdf', 'add-watermark', 'add-page-numbers'];
    if (showOptsImmediately.indexOf(handler) !== -1) {
      optionsEl.hidden = false;
    } else {
      optionsEl.hidden = true;
    }
  }

  /* Expose helpers */
  window.TGTool = {
    getCurrentFile:  function () { return currentFile; },
    getCurrentFiles: function () { return currentFiles.slice(); },
    isMulti:         isMulti,
    resetState:      resetState,
  };

})();

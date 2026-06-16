/* ToolsGallery — tool-runner.js
   Browser-side file tool UI shell.
   Targets .tg-tool-box[data-tool-type="browser|server"].
*/
(function () {
  'use strict';

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
    var types = accept.split(',').map(function (s) { return s.trim(); });
    return types.some(function (t) {
      if (t.charAt(0) === '.') return file.name.toLowerCase().slice(-t.length) === t.toLowerCase();
      return file.type === t;
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

  function startProgress() {
    if (fileSelected) fileSelected.hidden = true;
    if (fileListEl)   fileListEl.hidden   = true;
    if (actionBtn)    actionBtn.hidden    = true;
    if (progressEl) {
      progressEl.hidden = false;
      if (progressBar) progressBar.style.width = '0%';
    }
    /* animate to 85% */
    var startTime = Date.now();
    box._progressInterval = setInterval(function () {
      var pct = Math.min(85, ((Date.now() - startTime) / 2000) * 85);
      if (progressBar) progressBar.style.width = pct + '%';
    }, 50);
  }

  function finishProgress(isError) {
    clearInterval(box._progressInterval);
    if (progressBar) progressBar.style.width = isError ? '0%' : '100%';
    setTimeout(function () {
      if (progressEl) progressEl.hidden = true;
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
      alert('Please select a valid file. Accepted: ' + accept);
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
      alert('Skipped invalid file(s): ' + invalid.join(', ') + '\nAccepted: ' + accept);
    }
    renderFileList();
    if (uploadZone) uploadZone.hidden = currentFiles.length > 0;
    if (actionBtn)  actionBtn.disabled = currentFiles.length === 0;
  }

  function removeFileAt(index) {
    currentFiles.splice(index, 1);
    renderFileList();
    if (uploadZone) uploadZone.hidden = currentFiles.length > 0;
    if (actionBtn)  actionBtn.disabled = currentFiles.length === 0;
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

      /* ── COMPRESS ── */
      if (handler === 'compress') {
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

      /* ── PLACEHOLDER for all other handlers ── */
      var fileForHandler = isMulti ? (currentFiles[0] || null) : currentFile;
      if (!fileForHandler) return;
      if (fileSelected) fileSelected.hidden = true;
      if (fileListEl)   fileListEl.hidden   = true;
      actionBtn.hidden = true;
      if (progressEl) { progressEl.hidden = false; if (progressBar) progressBar.style.width = '0%'; }
      var startAnim = null;
      var duration  = 1500;
      function animate(ts) {
        if (!startAnim) startAnim = ts;
        var pct = Math.min(100, ((ts - startAnim) / duration) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (pct < 100) {
          requestAnimationFrame(animate);
        } else {
          if (progressEl) progressEl.hidden = true;
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
     INIT — inject options for tools that need them up-front
  ----------------------------------------------- */
  if (optionsEl) {
    tgInjectOptions(handler, optionsEl);
    /* compress & jpg-to-pdf show options immediately; others wait for file */
    if (handler === 'compress' || handler === 'jpg-to-pdf') {
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

/* ToolsGallery — tool-runner.js
   Browser-side file tool UI shell.
   Targets .tg-tool-box[data-tool-type="browser|server"].
*/
(function () {
  'use strict';

  var box = document.querySelector('.tg-tool-box[data-tool-type="browser"], .tg-tool-box[data-tool-type="server"]');
  if (!box) return;

  var uploadZone   = box.querySelector('#upload-zone');
  var fileInput    = box.querySelector('#file-input');
  var fileSelected = box.querySelector('.tg-file-selected');
  var filenameEl   = box.querySelector('.tg-filename');
  var filesizeEl   = box.querySelector('.tg-filesize');
  var removeBtn    = box.querySelector('.tg-remove-file');
  var fileListEl   = box.querySelector('.tg-file-list');
  var actionBtn    = box.querySelector('.tg-action-btn');
  var progressEl   = box.querySelector('.tg-progress');
  var progressBar  = box.querySelector('.tg-progress-bar');
  var resultEl     = box.querySelector('.tg-result');
  var successBanner = resultEl ? resultEl.querySelector('.tg-success-banner') : null;
  var errorBanner   = resultEl ? resultEl.querySelector('.tg-error-banner') : null;
  var downloadBtn  = box.querySelector('.tg-download-btn');
  var resetLink    = box.querySelector('.tg-reset');

  var accept   = box.dataset.accept || '';
  var handler  = box.dataset.handler || '';
  var isMulti  = box.dataset.multi === 'true';
  var MAX_FILES = 20;

  var currentFile      = null;
  var currentFiles     = [];
  var blobUrl          = null;
  var downloadFilename = 'toolsgallery-output.txt';

  if (accept && fileInput) {
    fileInput.setAttribute('accept', accept);
  }

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
  }

  /* -----------------------------------------------
     MULTI-FILE MODE
  ----------------------------------------------- */
  function addFiles(filesList) {
    var invalid = [];

    for (var i = 0; i < filesList.length; i++) {
      var file = filesList[i];
      if (!validateFile(file)) { invalid.push(file.name); continue; }
      if (currentFiles.length >= MAX_FILES) {
        showMaxFilesMessage();
        break;
      }
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
    if (currentFiles.length === 0) {
      fileListEl.hidden = true;
      return;
    }
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
      (function (i) {
        xBtn.addEventListener('click', function () { removeFileAt(i); });
      })(idx);

      row.appendChild(nameSpan);
      row.appendChild(sizeSpan);
      row.appendChild(xBtn);
      fileListEl.appendChild(row);
    });

    /* "+ Add more files" button */
    if (isMulti && currentFiles.length < MAX_FILES) {
      var addMoreBtn = document.createElement('button');
      addMoreBtn.type = 'button';
      addMoreBtn.className = 'tg-add-more-btn';
      addMoreBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add more files';
      addMoreBtn.addEventListener('click', function () {
        if (fileInput) fileInput.click();
      });
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
  }

  /* -----------------------------------------------
     DRAG & DROP — upload zone
  ----------------------------------------------- */
  if (uploadZone) {
    uploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      uploadZone.dataset.dragover = '';
    });
    uploadZone.addEventListener('dragleave', function (e) {
      if (!uploadZone.contains(e.relatedTarget)) delete uploadZone.dataset.dragover;
    });
    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      delete uploadZone.dataset.dragover;
      if (!e.dataTransfer.files.length) return;
      if (isMulti) { addFiles(e.dataTransfer.files); } else { selectFile(e.dataTransfer.files[0]); }
    });
    uploadZone.addEventListener('click', function (e) {
      if (fileInput && e.target !== fileInput) fileInput.click();
    });
    uploadZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (fileInput) fileInput.click(); }
    });
  }

  /* -----------------------------------------------
     DRAG & DROP — file list (multi-file add-more)
  ----------------------------------------------- */
  if (fileListEl && isMulti) {
    fileListEl.addEventListener('dragover', function (e) {
      e.preventDefault();
      fileListEl.dataset.dragover = '';
    });
    fileListEl.addEventListener('dragleave', function (e) {
      if (!fileListEl.contains(e.relatedTarget)) delete fileListEl.dataset.dragover;
    });
    fileListEl.addEventListener('drop', function (e) {
      e.preventDefault();
      delete fileListEl.dataset.dragover;
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });
  }

  /* --- File input change --- */
  if (fileInput) {
    fileInput.addEventListener('click', function (e) { e.stopPropagation(); });
    fileInput.addEventListener('change', function () {
      if (!fileInput.files.length) return;
      if (isMulti) { addFiles(fileInput.files); } else { selectFile(fileInput.files[0]); }
      fileInput.value = '';
    });
  }

  /* --- Remove file (single mode) --- */
  if (removeBtn) {
    removeBtn.addEventListener('click', function () { resetState(); });
  }

  /* -----------------------------------------------
     ACTION BUTTON
  ----------------------------------------------- */
  if (actionBtn) {
    actionBtn.addEventListener('click', function () {
      clearInlineMsg();

      /* ── REAL MERGE HANDLER ── */
      if (handler === 'merge' && isMulti) {
        if (currentFiles.length < 2) {
          showInlineMsg('Please add at least 2 PDF files to merge.');
          return;
        }
        for (var i = 0; i < currentFiles.length; i++) {
          if (!isPdfFile(currentFiles[i])) {
            showInlineMsg(currentFiles[i].name + ' is not a valid PDF file.');
            return;
          }
        }

        if (fileListEl) fileListEl.hidden = true;
        actionBtn.hidden = true;
        if (progressEl) {
          progressEl.hidden = false;
          if (progressBar) progressBar.style.width = '0%';
        }

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

      /* ── PLACEHOLDER for all other handlers ── */
      var fileForHandler = isMulti ? (currentFiles[0] || null) : currentFile;
      if (!fileForHandler) return;

      if (fileSelected) fileSelected.hidden = true;
      if (fileListEl)   fileListEl.hidden   = true;
      actionBtn.hidden = true;
      if (progressEl) {
        progressEl.hidden = false;
        if (progressBar) progressBar.style.width = '0%';
      }

      var start    = null;
      var duration = 1500;
      function animate(ts) {
        if (!start) start = ts;
        var pct = Math.min(100, ((ts - start) / duration) * 100);
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

  /* --- Reset / Process another file --- */
  if (resetLink) {
    resetLink.addEventListener('click', function (e) {
      e.preventDefault();
      resetState();
    });
  }

  /* Expose helpers for per-tool scripts */
  window.TGTool = {
    getCurrentFile:  function () { return currentFile; },
    getCurrentFiles: function () { return currentFiles.slice(); },
    isMulti:         isMulti,
    resetState:      resetState,
  };
})();

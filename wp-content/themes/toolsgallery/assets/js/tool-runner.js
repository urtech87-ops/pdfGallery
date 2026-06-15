/* ToolsGallery — tool-runner.js
   Browser-side file tool UI shell.
   Targets .tg-tool-box[data-tool-type="browser|server"].
   Real processing handlers are loaded per-tool in later phases.
*/
(function () {
  'use strict';

  var box = document.querySelector('.tg-tool-box[data-tool-type="browser"], .tg-tool-box[data-tool-type="server"]');
  if (!box) return;

  var uploadZone  = box.querySelector('#upload-zone');
  var fileInput   = box.querySelector('#file-input');
  var fileSelected = box.querySelector('.tg-file-selected');
  var filenameEl  = box.querySelector('.tg-filename');
  var filesizeEl  = box.querySelector('.tg-filesize');
  var removeBtn   = box.querySelector('.tg-remove-file');
  var fileListEl  = box.querySelector('.tg-file-list');
  var actionBtn   = box.querySelector('.tg-action-btn');
  var progressEl  = box.querySelector('.tg-progress');
  var progressBar = box.querySelector('.tg-progress-bar');
  var resultEl    = box.querySelector('.tg-result');
  var downloadBtn = box.querySelector('.tg-download-btn');
  var resetLink   = box.querySelector('.tg-reset');

  var accept   = box.dataset.accept || '';
  var isMulti  = box.dataset.multi === 'true';
  var MAX_FILES = 20;

  var currentFile  = null;   // single-file mode
  var currentFiles = [];     // multi-file mode
  var blobUrl      = null;

  if (accept && fileInput) {
    fileInput.setAttribute('accept', accept);
  }

  /* --- Helpers --- */
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
    var added   = 0;

    for (var i = 0; i < filesList.length; i++) {
      var file = filesList[i];
      if (!validateFile(file)) { invalid.push(file.name); continue; }
      if (currentFiles.length >= MAX_FILES) {
        showMaxFilesMessage();
        break;
      }
      /* Avoid duplicates by name+size */
      var dup = currentFiles.some(function (f) { return f.name === file.name && f.size === file.size; });
      if (!dup) { currentFiles.push(file); added++; }
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

      var removeBtn = document.createElement('button');
      removeBtn.className = 'tg-file-list-item__remove';
      removeBtn.setAttribute('aria-label', 'Remove ' + file.name);
      removeBtn.textContent = '×';
      removeBtn.type = 'button';
      (function (i) {
        removeBtn.addEventListener('click', function () { removeFileAt(i); });
      })(idx);

      row.appendChild(nameSpan);
      row.appendChild(sizeSpan);
      row.appendChild(removeBtn);
      fileListEl.appendChild(row);
    });

    /* "Add more" hint row */
    if (currentFiles.length < MAX_FILES) {
      var hint = document.createElement('div');
      hint.className = 'tg-file-list-add-hint';
      hint.textContent = 'Click the upload zone above to add more files';
      fileListEl.appendChild(hint);
      if (uploadZone) uploadZone.hidden = false;
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
    if (uploadZone)   uploadZone.hidden   = false;
    if (fileSelected) fileSelected.hidden = true;
    if (fileListEl)  { fileListEl.hidden = true; fileListEl.innerHTML = ''; }
    if (actionBtn)   { actionBtn.disabled = true; actionBtn.hidden = false; }
    if (progressEl)   progressEl.hidden  = true;
    if (progressBar)  progressBar.style.width = '0%';
    if (resultEl)     resultEl.hidden    = true;
    if (fileInput)    fileInput.value    = '';
    if (uploadZone)   delete uploadZone.dataset.dragover;
  }

  /* --- Drag & drop --- */
  if (uploadZone) {
    uploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      uploadZone.dataset.dragover = '';
    });

    uploadZone.addEventListener('dragleave', function (e) {
      if (!uploadZone.contains(e.relatedTarget)) {
        delete uploadZone.dataset.dragover;
      }
    });

    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      delete uploadZone.dataset.dragover;
      if (!e.dataTransfer.files.length) return;
      if (isMulti) {
        addFiles(e.dataTransfer.files);
      } else {
        selectFile(e.dataTransfer.files[0]);
      }
    });

    uploadZone.addEventListener('click', function (e) {
      if (fileInput && e.target !== fileInput) fileInput.click();
    });

    uploadZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('click', function (e) { e.stopPropagation(); });
    fileInput.addEventListener('change', function () {
      if (!fileInput.files.length) return;
      if (isMulti) {
        addFiles(fileInput.files);
      } else {
        selectFile(fileInput.files[0]);
      }
      fileInput.value = '';
    });
  }

  /* --- Remove file (single mode) --- */
  if (removeBtn) {
    removeBtn.addEventListener('click', function () { resetState(); });
  }

  /* --- Action button → animated progress → placeholder result --- */
  if (actionBtn) {
    actionBtn.addEventListener('click', function () {
      var fileForHandler = isMulti ? (currentFiles[0] || null) : currentFile;
      if (!fileForHandler) return;

      var handler = box.dataset.handler;
      if (handler && typeof window[handler] === 'function') {
        var filesArg = isMulti ? currentFiles.slice() : fileForHandler;
        window[handler](filesArg, {
          showProgress: function (pct) {
            if (progressEl)  progressEl.hidden  = false;
            if (progressBar) progressBar.style.width = pct + '%';
          },
          showSuccess: function (url, filename) {
            if (progressEl) progressEl.hidden = true;
            if (resultEl)   resultEl.hidden   = false;
            blobUrl = url;
          },
          showError: function (msg) {
            if (progressEl) progressEl.hidden = true;
            alert(msg);
          },
        });
        return;
      }

      /* Placeholder shell: animate progress then show mock download */
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
          if (resultEl)   resultEl.hidden   = false;
          var blob = new Blob(['ToolsGallery placeholder output'], { type: 'text/plain' });
          blobUrl  = URL.createObjectURL(blob);
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
      a.download = 'toolsgallery-output.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  /* --- Reset / Process another file --- */
  if (resetLink) {
    resetLink.addEventListener('click', function (e) {
      e.preventDefault();
      if (actionBtn) actionBtn.hidden = false;
      resetState();
    });
  }

  /* Expose helpers for per-tool scripts loaded in later phases */
  window.TGTool = {
    getCurrentFile:  function () { return currentFile; },
    getCurrentFiles: function () { return currentFiles.slice(); },
    isMulti:         isMulti,
    resetState:      resetState,
  };
})();

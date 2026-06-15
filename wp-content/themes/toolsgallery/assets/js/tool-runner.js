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
  var actionBtn   = box.querySelector('.tg-action-btn');
  var progressEl  = box.querySelector('.tg-progress');
  var progressBar = box.querySelector('.tg-progress-bar');
  var resultEl    = box.querySelector('.tg-result');
  var downloadBtn = box.querySelector('.tg-download-btn');
  var resetLink   = box.querySelector('.tg-reset');

  var accept      = box.dataset.accept || '';
  var currentFile = null;
  var blobUrl     = null;

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

  function resetState() {
    currentFile = null;
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    if (uploadZone)   uploadZone.hidden   = false;
    if (fileSelected) fileSelected.hidden = true;
    if (actionBtn)   { actionBtn.disabled = true; actionBtn.hidden = false; }
    if (progressEl)   progressEl.hidden  = true;
    if (progressBar)  progressBar.style.width = '0%';
    if (resultEl)     resultEl.hidden    = true;
    if (fileInput)    fileInput.value    = '';
    delete uploadZone.dataset.dragover;
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
      if (e.dataTransfer.files.length) selectFile(e.dataTransfer.files[0]);
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
      if (fileInput.files.length) {
        selectFile(fileInput.files[0]);
        fileInput.value = '';
      }
    });
  }

  /* --- Remove file --- */
  if (removeBtn) {
    removeBtn.addEventListener('click', function () { resetState(); });
  }

  /* --- Action button → animated progress → placeholder result --- */
  if (actionBtn) {
    actionBtn.addEventListener('click', function () {
      if (!currentFile) return;

      var handler = box.dataset.handler;
      if (handler && typeof window[handler] === 'function') {
        /* Real tool handler loaded by a later phase */
        window[handler](currentFile, {
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
    getCurrentFile: function () { return currentFile; },
    resetState:     resetState,
  };
})();

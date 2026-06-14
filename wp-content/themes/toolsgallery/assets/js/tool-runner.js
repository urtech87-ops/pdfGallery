/* ToolsGallery — tool-runner.js
   Handles browser-side PDF/image tool UI (file input, drag-drop, progress).
   Actual processing libraries are loaded per-tool via wp_enqueue_scripts.
*/
(function () {
  'use strict';

  /* --- Dropzone --- */
  var dropzone = document.querySelector('.tg-dropzone');
  var fileInput = document.querySelector('.tg-dropzone__input');
  var fileList  = document.querySelector('.tg-file-list');
  var files     = [];

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function renderFileList() {
    if (!fileList) return;
    fileList.innerHTML = '';
    files.forEach(function (f, idx) {
      var item = document.createElement('div');
      item.className = 'tg-file-item';
      item.innerHTML =
        '<span class="tg-file-item__icon">📄</span>' +
        '<span class="tg-file-item__name">' + escHtml(f.name) + '</span>' +
        '<span class="tg-file-item__size">' + formatBytes(f.size) + '</span>' +
        '<button class="tg-file-item__remove" aria-label="Remove file" data-idx="' + idx + '">✕</button>';
      fileList.appendChild(item);
    });

    fileList.querySelectorAll('.tg-file-item__remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-idx'), 10);
        files.splice(i, 1);
        renderFileList();
      });
    });
  }

  function addFiles(newFiles) {
    Array.from(newFiles).forEach(function (f) { files.push(f); });
    renderFileList();
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });

    dropzone.addEventListener('dragleave', function () {
      dropzone.classList.remove('is-dragover');
    });

    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      addFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function () {
      addFiles(fileInput.files);
      fileInput.value = '';
    });
  }

  /* --- Progress helpers --- */
  function showProgress(pct, label) {
    var prog = document.querySelector('.tg-progress');
    if (!prog) return;
    prog.classList.add('is-visible');
    var fill = prog.querySelector('.tg-progress__bar-fill');
    var lbl  = prog.querySelector('.tg-progress__label');
    if (fill) fill.style.width = pct + '%';
    if (lbl)  lbl.textContent  = label || pct + '%';
  }

  function hideProgress() {
    var prog = document.querySelector('.tg-progress');
    if (prog) prog.classList.remove('is-visible');
  }

  function showResult(html, isError) {
    var result = document.querySelector('.tg-tool-result');
    if (!result) return;
    result.innerHTML = html;
    result.classList.add('is-visible');
    if (isError) result.classList.add('is-error');
    else result.classList.remove('is-error');
  }

  function showSuccess(msg, downloadUrl, filename) {
    var html =
      '<div class="tg-tool-result__success">' +
        '<span class="tg-tool-result__success-icon">✅</span>' +
        '<span class="tg-tool-result__success-msg">' + escHtml(msg) + '</span>' +
      '</div>';
    if (downloadUrl) {
      html += '<div class="tg-tool-result__download">' +
        '<a class="tg-btn tg-btn--primary" href="' + escHtml(downloadUrl) + '" download="' + escHtml(filename || 'download') + '">⬇ Download</a>' +
        '<button class="tg-btn tg-btn--ghost" id="tg-restart-btn">Process another file</button>' +
      '</div>';
    }
    showResult(html, false);
  }

  function showError(msg) {
    var html =
      '<div class="tg-tool-result__error">' +
        '<span class="tg-tool-result__error-icon">❌</span>' +
        '<span class="tg-tool-result__error-msg">' + escHtml(msg) + '</span>' +
      '</div>';
    showResult(html, true);
  }

  /* --- Restart button --- */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'tg-restart-btn') {
      files = [];
      renderFileList();
      hideProgress();
      var result = document.querySelector('.tg-tool-result');
      if (result) { result.classList.remove('is-visible'); result.innerHTML = ''; }
    }
  });

  /* --- Main run button --- */
  var runBtn = document.querySelector('.tg-run-btn');
  if (runBtn) {
    runBtn.addEventListener('click', function () {
      if (files.length === 0) {
        alert('Please select at least one file.');
        return;
      }
      var handler = runBtn.getAttribute('data-handler');
      if (handler && window[handler] && typeof window[handler] === 'function') {
        window[handler](files, { showProgress: showProgress, hideProgress: hideProgress, showSuccess: showSuccess, showError: showError });
      } else {
        showError('Tool handler not found: ' + (handler || '(none)'));
      }
    });
  }

  /* --- Utility --- */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Expose helpers globally for per-tool scripts */
  window.TGTool = {
    getFiles: function () { return files; },
    showProgress: showProgress,
    hideProgress: hideProgress,
    showSuccess: showSuccess,
    showError: showError,
  };
})();

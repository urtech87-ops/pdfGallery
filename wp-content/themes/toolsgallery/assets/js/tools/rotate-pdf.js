/**
 * ============================================================
 * ToolsGallery — Rotate PDF Tool
 * ============================================================
 * Handler key: rotate-pdf
 * Tool URL: /tool/rotate-pdf/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-lib (PDFLib), pdf.js (pdfjsLib)
 * ============================================================
 */
(function () {
  'use strict';

  var rotationState    = {};
  var rotationOriginal = {};
  var thumbnailGrid    = null;

  function rotatePage(pageNum, deltaDeg) {
    rotationState[pageNum] = ((rotationState[pageNum] || 0) + deltaDeg + 360) % 360;
    if (thumbnailGrid) {
      var cell   = thumbnailGrid.querySelector('[data-page="' + pageNum + '"]');
      var canvas = cell ? cell.querySelector('canvas') : null;
      if (canvas) canvas.style.transform = 'rotate(' + rotationState[pageNum] + 'deg)';
    }
  }

  function rotationChanged() {
    for (var pg in rotationState) {
      if (rotationState[pg] !== rotationOriginal[pg]) return true;
    }
    return false;
  }

  function onFileReady(file, toolBox) {
    var existing = toolBox.querySelector('.tg-rotate-grid');
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

    var actionBtn = toolBox.querySelector('.tg-action-btn');
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

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;

    if (!rotationChanged()) {
      if (callbacks.onInlineError) callbacks.onInlineError('No changes made — please rotate at least one page.');
      return;
    }

    onProgress(30, 'Applying rotations…');
    var ab  = await files[0].arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    var pages = doc.getPages();
    for (var i = 0; i < pages.length; i++) {
      var deg = rotationState[i + 1];
      if (deg !== undefined) pages[i].setRotation(PDFLib.degrees(deg));
    }
    onProgress(90, 'Saving…');
    var bytes = await doc.save();
    onSuccess(new Blob([bytes], { type: 'application/pdf' }), 'rotated.pdf');
  }

  function getOptionsHTML() { return ''; }
  function getOptions() { return { rotationMap: rotationState }; }

  function reset(toolBox) {
    rotationState    = {};
    rotationOriginal = {};
    thumbnailGrid    = null;
    var grid = toolBox ? toolBox.querySelector('.tg-rotate-grid') : null;
    if (grid) grid.parentNode.removeChild(grid);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['rotate-pdf'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, reset: reset };
})();

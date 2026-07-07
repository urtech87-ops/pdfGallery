/* ToolsGallery — crop-pdf.js
   Handler: crop-pdf
   Phase 10 — drag crop area on a live preview, apply crop box with pdf-lib
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'crop-pdf',
    downloadName: 'cropped.pdf',
  };

  var _cropFrac = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }; // as fractions of page
  var _pagePt = { w: 0, h: 0 }; // page size in PDF points (for dimension display)
  var MIN_FRAC = 0.05; // minimum crop size as a fraction of the page

  var HANDLES = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

  function handleHTML() {
    var cursors = { nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', w: 'ew-resize', e: 'ew-resize', sw: 'nesw-resize', s: 'ns-resize', se: 'nwse-resize' };
    return HANDLES.map(function (h) {
      return '<div class="crop-handle" data-handle="' + h + '" style="position:absolute;width:12px;height:12px;background:#fff;border:2px solid #E07B39;border-radius:2px;box-sizing:border-box;cursor:' + cursors[h] + ';z-index:2;"></div>';
    }).join('');
  }

  function getOptionsHTML(pageCount) {
    return '<div id="crop-preview-wrap" style="position:relative;display:inline-block;margin-bottom:12px;overflow:hidden;">' +
      '<canvas id="crop-preview-canvas" style="border:1px solid #ccc;max-width:100%;display:block;"></canvas>' +
      '<div id="crop-overlay" style="position:absolute;border:2px solid #E07B39;box-shadow:0 0 0 9999px rgba(0,0,0,0.4);cursor:move;">' + handleHTML() + '</div>' +
    '</div>' +
    '<p id="crop-dim-label" class="tg-opt-info" style="margin-bottom:8px;">Crop area: drag the box to position it.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Presets</label>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="a4p">A4 Portrait</button>' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="a4l">A4 Landscape</button>' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="letter">Letter</button>' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="square">Square</button>' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="169">16:9</button>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Apply to</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="crop-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="crop-pages" value="current"> First page only</label>' +
        '<label><input type="radio" name="crop-pages" value="custom"> Custom</label>' +
      '</div>' +
      '<div id="crop-custom-pages-wrap" hidden style="margin-top:6px;">' +
        '<input type="text" id="crop-custom-pages" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>';
  }

  function positionHandles(overlay) {
    var w = overlay.offsetWidth, h = overlay.offsetHeight;
    var coords = {
      nw: [0, 0], n: [w / 2, 0], ne: [w, 0],
      w: [0, h / 2], e: [w, h / 2],
      sw: [0, h], s: [w / 2, h], se: [w, h],
    };
    overlay.querySelectorAll('.crop-handle').forEach(function (el) {
      var c = coords[el.dataset.handle];
      if (!c) return;
      el.style.left = (c[0] - 6) + 'px';
      el.style.top = (c[1] - 6) + 'px';
    });
  }

  function updateOverlay(optionsEl) {
    var canvas = optionsEl.querySelector('#crop-preview-canvas');
    var overlay = optionsEl.querySelector('#crop-overlay');
    var dimLabel = optionsEl.querySelector('#crop-dim-label');
    if (!canvas || !overlay) return;
    var cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    overlay.style.left = (_cropFrac.x * cw) + 'px';
    overlay.style.top = (_cropFrac.y * ch) + 'px';
    overlay.style.width = (_cropFrac.w * cw) + 'px';
    overlay.style.height = (_cropFrac.h * ch) + 'px';
    positionHandles(overlay);
    if (dimLabel) {
      var ptW = _pagePt.w ? Math.round(_cropFrac.w * _pagePt.w) : null;
      var ptH = _pagePt.h ? Math.round(_cropFrac.h * _pagePt.h) : null;
      var dims = 'Crop area: ' + Math.round(_cropFrac.w * 100) + '% × ' + Math.round(_cropFrac.h * 100) + '% of page';
      if (ptW && ptH) dims += ' (' + ptW + ' × ' + ptH + ' pt)';
      dimLabel.textContent = dims;
    }
  }

  function wireOptions(optionsEl) {
    var canvas = optionsEl.querySelector('#crop-preview-canvas');
    var overlay = optionsEl.querySelector('#crop-overlay');
    if (!canvas || !overlay || overlay.dataset.wired) return;
    overlay.dataset.wired = '1';

    var isDragging = false, dragStartX = 0, dragStartY = 0;
    var isResizing = false, activeHandle = null, startFrac = null, startMouse = null;

    /* Resize handles */
    overlay.querySelectorAll('.crop-handle').forEach(function (h) {
      h.addEventListener('mousedown', function (e) {
        isResizing = true;
        activeHandle = h.dataset.handle;
        startFrac = { x: _cropFrac.x, y: _cropFrac.y, w: _cropFrac.w, h: _cropFrac.h };
        startMouse = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopPropagation();
      });
    });

    /* Drag interior to move */
    overlay.addEventListener('mousedown', function (e) {
      if (e.target && e.target.classList.contains('crop-handle')) return;
      isDragging = true;
      dragStartX = e.clientX - overlay.offsetLeft;
      dragStartY = e.clientY - overlay.offsetTop;
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      var cw = canvas.offsetWidth, ch = canvas.offsetHeight;
      if (!cw || !ch) return;

      if (isResizing && activeHandle) {
        var dx = (e.clientX - startMouse.x) / cw;
        var dy = (e.clientY - startMouse.y) / ch;
        var left = startFrac.x, top = startFrac.y, right = startFrac.x + startFrac.w, bottom = startFrac.y + startFrac.h;

        if (activeHandle.indexOf('w') !== -1) left = Math.min(Math.max(0, startFrac.x + dx), right - MIN_FRAC);
        if (activeHandle.indexOf('e') !== -1) right = Math.max(Math.min(1, right + dx), left + MIN_FRAC);
        if (activeHandle.indexOf('n') !== -1) top = Math.min(Math.max(0, startFrac.y + dy), bottom - MIN_FRAC);
        if (activeHandle.indexOf('s') !== -1) bottom = Math.max(Math.min(1, bottom + dy), top + MIN_FRAC);

        _cropFrac.x = left;
        _cropFrac.y = top;
        _cropFrac.w = right - left;
        _cropFrac.h = bottom - top;
        updateOverlay(optionsEl);
        return;
      }

      if (isDragging) {
        var rect = canvas.getBoundingClientRect();
        var relX = e.clientX - rect.left - dragStartX;
        var relY = e.clientY - rect.top - dragStartY;
        _cropFrac.x = Math.max(0, Math.min(relX / cw, 1 - _cropFrac.w));
        _cropFrac.y = Math.max(0, Math.min(relY / ch, 1 - _cropFrac.h));
        updateOverlay(optionsEl);
      }
    });
    document.addEventListener('mouseup', function () { isDragging = false; isResizing = false; activeHandle = null; });

    optionsEl.querySelectorAll('.crop-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.dataset.preset;
        if (p === 'a4p') { _cropFrac = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 }; }
        else if (p === 'a4l') { _cropFrac = { x: 0.05, y: 0.15, w: 0.9, h: 0.7 }; }
        else if (p === 'letter') { _cropFrac = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 }; }
        else if (p === 'square') { var s = 0.9; _cropFrac = { x: 0.05, y: (1 - s) / 2, w: s, h: s }; }
        else if (p === '169') { _cropFrac = { x: 0.0, y: 0.1, w: 1.0, h: 0.8 }; }
        updateOverlay(optionsEl);
      });
    });

    optionsEl.querySelectorAll('input[name="crop-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var wrap = optionsEl.querySelector('#crop-custom-pages-wrap');
        if (wrap) wrap.hidden = r.value !== 'custom';
      });
    });

    updateOverlay(optionsEl);
  }

  function onFileReady(file, optionsEl) {
    if (!optionsEl) return;
    _cropFrac = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
    wireOptions(optionsEl);

    var canvas = optionsEl.querySelector('#crop-preview-canvas');
    if (!canvas || !window.pdfjsLib) return;

    file.arrayBuffer().then(function (ab) {
      return pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    }).then(function (pdf) {
      return pdf.getPage(1);
    }).then(function (page) {
      var vp = page.getViewport({ scale: 1.0 });
      _pagePt = { w: vp.width, h: vp.height };
      var scale = Math.min(400 / vp.width, 300 / vp.height);
      var rvp = page.getViewport({ scale: scale });
      canvas.width = rvp.width;
      canvas.height = rvp.height;
      return page.render({ canvasContext: canvas.getContext('2d'), viewport: rvp }).promise;
    }).then(function () {
      updateOverlay(optionsEl);
    }).catch(function () {});
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var pagesMode = optionsEl.querySelector('input[name="crop-pages"]:checked');
    var customPages = optionsEl.querySelector('#crop-custom-pages');
    return {
      cropFrac: { x: _cropFrac.x, y: _cropFrac.y, w: _cropFrac.w, h: _cropFrac.h },
      pagesMode: pagesMode ? pagesMode.value : 'all',
      customPagesStr: customPages ? customPages.value : '',
    };
  }

  function parsePageRange(rangeStr, total) {
    var pages = [];
    rangeStr.split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
          if (i >= 1 && i <= total) pages.push(i - 1);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n - 1);
      }
    });
    return pages;
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded.');

    onProgress && onProgress(0.1, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    var allPages = pdfDoc.getPages();
    var totalPages = allPages.length;

    var cf = options.cropFrac || { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };

    var targetIndices;
    if (options.pagesMode === 'current') {
      targetIndices = [0];
    } else if (options.pagesMode === 'custom' && options.customPagesStr) {
      targetIndices = parsePageRange(options.customPagesStr, totalPages);
    } else {
      targetIndices = allPages.map(function (_, i) { return i; });
    }
    if (!targetIndices.length) throw new Error('No valid pages selected.');

    for (var i = 0; i < targetIndices.length; i++) {
      onProgress && onProgress(0.2 + i / targetIndices.length * 0.7, 'Cropping page ' + (targetIndices[i] + 1) + '...');
      var page = allPages[targetIndices[i]];
      var size = page.getSize();
      var pdfLeft = cf.x * size.width;
      var pdfBottom = (1 - cf.y - cf.h) * size.height;
      var pdfWidth = cf.w * size.width;
      var pdfHeight = cf.h * size.height;
      page.setCropBox(pdfLeft, pdfBottom, pdfWidth, pdfHeight);
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '-cropped.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

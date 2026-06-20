/**
 * ToolsGallery — Rearrange PDF
 * Handler: rearrange-pdf
 * URL: /tool/rearrange-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'rearrange-pdf' };

  var _pageOrder = []; // current order (0-based original indices)
  var _deletedPages = new Set();
  var _totalPages = 0;

  function getOptionsHTML() {
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
      '<button type="button" class="tg-btn-secondary" id="rp2-reverse">⇄ Reverse Order</button>' +
      '<button type="button" class="tg-btn-secondary" id="rp2-select-all">☑ Select All</button>' +
      '<button type="button" class="tg-btn-secondary" id="rp2-delete-sel" style="color:var(--color-error)">🗑 Delete Selected</button>' +
    '</div>' +
    '<div id="rp2-info" style="font-size:13px;color:var(--color-gray-600);margin-bottom:8px"></div>' +
    '<div id="rp2-thumbs" style="display:flex;flex-wrap:wrap;gap:10px"></div>' +
    '<script>(function(){' +
      'document.getElementById("rp2-reverse").addEventListener("click",function(){if(window._rp2Reverse)window._rp2Reverse();});' +
      'document.getElementById("rp2-select-all").addEventListener("click",function(){if(window._rp2SelectAll)window._rp2SelectAll();});' +
      'document.getElementById("rp2-delete-sel").addEventListener("click",function(){if(window._rp2DeleteSelected)window._rp2DeleteSelected();});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    return { order: _pageOrder.filter(function (i) { return !_deletedPages.has(i); }) };
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;

    onProgress && onProgress(0.05, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdfJsDoc = await pdfjsLib.getDocument({ data: ab.slice(0) }).promise;
    _totalPages = pdfJsDoc.numPages;
    _pageOrder = Array.from({ length: _totalPages }, function (_, i) { return i; });
    _deletedPages = new Set();

    var infoEl = document.getElementById('rp2-info');
    if (infoEl) infoEl.textContent = _totalPages + ' pages. Drag to reorder.';

    var thumbsEl = document.getElementById('rp2-thumbs');
    if (thumbsEl) {
      thumbsEl.innerHTML = '';

      // Render thumbnails
      for (var pi = 1; pi <= Math.min(_totalPages, 30); pi++) {
        (function (pageNum) {
          var wrap = document.createElement('div');
          wrap.draggable = true;
          wrap.dataset.orig = pageNum - 1;
          wrap.style.cssText = 'position:relative;text-align:center;font-size:11px;width:90px;cursor:grab;user-select:none';
          wrap.className = 'rp2-thumb';

          var canvas = document.createElement('canvas');
          canvas.style.cssText = 'border:2px solid #ddd;border-radius:4px;width:80px;height:auto;display:block;margin:0 auto';

          var label = document.createElement('div');
          label.textContent = 'Page ' + pageNum;
          label.style.cssText = 'margin-top:4px;font-size:11px';

          var delBtn = document.createElement('button');
          delBtn.type = 'button'; delBtn.textContent = '🗑';
          delBtn.title = 'Delete page';
          delBtn.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(255,255,255,0.9);border:1px solid #ddd;border-radius:3px;cursor:pointer;font-size:12px;padding:1px 4px;line-height:1';
          delBtn.addEventListener('click', function () { window._rp2ToggleDelete(pageNum - 1, wrap, canvas); });

          var selCheck = document.createElement('input');
          selCheck.type = 'checkbox';
          selCheck.style.cssText = 'position:absolute;top:4px;left:4px';
          selCheck.dataset.orig = pageNum - 1;

          wrap.appendChild(canvas); wrap.appendChild(label); wrap.appendChild(delBtn); wrap.appendChild(selCheck);
          thumbsEl.appendChild(wrap);

          pdfJsDoc.getPage(pageNum).then(function (page) {
            var vp = page.getViewport({ scale: 0.3 });
            canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height);
            page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
          });

          // Drag events
          wrap.addEventListener('dragstart', function (e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', wrap.dataset.orig);
            wrap.style.opacity = '0.5';
          });
          wrap.addEventListener('dragend', function () { wrap.style.opacity = '1'; });
          wrap.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
          wrap.addEventListener('drop', function (e) {
            e.preventDefault();
            var fromOrig = parseInt(e.dataTransfer.getData('text/plain'));
            var toOrig = parseInt(wrap.dataset.orig);
            var fromIdx = _pageOrder.indexOf(fromOrig);
            var toIdx = _pageOrder.indexOf(toOrig);
            if (fromIdx !== -1 && toIdx !== -1) {
              _pageOrder.splice(fromIdx, 1);
              _pageOrder.splice(toIdx, 0, fromOrig);
              // Reorder DOM
              var thumbs = Array.from(thumbsEl.children);
              var fromEl = thumbs.find(function (t) { return parseInt(t.dataset.orig) === fromOrig; });
              var toEl = thumbs.find(function (t) { return parseInt(t.dataset.orig) === toOrig; });
              if (fromEl && toEl) thumbsEl.insertBefore(fromEl, toEl);
            }
          });
        })(pi);
      }
    }

    window._rp2ToggleDelete = function (origIdx, wrap, canvas) {
      if (_deletedPages.has(origIdx)) {
        _deletedPages.delete(origIdx);
        canvas.style.opacity = '1';
        wrap.style.background = '';
      } else {
        _deletedPages.add(origIdx);
        canvas.style.opacity = '0.3';
        wrap.style.background = '#fee2e2';
      }
    };

    window._rp2Reverse = function () { _pageOrder.reverse(); renderThumbOrder(); };
    window._rp2SelectAll = function () {
      thumbsEl.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.checked = true; });
    };
    window._rp2DeleteSelected = function () {
      thumbsEl.querySelectorAll('input[type=checkbox]:checked').forEach(function (cb) {
        var orig = parseInt(cb.dataset.orig);
        _deletedPages.add(orig);
        var wrap = cb.closest('.rp2-thumb');
        if (wrap) { wrap.querySelector('canvas').style.opacity = '0.3'; wrap.style.background = '#fee2e2'; }
      });
    };

    function renderThumbOrder() {
      if (!thumbsEl) return;
      _pageOrder.forEach(function (origIdx) {
        var thumb = thumbsEl.querySelector('[data-orig="' + origIdx + '"]');
        if (thumb) thumbsEl.appendChild(thumb);
      });
    }

    onProgress && onProgress(0.4, 'Thumbnails ready. Rearrange and click Save.');

    // Save: build new PDF in current order excluding deleted pages
    var finalOrder = _pageOrder.filter(function (i) { return !_deletedPages.has(i); });
    if (!finalOrder.length) throw new Error('No pages remaining after deletion.');

    onProgress && onProgress(0.7, 'Building reordered PDF...');
    var pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
    var newDoc = await PDFDocument.create();
    var copied = await newDoc.copyPages(pdfDoc, finalOrder);
    copied.forEach(function (pg) { newDoc.addPage(pg); });

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await newDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-rearranged.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

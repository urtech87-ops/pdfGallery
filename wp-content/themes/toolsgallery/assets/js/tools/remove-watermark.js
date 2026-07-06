/* ToolsGallery — remove-watermark.js
   Handler: remove-watermark
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'remove-watermark',
    downloadName: 'cleaned.pdf',
  };

  function getOptionsHTML(pageCount) {
    return '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;">' +
      '<strong>Note:</strong> Watermark removal covers visual watermarks with white rectangles. Complex image watermarks embedded in the page may not be fully removable.' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Method</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="wm-method" value="auto" checked> Auto-detect (finds repeated text)</label>' +
        '<label><input type="radio" name="wm-method" value="manual"> Manual (draw rectangles over watermark)</label>' +
      '</div>' +
    '</div>' +
    '<div id="wm-auto-opts">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="wm-text">Watermark text (leave blank to auto-detect)</label>' +
        '<input type="text" id="wm-text" class="tg-text-input" placeholder="e.g. CONFIDENTIAL, DRAFT...">' +
      '</div>' +
    '</div>' +
    '<div id="wm-manual-opts" hidden>' +
      '<p class="tg-opt-info">Draw rectangles on the PDF page preview below to mark watermark areas.</p>' +
      '<canvas id="wm-draw-canvas" style="border:1px solid #ccc;max-width:100%;cursor:crosshair;display:block;margin-bottom:8px;"></canvas>' +
      '<button type="button" id="wm-clear-rects" class="tg-btn-secondary">Clear All Rectangles</button>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Apply to</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="wm-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="wm-pages" value="custom"> Custom pages</label>' +
      '</div>' +
      '<div id="wm-custom-pages-wrap" hidden style="margin-top:6px;">' +
        '<input type="text" id="wm-custom-pages" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>';
  }

  var _rects = [];        // [{x, y, w, h}] as fractions of the page
  var _pageSnapshot = null;

  function redrawCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (_pageSnapshot) ctx.drawImage(_pageSnapshot, 0, 0);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    _rects.forEach(function (r) {
      ctx.strokeRect(r.x * canvas.width, r.y * canvas.height, r.w * canvas.width, r.h * canvas.height);
    });
  }

  function wireOptions(optionsEl) {
    var dc = optionsEl.querySelector('#wm-draw-canvas');
    if (!dc || dc.dataset.wired) return;
    dc.dataset.wired = '1';

    optionsEl.querySelectorAll('input[name="wm-method"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var autoOpts = optionsEl.querySelector('#wm-auto-opts');
        var manualOpts = optionsEl.querySelector('#wm-manual-opts');
        if (autoOpts) autoOpts.hidden = r.value !== 'auto';
        if (manualOpts) manualOpts.hidden = r.value !== 'manual';
      });
    });

    optionsEl.querySelectorAll('input[name="wm-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var wrap = optionsEl.querySelector('#wm-custom-pages-wrap');
        if (wrap) wrap.hidden = r.value !== 'custom';
      });
    });

    var drawing = false, startX = 0, startY = 0;

    function canvasPos(e) {
      var r = dc.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (dc.width / r.width),
        y: (e.clientY - r.top) * (dc.height / r.height),
      };
    }

    dc.addEventListener('mousedown', function (e) {
      drawing = true;
      var p = canvasPos(e);
      startX = p.x; startY = p.y;
    });
    document.addEventListener('mouseup', function (e) {
      if (!drawing) return;
      drawing = false;
      var p = canvasPos(e);
      var rect = {
        x: Math.min(startX, p.x) / dc.width,
        y: Math.min(startY, p.y) / dc.height,
        w: Math.abs(p.x - startX) / dc.width,
        h: Math.abs(p.y - startY) / dc.height,
      };
      if (rect.w * dc.width < 3 || rect.h * dc.height < 3) return;
      _rects.push(rect);
      redrawCanvas(dc);
    });

    var clearBtn = optionsEl.querySelector('#wm-clear-rects');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      _rects = [];
      redrawCanvas(dc);
    });
  }

  function onFileReady(file, optionsEl) {
    if (!optionsEl) return;
    _rects = [];
    _pageSnapshot = null;
    wireOptions(optionsEl);

    var dc = optionsEl.querySelector('#wm-draw-canvas');
    if (!dc || !window.pdfjsLib) return;

    file.arrayBuffer().then(function (ab) {
      return pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    }).then(function (pdf) {
      return pdf.getPage(1);
    }).then(function (page) {
      var vp = page.getViewport({ scale: 1.0 });
      var scale = Math.min(500 / vp.width, 400 / vp.height);
      var rvp = page.getViewport({ scale: scale });
      dc.width = rvp.width;
      dc.height = rvp.height;
      return page.render({ canvasContext: dc.getContext('2d'), viewport: rvp }).promise;
    }).then(function () {
      _pageSnapshot = document.createElement('canvas');
      _pageSnapshot.width = dc.width;
      _pageSnapshot.height = dc.height;
      _pageSnapshot.getContext('2d').drawImage(dc, 0, 0);
    }).catch(function () {});
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var method = optionsEl.querySelector('input[name="wm-method"]:checked');
    var wmText = optionsEl.querySelector('#wm-text');
    var pages = optionsEl.querySelector('input[name="wm-pages"]:checked');
    var customPages = optionsEl.querySelector('#wm-custom-pages');
    return {
      method: method ? method.value : 'auto',
      wmText: wmText ? wmText.value.trim() : '',
      pagesMode: pages ? pages.value : 'all',
      customPagesStr: customPages ? customPages.value : '',
      manualRects: _rects.slice(),
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
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded.');

    onProgress && onProgress(0.1, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    var allPages = pdfDoc.getPages();
    var totalPages = allPages.length;

    var targetIndices;
    if (options.pagesMode === 'custom' && options.customPagesStr) {
      targetIndices = parsePageRange(options.customPagesStr, totalPages);
    } else {
      targetIndices = allPages.map(function (_, i) { return i; });
    }

    if (options.method === 'auto') {
      // Detect watermarks via PDF.js text content
      onProgress && onProgress(0.2, 'Detecting watermarks...');
      var pdf4detect = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      var textCounts = {};

      for (var p = 0; p < Math.min(totalPages, 5); p++) {
        var page = await pdf4detect.getPage(p + 1);
        var tc = await page.getTextContent();
        tc.items.forEach(function (item) {
          var s = item.str.trim();
          if (s) textCounts[s] = (textCounts[s] || 0) + 1;
        });
      }

      // Find repeated strings (appear on multiple pages)
      var watermarkTexts = [];
      if (options.wmText) {
        watermarkTexts.push(options.wmText.toLowerCase());
      } else {
        Object.keys(textCounts).forEach(function (t) {
          if (textCounts[t] >= Math.min(3, totalPages) && t.length > 2) {
            watermarkTexts.push(t.toLowerCase());
          }
        });
      }

      if (!watermarkTexts.length) {
        // Cover center area as fallback
        for (var i = 0; i < targetIndices.length; i++) {
          var pg = allPages[targetIndices[i]];
          var sz = pg.getSize();
          pg.drawRectangle({ x: sz.width * 0.2, y: sz.height * 0.35, width: sz.width * 0.6, height: sz.height * 0.3, color: PDFLib.rgb(1, 1, 1), opacity: 0.9 });
        }
      } else {
        for (var i = 0; i < targetIndices.length; i++) {
          onProgress && onProgress(0.3 + i / targetIndices.length * 0.6, 'Processing page ' + (targetIndices[i] + 1) + '...');
          var page4 = await pdf4detect.getPage(targetIndices[i] + 1);
          var tc4 = await page4.getTextContent();
          var pg4 = allPages[targetIndices[i]];
          var sz4 = pg4.getSize();

          tc4.items.forEach(function (item) {
            if (!item.str.trim()) return;
            var txt = item.str.trim().toLowerCase();
            var isWm = watermarkTexts.some(function (wmt) { return txt.includes(wmt) || wmt.includes(txt); });
            if (isWm) {
              var x = item.transform[4];
              var y = item.transform[5];
              var w = Math.max(item.width || 100, 80);
              var h = Math.max(item.height || 20, 20);
              pg4.drawRectangle({ x: x - 5, y: y - 5, width: w + 10, height: h + 10, color: PDFLib.rgb(1, 1, 1) });
            }
          });
        }
      }
    } else {
      // Manual rectangles
      var rects = options.manualRects || [];
      if (!rects.length) throw new Error('Please draw at least one rectangle over the watermark area first.');
      for (var i = 0; i < targetIndices.length; i++) {
        onProgress && onProgress(0.2 + i / targetIndices.length * 0.7, 'Applying to page ' + (targetIndices[i] + 1) + '...');
        var pg = allPages[targetIndices[i]];
        var sz = pg.getSize();
        rects.forEach(function (rect) {
          pg.drawRectangle({
            x: rect.x * sz.width,
            y: (1 - rect.y - rect.h) * sz.height,
            width: rect.w * sz.width,
            height: rect.h * sz.height,
            color: PDFLib.rgb(1, 1, 1),
          });
        });
      }
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '-clean.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

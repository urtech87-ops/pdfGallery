/* ToolsGallery — redact-pdf.js
   Handler: redact-pdf
   Phase 10 — draw boxes on a live preview, apply with pdf-lib
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'redact-pdf',
    downloadName: 'redacted.pdf',
  };

  var _boxes = [];        // [{xFrac, yFrac, wFrac, hFrac}]
  var _pageSnapshot = null; // offscreen canvas of the rendered page

  function getOptionsHTML(pageCount) {
    return '<div style="background:#ffebee;border:1px solid #ef9a9a;border-radius:6px;padding:10px;margin-bottom:12px;">' +
      '<strong>Warning:</strong> Redaction permanently blacks out selected areas. This cannot be undone. Always keep a copy of the original.' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Method</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="redact-method" value="manual" checked> Manual (draw boxes)</label>' +
        '<label><input type="radio" name="redact-method" value="text"> Auto (search text)</label>' +
      '</div>' +
    '</div>' +
    '<div id="redact-manual-opts">' +
      '<p class="tg-opt-info">Draw black redaction boxes on the PDF preview below. Boxes will be applied to the target pages.</p>' +
      '<canvas id="redact-canvas" style="border:1px solid #ccc;max-width:100%;cursor:crosshair;display:block;"></canvas>' +
      '<div style="display:flex;gap:8px;margin-top:6px;">' +
        '<button type="button" id="redact-clear" class="tg-btn-secondary">Clear All Boxes</button>' +
      '</div>' +
    '</div>' +
    '<div id="redact-text-opts" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="redact-search-text">Text to redact</label>' +
        '<input type="text" id="redact-search-text" class="tg-text-input" placeholder="e.g. John Smith, 123-45-6789...">' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Apply boxes to pages</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="redact-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="redact-pages" value="current"> Shown page only</label>' +
        '<label><input type="radio" name="redact-pages" value="custom"> Custom</label>' +
      '</div>' +
      '<div id="redact-custom-pages-wrap" hidden style="margin-top:6px;">' +
        '<input type="text" id="redact-custom-pages" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>';
  }

  function redrawCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (_pageSnapshot) ctx.drawImage(_pageSnapshot, 0, 0);
    ctx.fillStyle = '#000000';
    _boxes.forEach(function (b) {
      ctx.fillRect(b.xFrac * canvas.width, b.yFrac * canvas.height, b.wFrac * canvas.width, b.hFrac * canvas.height);
    });
  }

  function wireOptions(optionsEl) {
    var canvas = optionsEl.querySelector('#redact-canvas');
    if (!canvas || canvas.dataset.wired) return;
    canvas.dataset.wired = '1';

    optionsEl.querySelectorAll('input[name="redact-method"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var manual = optionsEl.querySelector('#redact-manual-opts');
        var text = optionsEl.querySelector('#redact-text-opts');
        if (manual) manual.hidden = r.value !== 'manual';
        if (text) text.hidden = r.value !== 'text';
      });
    });

    optionsEl.querySelectorAll('input[name="redact-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = optionsEl.querySelector('#redact-custom-pages-wrap');
        if (w) w.hidden = r.value !== 'custom';
      });
    });

    var drawing = false, sx = 0, sy = 0;

    function canvasPos(e) {
      var r = canvas.getBoundingClientRect();
      var cl = e.touches ? e.touches[0] : e;
      return {
        x: (cl.clientX - r.left) * (canvas.width / r.width),
        y: (cl.clientY - r.top) * (canvas.height / r.height),
      };
    }

    canvas.addEventListener('mousedown', function (e) {
      drawing = true;
      var p = canvasPos(e);
      sx = p.x; sy = p.y;
    });

    canvas.addEventListener('mousemove', function (e) {
      if (!drawing) return;
      var p = canvasPos(e);
      redrawCanvas(canvas);
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(Math.min(sx, p.x), Math.min(sy, p.y), Math.abs(p.x - sx), Math.abs(p.y - sy));
    });

    document.addEventListener('mouseup', function (e) {
      if (!drawing) return;
      drawing = false;
      var p = canvasPos(e);
      var box = {
        x: Math.min(sx, p.x),
        y: Math.min(sy, p.y),
        w: Math.abs(p.x - sx),
        h: Math.abs(p.y - sy),
      };
      if (box.w < 3 || box.h < 3) { redrawCanvas(canvas); return; }
      _boxes.push({
        xFrac: box.x / canvas.width,
        yFrac: box.y / canvas.height,
        wFrac: box.w / canvas.width,
        hFrac: box.h / canvas.height,
      });
      redrawCanvas(canvas);
    });

    var clearBtn = optionsEl.querySelector('#redact-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        _boxes = [];
        redrawCanvas(canvas);
      });
    }
  }

  function onFileReady(file, optionsEl) {
    if (!optionsEl) return;
    _boxes = [];
    _pageSnapshot = null;
    wireOptions(optionsEl);

    var canvas = optionsEl.querySelector('#redact-canvas');
    if (!canvas || !window.pdfjsLib) return;

    file.arrayBuffer().then(function (ab) {
      return pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    }).then(function (pdf) {
      return pdf.getPage(1);
    }).then(function (page) {
      var vp = page.getViewport({ scale: 1.0 });
      var scale = Math.min(500 / vp.width, 400 / vp.height);
      var rvp = page.getViewport({ scale: scale });
      canvas.width = rvp.width;
      canvas.height = rvp.height;
      return page.render({ canvasContext: canvas.getContext('2d'), viewport: rvp }).promise;
    }).then(function () {
      _pageSnapshot = document.createElement('canvas');
      _pageSnapshot.width = canvas.width;
      _pageSnapshot.height = canvas.height;
      _pageSnapshot.getContext('2d').drawImage(canvas, 0, 0);
    }).catch(function () {});
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var method = optionsEl.querySelector('input[name="redact-method"]:checked');
    var searchText = optionsEl.querySelector('#redact-search-text');
    var pages = optionsEl.querySelector('input[name="redact-pages"]:checked');
    var customPages = optionsEl.querySelector('#redact-custom-pages');
    return {
      method: method ? method.value : 'manual',
      searchText: searchText ? searchText.value.trim() : '',
      pagesMode: pages ? pages.value : 'all',
      customPagesStr: customPages ? customPages.value : '',
      manualBoxes: _boxes.slice(),
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

    onProgress && onProgress(0.05, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    var allPages = pdfDoc.getPages();
    var totalPages = allPages.length;

    var targetIndices;
    if (options.pagesMode === 'current') {
      targetIndices = [0];
    } else if (options.pagesMode === 'custom' && options.customPagesStr) {
      targetIndices = parsePageRange(options.customPagesStr, totalPages);
    } else {
      targetIndices = allPages.map(function (_, i) { return i; });
    }
    if (!targetIndices.length) throw new Error('No valid pages selected.');

    if (options.method === 'manual') {
      var boxes = options.manualBoxes || [];
      if (!boxes.length) throw new Error('Please draw at least one redaction box on the PDF preview before processing.');

      for (var i = 0; i < targetIndices.length; i++) {
        onProgress && onProgress(0.2 + i / targetIndices.length * 0.7, 'Redacting page ' + (targetIndices[i] + 1) + '...');
        var pg = allPages[targetIndices[i]];
        var sz = pg.getSize();
        boxes.forEach(function (box) {
          pg.drawRectangle({
            x: box.xFrac * sz.width,
            y: (1 - box.yFrac - box.hFrac) * sz.height,
            width: box.wFrac * sz.width,
            height: box.hFrac * sz.height,
            color: PDFLib.rgb(0, 0, 0),
          });
        });
      }
    } else {
      // Text search redaction
      if (!options.searchText) throw new Error('Please enter the text you want to redact.');
      var pdf4search = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      var searchLower = options.searchText.toLowerCase();

      for (var j = 0; j < targetIndices.length; j++) {
        onProgress && onProgress(0.2 + j / targetIndices.length * 0.7, 'Searching page ' + (targetIndices[j] + 1) + '...');
        var page4 = await pdf4search.getPage(targetIndices[j] + 1);
        var tc = await page4.getTextContent();
        var pg2 = allPages[targetIndices[j]];

        tc.items.forEach(function (item) {
          if (!item.str || !item.str.toLowerCase().includes(searchLower)) return;
          var x = item.transform[4];
          var y = item.transform[5];
          var w = Math.max(item.width || 60, 60);
          var h = Math.max(item.height || 14, 14);
          pg2.drawRectangle({
            x: x - 2,
            y: y - 2,
            width: w + 4,
            height: h + 4,
            color: PDFLib.rgb(0, 0, 0),
          });
        });
      }
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '-redacted.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

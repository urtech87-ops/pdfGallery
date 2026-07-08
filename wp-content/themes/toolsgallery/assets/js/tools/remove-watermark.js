/* ToolsGallery — remove-watermark.js
   Handler: remove-watermark
   Interactive watermark removal editor:
   - multi-page preview with Prev/Next navigation
   - drag on the overlay canvas to select watermark areas (per page)
   - selection list with per-item remove
   - Auto-Detect finds rotated/diagonal text and text repeated on most pages
   - selected areas are covered with the sampled background color
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'remove-watermark',
    downloadName: 'cleaned.pdf',
  };

  var state = {
    pdfJsDoc: null,
    currentPage: 1,
    totalPages: 0,
    selections: [],   /* [{page, x, y, w, h}] as fractions of the page */
    bgColors: {},     /* per-selection sampled colors keyed by index */
    isDrawing: false,
    startX: 0,
    startY: 0,
  };

  function getOptionsHTML(pageCount) {
    return '<div class="tg-info-box" style="margin-bottom:12px;">' +
      '<strong>How to remove a watermark:</strong> drag a rectangle over the watermark on the page preview below, ' +
      'or click <strong>Auto-Detect</strong> to find diagonal/repeated watermark text. ' +
      'Selected areas are covered with the surrounding background color.' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
      '<button type="button" id="wm-auto-detect" class="tg-btn-sm tg-btn-outline">&#128269; Auto-Detect Watermark</button>' +
      '<button type="button" id="wm-clear-all" class="tg-btn-sm tg-btn-outline">&#128465;&#65039; Clear All</button>' +
      '<span style="margin-left:auto;font-size:13px;color:#6b7280;"><span id="wm-sel-count">0</span> area(s) selected</span>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:14px;">' +
      '<button type="button" id="wm-prev" class="tg-btn-sm tg-btn-outline">&#8592; Prev</button>' +
      '<span>Page <strong id="wm-cur-page">1</strong> of <strong id="wm-total-pages">1</strong></span>' +
      '<button type="button" id="wm-next" class="tg-btn-sm tg-btn-outline">Next &#8594;</button>' +
      '<span style="font-size:12px;color:#9ca3af;">Drag on the page to select an area</span>' +
    '</div>' +
    '<div id="wm-canvas-wrap" style="position:relative;display:inline-block;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;cursor:crosshair;max-width:100%;">' +
      '<canvas id="wm-canvas" style="display:block;max-width:100%;"></canvas>' +
      '<canvas id="wm-overlay" style="position:absolute;top:0;left:0;max-width:100%;touch-action:none;"></canvas>' +
    '</div>' +
    '<div id="wm-sel-list" style="margin-top:12px;"></div>' +
    '<div class="tg-opt-section" style="margin-top:12px;">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Apply my selections to</label>' +
        '<div class="tg-radio-group">' +
          '<label class="tg-radio-label"><input type="radio" name="wm-apply" value="own" checked> <span>The page they were drawn on</span></label>' +
          '<label class="tg-radio-label"><input type="radio" name="wm-apply" value="all"> <span>Every page (same spots)</span></label>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ── preview rendering ── */

  function els(optionsEl) {
    return {
      canvas:  optionsEl.querySelector('#wm-canvas'),
      overlay: optionsEl.querySelector('#wm-overlay'),
      cur:     optionsEl.querySelector('#wm-cur-page'),
      total:   optionsEl.querySelector('#wm-total-pages'),
      count:   optionsEl.querySelector('#wm-sel-count'),
      list:    optionsEl.querySelector('#wm-sel-list'),
    };
  }

  async function renderPage(optionsEl, pageNum) {
    if (!state.pdfJsDoc) return;
    var e = els(optionsEl);
    if (!e.canvas || !e.overlay) return;

    var page = await state.pdfJsDoc.getPage(pageNum);
    var vp1 = page.getViewport({ scale: 1.0 });
    var scale = Math.min(560 / vp1.width, 720 / vp1.height, 1.5);
    var vp = page.getViewport({ scale: scale });

    e.canvas.width = vp.width;
    e.canvas.height = vp.height;
    e.overlay.width = vp.width;
    e.overlay.height = vp.height;

    await page.render({ canvasContext: e.canvas.getContext('2d'), viewport: vp }).promise;

    if (e.cur) e.cur.textContent = pageNum;
    drawSelections(optionsEl);
  }

  function drawSelections(optionsEl) {
    var e = els(optionsEl);
    if (!e.overlay) return;
    var ctx = e.overlay.getContext('2d');
    ctx.clearRect(0, 0, e.overlay.width, e.overlay.height);
    var n = 0;
    state.selections.forEach(function (s, idx) {
      if (s.page !== state.currentPage) return;
      n++;
      var x = s.x * e.overlay.width;
      var y = s.y * e.overlay.height;
      var w = s.w * e.overlay.width;
      var h = s.h * e.overlay.height;
      ctx.fillStyle = 'rgba(239,68,68,0.25)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('#' + (idx + 1), x + 4, y + 14);
    });
  }

  function updateSelectionList(optionsEl) {
    var e = els(optionsEl);
    if (e.count) e.count.textContent = state.selections.length;
    if (!e.list) return;
    if (!state.selections.length) { e.list.innerHTML = ''; return; }
    e.list.innerHTML =
      '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">Selected Areas (' + state.selections.length + '):</div>' +
      state.selections.map(function (s, i) {
        return '<div class="wm-sel-item" data-idx="' + i + '" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;margin-bottom:6px;font-size:13px;color:#991b1b;">' +
          '<span>Area ' + (i + 1) + ' — Page ' + s.page + ' (' + Math.round(s.w * 100) + '% × ' + Math.round(s.h * 100) + '% of page)</span>' +
          '<button type="button" class="wm-sel-remove" data-idx="' + i + '" style="background:#ef4444;color:#fff;border:none;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:12px;">Remove</button>' +
        '</div>';
      }).join('');
    e.list.querySelectorAll('.wm-sel-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.idx, 10);
        state.selections.splice(idx, 1);
        updateSelectionList(optionsEl);
        drawSelections(optionsEl);
      });
    });
  }

  /* ── drawing on the overlay ── */

  function overlayPos(overlay, clientX, clientY) {
    var r = overlay.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min((clientX - r.left) * (overlay.width / r.width), overlay.width)),
      y: Math.max(0, Math.min((clientY - r.top) * (overlay.height / r.height), overlay.height)),
    };
  }

  function drawRubberBand(optionsEl, x, y) {
    var e = els(optionsEl);
    drawSelections(optionsEl);
    var ctx = e.overlay.getContext('2d');
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(state.startX, state.startY, x - state.startX, y - state.startY);
    ctx.fillStyle = 'rgba(239,68,68,0.15)';
    ctx.fillRect(state.startX, state.startY, x - state.startX, y - state.startY);
    ctx.setLineDash([]);
  }

  function commitSelection(optionsEl, x, y) {
    var e = els(optionsEl);
    var w = x - state.startX;
    var h = y - state.startY;
    if (Math.abs(w) > 5 && Math.abs(h) > 5) {
      state.selections.push({
        page: state.currentPage,
        x: Math.min(state.startX, x) / e.overlay.width,
        y: Math.min(state.startY, y) / e.overlay.height,
        w: Math.abs(w) / e.overlay.width,
        h: Math.abs(h) / e.overlay.height,
      });
      updateSelectionList(optionsEl);
    }
    drawSelections(optionsEl);
  }

  function wireOptions(optionsEl) {
    var overlay = optionsEl.querySelector('#wm-overlay');
    if (!overlay || overlay.dataset.wired) return;
    overlay.dataset.wired = '1';

    overlay.addEventListener('mousedown', function (e) {
      var p = overlayPos(overlay, e.clientX, e.clientY);
      state.isDrawing = true;
      state.startX = p.x;
      state.startY = p.y;
    });
    overlay.addEventListener('mousemove', function (e) {
      if (!state.isDrawing) return;
      var p = overlayPos(overlay, e.clientX, e.clientY);
      drawRubberBand(optionsEl, p.x, p.y);
    });
    document.addEventListener('mouseup', function (e) {
      if (!state.isDrawing) return;
      state.isDrawing = false;
      var p = overlayPos(overlay, e.clientX, e.clientY);
      commitSelection(optionsEl, p.x, p.y);
    });

    /* Touch support */
    overlay.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var p = overlayPos(overlay, t.clientX, t.clientY);
      state.isDrawing = true;
      state.startX = p.x;
      state.startY = p.y;
    }, { passive: false });
    overlay.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (!state.isDrawing) return;
      var t = e.touches[0];
      var p = overlayPos(overlay, t.clientX, t.clientY);
      drawRubberBand(optionsEl, p.x, p.y);
    }, { passive: false });
    overlay.addEventListener('touchend', function (e) {
      e.preventDefault();
      if (!state.isDrawing) return;
      state.isDrawing = false;
      var t = e.changedTouches[0];
      var p = overlayPos(overlay, t.clientX, t.clientY);
      commitSelection(optionsEl, p.x, p.y);
    }, { passive: false });

    var prev = optionsEl.querySelector('#wm-prev');
    if (prev) prev.addEventListener('click', function () {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderPage(optionsEl, state.currentPage);
      }
    });
    var next = optionsEl.querySelector('#wm-next');
    if (next) next.addEventListener('click', function () {
      if (state.currentPage < state.totalPages) {
        state.currentPage++;
        renderPage(optionsEl, state.currentPage);
      }
    });
    var clearAll = optionsEl.querySelector('#wm-clear-all');
    if (clearAll) clearAll.addEventListener('click', function () {
      state.selections = [];
      updateSelectionList(optionsEl);
      drawSelections(optionsEl);
    });
    var auto = optionsEl.querySelector('#wm-auto-detect');
    if (auto) auto.addEventListener('click', function () {
      auto.disabled = true;
      auto.textContent = 'Detecting…';
      autoDetect(optionsEl).catch(function () {}).then(function () {
        auto.disabled = false;
        auto.textContent = '🔍 Auto-Detect Watermark';
      });
    });
  }

  /* ── auto-detect: rotated text + text repeated on most pages ── */

  async function autoDetect(optionsEl) {
    if (!state.pdfJsDoc) return;
    var total = state.totalPages;
    var scanPages = Math.min(total, 15);

    /* Pass 1: count distinct-page occurrences of each string */
    var pageOccurrence = {};
    var pageContents = [];
    for (var p = 1; p <= scanPages; p++) {
      var page = await state.pdfJsDoc.getPage(p);
      var tc = await page.getTextContent();
      var vp = page.getViewport({ scale: 1.0 });
      pageContents.push({ page: p, items: tc.items, vp: vp });
      var seen = {};
      tc.items.forEach(function (item) {
        var s = (item.str || '').trim().toLowerCase();
        if (s.length < 3 || s.length > 40 || /^\d+$/.test(s)) return;
        if (seen[s]) return;
        seen[s] = 1;
        pageOccurrence[s] = (pageOccurrence[s] || 0) + 1;
      });
    }
    var threshold = Math.max(2, Math.ceil(scanPages * 0.6));
    var repeated = {};
    Object.keys(pageOccurrence).forEach(function (t) {
      if (pageOccurrence[t] >= threshold) repeated[t] = 1;
    });

    /* Pass 2: mark rotated text and repeated text as selections */
    var found = 0;
    pageContents.forEach(function (pc) {
      pc.items.forEach(function (item) {
        var s = (item.str || '').trim();
        if (!s) return;
        var angle = Math.atan2(item.transform[1], item.transform[0]);
        var isRotated = Math.abs(angle) > 0.1;
        var isRepeated = scanPages > 1 && repeated[s.toLowerCase()];
        if (!isRotated && !isRepeated) return;

        var h = item.height || 20;
        var w = item.width || 100;
        /* PDF y-origin is bottom-left; selections use top-left fractions */
        var xFrac = Math.max(0, (item.transform[4] - 5) / pc.vp.width);
        var yFrac = Math.max(0, (pc.vp.height - item.transform[5] - h - 5) / pc.vp.height);
        var wFrac = Math.min(1 - xFrac, (w + 10) / pc.vp.width);
        var hFrac = Math.min(1 - yFrac, (h + 10) / pc.vp.height);

        /* Skip near-duplicates */
        var dup = state.selections.some(function (sel) {
          return sel.page === pc.page &&
            Math.abs(sel.x - xFrac) < 0.01 && Math.abs(sel.y - yFrac) < 0.01;
        });
        if (dup) return;

        state.selections.push({ page: pc.page, x: xFrac, y: yFrac, w: wFrac, h: hFrac });
        found++;
      });
    });

    if (!found) {
      alert('No obvious watermarks detected (no rotated or repeated text found). Please drag rectangles over the watermark areas manually.');
    } else {
      updateSelectionList(optionsEl);
      drawSelections(optionsEl);
    }
  }

  /* ── framework hooks ── */

  function onFileReady(file, optionsEl) {
    if (!optionsEl || !window.pdfjsLib) return;
    state.selections = [];
    state.currentPage = 1;
    wireOptions(optionsEl);

    file.arrayBuffer().then(function (ab) {
      return pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    }).then(function (pdf) {
      state.pdfJsDoc = pdf;
      state.totalPages = pdf.numPages;
      var e = els(optionsEl);
      if (e.total) e.total.textContent = pdf.numPages;
      updateSelectionList(optionsEl);
      return renderPage(optionsEl, 1);
    }).catch(function () {});
  }

  function getOptions(optionsEl) {
    var apply = optionsEl ? optionsEl.querySelector('input[name="wm-apply"]:checked') : null;
    return {
      selections: state.selections.slice(),
      applyMode: apply ? apply.value : 'own',
    };
  }

  /* Sample the background color around a selection from the rendered
     canvas (only possible for the currently displayed page). */
  function sampleBackgroundColor(canvas, sel) {
    if (!canvas || !canvas.width) return { r: 1, g: 1, b: 1 };
    try {
      var ctx = canvas.getContext('2d');
      var x0 = sel.x * canvas.width;
      var y0 = sel.y * canvas.height;
      var w = sel.w * canvas.width;
      var yEdge = Math.max(0, Math.round(y0 - 5));
      var samples = [];
      for (var x = Math.round(x0); x < x0 + w && x < canvas.width; x += 5) {
        var px = ctx.getImageData(x, yEdge, 1, 1).data;
        samples.push([px[0], px[1], px[2]]);
      }
      if (!samples.length) return { r: 1, g: 1, b: 1 };
      var avg = samples.reduce(function (acc, c) {
        return [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]];
      }, [0, 0, 0]).map(function (v) { return v / samples.length / 255; });
      return { r: avg[0], g: avg[1], b: avg[2] };
    } catch (e) {
      return { r: 1, g: 1, b: 1 };
    }
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded. Please refresh the page.');

    var selections = options.selections || [];
    if (!selections.length) {
      throw new Error('Please select at least one watermark area first: drag a rectangle over the watermark on the preview, or use Auto-Detect.');
    }

    onProgress && onProgress(0.1, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    var allPages = pdfDoc.getPages();
    var totalPages = allPages.length;

    /* Expand selections to all pages when requested */
    var work = [];
    if (options.applyMode === 'all') {
      var uniqueRects = [];
      selections.forEach(function (s) {
        var dup = uniqueRects.some(function (u) {
          return Math.abs(u.x - s.x) < 0.005 && Math.abs(u.y - s.y) < 0.005 &&
                 Math.abs(u.w - s.w) < 0.005 && Math.abs(u.h - s.h) < 0.005;
        });
        if (!dup) uniqueRects.push(s);
      });
      for (var p = 1; p <= totalPages; p++) {
        uniqueRects.forEach(function (r) {
          work.push({ page: p, x: r.x, y: r.y, w: r.w, h: r.h, origPage: r.page });
        });
      }
    } else {
      work = selections.map(function (s) { return { page: s.page, x: s.x, y: s.y, w: s.w, h: s.h, origPage: s.page }; });
    }

    var previewCanvas = document.querySelector('#wm-canvas');

    for (var i = 0; i < work.length; i++) {
      onProgress && onProgress(0.15 + (i / work.length) * 0.7, 'Covering area ' + (i + 1) + ' of ' + work.length + '...');
      var sel = work[i];
      if (sel.page < 1 || sel.page > totalPages) continue;
      var pg = allPages[sel.page - 1];
      var sz = pg.getSize();

      /* Sample the bg color from the visible preview when it shows this
         selection's source page; default to white otherwise. */
      var bg = { r: 1, g: 1, b: 1 };
      if (previewCanvas && sel.origPage === state.currentPage) {
        bg = sampleBackgroundColor(previewCanvas, sel);
      }

      var x = sel.x * sz.width - 2;
      var y = (1 - sel.y - sel.h) * sz.height - 2;
      var w = sel.w * sz.width + 4;
      var h = sel.h * sz.height + 4;

      pg.drawRectangle({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.min(sz.width - Math.max(0, x), w),
        height: Math.min(sz.height - Math.max(0, y), h),
        color: PDFLib.rgb(bg.r, bg.g, bg.b),
        opacity: 1,
      });
    }

    onProgress && onProgress(0.92, 'Saving PDF...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress && onProgress(1.0, 'Watermark removed!');
    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '-no-watermark.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, wireOptions: wireOptions, CONFIG: CONFIG };
})();

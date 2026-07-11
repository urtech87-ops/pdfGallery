/**
 * ToolsGallery — Edit PDF (Sejda-style in-place text editing)
 * Handler: edit-pdf
 * URL: /tool/edit-pdf/
 *
 * Layers per page (bottom → top):
 *   1. #ep-base-canvas   — PDF.js render of the original page
 *   2. Fabric.js canvas  — user-ADDED objects (text, whiteout, shapes, draw)
 *   3. #ep-text-layer    — contenteditable overlays covering each EXISTING
 *                          text item; invisible until the user edits one
 *
 * Export never rasterizes the page: the original vector content is kept,
 * changed text items are covered with a background-sampled rectangle and
 * redrawn with a matched standard font, and user-added Fabric objects are
 * composited as a transparent PNG overlay.
 */
(function () {
  'use strict';

  var CONFIG = { handler: 'edit-pdf', downloadName: 'edited.pdf' };

  var RENDER_SCALE = 1.5;

  /* ── Editor state ── */
  var _file = null;
  var _pdfjsDoc = null;
  var _currentPage = 1;
  var _totalPages = 0;
  var _mode = 'edit';
  var _fabricCanvas = null;
  var _baseCanvas = null;
  var _optionsEl = null;
  var _keysWired = false;
  /* Per page-number: { textItems, fabricJSON, cssW, cssH, built } */
  var _pages = {};

  var HINTS = {
    edit: '✎ Click any text on the page to edit it in place. Changed text is saved with a matching font.',
    addtext: 'T Click anywhere on the page to add new text.',
    whiteout: '⬜ Click to place a white box that hides content underneath.',
    shape: '▭ Click to place a rectangle. Drag its handles to resize.',
    draw: '✏ Draw freely on the page with the pen.',
  };

  /* -----------------------------------------------
     OPTIONS UI (no inline <script> — wired in wireOptions)
  ----------------------------------------------- */
  function getOptionsHTML() {
    return '<style>' +
      '.ep-text-item{position:absolute;color:transparent;caret-color:#111;white-space:pre;' +
        'line-height:1.15;padding:0 1px;outline:none;z-index:3;transform-origin:0 0;}' +
      '.ep-text-item:hover{outline:1px dashed #E07B39;cursor:text;}' +
      '.ep-text-item:focus{outline:2px solid #E07B39;}' +
      '.ep-text-item--live{color:inherit;}' +
      '.ep-mode-btn--active{background:#E07B39 !important;color:#fff !important;}' +
      '#ep-text-layer{position:absolute;top:0;left:0;right:0;bottom:0;z-index:3;}' +
      '#ep-stage-inner .canvas-container{position:absolute !important;top:0;left:0;z-index:2;}' +
    '</style>' +
    '<div id="ep-editor" hidden>' +
      '<div id="ep-toolbar" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px;padding:8px;background:#f5f5f5;border-radius:6px;">' +
        '<button type="button" class="tg-btn-sm tg-btn-outline ep-mode-btn ep-mode-btn--active" data-epmode="edit">✎ Edit Text</button>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline ep-mode-btn" data-epmode="addtext">T Add Text</button>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline ep-mode-btn" data-epmode="whiteout">⬜ Whiteout</button>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline ep-mode-btn" data-epmode="shape">▭ Shape</button>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline ep-mode-btn" data-epmode="draw">✏ Draw</button>' +
        '<span style="width:1px;height:22px;background:#ccc;"></span>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline" id="ep-prev">◀ Prev</button>' +
        '<span id="ep-page-info" style="font-size:13px;padding:0 4px;">Page 1 / 1</span>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline" id="ep-next">Next ▶</button>' +
      '</div>' +
      '<div id="ep-hint" style="background:#E07B39;color:#fff;padding:7px 12px;font-size:13px;border-radius:4px;margin-bottom:8px;">' +
        HINTS.edit +
      '</div>' +
      '<div id="ep-stage" style="overflow:auto;border:1px solid #ddd;border-radius:8px;background:#888;max-height:640px;">' +
        '<div id="ep-stage-inner" style="position:relative;display:inline-block;">' +
          '<canvas id="ep-base-canvas" style="display:block;"></canvas>' +
          '<canvas id="ep-fabric-canvas"></canvas>' +
          '<div id="ep-text-layer"></div>' +
        '</div>' +
      '</div>' +
      '<p class="tg-opt-info" style="margin-top:6px;font-size:12px;">' +
        'Edited text uses the closest standard font (serif / sans / mono, bold / italic) at the original size. ' +
        'Text on plain backgrounds edits cleanly; on photos or gradients the patch color is sampled and may be slightly visible.' +
      '</p>' +
    '</div>';
  }

  function wireOptions(optionsEl) {
    if (!optionsEl || optionsEl.dataset.epWired) return;
    optionsEl.dataset.epWired = '1';
    _optionsEl = optionsEl;

    optionsEl.querySelectorAll('.ep-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.dataset.epmode);
      });
    });
    var prev = optionsEl.querySelector('#ep-prev');
    var next = optionsEl.querySelector('#ep-next');
    if (prev) prev.addEventListener('click', function () { goPage(-1); });
    if (next) next.addEventListener('click', function () { goPage(1); });
  }

  function setMode(mode) {
    _mode = mode;
    if (_optionsEl) {
      _optionsEl.querySelectorAll('.ep-mode-btn').forEach(function (btn) {
        btn.classList.toggle('ep-mode-btn--active', btn.dataset.epmode === mode);
      });
      var hint = _optionsEl.querySelector('#ep-hint');
      if (hint) hint.textContent = HINTS[mode] || '';
      var textLayer = _optionsEl.querySelector('#ep-text-layer');
      if (textLayer) textLayer.style.pointerEvents = (mode === 'edit') ? 'auto' : 'none';
    }
    if (_fabricCanvas) {
      _fabricCanvas.isDrawingMode = (mode === 'draw');
      if (mode === 'draw' && _fabricCanvas.freeDrawingBrush) {
        _fabricCanvas.freeDrawingBrush.color = '#d32f2f';
        _fabricCanvas.freeDrawingBrush.width = 3;
      }
      if (_fabricCanvas.wrapperEl) {
        _fabricCanvas.wrapperEl.style.pointerEvents = (mode === 'edit') ? 'none' : 'auto';
      }
      if (mode === 'edit') _fabricCanvas.discardActiveObject().renderAll();
    }
  }

  /* -----------------------------------------------
     FONT MATCHING — PDF font → one of the 14 StandardFonts
     TODO: optional embedded-font extraction for byte-exact
     reuse (usually blocked by PDF font subsetting).
  ----------------------------------------------- */
  function detectFont(page, item, styles) {
    var style = styles && styles[item.fontName] ? styles[item.fontName] : null;
    var rawName = '';
    var boldFlag = false, italicFlag = false;
    try {
      var fontObj = page.commonObjs.get(item.fontName);
      if (fontObj) {
        rawName = String(fontObj.name || '');
        boldFlag = !!fontObj.bold;
        italicFlag = !!fontObj.italic;
      }
    } catch (e) { /* font object not resolved — fall back to CSS family */ }

    var cssFamily = style ? String(style.fontFamily || '') : '';
    var probe = (rawName + ' ' + cssFamily).toLowerCase();

    var mono = /courier|mono/.test(probe);
    var serif = !mono && (/times|georgia|garamond|book|palatino|cambria|minion/.test(probe) ||
      (/serif/.test(probe) && !/sans-serif|sansserif/.test(probe)));
    var bold = boldFlag || /bold|black|heavy|semibold|demibold/.test(probe);
    var italic = italicFlag || /italic|oblique/.test(probe);

    var family = mono ? 'mono' : (serif ? 'serif' : 'sans');
    var key;
    if (family === 'serif') {
      key = 'TimesRoman' + (bold && italic ? 'BoldItalic' : bold ? 'Bold' : italic ? 'Italic' : '');
    } else {
      key = (family === 'mono' ? 'Courier' : 'Helvetica') +
        (bold && italic ? 'BoldOblique' : bold ? 'Bold' : italic ? 'Oblique' : '');
    }
    var cssStack = family === 'mono' ? '"Courier New", Courier, monospace'
      : family === 'serif' ? '"Times New Roman", Times, serif'
      : 'Helvetica, Arial, sans-serif';

    return {
      standardFontKey: key,
      cssStack: cssStack,
      bold: bold,
      italic: italic,
      ascent: style && style.ascent ? Math.abs(style.ascent) : 0.8,
      descent: style && style.descent ? Math.abs(style.descent) : 0.25,
    };
  }

  /* -----------------------------------------------
     BACKGROUND / TEXT COLOR SAMPLING (from rendered page)
  ----------------------------------------------- */
  function clampPx(v, max) { return Math.max(0, Math.min(Math.round(v), max - 1)); }

  function readPx(data, w, x, y) {
    var i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  }

  function sampleColors(cssLeft, cssTop, cssW, cssH) {
    var out = { bg: [255, 255, 255], fg: [0, 0, 0] };
    if (!_baseCanvas) return out;
    try {
      var ctx = _baseCanvas.getContext('2d');
      var cw = _baseCanvas.width, ch = _baseCanvas.height;
      var MARGIN = 4;
      var rx = clampPx(cssLeft - MARGIN, cw);
      var ry = clampPx(cssTop - MARGIN, ch);
      var rw = Math.max(1, Math.min(Math.round(cssW + MARGIN * 2), cw - rx));
      var rh = Math.max(1, Math.min(Math.round(cssH + MARGIN * 2), ch - ry));
      var img = ctx.getImageData(rx, ry, rw, rh).data;

      /* Background: average of points just outside the text box */
      var pts = [
        [0, rh / 2], [rw - 1, rh / 2], [rw / 2, 0], [rw / 2, rh - 1],
      ];
      var r = 0, g = 0, b = 0;
      pts.forEach(function (p) {
        var px = readPx(img, rw, clampPx(p[0], rw), clampPx(p[1], rh));
        r += px[0]; g += px[1]; b += px[2];
      });
      out.bg = [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)];

      /* Text color: pixel inside the box most different from the background */
      var best = 0;
      for (var y = MARGIN + 1; y < rh - MARGIN - 1; y += 2) {
        for (var x = MARGIN + 1; x < rw - MARGIN - 1; x += 2) {
          var px2 = readPx(img, rw, x, y);
          var d = Math.abs(px2[0] - out.bg[0]) + Math.abs(px2[1] - out.bg[1]) + Math.abs(px2[2] - out.bg[2]);
          if (d > best) { best = d; out.fg = px2; }
        }
      }
      if (best < 60) out.fg = [0, 0, 0]; /* no clear glyph pixel found */
    } catch (e) { /* tainted canvas or zero-size — keep defaults */ }
    return out;
  }

  /* -----------------------------------------------
     TEXT LAYER — editable overlays for existing text
  ----------------------------------------------- */
  function buildTextItems(page, textContent, viewport) {
    var items = [];
    textContent.items.forEach(function (item) {
      if (!item.str || !item.str.trim()) return;
      var tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      var angle = Math.atan2(tx[1], tx[0]);
      /* Rotated/vertical text is left as-is (not editable in place) */
      if (Math.abs(angle) > 0.02) return;

      var font = detectFont(page, item, textContent.styles);
      var cssFontSize = Math.hypot(tx[2], tx[3]);
      if (cssFontSize < 1) return;
      var cssTop = tx[5] - cssFontSize * font.ascent;
      var cssLeft = tx[4];
      var cssW = item.width * viewport.scale;
      var cssH = cssFontSize * (font.ascent + font.descent);

      items.push({
        str: item.str,
        newStr: item.str,
        changed: false,
        /* PDF user space (origin bottom-left); pdfX/pdfY = baseline start */
        pdfX: item.transform[4],
        pdfY: item.transform[5],
        pdfSize: Math.hypot(item.transform[0], item.transform[1]) || Math.abs(item.transform[3]) || 12,
        pdfWidth: item.width,
        font: font,
        cssLeft: cssLeft,
        cssTop: cssTop,
        cssW: cssW,
        cssH: Math.max(cssH, cssFontSize),
        cssFontSize: cssFontSize,
        colors: null, /* sampled lazily on first edit */
      });
    });
    return items;
  }

  function applyLiveStyle(el, rec) {
    if (!rec.colors) {
      rec.colors = sampleColors(rec.cssLeft, rec.cssTop, rec.cssW, rec.cssH);
    }
    el.classList.add('ep-text-item--live');
    el.style.background = 'rgb(' + rec.colors.bg.join(',') + ')';
    el.style.color = 'rgb(' + rec.colors.fg.join(',') + ')';
  }

  function clearLiveStyle(el) {
    el.classList.remove('ep-text-item--live');
    el.style.background = 'transparent';
    el.style.color = 'transparent';
  }

  function renderTextLayer(pageState) {
    var layer = _optionsEl.querySelector('#ep-text-layer');
    if (!layer) return;
    layer.innerHTML = '';
    pageState.textItems.forEach(function (rec) {
      var el = document.createElement('div');
      el.className = 'ep-text-item';
      el.contentEditable = 'true';
      el.spellcheck = false;
      el.textContent = rec.newStr;
      el.style.left = rec.cssLeft + 'px';
      el.style.top = rec.cssTop + 'px';
      el.style.minWidth = rec.cssW + 'px';
      el.style.minHeight = rec.cssH + 'px';
      el.style.fontSize = rec.cssFontSize + 'px';
      el.style.fontFamily = rec.font.cssStack;
      el.style.fontWeight = rec.font.bold ? '700' : '400';
      el.style.fontStyle = rec.font.italic ? 'italic' : 'normal';
      if (rec.changed) applyLiveStyle(el, rec);

      el.addEventListener('focus', function () { applyLiveStyle(el, rec); });
      el.addEventListener('blur', function () {
        if (!rec.changed) clearLiveStyle(el);
      });
      el.addEventListener('keydown', function (e) {
        /* Existing PDF text items are single-line */
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });
      el.addEventListener('input', function () {
        rec.newStr = (el.textContent || '').replace(/[\r\n]+/g, ' ');
        rec.changed = rec.newStr !== rec.str;
      });

      layer.appendChild(el);
    });
    layer.style.pointerEvents = (_mode === 'edit') ? 'auto' : 'none';
  }

  /* -----------------------------------------------
     FABRIC LAYER — user-added objects
  ----------------------------------------------- */
  function initFabric() {
    if (_fabricCanvas) { try { _fabricCanvas.dispose(); } catch (e) {} _fabricCanvas = null; }
    _fabricCanvas = new fabric.Canvas('ep-fabric-canvas', { selection: true });
    _fabricCanvas.on('mouse:down', function (opt) {
      if (opt.target || _mode === 'edit' || _mode === 'draw') return;
      var ptr = _fabricCanvas.getPointer(opt.e);
      var obj = null;
      if (_mode === 'addtext') {
        obj = new fabric.IText('New text', {
          left: ptr.x, top: ptr.y, fontSize: 16,
          fontFamily: 'Helvetica, Arial, sans-serif', fill: '#111111',
        });
      } else if (_mode === 'whiteout') {
        obj = new fabric.Rect({ left: ptr.x, top: ptr.y, width: 120, height: 32, fill: '#ffffff' });
      } else if (_mode === 'shape') {
        obj = new fabric.Rect({
          left: ptr.x, top: ptr.y, width: 120, height: 70,
          fill: 'transparent', stroke: '#1d4ed8', strokeWidth: 2,
        });
      }
      if (obj) {
        _fabricCanvas.add(obj);
        _fabricCanvas.setActiveObject(obj);
        if (obj.enterEditing) { obj.enterEditing(); obj.selectAll(); }
        _fabricCanvas.renderAll();
      }
    });

    if (!_keysWired) {
      _keysWired = true;
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        if (!_fabricCanvas) return;
        var ae = document.activeElement;
        if (ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
        var active = _fabricCanvas.getActiveObject();
        if (active && !(active.isEditing)) {
          _fabricCanvas.remove(active);
          _fabricCanvas.discardActiveObject();
          _fabricCanvas.renderAll();
        }
      });
    }
  }

  /* -----------------------------------------------
     PAGE RENDERING & NAVIGATION
  ----------------------------------------------- */
  function snapshotCurrentPage() {
    if (_fabricCanvas && _pages[_currentPage]) {
      _pages[_currentPage].fabricJSON = _fabricCanvas.toJSON();
    }
  }

  async function renderPage(num) {
    var page = await _pdfjsDoc.getPage(num);
    var vp = page.getViewport({ scale: RENDER_SCALE });
    var cssW = Math.round(vp.width);
    var cssH = Math.round(vp.height);

    _baseCanvas = _optionsEl.querySelector('#ep-base-canvas');
    _baseCanvas.width = cssW;
    _baseCanvas.height = cssH;
    var ctx = _baseCanvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cssW, cssH);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;

    _fabricCanvas.setWidth(cssW);
    _fabricCanvas.setHeight(cssH);
    if (_fabricCanvas.wrapperEl) {
      _fabricCanvas.wrapperEl.style.position = 'absolute';
      _fabricCanvas.wrapperEl.style.top = '0';
      _fabricCanvas.wrapperEl.style.left = '0';
    }

    if (!_pages[num]) {
      /* Text extraction after render so fonts are resolved in commonObjs */
      var tc = await page.getTextContent();
      _pages[num] = {
        textItems: buildTextItems(page, tc, vp),
        fabricJSON: null,
        cssW: cssW,
        cssH: cssH,
      };
    }

    renderTextLayer(_pages[num]);

    _fabricCanvas.clear();
    if (_pages[num].fabricJSON) {
      await new Promise(function (res) {
        _fabricCanvas.loadFromJSON(_pages[num].fabricJSON, function () {
          _fabricCanvas.renderAll();
          res();
        });
      });
    }

    var info = _optionsEl.querySelector('#ep-page-info');
    if (info) info.textContent = 'Page ' + num + ' / ' + _totalPages;
    setMode(_mode);
  }

  function goPage(dir) {
    var target = Math.max(1, Math.min(_totalPages, _currentPage + dir));
    if (target === _currentPage) return;
    snapshotCurrentPage();
    _currentPage = target;
    renderPage(target).catch(function (e) {
      var hint = _optionsEl && _optionsEl.querySelector('#ep-hint');
      if (hint) hint.textContent = 'Could not render page: ' + (e && e.message ? e.message : 'unknown error');
    });
  }

  /* -----------------------------------------------
     EDITOR SETUP (file selected) — run() only exports
  ----------------------------------------------- */
  function onFileReady(file, optionsEl) {
    wireOptions(optionsEl);
    _optionsEl = optionsEl;

    var box = optionsEl.closest ? optionsEl.closest('.tg-tool-box') : null;
    var actionBtn = box ? box.querySelector('.tg-action-btn') : null;
    if (actionBtn) actionBtn.textContent = 'Save & Download PDF';

    initEditor(file).catch(function (e) {
      var hint = optionsEl.querySelector('#ep-hint');
      if (hint) hint.textContent = 'Could not open PDF: ' + (e && e.message ? e.message : 'unknown error');
    });
  }

  async function initEditor(file) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded. Please refresh the page.');
    if (!window.fabric) throw new Error('Fabric.js not loaded. Please refresh the page.');

    _file = file;
    _pages = {};
    _currentPage = 1;
    _mode = 'edit';

    var ab = await file.arrayBuffer();
    _pdfjsDoc = await pdfjsLib.getDocument({ data: ab }).promise;
    _totalPages = _pdfjsDoc.numPages;

    var editor = _optionsEl.querySelector('#ep-editor');
    if (editor) editor.hidden = false;

    initFabric();
    await renderPage(1);
  }

  function getOptions() { return {}; }

  /* -----------------------------------------------
     EXPORT — cover + redraw changed text, overlay added objects
  ----------------------------------------------- */
  function hasFabricObjects(json) {
    return !!(json && json.objects && json.objects.length);
  }

  async function fabricOverlayPng(pageState) {
    var tmp = document.createElement('canvas');
    tmp.width = pageState.cssW;
    tmp.height = pageState.cssH;
    var sc = new fabric.StaticCanvas(tmp);
    sc.setWidth(pageState.cssW);
    sc.setHeight(pageState.cssH);
    await new Promise(function (res) {
      sc.loadFromJSON(pageState.fabricJSON, function () {
        sc.renderAll();
        res();
      });
    });
    var dataUrl = sc.toDataURL({ format: 'png' });
    try { sc.dispose(); } catch (e) {}
    return Uint8Array.from(atob(dataUrl.split(',')[1]), function (c) { return c.charCodeAt(0); });
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded. Please refresh the page.');
    if (!_pdfjsDoc || !_file) {
      throw new Error('The editor is still loading. Wait for the page preview to appear, then save again.');
    }

    snapshotCurrentPage();

    onProgress && onProgress(0.05, 'Preparing PDF...');
    var PDFDocument = window.PDFLib.PDFDocument;
    var StandardFonts = window.PDFLib.StandardFonts;
    var rgb = window.PDFLib.rgb;

    var srcBytes = await _file.arrayBuffer();
    var outDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
    var pdfPages = outDoc.getPages();

    var fontCache = {};
    async function getFont(key) {
      if (!fontCache[key]) {
        fontCache[key] = await outDoc.embedFont(StandardFonts[key] || StandardFonts.Helvetica);
      }
      return fontCache[key];
    }

    var pageNums = Object.keys(_pages).map(Number).sort(function (a, b) { return a - b; });
    for (var i = 0; i < pageNums.length; i++) {
      var num = pageNums[i];
      if (num < 1 || num > pdfPages.length) continue;
      var st = _pages[num];
      var changed = st.textItems.filter(function (r) { return r.changed && r.newStr !== r.str; });
      var hasOverlay = hasFabricObjects(st.fabricJSON);
      if (!changed.length && !hasOverlay) continue;

      onProgress && onProgress(0.1 + (i / pageNums.length) * 0.8, 'Saving page ' + num + '...');
      var pdfPage = pdfPages[num - 1];

      /* 1) In-place text edits: cover the original run, redraw the new text.
         Coordinates come from the PDF text transform, which is already in
         pdf-lib's bottom-left origin — pdfY is the text baseline. */
      for (var c = 0; c < changed.length; c++) {
        var rec = changed[c];
        var font = await getFont(rec.font.standardFontKey);
        var size = rec.pdfSize;
        var text = rec.newStr;
        var newWidth = 0;
        try {
          newWidth = font.widthOfTextAtSize(text, size);
        } catch (e) {
          /* Characters outside WinAnsi can't be encoded by standard fonts */
          text = text.replace(/[^\x00-\xff‘’“”–—•€]/g, '?');
          newWidth = font.widthOfTextAtSize(text, size);
        }

        var ascent = rec.font.ascent;
        var descent = rec.font.descent;
        var coverW = Math.max(rec.pdfWidth, newWidth) + 2;
        var bg = (rec.colors && rec.colors.bg) || [255, 255, 255];
        pdfPage.drawRectangle({
          x: rec.pdfX - 1,
          y: rec.pdfY - size * descent - 0.5,
          width: coverW,
          height: size * (ascent + descent) + 1,
          color: rgb(bg[0] / 255, bg[1] / 255, bg[2] / 255),
        });

        var fg = (rec.colors && rec.colors.fg) || [0, 0, 0];
        pdfPage.drawText(text, {
          x: rec.pdfX,
          y: rec.pdfY,
          size: size,
          font: font,
          color: rgb(fg[0] / 255, fg[1] / 255, fg[2] / 255),
        });
      }

      /* 2) User-added objects: composite only the Fabric layer as a
         transparent PNG — the original page content stays vector. */
      if (hasOverlay) {
        var pngBytes = await fabricOverlayPng(st);
        var embedded = await outDoc.embedPng(pngBytes);
        pdfPage.drawImage(embedded, {
          x: 0, y: 0,
          width: pdfPage.getWidth(),
          height: pdfPage.getHeight(),
        });
      }
    }

    onProgress && onProgress(0.95, 'Finalizing PDF...');
    var outBytes = await outDoc.save();
    var blob = new Blob([outBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return {
      blob: blob,
      filename: (file && file.name ? file.name : 'document.pdf').replace(/\.pdf$/i, '') + '-edited.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = {
    run: run,
    getOptionsHTML: getOptionsHTML,
    getOptions: getOptions,
    onFileReady: onFileReady,
    wireOptions: wireOptions,
    CONFIG: CONFIG,
  };
})();

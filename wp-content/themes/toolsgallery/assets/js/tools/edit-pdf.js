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
  /* Page number whose items are currently mounted in #ep-text-layer. */
  var _textLayerPage = null;
  /* Timestamp of the last touch-driven focus, so a stray compatibility
     click that slips through cannot re-focus and fight it. */
  var _lastTouchFocus = 0;

  /* Touch devices take a different in-place editing path (see MOBILE
     ACTIVE-EDIT SESSION below). Everything guarded by IS_TOUCH is additive:
     when it is false the desktop code runs exactly as it did before. */
  var IS_TOUCH = (function () {
    try { return ('ontouchstart' in window) || navigator.maxTouchPoints > 0; } catch (e) { return false; }
  }());
  /* The mobile editing session, or null: { el, rec, idx, page, at, ... } */
  var _activeEdit = null;
  var _doneBar = null;
  var _mobileGuardsWired = false;
  /* Bumped by every touchstart anywhere in the document. A blur with no new
     touch behind it did not come from the user (see mobileBlurGuard). */
  var _touchSeq = 0;

  /* -----------------------------------------------
     DEBUG HARNESS  —  off unless the page URL carries ?epdebug=1
     Logs the full focus/pointer/render timeline to the console and to an
     on-screen panel, so the sequence can be read on a real phone (the panel)
     or over chrome://inspect (the console).
  ----------------------------------------------- */
  var EPDEBUG = (function () {
    try {
      var m = /[?&]epdebug(?:=([^&]*))?(?:&|$)/.exec(window.location.search);
      return !!m && m[1] !== '0';
    } catch (e) { return false; }
  }());
  var _epT0 = (window.performance && performance.now) ? performance.now() : Date.now();
  var _epPanel = null;
  var _epGlobalsWired = false;
  var _epLastScrollLog = 0;

  function epNow() {
    var t = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
    return Math.round(t - _epT0);
  }

  function epDesc(node) {
    if (!node) return 'null';
    if (node === document) return 'document';
    if (node === window) return 'window';
    if (node === document.body) return 'body';
    var n = node.nodeName ? String(node.nodeName).toLowerCase() : String(node);
    if (node.id) n += '#' + node.id;
    else if (node.className && typeof node.className === 'string' && node.className.trim()) {
      n += '.' + node.className.trim().split(/\s+/).join('.');
    }
    if (node.classList && node.classList.contains('ep-text-item')) {
      var idx = node.parentNode ? Array.prototype.indexOf.call(node.parentNode.children, node) : -1;
      n += '[#' + idx + ' "' + String(node.textContent || '').slice(0, 16) + '"]';
    }
    return n;
  }

  function epMakePanel() {
    if (_epPanel || !document.body) return _epPanel;
    var wrap = document.createElement('div');
    wrap.id = 'ep-debug-panel';
    wrap.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
      'background:rgba(0,0,0,.87);color:#7CFC7C;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;' +
      'border-top:2px solid #E07B39;';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;align-items:center;padding:4px 8px;background:#E07B39;color:#fff;font-weight:700;';
    bar.appendChild(document.createTextNode('epdebug'));
    var spacer = document.createElement('span');
    spacer.style.cssText = 'flex:1;';
    bar.appendChild(spacer);
    ['clear', 'hide'].forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'font:inherit;padding:2px 8px;border:0;border-radius:3px;background:#fff;color:#333;';
      /* Buttons steal the tap on purpose; the log body must not. */
      b.addEventListener('click', function () {
        if (label === 'clear') { log.textContent = ''; } else { wrap.style.display = 'none'; }
      });
      bar.appendChild(b);
    });
    var log = document.createElement('div');
    log.style.cssText = 'max-height:34vh;overflow:auto;padding:6px 8px;white-space:pre-wrap;' +
      '-webkit-overflow-scrolling:touch;overscroll-behavior:contain;';
    wrap.appendChild(bar);
    wrap.appendChild(log);
    document.body.appendChild(wrap);
    _epPanel = log;
    return _epPanel;
  }

  function epLog(msg, extra) {
    if (!EPDEBUG) return;
    var line = '+' + epNow() + 'ms  ' + msg + (extra ? '   ' + extra : '');
    try { console.log('[epdebug] ' + line); } catch (e) {}
    var panel = epMakePanel();
    if (!panel) return;
    var atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 6;
    panel.appendChild(document.createTextNode(line + '\n'));
    while (panel.childNodes.length > 500) panel.removeChild(panel.firstChild);
    if (atBottom) panel.scrollTop = panel.scrollHeight;
  }

  /* Document-level timeline: focusin/focusout answer the key question —
     after 'focus' fires on a text item, what takes the focus away? */
  function epWireGlobals() {
    if (!EPDEBUG || _epGlobalsWired) return;
    _epGlobalsWired = true;
    epLog('epdebug ON — tap a text line, then read the order below.');
    epLog('viewport', 'inner=' + window.innerWidth + 'x' + window.innerHeight);
    epLog('env', 'IS_TOUCH=' + IS_TOUCH + ' (' + (IS_TOUCH ? 'mobile edit path' : 'desktop edit path') +
      ') maxTouchPoints=' + (navigator.maxTouchPoints || 0));

    document.addEventListener('focusin', function (e) {
      epLog('DOC focusin ', 'target=' + epDesc(e.target));
    }, true);
    document.addEventListener('focusout', function (e) {
      epLog('DOC focusout', 'target=' + epDesc(e.target) + ' relatedTarget=' + epDesc(e.relatedTarget));
      setTimeout(function () {
        epLog('   ...settled', 'activeElement=' + epDesc(document.activeElement));
      }, 0);
    }, true);
    document.addEventListener('selectionchange', function () {
      var sel = window.getSelection();
      var anchor = sel && sel.anchorNode ? sel.anchorNode : null;
      var host = anchor && anchor.nodeType === 3 ? anchor.parentNode : anchor;
      epLog('selectionchange', 'anchorHost=' + epDesc(host) + ' collapsed=' + (sel ? sel.isCollapsed : '?'));
    });

    window.addEventListener('resize', function () {
      epLog('WINDOW resize', 'inner=' + window.innerWidth + 'x' + window.innerHeight +
        ' active=' + epDesc(document.activeElement));
    });
    window.addEventListener('orientationchange', function () {
      epLog('orientationchange', 'angle=' + (window.orientation !== undefined ? window.orientation : '?'));
    });
    window.addEventListener('scroll', function (e) {
      var now = epNow();
      if (now - _epLastScrollLog < 120) return;
      _epLastScrollLog = now;
      epLog('scroll', 'on=' + epDesc(e.target) + ' active=' + epDesc(document.activeElement));
    }, true);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        epLog('visualViewport resize', 'h=' + Math.round(window.visualViewport.height) +
          ' active=' + epDesc(document.activeElement));
      });
      window.visualViewport.addEventListener('scroll', function () {
        var now = epNow();
        if (now - _epLastScrollLog < 120) return;
        _epLastScrollLog = now;
        epLog('visualViewport scroll', 'offsetTop=' + Math.round(window.visualViewport.offsetTop));
      });
    }
  }

  /* Per-item timeline. Only attached when ?epdebug=1 is present. */
  function epInstrumentItem(el, idx) {
    if (!EPDEBUG) return;
    ['pointerdown', 'touchstart', 'pointerup', 'touchend', 'pointercancel', 'touchcancel',
     'mousedown', 'mouseup', 'click', 'focus', 'blur', 'input'].forEach(function (type) {
      el.addEventListener(type, function (e) {
        var extra = 'active=' + epDesc(document.activeElement);
        if (type === 'blur') extra = 'relatedTarget=' + epDesc(e.relatedTarget) + ' ' + extra;
        if (e.changedTouches && e.changedTouches[0]) {
          extra += ' at=' + Math.round(e.changedTouches[0].clientX) + ',' + Math.round(e.changedTouches[0].clientY);
        } else if (typeof e.clientX === 'number') {
          extra += ' at=' + Math.round(e.clientX) + ',' + Math.round(e.clientY);
        }
        epLog(type.toUpperCase() + ' item#' + idx, extra);
      }, true);
    });
  }

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
        'line-height:1.15;padding:0 1px;outline:none;z-index:3;transform-origin:0 0;' +
        'touch-action:manipulation;-webkit-user-select:text;user-select:text;}' +
      '.ep-text-item:hover{outline:1px dashed #E07B39;cursor:text;}' +
      '.ep-text-item:focus{outline:2px solid #E07B39;}' +
      '.ep-text-item--live{color:inherit;}' +
      /* MOBILE ONLY (added by the touch path): the block being edited is
         promoted to a visible, opaque, outlined box — Sejda-style — so the
         browser is focusing real text instead of an invisible empty div. */
      '.ep-text-item--editing{z-index:9;border-radius:2px;outline:2px solid #E07B39 !important;' +
        'box-shadow:0 0 0 3px rgba(224,123,57,.30),0 2px 10px rgba(0,0,0,.28);}' +
      '#ep-done-bar{position:fixed;top:8px;right:8px;z-index:2147483000;display:flex;gap:6px;}' +
      '#ep-done-bar button{font:700 14px/1 system-ui,-apple-system,Segoe UI,sans-serif;' +
        'padding:11px 18px;border:0;border-radius:22px;background:#E07B39;color:#fff;' +
        'box-shadow:0 2px 10px rgba(0,0,0,.35);}' +
      '.ep-mode-btn--active{background:#E07B39 !important;color:#fff !important;}' +
      '#ep-text-layer{position:absolute;top:0;left:0;right:0;bottom:0;z-index:3;}' +
      '#ep-stage-inner .canvas-container{position:absolute !important;top:0;left:0;z-index:2;}' +
      /* Edit mode ONLY: the text overlays sit above the Fabric canvas and the
         canvas ignores pointer/touch input, so a tap on a text box can never be
         handled by Fabric (which would blur the field and close the mobile
         keyboard). Every other mode keeps the default stacking so the Fabric
         canvas still receives taps for addtext / whiteout / shape / draw. */
      '#ep-stage-inner.ep-mode-edit #ep-text-layer{z-index:6;}' +
      '#ep-stage-inner.ep-mode-edit .canvas-container{z-index:1;pointer-events:none !important;}' +
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
    if (!optionsEl) return;
    /* Guard on the injected toolbar, not the persistent container —
       resetState re-injects fresh markup that needs re-wiring. */
    var toolbar = optionsEl.querySelector('#ep-toolbar');
    if (!toolbar || toolbar.dataset.epWired) return;
    toolbar.dataset.epWired = '1';
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
    epLog('setMode(' + mode + ')', 'active=' + epDesc(document.activeElement));
    /* Mobile: switching to addtext/whiteout/shape/draw ends the in-place edit
       first, so its text is written back before the field goes away. */
    if (IS_TOUCH && _activeEdit && mode !== 'edit') endMobileEdit(true, true);
    _mode = mode;
    if (_optionsEl) {
      _optionsEl.querySelectorAll('.ep-mode-btn').forEach(function (btn) {
        btn.classList.toggle('ep-mode-btn--active', btn.dataset.epmode === mode);
      });
      var hint = _optionsEl.querySelector('#ep-hint');
      if (hint) hint.textContent = HINTS[mode] || '';
      var textLayer = _optionsEl.querySelector('#ep-text-layer');
      if (textLayer) textLayer.style.pointerEvents = (mode === 'edit') ? 'auto' : 'none';
      var stageInner = _optionsEl.querySelector('#ep-stage-inner');
      if (stageInner) stageInner.classList.toggle('ep-mode-edit', mode === 'edit');
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

  /* -----------------------------------------------
     MOBILE ACTIVE-EDIT SESSION      (only runs when IS_TOUCH is true)

     Desktop edits an overlay that stays at color:transparent — the glyphs the
     user sees are the ones PDF.js painted on the base canvas underneath, and
     with a mouse that is fine. A mobile browser, though, has to focus an
     invisible, visually empty contentEditable and hold a caret in it, which is
     the case they handle worst: the keyboard opens and immediately closes.

     So on touch the tapped item is promoted to what Sejda actually edits — a
     visible, opaque, outlined block of real text — and every redraw path is
     frozen for as long as that block is being edited (the keyboard opening is
     itself a viewport resize, and a rebuild triggered by it would replace the
     focused node). The session ends on blur or on the Done button, which is
     where the text is written back to the record the exporter reads.
  ----------------------------------------------- */
  function showDoneBar() {
    if (!IS_TOUCH) return;
    if (_doneBar) { _doneBar.style.display = 'flex'; return; }
    var bar = document.createElement('div');
    bar.id = 'ep-done-bar';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '✓ Done';
    /* Swallow the press itself: without this the button steals focus from the
       field before we have written the text back, and the keyboard closes
       under the user's finger. The commit happens on touchend instead. */
    btn.addEventListener('touchstart', function (e) {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    btn.addEventListener('touchend', function (e) {
      if (e.cancelable) e.preventDefault();
      epLog('DONE tapped');
      endMobileEdit(true, true);
    }, { passive: false });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      endMobileEdit(true, true);
    });
    bar.appendChild(btn);
    document.body.appendChild(bar);
    _doneBar = bar;
  }

  function hideDoneBar() {
    if (_doneBar) _doneBar.style.display = 'none';
  }

  function beginMobileEdit(el, rec, idx, x, y) {
    if (_activeEdit && _activeEdit.el === el) {
      placeCaretFromPoint(el, x, y);
      return;
    }
    if (_activeEdit) endMobileEdit(true, false);

    _activeEdit = {
      el: el, rec: rec, idx: idx, page: _textLayerPage,
      at: Date.now(), touchSeq: _touchSeq, refocused: false, ending: false,
    };

    /* Visible and opaque BEFORE focus, so the browser is asked to focus a
       normal block of readable text rather than an empty transparent box. */
    applyLiveStyle(el, rec);
    el.classList.add('ep-text-item--editing');

    /* Direct focus() inside the touchend user gesture — this is what opens the
       software keyboard. Scrolling is left enabled here (and only here):
       it is what makes room for the keyboard. */
    el.focus();
    placeCaretFromPoint(el, x, y);
    showDoneBar();
    epLog('MOBILE EDIT begin item#' + idx, 'active=' + epDesc(document.activeElement) +
      ' text="' + String(rec.newStr).slice(0, 20) + '"');
  }

  /* commit: write the element text back to the record (false only when the
     caller has a newer value already). blurEl: also drop focus, which closes
     the keyboard — used by Done and by page/mode changes, not by blur itself. */
  function endMobileEdit(commit, blurEl) {
    var session = _activeEdit;
    if (!session || session.ending) return;
    session.ending = true;
    _activeEdit = null;

    var el = session.el, rec = session.rec;
    if (commit !== false) {
      rec.newStr = (el.textContent || '').replace(/[\r\n]+/g, ' ');
      rec.changed = rec.newStr !== rec.str;
    }
    el.classList.remove('ep-text-item--editing');
    /* An unchanged item goes back to resting transparent so the original PDF
       glyphs show through again. A CHANGED item stays visible and opaque: the
       base canvas underneath still shows the OLD text, so hiding the overlay
       would make the edit look lost. Export reads rec, never the DOM. */
    if (!rec.changed) clearLiveStyle(el);
    hideDoneBar();
    if (blurEl && document.activeElement === el) el.blur();
    epLog('MOBILE EDIT end item#' + session.idx, 'changed=' + rec.changed +
      ' text="' + String(rec.newStr).slice(0, 24) + '"');
  }

  /* A blur that arrives shortly after the tap, with no new touch behind it and
     nothing else having taken the focus, is the browser dropping the field —
     the "keyboard flashes and closes" symptom — not the user tapping away.
     Claim the focus back exactly once per session. Any real tap elsewhere
     bumps _touchSeq and so always wins, however quickly it follows.
     Returns true when the session is being kept alive. */
  function mobileBlurGuard(el) {
    var session = _activeEdit;
    if (!session || session.el !== el) return false;
    var age = Date.now() - session.at;
    var ae = document.activeElement;
    var stolen = !!(ae && ae !== el && ae !== document.body && ae !== document.documentElement);
    if (session.refocused || stolen || age > 1500) return false;
    if (_touchSeq !== session.touchSeq) {
      epLog('MOBILE blur after a new touch — user left item#' + session.idx);
      return false;
    }

    session.refocused = true;
    epLog('MOBILE blur after ' + age + 'ms with nothing focused — refocusing item#' + session.idx);
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    if (document.activeElement === el) return true;
    setTimeout(function () {
      if (_activeEdit !== session) return;
      try { el.focus({ preventScroll: true }); } catch (e2) { el.focus(); }
      var ok = document.activeElement === el;
      epLog('MOBILE refocus (async)', 'ok=' + ok);
      if (!ok) endMobileEdit(true, false);
    }, 0);
    return true;
  }

  /* The software keyboard opening fires window resize and visualViewport
     resize, and on some browsers scrolls the page as well. This module does no
     layout work in response to any of them while an edit is active; these
     listeners exist so the on-screen log proves that, right next to the
     focus/blur events. A real orientation change is not the keyboard, so that
     one ends the session cleanly instead. */
  function wireMobileGuards() {
    if (!IS_TOUCH || _mobileGuardsWired) return;
    _mobileGuardsWired = true;
    function ignored(what) {
      return function () {
        if (!_activeEdit) return;
        epLog(what + ' IGNORED (mobile edit active)', 'item#' + _activeEdit.idx +
          ' active=' + epDesc(document.activeElement));
      };
    }
    document.addEventListener('touchstart', function () { _touchSeq++; }, true);
    window.addEventListener('resize', ignored('window resize'));
    window.addEventListener('orientationchange', function () {
      if (_activeEdit) endMobileEdit(true, true);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', ignored('visualViewport resize'));
      window.visualViewport.addEventListener('scroll', ignored('visualViewport scroll'));
    }
  }

  /* Caret at the tapped point. Only used when the browser did NOT focus the
     field itself, so native caret placement is never overridden. */
  function placeCaretFromPoint(el, x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    try {
      var range = null;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
      } else if (document.caretPositionFromPoint) {
        var pos = document.caretPositionFromPoint(x, y);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
        }
      }
      if (!range || !el.contains(range.startContainer)) return;
      range.collapse(true);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) { /* selection API unavailable — caret stays where focus put it */ }
  }

  /* Caret position inside the layer, as a plain {index, offset} pair that
     survives the nodes being replaced. */
  function captureCaret(layer) {
    var ae = document.activeElement;
    if (!ae || ae.parentNode !== layer) return null;
    var index = Array.prototype.indexOf.call(layer.children, ae);
    if (index < 0) return null;
    var offset = 0;
    try {
      var sel = window.getSelection();
      if (sel && sel.rangeCount && ae.contains(sel.anchorNode)) {
        var live = sel.getRangeAt(0);
        var probe = document.createRange();
        probe.selectNodeContents(ae);
        probe.setEnd(live.endContainer, live.endOffset);
        offset = probe.toString().length;
      }
    } catch (e) { /* selection API unavailable — caret returns to the start */ }
    return { index: index, offset: offset };
  }

  function restoreCaret(layer, snap) {
    if (!snap) return;
    var el = layer.children[snap.index];
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    try {
      var node = el.firstChild;
      var range = document.createRange();
      if (node && node.nodeType === 3) {
        range.setStart(node, Math.min(snap.offset, node.nodeValue.length));
        range.collapse(true);
      } else {
        range.selectNodeContents(el);
        range.collapse(false);
      }
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) { /* caret stays where focus put it */ }
    epLog('renderTextLayer: caret restored', 'item#' + snap.index + ' offset=' + snap.offset);
  }

  /* Focus a text item and put the caret under the tap. Used by both input
     paths; only the touch path asks the browser to scroll the field into
     view, because that is what makes room for the software keyboard. */
  function focusTextItem(el, rec, x, y, allowScroll) {
    applyLiveStyle(el, rec);
    if (document.activeElement !== el) {
      if (allowScroll) {
        el.focus();
      } else {
        try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
      }
    }
    placeCaretFromPoint(el, x, y);
  }

  function renderTextLayer(pageState, pageNum) {
    var layer = _optionsEl.querySelector('#ep-text-layer');
    if (!layer) return;

    /* MOBILE: an item is being edited right now. Any rebuild replaces its
       node, which blurs it and closes the keyboard — and the keyboard opening
       is itself a viewport resize that can lead here. This is a hard stop, not
       the item-count heuristic below: nothing may touch the layer until the
       session ends. Never reached on desktop. */
    if (IS_TOUCH && _activeEdit) {
      epLog('renderTextLayer: BLOCKED (mobile edit active)',
        'page=' + pageNum + ' item#' + _activeEdit.idx);
      return;
    }

    /* Rebuilding replaces every node in the layer, which blurs whatever the
       user is editing and closes the software keyboard. Nothing about the
       overlays depends on the viewport, so a page that is already mounted is
       left alone — that makes any repeat call (mode switch, a re-render
       triggered by the keyboard resizing the viewport, a future caller)
       harmless instead of destructive. */
    if (_textLayerPage === pageNum && layer.childElementCount === pageState.textItems.length) {
      epLog('renderTextLayer: SKIPPED rebuild', 'page=' + pageNum + ' active=' + epDesc(document.activeElement));
      layer.style.pointerEvents = (_mode === 'edit') ? 'auto' : 'none';
      return;
    }

    var caret = captureCaret(layer);
    epLog('renderTextLayer: REBUILD', 'page=' + pageNum + ' items=' + pageState.textItems.length +
      ' hadFocus=' + (caret ? 'item#' + caret.index : 'no'));
    layer.innerHTML = '';
    _textLayerPage = null;

    pageState.textItems.forEach(function (rec, idx) {
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

      epInstrumentItem(el, idx);

      el.addEventListener('focus', function () { applyLiveStyle(el, rec); });
      el.addEventListener('blur', function () {
        if (IS_TOUCH && _activeEdit && _activeEdit.el === el) {
          if (mobileBlurGuard(el)) return; /* spurious blur — session kept */
          endMobileEdit(true, false);
          return;
        }
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

      /* Put the real glyphs under the finger before the browser places the
         caret: the resting state is color:transparent, which some mobile
         browsers hit-test poorly. Reverted if the tap turns into a scroll. */
      el.addEventListener('pointerdown', function () {
        if (_mode !== 'edit') return;
        applyLiveStyle(el, rec);
      });
      ['pointercancel', 'touchcancel'].forEach(function (evt) {
        el.addEventListener(evt, function () {
          /* Mobile: the item being edited is never reverted from here — a
             cancelled pointer during an active session (the keyboard opening
             under the finger, a stray second touch) must not blank it out. */
          if (IS_TOUCH && _activeEdit && _activeEdit.el === el) return;
          if (document.activeElement !== el && !rec.changed) clearLiveStyle(el);
        });
      });

      /* ── Touch: focus on touchend and cancel the compatibility mouse events ──
         A tap on a touch screen is replayed as mousedown/mouseup/click AFTER
         the finger lifts. The mousedown focuses the field and the software
         keyboard opens, which shrinks the viewport and scrolls the page; the
         mouseup that follows is then hit-tested at the same screen point
         against the new layout and lands somewhere else. A mousedown inside an
         editing host followed by a mouseup outside it is a selection drag, so
         the browser moves the selection out of the host — the field loses
         focus and the keyboard closes again. That is the "keyboard flashes and
         closes" bug, and it is why z-index, pointer-events, stopPropagation
         and transparent-glyph fixes all missed: none of them stop the replayed
         mouse sequence.

         preventDefault() on touchend cancels that whole sequence, so nothing
         arrives afterwards that can take the focus away. touchend is a user
         gesture, so focus() opens the keyboard exactly as the mousedown did.
         Only stationary short taps are claimed — scrolls and long presses fall
         through to native handling so text selection still works. */
      var tapStart = null;
      el.addEventListener('touchstart', function (e) {
        tapStart = null;
        if (_mode !== 'edit' || e.touches.length !== 1) return;
        var t = e.touches[0];
        tapStart = { x: t.clientX, y: t.clientY, at: Date.now() };
      }, { passive: true });

      el.addEventListener('touchend', function (e) {
        var start = tapStart;
        tapStart = null;
        if (_mode !== 'edit' || !start || e.changedTouches.length !== 1) return;
        var t = e.changedTouches[0];
        if (Math.abs(t.clientX - start.x) > 10 || Math.abs(t.clientY - start.y) > 10) return; /* scroll */
        if (Date.now() - start.at > 600) return; /* long press — leave selection to the browser */
        if (e.cancelable) e.preventDefault();
        _lastTouchFocus = Date.now();
        epLog('TAP handled item#' + idx, 'preventDefault=' + e.cancelable);
        if (IS_TOUCH) {
          beginMobileEdit(el, rec, idx, t.clientX, t.clientY);
        } else {
          focusTextItem(el, rec, t.clientX, t.clientY, true);
        }
      }, { passive: false });

      /* ── Mouse / pen: unchanged desktop path ──
         Focus on CLICK, the last event a mouse press produces. The browser
         focuses the field and places the caret on mousedown, so this is a
         no-op whenever native handling worked. Taps handled above never reach
         here, because their compatibility click was cancelled; the timestamp
         guard covers the odd browser that sends one anyway. */
      el.addEventListener('click', function (e) {
        if (_mode !== 'edit' || document.activeElement === el) return;
        if (Date.now() - _lastTouchFocus < 800) return;
        focusTextItem(el, rec, e.clientX, e.clientY, false);
      });

      layer.appendChild(el);
    });

    _textLayerPage = pageNum;
    layer.style.pointerEvents = (_mode === 'edit') ? 'auto' : 'none';
    restoreCaret(layer, caret);
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
    epLog('renderPage(' + num + ')');
    /* MOBILE: re-rendering the page rebuilds the text layer underneath the
       caret. If the edit is on this page, refuse outright; a move to another
       page commits it first. Never reached on desktop. */
    if (IS_TOUCH && _activeEdit) {
      if (_activeEdit.page === num) {
        epLog('renderPage: BLOCKED (mobile edit active)', 'page=' + num);
        return;
      }
      endMobileEdit(true, true);
    }
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

    renderTextLayer(_pages[num], num);

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
    epWireGlobals();
    wireMobileGuards();
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

    /* A new file wipes the records the open session points at — drop it
       without committing, so the guards in renderPage cannot block the first
       render of the new document. */
    if (IS_TOUCH && _activeEdit) endMobileEdit(false, true);

    _file = file;
    _pages = {};
    _textLayerPage = null;
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

    /* Mobile: the user can hit Save with the keyboard still open — commit the
       field being edited before its text is read back below. */
    if (IS_TOUCH && _activeEdit) endMobileEdit(true, true);
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

/**
 * ToolsGallery — Collage Maker
 * Handler: img-collage
 * URL: /tool/collage-maker/
 *
 * Interactive multi-file browser tool. The editor UI is built once in
 * wireOptions(); uploaded files are synced live via a MutationObserver
 * on the tool box's file list (multi-file mode never fires onFileReady),
 * reading window.TGTool.getCurrentFiles(). Each photo can be dragged to
 * reposition and wheel/pinch-zoomed within its slot; tray thumbnails can
 * be dragged onto slots to assign or swap. run() re-renders the same
 * state at full resolution for download.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-collage' };

  var SIZE_MAP = { square: [1080, 1080], portrait: [1080, 1350], landscape: [1920, 1080] };

  /* Templates as normalized cell rects {x,y,w,h} in 0..1 space */
  var TEMPLATES = {
    't2': { label: '2 Photos', cells: [
      { x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 } ] },
    't3': { label: '3 Photos', cells: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } ] },
    't4': { label: '4 Photos', cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } ] },
    't5': { label: '5 Photos', cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 } ] },
    't6': { label: '6 Photos', cells: [
      { x: 0, y: 0, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 } ] },
    'custom': { label: 'Custom Grid', cells: null },
  };

  function gridCells(rows, cols) {
    var cells = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        cells.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows });
      }
    }
    return cells;
  }

  /* ── Editor state (module-level so run() can read it) ── */
  var state = {
    photos: [],        // { key, name, img }
    template: 't4',
    customRows: 2,
    customCols: 2,
    assign: [],        // slot index → photo index (or -1)
    transforms: [],    // slot index → { zoom, ox, oy }
    size: 'square',
    gap: 8,
    radius: 4,
    background: '#ffffff',
    borderColor: '#ffffff',
    borderWidth: 0,
    format: 'jpg',
  };

  function currentCells() {
    if (state.template === 'custom') return gridCells(state.customRows, state.customCols);
    return TEMPLATES[state.template].cells;
  }

  function slotRects(cw, ch) {
    var gap = state.gap;
    return currentCells().map(function (cell) {
      return {
        x: cell.x * cw + gap / 2 + (cell.x === 0 ? gap / 2 : 0),
        y: cell.y * ch + gap / 2 + (cell.y === 0 ? gap / 2 : 0),
        w: cell.w * cw - gap - (cell.x === 0 ? gap / 2 : 0) - (cell.x + cell.w >= 0.999 ? gap / 2 : 0),
        h: cell.h * ch - gap - (cell.y === 0 ? gap / 2 : 0) - (cell.y + cell.h >= 0.999 ? gap / 2 : 0),
      };
    });
  }

  function ensureSlotState() {
    var n = currentCells().length;
    while (state.assign.length < n) state.assign.push(-1);
    while (state.transforms.length < n) state.transforms.push({ zoom: 1, ox: 0, oy: 0 });
    state.assign.length = n;
    state.transforms.length = n;
    // Drop assignments pointing at removed photos
    for (var i = 0; i < n; i++) {
      if (state.assign[i] >= state.photos.length) state.assign[i] = -1;
    }
    // Auto-fill empty slots with unassigned photos
    var used = {};
    state.assign.forEach(function (p) { if (p >= 0) used[p] = true; });
    for (var s = 0; s < n; s++) {
      if (state.assign[s] !== -1) continue;
      for (var p = 0; p < state.photos.length; p++) {
        if (!used[p]) { state.assign[s] = p; used[p] = true; break; }
      }
    }
  }

  function drawRoundedClip(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /* Compute the drawn image rect for a slot, clamped so it always covers */
  function imageRect(img, rect, tf) {
    var base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    var scale = base * Math.max(1, tf.zoom);
    var sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
    var sx = rect.x + (rect.w - sw) / 2 + tf.ox * rect.w;
    var sy = rect.y + (rect.h - sh) / 2 + tf.oy * rect.h;
    sx = Math.min(rect.x, Math.max(rect.x + rect.w - sw, sx));
    sy = Math.min(rect.y, Math.max(rect.y + rect.h - sh, sy));
    return { x: sx, y: sy, w: sw, h: sh };
  }

  function renderCollage(canvas, forExport, activeSlot) {
    ensureSlotState();
    var dims = SIZE_MAP[state.size] || SIZE_MAP.square;
    var cw = dims[0], ch = dims[1];
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = state.background;
    ctx.fillRect(0, 0, cw, ch);

    var rects = slotRects(cw, ch);
    rects.forEach(function (rect, s) {
      var photoIdx = state.assign[s];
      var photo = photoIdx >= 0 ? state.photos[photoIdx] : null;

      ctx.save();
      drawRoundedClip(ctx, rect.x, rect.y, rect.w, rect.h, state.radius);
      ctx.clip();

      if (photo) {
        var r = imageRect(photo.img, rect, state.transforms[s]);
        ctx.drawImage(photo.img, r.x, r.y, r.w, r.h);
      } else if (!forExport) {
        // Empty-slot placeholder (preview only)
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        var fs = Math.max(16, Math.min(rect.w, rect.h) * 0.1);
        ctx.font = '600 ' + fs + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+ Drop photo', rect.x + rect.w / 2, rect.y + rect.h / 2);
      }
      ctx.restore();

      if (state.borderWidth > 0) {
        ctx.save();
        drawRoundedClip(ctx, rect.x, rect.y, rect.w, rect.h, state.radius);
        ctx.strokeStyle = state.borderColor;
        ctx.lineWidth = state.borderWidth * 2; // half is clipped away visually
        ctx.stroke();
        ctx.restore();
      }
      if (!forExport && activeSlot === s) {
        ctx.save();
        ctx.strokeStyle = '#E07B39';
        ctx.lineWidth = 6;
        drawRoundedClip(ctx, rect.x, rect.y, rect.w, rect.h, state.radius);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  /* ── Options / editor UI ── */
  function getOptionsHTML() {
    var tmplBtns = Object.keys(TEMPLATES).map(function (key) {
      return '<button type="button" class="icl-tmpl-btn" data-tmpl="' + key + '" title="' + TEMPLATES[key].label + '"' +
        ' style="border:2px solid ' + (key === state.template ? '#E07B39' : '#ccc') + ';border-radius:6px;background:#fff;cursor:pointer;padding:3px;width:56px;height:56px">' +
        '<canvas width="46" height="46" data-tmpl-thumb="' + key + '" style="display:block"></canvas>' +
        '</button>';
    }).join('');

    return '<label class="tg-opt-label">Template</label>' +
    '<div id="icl-tmpl-row" style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px">' + tmplBtns + '</div>' +
    '<div id="icl-custom-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label">Rows</label><input type="number" id="icl-rows" class="tg-text-input" min="1" max="4" value="2" style="width:64px">' +
      '<label class="tg-opt-label" style="margin-left:10px">Columns</label><input type="number" id="icl-cols" class="tg-text-input" min="1" max="4" value="2" style="width:64px">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Canvas</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="icl-size" value="square" checked> Square 1080&sup2;</label>' +
        '<label><input type="radio" name="icl-size" value="portrait"> Portrait 1080&times;1350</label>' +
        '<label><input type="radio" name="icl-size" value="landscape"> Landscape 1920&times;1080</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icl-gap">Gap: <span id="icl-gap-val">8</span>px</label>' +
      '<input type="range" id="icl-gap" min="0" max="40" value="8" style="flex:1">' +
      '<label class="tg-opt-label" for="icl-radius" style="margin-left:12px">Corners: <span id="icl-radius-val">4</span>px</label>' +
      '<input type="range" id="icl-radius" min="0" max="60" value="4" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icl-bg">Background</label>' +
      '<input type="color" id="icl-bg" value="#ffffff">' +
      '<label class="tg-opt-label" for="icl-border-color" style="margin-left:12px">Border</label>' +
      '<input type="color" id="icl-border-color" value="#ffffff">' +
      '<input type="range" id="icl-border-w" min="0" max="20" value="0" style="flex:1" title="Border width">' +
      '<span id="icl-border-w-val">0px</span>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icl-format">Download as</label>' +
      '<select id="icl-format" class="tg-select"><option value="jpg" selected>JPG</option><option value="png">PNG</option></select>' +
      '<button type="button" class="tg-btn-secondary" id="icl-add-photos" style="margin-left:12px">+ Add Photos</button>' +
    '</div>' +
    '<p class="tg-opt-info">Drag a photo inside its slot to reposition &middot; scroll or pinch to zoom &middot; drag a tray thumbnail onto a slot to place or swap it.</p>' +
    '<div id="icl-tray" style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"></div>' +
    '<div id="icl-canvas-wrap" style="margin-top:4px">' +
      '<canvas id="icl-editor" style="max-width:100%;height:auto;display:block;border:1px solid #ddd;border-radius:4px;touch-action:none;cursor:grab"></canvas>' +
    '</div>';
  }

  function drawTemplateThumb(canvas, key) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    var cells = key === 'custom' ? gridCells(3, 3) : TEMPLATES[key].cells;
    ctx.fillStyle = '#cbd5e1';
    cells.forEach(function (c) {
      ctx.fillRect(c.x * w + 2, c.y * h + 2, c.w * w - 4, c.h * h - 4);
    });
    if (key === 'custom') {
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.clearRect(w / 2 - 12, h / 2 - 12, 24, 24);
      ctx.fillText('?', w / 2, h / 2 + 1);
    }
  }

  function wireOptions(container) {
    var editor = container.querySelector('#icl-editor');
    if (!editor) return;

    // Template thumbnails
    container.querySelectorAll('[data-tmpl-thumb]').forEach(function (cv) {
      drawTemplateThumb(cv, cv.dataset.tmplThumb);
    });

    var activeSlot = -1;

    function repaint() {
      renderCollage(editor, false, activeSlot);
    }

    function updateTray() {
      var tray = container.querySelector('#icl-tray');
      if (!tray) return;
      tray.innerHTML = '';
      state.photos.forEach(function (photo, p) {
        var slot = state.assign.indexOf(p);
        var cell = document.createElement('div');
        cell.style.cssText = 'position:relative;width:56px;height:56px;border:2px solid ' + (slot >= 0 ? '#22c55e' : '#ccc') + ';border-radius:6px;overflow:hidden;cursor:grab;touch-action:none;background:#f8f8f8';
        cell.dataset.photoIdx = p;
        var thumb = document.createElement('canvas');
        thumb.width = 52; thumb.height = 52;
        var tctx = thumb.getContext('2d');
        var scale = Math.max(52 / photo.img.naturalWidth, 52 / photo.img.naturalHeight);
        var tw = photo.img.naturalWidth * scale, th = photo.img.naturalHeight * scale;
        tctx.drawImage(photo.img, (52 - tw) / 2, (52 - th) / 2, tw, th);
        thumb.style.cssText = 'display:block;width:100%;height:100%';
        cell.appendChild(thumb);
        if (slot >= 0) {
          var badge = document.createElement('span');
          badge.textContent = slot + 1;
          badge.style.cssText = 'position:absolute;top:1px;right:1px;background:#22c55e;color:#fff;font-size:10px;font-weight:700;border-radius:3px;padding:0 4px;pointer-events:none';
          cell.appendChild(badge);
        }
        wireTrayDrag(cell, p);
        tray.appendChild(cell);
      });
    }

    /* ── Tray drag → slot assign/swap ── */
    function wireTrayDrag(cell, photoIdx) {
      cell.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        cell.setPointerCapture(e.pointerId);
        var ghost = cell.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.zIndex = '9999';
        ghost.style.opacity = '0.8';
        ghost.style.pointerEvents = 'none';
        ghost.style.left = (e.clientX - 28) + 'px';
        ghost.style.top = (e.clientY - 28) + 'px';
        document.body.appendChild(ghost);

        function onMove(ev) {
          ghost.style.left = (ev.clientX - 28) + 'px';
          ghost.style.top = (ev.clientY - 28) + 'px';
        }
        function onUp(ev) {
          cell.removeEventListener('pointermove', onMove);
          cell.removeEventListener('pointerup', onUp);
          cell.removeEventListener('pointercancel', onUp);
          document.body.removeChild(ghost);
          var slot = slotAtClient(ev.clientX, ev.clientY);
          if (slot === -1) return;
          var from = state.assign.indexOf(photoIdx);
          var displaced = state.assign[slot];
          state.assign[slot] = photoIdx;
          if (from >= 0 && from !== slot) state.assign[from] = displaced;
          repaint();
          updateTray();
        }
        cell.addEventListener('pointermove', onMove);
        cell.addEventListener('pointerup', onUp);
        cell.addEventListener('pointercancel', onUp);
      });
    }

    /* ── Canvas coordinate helpers ── */
    function canvasPoint(clientX, clientY) {
      var r = editor.getBoundingClientRect();
      return {
        x: (clientX - r.left) * (editor.width / r.width),
        y: (clientY - r.top) * (editor.height / r.height),
      };
    }

    function slotAt(pt) {
      var rects = slotRects(editor.width, editor.height);
      for (var s = 0; s < rects.length; s++) {
        var r = rects[s];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) return s;
      }
      return -1;
    }

    function slotAtClient(clientX, clientY) {
      var r = editor.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return -1;
      return slotAt(canvasPoint(clientX, clientY));
    }

    /* ── Pan (drag) + pinch zoom within a slot ── */
    var pointers = {};
    var panSlot = -1;
    var panStart = null;
    var pinchStart = null;

    editor.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      editor.setPointerCapture(e.pointerId);
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 1) {
        var pt = canvasPoint(e.clientX, e.clientY);
        panSlot = slotAt(pt);
        if (panSlot >= 0 && state.assign[panSlot] === -1) {
          // Tapping an empty slot opens the file picker
          var input = document.getElementById('file-input');
          if (input) input.click();
          panSlot = -1;
          return;
        }
        activeSlot = panSlot;
        if (panSlot >= 0) {
          var tf = state.transforms[panSlot];
          panStart = { x: e.clientX, y: e.clientY, ox: tf.ox, oy: tf.oy };
          editor.style.cursor = 'grabbing';
        }
        repaint();
      } else if (ids.length === 2 && panSlot >= 0) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        pinchStart = {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          zoom: state.transforms[panSlot].zoom,
        };
        panStart = null;
      }
    });

    editor.addEventListener('pointermove', function (e) {
      if (!(e.pointerId in pointers)) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);

      if (ids.length === 2 && pinchStart && panSlot >= 0) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var dist = Math.hypot(a.x - b.x, a.y - b.y);
        var tf = state.transforms[panSlot];
        tf.zoom = Math.max(1, Math.min(5, pinchStart.zoom * (dist / pinchStart.dist)));
        repaint();
        return;
      }

      if (panStart && panSlot >= 0) {
        var r = editor.getBoundingClientRect();
        var rects = slotRects(editor.width, editor.height);
        var rect = rects[panSlot];
        var pxScale = editor.width / r.width; // client px → canvas px
        var tf2 = state.transforms[panSlot];
        tf2.ox = panStart.ox + ((e.clientX - panStart.x) * pxScale) / rect.w;
        tf2.oy = panStart.oy + ((e.clientY - panStart.y) * pxScale) / rect.h;
        repaint();
      }
    });

    function releasePointer(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) pinchStart = null;
      if (Object.keys(pointers).length === 0) {
        panStart = null;
        editor.style.cursor = 'grab';
      }
    }
    editor.addEventListener('pointerup', releasePointer);
    editor.addEventListener('pointercancel', releasePointer);

    editor.addEventListener('wheel', function (e) {
      var pt = canvasPoint(e.clientX, e.clientY);
      var slot = slotAt(pt);
      if (slot === -1 || state.assign[slot] === -1) return;
      e.preventDefault();
      var tf = state.transforms[slot];
      tf.zoom = Math.max(1, Math.min(5, tf.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
      activeSlot = slot;
      repaint();
    }, { passive: false });

    /* ── Controls ── */
    container.querySelectorAll('.icl-tmpl-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.template = btn.dataset.tmpl;
        container.querySelectorAll('.icl-tmpl-btn').forEach(function (b) {
          b.style.borderColor = b === btn ? '#E07B39' : '#ccc';
        });
        var customWrap = container.querySelector('#icl-custom-wrap');
        if (customWrap) customWrap.hidden = state.template !== 'custom';
        activeSlot = -1;
        repaint();
        updateTray();
      });
    });

    function bind(id, prop, parse, labelId, suffix) {
      var input = container.querySelector('#' + id);
      if (!input) return;
      input.addEventListener('input', function () {
        state[prop] = parse ? parse(input.value) : input.value;
        if (labelId) {
          var lbl = container.querySelector('#' + labelId);
          if (lbl) lbl.textContent = input.value + (suffix || '');
        }
        repaint();
      });
    }
    bind('icl-rows', 'customRows', function (v) { return Math.max(1, Math.min(4, parseInt(v, 10) || 1)); });
    bind('icl-cols', 'customCols', function (v) { return Math.max(1, Math.min(4, parseInt(v, 10) || 1)); });
    bind('icl-gap', 'gap', function (v) { return parseInt(v, 10) || 0; }, 'icl-gap-val');
    bind('icl-radius', 'radius', function (v) { return parseInt(v, 10) || 0; }, 'icl-radius-val');
    bind('icl-bg', 'background');
    bind('icl-border-color', 'borderColor');
    bind('icl-border-w', 'borderWidth', function (v) { return parseInt(v, 10) || 0; }, 'icl-border-w-val', 'px');

    container.querySelectorAll('input[name="icl-size"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        state.size = radio.value;
        repaint();
      });
    });

    var fmtSel = container.querySelector('#icl-format');
    if (fmtSel) fmtSel.addEventListener('change', function () { state.format = fmtSel.value; });

    var addBtn = container.querySelector('#icl-add-photos');
    if (addBtn) addBtn.addEventListener('click', function () {
      var input = document.getElementById('file-input');
      if (input) input.click();
    });

    /* ── Live sync with the tool box's file selection ── */
    var box = container.closest('.tg-tool-box');
    var fileListEl = box ? box.querySelector('.tg-file-list') : null;

    function syncPhotos() {
      if (!window.TGTool) return;
      var files = TGTool.getCurrentFiles();
      var keys = files.map(function (f) { return f.name + '|' + f.size; });

      // Remove photos whose file was removed (remap slot assignments)
      for (var i = state.photos.length - 1; i >= 0; i--) {
        if (keys.indexOf(state.photos[i].key) !== -1) continue;
        state.photos.splice(i, 1);
        for (var s = 0; s < state.assign.length; s++) {
          if (state.assign[s] === i) state.assign[s] = -1;
          else if (state.assign[s] > i) state.assign[s]--;
        }
      }

      // Load new files
      var existing = state.photos.map(function (p) { return p.key; });
      var pending = [];
      files.forEach(function (f) {
        var key = f.name + '|' + f.size;
        if (existing.indexOf(key) !== -1) return;
        existing.push(key);
        pending.push(TGImageUtil.loadImage(f).then(function (img) {
          state.photos.push({ key: key, name: f.name, img: img });
        }).catch(function () {}));
      });

      Promise.all(pending).then(function () {
        container.hidden = state.photos.length === 0;
        repaint();
        updateTray();
      });
    }

    if (fileListEl) {
      // Disconnect a previous observer (resetState re-runs wireOptions)
      if (fileListEl._iclObserver) fileListEl._iclObserver.disconnect();
      var observer = new MutationObserver(syncPhotos);
      observer.observe(fileListEl, { childList: true, subtree: true });
      fileListEl._iclObserver = observer;
    }

    // Reset editor state on fresh wire (new session or resetState)
    state.photos = [];
    state.assign = [];
    state.transforms = [];
    repaint();
    syncPhotos();
  }

  function getOptions() {
    return {};
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.2, 'Building collage...');
    ensureSlotState();
    var assigned = state.assign.filter(function (p) { return p >= 0; }).length;
    if (state.photos.length < 2) throw new Error('Please upload at least 2 images for the collage.');
    if (!assigned) throw new Error('Drag at least one photo into a slot first.');

    var out = document.createElement('canvas');
    renderCollage(out, true, -1);

    onProgress && onProgress(0.8, 'Encoding...');
    var isPng = state.format === 'png';
    var blob = await new Promise(function (res, rej) {
      out.toBlob(function (b) { b ? res(b) : rej(new Error('Could not export the collage.')); },
        isPng ? 'image/png' : 'image/jpeg', 0.92);
    });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: 'collage.' + (isPng ? 'png' : 'jpg') };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

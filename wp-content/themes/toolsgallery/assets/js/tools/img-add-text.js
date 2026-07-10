/**
 * ToolsGallery — Add Text to Image
 * Handler: img-add-text
 * URL: /tool/add-text-to-image/
 *
 * Plain-canvas implementation with draggable text layers.
 * No external library needed — the previous Fabric.js version passed a
 * revoked blob URL to fabric.Image.fromURL(), so the background image
 * never loaded and exports came out black.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-add-text' };

  var state = {
    img: null,
    file: null,
    canvas: null,
    ctx: null,
    scale: 1,
    texts: [],
    selectedIdx: -1,
    dragging: false,
    dragOffX: 0,
    dragOffY: 0,
  };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-text">Text</label>' +
      '<input type="text" id="iat-text" class="tg-text-input" placeholder="Enter text..." value="Your Text Here">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-font">Font</label>' +
      '<select id="iat-font" class="tg-select">' +
        '<option value="Arial">Arial</option>' +
        '<option value="Impact" selected>Impact</option>' +
        '<option value="Georgia">Georgia</option>' +
        '<option value="Times New Roman">Times New Roman</option>' +
        '<option value="Courier New">Courier New</option>' +
        '<option value="Verdana">Verdana</option>' +
        '<option value="Comic Sans MS">Comic Sans MS</option>' +
        '<option value="Trebuchet MS">Trebuchet MS</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-size">Size: <span id="iat-size-val">36</span>px</label>' +
      '<input type="range" id="iat-size" min="8" max="200" value="36" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-color">Color</label>' +
      '<input type="color" id="iat-color" value="#ffffff">' +
      '<label class="tg-opt-label" for="iat-outline" style="margin-left:12px">Outline</label>' +
      '<input type="color" id="iat-outline" value="#000000">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-opacity">Text Opacity: <span id="iat-opacity-val">100</span>%</label>' +
      '<input type="range" id="iat-opacity" min="10" max="100" value="100" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label><input type="checkbox" id="iat-bold" checked> Bold</label>&nbsp;' +
      '<label><input type="checkbox" id="iat-italic"> Italic</label>&nbsp;' +
      '<label><input type="checkbox" id="iat-shadow"> Shadow</label>&nbsp;' +
      '<label><input type="checkbox" id="iat-no-outline"> No outline</label>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-format">Output Format</label>' +
      '<select id="iat-format" class="tg-select">' +
        '<option value="png" selected>PNG (lossless)</option>' +
        '<option value="jpeg">JPG (smaller file)</option>' +
        '<option value="webp">WebP (modern)</option>' +
      '</select>' +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      '<button type="button" class="tg-btn-secondary" id="iat-add-btn">+ Add Text</button>' +
      '<button type="button" class="tg-btn-secondary" id="iat-del-btn">Delete Selected</button>' +
      '<button type="button" class="tg-btn-secondary" id="iat-clear-btn">Clear All</button>' +
    '</div>' +
    '<div id="iat-layer-list" style="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;margin-bottom:8px"></div>' +
    '<div id="iat-canvas-wrap" style="margin-top:8px;display:none;border:1px solid #ddd;border-radius:4px;overflow:hidden;max-width:100%">' +
      '<canvas id="iat-canvas" style="display:block;width:100%;height:auto;touch-action:none"></canvas>' +
    '</div>' +
    '<p class="tg-opt-info" id="iat-hint" style="margin-top:6px">Upload an image, click "+ Add Text", then drag the text into position. Changing the options edits the selected text layer. When ready, click the action button to save.</p>';
  }

  /* Map a mouse/touch client position to canvas pixel coordinates,
     accounting for CSS scaling of the canvas element. */
  function canvasPos(canvas, clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width / r.width),
      y: (clientY - r.top) * (canvas.height / r.height),
    };
  }

  function currentControls(container) {
    var q = function (id) { return container.querySelector('#' + id); };
    var noOutline = q('iat-no-outline');
    return {
      text: q('iat-text') ? q('iat-text').value : 'Text',
      font: q('iat-font') ? q('iat-font').value : 'Impact',
      size: q('iat-size') ? parseInt(q('iat-size').value, 10) : 36,
      color: q('iat-color') ? q('iat-color').value : '#ffffff',
      outlineColor: (noOutline && noOutline.checked) ? null : (q('iat-outline') ? q('iat-outline').value : '#000000'),
      opacity: q('iat-opacity') ? parseInt(q('iat-opacity').value, 10) : 100,
      bold: q('iat-bold') ? q('iat-bold').checked : true,
      italic: q('iat-italic') ? q('iat-italic').checked : false,
      shadow: q('iat-shadow') ? q('iat-shadow').checked : false,
    };
  }

  function fontString(t, sizeOverride) {
    return (t.bold ? 'bold ' : '') + (t.italic ? 'italic ' : '') +
      (sizeOverride || t.size) + 'px "' + t.font + '"';
  }

  function drawTextLayer(ctx, t, isSelected, sizeMul) {
    sizeMul = sizeMul || 1;
    var size = t.size * sizeMul;
    var x = t.x * sizeMul;
    var y = t.y * sizeMul;
    ctx.save();
    ctx.globalAlpha = (t.opacity || 100) / 100;
    ctx.font = fontString(t, size);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    if (t.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = size / 8;
      ctx.shadowOffsetX = size / 16;
      ctx.shadowOffsetY = size / 16;
    }

    if (t.outlineColor) {
      ctx.strokeStyle = t.outlineColor;
      ctx.lineWidth = Math.max(1, size / 15);
      ctx.lineJoin = 'round';
      ctx.strokeText(t.text, x, y);
    }

    ctx.fillStyle = t.color || '#ffffff';
    ctx.fillText(t.text, x, y);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (isSelected) {
      var tw = ctx.measureText(t.text).width;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x - 4, y - 4, tw + 8, size + 8);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function redraw() {
    var canvas = state.canvas, ctx = state.ctx, img = state.img;
    if (!canvas || !ctx || !img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    state.texts.forEach(function (t, i) {
      drawTextLayer(ctx, t, i === state.selectedIdx, 1);
    });
  }

  function updateLayerList() {
    var list = document.getElementById('iat-layer-list');
    if (!list) return;
    list.innerHTML = '';
    state.texts.forEach(function (t, i) {
      var item = document.createElement('button');
      item.type = 'button';
      item.textContent = 'T  ' + t.text;
      item.title = t.text;
      item.style.cssText = 'text-align:left;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:13px;' +
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#fff;' +
        'border:1.5px solid ' + (i === state.selectedIdx ? '#F97316' : '#e5e7eb');
      item.addEventListener('click', function () {
        state.selectedIdx = i;
        syncControlsToSelected();
        updateLayerList();
        redraw();
      });
      list.appendChild(item);
    });
  }

  var _optionsContainer = null;

  function syncControlsToSelected() {
    if (!_optionsContainer || state.selectedIdx < 0) return;
    var t = state.texts[state.selectedIdx];
    var q = function (id) { return _optionsContainer.querySelector('#' + id); };
    if (q('iat-text')) q('iat-text').value = t.text;
    if (q('iat-font')) q('iat-font').value = t.font;
    if (q('iat-size')) { q('iat-size').value = t.size; var sv = q('iat-size-val'); if (sv) sv.textContent = t.size; }
    if (q('iat-color')) q('iat-color').value = t.color;
    if (q('iat-outline') && t.outlineColor) q('iat-outline').value = t.outlineColor;
    if (q('iat-no-outline')) q('iat-no-outline').checked = !t.outlineColor;
    if (q('iat-opacity')) { q('iat-opacity').value = t.opacity; var ov = q('iat-opacity-val'); if (ov) ov.textContent = t.opacity; }
    if (q('iat-bold')) q('iat-bold').checked = t.bold;
    if (q('iat-italic')) q('iat-italic').checked = t.italic;
    if (q('iat-shadow')) q('iat-shadow').checked = t.shadow;
  }

  function applyControlsToSelected() {
    if (state.selectedIdx < 0 || !_optionsContainer) { redraw(); return; }
    var c = currentControls(_optionsContainer);
    var t = state.texts[state.selectedIdx];
    t.text = c.text || t.text;
    t.font = c.font;
    t.size = c.size;
    t.color = c.color;
    t.outlineColor = c.outlineColor;
    t.opacity = c.opacity;
    t.bold = c.bold;
    t.italic = c.italic;
    t.shadow = c.shadow;
    updateLayerList();
    redraw();
  }

  function wireOptions(container) {
    _optionsContainer = container;

    var sz = container.querySelector('#iat-size');
    var szv = container.querySelector('#iat-size-val');
    if (sz && szv) sz.addEventListener('input', function () { szv.textContent = sz.value; });
    var op = container.querySelector('#iat-opacity');
    var opv = container.querySelector('#iat-opacity-val');
    if (op && opv) op.addEventListener('input', function () { opv.textContent = op.value; });

    ['iat-text', 'iat-font', 'iat-size', 'iat-color', 'iat-outline', 'iat-opacity',
      'iat-bold', 'iat-italic', 'iat-shadow', 'iat-no-outline'].forEach(function (id) {
      var el = container.querySelector('#' + id);
      if (!el) return;
      el.addEventListener('input', applyControlsToSelected);
      el.addEventListener('change', applyControlsToSelected);
    });

    var addBtn = container.querySelector('#iat-add-btn');
    if (addBtn) addBtn.addEventListener('click', function () {
      if (!state.img || !state.canvas) {
        alert('Please upload an image first.');
        return;
      }
      var c = currentControls(container);
      if (!c.text.trim()) { alert('Please enter some text first.'); return; }
      var t = {
        text: c.text,
        font: c.font,
        size: c.size,
        color: c.color,
        outlineColor: c.outlineColor,
        opacity: c.opacity,
        bold: c.bold,
        italic: c.italic,
        shadow: c.shadow,
        x: Math.floor(state.canvas.width / 2 - 60),
        y: Math.floor(state.canvas.height / 2 - c.size / 2),
      };
      state.texts.push(t);
      state.selectedIdx = state.texts.length - 1;
      updateLayerList();
      redraw();
    });

    var delBtn = container.querySelector('#iat-del-btn');
    if (delBtn) delBtn.addEventListener('click', function () {
      if (state.selectedIdx < 0) return;
      state.texts.splice(state.selectedIdx, 1);
      state.selectedIdx = Math.min(state.selectedIdx, state.texts.length - 1);
      updateLayerList();
      redraw();
    });

    var clearBtn = container.querySelector('#iat-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      if (state.texts.length && !confirm('Remove all text layers?')) return;
      state.texts = [];
      state.selectedIdx = -1;
      updateLayerList();
      redraw();
    });
  }

  function hitTest(px, py) {
    var ctx = state.ctx;
    for (var i = state.texts.length - 1; i >= 0; i--) {
      var t = state.texts[i];
      ctx.font = fontString(t);
      var tw = ctx.measureText(t.text).width;
      if (px >= t.x - 4 && px <= t.x + tw + 4 && py >= t.y - 4 && py <= t.y + t.size + 4) {
        return i;
      }
    }
    return -1;
  }

  function onPointerDown(px, py) {
    var found = hitTest(px, py);
    state.selectedIdx = found;
    if (found >= 0) {
      state.dragging = true;
      state.dragOffX = px - state.texts[found].x;
      state.dragOffY = py - state.texts[found].y;
      syncControlsToSelected();
    }
    updateLayerList();
    redraw();
  }

  function onPointerMove(px, py) {
    if (!state.dragging || state.selectedIdx < 0) {
      if (state.canvas) state.canvas.style.cursor = hitTest(px, py) >= 0 ? 'move' : 'default';
      return;
    }
    state.texts[state.selectedIdx].x = px - state.dragOffX;
    state.texts[state.selectedIdx].y = py - state.dragOffY;
    redraw();
  }

  function onPointerUp() {
    state.dragging = false;
  }

  function setupCanvasEvents(canvas) {
    if (canvas._iatWired) return;
    canvas._iatWired = true;

    canvas.addEventListener('mousedown', function (e) {
      var p = canvasPos(canvas, e.clientX, e.clientY);
      onPointerDown(p.x, p.y);
    });
    canvas.addEventListener('mousemove', function (e) {
      var p = canvasPos(canvas, e.clientX, e.clientY);
      onPointerMove(p.x, p.y);
    });
    document.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var p = canvasPos(canvas, t.clientX, t.clientY);
      onPointerDown(p.x, p.y);
    }, { passive: false });
    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var p = canvasPos(canvas, t.clientX, t.clientY);
      onPointerMove(p.x, p.y);
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) {
      e.preventDefault();
      onPointerUp();
    }, { passive: false });
  }

  function onFileReady(file) {
    if (!file) return;
    state.file = file;

    var img = new Image();
    var objectUrl = URL.createObjectURL(file);

    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      state.img = img;

      var canvas = document.getElementById('iat-canvas');
      var wrap = document.getElementById('iat-canvas-wrap');
      if (!canvas || !wrap) return;
      state.canvas = canvas;
      state.ctx = canvas.getContext('2d');

      // Set canvas size AFTER the image has loaded — never before.
      var maxW = Math.min(800, window.innerWidth - 40);
      var maxH = 520;
      state.scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
      canvas.width = Math.max(1, Math.round(img.naturalWidth * state.scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * state.scale));

      wrap.style.display = 'block';
      wrap.style.width = canvas.width + 'px';

      state.texts = [];
      state.selectedIdx = -1;
      updateLayerList();
      redraw();
      setupCanvasEvents(canvas);
    };

    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      alert('Could not load image. Please try a different file.');
    };

    img.src = objectUrl;
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    if (!state.img || !state.canvas) {
      throw new Error('Editor not ready yet — wait for the image preview, add your text, then try again.');
    }
    if (state.texts.length === 0) {
      throw new Error('Add at least one text layer first (click "+ Add Text"), then try again.');
    }

    onProgress && onProgress(0.5, 'Rendering image...');

    // Render at the original resolution: draw the source image full-size
    // and scale every text layer up from display coordinates.
    var out = document.createElement('canvas');
    out.width = state.img.naturalWidth;
    out.height = state.img.naturalHeight;
    var ctx = out.getContext('2d');

    var format = options.format || 'png';
    var mime = TGImageUtil.getMime(format);
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);
    }
    ctx.drawImage(state.img, 0, 0, out.width, out.height);

    var sizeMul = state.scale ? 1 / state.scale : 1;
    state.texts.forEach(function (t) {
      drawTextLayer(ctx, t, false, sizeMul);
    });

    onProgress && onProgress(0.85, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(out, mime, 0.95);
    onProgress && onProgress(1, 'Done!');
    var ext = mime === 'image/jpeg' ? 'jpg' : (mime === 'image/webp' ? 'webp' : 'png');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-text.' + ext };
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var fmt = optionsEl.querySelector('#iat-format');
    return { format: fmt ? fmt.value : 'png' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

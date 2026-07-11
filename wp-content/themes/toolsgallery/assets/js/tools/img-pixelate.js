/**
 * ToolsGallery — Pixelate Image
 * Handler: img-pixelate
 * URL: /tool/pixelate-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-pixelate' };
  var _selectionRect = null;
  var _origImg = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ipx-block">Block Size: <span id="ipx-block-val">8</span>px</label>' +
      '<input type="range" id="ipx-block" min="2" max="64" value="8" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Mode</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ipx-mode" value="full" checked> Full image</label>' +
        '<label><input type="radio" name="ipx-mode" value="region"> Region (draw selection)</label>' +
      '</div>' +
    '</div>' +
    '<div id="ipx-canvas-wrap" style="margin-top:12px;display:none;position:relative">' +
      '<p class="tg-opt-info">Drag a rectangle over the area to pixelate.</p>' +
      '<canvas id="ipx-canvas" style="display:block;max-width:100%;cursor:crosshair;border:1px solid #ddd;border-radius:4px"></canvas>' +
      '<canvas id="ipx-overlay" style="position:absolute;left:0;pointer-events:none"></canvas>' +
    '</div>' +
    '<div id="ipx-preview-wrap" style="margin-top:12px;display:none">' +
      '<p style="margin:0 0 4px;font-size:12px;font-weight:600">Preview</p>' +
      '<canvas id="ipx-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    var sl = container.querySelector('#ipx-block');
    var sv = container.querySelector('#ipx-block-val');
    if (sl && sv) sl.addEventListener('input', function () { sv.textContent = sl.value; });
    container.querySelectorAll('input[name="ipx-mode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var wrap = container.querySelector('#ipx-canvas-wrap');
        if (wrap) wrap.style.display = (r.value === 'region' && _origImg) ? 'block' : 'none';
      });
    });
  }

  /* Called by tool-runner when a file is selected — renders the selection
     canvas so region mode is ready before the user clicks the action button. */
  function onFileReady(file, optionsEl) {
    _selectionRect = null;
    TGImageUtil.loadImage(file).then(function (img) {
      _origImg = img;
      buildSelectionCanvas(img, optionsEl);
      var mode = optionsEl ? optionsEl.querySelector('input[name="ipx-mode"]:checked') : null;
      var wrap = document.getElementById('ipx-canvas-wrap');
      if (wrap) wrap.style.display = (mode && mode.value === 'region') ? 'block' : 'none';
    }).catch(function () { _origImg = null; });
  }

  function buildSelectionCanvas(img) {
    var wrap = document.getElementById('ipx-canvas-wrap');
    var canvas = document.getElementById('ipx-canvas');
    var overlay = document.getElementById('ipx-overlay');
    if (!wrap || !canvas || !overlay) return;

    var maxW = Math.min(700, window.innerWidth - 40);
    var sc = Math.min(1, maxW / img.naturalWidth);
    var dw = Math.round(img.naturalWidth * sc), dh = Math.round(img.naturalHeight * sc);
    canvas.width = dw; canvas.height = dh;
    canvas.getContext('2d').drawImage(img, 0, 0, dw, dh);
    overlay.width = dw; overlay.height = dh;
    overlay.style.width = dw + 'px'; overlay.style.height = dh + 'px';
    overlay.style.top = canvas.offsetTop + 'px';

    var drawing = false, sx = 0, sy = 0;
    canvas.onmousedown = function (e) {
      var r = canvas.getBoundingClientRect();
      sx = e.clientX - r.left; sy = e.clientY - r.top; drawing = true;
    };
    canvas.onmousemove = function (e) {
      if (!drawing) return;
      var r = canvas.getBoundingClientRect();
      var ex = e.clientX - r.left, ey = e.clientY - r.top;
      overlay.style.top = (canvas.offsetTop) + 'px';
      var octx = overlay.getContext('2d');
      octx.clearRect(0, 0, dw, dh);
      octx.strokeStyle = '#E07B39'; octx.lineWidth = 2; octx.setLineDash([5, 3]);
      octx.strokeRect(sx, sy, ex - sx, ey - sy);
      octx.fillStyle = 'rgba(224,123,57,0.1)';
      octx.fillRect(sx, sy, ex - sx, ey - sy);
    };
    canvas.onmouseup = function (e) {
      drawing = false;
      var r = canvas.getBoundingClientRect();
      var ex = e.clientX - r.left, ey = e.clientY - r.top;
      if (Math.abs(ex - sx) > 10 && Math.abs(ey - sy) > 10) {
        _selectionRect = {
          x: Math.round(Math.min(sx, ex) / sc),
          y: Math.round(Math.min(sy, ey) / sc),
          w: Math.round(Math.abs(ex - sx) / sc),
          h: Math.round(Math.abs(ey - sy) / sc),
        };
      }
    };
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var block = optionsEl.querySelector('#ipx-block');
    var mode = optionsEl.querySelector('input[name="ipx-mode"]:checked');
    return {
      blockSize: block ? parseInt(block.value) : 8,
      mode: mode ? mode.value : 'full',
    };
  }

  function pixelate(ctx, x, y, w, h, blockSize) {
    for (var bx = x; bx < x + w; bx += blockSize) {
      for (var by = y; by < y + h; by += blockSize) {
        var bw = Math.min(blockSize, x + w - bx);
        var bh = Math.min(blockSize, y + h - by);
        var data = ctx.getImageData(bx, by, bw, bh).data;
        var r = 0, g = 0, b = 0, cnt = data.length / 4;
        for (var i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; }
        ctx.fillStyle = 'rgb(' + Math.round(r/cnt) + ',' + Math.round(g/cnt) + ',' + Math.round(b/cnt) + ')';
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Loading image...');
    var img = _origImg || await TGImageUtil.loadImage(file);

    if (options.mode === 'region' && !_selectionRect) {
      throw new Error('Please drag a rectangle over the image area to pixelate, then click the button again.');
    }

    onProgress && onProgress(0.5, 'Pixelating...');
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    var rect = options.mode === 'region' ? _selectionRect : null;
    if (rect) {
      // Clamp selection to image bounds
      var rx = Math.max(0, Math.min(rect.x, canvas.width - 1));
      var ry = Math.max(0, Math.min(rect.y, canvas.height - 1));
      var rw = Math.min(rect.w, canvas.width - rx);
      var rh = Math.min(rect.h, canvas.height - ry);
      pixelate(ctx, rx, ry, rw, rh, options.blockSize);
    } else {
      pixelate(ctx, 0, 0, canvas.width, canvas.height, options.blockSize);
    }

    // Preview
    var previewEl = document.getElementById('ipx-preview');
    var previewWrap = document.getElementById('ipx-preview-wrap');
    if (previewEl && previewWrap) {
      TGImageUtil.drawPreview(canvas, previewEl, 400);
      previewWrap.style.display = 'block';
    }

    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-pixelated.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

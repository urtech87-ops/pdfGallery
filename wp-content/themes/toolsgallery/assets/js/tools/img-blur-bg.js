/**
 * ToolsGallery — Blur Image Background
 * Handler: img-blur-bg
 * URL: /tool/blur-background/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-blur-bg' };
  var _selectionRect = null;
  var _origImg = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ibb-blur">Blur Intensity: <span id="ibb-blur-val">10</span>px</label>' +
      '<input type="range" id="ibb-blur" min="2" max="30" value="10" style="flex:1">' +
    '</div>' +
    '<p class="tg-opt-info">After loading your image, draw a rectangle around the subject you want to keep sharp. The rest will be blurred. If you skip this, the center of the image stays sharp.</p>' +
    '<div id="ibb-canvas-wrap" style="margin-top:12px;display:none;position:relative;overflow:hidden">' +
      '<canvas id="ibb-canvas" style="display:block;max-width:100%;cursor:crosshair;border:1px solid #ddd;border-radius:4px"></canvas>' +
      '<canvas id="ibb-overlay" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>' +
    '</div>' +
    '<p id="ibb-hint" class="tg-opt-info" style="margin-top:6px;display:none">Draw a rectangle around your subject, then click the action button.</p>';
  }

  function wireOptions(container) {
    var sl = container.querySelector('#ibb-blur');
    var sv = container.querySelector('#ibb-blur-val');
    if (sl && sv) sl.addEventListener('input', function () { sv.textContent = sl.value; });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var blur = optionsEl.querySelector('#ibb-blur');
    return { blur: blur ? parseInt(blur.value) : 10 };
  }

  function onFileReady(file) {
    _origImg = null;
    _selectionRect = null;
    if (!file) return;

    TGImageUtil.loadImage(file).then(function (img) {
      _origImg = img;

      var wrap = document.getElementById('ibb-canvas-wrap');
      var canvas = document.getElementById('ibb-canvas');
      var overlay = document.getElementById('ibb-overlay');
      var hint = document.getElementById('ibb-hint');
      if (!wrap || !canvas || !overlay) return;

      var maxW = Math.min(700, window.innerWidth - 40);
      var sc = Math.min(1, maxW / img.naturalWidth);
      var dw = Math.round(img.naturalWidth * sc), dh = Math.round(img.naturalHeight * sc);

      canvas.width = dw; canvas.height = dh;
      canvas.getContext('2d').drawImage(img, 0, 0, dw, dh);
      overlay.width = dw; overlay.height = dh;
      overlay.style.width = dw + 'px'; overlay.style.height = dh + 'px';
      wrap.style.display = 'block';
      wrap.style.width = dw + 'px'; wrap.style.height = dh + 'px';
      if (hint) hint.style.display = 'block';

      var drawing = false, sx = 0, sy = 0, ex = 0, ey = 0;
      canvas.onmousedown = function (e) {
        var r = canvas.getBoundingClientRect();
        sx = e.clientX - r.left; sy = e.clientY - r.top;
        drawing = true;
      };
      canvas.onmousemove = function (e) {
        if (!drawing) return;
        var r = canvas.getBoundingClientRect();
        ex = e.clientX - r.left; ey = e.clientY - r.top;
        var octx = overlay.getContext('2d');
        octx.clearRect(0, 0, dw, dh);
        octx.strokeStyle = '#E07B39';
        octx.lineWidth = 2;
        octx.setLineDash([5, 3]);
        octx.strokeRect(sx, sy, ex - sx, ey - sy);
        octx.fillStyle = 'rgba(224,123,57,0.1)';
        octx.fillRect(sx, sy, ex - sx, ey - sy);
      };
      canvas.onmouseup = function () {
        drawing = false;
        if (Math.abs(ex - sx) > 10 && Math.abs(ey - sy) > 10) {
          _selectionRect = {
            x: Math.round(Math.min(sx, ex) / sc),
            y: Math.round(Math.min(sy, ey) / sc),
            w: Math.round(Math.abs(ex - sx) / sc),
            h: Math.round(Math.abs(ey - sy) / sc),
          };
        }
      };
    }).catch(function () {});
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Loading image...');
    var img = _origImg || await TGImageUtil.loadImage(file);

    // Default: keep the center 60% sharp when no rectangle was drawn
    var rect = _selectionRect || {
      x: Math.round(img.naturalWidth * 0.2),
      y: Math.round(img.naturalHeight * 0.2),
      w: Math.round(img.naturalWidth * 0.6),
      h: Math.round(img.naturalHeight * 0.6),
    };

    onProgress && onProgress(0.5, 'Applying blur...');
    var w = img.naturalWidth, h = img.naturalHeight;

    var blurCanvas = document.createElement('canvas');
    blurCanvas.width = w; blurCanvas.height = h;
    var bCtx = blurCanvas.getContext('2d');
    bCtx.filter = 'blur(' + (options.blur || 10) + 'px)';
    bCtx.drawImage(img, 0, 0);
    bCtx.filter = 'none';

    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(blurCanvas, 0, 0);

    if (_selectionRect) {
      // Sharp rectangle drawn by the user
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
    } else {
      // Sharp center ellipse fallback
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, rect.w / 2, rect.h / 2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }

    onProgress && onProgress(0.8, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-blurred-bg.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

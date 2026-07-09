/**
 * ToolsGallery — Remove Objects from Image
 * Handler: img-remove-objects
 * URL: /tool/remove-objects/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-objects' };
  var _selections = [];
  var _origImg = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info">Draw rectangles over objects you want to remove. The tool will fill the area with surrounding content.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iro-blend">Blend Radius: <span id="iro-blend-val">8</span>px</label>' +
      '<input type="range" id="iro-blend" min="2" max="30" value="8" style="flex:1">' +
    '</div>' +
    '<div id="iro-canvas-wrap" style="margin-top:12px;display:none;position:relative">' +
      '<canvas id="iro-canvas" style="display:block;max-width:100%;cursor:crosshair;border:1px solid #ddd;border-radius:4px"></canvas>' +
      '<canvas id="iro-overlay" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>' +
    '</div>' +
    '<div style="margin-top:8px">' +
      '<button type="button" class="tg-btn-secondary" id="iro-clear-btn">Clear Selections</button>' +
    '</div>';
  }

  function wireOptions(container) {
    var sl = container.querySelector('#iro-blend');
    var sv = container.querySelector('#iro-blend-val');
    if (sl && sv) sl.addEventListener('input', function () { sv.textContent = sl.value; });
    var clr = container.querySelector('#iro-clear-btn');
    if (clr) clr.addEventListener('click', function () {
      _selections = [];
      if (window._iroRedraw) window._iroRedraw();
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var blend = optionsEl.querySelector('#iro-blend');
    return { blend: blend ? parseInt(blend.value) : 8 };
  }

  function onFileReady(file) {
    _origImg = null;
    _selections = [];
    if (!file) return;

    TGImageUtil.loadImage(file).then(function (img) {
      _origImg = img;

      var wrap = document.getElementById('iro-canvas-wrap');
      var canvas = document.getElementById('iro-canvas');
      var overlay = document.getElementById('iro-overlay');
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

      function redrawOverlay() {
        var octx = overlay.getContext('2d');
        octx.clearRect(0, 0, dw, dh);
        octx.strokeStyle = '#ff0000';
        octx.fillStyle = 'rgba(255,0,0,0.25)';
        octx.lineWidth = 2;
        _selections.forEach(function (sel) {
          octx.fillRect(sel.x * sc, sel.y * sc, sel.w * sc, sel.h * sc);
          octx.strokeRect(sel.x * sc, sel.y * sc, sel.w * sc, sel.h * sc);
        });
      }
      window._iroRedraw = redrawOverlay;

      var drawing = false, sx = 0, sy = 0;
      canvas.onmousedown = function (e) {
        var r = canvas.getBoundingClientRect();
        sx = e.clientX - r.left; sy = e.clientY - r.top;
        drawing = true;
      };
      canvas.onmouseup = function (e) {
        drawing = false;
        var r = canvas.getBoundingClientRect();
        var ex = e.clientX - r.left, ey = e.clientY - r.top;
        if (Math.abs(ex - sx) > 5 && Math.abs(ey - sy) > 5) {
          _selections.push({
            x: Math.round(Math.min(sx, ex) / sc),
            y: Math.round(Math.min(sy, ey) / sc),
            w: Math.round(Math.abs(ex - sx) / sc),
            h: Math.round(Math.abs(ey - sy) / sc),
          });
          redrawOverlay();
        }
      };
    }).catch(function () {});
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    var img = _origImg || await TGImageUtil.loadImage(file);
    if (_selections.length === 0) {
      throw new Error('Please draw a rectangle over the object to remove, then click the button again.');
    }

    onProgress && onProgress(0.6, 'Removing objects...');
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);

    _selections.forEach(function (sel) {
      contentAwareFill(id, sel, canvas.width, canvas.height, options.blend || 8);
    });

    ctx.putImageData(id, 0, 0);
    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.95);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-removed.jpg' };
  }

  function contentAwareFill(id, rect, w, h, blendR) {
    var d = id.data;
    var x1 = Math.max(0, rect.x), y1 = Math.max(0, rect.y);
    var x2 = Math.min(w - 1, rect.x + rect.w), y2 = Math.min(h - 1, rect.y + rect.h);

    for (var y = y1; y <= y2; y++) {
      for (var x = x1; x <= x2; x++) {
        var rSum = 0, gSum = 0, bSum = 0, cnt = 0;
        for (var dy = -blendR; dy <= blendR; dy++) {
          for (var dx = -blendR; dx <= blendR; dx++) {
            var nx = x + dx, ny = y + dy;
            if (nx < x1 || nx > x2 || ny < y1 || ny > y2) {
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                var idx = (ny * w + nx) * 4;
                rSum += d[idx]; gSum += d[idx + 1]; bSum += d[idx + 2]; cnt++;
              }
            }
          }
        }
        if (cnt > 0) {
          var i = (y * w + x) * 4;
          d[i] = Math.round(rSum / cnt);
          d[i + 1] = Math.round(gSum / cnt);
          d[i + 2] = Math.round(bSum / cnt);
        }
      }
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Remove Objects from Image
 * Handler: img-remove-objects
 * URL: /tool/remove-objects/
 *
 * The preview draws only after the image's onload fires (canvas sized
 * after load, never before). Pointer coordinates are mapped through
 * getBoundingClientRect so selections stay accurate when CSS shrinks
 * the canvas, and the selection rectangle now draws live while dragging.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-objects' };
  var _selections = [];
  var _origImg = null;
  var _redrawOverlay = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info">Draw rectangles over objects you want to remove. The tool will fill the area with surrounding content.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iro-blend">Blend Radius: <span id="iro-blend-val">8</span>px</label>' +
      '<input type="range" id="iro-blend" min="2" max="30" value="8" style="flex:1">' +
    '</div>' +
    '<div id="iro-canvas-wrap" style="margin-top:12px;display:none;position:relative;max-width:100%">' +
      '<canvas id="iro-canvas" style="display:block;width:100%;height:auto;cursor:crosshair;border:1px solid #ddd;border-radius:4px;touch-action:none"></canvas>' +
      '<canvas id="iro-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none"></canvas>' +
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
      if (_redrawOverlay) _redrawOverlay();
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var blend = optionsEl.querySelector('#iro-blend');
    return { blend: blend ? parseInt(blend.value, 10) : 8 };
  }

  function canvasPos(canvas, clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width / r.width),
      y: (clientY - r.top) * (canvas.height / r.height),
    };
  }

  function onFileReady(file) {
    _origImg = null;
    _selections = [];
    if (!file) return;

    var img = new Image();
    var objectUrl = URL.createObjectURL(file);

    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      _origImg = img;

      var wrap = document.getElementById('iro-canvas-wrap');
      var canvas = document.getElementById('iro-canvas');
      var overlay = document.getElementById('iro-overlay');
      if (!wrap || !canvas || !overlay) return;

      // Size the canvas AFTER the image has loaded.
      var maxW = Math.min(700, window.innerWidth - 40);
      var sc = Math.min(1, maxW / img.naturalWidth);
      var dw = Math.max(1, Math.round(img.naturalWidth * sc));
      var dh = Math.max(1, Math.round(img.naturalHeight * sc));

      canvas.width = dw;
      canvas.height = dh;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, dw, dh);
      ctx.drawImage(img, 0, 0, dw, dh);

      overlay.width = dw;
      overlay.height = dh;
      wrap.style.display = 'block';
      wrap.style.width = dw + 'px';

      function drawRect(octx, x, y, w, h) {
        octx.fillRect(x, y, w, h);
        octx.strokeRect(x, y, w, h);
      }

      function redrawOverlay(liveRect) {
        var octx = overlay.getContext('2d');
        octx.clearRect(0, 0, dw, dh);
        octx.strokeStyle = '#ff0000';
        octx.fillStyle = 'rgba(255,0,0,0.25)';
        octx.lineWidth = 2;
        _selections.forEach(function (sel) {
          drawRect(octx, sel.x * sc, sel.y * sc, sel.w * sc, sel.h * sc);
        });
        if (liveRect) {
          octx.setLineDash([5, 3]);
          drawRect(octx, liveRect.x, liveRect.y, liveRect.w, liveRect.h);
          octx.setLineDash([]);
        }
      }
      _redrawOverlay = redrawOverlay;
      redrawOverlay();

      var drawing = false, sx = 0, sy = 0;

      function start(px, py) { drawing = true; sx = px; sy = py; }
      function move(px, py) {
        if (!drawing) return;
        redrawOverlay({
          x: Math.min(sx, px), y: Math.min(sy, py),
          w: Math.abs(px - sx), h: Math.abs(py - sy),
        });
      }
      function end(px, py) {
        if (!drawing) return;
        drawing = false;
        if (Math.abs(px - sx) > 5 && Math.abs(py - sy) > 5) {
          _selections.push({
            x: Math.round(Math.min(sx, px) / sc),
            y: Math.round(Math.min(sy, py) / sc),
            w: Math.round(Math.abs(px - sx) / sc),
            h: Math.round(Math.abs(py - sy) / sc),
          });
        }
        redrawOverlay();
      }

      canvas.onmousedown = function (e) {
        var p = canvasPos(canvas, e.clientX, e.clientY);
        start(p.x, p.y);
      };
      canvas.onmousemove = function (e) {
        var p = canvasPos(canvas, e.clientX, e.clientY);
        move(p.x, p.y);
      };
      canvas.onmouseup = function (e) {
        var p = canvasPos(canvas, e.clientX, e.clientY);
        end(p.x, p.y);
      };
      canvas.onmouseleave = function (e) {
        var p = canvasPos(canvas, e.clientX, e.clientY);
        end(p.x, p.y);
      };

      canvas.ontouchstart = function (e) {
        e.preventDefault();
        var p = canvasPos(canvas, e.touches[0].clientX, e.touches[0].clientY);
        start(p.x, p.y);
      };
      canvas.ontouchmove = function (e) {
        e.preventDefault();
        var p = canvasPos(canvas, e.touches[0].clientX, e.touches[0].clientY);
        move(p.x, p.y);
      };
      canvas.ontouchend = function (e) {
        e.preventDefault();
        var t = e.changedTouches[0];
        var p = canvasPos(canvas, t.clientX, t.clientY);
        end(p.x, p.y);
      };
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

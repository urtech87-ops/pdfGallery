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
  var _workCanvas = null; /* cumulative edit buffer — fills persist across runs */

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
    _workCanvas = null;
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
    /* Fills accumulate on a working canvas so the user can remove several
       objects in successive passes without losing earlier removals. */
    if (!_workCanvas) {
      _workCanvas = document.createElement('canvas');
      _workCanvas.width = img.naturalWidth;
      _workCanvas.height = img.naturalHeight;
      _workCanvas.getContext('2d').drawImage(img, 0, 0);
    }
    var ctx = _workCanvas.getContext('2d');
    var id = ctx.getImageData(0, 0, _workCanvas.width, _workCanvas.height);

    _selections.forEach(function (sel) {
      inpaintRegion(id, sel, _workCanvas.width, _workCanvas.height, options.blend || 8);
    });

    ctx.putImageData(id, 0, 0);

    /* Live result preview: show the filled image on the selection canvas
       and clear the used selections so the next drag starts fresh. */
    _selections = [];
    var previewCanvas = document.getElementById('iro-canvas');
    if (previewCanvas) {
      previewCanvas.getContext('2d').drawImage(_workCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
    }
    if (_redrawOverlay) _redrawOverlay();

    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(_workCanvas, 'image/jpeg', 0.95);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-removed.jpg' };
  }

  /* Onion-peel inpaint: fill the region from its boundary inward, each
     pixel taking the distance-weighted average of already-known neighbors,
     then run smoothing passes over the region to blend directional streaks.
     Much more seamless than flat box-averaging. */
  function inpaintRegion(id, rect, w, h, blend) {
    var d = id.data;
    var x1 = Math.max(0, rect.x), y1 = Math.max(0, rect.y);
    var x2 = Math.min(w - 1, rect.x + rect.w), y2 = Math.min(h - 1, rect.y + rect.h);
    if (x2 < x1 || y2 < y1) return;

    var known = new Uint8Array(w * h);
    known.fill(1);
    var x, y, i;
    for (y = y1; y <= y2; y++) {
      for (x = x1; x <= x2; x++) known[y * w + x] = 0;
    }

    /* Neighbor offsets with inverse-distance weights (8-connected) */
    var nbs = [
      [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
      [-1, -1, 0.7071], [1, -1, 0.7071], [-1, 1, 0.7071], [1, 1, 0.7071],
    ];

    /* Seed queue: unknown pixels touching a known pixel (region border) */
    var queue = [];
    var queued = new Uint8Array(w * h);
    for (y = y1; y <= y2; y++) {
      for (x = x1; x <= x2; x++) {
        i = y * w + x;
        for (var n = 0; n < nbs.length; n++) {
          var nx = x + nbs[n][0], ny = y + nbs[n][1];
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          if (known[ny * w + nx]) { queue.push(i); queued[i] = 1; break; }
        }
      }
    }

    /* Grow inward */
    var head = 0;
    while (head < queue.length) {
      i = queue[head++];
      x = i % w; y = (i / w) | 0;
      var rSum = 0, gSum = 0, bSum = 0, wSum = 0;
      for (var k = 0; k < nbs.length; k++) {
        var kx = x + nbs[k][0], ky = y + nbs[k][1];
        if (kx < 0 || kx >= w || ky < 0 || ky >= h) continue;
        var ki = ky * w + kx;
        if (!known[ki]) continue;
        var wt = nbs[k][2];
        var pi = ki * 4;
        rSum += d[pi] * wt; gSum += d[pi + 1] * wt; bSum += d[pi + 2] * wt;
        wSum += wt;
      }
      if (wSum > 0) {
        var oi = i * 4;
        d[oi] = rSum / wSum;
        d[oi + 1] = gSum / wSum;
        d[oi + 2] = bSum / wSum;
      }
      known[i] = 1;
      for (var m = 0; m < 4; m++) { // 4-connected growth keeps the front tight
        var mx = x + nbs[m][0], my = y + nbs[m][1];
        if (mx < x1 || mx > x2 || my < y1 || my > y2) continue;
        var mi = my * w + mx;
        if (!known[mi] && !queued[mi]) { queue.push(mi); queued[mi] = 1; }
      }
    }

    /* Smoothing passes over the filled region to blend onion rings.
       The blend slider controls how many passes run. */
    var passes = Math.max(1, Math.min(6, Math.round(blend / 4)));
    var buf = new Float32Array((x2 - x1 + 1) * (y2 - y1 + 1) * 3);
    for (var p = 0; p < passes; p++) {
      var bi = 0;
      for (y = y1; y <= y2; y++) {
        for (x = x1; x <= x2; x++) {
          var sr = 0, sg = 0, sb = 0, cnt = 0;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              var ax = x + dx, ay = y + dy;
              if (ax < 0 || ax >= w || ay < 0 || ay >= h) continue;
              var ai = (ay * w + ax) * 4;
              sr += d[ai]; sg += d[ai + 1]; sb += d[ai + 2]; cnt++;
            }
          }
          buf[bi++] = sr / cnt; buf[bi++] = sg / cnt; buf[bi++] = sb / cnt;
        }
      }
      bi = 0;
      for (y = y1; y <= y2; y++) {
        for (x = x1; x <= x2; x++) {
          var wi = (y * w + x) * 4;
          d[wi] = buf[bi++]; d[wi + 1] = buf[bi++]; d[wi + 2] = buf[bi++];
        }
      }
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Remove Objects from Image
 * Handler: img-remove-objects
 * URL: /tool/remove-image-objects/
 *
 * Unlike the three background tools, this one IS user-selected: you drag a
 * rectangle over the thing you want gone and the region is rebuilt from the
 * pixels around it. Same selection mechanics as img-remove-watermark
 * (pointer coordinates mapped through getBoundingClientRect, handlers
 * assigned rather than added so a re-mount never stacks them), with two
 * differences:
 *
 *   - the fill is edge-aware instead of a flat average of four samples:
 *     for every pixel it picks the axis along which the surrounding image
 *     is most continuous and interpolates along THAT, so a horizon, a
 *     table edge or a gradient carries across the hole instead of turning
 *     into a smudge;
 *   - the fill is applied the moment a rectangle is released, so the
 *     preview is live, and every removal can be undone.
 *
 * Undo replays: the edits are kept as rectangles and re-applied from the
 * original image, so undoing costs no snapshot memory on large photos.
 *
 * The canvas is sized inside img.onload, never before it.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-objects' };

  var _origImg = null;
  var _edits = [];          // rectangles removed so far, in order
  var _workCanvas = null;   // full-res result of replaying _edits
  var _redrawOverlay = null;
  var _repaintPreview = null;
  var _scale = 1;           // preview canvas px per image px

  var DEFAULT_BLEND = 8;

  function getOptionsHTML() {
    return '<p class="tg-opt-info" id="iro-status">Drag a rectangle over an object you want to remove. It is filled in from the surrounding pixels straight away, and you can remove several things one after another.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iro-blend">Blend strength: <span id="iro-blend-val">' + DEFAULT_BLEND + '</span></label>' +
      '<input type="range" id="iro-blend" min="0" max="30" value="' + DEFAULT_BLEND + '" style="flex:1">' +
    '</div>' +
    '<p class="tg-opt-info tg-opt-hint">More blending smooths the patch into its surroundings; less keeps more of the reconstructed detail.</p>' +
    '<div class="tg-img-tools-bar" id="iro-edit-bar" style="display:none">' +
      '<button type="button" class="tg-btn-secondary tg-btn-sm tg-img-tool-btn" id="iro-undo-btn" ' +
        'title="Undo the last removal">&#x21A9; Undo</button>' +
      '<button type="button" class="tg-btn-secondary tg-btn-sm tg-img-tool-btn" id="iro-reset-btn" ' +
        'title="Put every removed object back">&#x21BB; Reset all</button>' +
      '<span class="tg-opt-info" id="iro-count" style="margin:0"></span>' +
    '</div>' +
    '<div id="iro-canvas-wrap" class="tg-img-preview-frame tg-img-preview-frame--editor tg-img-preview-frame--flush" style="display:none;position:relative">' +
      '<canvas id="iro-canvas" style="display:block;cursor:crosshair;touch-action:none"></canvas>' +
      '<canvas id="iro-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    var sl = container.querySelector('#iro-blend');
    var sv = container.querySelector('#iro-blend-val');
    if (sl && sv) {
      var debounce = null;
      sl.addEventListener('input', function () {
        sv.textContent = sl.value;
        clearTimeout(debounce);
        /* Changing the blend re-applies every edit, so the slider is live
           rather than something that only shows up in the download. */
        debounce = setTimeout(function () { rebuild(); }, 180);
      });
    }

    var undo = container.querySelector('#iro-undo-btn');
    if (undo) undo.addEventListener('click', function () {
      if (!_edits.length) return;
      _edits.pop();
      rebuild();
    });

    var reset = container.querySelector('#iro-reset-btn');
    if (reset) reset.addEventListener('click', function () {
      if (!_edits.length) return;
      _edits = [];
      rebuild();
    });
  }

  function getOptions(optionsEl) {
    var el = optionsEl || document.querySelector('.tg-tool-box .tg-options') || document;
    var blend = el.querySelector('#iro-blend');
    return { blend: blend ? parseInt(blend.value, 10) : DEFAULT_BLEND };
  }

  function currentBlend() {
    var el = document.getElementById('iro-blend');
    return el ? parseInt(el.value, 10) : DEFAULT_BLEND;
  }

  function setStatus(msg) {
    var el = document.getElementById('iro-status');
    if (el) el.textContent = msg;
  }

  function updateCount() {
    var el = document.getElementById('iro-count');
    if (!el) return;
    el.textContent = _edits.length === 0
      ? 'Nothing removed yet'
      : _edits.length + (_edits.length === 1 ? ' object removed' : ' objects removed');
  }

  function canvasPos(canvas, clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width / r.width),
      y: (clientY - r.top) * (canvas.height / r.height),
    };
  }

  /* Replay every edit onto a clean copy of the original. Undo is just a
     pop followed by this, which keeps memory flat no matter how many
     removals the user makes on a large photo. */
  function rebuild() {
    if (!_origImg || !_workCanvas) return;
    var ctx = _workCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, _workCanvas.width, _workCanvas.height);
    ctx.drawImage(_origImg, 0, 0, _workCanvas.width, _workCanvas.height);

    if (_edits.length) {
      var id = ctx.getImageData(0, 0, _workCanvas.width, _workCanvas.height);
      var blend = currentBlend();
      _edits.forEach(function (rect) {
        inpaintRegion(id, rect, _workCanvas.width, _workCanvas.height, blend);
      });
      ctx.putImageData(id, 0, 0);
    }

    if (_repaintPreview) _repaintPreview();
    if (_redrawOverlay) _redrawOverlay();
    updateCount();
    setStatus(_edits.length
      ? 'Removed — drag another rectangle, undo, or download the result below.'
      : 'Drag a rectangle over an object you want to remove. It is filled in from the surrounding pixels straight away.');
  }

  function mountEditor() {
    if (!_origImg) return;
    var wrap = document.getElementById('iro-canvas-wrap');
    var canvas = document.getElementById('iro-canvas');
    var overlay = document.getElementById('iro-overlay');
    var bar = document.getElementById('iro-edit-bar');
    if (!wrap || !canvas || !overlay) return;

    var sw = _origImg.naturalWidth;
    var sh = _origImg.naturalHeight;
    var maxW = Math.min(700, window.innerWidth - 40);
    _scale = Math.min(1, maxW / sw);
    var dw = Math.max(1, Math.round(sw * _scale));
    var dh = Math.max(1, Math.round(sh * _scale));

    /* Sized here — after the image loaded — then drawn. */
    canvas.width = dw;
    canvas.height = dh;
    overlay.width = dw;
    overlay.height = dh;
    wrap.style.display = 'block';
    wrap.style.width = dw + 'px';
    if (bar) bar.style.display = 'flex';

    _repaintPreview = function () {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, dw, dh);
      ctx.drawImage(_workCanvas, 0, 0, dw, dh);
    };
    _repaintPreview();

    function redrawOverlay(liveRect) {
      var octx = overlay.getContext('2d');
      octx.clearRect(0, 0, dw, dh);
      if (liveRect) {
        octx.strokeStyle = '#E07B39';
        octx.fillStyle = 'rgba(224,123,57,0.3)';
        octx.lineWidth = 2;
        octx.setLineDash([5, 3]);
        octx.fillRect(liveRect.x, liveRect.y, liveRect.w, liveRect.h);
        octx.strokeRect(liveRect.x, liveRect.y, liveRect.w, liveRect.h);
        octx.setLineDash([]);
      }
    }
    _redrawOverlay = redrawOverlay;
    redrawOverlay();
    updateCount();

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
        _edits.push({
          x: Math.round(Math.min(sx, px) / _scale),
          y: Math.round(Math.min(sy, py) / _scale),
          w: Math.round(Math.abs(px - sx) / _scale),
          h: Math.round(Math.abs(py - sy) / _scale),
        });
        /* Applied immediately — the preview IS the result. */
        rebuild();
      }
      redrawOverlay();
    }

    /* Assigned, not addEventListener, so a re-mount replaces these
       handlers instead of stacking a second set on the canvas. */
    canvas.onmousedown = function (e) { var p = canvasPos(canvas, e.clientX, e.clientY); start(p.x, p.y); };
    canvas.onmousemove = function (e) { var p = canvasPos(canvas, e.clientX, e.clientY); move(p.x, p.y); };
    canvas.onmouseup = function (e) { var p = canvasPos(canvas, e.clientX, e.clientY); end(p.x, p.y); };
    canvas.onmouseleave = function (e) { var p = canvasPos(canvas, e.clientX, e.clientY); end(p.x, p.y); };

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
  }

  function onFileReady(file) {
    _origImg = null;
    _edits = [];
    _workCanvas = null;
    _repaintPreview = null;
    _redrawOverlay = null;
    if (!file) return;

    var img = new Image();
    var objectUrl = URL.createObjectURL(file);

    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      _origImg = img;
      /* Full-res edit buffer, sized from the LOADED image. */
      _workCanvas = document.createElement('canvas');
      _workCanvas.width = img.naturalWidth;
      _workCanvas.height = img.naturalHeight;
      _workCanvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);
      mountEditor();
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
    if (!_origImg) {
      _origImg = await TGImageUtil.loadImage(file);
      _workCanvas = document.createElement('canvas');
      _workCanvas.width = _origImg.naturalWidth;
      _workCanvas.height = _origImg.naturalHeight;
      _workCanvas.getContext('2d', { willReadFrequently: true }).drawImage(_origImg, 0, 0);
    }
    if (_edits.length === 0) {
      throw new Error('Please drag a rectangle over the object to remove, then click the button again.');
    }

    /* The preview already holds the finished result; only re-apply if the
       blend option differs from what is on screen. */
    onProgress && onProgress(0.6, 'Removing objects...');
    if (options.blend !== currentBlend()) rebuild();

    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(_workCanvas, 'image/jpeg', 0.95);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-removed.jpg' };
  }

  /**
   * Edge-aware fill.
   *
   * The watermark tool averages four samples taken straight out from the
   * rectangle, which flattens anything crossing the hole. Here, for each
   * pixel, four axes are considered — horizontal, vertical and both
   * diagonals. Along each axis the two pixels where that line leaves the
   * rectangle are read (both OUTSIDE the rectangle, so they are always
   * original pixels, never something written by this same pass, and both
   * found by arithmetic rather than by walking). The axis whose two ends
   * agree most closely is the direction along which the picture is most
   * continuous, so interpolating along it carries a horizon or a gradient
   * through the hole instead of blurring across it.
   */
  function inpaintRegion(id, rect, w, h, blend) {
    var d = id.data;
    var x1 = Math.max(0, rect.x), y1 = Math.max(0, rect.y);
    var x2 = Math.min(w - 1, rect.x + rect.w), y2 = Math.min(h - 1, rect.y + rect.h);
    if (x2 < x1 || y2 < y1) return;

    var x, y;
    var fill = new Float32Array((x2 - x1 + 1) * (y2 - y1 + 1) * 3);
    var rw = x2 - x1 + 1;

    function sample(px, py) {
      /* Only pixels outside the rectangle count as known. */
      if (px < 0 || px >= w || py < 0 || py >= h) return null;
      if (px >= x1 && px <= x2 && py >= y1 && py <= y2) return null;
      var o = (py * w + px) * 4;
      return [d[o], d[o + 1], d[o + 2]];
    }

    for (y = y1; y <= y2; y++) {
      for (x = x1; x <= x2; x++) {
        /* Each entry: [aPoint, aDist, bPoint, bDist] for one axis. */
        var axes = [
          [[x2 + 1, y], x2 + 1 - x, [x1 - 1, y], x - x1 + 1],
          [[x, y2 + 1], y2 + 1 - y, [x, y1 - 1], y - y1 + 1],
          null, null,
        ];
        var tf = Math.min(x2 + 1 - x, y2 + 1 - y);
        var tb = Math.min(x - x1 + 1, y - y1 + 1);
        axes[2] = [[x + tf, y + tf], tf, [x - tb, y - tb], tb];
        var tf2 = Math.min(x2 + 1 - x, y - y1 + 1);
        var tb2 = Math.min(x - x1 + 1, y2 + 1 - y);
        axes[3] = [[x + tf2, y - tf2], tf2, [x - tb2, y + tb2], tb2];

        var bestDiff = Infinity, bestVal = null, fallback = null, fbWeight = 0;
        for (var a = 0; a < axes.length; a++) {
          var ax = axes[a];
          var A = sample(ax[0][0], ax[0][1]);
          var B = sample(ax[2][0], ax[2][1]);
          if (!A && !B) continue;
          if (!A || !B) {
            /* Only one side available (the rectangle runs off the image);
               usable, but never preferred over a two-sided axis. */
            var only = A || B;
            if (!fallback) fallback = [0, 0, 0];
            fallback[0] += only[0]; fallback[1] += only[1]; fallback[2] += only[2];
            fbWeight++;
            continue;
          }
          var dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2];
          var diff = dr * dr + dg * dg + db * db;
          if (diff < bestDiff) {
            bestDiff = diff;
            var da = ax[1], dbst = ax[3];
            var total = da + dbst;
            var wa = total ? dbst / total : 0.5;   // nearer end weighs more
            var wb = 1 - wa;
            bestVal = [
              A[0] * wa + B[0] * wb,
              A[1] * wa + B[1] * wb,
              A[2] * wa + B[2] * wb,
            ];
          }
        }

        if (!bestVal && fallback && fbWeight) {
          bestVal = [fallback[0] / fbWeight, fallback[1] / fbWeight, fallback[2] / fbWeight];
        }
        if (!bestVal) continue; // rectangle covers the whole image

        var fi = ((y - y1) * rw + (x - x1)) * 3;
        fill[fi] = bestVal[0]; fill[fi + 1] = bestVal[1]; fill[fi + 2] = bestVal[2];
      }
    }

    /* Write the reconstruction in one go — nothing above read a pixel it
       had written, so there are no onion rings to smooth away. */
    for (y = y1; y <= y2; y++) {
      for (x = x1; x <= x2; x++) {
        var si = ((y - y1) * rw + (x - x1)) * 3;
        var oi = (y * w + x) * 4;
        d[oi] = fill[si];
        d[oi + 1] = fill[si + 1];
        d[oi + 2] = fill[si + 2];
        d[oi + 3] = 255;
      }
    }

    /* Optional softening so the four axes do not leave visible creases
       where the chosen direction changes. Kept small — the point of the
       edge-aware pass is the structure it recovers. */
    var passes = Math.max(0, Math.min(4, Math.round(blend / 8)));
    if (!passes) return;
    var buf = new Float32Array(rw * (y2 - y1 + 1) * 3);
    for (var p = 0; p < passes; p++) {
      var bi = 0;
      for (y = y1; y <= y2; y++) {
        for (x = x1; x <= x2; x++) {
          var sr = 0, sg = 0, sb = 0, cnt = 0;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              var nx = x + dx, ny = y + dy;
              if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
              var ni = (ny * w + nx) * 4;
              sr += d[ni]; sg += d[ni + 1]; sb += d[ni + 2]; cnt++;
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

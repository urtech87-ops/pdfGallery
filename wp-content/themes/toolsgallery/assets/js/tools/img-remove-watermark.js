/**
 * ToolsGallery — Remove Watermark
 * Handler: img-remove-watermark
 * URL: /tool/remove-watermark/
 *
 * The preview draws only after the image's onload fires (canvas sized
 * after load, never before). Pointer coordinates are mapped through
 * getBoundingClientRect so selections stay accurate when CSS shrinks
 * the canvas, and the selection rectangle now draws live while dragging.
 *
 * Selections are held in the working image's own pixel coordinates, so a
 * rotate turns them through the same 90° as the picture — no rectangle is
 * ever left pointing at the previous orientation.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-watermark' };

  var _selections = [];
  var _origImg = null;   // the image as uploaded
  var _src = null;       // working source — a rotated canvas once _rot !== 0
  var _rot = 0;
  var _redrawOverlay = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info">Draw rectangles over the watermark area(s). The tool will fill them with surrounding colors to blend seamlessly.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="irw-feather">Feather Edges: <span id="irw-feather-val">3</span>px</label>' +
      '<input type="range" id="irw-feather" min="0" max="20" value="3" style="flex:1">' +
    '</div>' +
    TGImgTools.barHTML('irw',
      '<button type="button" class="tg-btn-secondary tg-btn-sm tg-img-tool-btn" id="irw-clear-sel-btn" ' +
        'title="Remove the rectangles you drew, keeping the image">Clear Selections</button>') +
    '<div id="irw-canvas-wrap" class="tg-img-preview-frame tg-img-preview-frame--editor tg-img-preview-frame--flush" style="display:none;position:relative">' +
      '<canvas id="irw-canvas" style="cursor:crosshair;touch-action:none"></canvas>' +
      '<canvas id="irw-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    var sl = container.querySelector('#irw-feather');
    var sv = container.querySelector('#irw-feather-val');
    if (sl && sv) sl.addEventListener('input', function () { sv.textContent = sl.value; });

    var clr = container.querySelector('#irw-clear-sel-btn');
    if (clr) clr.addEventListener('click', function () {
      _selections = [];
      if (_redrawOverlay) _redrawOverlay();
    });

    TGImgTools.wire(container, 'irw', {
      onRotate: function () {
        if (!_origImg) return;
        var oldH = TGImgTools.h(_src);
        _rot = (_rot + 90) % 360;
        _src = TGImgTools.rotate(_origImg, _rot);
        rotateSelections(oldH);
        mountEditor();
      },
      onClear: function () {
        _origImg = null; _src = null; _rot = 0;
        _selections = []; _redrawOverlay = null;
      },
    });
  }

  /* Turn every selection 90° clockwise with the image: a point (x,y)
     lands at (oldHeight - y, x), so a rectangle's top-left corner
     becomes its top-right one. */
  function rotateSelections(oldHeight) {
    _selections = _selections.map(function (s) {
      return { x: oldHeight - (s.y + s.h), y: s.x, w: s.h, h: s.w };
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var feather = optionsEl.querySelector('#irw-feather');
    return { feather: feather ? parseInt(feather.value, 10) : 3 };
  }

  function canvasPos(canvas, clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width / r.width),
      y: (clientY - r.top) * (canvas.height / r.height),
    };
  }

  /* Size both canvases from the CURRENT working source and re-wire the
     drawing handlers. Called on upload and after every rotate. */
  function mountEditor() {
    if (!_src) return;
    var wrap = document.getElementById('irw-canvas-wrap');
    var canvas = document.getElementById('irw-canvas');
    var overlay = document.getElementById('irw-overlay');
    if (!wrap || !canvas || !overlay) return;

    var sw = TGImgTools.w(_src);
    var sh = TGImgTools.h(_src);
    var maxW = Math.min(700, window.innerWidth - 40);
    var sc = Math.min(1, maxW / sw);
    var dw = Math.max(1, Math.round(sw * sc));
    var dh = Math.max(1, Math.round(sh * sc));

    canvas.width = dw;
    canvas.height = dh;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dw, dh);
    ctx.drawImage(_src, 0, 0, dw, dh);

    overlay.width = dw;
    overlay.height = dh;
    wrap.style.display = 'block';
    TGImgTools.show('irw', true);

    function drawRect(octx, x, y, w, h) {
      octx.fillRect(x, y, w, h);
      octx.strokeRect(x, y, w, h);
    }

    function redrawOverlay(liveRect) {
      var octx = overlay.getContext('2d');
      octx.clearRect(0, 0, dw, dh);
      octx.strokeStyle = '#E07B39';
      octx.fillStyle = 'rgba(224,123,57,0.3)';
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

    /* Assigned, not addEventListener: a re-mount after a rotate replaces
       these handlers instead of stacking a second set on the canvas. */
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
  }

  function onFileReady(file) {
    _origImg = null;
    _src = null;
    _rot = 0;
    _selections = [];
    if (!file) return;

    var img = new Image();
    var objectUrl = URL.createObjectURL(file);

    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      _origImg = img;
      _src = img;
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
    if (!_src) {
      _origImg = await TGImageUtil.loadImage(file);
      _src = TGImgTools.rotate(_origImg, _rot);
    }
    if (_selections.length === 0) {
      throw new Error('Please draw a rectangle over the watermark first, then click the button again.');
    }

    onProgress && onProgress(0.6, 'Removing watermark...');
    var canvas = document.createElement('canvas');
    canvas.width = TGImgTools.w(_src);
    canvas.height = TGImgTools.h(_src);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(_src, 0, 0, canvas.width, canvas.height);
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);

    _selections.forEach(function (sel) {
      inpaintRegion(id, sel, canvas.width, canvas.height, options.feather || 3);
    });

    ctx.putImageData(id, 0, 0);
    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.95);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-no-watermark.jpg' };
  }

  function inpaintRegion(id, rect, w, h, feather) {
    var d = id.data;
    var x1 = Math.max(0, rect.x), y1 = Math.max(0, rect.y);
    var x2 = Math.min(w - 1, rect.x + rect.w);
    var y2 = Math.min(h - 1, rect.y + rect.h);
    var sample = feather + 4;

    for (var y = y1; y <= y2; y++) {
      for (var x = x1; x <= x2; x++) {
        // Sample surrounding pixels
        var r = 0, g = 0, b = 0, cnt = 0;
        var positions = [
          [x, Math.max(0, y1 - sample)], [x, Math.min(h - 1, y2 + sample)],
          [Math.max(0, x1 - sample), y], [Math.min(w - 1, x2 + sample), y],
        ];
        positions.forEach(function (pos) {
          var idx = (pos[1] * w + pos[0]) * 4;
          r += d[idx]; g += d[idx + 1]; b += d[idx + 2]; cnt++;
        });
        var i = (y * w + x) * 4;
        d[i] = Math.round(r / cnt);
        d[i + 1] = Math.round(g / cnt);
        d[i + 2] = Math.round(b / cnt);
      }
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

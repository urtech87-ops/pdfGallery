/**
 * ToolsGallery — Change Image Background
 * Handler: img-change-bg
 * URL: /tool/change-background/
 *
 * The preview draws only after the image's onload fires (canvas sized
 * after load, never before). Pointer coordinates are mapped through
 * getBoundingClientRect so the subject selection stays accurate when
 * CSS shrinks the canvas, and the selection stays visible after drawing.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-change-bg' };
  var _subjectRect = null;
  var _origImg = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info">Draw a rectangle around the subject you want to keep. Then choose a new background.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Background</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="icb-bg" value="color" checked> Solid Color</label>' +
        '<label><input type="radio" name="icb-bg" value="image"> Upload Image</label>' +
        '<label><input type="radio" name="icb-bg" value="gradient"> Gradient</label>' +
      '</div>' +
    '</div>' +
    '<div id="icb-color-wrap" class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icb-color">Color</label>' +
      '<input type="color" id="icb-color" value="#4a90e2">' +
    '</div>' +
    '<div id="icb-image-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label">Background Image</label>' +
      '<input type="file" id="icb-bg-file" accept="image/*" class="tg-text-input">' +
    '</div>' +
    '<div id="icb-gradient-wrap" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="icb-grad1">Color 1</label>' +
        '<input type="color" id="icb-grad1" value="#667eea">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="icb-grad2">Color 2</label>' +
        '<input type="color" id="icb-grad2" value="#764ba2">' +
      '</div>' +
    '</div>' +
    '<div id="icb-canvas-wrap" style="margin-top:12px;display:none;position:relative;max-width:100%">' +
      '<canvas id="icb-canvas" style="display:block;width:100%;height:auto;cursor:crosshair;border:1px solid #ddd;border-radius:4px;touch-action:none"></canvas>' +
      '<canvas id="icb-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    container.querySelectorAll('input[name="icb-bg"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var colorWrap = container.querySelector('#icb-color-wrap');
        var imageWrap = container.querySelector('#icb-image-wrap');
        var gradWrap = container.querySelector('#icb-gradient-wrap');
        if (colorWrap) colorWrap.hidden = r.value !== 'color';
        if (imageWrap) imageWrap.hidden = r.value !== 'image';
        if (gradWrap) gradWrap.hidden = r.value !== 'gradient';
      });
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var bgType = optionsEl.querySelector('input[name="icb-bg"]:checked');
    var color = optionsEl.querySelector('#icb-color');
    var bgFile = optionsEl.querySelector('#icb-bg-file');
    var grad1 = optionsEl.querySelector('#icb-grad1');
    var grad2 = optionsEl.querySelector('#icb-grad2');
    return {
      bgType: bgType ? bgType.value : 'color',
      color: color ? color.value : '#4a90e2',
      bgFile: bgFile && bgFile.files ? bgFile.files[0] : null,
      grad1: grad1 ? grad1.value : '#667eea',
      grad2: grad2 ? grad2.value : '#764ba2',
    };
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
    _subjectRect = null;
    if (!file) return;

    var img = new Image();
    var objectUrl = URL.createObjectURL(file);

    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      _origImg = img;

      var wrap = document.getElementById('icb-canvas-wrap');
      var canvas = document.getElementById('icb-canvas');
      var overlay = document.getElementById('icb-overlay');
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

      function drawSelection(x, y, w, h) {
        var octx = overlay.getContext('2d');
        octx.clearRect(0, 0, dw, dh);
        if (w <= 0 || h <= 0) return;
        octx.strokeStyle = '#00cc00';
        octx.lineWidth = 2;
        octx.setLineDash([5, 3]);
        octx.strokeRect(x, y, w, h);
        octx.fillStyle = 'rgba(0,200,0,0.1)';
        octx.fillRect(x, y, w, h);
        octx.setLineDash([]);
      }

      var drawing = false, sx = 0, sy = 0;

      function start(px, py) { drawing = true; sx = px; sy = py; }
      function move(px, py) {
        if (!drawing) return;
        drawSelection(Math.min(sx, px), Math.min(sy, py), Math.abs(px - sx), Math.abs(py - sy));
      }
      function end(px, py) {
        if (!drawing) return;
        drawing = false;
        if (Math.abs(px - sx) > 10 && Math.abs(py - sy) > 10) {
          _subjectRect = {
            x: Math.round(Math.min(sx, px) / sc),
            y: Math.round(Math.min(sy, py) / sc),
            w: Math.round(Math.abs(px - sx) / sc),
            h: Math.round(Math.abs(py - sy) / sc),
          };
          // Keep the final selection visible
          drawSelection(Math.min(sx, px), Math.min(sy, py), Math.abs(px - sx), Math.abs(py - sy));
        } else if (_subjectRect) {
          drawSelection(_subjectRect.x * sc, _subjectRect.y * sc, _subjectRect.w * sc, _subjectRect.h * sc);
        }
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
    if (!_subjectRect) {
      throw new Error('Please draw a rectangle around the subject first, then click the button again.');
    }

    onProgress && onProgress(0.6, 'Compositing...');
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');

    // Draw new background
    if (options.bgType === 'gradient') {
      var grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, options.grad1);
      grad.addColorStop(1, options.grad2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (options.bgType === 'image' && options.bgFile) {
      var bgImg = await TGImageUtil.loadImage(options.bgFile);
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = options.color || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw subject on top
    var rect = _subjectRect;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);

    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-new-bg.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

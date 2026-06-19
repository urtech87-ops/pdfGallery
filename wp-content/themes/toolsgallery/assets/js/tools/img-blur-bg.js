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
    '<p class="tg-opt-info">After loading your image, draw a rectangle around the subject you want to keep sharp. The background will be blurred.</p>' +
    '<div id="ibb-canvas-wrap" style="margin-top:12px;display:none;position:relative;overflow:hidden">' +
      '<canvas id="ibb-canvas" style="display:block;max-width:100%;cursor:crosshair;border:1px solid #ddd;border-radius:4px"></canvas>' +
      '<canvas id="ibb-overlay" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>' +
    '</div>' +
    '<p id="ibb-hint" class="tg-opt-info" style="margin-top:6px;display:none">Draw a rectangle around your subject, then click the action button.</p>' +
    '<script>(function(){' +
      'var sl=document.getElementById("ibb-blur"),sv=document.getElementById("ibb-blur-val");' +
      'if(sl&&sv)sl.addEventListener("input",function(){sv.textContent=sl.value;});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var blur = optionsEl.querySelector('#ibb-blur');
    return { blur: blur ? parseInt(blur.value) : 10 };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');

    return new Promise(function (resolve, reject) {
      if (_origImg && _selectionRect && window._ibbFile === file) {
        // Second call: apply blur
        applyBlur(_origImg, _selectionRect, options.blur, file, resolve, reject, onProgress);
        return;
      }

      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        _origImg = img;
        window._ibbFile = file;
        _selectionRect = null;

        var wrap = document.getElementById('ibb-canvas-wrap');
        var canvas = document.getElementById('ibb-canvas');
        var overlay = document.getElementById('ibb-overlay');
        var hint = document.getElementById('ibb-hint');

        if (!wrap || !canvas || !overlay) {
          // No UI, just blur entire image as fallback
          applyBlur(img, { x: 0, y: 0, w: img.width, h: img.height }, options.blur, file, resolve, reject, onProgress);
          return;
        }

        var maxW = Math.min(700, window.innerWidth - 40);
        var sc = Math.min(1, maxW / img.width);
        var dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);

        canvas.width = dw; canvas.height = dh;
        canvas.getContext('2d').drawImage(img, 0, 0, dw, dh);
        overlay.width = dw; overlay.height = dh;
        overlay.style.width = dw + 'px'; overlay.style.height = dh + 'px';
        wrap.style.display = 'block';
        wrap.style.width = dw + 'px'; wrap.style.height = dh + 'px';
        if (hint) hint.style.display = 'block';

        // Draw selection
        var drawing = false, sx = 0, sy = 0, ex = 0, ey = 0;
        canvas.addEventListener('mousedown', function (e) {
          var r = canvas.getBoundingClientRect();
          sx = (e.clientX - r.left); sy = (e.clientY - r.top);
          drawing = true;
        });
        canvas.addEventListener('mousemove', function (e) {
          if (!drawing) return;
          var r = canvas.getBoundingClientRect();
          ex = (e.clientX - r.left); ey = (e.clientY - r.top);
          var octx = overlay.getContext('2d');
          octx.clearRect(0, 0, dw, dh);
          octx.strokeStyle = '#E07B39';
          octx.lineWidth = 2;
          octx.setLineDash([5, 3]);
          octx.strokeRect(sx, sy, ex - sx, ey - sy);
          octx.fillStyle = 'rgba(224,123,57,0.1)';
          octx.fillRect(sx, sy, ex - sx, ey - sy);
        });
        canvas.addEventListener('mouseup', function () {
          drawing = false;
          if (Math.abs(ex - sx) > 10 && Math.abs(ey - sy) > 10) {
            _selectionRect = {
              x: Math.round(Math.min(sx, ex) / sc),
              y: Math.round(Math.min(sy, ey) / sc),
              w: Math.round(Math.abs(ex - sx) / sc),
              h: Math.round(Math.abs(ey - sy) / sc),
            };
          }
        });

        onProgress && onProgress(0.5, 'Draw a rectangle around your subject, then click the button.');
        resolve({ _waitForSelection: true, file: file, options: options });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    }).then(function (r) {
      if (r && r._waitForSelection) {
        if (!_selectionRect) throw new Error('Please draw a rectangle around your subject first.');
        return new Promise(function (res, rej) {
          applyBlur(_origImg, _selectionRect, r.options.blur, r.file, res, rej, function(){});
        });
      }
      return r;
    });
  }

  function applyBlur(img, rect, blurPx, file, resolve, reject, onProgress) {
    onProgress && onProgress(0.7, 'Applying blur...');

    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');

    // Draw full image with CSS blur
    var blurCanvas = document.createElement('canvas');
    blurCanvas.width = img.width; blurCanvas.height = img.height;
    var bCtx = blurCanvas.getContext('2d');
    bCtx.filter = 'blur(' + blurPx + 'px)';
    bCtx.drawImage(img, 0, 0);
    bCtx.filter = 'none';

    // Draw blurred version
    ctx.drawImage(blurCanvas, 0, 0);

    // Draw original subject on top (clipped to selection)
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);

    var base = file.name.replace(/\.[^.]+$/, '');
    canvas.toBlob(function (blob) {
      if (!blob) { reject(new Error('Failed')); return; }
      onProgress && onProgress(1, 'Done!');
      resolve({ blob: blob, filename: base + '-blurred-bg.jpg' });
    }, 'image/jpeg', 0.92);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

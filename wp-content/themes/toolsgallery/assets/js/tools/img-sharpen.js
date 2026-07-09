/**
 * ToolsGallery — Sharpen Image
 * Handler: img-sharpen
 * URL: /tool/sharpen-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-sharpen' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="is-intensity">Intensity: <span id="is-intensity-val">3</span></label>' +
      '<input type="range" id="is-intensity" min="1" max="10" value="3" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Method</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="is-method" value="standard" checked> Standard</label>' +
        '<label><input type="radio" name="is-method" value="strong"> Strong</label>' +
        '<label><input type="radio" name="is-method" value="edge"> Edge Enhance</label>' +
      '</div>' +
    '</div>' +
    '<div id="is-compare-wrap" style="margin-top:12px;display:none">' +
      '<p style="margin:0 0 6px;font-size:12px;font-weight:600">Before / After (drag divider)</p>' +
      '<div id="is-compare-container" style="position:relative;overflow:hidden;border:1px solid #ddd;border-radius:4px;cursor:col-resize;user-select:none">' +
        '<canvas id="is-after-canvas" style="display:block;max-width:100%"></canvas>' +
        '<div id="is-before-overlay" style="position:absolute;top:0;left:0;overflow:hidden;pointer-events:none">' +
          '<canvas id="is-before-canvas"></canvas>' +
        '</div>' +
        '<div id="is-divider" style="position:absolute;top:0;left:50%;width:3px;height:100%;background:#E07B39;cursor:col-resize;transform:translateX(-50%)">' +
          '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#E07B39;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px">⟺</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '';
  }

  function wireOptions(container) {
    var sl = container.querySelector('#is-intensity');
    var vl = container.querySelector('#is-intensity-val');
    if (sl && vl) sl.addEventListener('input', function () { vl.textContent = sl.value; });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var intensity = optionsEl.querySelector('#is-intensity');
    var method = optionsEl.querySelector('input[name="is-method"]:checked');
    return {
      intensity: intensity ? parseInt(intensity.value) : 3,
      method: method ? method.value : 'standard',
    };
  }

  function applyConvolution(canvas, kernel) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var src = ctx.getImageData(0, 0, w, h);
    var dst = ctx.createImageData(w, h);
    var s = src.data, d = dst.data;

    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        for (var c = 0; c < 3; c++) {
          var sum = 0;
          for (var ky = -1; ky <= 1; ky++) {
            for (var kx = -1; kx <= 1; kx++) {
              var idx = ((y + ky) * w + (x + kx)) * 4 + c;
              sum += s[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          var pos = (y * w + x) * 4 + c;
          d[pos] = Math.max(0, Math.min(255, sum));
        }
        d[(y * w + x) * 4 + 3] = s[(y * w + x) * 4 + 3];
      }
    }
    ctx.putImageData(dst, 0, 0);
  }

  function buildKernel(method, intensity) {
    /* Kernel must sum to 1 to preserve brightness: center = 1 + n*a,
       neighbors = -a, where n is the neighbor count. */
    var a = intensity * 0.3;
    if (method === 'strong') {
      return [-a, -a, -a, -a, 1 + 8 * a, -a, -a, -a, -a];
    }
    if (method === 'edge') {
      a = intensity * 0.5;
    }
    return [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0];
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        onProgress && onProgress(0.4, 'Sharpening...');

        // Original canvas
        var origCanvas = document.createElement('canvas');
        origCanvas.width = img.width; origCanvas.height = img.height;
        origCanvas.getContext('2d').drawImage(img, 0, 0);

        // Sharpen canvas
        var sharpCanvas = document.createElement('canvas');
        sharpCanvas.width = img.width; sharpCanvas.height = img.height;
        sharpCanvas.getContext('2d').drawImage(img, 0, 0);

        var kernel = buildKernel(options.method, options.intensity);
        applyConvolution(sharpCanvas, kernel);

        // Setup before/after comparison slider
        var compareWrap = document.getElementById('is-compare-wrap');
        var container = document.getElementById('is-compare-container');
        var afterCanvas = document.getElementById('is-after-canvas');
        var beforeCanvas = document.getElementById('is-before-canvas');
        var beforeOverlay = document.getElementById('is-before-overlay');
        var divider = document.getElementById('is-divider');

        if (compareWrap && afterCanvas && beforeCanvas) {
          var maxW = Math.min(600, window.innerWidth - 40);
          var sc = Math.min(1, maxW / img.width);
          var dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);

          afterCanvas.width = dw; afterCanvas.height = dh;
          afterCanvas.getContext('2d').drawImage(sharpCanvas, 0, 0, dw, dh);
          afterCanvas.style.width = dw + 'px'; afterCanvas.style.height = dh + 'px';

          beforeCanvas.width = dw; beforeCanvas.height = dh;
          beforeCanvas.getContext('2d').drawImage(origCanvas, 0, 0, dw, dh);
          beforeCanvas.style.width = dw + 'px';

          container.style.width = dw + 'px'; container.style.height = dh + 'px';
          beforeOverlay.style.width = (dw / 2) + 'px'; beforeOverlay.style.height = dh + 'px';

          compareWrap.style.display = 'block';

          // Drag handler
          var dragging = false;
          container.addEventListener('mousedown', function () { dragging = true; });
          document.addEventListener('mouseup', function () { dragging = false; });
          container.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            var rect = container.getBoundingClientRect();
            var x = Math.max(0, Math.min(dw, e.clientX - rect.left));
            beforeOverlay.style.width = x + 'px';
            divider.style.left = x + 'px';
          });
          container.addEventListener('touchmove', function (e) {
            e.preventDefault();
            var rect = container.getBoundingClientRect();
            var x = Math.max(0, Math.min(dw, e.touches[0].clientX - rect.left));
            beforeOverlay.style.width = x + 'px';
            divider.style.left = x + 'px';
          }, { passive: false });
        }

        var base = file.name.replace(/\.[^.]+$/, '');
        sharpCanvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-sharpened.jpg' });
        }, 'image/jpeg', 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

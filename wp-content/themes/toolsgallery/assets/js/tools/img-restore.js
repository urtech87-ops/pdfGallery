/**
 * ToolsGallery — Restore Old Photo
 * Handler: img-restore
 * URL: /tool/restore-photo/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-restore' };

  function getOptionsHTML() {
    return '<div style="margin-bottom:12px">' +
      '<button type="button" class="tg-btn-secondary" id="irt-auto-btn" style="font-weight:600">Auto Enhance</button>' +
      '<span class="tg-opt-info" style="margin-left:8px">Apply all enhancements automatically</span>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="irt-contrast">Contrast: <span id="irt-contrast-val">20</span></label>' +
      '<input type="range" id="irt-contrast" min="-100" max="100" value="20" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="irt-brightness">Brightness: <span id="irt-brightness-val">10</span></label>' +
      '<input type="range" id="irt-brightness" min="-100" max="100" value="10" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="irt-sharpness">Sharpness: <span id="irt-sharpness-val">3</span></label>' +
      '<input type="range" id="irt-sharpness" min="0" max="10" value="3" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="irt-saturation">Saturation: <span id="irt-saturation-val">20</span></label>' +
      '<input type="range" id="irt-saturation" min="-100" max="100" value="20" style="flex:1">' +
    '</div>' +
    '<div id="irt-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Before</p><canvas id="irt-before" style="max-width:200px;border:1px solid #ddd"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">After</p><canvas id="irt-after" style="max-width:200px;border:1px solid #ddd"></canvas></div>' +
      '</div>' +
    '</div>' +
    '';
  }

  function wireOptions(container) {
    function link(id, vid) {
      var s = container.querySelector('#' + id);
      var v = container.querySelector('#' + vid);
      if (s && v) s.addEventListener('input', function () { v.textContent = s.value; });
    }
    link('irt-contrast', 'irt-contrast-val');
    link('irt-brightness', 'irt-brightness-val');
    link('irt-sharpness', 'irt-sharpness-val');
    link('irt-saturation', 'irt-saturation-val');
    var autoBtn = container.querySelector('#irt-auto-btn');
    if (autoBtn) autoBtn.addEventListener('click', function () {
      var fields = { 'irt-contrast': '20', 'irt-brightness': '10', 'irt-sharpness': '3', 'irt-saturation': '20' };
      Object.keys(fields).forEach(function (id) {
        var el = container.querySelector('#' + id);
        var vel = container.querySelector('#' + id + '-val');
        if (el) { el.value = fields[id]; if (vel) vel.textContent = fields[id]; }
      });
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    function getVal(id, def) { var el = optionsEl.querySelector('#' + id); return el ? parseInt(el.value) : def; }
    return {
      contrast: getVal('irt-contrast', 20),
      brightness: getVal('irt-brightness', 10),
      sharpness: getVal('irt-sharpness', 3),
      saturation: getVal('irt-saturation', 20),
    };
  }

  function applyRestore(img, options) {
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var d = id.data;

    var cFactor = options.contrast !== 0 ? (259 * (options.contrast + 255)) / (255 * (259 - options.contrast)) : 1;
    var bOffset = options.brightness;

    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], g = d[i+1], b = d[i+2];

      // Brightness
      r += bOffset; g += bOffset; b += bOffset;

      // Contrast
      if (options.contrast !== 0) {
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
      }

      // Saturation
      if (options.saturation !== 0) {
        var gray = 0.299 * r + 0.587 * g + 0.114 * b;
        var sat = options.saturation / 100;
        r = gray + (r - gray) * (1 + sat);
        g = gray + (g - gray) * (1 + sat);
        b = gray + (b - gray) * (1 + sat);
      }

      d[i]   = Math.max(0, Math.min(255, r));
      d[i+1] = Math.max(0, Math.min(255, g));
      d[i+2] = Math.max(0, Math.min(255, b));
    }
    ctx.putImageData(id, 0, 0);

    // Sharpness
    if (options.sharpness > 0) {
      var sharpCanvas = document.createElement('canvas');
      sharpCanvas.width = canvas.width; sharpCanvas.height = canvas.height;
      sharpCanvas.getContext('2d').drawImage(canvas, 0, 0);
      var kernel = [0,-options.sharpness,0,-options.sharpness,1+4*options.sharpness,-options.sharpness,0,-options.sharpness,0];
      applyKernel(sharpCanvas, kernel);
      return sharpCanvas;
    }
    return canvas;
  }

  function applyKernel(canvas, kernel) {
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
              sum += s[((y+ky)*w+(x+kx))*4+c] * kernel[(ky+1)*3+(kx+1)];
            }
          }
          d[(y*w+x)*4+c] = Math.max(0, Math.min(255, sum));
        }
        d[(y*w+x)*4+3] = s[(y*w+x)*4+3];
      }
    }
    ctx.putImageData(dst, 0, 0);
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        onProgress && onProgress(0.4, 'Restoring...');
        var canvas = applyRestore(img, options);

        var beforeEl = document.getElementById('irt-before');
        var afterEl = document.getElementById('irt-after');
        var wrap = document.getElementById('irt-preview-wrap');
        if (beforeEl && afterEl && wrap) {
          var maxW = 200; var sc = Math.min(1, maxW / img.width);
          var dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);
          beforeEl.width = dw; beforeEl.height = dh;
          beforeEl.getContext('2d').drawImage(img, 0, 0, dw, dh);
          afterEl.width = dw; afterEl.height = dh;
          afterEl.getContext('2d').drawImage(canvas, 0, 0, dw, dh);
          wrap.style.display = 'block';
        }

        var base = file.name.replace(/\.[^.]+$/, '');
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-restored.jpg' });
        }, 'image/jpeg', 0.95);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Black and White Image
 * Handler: img-grayscale
 * URL: /tool/black-and-white-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-grayscale' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Grayscale Method</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ig-method" value="luminance" checked> Luminance (natural)</label>' +
        '<label><input type="radio" name="ig-method" value="average"> Average</label>' +
        '<label><input type="radio" name="ig-method" value="desaturate"> Desaturate</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ig-intensity">Intensity: <span id="ig-intensity-val">100</span>%</label>' +
      '<input type="range" id="ig-intensity" min="0" max="100" value="100" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ig-contrast">Contrast: <span id="ig-contrast-val">0</span></label>' +
      '<input type="range" id="ig-contrast" min="-100" max="100" value="0" style="flex:1">' +
    '</div>' +
    '<div id="ig-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Before</p><canvas id="ig-before" style="max-width:200px;border:1px solid #ddd"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">After</p><canvas id="ig-after" style="max-width:200px;border:1px solid #ddd"></canvas></div>' +
      '</div>' +
    '</div>';
  }

  function wireOptions(container) {
    function link(id, vid) {
      var s = container.querySelector('#' + id);
      var v = container.querySelector('#' + vid);
      if (s && v) s.addEventListener('input', function () { v.textContent = s.value; });
    }
    link('ig-intensity', 'ig-intensity-val');
    link('ig-contrast', 'ig-contrast-val');
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var method = optionsEl.querySelector('input[name="ig-method"]:checked');
    var intensity = optionsEl.querySelector('#ig-intensity');
    var contrast = optionsEl.querySelector('#ig-contrast');
    return {
      method: method ? method.value : 'luminance',
      intensity: intensity ? parseInt(intensity.value) / 100 : 1,
      contrast: contrast ? parseInt(contrast.value) : 0,
    };
  }

  function toGray(r, g, b, method) {
    if (method === 'average') return (r + g + b) / 3;
    if (method === 'desaturate') return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    return 0.299 * r + 0.587 * g + 0.114 * b; // luminance
  }

  function applyContrast(val, contrast) {
    var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    return Math.max(0, Math.min(255, factor * (val - 128) + 128));
  }

  function processImage(img, options) {
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;

    for (var i = 0; i < data.length; i += 4) {
      var r = data[i], g = data[i+1], b = data[i+2];
      var gray = toGray(r, g, b, options.method);

      if (options.contrast !== 0) gray = applyContrast(gray, options.contrast);

      // Blend with original based on intensity
      var nr = r + (gray - r) * options.intensity;
      var ng = g + (gray - g) * options.intensity;
      var nb = b + (gray - b) * options.intensity;

      data[i] = Math.round(nr);
      data[i+1] = Math.round(ng);
      data[i+2] = Math.round(nb);
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        onProgress && onProgress(0.4, 'Processing...');

        var canvas = processImage(img, options);

        // Before/after preview
        var beforeEl = document.getElementById('ig-before');
        var afterEl = document.getElementById('ig-after');
        var wrap = document.getElementById('ig-preview-wrap');
        if (beforeEl && afterEl && wrap) {
          var maxW = 200;
          var sc = Math.min(1, maxW / img.width);
          var pw = Math.round(img.width * sc), ph = Math.round(img.height * sc);

          beforeEl.width = pw; beforeEl.height = ph;
          beforeEl.getContext('2d').drawImage(img, 0, 0, pw, ph);

          afterEl.width = pw; afterEl.height = ph;
          afterEl.getContext('2d').drawImage(canvas, 0, 0, pw, ph);

          wrap.style.display = 'block';
        }

        var base = file.name.replace(/\.[^.]+$/, '');
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-bw.jpg' });
        }, 'image/jpeg', 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

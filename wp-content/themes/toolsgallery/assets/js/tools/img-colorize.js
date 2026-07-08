/**
 * ToolsGallery — Colorize Photo
 * Handler: img-colorize
 * URL: /tool/colorize-photo/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-colorize' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Effect</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ico-effect" value="sepia" checked> Sepia</label>' +
        '<label><input type="radio" name="ico-effect" value="warm"> Warm</label>' +
        '<label><input type="radio" name="ico-effect" value="cool"> Cool</label>' +
        '<label><input type="radio" name="ico-effect" value="custom"> Custom Tint</label>' +
      '</div>' +
    '</div>' +
    '<div id="ico-custom-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ico-hue">Hue (0-360): <span id="ico-hue-val">30</span></label>' +
      '<input type="range" id="ico-hue" min="0" max="360" value="30" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ico-strength">Strength: <span id="ico-strength-val">80</span>%</label>' +
      '<input type="range" id="ico-strength" min="10" max="100" value="80" style="flex:1">' +
    '</div>' +
    '<div id="ico-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="ico-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>' +
    '';
  }

  function wireOptions(container) {
    function link(id, vid) {
      var s = container.querySelector('#' + id);
      var v = container.querySelector('#' + vid);
      if (s && v) s.addEventListener('input', function () { v.textContent = s.value; });
    }
    link('ico-hue', 'ico-hue-val');
    link('ico-strength', 'ico-strength-val');
    container.querySelectorAll('input[name="ico-effect"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = container.querySelector('#ico-custom-wrap');
        if (w) w.hidden = r.value !== 'custom';
      });
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var effect = optionsEl.querySelector('input[name="ico-effect"]:checked');
    var hue = optionsEl.querySelector('#ico-hue');
    var strength = optionsEl.querySelector('#ico-strength');
    return {
      effect: effect ? effect.value : 'sepia',
      hue: hue ? parseInt(hue.value) : 30,
      strength: strength ? parseInt(strength.value) / 100 : 0.8,
    };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var hue2rgb = function (p, q, t) {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
  }

  function applyEffect(img, options) {
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var d = id.data;

    var tintR, tintG, tintB;
    if (options.effect === 'sepia') { tintR = 112; tintG = 66; tintB = 20; }
    else if (options.effect === 'warm') { tintR = 255; tintG = 140; tintB = 60; }
    else if (options.effect === 'cool') { tintR = 60; tintG = 140; tintB = 255; }
    else {
      var rgb = hslToRgb(options.hue, 70, 50);
      tintR = rgb[0]; tintG = rgb[1]; tintB = rgb[2];
    }

    for (var i = 0; i < d.length; i += 4) {
      var gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      var str = options.strength;
      d[i]   = Math.min(255, gray * (1 - str) + tintR * (gray / 255) * str);
      d[i+1] = Math.min(255, gray * (1 - str) + tintG * (gray / 255) * str);
      d[i+2] = Math.min(255, gray * (1 - str) + tintB * (gray / 255) * str);
    }
    ctx.putImageData(id, 0, 0);
    return canvas;
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        onProgress && onProgress(0.4, 'Applying effect...');
        var canvas = applyEffect(img, options);

        var previewEl = document.getElementById('ico-preview');
        var previewWrap = document.getElementById('ico-preview-wrap');
        if (previewEl && previewWrap) {
          var maxW = 400; var sc = Math.min(1, maxW / img.width);
          previewEl.width = Math.round(img.width * sc); previewEl.height = Math.round(img.height * sc);
          previewEl.getContext('2d').drawImage(canvas, 0, 0, previewEl.width, previewEl.height);
          previewWrap.style.display = 'block';
        }

        var base = file.name.replace(/\.[^.]+$/, '');
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-colorized.jpg' });
        }, 'image/jpeg', 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

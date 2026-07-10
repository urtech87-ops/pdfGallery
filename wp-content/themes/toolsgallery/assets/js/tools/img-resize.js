/**
 * ToolsGallery — Resize Image
 * Handler: img-resize
 * URL: /tool/resize-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-resize' };

  var PRESETS = [
    { label: 'HD (1280×720)', w: 1280, h: 720 },
    { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
    { label: '4K (3840×2160)', w: 3840, h: 2160 },
    { label: 'Social Square (1080×1080)', w: 1080, h: 1080 },
    { label: 'Instagram Portrait (1080×1350)', w: 1080, h: 1350 },
    { label: 'Twitter (1200×675)', w: 1200, h: 675 },
    { label: 'Facebook (1200×630)', w: 1200, h: 630 },
  ];

  function getOptionsHTML() {
    var presetOpts = PRESETS.map(function (p) {
      return '<option value="' + p.w + 'x' + p.h + '">' + p.label + '</option>';
    }).join('');

    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Resize by</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ir-mode" value="dimensions" checked> Dimensions</label>' +
        '<label><input type="radio" name="ir-mode" value="percentage"> Percentage</label>' +
        '<label><input type="radio" name="ir-mode" value="preset"> Preset</label>' +
      '</div>' +
    '</div>' +
    '<div id="ir-dims-wrap">' +
      '<p id="ir-orig-dims" class="tg-opt-info" style="margin-bottom:6px"></p>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ir-width">Width (px)</label>' +
        '<input type="number" id="ir-width" class="tg-text-input" min="1" max="20000" style="width:100px">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ir-height">Height (px)</label>' +
        '<input type="number" id="ir-height" class="tg-text-input" min="1" max="20000" style="width:100px">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label><input type="checkbox" id="ir-lock" checked> Lock aspect ratio</label>' +
      '</div>' +
    '</div>' +
    '<div id="ir-pct-wrap" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ir-pct">Scale: <span id="ir-pct-val">100</span>%</label>' +
        '<input type="range" id="ir-pct" min="10" max="200" value="100" style="flex:1">' +
      '</div>' +
    '</div>' +
    '<div id="ir-preset-wrap" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ir-preset">Preset</label>' +
        '<select id="ir-preset" class="tg-select">' + presetOpts + '</select>' +
      '</div>' +
    '</div>';
  }

  function wireOptions(container) {
    var radios = container.querySelectorAll('input[name="ir-mode"]');
    var dims = container.querySelector('#ir-dims-wrap');
    var pct = container.querySelector('#ir-pct-wrap');
    var pre = container.querySelector('#ir-preset-wrap');
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (dims) dims.hidden = r.value !== 'dimensions';
        if (pct) pct.hidden = r.value !== 'percentage';
        if (pre) pre.hidden = r.value !== 'preset';
      });
    });
    var ps = container.querySelector('#ir-pct');
    var pv = container.querySelector('#ir-pct-val');
    if (ps && pv) ps.addEventListener('input', function () { pv.textContent = ps.value; });
    var wInp = container.querySelector('#ir-width');
    var hInp = container.querySelector('#ir-height');
    var lock = container.querySelector('#ir-lock');
    var ratio = 0;
    if (wInp && hInp && lock) {
      wInp.addEventListener('input', function () { if (lock.checked && ratio && wInp.value) { hInp.value = Math.round(wInp.value / ratio); } });
      hInp.addEventListener('input', function () { if (lock.checked && ratio && hInp.value) { wInp.value = Math.round(hInp.value * ratio); } });
    }
    window._irSetDims = function (w, h) {
      ratio = w / h;
      if (wInp) wInp.value = w;
      if (hInp) hInp.value = h;
      var el = container.querySelector('#ir-orig-dims');
      if (el) el.textContent = 'Current: ' + w + '×' + h + 'px';
    };
  }

  function onFileReady(file) {
    if (!file || !window.TGImageUtil) return;
    TGImageUtil.loadImage(file).then(function (img) {
      if (window._irSetDims) window._irSetDims(img.naturalWidth, img.naturalHeight);
    }).catch(function () {});
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var mode = optionsEl.querySelector('input[name="ir-mode"]:checked');
    var modeVal = mode ? mode.value : 'dimensions';
    var w = optionsEl.querySelector('#ir-width');
    var h = optionsEl.querySelector('#ir-height');
    var lock = optionsEl.querySelector('#ir-lock');
    var pct = optionsEl.querySelector('#ir-pct');
    var preset = optionsEl.querySelector('#ir-preset');
    return {
      mode: modeVal,
      width: w ? parseInt(w.value) || 0 : 0,
      height: h ? parseInt(h.value) || 0 : 0,
      lockAspect: lock ? lock.checked : true,
      percentage: pct ? parseInt(pct.value) / 100 : 1,
      preset: preset ? preset.value : '',
    };
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);

        // Set dims UI if available
        if (window._irSetDims) window._irSetDims(img.width, img.height);

        var tw = img.width, th = img.height;
        var opts = options;

        if (opts.mode === 'dimensions') {
          if (opts.width && opts.height) {
            tw = opts.width; th = opts.height;
          } else if (opts.width) {
            tw = opts.width; th = Math.round(img.height * opts.width / img.width);
          } else if (opts.height) {
            th = opts.height; tw = Math.round(img.width * opts.height / img.height);
          }
        } else if (opts.mode === 'percentage') {
          tw = Math.round(img.width * opts.percentage);
          th = Math.round(img.height * opts.percentage);
        } else if (opts.mode === 'preset' && opts.preset) {
          var parts = opts.preset.split('x');
          tw = parseInt(parts[0]); th = parseInt(parts[1]);
        }

        if (!tw || !th || tw < 1 || th < 1) { reject(new Error('Invalid dimensions')); return; }

        onProgress && onProgress(0.5, 'Resizing...');
        var canvas = document.createElement('canvas');
        canvas.width = tw; canvas.height = th;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, tw, th);

        var ext = file.name.match(/\.[^.]+$/) ? file.name.match(/\.[^.]+$/)[0] : '.jpg';
        var mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        var base = file.name.replace(/\.[^.]+$/, '');

        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed to create image')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-resized' + ext });
        }, mime, 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

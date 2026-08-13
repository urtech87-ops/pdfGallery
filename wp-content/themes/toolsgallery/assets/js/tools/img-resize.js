/**
 * ToolsGallery — Resize Image
 * Handler: img-resize
 * URL: /tool/resize-image/
 *
 * The preview frame shows the resized result for the current options, so
 * the target dimensions can be checked before downloading. Rotate turns
 * the working image (and swaps the dimension fields with it); Clear hands
 * the tool box back to the upload state.
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

  var _img = null;      // the image as uploaded
  var _src = null;      // working source — a rotated canvas once _rot !== 0
  var _rot = 0;
  var _optionsEl = null;
  var _setDims = null;  // installed by wireOptions

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
    '</div>' +
    TGImgTools.barHTML('ir') +
    '<div id="ir-preview-wrap" class="tg-img-preview-frame" style="display:none">' +
      '<canvas id="ir-preview"></canvas>' +
      '<p class="tg-opt-info" id="ir-preview-dims" style="margin:6px 0 0"></p>' +
    '</div>';
  }

  function wireOptions(container) {
    _optionsEl = container;

    var radios = container.querySelectorAll('input[name="ir-mode"]');
    var dims = container.querySelector('#ir-dims-wrap');
    var pct = container.querySelector('#ir-pct-wrap');
    var pre = container.querySelector('#ir-preset-wrap');
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (dims) dims.hidden = r.value !== 'dimensions';
        if (pct) pct.hidden = r.value !== 'percentage';
        if (pre) pre.hidden = r.value !== 'preset';
        updatePreview();
      });
    });
    var ps = container.querySelector('#ir-pct');
    var pv = container.querySelector('#ir-pct-val');
    if (ps) ps.addEventListener('input', function () {
      if (pv) pv.textContent = ps.value;
      updatePreview();
    });
    var preset = container.querySelector('#ir-preset');
    if (preset) preset.addEventListener('change', updatePreview);

    var wInp = container.querySelector('#ir-width');
    var hInp = container.querySelector('#ir-height');
    var lock = container.querySelector('#ir-lock');
    var ratio = 0;
    if (wInp && hInp && lock) {
      wInp.addEventListener('input', function () {
        if (lock.checked && ratio && wInp.value) { hInp.value = Math.round(wInp.value / ratio); }
        updatePreview();
      });
      hInp.addEventListener('input', function () {
        if (lock.checked && ratio && hInp.value) { wInp.value = Math.round(hInp.value * ratio); }
        updatePreview();
      });
    }
    _setDims = function (w, h) {
      ratio = w / h;
      if (wInp) wInp.value = w;
      if (hInp) hInp.value = h;
      var el = container.querySelector('#ir-orig-dims');
      if (el) el.textContent = 'Current: ' + w + '×' + h + 'px';
    };

    TGImgTools.wire(container, 'ir', {
      onRotate: function () {
        if (!_img) return;
        _rot = (_rot + 90) % 360;
        _src = TGImgTools.rotate(_img, _rot);
        /* The turn swaps width and height — re-seed the fields from the
           rotated image so the target dimensions aren't sideways. */
        if (_setDims) _setDims(TGImgTools.w(_src), TGImgTools.h(_src));
        updatePreview();
      },
      onClear: function () { _img = null; _src = null; _rot = 0; },
    });
  }

  function onFileReady(file, optionsEl) {
    _img = null; _src = null; _rot = 0;
    if (optionsEl) _optionsEl = optionsEl;
    if (!file || !window.TGImageUtil) return;
    TGImageUtil.loadImage(file).then(function (img) {
      _img = img;
      _src = img;
      if (_setDims) _setDims(img.naturalWidth, img.naturalHeight);
      updatePreview();
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

  /* Target size for the current options, or null when it isn't usable. */
  function targetSize(source, opts) {
    var sw = TGImgTools.w(source);
    var sh = TGImgTools.h(source);
    var tw = sw, th = sh;

    if (opts.mode === 'dimensions') {
      if (opts.width && opts.height) {
        tw = opts.width; th = opts.height;
      } else if (opts.width) {
        tw = opts.width; th = Math.round(sh * opts.width / sw);
      } else if (opts.height) {
        th = opts.height; tw = Math.round(sw * opts.height / sh);
      }
    } else if (opts.mode === 'percentage') {
      tw = Math.round(sw * opts.percentage);
      th = Math.round(sh * opts.percentage);
    } else if (opts.mode === 'preset' && opts.preset) {
      var parts = opts.preset.split('x');
      tw = parseInt(parts[0]); th = parseInt(parts[1]);
    }

    if (!tw || !th || tw < 1 || th < 1) return null;
    return { w: tw, h: th };
  }

  function resizeToCanvas(source, size) {
    var canvas = document.createElement('canvas');
    canvas.width = size.w; canvas.height = size.h;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, size.w, size.h);
    return canvas;
  }

  /* The frame shows the resized result, scaled down to fit — the caption
     carries the real pixel size. */
  function updatePreview() {
    if (!_src) return;
    var canvasEl = document.getElementById('ir-preview');
    var wrap = document.getElementById('ir-preview-wrap');
    if (!canvasEl || !wrap) return;
    var size = targetSize(_src, getOptions(_optionsEl || document));
    if (!size) return;

    /* Drawn straight at the preview scale rather than by shrinking a
       full-size resize — same framing and aspect (including a stretched
       one), without allocating a 4K canvas on every keystroke. */
    var sc = Math.min(1, 360 / size.w);
    canvasEl.width = Math.max(1, Math.round(size.w * sc));
    canvasEl.height = Math.max(1, Math.round(size.h * sc));
    var ctx = canvasEl.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(_src, 0, 0, canvasEl.width, canvasEl.height);
    var caption = document.getElementById('ir-preview-dims');
    if (caption) caption.textContent = 'Result: ' + size.w + '×' + size.h + 'px';
    wrap.style.display = 'block';
    TGImgTools.show('ir', true);
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Loading image...');
    if (!_src) {
      _img = await TGImageUtil.loadImage(file);
      _src = TGImgTools.rotate(_img, _rot);
      if (_setDims) _setDims(TGImgTools.w(_src), TGImgTools.h(_src));
    }

    var size = targetSize(_src, options);
    if (!size) throw new Error('Invalid dimensions');

    onProgress && onProgress(0.5, 'Resizing...');
    var canvas = resizeToCanvas(_src, size);
    updatePreview();

    var match = file.name.match(/\.[^.]+$/);
    var ext = match ? match[0] : '.jpg';
    var mime = ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, mime, 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-resized' + ext };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Make Round Image
 * Handler: img-round
 * URL: /tool/round-image/
 *
 * The preview frame shows the rounded result live while the options
 * change, and the shared Rotate/Clear toolbar turns the working image or
 * hands the tool box back to the upload state.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-round' };

  var _img = null;   // the image as uploaded
  var _src = null;   // working source — a rotated canvas once _rot !== 0
  var _rot = 0;
  var _optionsEl = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Shape</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ird-shape" value="circle" checked> Circle</label>' +
        '<label><input type="radio" name="ird-shape" value="rounded"> Rounded Rectangle</label>' +
      '</div>' +
    '</div>' +
    '<div id="ird-radius-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ird-radius">Corner Radius: <span id="ird-radius-val">20</span>%</label>' +
      '<input type="range" id="ird-radius" min="1" max="50" value="20" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Background</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ird-bg" value="transparent" checked> Transparent</label>' +
        '<label><input type="radio" name="ird-bg" value="white"> White</label>' +
        '<label><input type="radio" name="ird-bg" value="custom"> Custom</label>' +
      '</div>' +
    '</div>' +
    '<div id="ird-bg-custom-wrap" hidden class="tg-opt-row">' +
      '<input type="color" id="ird-bg-color" value="#ffffff">' +
    '</div>' +
    TGImgTools.barHTML('ird') +
    '<div id="ird-preview-wrap" class="tg-img-preview-frame" style="display:none">' +
      '<canvas id="ird-preview" style="max-width:300px;border-radius:50%"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    _optionsEl = container;

    container.querySelectorAll('input[name="ird-shape"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = container.querySelector('#ird-radius-wrap');
        if (w) w.hidden = r.value !== 'rounded';
        updatePreview();
      });
    });
    container.querySelectorAll('input[name="ird-bg"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = container.querySelector('#ird-bg-custom-wrap');
        if (w) w.hidden = r.value !== 'custom';
        updatePreview();
      });
    });
    var sl = container.querySelector('#ird-radius');
    var sv = container.querySelector('#ird-radius-val');
    if (sl) sl.addEventListener('input', function () {
      if (sv) sv.textContent = sl.value;
      updatePreview();
    });
    var bgColor = container.querySelector('#ird-bg-color');
    if (bgColor) bgColor.addEventListener('input', updatePreview);

    TGImgTools.wire(container, 'ird', {
      onRotate: function () {
        if (!_img) return;
        _rot = (_rot + 90) % 360;
        _src = TGImgTools.rotate(_img, _rot);
        updatePreview();
      },
      onClear: function () { _img = null; _src = null; _rot = 0; },
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var shape = optionsEl.querySelector('input[name="ird-shape"]:checked');
    var radius = optionsEl.querySelector('#ird-radius');
    var bg = optionsEl.querySelector('input[name="ird-bg"]:checked');
    var bgColor = optionsEl.querySelector('#ird-bg-color');
    var bgVal = bg ? bg.value : 'transparent';
    if (bgVal === 'custom') bgVal = bgColor ? bgColor.value : '#ffffff';
    else if (bgVal === 'white') bgVal = '#ffffff';
    return {
      shape: shape ? shape.value : 'circle',
      radius: radius ? parseInt(radius.value) / 100 : 0.2,
      background: bgVal,
    };
  }

  /* Square-crop the working source and clip it to the chosen shape. */
  function renderRound(source, options) {
    var sw = TGImgTools.w(source);
    var sh = TGImgTools.h(source);
    var size = Math.min(sw, sh);
    var sx = (sw - size) / 2, sy = (sh - size) / 2;

    var canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext('2d');

    if (options.background && options.background !== 'transparent') {
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, size, size);
    }

    ctx.save();
    if (options.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
    } else {
      var r = Math.round(size * options.radius);
      ctx.beginPath();
      ctx.moveTo(r, 0); ctx.lineTo(size - r, 0); ctx.arcTo(size, 0, size, r, r);
      ctx.lineTo(size, size - r); ctx.arcTo(size, size, size - r, size, r);
      ctx.lineTo(r, size); ctx.arcTo(0, size, 0, size - r, r);
      ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r);
      ctx.closePath(); ctx.clip();
    }
    ctx.drawImage(source, sx, sy, size, size, 0, 0, size, size);
    ctx.restore();
    return canvas;
  }

  function updatePreview() {
    if (!_src) return;
    var previewEl = document.getElementById('ird-preview');
    var wrap = document.getElementById('ird-preview-wrap');
    if (!previewEl || !wrap) return;
    var opts = getOptions(_optionsEl || document);
    TGImageUtil.drawPreview(renderRound(_src, opts), previewEl, 240);
    previewEl.style.borderRadius = opts.shape === 'circle'
      ? '50%'
      : Math.round(opts.radius * 50) + '%';
    wrap.style.display = 'block';
    TGImgTools.show('ird', true);
  }

  function onFileReady(file, optionsEl) {
    _img = null; _src = null; _rot = 0;
    if (optionsEl) _optionsEl = optionsEl;
    if (!file || !window.TGImageUtil) return;
    TGImageUtil.loadImage(file).then(function (img) {
      _img = img;
      _src = img;
      updatePreview();
    }).catch(function () {});
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Loading image...');
    if (!_src) {
      _img = await TGImageUtil.loadImage(file);
      _src = TGImgTools.rotate(_img, _rot);
    }

    onProgress && onProgress(0.5, 'Rounding corners...');
    var canvas = renderRound(_src, options);
    updatePreview();

    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/png');
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-round.png' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

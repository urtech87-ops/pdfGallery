/**
 * ToolsGallery — Upscale Image
 * Handler: img-upscale
 * URL: /tool/upscale-image/
 *
 * The frame previews the INPUT (plus the size it will be upscaled to) —
 * rendering a 4x canvas on every option change would be far heavier than
 * the preview is worth. Once the run finishes, the frame switches to the
 * upscaled result.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-upscale' };

  var _img = null;   // the image as uploaded
  var _src = null;   // working source — a rotated canvas once _rot !== 0
  var _rot = 0;
  var _optionsEl = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column">' +
      '<label class="tg-opt-label">Scale Factor</label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" class="tg-btn-secondary iu-scale-btn iu-scale-btn--active" data-scale="2">2x</button>' +
        '<button type="button" class="tg-btn-secondary iu-scale-btn" data-scale="3">3x</button>' +
        '<button type="button" class="tg-btn-secondary iu-scale-btn" data-scale="4">4x</button>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iu-quality">JPEG Quality: <span id="iu-quality-val">95</span>%</label>' +
      '<input type="range" id="iu-quality" min="50" max="100" value="95" style="flex:1">' +
    '</div>' +
    '<p class="tg-opt-info">Note: Browser upscaling uses bicubic interpolation. Results are best for 2x. For AI-based super-resolution, a server-side API is required.</p>' +
    '<div id="iu-info" style="margin-top:8px"></div>' +
    TGImgTools.barHTML('iu') +
    '<div id="iu-preview-wrap" class="tg-img-preview-frame" style="display:none">' +
      '<canvas id="iu-preview"></canvas>' +
      '<p class="tg-opt-info" id="iu-preview-dims" style="margin:6px 0 0"></p>' +
    '</div>';
  }

  function wireOptions(container) {
    _optionsEl = container;

    var btns = container.querySelectorAll('.iu-scale-btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('iu-scale-btn--active'); });
        b.classList.add('iu-scale-btn--active');
        updatePreview();
      });
    });
    var sl = container.querySelector('#iu-quality');
    var sv = container.querySelector('#iu-quality-val');
    if (sl && sv) sl.addEventListener('input', function () { sv.textContent = sl.value; });

    TGImgTools.wire(container, 'iu', {
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
    var active = optionsEl.querySelector('.iu-scale-btn--active');
    var quality = optionsEl.querySelector('#iu-quality');
    return {
      scale: active ? parseInt(active.dataset.scale) : 2,
      quality: quality ? parseInt(quality.value) / 100 : 0.95,
    };
  }

  function upscaleToCanvas(source, scale) {
    var canvas = document.createElement('canvas');
    canvas.width = TGImgTools.w(source) * scale;
    canvas.height = TGImgTools.h(source) * scale;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function setCaption(text) {
    var caption = document.getElementById('iu-preview-dims');
    if (caption) caption.textContent = text;
  }

  function updatePreview() {
    if (!_src) return;
    var canvasEl = document.getElementById('iu-preview');
    var wrap = document.getElementById('iu-preview-wrap');
    if (!canvasEl || !wrap) return;
    var w = TGImgTools.w(_src), h = TGImgTools.h(_src);
    var scale = getOptions(_optionsEl || document).scale || 2;
    TGImageUtil.drawPreview(_src, canvasEl, 360);
    setCaption(w + '×' + h + 'px → ' + (w * scale) + '×' + (h * scale) + 'px after upscaling');
    wrap.style.display = 'block';
    TGImgTools.show('iu', true);
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

    var scale = options.scale || 2;
    var w = TGImgTools.w(_src), h = TGImgTools.h(_src);
    var nw = w * scale, nh = h * scale;
    onProgress && onProgress(0.3, 'Upscaling ' + w + 'x' + h + ' → ' + nw + 'x' + nh + '...');

    var infoEl = document.getElementById('iu-info');
    if (infoEl) {
      infoEl.innerHTML = '<p class="tg-opt-info">Upscaling from <strong>' + w + '×' + h +
        '</strong> to <strong>' + nw + '×' + nh + '</strong></p>';
    }

    var canvas = upscaleToCanvas(_src, scale);

    /* Now that the heavy render exists, show the actual result. */
    var canvasEl = document.getElementById('iu-preview');
    if (canvasEl) {
      TGImageUtil.drawPreview(canvas, canvasEl, 360);
      setCaption('Result: ' + nw + '×' + nh + 'px');
    }

    var match = file.name.match(/\.[^.]+$/);
    var ext = match ? match[0] : '.jpg';
    var mime = ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, mime, options.quality || 0.95);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-' + scale + 'x' + ext };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Flip Image
 * Handler: img-flip
 * URL: /tool/flip-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-flip' };
  var _img = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:10px">' +
      '<label class="tg-opt-label">Flip Direction</label>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary tg-flip-btn tg-flip-btn--active" data-flip="h">Flip Horizontal</button>' +
        '<button type="button" class="tg-btn-secondary tg-flip-btn" data-flip="v">Flip Vertical</button>' +
        '<button type="button" class="tg-btn-secondary tg-flip-btn" data-flip="both">Both</button>' +
      '</div>' +
    '</div>' +
    '<div id="if-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="if-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    var btns = container.querySelectorAll('.tg-flip-btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('tg-flip-btn--active'); });
        b.classList.add('tg-flip-btn--active');
        updatePreview(b.dataset.flip);
      });
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { flip: 'h' };
    var active = optionsEl.querySelector('.tg-flip-btn--active');
    return { flip: active ? active.dataset.flip : 'h' };
  }

  function flipToCanvas(img, flip) {
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    var flipH = flip === 'h' || flip === 'both';
    var flipV = flip === 'v' || flip === 'both';
    ctx.translate(flipH ? canvas.width : 0, flipV ? canvas.height : 0);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  function updatePreview(flip) {
    if (!_img) return;
    var preview = document.getElementById('if-preview');
    var wrap = document.getElementById('if-preview-wrap');
    if (!preview || !wrap) return;
    TGImageUtil.drawPreview(flipToCanvas(_img, flip), preview, 400);
    wrap.style.display = 'block';
  }

  function onFileReady(file, optionsEl) {
    _img = null;
    if (!file) return;
    TGImageUtil.loadImage(file).then(function (img) {
      _img = img;
      var active = optionsEl ? optionsEl.querySelector('.tg-flip-btn--active') : null;
      updatePreview(active ? active.dataset.flip : 'h');
    }).catch(function () {});
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Loading image...');
    var img = _img || await TGImageUtil.loadImage(file);
    onProgress && onProgress(0.5, 'Flipping...');
    var canvas = flipToCanvas(img, options.flip);

    var isPng = file.type === 'image/png';
    var mime = isPng ? 'image/png' : 'image/jpeg';
    var ext = isPng ? '.png' : '.jpg';
    var blob = await TGImageUtil.canvasToBlob(canvas, mime, 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-flipped' + ext };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Rotate Image
 * Handler: img-rotate
 * URL: /tool/rotate-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-rotate' };
  var _img = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:10px">' +
      '<label class="tg-opt-label">Quick Rotate</label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary" id="ir-left90">90° Left</button>' +
        '<button type="button" class="tg-btn-secondary" id="ir-right90">90° Right</button>' +
        '<button type="button" class="tg-btn-secondary" id="ir-180">180°</button>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ir-angle">Custom Angle: <span id="ir-angle-val">0</span>°</label>' +
      '<input type="range" id="ir-angle" min="-180" max="180" value="0" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ir-bg">Background</label>' +
      '<select id="ir-bg" class="tg-select">' +
        '<option value="transparent">Transparent</option>' +
        '<option value="#ffffff" selected>White</option>' +
        '<option value="#000000">Black</option>' +
        '<option value="custom">Custom color...</option>' +
      '</select>' +
    '</div>' +
    '<div id="ir-bg-custom-wrap" hidden style="margin-top:6px">' +
      '<input type="color" id="ir-bg-custom" value="#ffffff">' +
    '</div>' +
    '<div id="ir-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="ir-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    var ang = container.querySelector('#ir-angle');
    var angV = container.querySelector('#ir-angle-val');

    function setAngle(v) {
      if (!ang) return;
      ang.value = v;
      if (angV) angV.textContent = v;
      updatePreview(container);
    }

    if (ang) ang.addEventListener('input', function () { setAngle(parseInt(ang.value)); });

    var left = container.querySelector('#ir-left90');
    var right = container.querySelector('#ir-right90');
    var flip180 = container.querySelector('#ir-180');
    if (left) left.addEventListener('click', function () {
      var v = ((parseInt(ang.value) - 90) + 360) % 360;
      if (v > 180) v -= 360;
      setAngle(v);
    });
    if (right) right.addEventListener('click', function () {
      var v = ((parseInt(ang.value) + 90) + 360) % 360;
      if (v > 180) v -= 360;
      setAngle(v);
    });
    if (flip180) flip180.addEventListener('click', function () { setAngle(180); });

    var bgSel = container.querySelector('#ir-bg');
    var bgCW = container.querySelector('#ir-bg-custom-wrap');
    var bgC = container.querySelector('#ir-bg-custom');
    if (bgSel) bgSel.addEventListener('change', function () {
      if (bgCW) bgCW.hidden = bgSel.value !== 'custom';
      updatePreview(container);
    });
    if (bgC) bgC.addEventListener('input', function () { updatePreview(container); });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var ang = optionsEl.querySelector('#ir-angle');
    var bg = optionsEl.querySelector('#ir-bg');
    var bgC = optionsEl.querySelector('#ir-bg-custom');
    var bgVal = bg ? bg.value : '#ffffff';
    if (bgVal === 'custom') bgVal = bgC ? bgC.value : '#ffffff';
    return {
      angle: ang ? parseInt(ang.value) : 0,
      background: bgVal,
    };
  }

  function rotateCanvas(img, degrees, bgColor) {
    var rad = degrees * Math.PI / 180;
    var cos = Math.abs(Math.cos(rad));
    var sin = Math.abs(Math.sin(rad));
    var w = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
    var h = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');

    if (bgColor && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.translate(w / 2, h / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return canvas;
  }

  function updatePreview(optionsEl) {
    if (!_img) return;
    var preview = document.getElementById('ir-preview');
    var wrap = document.getElementById('ir-preview-wrap');
    if (!preview || !wrap) return;
    var opts = getOptions(optionsEl || document);
    TGImageUtil.drawPreview(rotateCanvas(_img, opts.angle, opts.background), preview, 300);
    wrap.style.display = 'block';
  }

  function onFileReady(file, optionsEl) {
    _img = null;
    if (!file) return;
    TGImageUtil.loadImage(file).then(function (img) {
      _img = img;
      updatePreview(optionsEl);
    }).catch(function () {});
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    var img = _img || await TGImageUtil.loadImage(file);
    onProgress && onProgress(0.5, 'Rotating...');
    var canvas = rotateCanvas(img, options.angle || 0, options.background);

    var usePng = options.background === 'transparent' || file.type === 'image/png';
    var mime = usePng ? 'image/png' : 'image/jpeg';
    var ext = usePng ? '.png' : '.jpg';
    var blob = await TGImageUtil.canvasToBlob(canvas, mime, 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-rotated' + ext };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

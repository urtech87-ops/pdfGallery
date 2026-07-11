/**
 * ToolsGallery — Meme Generator
 * Handler: img-meme
 * URL: /tool/meme-generator/
 *
 * Live-preview meme editor: the canvas renders as soon as the image
 * loads (correct onload-then-size pattern) and re-renders on every
 * option change, so what you see is what downloads.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-meme' };

  var _img = null;
  var _optionsEl = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-top">Top Text</label>' +
      '<input type="text" id="imm-top" class="tg-text-input" value="TOP TEXT" placeholder="Top caption">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-bot">Bottom Text</label>' +
      '<input type="text" id="imm-bot" class="tg-text-input" value="BOTTOM TEXT" placeholder="Bottom caption">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-font">Font</label>' +
      '<select id="imm-font" class="tg-select">' +
        '<option value="Impact">Impact</option>' +
        '<option value="Arial">Arial</option>' +
        '<option value="Comic Sans MS">Comic Sans</option>' +
        '<option value="Georgia">Georgia</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-size">Font Size: <span id="imm-size-val">10</span>%</label>' +
      '<input type="range" id="imm-size" min="4" max="20" value="10" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-color">Text Color</label>' +
      '<input type="color" id="imm-color" value="#ffffff">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-stroke">Outline Color</label>' +
      '<input type="color" id="imm-stroke" value="#000000">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-stroke-w">Outline Width: <span id="imm-stroke-w-val">3</span>px</label>' +
      '<input type="range" id="imm-stroke-w" min="0" max="12" value="3" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Text Style</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="imm-case" value="upper" checked> UPPERCASE</label>' +
        '<label><input type="radio" name="imm-case" value="original"> As typed</label>' +
      '</div>' +
    '</div>' +
    '<div id="imm-preview-wrap" style="margin-top:12px;display:none;max-width:100%">' +
      '<canvas id="imm-preview" style="display:block;max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    _optionsEl = container;
    function link(id, vid, suf) {
      var s = container.querySelector('#' + id);
      var v = container.querySelector('#' + vid);
      if (s && v) s.addEventListener('input', function () { v.textContent = s.value + (suf || ''); });
    }
    link('imm-size', 'imm-size-val', '%');
    link('imm-stroke-w', 'imm-stroke-w-val', 'px');

    // Live preview: re-render on any option change
    ['imm-top', 'imm-bot', 'imm-font', 'imm-size', 'imm-color', 'imm-stroke', 'imm-stroke-w'].forEach(function (id) {
      var el = container.querySelector('#' + id);
      if (!el) return;
      el.addEventListener('input', renderPreview);
      el.addEventListener('change', renderPreview);
    });
    container.querySelectorAll('input[name="imm-case"]').forEach(function (r) {
      r.addEventListener('change', renderPreview);
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var top = optionsEl.querySelector('#imm-top');
    var bot = optionsEl.querySelector('#imm-bot');
    var font = optionsEl.querySelector('#imm-font');
    var size = optionsEl.querySelector('#imm-size');
    var color = optionsEl.querySelector('#imm-color');
    var stroke = optionsEl.querySelector('#imm-stroke');
    var strokeW = optionsEl.querySelector('#imm-stroke-w');
    var textCase = optionsEl.querySelector('input[name="imm-case"]:checked');
    return {
      topText: top ? top.value : 'TOP TEXT',
      botText: bot ? bot.value : 'BOTTOM TEXT',
      font: font ? font.value : 'Impact',
      sizePct: size ? parseInt(size.value, 10) : 10,
      color: color ? color.value : '#ffffff',
      strokeColor: stroke ? stroke.value : '#000000',
      strokeWidth: strokeW ? parseInt(strokeW.value, 10) : 3,
      textCase: textCase ? textCase.value : 'upper',
    };
  }

  function drawMemeText(ctx, text, x, y, maxWidth, fontSize, options, strokeScale) {
    ctx.font = 'bold ' + fontSize + 'px "' + options.font + '"';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';

    if (options.strokeWidth > 0) {
      ctx.strokeStyle = options.strokeColor;
      ctx.lineWidth = options.strokeWidth * 2 * (strokeScale || 1);
      ctx.strokeText(text, x, y, maxWidth);
    }
    ctx.fillStyle = options.color;
    ctx.fillText(text, x, y, maxWidth);
  }

  /* Render the meme onto any canvas at that canvas's own resolution.
     strokeScale keeps the outline width proportional between the
     preview and the full-resolution export. */
  function renderMeme(canvas, img, options, strokeScale) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    var topText = options.topText || '';
    var botText = options.botText || '';
    if (options.textCase === 'upper') {
      topText = topText.toUpperCase();
      botText = botText.toUpperCase();
    }

    var fontSize = Math.max(10, Math.round(h * options.sizePct / 100));
    var padY = Math.round(fontSize * 0.3);
    var cx = w / 2;
    var maxWidth = w * 0.9;

    if (topText) {
      ctx.textBaseline = 'top';
      drawMemeText(ctx, topText, cx, padY, maxWidth, fontSize, options, strokeScale);
    }
    if (botText) {
      ctx.textBaseline = 'bottom';
      drawMemeText(ctx, botText, cx, h - padY, maxWidth, fontSize, options, strokeScale);
    }
  }

  function renderPreview() {
    if (!_img || !_optionsEl) return;
    var previewEl = document.getElementById('imm-preview');
    var previewWrap = document.getElementById('imm-preview-wrap');
    if (!previewEl || !previewWrap) return;

    var maxW = Math.min(550, window.innerWidth - 40);
    var sc = Math.min(1, maxW / _img.naturalWidth);
    previewEl.width = Math.max(1, Math.round(_img.naturalWidth * sc));
    previewEl.height = Math.max(1, Math.round(_img.naturalHeight * sc));

    renderMeme(previewEl, _img, getOptions(_optionsEl), sc);
    previewWrap.style.display = 'block';
  }

  function onFileReady(file) {
    _img = null;
    if (!file) return;

    var img = new Image();
    var objectUrl = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      _img = img;
      renderPreview();
    };
    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      alert('Could not load image. Please try a different file.');
    };
    img.src = objectUrl;
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Loading image...');

    var img = _img || await TGImageUtil.loadImage(file);
    _img = img;

    onProgress && onProgress(0.5, 'Rendering meme...');
    // Full-resolution export canvas, sized after the image is loaded
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    renderMeme(canvas, img, options, 1);

    renderPreview();

    onProgress && onProgress(0.85, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-meme.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

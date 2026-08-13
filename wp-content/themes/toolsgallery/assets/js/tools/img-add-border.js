/**
 * ToolsGallery — Add Border to Image
 * Handler: img-add-border
 * URL: /tool/add-border-to-image/
 *
 * The border is rendered by one function shared between the live preview
 * frame and the export, so what the frame shows is what gets downloaded.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-add-border' };

  var _img = null;   // the image as uploaded
  var _src = null;   // working source — a rotated canvas once _rot !== 0
  var _rot = 0;
  var _optionsEl = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Border Style</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="iab-style" value="solid" checked> Solid</label>' +
        '<label><input type="radio" name="iab-style" value="dashed"> Dashed</label>' +
        '<label><input type="radio" name="iab-style" value="double"> Double</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iab-color">Color</label>' +
      '<input type="color" id="iab-color" value="#000000">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iab-width">Width: <span id="iab-width-val">20</span>px</label>' +
      '<input type="range" id="iab-width" min="1" max="100" value="20" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Position</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="iab-pos" value="outside" checked> Outside (expand canvas)</label>' +
        '<label><input type="radio" name="iab-pos" value="inside"> Inside (overlap)</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Corner Style</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="iab-corner" value="sharp" checked> Sharp</label>' +
        '<label><input type="radio" name="iab-corner" value="rounded"> Rounded</label>' +
      '</div>' +
    '</div>' +
    '<div id="iab-radius-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iab-radius">Radius: <span id="iab-radius-val">10</span>px</label>' +
      '<input type="range" id="iab-radius" min="0" max="50" value="10" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iab-padding">Inner Padding: <span id="iab-padding-val">0</span>px</label>' +
      '<input type="range" id="iab-padding" min="0" max="50" value="0" style="flex:1">' +
    '</div>' +
    TGImgTools.barHTML('iab') +
    '<div id="iab-preview-wrap" class="tg-img-preview-frame" style="display:none">' +
      '<canvas id="iab-preview"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    _optionsEl = container;

    function link(id, valId) {
      var s = container.querySelector('#' + id);
      var v = container.querySelector('#' + valId);
      if (s) s.addEventListener('input', function () {
        if (v) v.textContent = s.value;
        updatePreview();
      });
    }
    link('iab-width', 'iab-width-val');
    link('iab-radius', 'iab-radius-val');
    link('iab-padding', 'iab-padding-val');

    var color = container.querySelector('#iab-color');
    if (color) color.addEventListener('input', updatePreview);

    container.querySelectorAll('input[name="iab-corner"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = container.querySelector('#iab-radius-wrap');
        if (w) w.hidden = r.value !== 'rounded';
        updatePreview();
      });
    });
    container.querySelectorAll('input[name="iab-style"], input[name="iab-pos"]').forEach(function (r) {
      r.addEventListener('change', updatePreview);
    });

    TGImgTools.wire(container, 'iab', {
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
    var style = optionsEl.querySelector('input[name="iab-style"]:checked');
    var color = optionsEl.querySelector('#iab-color');
    var width = optionsEl.querySelector('#iab-width');
    var pos = optionsEl.querySelector('input[name="iab-pos"]:checked');
    var corner = optionsEl.querySelector('input[name="iab-corner"]:checked');
    var radius = optionsEl.querySelector('#iab-radius');
    var padding = optionsEl.querySelector('#iab-padding');
    return {
      style: style ? style.value : 'solid',
      color: color ? color.value : '#000000',
      width: width ? parseInt(width.value) : 20,
      position: pos ? pos.value : 'outside',
      corner: corner ? corner.value : 'sharp',
      radius: radius ? parseInt(radius.value) : 10,
      padding: padding ? parseInt(padding.value) : 0,
    };
  }

  /* Draw the working source with the chosen border onto a fresh canvas. */
  function renderBorder(source, options) {
    var bw = options.width;
    var pad = options.padding;
    var outside = options.position === 'outside';

    var iw = TGImgTools.w(source);
    var ih = TGImgTools.h(source);
    var cw = outside ? iw + (bw + pad) * 2 : iw;
    var ch = outside ? ih + (bw + pad) * 2 : ih;
    var imgX = outside ? bw + pad : 0;
    var imgY = outside ? bw + pad : 0;

    var canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    var ctx = canvas.getContext('2d');

    ctx.drawImage(source, imgX, imgY, iw, ih);

    ctx.strokeStyle = options.color;
    ctx.lineWidth = bw;

    var borderOffset = bw / 2;
    var rx = outside ? bw / 2 + pad : borderOffset;
    var ry = outside ? bw / 2 + pad : borderOffset;
    var rw = cw - bw - (outside ? pad * 2 : 0);
    var rh = ch - bw - (outside ? pad * 2 : 0);
    if (!outside) { rw = iw - bw; rh = ih - bw; }

    var radius = options.corner === 'rounded' ? options.radius : 0;

    if (options.style === 'dashed') {
      ctx.setLineDash([bw * 3, bw * 2]);
      drawBorderRect(ctx, rx, ry, rw, rh, radius);
      ctx.stroke();
      ctx.setLineDash([]);
      return canvas;
    }

    if (options.style === 'double') {
      /* Two thin rules with a gap between them — each path has to be
         stroked before the next one begins, or only the last survives. */
      ctx.setLineDash([]);
      ctx.lineWidth = Math.max(1, bw / 3);
      drawBorderRect(ctx, rx, ry, rw, rh, radius);
      ctx.stroke();
      var inset = bw;
      drawBorderRect(ctx, rx + inset, ry + inset, rw - inset * 2, rh - inset * 2,
        radius ? Math.max(0, radius - inset) : 0);
      ctx.stroke();
      return canvas;
    }

    ctx.setLineDash([]);
    drawBorderRect(ctx, rx, ry, rw, rh, radius);
    ctx.stroke();
    return canvas;
  }

  function updatePreview() {
    if (!_src) return;
    var canvasEl = document.getElementById('iab-preview');
    var wrap = document.getElementById('iab-preview-wrap');
    if (!canvasEl || !wrap) return;
    TGImageUtil.drawPreview(renderBorder(_src, getOptions(_optionsEl || document)), canvasEl, 360);
    wrap.style.display = 'block';
    TGImgTools.show('iab', true);
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

    onProgress && onProgress(0.5, 'Drawing border...');
    var canvas = renderBorder(_src, options);
    updatePreview();

    var match = file.name.match(/\.[^.]+$/);
    var ext = match ? match[0] : '.jpg';
    var mime = ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, mime, 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-bordered' + ext };
  }

  function drawBorderRect(ctx, x, y, w, h, radius) {
    if (!radius) {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
    } else {
      var r = Math.min(radius, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

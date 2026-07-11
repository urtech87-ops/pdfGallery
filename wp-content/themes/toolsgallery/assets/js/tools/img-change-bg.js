/**
 * ToolsGallery — Change Image Background
 * Handler: img-change-bg
 * URL: /tool/change-background/
 *
 * The subject is cut out automatically via TGSegment (no rectangle).
 * The composite over the chosen background (solid / gradient / image)
 * previews live whenever any background option changes.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-change-bg' };

  var _origImg = null;
  var _cutout = null;
  var _cutoutPromise = null;
  var _bgImg = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info" id="icb-status">Upload a photo — the subject is detected automatically, then pick a new background.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Background</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="icb-bg" value="color" checked> Solid Color</label>' +
        '<label><input type="radio" name="icb-bg" value="gradient"> Gradient</label>' +
        '<label><input type="radio" name="icb-bg" value="image"> Upload Image</label>' +
      '</div>' +
    '</div>' +
    '<div id="icb-color-wrap" class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icb-color">Color</label>' +
      '<input type="color" id="icb-color" value="#4a90e2">' +
    '</div>' +
    '<div id="icb-gradient-wrap" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="icb-grad1">Color 1</label>' +
        '<input type="color" id="icb-grad1" value="#667eea">' +
        '<label class="tg-opt-label" for="icb-grad2" style="margin-left:12px">Color 2</label>' +
        '<input type="color" id="icb-grad2" value="#764ba2">' +
      '</div>' +
    '</div>' +
    '<div id="icb-image-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label">Background Image</label>' +
      '<input type="file" id="icb-bg-file" accept="image/*" class="tg-text-input">' +
    '</div>' +
    '<div id="icb-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Original</p>' +
          '<canvas id="icb-before" style="max-width:280px;border:1px solid #ddd;border-radius:4px"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">New background</p>' +
          '<canvas id="icb-after" style="max-width:280px;border:1px solid #ddd;border-radius:4px"></canvas></div>' +
      '</div>' +
    '</div>';
  }

  function wireOptions(container) {
    container.querySelectorAll('input[name="icb-bg"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var colorWrap = container.querySelector('#icb-color-wrap');
        var imageWrap = container.querySelector('#icb-image-wrap');
        var gradWrap = container.querySelector('#icb-gradient-wrap');
        if (colorWrap) colorWrap.hidden = r.value !== 'color';
        if (imageWrap) imageWrap.hidden = r.value !== 'image';
        if (gradWrap) gradWrap.hidden = r.value !== 'gradient';
        updatePreview(container);
      });
    });
    ['#icb-color', '#icb-grad1', '#icb-grad2'].forEach(function (sel) {
      var input = container.querySelector(sel);
      if (input) input.addEventListener('input', function () { updatePreview(container); });
    });
    var bgFile = container.querySelector('#icb-bg-file');
    if (bgFile) bgFile.addEventListener('change', function () {
      _bgImg = null;
      if (bgFile.files && bgFile.files[0]) {
        TGImageUtil.loadImage(bgFile.files[0]).then(function (img) {
          _bgImg = img;
          updatePreview(container);
        }).catch(function () {});
      }
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var bgType = optionsEl.querySelector('input[name="icb-bg"]:checked');
    var color = optionsEl.querySelector('#icb-color');
    var bgFile = optionsEl.querySelector('#icb-bg-file');
    var grad1 = optionsEl.querySelector('#icb-grad1');
    var grad2 = optionsEl.querySelector('#icb-grad2');
    return {
      bgType: bgType ? bgType.value : 'color',
      color: color ? color.value : '#4a90e2',
      bgFile: bgFile && bgFile.files ? bgFile.files[0] : null,
      grad1: grad1 ? grad1.value : '#667eea',
      grad2: grad2 ? grad2.value : '#764ba2',
    };
  }

  function setStatus(msg) {
    var el = document.getElementById('icb-status');
    if (el) el.textContent = msg;
  }

  /* Paint the chosen background onto a context, then the subject on top */
  function composite(ctx, w, h, opts) {
    if (opts.bgType === 'gradient') {
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, opts.grad1);
      grad.addColorStop(1, opts.grad2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (opts.bgType === 'image' && _bgImg) {
      // Cover-fit the background image
      var scale = Math.max(w / _bgImg.naturalWidth, h / _bgImg.naturalHeight);
      var bw = _bgImg.naturalWidth * scale, bh = _bgImg.naturalHeight * scale;
      ctx.drawImage(_bgImg, (w - bw) / 2, (h - bh) / 2, bw, bh);
    } else {
      ctx.fillStyle = opts.color || '#4a90e2';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(_cutout.subjectCanvas, 0, 0, w, h);
  }

  function updatePreview(optionsEl) {
    if (!_cutout) return;
    var afterEl = document.getElementById('icb-after');
    if (!afterEl) return;
    var opts = getOptions(optionsEl || document.querySelector('.tg-tool-box .tg-options'));
    var scale = Math.min(1, 280 / _cutout.width);
    afterEl.width = Math.round(_cutout.width * scale);
    afterEl.height = Math.round(_cutout.height * scale);
    composite(afterEl.getContext('2d'), afterEl.width, afterEl.height, opts);
  }

  function startCutout(file) {
    _cutoutPromise = TGSegment.cutout(file || _origImg, function (pct, msg) {
      if (msg) setStatus(msg);
    }).then(function (result) {
      _cutout = result;
      setStatus(result.method === 'floodfill'
        ? 'Subject isolated with color detection (works best on even backgrounds). Choose a background.'
        : 'Subject detected! Choose a background below — the preview updates live.');
      updatePreview();
      return result;
    }).catch(function (e) {
      setStatus('Could not detect the subject: ' + (e && e.message ? e.message : 'unknown error'));
      throw e;
    });
    return _cutoutPromise;
  }

  function onFileReady(file) {
    _origImg = null;
    _cutout = null;
    _cutoutPromise = null;
    if (!file) return;

    TGImageUtil.loadImage(file).then(function (img) {
      _origImg = img;
      var beforeEl = document.getElementById('icb-before');
      var wrap = document.getElementById('icb-preview-wrap');
      if (beforeEl) TGImageUtil.drawPreview(img, beforeEl, 280);
      if (wrap) wrap.style.display = 'block';
      setStatus('Detecting subject...');
      startCutout(file);
    }).catch(function () {
      alert('Could not load image. Please try a different file.');
    });
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil || !window.TGSegment) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Preparing...');
    if (!_origImg) _origImg = await TGImageUtil.loadImage(file);
    if (options.bgFile && !_bgImg) _bgImg = await TGImageUtil.loadImage(options.bgFile);

    await (_cutoutPromise || startCutout(file));
    if (!_cutout) throw new Error('Could not detect the subject in this image.');

    onProgress && onProgress(0.7, 'Compositing...');
    var w = _cutout.width, h = _cutout.height;
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    composite(canvas.getContext('2d'), w, h, options);

    updatePreview();
    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-new-bg.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

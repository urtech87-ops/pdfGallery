/**
 * ToolsGallery — Blur Image Background
 * Handler: img-blur-bg
 * URL: /tool/blur-background/
 *
 * The subject is detected automatically via TGSegment (no rectangle) and
 * kept sharp over a blurred background. The preview re-renders live when
 * the blur-intensity slider moves.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-blur-bg' };

  var _origImg = null;
  var _cutout = null;
  var _cutoutPromise = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info" id="ibb-status">Upload a photo — the subject is detected automatically and kept sharp.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ibb-blur">Blur Intensity: <span id="ibb-blur-val">10</span>px</label>' +
      '<input type="range" id="ibb-blur" min="2" max="40" value="10" style="flex:1">' +
    '</div>' +
    '<div id="ibb-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Original</p>' +
          '<canvas id="ibb-before" style="max-width:280px;border:1px solid #ddd;border-radius:4px"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Blurred background</p>' +
          '<canvas id="ibb-after" style="max-width:280px;border:1px solid #ddd;border-radius:4px"></canvas></div>' +
      '</div>' +
    '</div>';
  }

  function wireOptions(container) {
    var sl = container.querySelector('#ibb-blur');
    var sv = container.querySelector('#ibb-blur-val');
    if (sl && sv) {
      var debounce = null;
      sl.addEventListener('input', function () {
        sv.textContent = sl.value;
        clearTimeout(debounce);
        debounce = setTimeout(updatePreview, 120);
      });
    }
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var blur = optionsEl.querySelector('#ibb-blur');
    return { blur: blur ? parseInt(blur.value, 10) : 10 };
  }

  function setStatus(msg) {
    var el = document.getElementById('ibb-status');
    if (el) el.textContent = msg;
  }

  function currentBlur() {
    var slider = document.getElementById('ibb-blur');
    return slider ? parseInt(slider.value, 10) : 10;
  }

  /* Draw the composite (blurred image + sharp subject) at width w.
     Blur radius scales with the render size so preview matches export. */
  function renderComposite(targetCanvas, renderW, blurPx) {
    var scale = renderW / _cutout.width;
    var w = Math.round(_cutout.width * scale);
    var h = Math.round(_cutout.height * scale);
    targetCanvas.width = w;
    targetCanvas.height = h;
    var ctx = targetCanvas.getContext('2d');

    // Unblurred base first so canvas edges don't fade to transparent
    ctx.drawImage(_origImg, 0, 0, w, h);
    ctx.filter = 'blur(' + Math.max(1, blurPx * scale) + 'px)';
    ctx.drawImage(_origImg, 0, 0, w, h);
    ctx.filter = 'none';
    ctx.drawImage(_cutout.subjectCanvas, 0, 0, w, h);
  }

  function updatePreview() {
    if (!_cutout || !_origImg) return;
    var afterEl = document.getElementById('ibb-after');
    if (!afterEl) return;
    renderComposite(afterEl, Math.min(_cutout.width, 560), currentBlur());
  }

  function startCutout(file) {
    _cutoutPromise = TGSegment.cutout(file || _origImg, function (pct, msg) {
      if (msg) setStatus(msg);
    }).then(function (result) {
      _cutout = result;
      setStatus(result.method === 'floodfill'
        ? 'Subject isolated with color detection (works best on even backgrounds). Adjust the blur below.'
        : 'Subject detected! Adjust the blur below — the preview updates live.');
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
      var beforeEl = document.getElementById('ibb-before');
      var wrap = document.getElementById('ibb-preview-wrap');
      if (beforeEl) TGImageUtil.drawPreview(img, beforeEl, 280);
      if (wrap) wrap.style.display = 'block';
      setStatus('Detecting subject...');
      startCutout(file);
    }).catch(function () {});
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil || !window.TGSegment) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Preparing...');
    if (!_origImg) _origImg = await TGImageUtil.loadImage(file);

    await (_cutoutPromise || startCutout(file));
    if (!_cutout) throw new Error('Could not detect the subject in this image.');

    onProgress && onProgress(0.6, 'Applying blur...');
    var canvas = document.createElement('canvas');
    renderComposite(canvas, _cutout.width, options.blur || 10);

    updatePreview();
    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-blurred-bg.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

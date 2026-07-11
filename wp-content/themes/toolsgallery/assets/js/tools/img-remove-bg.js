/**
 * ToolsGallery — Remove Background
 * Handler: img-remove-bg
 * URL: /tool/remove-background/
 *
 * Automatic subject cutout via TGSegment (remove.bg API → MediaPipe →
 * flood fill). Segmentation starts as soon as the file is uploaded and
 * the transparent result previews live next to the original. A manual
 * tolerance slider appears only when the flood-fill fallback was used.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-bg' };

  var _origImg = null;
  var _cutout = null;         // last TGSegment result
  var _cutoutPromise = null;  // in-flight segmentation for the current file

  function getOptionsHTML() {
    return '<p class="tg-opt-info" id="irb-status">Upload a photo — the subject is detected automatically, no selection needed.</p>' +
    '<div id="irb-tol-wrap" hidden>' +
      '<p class="tg-opt-info" style="color:#b45309">AI detection unavailable — using color-based removal (works best on even backgrounds).</p>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="irb-tolerance">Tolerance: <span id="irb-tol-val">35</span></label>' +
        '<input type="range" id="irb-tolerance" min="1" max="100" value="35" style="flex:1">' +
      '</div>' +
    '</div>' +
    '<div id="irb-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Original</p>' +
          '<canvas id="irb-before" style="max-width:280px;border:1px solid #ddd;border-radius:4px"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Result (transparent)</p>' +
          '<canvas id="irb-after" style="max-width:280px;border:1px solid #ddd;border-radius:4px;background:repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0 / 14px 14px"></canvas></div>' +
      '</div>' +
    '</div>';
  }

  function wireOptions(container) {
    var tol = container.querySelector('#irb-tolerance');
    var tv = container.querySelector('#irb-tol-val');
    if (tol && tv) {
      var debounce = null;
      tol.addEventListener('input', function () {
        tv.textContent = tol.value;
        clearTimeout(debounce);
        debounce = setTimeout(function () {
          if (!_origImg) return;
          _cutout = TGSegment.floodFillCutout(_origImg, parseInt(tol.value, 10));
          _cutoutPromise = Promise.resolve(_cutout);
          drawResultPreview();
        }, 150);
      });
    }
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var tol = optionsEl.querySelector('#irb-tolerance');
    return { tolerance: tol ? parseInt(tol.value, 10) : 35 };
  }

  function setStatus(msg) {
    var el = document.getElementById('irb-status');
    if (el) el.textContent = msg;
  }

  function drawResultPreview() {
    var afterEl = document.getElementById('irb-after');
    if (afterEl && _cutout) TGImageUtil.drawPreview(_cutout.subjectCanvas, afterEl, 280);
  }

  function startCutout(file) {
    if (!window.TGSegment) return null;
    _cutoutPromise = TGSegment.cutout(file || _origImg, function (pct, msg) {
      if (msg) setStatus(msg);
    }).then(function (result) {
      _cutout = result;
      drawResultPreview();
      setStatus(result.method === 'floodfill'
        ? 'Background removed with color detection — adjust tolerance below if needed.'
        : 'Subject detected! Press the button below to save the transparent PNG.');
      var tolWrap = document.getElementById('irb-tol-wrap');
      if (tolWrap) tolWrap.hidden = result.method !== 'floodfill';
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
      var beforeEl = document.getElementById('irb-before');
      var wrap = document.getElementById('irb-preview-wrap');
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

    // Reuse the segmentation that started on upload; start one if needed
    var result;
    try {
      result = await (_cutoutPromise || startCutout(file));
    } catch (e) {
      onProgress && onProgress(0.4, 'Falling back to color-based removal...');
      result = TGSegment.floodFillCutout(_origImg, options.tolerance || 35);
      _cutout = result;
    }
    if (!result) throw new Error('Could not remove the background from this image.');

    drawResultPreview();
    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(result.subjectCanvas, 'image/png', 1.0);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-no-bg.png' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

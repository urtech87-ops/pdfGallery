/**
 * ToolsGallery — Remove Background
 * Handler: img-remove-bg
 * URL: /tool/remove-background/
 *
 * Automatic cutout, no selection to draw. TGImageUtil.autoCutout picks the
 * best method available: remove.bg when REMOVEBG_API_KEY is set in
 * wp-config, the on-device model when it loads, and otherwise the shared
 * edge-seeded detectBackgroundMask. The result is composited with
 * applyMask('transparent') and previews live over a checkerboard so the
 * transparency is visible before anything is downloaded.
 *
 * Canvas sizing always happens after the image has loaded — the preview
 * canvases are sized inside the load callbacks below, never before.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-bg' };

  var _origImg = null;
  var _cutout = null;         // { subjectCanvas, mask, width, height, method }
  var _cutoutPromise = null;
  var _manualTolerance = false; // true once the user moves the slider

  var DEFAULT_TOLERANCE = 30;

  function getOptionsHTML() {
    return '<p class="tg-opt-info" id="irb-status">Upload a photo — the subject is detected automatically, no selection needed.</p>' +
    '<p class="tg-opt-info" id="irb-method" hidden></p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="irb-tolerance">Edge tolerance: <span id="irb-tol-val">' + DEFAULT_TOLERANCE + '</span></label>' +
      '<input type="range" id="irb-tolerance" min="5" max="120" value="' + DEFAULT_TOLERANCE + '" style="flex:1">' +
    '</div>' +
    '<p class="tg-opt-info tg-opt-hint">Higher tolerance removes more of the background; lower keeps more of the subject.</p>' +
    '<div id="irb-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Original</p>' +
          '<canvas id="irb-before" class="tg-img-preview-canvas"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Result (transparent)</p>' +
          '<canvas id="irb-after" class="tg-img-preview-canvas tg-img-checker"></canvas></div>' +
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
          /* Moving the slider means "do it my way": re-detect locally so
             the number on screen is the number being used. */
          _manualTolerance = true;
          runLocalDetection(parseInt(tol.value, 10));
        }, 180);
      });
    }
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { tolerance: DEFAULT_TOLERANCE };
    var tol = optionsEl.querySelector('#irb-tolerance');
    return { tolerance: tol ? parseInt(tol.value, 10) : DEFAULT_TOLERANCE };
  }

  function currentTolerance() {
    var el = document.getElementById('irb-tolerance');
    return el ? parseInt(el.value, 10) : DEFAULT_TOLERANCE;
  }

  function setStatus(msg) {
    var el = document.getElementById('irb-status');
    if (el) el.textContent = msg;
  }

  function setMethodNote(cutout) {
    var el = document.getElementById('irb-method');
    if (!el) return;
    if (!cutout) { el.hidden = true; return; }
    var msg = '';
    if (cutout.method === 'removebg') {
      msg = 'Cut out with remove.bg — move the tolerance slider to switch to on-device colour detection instead.';
    } else if (cutout.method === 'local') {
      if (cutout.coverage < 0.02) {
        msg = 'Almost nothing matched the background. This photo’s background is probably too busy for colour detection — try raising the tolerance.';
      } else if (cutout.coverage > 0.97) {
        msg = 'Nearly the whole image was treated as background. Lower the tolerance to keep more of the subject.';
      } else {
        msg = 'Cut out with colour detection — works best when the background is reasonably even. Tune it with the slider.';
      }
    } else {
      msg = 'Cut out with on-device AI detection — move the tolerance slider to switch to colour detection instead.';
    }
    el.textContent = msg;
    el.hidden = false;
  }

  /* Draw the transparent result into the preview canvas. The canvas is
     sized here, after the cutout exists — never ahead of it. */
  function drawResultPreview() {
    var afterEl = document.getElementById('irb-after');
    if (!afterEl || !_cutout) return;
    TGImageUtil.drawPreview(_cutout.subjectCanvas, afterEl, 280);
  }

  /* Local (no-model) detection at an explicit tolerance — this is the
     path the slider drives, and the default path when no API key is set
     and the model cannot load. */
  function runLocalDetection(tolerance) {
    if (!_origImg) return null;
    setStatus('Detecting background...');
    var canvas = document.createElement('canvas');
    canvas.width = _origImg.naturalWidth;
    canvas.height = _origImg.naturalHeight;
    canvas.getContext('2d').drawImage(_origImg, 0, 0);

    var mask = TGImageUtil.backgroundMaskFor(_origImg, { tolerance: tolerance });
    TGImageUtil.applyMask(canvas, mask, 'transparent');

    _cutout = {
      subjectCanvas: canvas,
      mask: mask,
      width: canvas.width,
      height: canvas.height,
      method: 'local',
      coverage: mask.coverage,
    };
    _cutoutPromise = Promise.resolve(_cutout);
    drawResultPreview();
    setStatus('Background removed — download the transparent PNG below.');
    setMethodNote(_cutout);
    return _cutout;
  }

  function startCutout(file) {
    _cutoutPromise = TGImageUtil.autoCutout(file || _origImg, {
      tolerance: currentTolerance(),
      useModel: !_manualTolerance,
    }, function (pct, msg) {
      if (msg) setStatus(msg);
    }).then(function (result) {
      _cutout = result;
      drawResultPreview();
      setStatus('Background removed — download the transparent PNG below.');
      setMethodNote(result);
      return result;
    }).catch(function (e) {
      setStatus('Could not remove the background: ' + (e && e.message ? e.message : 'unknown error'));
      throw e;
    });
    return _cutoutPromise;
  }

  function onFileReady(file) {
    _origImg = null;
    _cutout = null;
    _cutoutPromise = null;
    _manualTolerance = false;
    if (!file) return;

    TGImageUtil.loadImage(file).then(function (img) {
      _origImg = img;
      var beforeEl = document.getElementById('irb-before');
      var wrap = document.getElementById('irb-preview-wrap');
      /* drawPreview sizes the canvas from the loaded image, so this only
         ever runs once the image is decoded. */
      if (beforeEl) TGImageUtil.drawPreview(img, beforeEl, 280);
      if (wrap) wrap.style.display = 'block';
      setStatus('Detecting subject...');
      startCutout(file);
    }).catch(function () {
      alert('Could not load image. Please try a different file.');
    });
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Preparing...');
    if (!_origImg) _origImg = await TGImageUtil.loadImage(file);

    /* Reuse the cutout made on upload; only redo the work if the upload
       path never produced one. */
    if (!_cutout) {
      try {
        await (_cutoutPromise || startCutout(file));
      } catch (e) {
        runLocalDetection(options.tolerance || DEFAULT_TOLERANCE);
      }
    }
    if (!_cutout) throw new Error('Could not remove the background from this image.');

    drawResultPreview();
    onProgress && onProgress(0.9, 'Saving...');
    /* PNG only — a transparent background cannot survive JPEG. */
    var blob = await TGImageUtil.canvasToBlob(_cutout.subjectCanvas, 'image/png', 1.0);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-no-bg.png' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

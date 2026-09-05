/**
 * ToolsGallery — Blur Image Background
 * Handler: img-blur-bg
 * URL: /tool/blur-image-background/
 *
 * Automatic detection — no rectangle and no elliptical region to place.
 * TGImageUtil.autoCutout finds the subject and TGImageUtil.applyMask's
 * 'blur' mode blurs only the background pixels, leaving the subject sharp.
 *
 * Rotating turns the detected mask with the photo rather than running the
 * segmentation again, so a rotate stays instant and the subject still
 * lines up. Canvas width/height are set inside render(), which only runs
 * once the image has loaded and a mask exists.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-blur-bg' };

  var _origImg = null;     // the photo as uploaded
  var _workImg = null;     // working source — a rotated canvas once _rot !== 0
  var _rot = 0;
  var _baseCutout = null;  // detection result at 0°
  var _cutout = null;      // _baseCutout turned to match _rot
  var _cutoutPromise = null;
  var _manualTolerance = false;

  var DEFAULT_BLUR = 10;
  var MIN_BLUR = 1;
  var MAX_BLUR = 20;
  var DEFAULT_TOLERANCE = 30;
  var PREVIEW_W = 560;

  function getOptionsHTML() {
    return '<p class="tg-opt-info" id="ibb-status">Upload a photo — the subject is detected automatically and kept sharp.</p>' +
    '<p class="tg-opt-info" id="ibb-method" hidden></p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ibb-blur">Blur strength: <span id="ibb-blur-val">' + DEFAULT_BLUR + '</span>px</label>' +
      '<input type="range" id="ibb-blur" min="' + MIN_BLUR + '" max="' + MAX_BLUR + '" value="' + DEFAULT_BLUR + '" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ibb-tolerance">Edge tolerance: <span id="ibb-tol-val">' + DEFAULT_TOLERANCE + '</span></label>' +
      '<input type="range" id="ibb-tolerance" min="5" max="120" value="' + DEFAULT_TOLERANCE + '" style="flex:1">' +
    '</div>' +
    '<p class="tg-opt-info tg-opt-hint">Raise the tolerance if part of the background stays sharp; lower it if the subject is getting blurred.</p>' +
    TGImgTools.barHTML('ibb') +
    '<div id="ibb-preview-wrap" class="tg-img-preview-frame" style="display:none">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Original</p>' +
          '<canvas id="ibb-before" style="max-width:280px"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Blurred background</p>' +
          '<canvas id="ibb-after" style="max-width:280px"></canvas></div>' +
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

    var tol = container.querySelector('#ibb-tolerance');
    var tv = container.querySelector('#ibb-tol-val');
    if (tol && tv) {
      var tolDebounce = null;
      tol.addEventListener('input', function () {
        tv.textContent = tol.value;
        clearTimeout(tolDebounce);
        tolDebounce = setTimeout(function () {
          if (!_origImg) return;
          _manualTolerance = true;
          runLocalDetection(parseInt(tol.value, 10));
          updatePreview();
        }, 180);
      });
    }

    TGImgTools.wire(container, 'ibb', {
      onRotate: function () {
        if (!_origImg) return;
        _rot = (_rot + 90) % 360;
        _workImg = TGImgTools.rotate(_origImg, _rot);
        applyRotationToCutout();
        var beforeEl = document.getElementById('ibb-before');
        if (beforeEl) TGImageUtil.drawPreview(_workImg, beforeEl, 280);
        updatePreview();
      },
      onClear: function () {
        _origImg = null; _workImg = null; _rot = 0;
        _baseCutout = null; _cutout = null; _cutoutPromise = null;
        _manualTolerance = false;
      },
    });
  }

  function getOptions(optionsEl) {
    var el = optionsEl || document.querySelector('.tg-tool-box .tg-options') || document;
    var blur = el.querySelector('#ibb-blur');
    var tol = el.querySelector('#ibb-tolerance');
    return {
      blur: blur ? parseInt(blur.value, 10) : DEFAULT_BLUR,
      tolerance: tol ? parseInt(tol.value, 10) : DEFAULT_TOLERANCE,
    };
  }

  function setStatus(msg) {
    var el = document.getElementById('ibb-status');
    if (el) el.textContent = msg;
  }

  function setMethodNote(cutout) {
    var el = document.getElementById('ibb-method');
    if (!el) return;
    if (!cutout) { el.hidden = true; return; }
    var msg;
    if (cutout.method === 'removebg') {
      msg = 'Subject detected with remove.bg — only the background is blurred.';
    } else if (cutout.method === 'local') {
      if (cutout.coverage < 0.02) {
        msg = 'Almost no background was detected, so there is little to blur. Try raising the tolerance.';
      } else if (cutout.coverage > 0.97) {
        msg = 'Nearly the whole photo was treated as background. Lower the tolerance to keep the subject sharp.';
      } else {
        msg = 'Subject isolated with colour detection — only the background is blurred.';
      }
    } else {
      msg = 'Subject detected with on-device AI — only the background is blurred.';
    }
    el.textContent = msg;
    el.hidden = false;
  }

  function currentBlur() {
    var slider = document.getElementById('ibb-blur');
    return slider ? parseInt(slider.value, 10) : DEFAULT_BLUR;
  }

  /* Turn the detected mask by the current rotation so it still matches the
     working photo. maskToCanvas -> rotate -> maskFromCutout round-trips
     through the subject alpha, which is exactly what a rotate needs. */
  function applyRotationToCutout() {
    if (!_baseCutout) { _cutout = null; return; }
    if (!_rot) { _cutout = _baseCutout; return; }
    var swap = (_rot === 90 || _rot === 270);
    var rotatedMaskCanvas = TGImgTools.rotate(TGImageUtil.maskToCanvas(_baseCutout.mask), _rot);
    _cutout = {
      subjectCanvas: TGImgTools.rotate(_baseCutout.subjectCanvas, _rot),
      mask: TGImageUtil.maskFromCutout(rotatedMaskCanvas, Math.max(rotatedMaskCanvas.width, rotatedMaskCanvas.height)),
      width: swap ? _baseCutout.height : _baseCutout.width,
      height: swap ? _baseCutout.width : _baseCutout.height,
      method: _baseCutout.method,
      coverage: _baseCutout.coverage,
    };
  }

  /* Draw the composite at renderW pixels wide. The blur radius scales with
     the render size so the preview matches the exported file. */
  function render(targetCanvas, renderW, blurPx) {
    if (!_cutout || !_workImg) return false;
    var scale = Math.min(1, renderW / _cutout.width);
    var w = Math.max(1, Math.round(_cutout.width * scale));
    var h = Math.max(1, Math.round(_cutout.height * scale));
    targetCanvas.width = w;
    targetCanvas.height = h;

    var ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(_workImg, 0, 0, w, h);
    TGImageUtil.applyMask(targetCanvas, _cutout.mask, 'blur', { blur: Math.max(1, blurPx * scale) });
    return true;
  }

  function updatePreview() {
    var afterEl = document.getElementById('ibb-after');
    if (!afterEl) return;
    render(afterEl, Math.min(_cutout ? _cutout.width : PREVIEW_W, PREVIEW_W), currentBlur());
  }

  /* Local detection at an explicit tolerance — what the slider drives. */
  function runLocalDetection(tolerance) {
    if (!_origImg) return null;
    var mask = TGImageUtil.backgroundMaskFor(_origImg, { tolerance: tolerance });
    _baseCutout = {
      subjectCanvas: TGImageUtil.cutoutFromMask(_origImg, mask),
      mask: mask,
      width: _origImg.naturalWidth,
      height: _origImg.naturalHeight,
      method: 'local',
      coverage: mask.coverage,
    };
    applyRotationToCutout();
    _cutoutPromise = Promise.resolve(_baseCutout);
    setMethodNote(_baseCutout);
    return _baseCutout;
  }

  function startCutout(file) {
    _cutoutPromise = TGImageUtil.autoCutout(file || _origImg, {
      tolerance: DEFAULT_TOLERANCE,
      useModel: !_manualTolerance,
    }, function (pct, msg) {
      if (msg) setStatus(msg);
    }).then(function (result) {
      _baseCutout = result;
      applyRotationToCutout();
      setStatus('Subject detected — adjust the blur below, the preview updates live.');
      setMethodNote(result);
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
    _workImg = null;
    _rot = 0;
    _baseCutout = null;
    _cutout = null;
    _cutoutPromise = null;
    _manualTolerance = false;
    if (!file) return;

    TGImageUtil.loadImage(file).then(function (img) {
      _origImg = img;
      _workImg = img;
      var beforeEl = document.getElementById('ibb-before');
      if (beforeEl) TGImageUtil.drawPreview(img, beforeEl, 280);
      TGImgTools.show('ibb', true, 'ibb-preview-wrap');
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
    if (!_origImg) {
      _origImg = await TGImageUtil.loadImage(file);
      _workImg = TGImgTools.rotate(_origImg, _rot);
    }

    if (!_cutout) {
      try {
        await (_cutoutPromise || startCutout(file));
      } catch (e) {
        runLocalDetection(options.tolerance || DEFAULT_TOLERANCE);
      }
    }
    if (!_cutout) throw new Error('Could not detect the subject in this image.');

    onProgress && onProgress(0.6, 'Blurring the background...');
    var canvas = document.createElement('canvas');
    render(canvas, _cutout.width, options.blur || DEFAULT_BLUR);

    updatePreview();
    onProgress && onProgress(0.9, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-blurred-bg.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

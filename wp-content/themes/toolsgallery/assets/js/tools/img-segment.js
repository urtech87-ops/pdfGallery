/**
 * ToolsGallery — img-segment.js
 * Shared subject-segmentation helper used by img-remove-bg, img-change-bg
 * and img-blur-bg so none of them need a hand-drawn rectangle.
 *
 * TGSegment.cutout(fileOrImage, onProgress)
 *   → Promise<{ subjectCanvas, maskCanvas, width, height, method }>
 *   subjectCanvas: transparent-PNG canvas of the foreground (full res)
 *   maskCanvas:    grayscale mask, white = subject, black = background
 *
 * Strategy (first that succeeds wins):
 *   1. remove.bg API via the tg_removebg AJAX proxy — best quality,
 *      only when tgAiConfig.removebgConfigured is truthy.
 *   2. MediaPipe Selfie Segmentation — client-side, free, no key.
 *      Tuned for people/portraits. First run downloads the model.
 *   3. Corner-sample flood fill — works only on near-uniform backgrounds.
 *
 * DEVELOPER SWITCH: MediaPipe is portrait-tuned. For stronger cutout on
 * general (non-people) objects, swap step 2 to @imgly/background-removal
 * (heavier, ESM): set USE_IMGLY = true below. It is lazy-imported from
 * https://esm.sh/@imgly/background-removal and used instead of MediaPipe.
 */
(function () {
  'use strict';

  var USE_IMGLY = false; // ← switch: true = @imgly/background-removal, false = MediaPipe

  var MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';
  var MEDIAPIPE_ASSETS = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/';
  var IMGLY_CDN = 'https://esm.sh/@imgly/background-removal';
  var SEG_MAX_DIM = 1280; // segmentation runs on a downscaled copy for speed

  var _segmenter = null;      // cached MediaPipe instance
  var _segmenterReady = null; // promise for model load

  function toImage(fileOrImage) {
    if (fileOrImage instanceof HTMLImageElement) {
      return Promise.resolve(fileOrImage);
    }
    return TGImageUtil.loadImage(fileOrImage);
  }

  /* Build { subjectCanvas, maskCanvas } from a full-res image and a
     grayscale mask canvas (any size — it is scaled and feathered). */
  function composeResult(img, rawMask, method) {
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;

    // Feathered alpha mask at full resolution
    var alphaMask = document.createElement('canvas');
    alphaMask.width = w; alphaMask.height = h;
    var actx = alphaMask.getContext('2d');
    var feather = Math.max(1, Math.round(Math.max(w, h) / 600));
    actx.filter = 'blur(' + feather + 'px)';
    actx.drawImage(rawMask, 0, 0, w, h);
    actx.filter = 'none';

    // Subject = image kept only where the mask has alpha
    var subject = document.createElement('canvas');
    subject.width = w; subject.height = h;
    var sctx = subject.getContext('2d');
    sctx.drawImage(img, 0, 0, w, h);
    sctx.globalCompositeOperation = 'destination-in';
    sctx.drawImage(alphaMask, 0, 0);
    sctx.globalCompositeOperation = 'source-over';

    // Visible grayscale mask (white subject on black) for consumers
    var mask = document.createElement('canvas');
    mask.width = w; mask.height = h;
    var mctx = mask.getContext('2d');
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, w, h);
    mctx.drawImage(alphaMask, 0, 0);

    return { subjectCanvas: subject, maskCanvas: mask, width: w, height: h, method: method };
  }

  /* Convert a canvas whose ALPHA or LUMINANCE encodes the mask into a
     white-with-alpha canvas usable with destination-in compositing.
     alphaOnly: read only the alpha channel — required when the source is
     a color cutout (dark subjects would zero a luminance-based mask). */
  function normalizeMask(srcCanvas, alphaOnly) {
    var w = srcCanvas.width, h = srcCanvas.height;
    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var octx = out.getContext('2d');
    var sctx = srcCanvas.getContext('2d');
    var src = sctx.getImageData(0, 0, w, h);
    var dst = octx.createImageData(w, h);
    var s = src.data, d = dst.data;
    for (var i = 0; i < s.length; i += 4) {
      /* min(alpha, red) is robust for both white-on-transparent and
         white-on-black mask renderings */
      var m = alphaOnly ? s[i + 3] : Math.min(s[i + 3], s[i]);
      d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = m;
    }
    octx.putImageData(dst, 0, 0);
    return out;
  }

  /* ── 1. remove.bg API ── */
  function apiConfigured() {
    return !!(window.tgAiConfig && parseInt(tgAiConfig.removebgConfigured));
  }

  async function cutoutViaApi(file, img, onProgress) {
    onProgress && onProgress(0.2, 'Removing background with AI (remove.bg)...');
    var config = window.tgAiConfig || {};
    var formData = new FormData();
    formData.append('action', 'tg_removebg');
    formData.append('nonce', config.nonce || '');
    formData.append('image_file', file, file.name || 'image.png');

    var resp = await fetch(config.ajaxUrl || '/wp-admin/admin-ajax.php', { method: 'POST', body: formData });
    var json = await resp.json();
    if (!json.success || !json.data || !json.data.image) {
      throw new Error((json.data && json.data.message) || 'Remove.bg request failed');
    }

    var bytes = Uint8Array.from(atob(json.data.image), function (c) { return c.charCodeAt(0); });
    var blob = new Blob([bytes], { type: 'image/png' });
    var cutImg = await TGImageUtil.loadImage(blob);

    var w = img.naturalWidth, h = img.naturalHeight;
    var subject = document.createElement('canvas');
    subject.width = w; subject.height = h;
    subject.getContext('2d').drawImage(cutImg, 0, 0, w, h);

    // Derive the mask from the returned alpha channel
    var mask = document.createElement('canvas');
    mask.width = w; mask.height = h;
    var mctx = mask.getContext('2d');
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, w, h);
    mctx.drawImage(normalizeMask(subject, true), 0, 0);

    return { subjectCanvas: subject, maskCanvas: mask, width: w, height: h, method: 'removebg' };
  }

  /* ── 2a. MediaPipe Selfie Segmentation ── */
  function getSegmenter(onProgress) {
    if (_segmenterReady) return _segmenterReady;
    _segmenterReady = TGImageUtil.loadScript(MEDIAPIPE_CDN).then(function () {
      if (!window.SelfieSegmentation) throw new Error('MediaPipe failed to initialize.');
      onProgress && onProgress(0.25, 'Loading AI model — first run may take 30–60s...');
      _segmenter = new SelfieSegmentation({
        locateFile: function (f) { return MEDIAPIPE_ASSETS + f; },
      });
      _segmenter.setOptions({ modelSelection: 1 });
      if (typeof _segmenter.initialize === 'function') {
        return _segmenter.initialize().then(function () { return _segmenter; });
      }
      return _segmenter;
    }).catch(function (e) {
      _segmenterReady = null; // allow retry on next call
      throw e;
    });
    return _segmenterReady;
  }

  async function cutoutViaMediaPipe(img, onProgress) {
    var seg = await getSegmenter(onProgress);
    onProgress && onProgress(0.55, 'Detecting subject...');

    // Downscale for the model; the mask is upscaled + feathered afterwards
    var w = img.naturalWidth, h = img.naturalHeight;
    var scale = Math.min(1, SEG_MAX_DIM / Math.max(w, h));
    var sw = Math.max(1, Math.round(w * scale));
    var sh = Math.max(1, Math.round(h * scale));
    var small = document.createElement('canvas');
    small.width = sw; small.height = sh;
    small.getContext('2d').drawImage(img, 0, 0, sw, sh);

    var results = await new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('Segmentation timed out.')); }, 60000);
      seg.onResults(function (r) { clearTimeout(timer); resolve(r); });
      seg.send({ image: small }).catch(function (e) { clearTimeout(timer); reject(e); });
    });

    if (!results || !results.segmentationMask) throw new Error('No segmentation mask produced.');

    // Copy the (possibly WebGL-backed) mask into a 2D canvas, then normalize
    var maskCopy = document.createElement('canvas');
    maskCopy.width = sw; maskCopy.height = sh;
    maskCopy.getContext('2d').drawImage(results.segmentationMask, 0, 0, sw, sh);
    var alphaMask = normalizeMask(maskCopy);

    // Sanity check: an empty mask means no subject was found
    var check = alphaMask.getContext('2d').getImageData(0, 0, sw, sh).data;
    var sum = 0;
    for (var i = 3; i < check.length; i += 400) sum += check[i];
    if (sum === 0) throw new Error('No subject detected in this image.');

    onProgress && onProgress(0.8, 'Cutting out subject...');
    return composeResult(img, alphaMask, 'mediapipe');
  }

  /* ── 2b. @imgly/background-removal (optional heavier alternative) ── */
  async function cutoutViaImgly(file, img, onProgress) {
    onProgress && onProgress(0.25, 'Loading AI model — first run may take 30–60s...');
    var mod = await import(/* webpackIgnore: true */ IMGLY_CDN);
    var removeBackground = mod.removeBackground || mod.default;
    onProgress && onProgress(0.5, 'Detecting subject...');
    var blob = await removeBackground(file || img.src);
    var cutImg = await TGImageUtil.loadImage(blob);

    var w = img.naturalWidth, h = img.naturalHeight;
    var subject = document.createElement('canvas');
    subject.width = w; subject.height = h;
    subject.getContext('2d').drawImage(cutImg, 0, 0, w, h);
    var mask = document.createElement('canvas');
    mask.width = w; mask.height = h;
    var mctx = mask.getContext('2d');
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, w, h);
    mctx.drawImage(normalizeMask(subject, true), 0, 0);
    return { subjectCanvas: subject, maskCanvas: mask, width: w, height: h, method: 'imgly' };
  }

  /* ── 3. Corner-sample flood fill (uniform backgrounds only) ── */
  function cutoutViaFloodFill(img, tolerance) {
    tolerance = tolerance || 35;
    var w = img.naturalWidth, h = img.naturalHeight;
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var data = ctx.getImageData(0, 0, w, h);
    var px = data.data;

    var bg = new Uint8Array(w * h); // 1 = background
    var visited = new Uint8Array(w * h);
    var stack = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];

    stack.forEach(function (seed) {
      var si = (seed[1] * w + seed[0]) * 4;
      seed.push(px[si], px[si + 1], px[si + 2]); // reference color per corner
    });

    while (stack.length) {
      var item = stack.pop();
      var x = item[0], y = item[1], tr = item[2], tg = item[3], tb = item[4];
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      var i = y * w + x;
      if (visited[i]) continue;
      visited[i] = 1;
      var pi = i * 4;
      var dr = px[pi] - tr, dg = px[pi + 1] - tg, db = px[pi + 2] - tb;
      if (Math.sqrt(dr * dr + dg * dg + db * db) > tolerance * 2) continue;
      bg[i] = 1;
      stack.push([x + 1, y, tr, tg, tb], [x - 1, y, tr, tg, tb], [x, y + 1, tr, tg, tb], [x, y - 1, tr, tg, tb]);
    }

    // Mask: white subject, transparent background
    var rawMask = document.createElement('canvas');
    rawMask.width = w; rawMask.height = h;
    var rctx = rawMask.getContext('2d');
    var maskData = rctx.createImageData(w, h);
    var md = maskData.data;
    for (var p = 0; p < w * h; p++) {
      var o = p * 4;
      md[o] = 255; md[o + 1] = 255; md[o + 2] = 255;
      md[o + 3] = bg[p] ? 0 : 255;
    }
    rctx.putImageData(maskData, 0, 0);
    return composeResult(img, rawMask, 'floodfill');
  }

  window.TGSegment = {
    apiConfigured: apiConfigured,

    /* Main entry point — see file header. */
    cutout: async function (fileOrImage, onProgress) {
      var img = await toImage(fileOrImage);
      var isFile = !(fileOrImage instanceof HTMLImageElement);

      // 1. remove.bg (needs the original File for upload)
      if (isFile && apiConfigured()) {
        try {
          return await cutoutViaApi(fileOrImage, img, onProgress);
        } catch (e) {
          onProgress && onProgress(0.25, 'AI API unavailable, using on-device model...');
        }
      }

      // 2. On-device model
      try {
        if (USE_IMGLY) {
          return await cutoutViaImgly(isFile ? fileOrImage : null, img, onProgress);
        }
        return await cutoutViaMediaPipe(img, onProgress);
      } catch (e) {
        onProgress && onProgress(0.6, 'AI model unavailable, using color-based removal...');
      }

      // 3. Flood-fill fallback
      return cutoutViaFloodFill(img);
    },

    /* Exposed for tools that want the manual fallback directly. */
    floodFillCutout: function (img, tolerance) {
      return cutoutViaFloodFill(img, tolerance);
    },
  };
})();

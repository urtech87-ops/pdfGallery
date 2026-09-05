/**
 * ToolsGallery — img-util.js
 * Shared image processing utilities used by all image tools.
 */
(function () {
  'use strict';

  window.TGImageUtil = {

    // Load image from File/Blob object
    loadImage: function (file) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        var url = URL.createObjectURL(file);
        img.onload = function () {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error('Could not load image file.'));
        };
        img.src = url;
      });
    },

    // Create canvas from image (optionally resized)
    imageToCanvas: function (img, width, height) {
      var canvas = document.createElement('canvas');
      canvas.width = width || img.naturalWidth;
      canvas.height = height || img.naturalHeight;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return { canvas: canvas, ctx: ctx };
    },

    // Canvas to Blob (promisified)
    canvasToBlob: function (canvas, mimeType, quality) {
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error('Could not export image.'));
        }, mimeType || 'image/jpeg', quality || 0.92);
      });
    },

    // Get output MIME type from a format keyword
    getMime: function (format) {
      var map = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'avif': 'image/avif',
      };
      return map[String(format || '').toLowerCase()] || 'image/jpeg';
    },

    // Strip extension from filename
    stripExt: function (filename) {
      return String(filename).replace(/\.[^.]+$/, '');
    },

    // Get extension from filename (lowercase, no dot)
    getExt: function (filename) {
      return String(filename).split('.').pop().toLowerCase();
    },

    // Apply grayscale to canvas context
    toGrayscale: function (ctx, width, height) {
      var data = ctx.getImageData(0, 0, width, height);
      var d = data.data;
      for (var i = 0; i < d.length; i += 4) {
        var gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
      }
      ctx.putImageData(data, 0, 0);
    },

    // Apply sepia to canvas context
    toSepia: function (ctx, width, height) {
      var data = ctx.getImageData(0, 0, width, height);
      var d = data.data;
      for (var i = 0; i < d.length; i += 4) {
        var r = d[i], g = d[i + 1], b = d[i + 2];
        d[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      ctx.putImageData(data, 0, 0);
    },

    // Adjust brightness (-255..255)
    adjustBrightness: function (ctx, width, height, brightness) {
      var data = ctx.getImageData(0, 0, width, height);
      var d = data.data;
      for (var i = 0; i < d.length; i += 4) {
        d[i]     = Math.min(255, Math.max(0, d[i] + brightness));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + brightness));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + brightness));
      }
      ctx.putImageData(data, 0, 0);
    },

    // Unsharp-mask style sharpen via 3×3 convolution.
    // amount 0 = no-op, 1 = strong; kernel sums to 1 so brightness is preserved.
    sharpen: function (ctx, width, height, amount) {
      amount = typeof amount === 'number' ? amount : 1;
      if (amount <= 0) return;
      var kernel = [
        0, -amount, 0,
        -amount, 1 + 4 * amount, -amount,
        0, -amount, 0,
      ];
      this.convolve3x3(ctx, width, height, kernel);
    },

    // Generic 3×3 convolution, preserving alpha and edge pixels
    convolve3x3: function (ctx, width, height, kernel) {
      var src = ctx.getImageData(0, 0, width, height);
      var out = ctx.createImageData(width, height);
      var s = src.data;
      var o = out.data;
      // Copy source so 1px border stays untouched
      o.set(s);
      var w4 = width * 4;
      for (var y = 1; y < height - 1; y++) {
        for (var x = 1; x < width - 1; x++) {
          var idx = (y * width + x) * 4;
          for (var c = 0; c < 3; c++) {
            var val =
              kernel[0] * s[idx - w4 - 4 + c] +
              kernel[1] * s[idx - w4 + c] +
              kernel[2] * s[idx - w4 + 4 + c] +
              kernel[3] * s[idx - 4 + c] +
              kernel[4] * s[idx + c] +
              kernel[5] * s[idx + 4 + c] +
              kernel[6] * s[idx + w4 - 4 + c] +
              kernel[7] * s[idx + w4 + c] +
              kernel[8] * s[idx + w4 + 4 + c];
            o[idx + c] = Math.min(255, Math.max(0, val));
          }
          o[idx + 3] = s[idx + 3];
        }
      }
      ctx.putImageData(out, 0, 0);
    },

    // Scaled preview of a canvas/image onto a target canvas element
    drawPreview: function (source, targetCanvas, maxWidth) {
      if (!targetCanvas) return 1;
      var sw = source.width || source.naturalWidth;
      var sh = source.height || source.naturalHeight;
      var sc = Math.min(1, (maxWidth || 400) / sw);
      targetCanvas.width = Math.round(sw * sc);
      targetCanvas.height = Math.round(sh * sc);
      targetCanvas.getContext('2d').drawImage(source, 0, 0, targetCanvas.width, targetCanvas.height);
      return sc;
    },

    // Format bytes for display
    fmtBytes: function (b) {
      if (b < 1024) return b + ' B';
      if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
      return (b / 1048576).toFixed(1) + ' MB';
    },

    /* Draw a source (image or canvas) rotated by a multiple of 90 degrees
       onto a fresh canvas. Returns the source untouched at 0 degrees so the
       common case costs nothing. */
    rotateSource: function (source, degrees) {
      var deg = ((Math.round((degrees || 0) / 90) * 90) % 360 + 360) % 360;
      if (!deg) return source;
      var sw = source.naturalWidth || source.width;
      var sh = source.naturalHeight || source.height;
      var swap = (deg === 90 || deg === 270);
      var canvas = document.createElement('canvas');
      canvas.width = swap ? sh : sw;
      canvas.height = swap ? sw : sh;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(deg * Math.PI / 180);
      ctx.drawImage(source, -sw / 2, -sh / 2, sw, sh);
      return canvas;
    },

    // Load an external script once (used for Tesseract.js lazy load)
    loadScript: function (src) {
      if (!this._scriptCache) this._scriptCache = {};
      if (this._scriptCache[src]) return this._scriptCache[src];
      this._scriptCache[src] = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = function () { reject(new Error('Could not load ' + src)); };
        document.head.appendChild(s);
      });
      return this._scriptCache[src];
    },

    /* =====================================================================
       Background detection — shared by remove-bg, change-bg and blur-bg.

       Nothing here is model-based: it is a border-seeded flood fill, which
       is what the background tools fall back to whenever remove.bg is not
       configured and the on-device model cannot load. Keeping it in one
       place means all three tools get the same edges.
       ===================================================================== */

    /**
     * detectBackgroundMask(imageData, options) → Uint8Array
     *   One entry per pixel: 1 = background, 0 = subject.
     *
     * How it decides:
     *   1. Sample a band a few pixels deep along all four edges and reduce
     *      it to a small set of candidate background colours.
     *   2. Flood-fill inward from every outer-edge pixel, accepting a pixel
     *      when it is within `tolerance` of one of those colours (or, on a
     *      smooth backdrop, close to the pixel it was reached from).
     *   3. Only pixels REACHABLE FROM AN EDGE become background — that is
     *      what keeps interior subject pixels (a face, the middle of a
     *      logo) intact even when they happen to match the backdrop.
     *   4. Despeckle, then feather the edge so the cutout is not jagged.
     *
     * options: { tolerance = 30 (RGB euclidean distance), edgeBand = 3,
     *            feather = 2, despeckle = 1, followGradient = true,
     *            gradientFactor = 0.5 }
     *
     * The returned array also carries:
     *   .width / .height — the size it was computed at
     *   .alpha           — Uint8ClampedArray, 0–255 "how background is this
     *                      pixel" after feathering (255 = fully background).
     *                      applyMask() prefers it so edges come out soft
     *                      instead of stair-stepped.
     */
    detectBackgroundMask: function (imageData, options) {
      options = options || {};
      var w = imageData.width;
      var h = imageData.height;
      var px = imageData.data;
      var n = w * h;

      var tolerance = options.tolerance == null ? 30 : Math.max(1, options.tolerance);
      var band = options.edgeBand == null ? 3 : Math.max(1, options.edgeBand);
      var feather = options.feather == null ? 2 : Math.max(0, options.feather);
      var despeckle = options.despeckle == null ? 1 : Math.max(0, options.despeckle);
      /* Local continuity lets a smooth backdrop (studio gradient, sky) go on
         filling past the colours sampled at the border. Deliberately tighter
         than the main tolerance so it cannot creep into the subject. */
      var gradFactor = options.followGradient === false
        ? 0
        : (options.gradientFactor == null ? 0.5 : options.gradientFactor);

      var tol2 = tolerance * tolerance;
      var local2 = (tolerance * gradFactor) * (tolerance * gradFactor);

      /* ── 1. Candidate background colours from the edge band ──
         Colours are collected at least `tolerance` apart, so a plain
         backdrop yields one candidate and a busy border yields a handful.

         Collecting them is not enough on its own: a person cropped at the
         bottom of the frame puts their shirt in the border band, and if
         that colour is treated as background the fill eats the subject.
         So each candidate is scored, and only ones that behave like a
         backdrop are kept — present in a corner (corners are background in
         almost every photo), or covering a large share of the border. */
      var cand = [];                  // { r, g, b, count, corner }
      var MAX_CANDIDATES = 48;
      var minShare = options.minRepShare == null ? 0.2 : options.minRepShare;

      function findCandidate(list, r, g, b) {
        for (var k = 0; k < list.length; k++) {
          var dr = r - list[k].r, dg = g - list[k].g, db = b - list[k].b;
          if (dr * dr + dg * dg + db * db <= tol2) return list[k];
        }
        return null;
      }

      function sampleEdge(x, y) {
        var o = (y * w + x) * 4;
        var r = px[o], g = px[o + 1], b = px[o + 2];
        var hit = findCandidate(cand, r, g, b);
        if (hit) { hit.count++; return; }
        if (cand.length >= MAX_CANDIDATES) return;
        cand.push({ r: r, g: g, b: b, count: 1, corner: false });
      }

      var bandY = Math.min(band, h);
      var bandX = Math.min(band, w);
      var x, y, i;
      var edgeTotal = 0;
      for (y = 0; y < bandY; y++) {
        for (x = 0; x < w; x++) { sampleEdge(x, y); sampleEdge(x, h - 1 - y); edgeTotal += 2; }
      }
      for (x = 0; x < bandX; x++) {
        for (y = 0; y < h; y++) { sampleEdge(x, y); sampleEdge(w - 1 - x, y); edgeTotal += 2; }
      }

      /* Corner patches — the strongest "this really is the backdrop" vote. */
      var patch = Math.max(2, Math.round(Math.min(w, h) * 0.02));
      var corners = [[0, 0], [w - patch, 0], [0, h - patch], [w - patch, h - patch]];
      for (var c = 0; c < corners.length; c++) {
        for (y = 0; y < patch; y++) {
          for (x = 0; x < patch; x++) {
            var px0 = Math.min(w - 1, corners[c][0] + x);
            var py0 = Math.min(h - 1, corners[c][1] + y);
            var oc = (py0 * w + px0) * 4;
            var hitC = findCandidate(cand, px[oc], px[oc + 1], px[oc + 2]);
            if (hitC) hitC.corner = true;
          }
        }
      }

      var reps = [];                  // flat [r,g,b, r,g,b, …] — the kept ones
      for (i = 0; i < cand.length; i++) {
        if (cand[i].corner || cand[i].count >= edgeTotal * minShare) {
          reps.push(cand[i].r, cand[i].g, cand[i].b);
        }
      }
      /* Nothing looked like a backdrop (every edge is busy) — fall back to
         the single most common border colour rather than giving up. */
      if (!reps.length && cand.length) {
        var best = cand[0];
        for (i = 1; i < cand.length; i++) if (cand[i].count > best.count) best = cand[i];
        reps.push(best.r, best.g, best.b);
      }

      function matchesRep(r, g, b) {
        for (var k = 0; k < reps.length; k += 3) {
          var dr = r - reps[k], dg = g - reps[k + 1], db = b - reps[k + 2];
          if (dr * dr + dg * dg + db * db <= tol2) return true;
        }
        return false;
      }

      var mask = new Uint8Array(n);   // 1 = background
      var seen = new Uint8Array(n);
      /* Every pixel enters the stack at most once (marked on push), so a
         plain Int32Array is big enough and costs no reallocation. */
      var stack = new Int32Array(n);
      var top = 0;

      function push(idx, r, g, b) {
        if (seen[idx]) return;
        seen[idx] = 1;
        if (!matchesRep(r, g, b)) return;
        mask[idx] = 1;
        stack[top++] = idx;
      }

      /* ── 2. Seed from the outer edge ── */
      for (x = 0; x < w; x++) {
        var tIdx = x, bIdx = (h - 1) * w + x;
        push(tIdx, px[tIdx * 4], px[tIdx * 4 + 1], px[tIdx * 4 + 2]);
        push(bIdx, px[bIdx * 4], px[bIdx * 4 + 1], px[bIdx * 4 + 2]);
      }
      for (y = 0; y < h; y++) {
        var lIdx = y * w, rIdx = y * w + w - 1;
        push(lIdx, px[lIdx * 4], px[lIdx * 4 + 1], px[lIdx * 4 + 2]);
        push(rIdx, px[rIdx * 4], px[rIdx * 4 + 1], px[rIdx * 4 + 2]);
      }

      /* ── 3. Grow inward, 4-connected ── */
      while (top > 0) {
        var cur = stack[--top];
        var cx = cur % w, cy = (cur / w) | 0;
        var co = cur * 4;
        var cr = px[co], cg = px[co + 1], cb = px[co + 2];

        for (var d = 0; d < 4; d++) {
          var nx = cx + (d === 0 ? 1 : d === 1 ? -1 : 0);
          var ny = cy + (d === 2 ? 1 : d === 3 ? -1 : 0);
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          var ni = ny * w + nx;
          if (seen[ni]) continue;
          seen[ni] = 1;
          var no = ni * 4;
          var nr = px[no], ng = px[no + 1], nb = px[no + 2];
          var ok = matchesRep(nr, ng, nb);
          if (!ok && local2 > 0) {
            var lr = nr - cr, lg = ng - cg, lb = nb - cb;
            ok = (lr * lr + lg * lg + lb * lb) <= local2;
          }
          if (!ok) continue;
          mask[ni] = 1;
          stack[top++] = ni;
        }
      }

      /* ── 4a. Despeckle: 3×3 majority vote, so single stray pixels on
         either side of the boundary do not survive as holes or dots. ── */
      for (var pass = 0; pass < despeckle; pass++) {
        var prev = mask.slice();
        for (y = 0; y < h; y++) {
          for (x = 0; x < w; x++) {
            var idx = y * w + x;
            var count = 0;
            for (var dy = -1; dy <= 1; dy++) {
              var sy = y + dy;
              if (sy < 0 || sy >= h) continue;
              for (var dx = -1; dx <= 1; dx++) {
                var sx = x + dx;
                if (sx < 0 || sx >= w || (dx === 0 && dy === 0)) continue;
                count += prev[sy * w + sx];
              }
            }
            if (prev[idx] && count <= 2) mask[idx] = 0;
            else if (!prev[idx] && count >= 6) mask[idx] = 1;
          }
        }
      }

      /* ── 4b. Feather: a 1–2px box blur of the hard mask, kept alongside
         it so callers can have soft edges without losing the binary
         answer the mask is documented to give. ── */
      var alpha = new Uint8ClampedArray(n);
      if (feather > 0) {
        var radius = Math.max(1, Math.round(feather));
        var src = new Float32Array(n);
        for (i = 0; i < n; i++) src[i] = mask[i] ? 255 : 0;
        var mid = new Float32Array(n);
        var span = radius * 2 + 1;
        var acc, k2;
        for (y = 0; y < h; y++) {
          var row = y * w;
          acc = 0;
          for (k2 = -radius; k2 <= radius; k2++) {
            acc += src[row + Math.min(w - 1, Math.max(0, k2))];
          }
          for (x = 0; x < w; x++) {
            mid[row + x] = acc / span;
            acc += src[row + Math.min(w - 1, x + radius + 1)] - src[row + Math.max(0, x - radius)];
          }
        }
        for (x = 0; x < w; x++) {
          acc = 0;
          for (k2 = -radius; k2 <= radius; k2++) {
            acc += mid[Math.min(h - 1, Math.max(0, k2)) * w + x];
          }
          for (y = 0; y < h; y++) {
            alpha[y * w + x] = acc / span;
            acc += mid[Math.min(h - 1, y + radius + 1) * w + x] - mid[Math.max(0, y - radius) * w + x];
          }
        }
      } else {
        for (i = 0; i < n; i++) alpha[i] = mask[i] ? 255 : 0;
      }

      var bgCount = 0;
      for (i = 0; i < n; i++) bgCount += mask[i];

      mask.width = w;
      mask.height = h;
      mask.alpha = alpha;
      /* Share of the picture judged background — a tool can warn when it
         comes back near 0 (nothing detected) or near 1 (subject eaten). */
      mask.coverage = bgCount / n;
      return mask;
    },

    /**
     * backgroundMaskFor(source, options) → mask (see detectBackgroundMask)
     * Convenience wrapper: detection runs on a copy capped at
     * options.detectMaxDim (default 1400px) so a 6000px phone photo does not
     * spend seconds in the flood fill. applyMask() scales the mask back up.
     */
    backgroundMaskFor: function (source, options) {
      options = options || {};
      var sw = source.naturalWidth || source.width;
      var sh = source.naturalHeight || source.height;
      var maxDim = options.detectMaxDim == null ? 1400 : options.detectMaxDim;
      var scale = Math.min(1, maxDim / Math.max(sw, sh));
      var dw = Math.max(1, Math.round(sw * scale));
      var dh = Math.max(1, Math.round(sh * scale));

      var work = document.createElement('canvas');
      work.width = dw;
      work.height = dh;
      var wctx = work.getContext('2d', { willReadFrequently: true });
      wctx.drawImage(source, 0, 0, dw, dh);
      return this.detectBackgroundMask(wctx.getImageData(0, 0, dw, dh), options);
    },

    /* White-on-transparent canvas of the SUBJECT alpha, at mask resolution.
       Used with destination-in compositing; drawImage scales it to the
       target size, which also smooths the boundary a little further. */
    maskToCanvas: function (mask) {
      var mw = mask.width, mh = mask.height;
      var canvas = document.createElement('canvas');
      canvas.width = mw;
      canvas.height = mh;
      var ctx = canvas.getContext('2d');
      var id = ctx.createImageData(mw, mh);
      var d = id.data;
      var a = mask.alpha;
      for (var i = 0, n = mw * mh; i < n; i++) {
        var bg = a ? a[i] : (mask[i] ? 255 : 0);
        var o = i * 4;
        d[o] = 255; d[o + 1] = 255; d[o + 2] = 255;
        d[o + 3] = 255 - bg;
      }
      ctx.putImageData(id, 0, 0);
      return canvas;
    },

    /* The subject on a transparent canvas, at the source's own resolution. */
    cutoutFromMask: function (source, mask) {
      var w = source.naturalWidth || source.width;
      var h = source.naturalHeight || source.height;
      var out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      var ctx = out.getContext('2d');
      ctx.drawImage(source, 0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(this.maskToCanvas(mask), 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      return out;
    },

    /**
     * applyMask(canvas, mask, mode, options) → the same canvas
     *
     * mode:
     *   'transparent' — background pixels are erased (PNG cutout)
     *   'fill'        — solid options.color, or options.gradient
     *                   { from, to } behind the subject
     *   'image'       — options.image drawn behind the subject, cover-fit
     *                   without distorting its aspect ratio
     *   'blur'        — the picture itself blurred by options.blur px
     *                   behind the sharp subject
     *
     * The canvas is repainted in place, so a caller can size it, draw the
     * photo, and hand it straight here.
     */
    applyMask: function (canvas, mask, mode, options) {
      options = options || {};
      var w = canvas.width;
      var h = canvas.height;
      var ctx = canvas.getContext('2d');

      /* Snapshot the untouched picture first — every mode paints it back
         on top of whatever the new background is. */
      var source = document.createElement('canvas');
      source.width = w;
      source.height = h;
      source.getContext('2d').drawImage(canvas, 0, 0);

      var subject = this.cutoutFromMask(source, mask);

      ctx.clearRect(0, 0, w, h);

      if (mode === 'fill') {
        if (options.gradient) {
          var grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, options.gradient.from || '#ffffff');
          grad.addColorStop(1, options.gradient.to || '#000000');
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = options.color || '#ffffff';
        }
        ctx.fillRect(0, 0, w, h);
      } else if (mode === 'image' && options.image) {
        var bg = options.image;
        var bw = bg.naturalWidth || bg.width;
        var bh = bg.naturalHeight || bg.height;
        /* Cover-fit: scale by the LARGER ratio and centre, so the image
           fills the frame and never stretches. */
        var s = Math.max(w / bw, h / bh);
        var dw = bw * s, dh = bh * s;
        ctx.drawImage(bg, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } else if (mode === 'blur') {
        /* Unblurred pass first so the canvas edges do not fade out, then
           the blurred pass over it. */
        ctx.drawImage(source, 0, 0);
        ctx.filter = 'blur(' + Math.max(1, options.blur || 8) + 'px)';
        ctx.drawImage(source, 0, 0);
        ctx.filter = 'none';
      }
      /* 'transparent' paints no background at all. */

      ctx.drawImage(subject, 0, 0, w, h);
      return canvas;
    },
  };
})();

/**
 * ToolsGallery — TGImageFrames
 * Shared "frame grid" for the MULTI-FILE image tools (compress, convert,
 * combine). Every uploaded image gets a card with a thumbnail, an order
 * badge, a rotate button and a remove button; the cards can be dragged into
 * any order. The tool reads back the visual order plus each image's chosen
 * rotation with grid.items() and processes in exactly that order.
 *
 * Same idea (and the same drag mechanics) as the merge-PDF frames, but the
 * thumbnails come from the shared TGImageUtil loader/preview helpers.
 * Only the three multi-file image tools use this — single-image tools and
 * the collage editor are untouched.
 */
(function () {
  'use strict';

  /* Thumbnails are decorative — small keeps decode + memory cheap. */
  var THUMB_MAX = 180;
  /* Cap live canvases; frames scrolled far away are released and re-rendered
     if the user scrolls back. */
  var MAX_CACHED_THUMBS = 60;

  function fileKey(file) {
    /* Matches the runner's own de-duplication (name + size). */
    return file.name + '|' + file.size;
  }

  function cssEscape(value) {
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function currentSelection(fallbackFile) {
    var files = [];
    if (window.TGTool && typeof window.TGTool.getCurrentFiles === 'function') {
      files = window.TGTool.getCurrentFiles() || [];
    }
    if (!files.length) {
      var box = document.querySelector('.tg-tool-box');
      if (box && box._tgFiles && box._tgFiles.length) files = Array.from(box._tgFiles);
    }
    if (!files.length && fallbackFile) files = [fallbackFile];
    return files;
  }

  function FrameGrid(opts) {
    opts = opts || {};
    this.hostId = opts.host || '';
    this.thumbMax = opts.thumbMax || THUMB_MAX;
    this.countLabel = opts.countLabel || null;   // fn(n) -> string
    this.onChange = typeof opts.onChange === 'function' ? opts.onChange : null;

    /* Ordered list: { key, file, rotation, canvas, state, width, height } */
    this.entries = [];
    this.gridEl = null;
    this.observer = null;
    this.queue = [];
    this.busy = false;
    this.renderedKeys = [];
    this.drag = null;

    var self = this;
    this._onPointerDown = function (e) { self.onPointerDown(e); };
    this._onPointerMove = function (e) { self.onPointerMove(e); };
    this._onPointerUp = function (e) { self.onPointerUp(e); };
  }

  /* -----------------------------------------------
     STATE
  ----------------------------------------------- */

  /* Keep the visual order and each rotation while the selection changes
     underneath us: surviving files stay put, new ones are appended,
     removed ones drop out. */
  FrameGrid.prototype.sync = function (files) {
    var self = this;
    var incoming = {};
    files.forEach(function (f) { incoming[fileKey(f)] = f; });

    var next = [];
    var kept = {};
    this.entries.forEach(function (entry) {
      if (!incoming[entry.key] || kept[entry.key]) {
        self.releaseCanvas(entry);
        return;
      }
      /* Same file, possibly a fresh File object — keep order + rotation. */
      entry.file = incoming[entry.key];
      kept[entry.key] = true;
      next.push(entry);
    });

    files.forEach(function (f) {
      var key = fileKey(f);
      if (kept[key]) return;
      kept[key] = true;
      next.push({ key: key, file: f, rotation: 0, canvas: null, state: 'idle', width: 0, height: 0 });
    });

    this.entries = next;
    return this;
  };

  /* Sync + repaint — what onFileReady calls. */
  FrameGrid.prototype.update = function (files) {
    this.sync(files);
    this.render();
    return this;
  };

  /* The processing list: visual order, with each frame's rotation. */
  FrameGrid.prototype.items = function () {
    return this.entries.map(function (entry) {
      return { file: entry.file, rotation: entry.rotation };
    });
  };

  FrameGrid.prototype.entryByKey = function (key) {
    for (var i = 0; i < this.entries.length; i++) {
      if (this.entries[i].key === key) return this.entries[i];
    }
    return null;
  };

  FrameGrid.prototype.frameFor = function (key) {
    if (!this.gridEl) return null;
    return this.gridEl.querySelector('.tg-img-frame[data-key="' + cssEscape(key) + '"]');
  };

  /* -----------------------------------------------
     THUMBNAILS (lazy, one image at a time)
  ----------------------------------------------- */
  FrameGrid.prototype.releaseCanvas = function (entry) {
    if (entry.canvas) {
      /* Zeroing the backing store is what actually frees the pixels. */
      entry.canvas.width = 0;
      entry.canvas.height = 0;
      if (entry.canvas.parentNode) entry.canvas.parentNode.removeChild(entry.canvas);
      entry.canvas = null;
    }
    var at = this.renderedKeys.indexOf(entry.key);
    if (at !== -1) this.renderedKeys.splice(at, 1);
    if (entry.state === 'done') entry.state = 'idle';
  };

  FrameGrid.prototype.trimCache = function () {
    while (this.renderedKeys.length > MAX_CACHED_THUMBS) {
      var oldest = this.renderedKeys[0];
      var entry = this.entryByKey(oldest);
      if (!entry) { this.renderedKeys.shift(); continue; }
      var frame = this.frameFor(entry.key);
      this.releaseCanvas(entry);
      if (frame) {
        this.setThumbMsg(frame, '');
        if (this.observer) this.observer.observe(frame);
      }
    }
  };

  FrameGrid.prototype.enqueue = function (key) {
    var entry = this.entryByKey(key);
    if (!entry || entry.state === 'done' || entry.state === 'loading') return;
    if (this.queue.indexOf(key) !== -1) return;
    this.queue.push(key);
    this.pump();
  };

  FrameGrid.prototype.pump = function () {
    var self = this;
    if (this.busy) return;
    var key = this.queue.shift();
    if (!key) return;
    var entry = this.entryByKey(key);
    if (!entry || entry.state === 'done') { this.pump(); return; }

    this.busy = true;
    entry.state = 'loading';
    window.TGImageUtil.loadImage(entry.file).then(function (img) {
      var canvas = document.createElement('canvas');
      window.TGImageUtil.drawPreview(img, canvas, self.thumbMax);
      entry.width = img.naturalWidth || img.width;
      entry.height = img.naturalHeight || img.height;
      entry.canvas = canvas;
      entry.state = 'done';
      self.renderedKeys.push(entry.key);
      self.paintFrame(entry);
      self.trimCache();
    }).catch(function () {
      entry.state = 'error';
      var frame = self.frameFor(entry.key);
      if (frame) self.setThumbMsg(frame, 'Preview unavailable');
    }).then(function () {
      self.busy = false;
      /* Yield between images so scrolling and clicks stay responsive on a
         large selection. */
      setTimeout(function () { self.pump(); }, 0);
    });
  };

  FrameGrid.prototype.setThumbMsg = function (frame, text) {
    var thumb = frame.querySelector('.tg-img-frame-thumb');
    if (!thumb) return;
    thumb.innerHTML = text
      ? '<p class="tg-img-frame-msg">' + text + '</p>'
      : '<span class="tg-img-frame-spinner" aria-hidden="true"></span>';
  };

  FrameGrid.prototype.paintFrame = function (entry) {
    var frame = this.frameFor(entry.key);
    if (!frame) return;
    var thumb = frame.querySelector('.tg-img-frame-thumb');
    if (thumb && entry.canvas) {
      thumb.innerHTML = '';
      thumb.appendChild(entry.canvas);
    }
    this.applyRotation(entry);
    this.paintMeta(entry);
  };

  FrameGrid.prototype.paintMeta = function (entry) {
    var frame = this.frameFor(entry.key);
    if (!frame) return;
    var metaEl = frame.querySelector('.tg-img-frame-meta');
    if (!metaEl) return;
    var parts = [];
    if (entry.width && entry.height) {
      var w = entry.width, h = entry.height;
      if (entry.rotation === 90 || entry.rotation === 270) { w = entry.height; h = entry.width; }
      parts.push(w + '\u00D7' + h);
    }
    parts.push(window.TGImageUtil.fmtBytes(entry.file.size));
    if (entry.rotation) parts.push(entry.rotation + '\u00B0');
    metaEl.textContent = parts.join(' \u00B7 ');
  };

  FrameGrid.prototype.applyRotation = function (entry) {
    if (entry.canvas) entry.canvas.style.transform = 'rotate(' + entry.rotation + 'deg)';
    var frame = this.frameFor(entry.key);
    if (frame) frame.dataset.rotation = String(entry.rotation);
  };

  /* -----------------------------------------------
     FRAME UI
  ----------------------------------------------- */
  FrameGrid.prototype.buildFrame = function (entry) {
    var self = this;
    var frame = document.createElement('div');
    frame.className = 'tg-img-frame';
    frame.dataset.key = entry.key;
    frame.dataset.rotation = String(entry.rotation);

    var handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'tg-img-frame-badge';
    handle.title = 'Drag to reorder (arrow keys also work)';
    handle.setAttribute('aria-label', 'Reorder ' + entry.file.name);
    frame.appendChild(handle);

    var thumb = document.createElement('div');
    thumb.className = 'tg-img-frame-thumb';
    thumb.innerHTML = '<span class="tg-img-frame-spinner" aria-hidden="true"></span>';
    frame.appendChild(thumb);

    var name = document.createElement('p');
    name.className = 'tg-img-frame-name';
    name.textContent = entry.file.name;
    name.title = entry.file.name;
    frame.appendChild(name);

    var meta = document.createElement('p');
    meta.className = 'tg-img-frame-meta';
    meta.textContent = window.TGImageUtil.fmtBytes(entry.file.size);
    frame.appendChild(meta);

    var actions = document.createElement('div');
    actions.className = 'tg-img-frame-actions';

    var rotateBtn = document.createElement('button');
    rotateBtn.type = 'button';
    rotateBtn.className = 'tg-img-frame-btn';
    rotateBtn.innerHTML = '&#8635;';
    rotateBtn.title = 'Rotate this image 90\u00B0';
    rotateBtn.setAttribute('aria-label', 'Rotate ' + entry.file.name + ' 90 degrees');
    rotateBtn.addEventListener('click', function () {
      entry.rotation = (entry.rotation + 90) % 360;
      self.applyRotation(entry);
      self.paintMeta(entry);
      if (self.onChange) self.onChange();
    });
    actions.appendChild(rotateBtn);

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'tg-img-frame-btn tg-img-frame-btn--remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove this image';
    removeBtn.setAttribute('aria-label', 'Remove ' + entry.file.name);
    removeBtn.addEventListener('click', function () { self.removeEntry(entry); });
    actions.appendChild(removeBtn);

    frame.appendChild(actions);

    handle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        self.moveFrame(frame, e.key === 'ArrowLeft' ? -1 : 1);
        handle.focus();
      }
    });
    frame.addEventListener('pointerdown', this._onPointerDown);

    if (entry.canvas) {
      thumb.innerHTML = '';
      thumb.appendChild(entry.canvas);
      entry.canvas.style.transform = 'rotate(' + entry.rotation + 'deg)';
    } else if (entry.state === 'error') {
      this.setThumbMsg(frame, 'Preview unavailable');
    }

    return frame;
  };

  FrameGrid.prototype.removeEntry = function (entry) {
    /* Drop it from the runner's selection so the file count, the action
       button and the tools all stay in sync; that re-enters onFileReady,
       which re-renders this grid. */
    if (window.TGTool && typeof window.TGTool.removeFileAt === 'function') {
      var files = currentSelection(null);
      for (var i = 0; i < files.length; i++) {
        if (fileKey(files[i]) === entry.key) {
          window.TGTool.removeFileAt(i);
          /* The runner only re-enters onFileReady while files remain, so
             clearing the last frame is on us. */
          if (!currentSelection(null).length) this.update([]);
          if (this.onChange) this.onChange();
          return;
        }
      }
    }
    this.releaseCanvas(entry);
    this.entries = this.entries.filter(function (e) { return e.key !== entry.key; });
    this.render();
    if (this.onChange) this.onChange();
  };

  FrameGrid.prototype.renumber = function () {
    if (!this.gridEl) return;
    var frames = this.gridEl.querySelectorAll('.tg-img-frame');
    for (var i = 0; i < frames.length; i++) {
      var badge = frames[i].querySelector('.tg-img-frame-badge');
      if (badge) badge.textContent = String(i + 1);
    }
  };

  /* Rebuild the ordered array from what the user can actually see. */
  FrameGrid.prototype.commitOrder = function () {
    if (!this.gridEl) return;
    var self = this;
    var order = [];
    this.gridEl.querySelectorAll('.tg-img-frame').forEach(function (frame) {
      var entry = self.entryByKey(frame.dataset.key);
      if (entry) order.push(entry);
    });
    if (order.length === this.entries.length) this.entries = order;
    this.renumber();
    if (this.onChange) this.onChange();
  };

  FrameGrid.prototype.moveFrame = function (frame, delta) {
    if (!this.gridEl) return;
    var sibling = delta < 0 ? frame.previousElementSibling : frame.nextElementSibling;
    if (!sibling) return;
    if (delta < 0) this.gridEl.insertBefore(frame, sibling);
    else this.gridEl.insertBefore(sibling, frame);
    this.commitOrder();
  };

  /* -----------------------------------------------
     DRAG TO REORDER (pointer events — mouse + touch)
  ----------------------------------------------- */
  FrameGrid.prototype.onPointerDown = function (e) {
    if (e.button != null && e.button !== 0) return;
    var frame = e.currentTarget;
    var onHandle = !!(e.target.closest && e.target.closest('.tg-img-frame-badge'));
    /* Touch/pen drags start from the badge only, so the rest of the frame is
       still free to scroll the page. A mouse can grab anywhere except the
       action buttons. */
    if (e.pointerType !== 'mouse' && !onHandle) return;
    if (!onHandle && e.target.closest && e.target.closest('button')) return;

    this.drag = {
      frame: frame,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
      pointerId: e.pointerId,
      rects: null,
      raf: 0,
    };
    /* Tracked on the document rather than through setPointerCapture, which
       browsers can drop mid-gesture; the drop target is found geometrically
       so no hit-testing is needed. */
    document.addEventListener('pointermove', this._onPointerMove, { passive: false });
    document.addEventListener('pointerup', this._onPointerUp);
    document.addEventListener('pointercancel', this._onPointerUp);
  };

  FrameGrid.prototype.collectRects = function () {
    var rects = [];
    var frames = this.gridEl ? this.gridEl.children : [];
    for (var i = 0; i < frames.length; i++) {
      rects.push({ el: frames[i], rect: frames[i].getBoundingClientRect() });
    }
    return rects;
  };

  FrameGrid.prototype.frameAtPoint = function (x, y) {
    if (!this.drag || !this.drag.rects) return null;
    for (var i = 0; i < this.drag.rects.length; i++) {
      var r = this.drag.rects[i].rect;
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return this.drag.rects[i];
    }
    return null;
  };

  FrameGrid.prototype.onPointerMove = function (e) {
    var drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.active) {
      if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) < 6) return;
      drag.active = true;
      drag.frame.classList.add('dragging');
      drag.rects = this.collectRects();
      this.startAutoScroll();
    }
    e.preventDefault();
    drag.x = e.clientX;
    drag.y = e.clientY;

    var hit = this.frameAtPoint(e.clientX, e.clientY);
    if (!hit || hit.el === drag.frame) return;

    var before = e.clientX < hit.rect.left + hit.rect.width / 2;
    this.gridEl.insertBefore(drag.frame, before ? hit.el : hit.el.nextSibling);
    /* Everything shifted — re-measure for the next move. */
    drag.rects = this.collectRects();
  };

  /* Long selections scroll; nudge the page when the pointer sits near an edge. */
  FrameGrid.prototype.startAutoScroll = function () {
    var self = this;
    if (!this.drag || this.drag.raf) return;
    var step = function () {
      var drag = self.drag;
      if (!drag || !drag.active) return;
      var margin = 70;
      if (drag.y < margin) window.scrollBy(0, -14);
      else if (drag.y > window.innerHeight - margin) window.scrollBy(0, 14);
      else { drag.raf = requestAnimationFrame(step); return; }
      drag.rects = self.collectRects();
      drag.raf = requestAnimationFrame(step);
    };
    this.drag.raf = requestAnimationFrame(step);
  };

  FrameGrid.prototype.onPointerUp = function (e) {
    var drag = this.drag;
    if (!drag || (e && e.pointerId != null && e.pointerId !== drag.pointerId)) return;
    document.removeEventListener('pointermove', this._onPointerMove, { passive: false });
    document.removeEventListener('pointerup', this._onPointerUp);
    document.removeEventListener('pointercancel', this._onPointerUp);
    if (drag.raf) cancelAnimationFrame(drag.raf);
    this.drag = null;
    if (drag.active) {
      drag.frame.classList.remove('dragging');
      this.commitOrder();
    }
  };

  /* -----------------------------------------------
     RENDER
  ----------------------------------------------- */
  FrameGrid.prototype.host = function () {
    return this.hostId ? document.getElementById(this.hostId) : null;
  };

  FrameGrid.prototype.render = function () {
    var self = this;
    var hostEl = this.host();
    if (!hostEl) return;

    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    this.queue = [];
    hostEl.innerHTML = '';
    this.gridEl = null;

    /* Flags the tool box so the runner's plain filename rows step aside for
       the frames — set only once a grid really renders, so nothing is
       hidden if this module never runs. */
    var toolBox = hostEl.closest ? hostEl.closest('.tg-tool-box') : null;
    if (toolBox) {
      if (this.entries.length) toolBox.dataset.imgFrames = 'on';
      else delete toolBox.dataset.imgFrames;
    }

    if (!this.entries.length) return;

    var bar = document.createElement('div');
    bar.className = 'tg-img-frame-bar';

    /* <p>, not <span>: the dark theme forces span colour to inherit, which
       would make this unreadable on the dark tool box. */
    var count = document.createElement('p');
    count.className = 'tg-img-frame-count';
    count.textContent = this.countLabel
      ? this.countLabel(this.entries.length)
      : this.entries.length + ' image' + (this.entries.length === 1 ? '' : 's');
    bar.appendChild(count);

    if (window.TGTool && typeof window.TGTool.openFilePicker === 'function' &&
        this.entries.length < (window.TGTool.maxFiles || 100)) {
      var addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'tg-img-frame-add';
      addBtn.textContent = '+ Add more images';
      addBtn.addEventListener('click', function () { window.TGTool.openFilePicker(); });
      bar.appendChild(addBtn);
    }
    hostEl.appendChild(bar);

    this.gridEl = document.createElement('div');
    this.gridEl.className = 'tg-img-frame-grid';
    this.entries.forEach(function (entry) { self.gridEl.appendChild(self.buildFrame(entry)); });
    hostEl.appendChild(this.gridEl);

    /* The runner's own drop target is the plain file list, which these
       frames replace — keep dropping more images onto the grid working. */
    if (window.TGTool && typeof window.TGTool.addFiles === 'function') {
      this.gridEl.addEventListener('dragover', function (ev) {
        ev.preventDefault();
        self.gridEl.dataset.dragover = '';
      });
      this.gridEl.addEventListener('dragleave', function (ev) {
        if (!self.gridEl.contains(ev.relatedTarget)) delete self.gridEl.dataset.dragover;
      });
      this.gridEl.addEventListener('drop', function (ev) {
        ev.preventDefault();
        delete self.gridEl.dataset.dragover;
        if (ev.dataTransfer && ev.dataTransfer.files.length) window.TGTool.addFiles(ev.dataTransfer.files);
      });
    }

    this.renumber();
    this.observeFrames();
  };

  FrameGrid.prototype.observeFrames = function () {
    var self = this;
    if (!this.gridEl) return;
    var frames = this.gridEl.querySelectorAll('.tg-img-frame');

    if (!('IntersectionObserver' in window)) {
      /* No lazy loading available — still decode one image at a time. */
      this.entries.forEach(function (entry) { self.enqueue(entry.key); });
      return;
    }

    this.observer = new IntersectionObserver(function (records) {
      records.forEach(function (record) {
        if (!record.isIntersecting) return;
        self.observer.unobserve(record.target);
        self.enqueue(record.target.dataset.key);
      });
    }, { rootMargin: '300px 0px' });

    frames.forEach(function (frame) {
      var entry = self.entryByKey(frame.dataset.key);
      if (entry && entry.state === 'done') return;
      self.observer.observe(frame);
    });
  };

  /* Small green note in the frame bar, e.g. "✓ Compressed 5 images". */
  FrameGrid.prototype.setSummary = function (text) {
    var hostEl = this.host();
    var bar = hostEl ? hostEl.querySelector('.tg-img-frame-bar') : null;
    if (!bar) return;
    var el = bar.querySelector('.tg-img-frame-summary');
    if (!el) {
      el = document.createElement('p');
      el.className = 'tg-img-frame-summary';
      bar.appendChild(el);
    }
    el.textContent = text;
  };

  window.TGImageFrames = {
    /* opts: { host: <container element id>, thumbMax, countLabel(n), onChange } */
    create: function (opts) { return new FrameGrid(opts); },
    /* The selection the runner currently holds (files array). */
    selection: currentSelection,
  };
})();

/**
 * ToolsGallery — TGImgTools
 * Preview frame + Rotate/Clear toolbar shared by the SINGLE-image tools
 * (round, resize, crop, flip, rotate, add-text, add-border, upscale,
 * blur-bg, remove-watermark). The multi-file tools use TGImageFrames
 * above instead — this is the one-image equivalent.
 *
 * Each tool keeps its own rotation (a multiple of 90) and rebuilds its
 * working source with rotate() whenever that changes, so the turn shows
 * in the preview AND in the exported file — every option the tool
 * offers is then applied on top of the rotated source.
 *
 * Clear hands the tool box back to the runner's upload state:
 * TGTool.resetState() re-injects fresh option markup, so the preview and
 * this toolbar come back hidden and a new image can be dropped straight in.
 */
(function () {
  'use strict';

  var api = {

    /* Toolbar markup — place it next to the tool's preview frame. Hidden
       until the tool has an image and calls show(). extraHTML lets a tool
       add its own control (e.g. "Clear Selections") to the same row. */
    barHTML: function (prefix, extraHTML) {
      return '<div class="tg-img-tools-bar" id="' + prefix + '-tools-bar" style="display:none">' +
        '<button type="button" class="tg-btn-secondary tg-btn-sm tg-img-tool-btn" ' +
          'id="' + prefix + '-rotate-btn" title="Rotate the image 90° clockwise">' +
          '↻ Rotate 90°</button>' +
        '<button type="button" class="tg-btn-secondary tg-btn-sm tg-img-tool-btn" ' +
          'id="' + prefix + '-clear-btn" title="Remove this image and start over">' +
          '✕ Clear</button>' +
        (extraHTML || '') +
      '</div>';
    },

    /* Wire the two buttons. handlers.onRotate turns the tool's own image;
       handlers.onClear drops the tool's state just before the tool box is
       reset. */
    wire: function (container, prefix, handlers) {
      handlers = handlers || {};
      var scope = container || document;
      var rotateBtn = scope.querySelector('#' + prefix + '-rotate-btn');
      var clearBtn = scope.querySelector('#' + prefix + '-clear-btn');
      if (rotateBtn) {
        rotateBtn.addEventListener('click', function () {
          if (handlers.onRotate) handlers.onRotate();
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          if (handlers.onClear) handlers.onClear();
          api.reset();
        });
      }
    },

    /* Show/hide the toolbar (and, when given, the preview frame). */
    show: function (prefix, on, wrapId) {
      var bar = document.getElementById(prefix + '-tools-bar');
      if (bar) bar.style.display = on ? 'flex' : 'none';
      if (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (wrap) wrap.style.display = on ? 'block' : 'none';
      }
    },

    /* Rotation applied to a working source. 0° returns the source
       untouched so the common case costs nothing; anything else comes
       back as a canvas, which every tool can draw from just like an
       <img>. */
    rotate: function (source, degrees) {
      if (!source) return source;
      return window.TGImageUtil.rotateSource(source, degrees);
    },

    /* Dimensions of a working source — <img> or rotated canvas. */
    w: function (source) { return source ? (source.naturalWidth || source.width || 0) : 0; },
    h: function (source) { return source ? (source.naturalHeight || source.height || 0) : 0; },

    /* An <img> element for a source that may already be a canvas — for
       helpers (TGSegment) that only accept a File or an HTMLImageElement. */
    toImage: function (source) {
      if (!source || source instanceof HTMLImageElement) return Promise.resolve(source);
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('Could not read the rotated image.')); };
        img.src = source.toDataURL('image/png');
      });
    },

    /* Back to the upload state. */
    reset: function () {
      if (window.TGTool && typeof window.TGTool.resetState === 'function') {
        window.TGTool.resetState();
      }
    },
  };

  window.TGImgTools = api;
})();

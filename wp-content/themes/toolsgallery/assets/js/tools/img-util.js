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
  };
})();

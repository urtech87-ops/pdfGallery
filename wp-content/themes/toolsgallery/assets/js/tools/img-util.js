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

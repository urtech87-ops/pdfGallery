/**
 * ToolsGallery — Crop Image
 * Handler: img-crop
 * URL: /tool/crop-image/
 *
 * Plain-canvas interactive crop with drag-to-move and resize handles.
 * Replaces the Cropper.js CDN dependency — the tool now renders the
 * image itself using the load-then-size canvas pattern, so the preview
 * can never come up black.
 *
 * Rotating rebuilds the working source and re-mounts the editor: the
 * canvas is re-sized from the turned image and the crop box is re-fitted,
 * so no selection is ever left pointing at the old orientation.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-crop' };

  var HANDLE_SIZE = 12;

  var state = {
    img: null,      // the image as uploaded
    src: null,      // working source — a rotated canvas once rot !== 0
    rot: 0,
    file: null,
    canvas: null,
    scale: 1,
    crop: { x: 0, y: 0, w: 0, h: 0 },
    aspect: 0, // 0 = free
    dragging: false,
    resizing: false,
    resizeHandle: '',
    startX: 0,
    startY: 0,
    startCrop: null,
  };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Aspect Ratio</label>' +
      '<div class="tg-radio-group" id="ic-ar-group">' +
        '<label><input type="radio" name="ic-ar" value="0" checked> Free</label>' +
        '<label><input type="radio" name="ic-ar" value="1"> 1:1</label>' +
        '<label><input type="radio" name="ic-ar" value="1.3333"> 4:3</label>' +
        '<label><input type="radio" name="ic-ar" value="1.7778"> 16:9</label>' +
        '<label><input type="radio" name="ic-ar" value="0.5625"> 9:16</label>' +
        '<label><input type="radio" name="ic-ar" value="1.5"> 3:2</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label><input type="checkbox" id="ic-circle"> Circle crop (output PNG)</label>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ic-fmt">Output Format</label>' +
      '<select id="ic-fmt" class="tg-select">' +
        '<option value="same">Same as input</option>' +
        '<option value="image/jpeg">JPG</option>' +
        '<option value="image/png">PNG</option>' +
      '</select>' +
    '</div>' +
    '<p id="ic-crop-dims" class="tg-opt-info" style="margin-top:6px"></p>' +
    TGImgTools.barHTML('ic') +
    '<div id="ic-canvas-wrap" class="tg-img-preview-frame tg-img-preview-frame--editor" style="display:none">' +
      '<canvas id="ic-canvas" style="cursor:crosshair;touch-action:none"></canvas>' +
    '</div>' +
    '<p class="tg-opt-info" style="margin-top:6px">Drag inside the highlighted area to move it, drag the orange handles to resize, or drag on the dimmed area to draw a new crop box.</p>';
  }

  function canvasPos(canvas, clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width / r.width),
      y: (clientY - r.top) * (canvas.height / r.height),
    };
  }

  function wireOptions(container) {
    container.querySelectorAll('input[name="ic-ar"]').forEach(function (r) {
      r.addEventListener('change', function () {
        state.aspect = parseFloat(r.value) || 0;
        if (state.aspect > 0 && state.canvas && state.src) {
          applyAspectPreset(state.aspect);
        }
      });
    });
    var circleChk = container.querySelector('#ic-circle');
    if (circleChk) circleChk.addEventListener('change', function () {
      if (circleChk.checked) {
        state.aspect = 1;
        var sq = container.querySelector('input[name="ic-ar"][value="1"]');
        if (sq) sq.checked = true;
        if (state.canvas && state.src) applyAspectPreset(1);
      }
    });

    TGImgTools.wire(container, 'ic', {
      onRotate: function () {
        if (!state.img) return;
        state.rot = (state.rot + 90) % 360;
        state.src = TGImgTools.rotate(state.img, state.rot);
        /* Re-mount: canvas dimensions come from the rotated source and
           the crop box is rebuilt, so nothing survives in old coords. */
        mountEditor();
      },
      onClear: function () {
        state.img = null; state.src = null; state.rot = 0; state.file = null;
        state.canvas = null; state.scale = 1;
        state.crop = { x: 0, y: 0, w: 0, h: 0 };
        state.dragging = false; state.resizing = false; state.resizeHandle = '';
      },
    });
  }

  function applyAspectPreset(aspect) {
    var canvas = state.canvas;
    var maxW = canvas.width * 0.9;
    var maxH = canvas.height * 0.9;
    var w, h;
    if (maxW / aspect <= maxH) { w = maxW; h = maxW / aspect; }
    else { h = maxH; w = maxH * aspect; }
    state.crop = {
      x: Math.floor((canvas.width - w) / 2),
      y: Math.floor((canvas.height - h) / 2),
      w: Math.floor(w),
      h: Math.floor(h),
    };
    drawCrop();
  }

  /* Size the canvas from the CURRENT working source and reset the crop
     box. Called on upload and after every rotate — never before the
     source exists. */
  function mountEditor() {
    var source = state.src;
    if (!source) return;

    var canvas = document.getElementById('ic-canvas');
    var wrap = document.getElementById('ic-canvas-wrap');
    if (!canvas || !wrap) return;
    state.canvas = canvas;

    var sw = TGImgTools.w(source);
    var sh = TGImgTools.h(source);
    var maxW = Math.min(750, window.innerWidth - 40);
    var maxH = 520;
    state.scale = Math.min(1, maxW / sw, maxH / sh);
    canvas.width = Math.max(1, Math.round(sw * state.scale));
    canvas.height = Math.max(1, Math.round(sh * state.scale));

    wrap.style.display = 'block';
    TGImgTools.show('ic', true);

    // Default crop: centered 80% box (respecting a selected aspect).
    if (state.aspect > 0) {
      applyAspectPreset(state.aspect);
    } else {
      state.crop = {
        x: Math.floor(canvas.width * 0.1),
        y: Math.floor(canvas.height * 0.1),
        w: Math.floor(canvas.width * 0.8),
        h: Math.floor(canvas.height * 0.8),
      };
      drawCrop();
    }
    setupCropEvents(canvas);
  }

  function onFileReady(file) {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) return;
    state.file = file;
    state.img = null;
    state.src = null;
    state.rot = 0;

    var img = new Image();
    var objectUrl = URL.createObjectURL(file);

    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      state.img = img;
      state.src = img;
      mountEditor();
    };

    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      alert('Could not load image. Please try a different file.');
    };

    img.src = objectUrl;
  }

  function drawCrop() {
    var canvas = state.canvas;
    if (!canvas || !state.src) return;
    var ctx = canvas.getContext('2d');
    var c = state.crop;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.src, 0, 0, canvas.width, canvas.height);

    // Dim everything outside the crop area
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, c.y);
    ctx.fillRect(0, c.y + c.h, canvas.width, canvas.height - c.y - c.h);
    ctx.fillRect(0, c.y, c.x, c.h);
    ctx.fillRect(c.x + c.w, c.y, canvas.width - c.x - c.w, c.h);

    // Crop border
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);

    // Rule-of-thirds guides
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.x + c.w / 3, c.y);      ctx.lineTo(c.x + c.w / 3, c.y + c.h);
    ctx.moveTo(c.x + c.w * 2 / 3, c.y);  ctx.lineTo(c.x + c.w * 2 / 3, c.y + c.h);
    ctx.moveTo(c.x, c.y + c.h / 3);      ctx.lineTo(c.x + c.w, c.y + c.h / 3);
    ctx.moveTo(c.x, c.y + c.h * 2 / 3);  ctx.lineTo(c.x + c.w, c.y + c.h * 2 / 3);
    ctx.stroke();

    // Resize handles
    ctx.fillStyle = '#F97316';
    getHandlePositions().forEach(function (h) {
      ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    });

    var infoEl = document.getElementById('ic-crop-dims');
    if (infoEl) {
      infoEl.textContent = 'Crop area: ' +
        Math.round(c.w / state.scale) + ' × ' + Math.round(c.h / state.scale) + 'px';
    }
  }

  function getHandlePositions() {
    var c = state.crop;
    return [
      { id: 'nw', x: c.x,           y: c.y },
      { id: 'n',  x: c.x + c.w / 2, y: c.y },
      { id: 'ne', x: c.x + c.w,     y: c.y },
      { id: 'w',  x: c.x,           y: c.y + c.h / 2 },
      { id: 'e',  x: c.x + c.w,     y: c.y + c.h / 2 },
      { id: 'sw', x: c.x,           y: c.y + c.h },
      { id: 's',  x: c.x + c.w / 2, y: c.y + c.h },
      { id: 'se', x: c.x + c.w,     y: c.y + c.h },
    ];
  }

  function getHandleAt(px, py) {
    var handles = getHandlePositions();
    for (var i = 0; i < handles.length; i++) {
      if (Math.abs(px - handles[i].x) <= HANDLE_SIZE &&
          Math.abs(py - handles[i].y) <= HANDLE_SIZE) {
        return handles[i].id;
      }
    }
    return null;
  }

  function isInsideCrop(px, py) {
    var c = state.crop;
    return px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h;
  }

  function pointerDown(px, py) {
    var handle = getHandleAt(px, py);
    if (handle) {
      state.resizing = true;
      state.resizeHandle = handle;
    } else if (isInsideCrop(px, py)) {
      state.dragging = true;
    } else {
      state.resizing = true;
      state.resizeHandle = 'new';
      state.crop = { x: px, y: py, w: 1, h: 1 };
    }
    state.startX = px;
    state.startY = py;
    state.startCrop = { x: state.crop.x, y: state.crop.y, w: state.crop.w, h: state.crop.h };
  }

  function pointerMove(px, py) {
    var canvas = state.canvas;
    if (state.dragging) {
      var dx = px - state.startX;
      var dy = py - state.startY;
      state.crop.x = Math.max(0, Math.min(canvas.width - state.crop.w, state.startCrop.x + dx));
      state.crop.y = Math.max(0, Math.min(canvas.height - state.crop.h, state.startCrop.y + dy));
      drawCrop();
      return;
    }

    if (state.resizing) {
      var sc = state.startCrop;
      var ddx = px - state.startX;
      var ddy = py - state.startY;
      var h = state.resizeHandle;

      if (h === 'new') {
        state.crop.w = Math.max(1, px - state.crop.x);
        state.crop.h = state.aspect > 0
          ? Math.max(1, state.crop.w / state.aspect)
          : Math.max(1, py - state.crop.y);
      } else {
        if (h.indexOf('e') !== -1) state.crop.w = Math.max(10, sc.w + ddx);
        if (h.indexOf('s') !== -1) state.crop.h = Math.max(10, sc.h + ddy);
        if (h.indexOf('w') !== -1) {
          var newW = sc.w - ddx;
          if (newW > 10) { state.crop.x = sc.x + ddx; state.crop.w = newW; }
        }
        if (h.indexOf('n') !== -1) {
          var newH = sc.h - ddy;
          if (newH > 10) { state.crop.y = sc.y + ddy; state.crop.h = newH; }
        }
        // Lock aspect ratio if one is selected
        if (state.aspect > 0) {
          if (h === 'n' || h === 's') {
            state.crop.w = Math.max(10, state.crop.h * state.aspect);
          } else {
            state.crop.h = Math.max(10, state.crop.w / state.aspect);
          }
        }
      }

      // Clamp to the canvas bounds
      state.crop.x = Math.max(0, Math.min(canvas.width - 1, state.crop.x));
      state.crop.y = Math.max(0, Math.min(canvas.height - 1, state.crop.y));
      state.crop.w = Math.min(canvas.width - state.crop.x, state.crop.w);
      state.crop.h = Math.min(canvas.height - state.crop.y, state.crop.h);
      drawCrop();
      return;
    }

    // Cursor hint only
    var cursors = {
      nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', w: 'w-resize',
      e: 'e-resize', sw: 'sw-resize', s: 's-resize', se: 'se-resize',
    };
    var hoverHandle = getHandleAt(px, py);
    canvas.style.cursor = hoverHandle
      ? (cursors[hoverHandle] || 'crosshair')
      : (isInsideCrop(px, py) ? 'move' : 'crosshair');
  }

  function pointerUp() {
    state.dragging = false;
    state.resizing = false;
    state.resizeHandle = '';
  }

  function setupCropEvents(canvas) {
    if (canvas._icWired) return;
    canvas._icWired = true;

    canvas.addEventListener('mousedown', function (e) {
      var p = canvasPos(canvas, e.clientX, e.clientY);
      pointerDown(p.x, p.y);
    });
    canvas.addEventListener('mousemove', function (e) {
      var p = canvasPos(canvas, e.clientX, e.clientY);
      pointerMove(p.x, p.y);
    });
    document.addEventListener('mouseup', pointerUp);

    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var p = canvasPos(canvas, t.clientX, t.clientY);
      pointerDown(p.x, p.y);
    }, { passive: false });
    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var p = canvasPos(canvas, t.clientX, t.clientY);
      pointerMove(p.x, p.y);
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) {
      e.preventDefault();
      pointerUp();
    }, { passive: false });
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    if (!state.src || !state.canvas) {
      throw new Error('Crop area not ready yet — wait for the image preview, adjust the selection, then try again.');
    }

    onProgress && onProgress(0.5, 'Cropping...');

    // Convert display-space crop to source pixel coordinates
    var sw = TGImgTools.w(state.src);
    var sh = TGImgTools.h(state.src);
    var s = state.scale;
    var rx = Math.max(0, Math.round(state.crop.x / s));
    var ry = Math.max(0, Math.round(state.crop.y / s));
    var rw = Math.round(state.crop.w / s);
    var rh = Math.round(state.crop.h / s);
    rw = Math.min(rw, sw - rx);
    rh = Math.min(rh, sh - ry);
    if (rw < 1 || rh < 1) throw new Error('Crop area is too small. Please select a larger area.');

    var out = document.createElement('canvas');
    out.width = rw;
    out.height = rh;
    var ctx = out.getContext('2d');

    if (options.circle) {
      ctx.beginPath();
      ctx.arc(rw / 2, rh / 2, Math.min(rw, rh) / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(state.src, rx, ry, rw, rh, 0, 0, rw, rh);

    var mime = options.circle ? 'image/png'
      : (options.format === 'same'
        ? (file.type === 'image/png' ? 'image/png' : 'image/jpeg')
        : options.format);
    var ext = mime === 'image/png' ? '.png' : '.jpg';

    onProgress && onProgress(0.8, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(out, mime, 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-cropped' + ext };
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var circle = optionsEl.querySelector('#ic-circle');
    var fmt = optionsEl.querySelector('#ic-fmt');
    return {
      circle: circle ? circle.checked : false,
      format: fmt ? fmt.value : 'same',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

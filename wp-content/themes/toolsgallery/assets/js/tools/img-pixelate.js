/**
 * ToolsGallery — Pixelate Image
 * Handler: img-pixelate
 * URL: /tool/pixelate-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-pixelate' };
  var _selectionRect = null;
  var _origImg = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ipx-block">Block Size: <span id="ipx-block-val">8</span>px</label>' +
      '<input type="range" id="ipx-block" min="2" max="64" value="8" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Mode</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ipx-mode" value="full" checked> Full image</label>' +
        '<label><input type="radio" name="ipx-mode" value="region"> Region (draw selection)</label>' +
      '</div>' +
    '</div>' +
    '<div id="ipx-canvas-wrap" style="margin-top:12px;display:none;position:relative">' +
      '<canvas id="ipx-canvas" style="display:block;max-width:100%;cursor:default;border:1px solid #ddd;border-radius:4px"></canvas>' +
      '<canvas id="ipx-overlay" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>' +
    '</div>' +
    '<div id="ipx-preview-wrap" style="margin-top:12px;display:none">' +
      '<p style="margin:0 0 4px;font-size:12px;font-weight:600">Preview</p>' +
      '<canvas id="ipx-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'var sl=document.getElementById("ipx-block"),sv=document.getElementById("ipx-block-val");' +
      'if(sl&&sv)sl.addEventListener("input",function(){sv.textContent=sl.value;});' +
      'document.querySelectorAll("input[name=\'ipx-mode\']").forEach(function(r){r.addEventListener("change",function(){' +
        'var wrap=document.getElementById("ipx-canvas-wrap");' +
        'if(wrap){wrap.style.display=r.value==="region"&&window._origImg?"block":"none";}' +
        'var canvas=document.getElementById("ipx-canvas");if(canvas)canvas.style.cursor=r.value==="region"?"crosshair":"default";' +
      '});});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var block = optionsEl.querySelector('#ipx-block');
    var mode = optionsEl.querySelector('input[name="ipx-mode"]:checked');
    return {
      blockSize: block ? parseInt(block.value) : 8,
      mode: mode ? mode.value : 'full',
    };
  }

  function pixelate(ctx, x, y, w, h, blockSize) {
    for (var bx = x; bx < x + w; bx += blockSize) {
      for (var by = y; by < y + h; by += blockSize) {
        var bw = Math.min(blockSize, x + w - bx);
        var bh = Math.min(blockSize, y + h - by);
        var data = ctx.getImageData(bx, by, bw, bh).data;
        var r = 0, g = 0, b = 0, cnt = data.length / 4;
        for (var i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; }
        ctx.fillStyle = 'rgb(' + Math.round(r/cnt) + ',' + Math.round(g/cnt) + ',' + Math.round(b/cnt) + ')';
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');

    return new Promise(function (resolve, reject) {
      if (_origImg && window._ipxFile === file && options.mode === 'region' && _selectionRect) {
        applyPixelate(_origImg, options, _selectionRect, file, resolve, reject, onProgress);
        return;
      }

      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        _origImg = img; window._ipxFile = file; window._origImg = img; _selectionRect = null;

        if (options.mode === 'region') {
          // Setup region selection
          var wrap = document.getElementById('ipx-canvas-wrap');
          var canvas = document.getElementById('ipx-canvas');
          var overlay = document.getElementById('ipx-overlay');
          if (wrap && canvas && overlay) {
            var maxW = Math.min(700, window.innerWidth - 40);
            var sc = Math.min(1, maxW / img.width);
            var dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);
            canvas.width = dw; canvas.height = dh;
            canvas.getContext('2d').drawImage(img, 0, 0, dw, dh);
            canvas.style.cursor = 'crosshair';
            overlay.width = dw; overlay.height = dh; overlay.style.width = dw+'px'; overlay.style.height = dh+'px';
            wrap.style.display = 'block'; wrap.style.width = dw+'px'; wrap.style.height = dh+'px';

            var drawing = false, sx = 0, sy = 0;
            canvas.addEventListener('mousedown', function (e) { var r = canvas.getBoundingClientRect(); sx = e.clientX-r.left; sy = e.clientY-r.top; drawing = true; });
            canvas.addEventListener('mousemove', function (e) {
              if (!drawing) return;
              var r = canvas.getBoundingClientRect(); var ex = e.clientX-r.left, ey = e.clientY-r.top;
              var octx = overlay.getContext('2d'); octx.clearRect(0,0,dw,dh);
              octx.strokeStyle = '#E07B39'; octx.lineWidth = 2; octx.setLineDash([5,3]);
              octx.strokeRect(sx, sy, ex-sx, ey-sy); octx.fillStyle = 'rgba(224,123,57,0.1)'; octx.fillRect(sx,sy,ex-sx,ey-sy);
            });
            canvas.addEventListener('mouseup', function (e) {
              drawing = false;
              var r = canvas.getBoundingClientRect(); var ex = e.clientX-r.left, ey = e.clientY-r.top;
              if (Math.abs(ex-sx) > 10 && Math.abs(ey-sy) > 10) {
                _selectionRect = { x: Math.round(Math.min(sx,ex)/sc), y: Math.round(Math.min(sy,ey)/sc), w: Math.round(Math.abs(ex-sx)/sc), h: Math.round(Math.abs(ey-sy)/sc) };
              }
            });
          }
          onProgress && onProgress(0.5, 'Draw a rectangle over the region to pixelate, then click the button.');
          resolve({ _wait: true, file: file, options: options });
          return;
        }

        // Full image mode
        applyPixelate(img, options, null, file, resolve, reject, onProgress);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    }).then(function (r) {
      if (r && r._wait) {
        if (!_selectionRect) throw new Error('Please draw a rectangle selection first.');
        return new Promise(function (res, rej) { applyPixelate(_origImg, r.options, _selectionRect, r.file, res, rej, function(){}); });
      }
      return r;
    });
  }

  function applyPixelate(img, options, rect, file, resolve, reject, onProgress) {
    onProgress && onProgress(0.6, 'Pixelating...');
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    if (rect) {
      pixelate(ctx, rect.x, rect.y, rect.w, rect.h, options.blockSize);
    } else {
      pixelate(ctx, 0, 0, canvas.width, canvas.height, options.blockSize);
    }

    // Preview
    var previewEl = document.getElementById('ipx-preview');
    var previewWrap = document.getElementById('ipx-preview-wrap');
    if (previewEl && previewWrap) {
      var maxW = 400; var sc = Math.min(1, maxW / canvas.width);
      previewEl.width = Math.round(canvas.width*sc); previewEl.height = Math.round(canvas.height*sc);
      previewEl.getContext('2d').drawImage(canvas, 0, 0, previewEl.width, previewEl.height);
      previewWrap.style.display = 'block';
    }

    var base = file.name.replace(/\.[^.]+$/, '');
    canvas.toBlob(function (blob) {
      if (!blob) { reject(new Error('Failed')); return; }
      onProgress && onProgress(1, 'Done!');
      resolve({ blob: blob, filename: base + '-pixelated.jpg' });
    }, 'image/jpeg', 0.92);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

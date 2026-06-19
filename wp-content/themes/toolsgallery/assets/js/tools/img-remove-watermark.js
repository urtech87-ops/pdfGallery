/**
 * ToolsGallery — Remove Watermark
 * Handler: img-remove-watermark
 * URL: /tool/remove-watermark/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-watermark' };
  var _selections = [];
  var _origImg = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info">Draw rectangles over the watermark area(s). The tool will fill them with surrounding colors to blend seamlessly.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="irw-feather">Feather Edges: <span id="irw-feather-val">3</span>px</label>' +
      '<input type="range" id="irw-feather" min="0" max="20" value="3" style="flex:1">' +
    '</div>' +
    '<div id="irw-canvas-wrap" style="margin-top:12px;display:none;position:relative">' +
      '<canvas id="irw-canvas" style="display:block;max-width:100%;cursor:crosshair;border:1px solid #ddd;border-radius:4px"></canvas>' +
      '<canvas id="irw-overlay" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>' +
    '</div>' +
    '<div style="margin-top:8px">' +
      '<button type="button" class="tg-btn-secondary" id="irw-clear-btn">Clear Selections</button>' +
    '</div>' +
    '<script>(function(){' +
      'var sl=document.getElementById("irw-feather"),sv=document.getElementById("irw-feather-val");' +
      'if(sl&&sv)sl.addEventListener("input",function(){sv.textContent=sl.value;});' +
      'var clr=document.getElementById("irw-clear-btn");' +
      'if(clr)clr.addEventListener("click",function(){if(window._irwClear)window._irwClear();});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var feather = optionsEl.querySelector('#irw-feather');
    return { feather: feather ? parseInt(feather.value) : 3 };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');

    return new Promise(function (resolve, reject) {
      if (_origImg && window._irwFile === file && _selections.length > 0) {
        applyRemoval(_origImg, _selections, options, file, resolve, reject, onProgress);
        return;
      }

      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        _origImg = img;
        window._irwFile = file;
        _selections = [];

        var wrap = document.getElementById('irw-canvas-wrap');
        var canvas = document.getElementById('irw-canvas');
        var overlay = document.getElementById('irw-overlay');

        if (!wrap || !canvas || !overlay) {
          reject(new Error('UI not ready')); return;
        }

        var maxW = Math.min(700, window.innerWidth - 40);
        var sc = Math.min(1, maxW / img.width);
        var dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);

        canvas.width = dw; canvas.height = dh;
        canvas.getContext('2d').drawImage(img, 0, 0, dw, dh);
        overlay.width = dw; overlay.height = dh;
        overlay.style.width = dw + 'px'; overlay.style.height = dh + 'px';
        wrap.style.display = 'block';
        wrap.style.width = dw + 'px'; wrap.style.height = dh + 'px';

        function redrawOverlay() {
          var octx = overlay.getContext('2d');
          octx.clearRect(0, 0, dw, dh);
          octx.strokeStyle = '#E07B39';
          octx.fillStyle = 'rgba(224,123,57,0.3)';
          octx.lineWidth = 2;
          _selections.forEach(function (sel) {
            octx.fillRect(sel.x * sc, sel.y * sc, sel.w * sc, sel.h * sc);
            octx.strokeRect(sel.x * sc, sel.y * sc, sel.w * sc, sel.h * sc);
          });
        }

        var drawing = false, sx = 0, sy = 0;
        canvas.addEventListener('mousedown', function (e) {
          var r = canvas.getBoundingClientRect();
          sx = e.clientX - r.left; sy = e.clientY - r.top;
          drawing = true;
        });
        canvas.addEventListener('mouseup', function (e) {
          drawing = false;
          var r = canvas.getBoundingClientRect();
          var ex = e.clientX - r.left, ey = e.clientY - r.top;
          if (Math.abs(ex - sx) > 5 && Math.abs(ey - sy) > 5) {
            _selections.push({
              x: Math.round(Math.min(sx, ex) / sc),
              y: Math.round(Math.min(sy, ey) / sc),
              w: Math.round(Math.abs(ex - sx) / sc),
              h: Math.round(Math.abs(ey - sy) / sc),
            });
            redrawOverlay();
          }
        });

        window._irwClear = function () { _selections = []; redrawOverlay(); };

        onProgress && onProgress(0.5, 'Draw rectangle(s) over watermarks, then click the button.');
        resolve({ _waitForSel: true, file: file, options: options });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    }).then(function (r) {
      if (r && r._waitForSel) {
        if (_selections.length === 0) throw new Error('Please draw a rectangle over the watermark first.');
        return new Promise(function (res, rej) {
          applyRemoval(_origImg, _selections, r.options, r.file, res, rej, function(){});
        });
      }
      return r;
    });
  }

  function applyRemoval(img, selections, options, file, resolve, reject, onProgress) {
    onProgress && onProgress(0.7, 'Removing watermark...');
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);

    selections.forEach(function (sel) {
      inpaintRegion(id, sel, img.width, img.height, options.feather || 3);
    });

    ctx.putImageData(id, 0, 0);
    var base = file.name.replace(/\.[^.]+$/, '');
    canvas.toBlob(function (blob) {
      if (!blob) { reject(new Error('Failed')); return; }
      onProgress && onProgress(1, 'Done!');
      resolve({ blob: blob, filename: base + '-no-watermark.jpg' });
    }, 'image/jpeg', 0.95);
  }

  function inpaintRegion(id, rect, w, h, feather) {
    var d = id.data;
    var x1 = Math.max(0, rect.x), y1 = Math.max(0, rect.y);
    var x2 = Math.min(w - 1, rect.x + rect.w);
    var y2 = Math.min(h - 1, rect.y + rect.h);
    var sample = feather + 4;

    for (var y = y1; y <= y2; y++) {
      for (var x = x1; x <= x2; x++) {
        // Sample surrounding pixels
        var r = 0, g = 0, b = 0, cnt = 0;
        var positions = [
          [x, Math.max(0, y1 - sample)], [x, Math.min(h-1, y2 + sample)],
          [Math.max(0, x1 - sample), y], [Math.min(w-1, x2 + sample), y],
        ];
        positions.forEach(function (pos) {
          var idx = (pos[1] * w + pos[0]) * 4;
          r += d[idx]; g += d[idx+1]; b += d[idx+2]; cnt++;
        });
        var idx = (y * w + x) * 4;
        d[idx] = Math.round(r / cnt);
        d[idx+1] = Math.round(g / cnt);
        d[idx+2] = Math.round(b / cnt);
      }
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

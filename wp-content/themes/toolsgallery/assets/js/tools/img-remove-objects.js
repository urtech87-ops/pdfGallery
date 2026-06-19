/**
 * ToolsGallery — Remove Objects from Image
 * Handler: img-remove-objects
 * URL: /tool/remove-objects/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-objects' };
  var _selections = [];
  var _origImg = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info">Draw rectangles over objects you want to remove. The tool will fill the area with surrounding content.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iro-blend">Blend Radius: <span id="iro-blend-val">8</span>px</label>' +
      '<input type="range" id="iro-blend" min="2" max="30" value="8" style="flex:1">' +
    '</div>' +
    '<div id="iro-canvas-wrap" style="margin-top:12px;display:none;position:relative">' +
      '<canvas id="iro-canvas" style="display:block;max-width:100%;cursor:crosshair;border:1px solid #ddd;border-radius:4px"></canvas>' +
      '<canvas id="iro-overlay" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>' +
    '</div>' +
    '<div style="margin-top:8px">' +
      '<button type="button" class="tg-btn-secondary" id="iro-clear-btn">Clear Selections</button>' +
    '</div>' +
    '<script>(function(){' +
      'var sl=document.getElementById("iro-blend"),sv=document.getElementById("iro-blend-val");' +
      'if(sl&&sv)sl.addEventListener("input",function(){sv.textContent=sl.value;});' +
      'var c=document.getElementById("iro-clear-btn");' +
      'if(c)c.addEventListener("click",function(){if(window._iroClear)window._iroClear();});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var blend = optionsEl.querySelector('#iro-blend');
    return { blend: blend ? parseInt(blend.value) : 8 };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');

    return new Promise(function (resolve, reject) {
      if (_origImg && window._iroFile === file && _selections.length > 0) {
        applyRemoval(_origImg, _selections, options, file, resolve, reject, onProgress);
        return;
      }

      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        _origImg = img; window._iroFile = file; _selections = [];

        var wrap = document.getElementById('iro-canvas-wrap');
        var canvas = document.getElementById('iro-canvas');
        var overlay = document.getElementById('iro-overlay');
        if (!wrap || !canvas || !overlay) { reject(new Error('UI not ready')); return; }

        var maxW = Math.min(700, window.innerWidth - 40);
        var sc = Math.min(1, maxW / img.width);
        var dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);

        canvas.width = dw; canvas.height = dh;
        canvas.getContext('2d').drawImage(img, 0, 0, dw, dh);
        overlay.width = dw; overlay.height = dh;
        overlay.style.width = dw + 'px'; overlay.style.height = dh + 'px';
        wrap.style.display = 'block'; wrap.style.width = dw + 'px'; wrap.style.height = dh + 'px';

        function redrawOverlay() {
          var octx = overlay.getContext('2d');
          octx.clearRect(0, 0, dw, dh);
          octx.strokeStyle = '#ff0000'; octx.fillStyle = 'rgba(255,0,0,0.25)'; octx.lineWidth = 2;
          _selections.forEach(function (sel) {
            octx.fillRect(sel.x*sc, sel.y*sc, sel.w*sc, sel.h*sc);
            octx.strokeRect(sel.x*sc, sel.y*sc, sel.w*sc, sel.h*sc);
          });
        }

        var drawing = false, sx = 0, sy = 0;
        canvas.addEventListener('mousedown', function (e) { var r = canvas.getBoundingClientRect(); sx = e.clientX-r.left; sy = e.clientY-r.top; drawing = true; });
        canvas.addEventListener('mouseup', function (e) {
          drawing = false;
          var r = canvas.getBoundingClientRect(); var ex = e.clientX-r.left, ey = e.clientY-r.top;
          if (Math.abs(ex-sx) > 5 && Math.abs(ey-sy) > 5) {
            _selections.push({ x: Math.round(Math.min(sx,ex)/sc), y: Math.round(Math.min(sy,ey)/sc), w: Math.round(Math.abs(ex-sx)/sc), h: Math.round(Math.abs(ey-sy)/sc) });
            redrawOverlay();
          }
        });
        window._iroClear = function () { _selections = []; redrawOverlay(); };
        onProgress && onProgress(0.5, 'Draw rectangles over objects to remove, then click the button.');
        resolve({ _wait: true, file: file, options: options });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    }).then(function (r) {
      if (r && r._wait) {
        if (_selections.length === 0) throw new Error('Please draw a rectangle over the object to remove.');
        return new Promise(function (res, rej) { applyRemoval(_origImg, _selections, r.options, r.file, res, rej, function(){}); });
      }
      return r;
    });
  }

  function applyRemoval(img, selections, options, file, resolve, reject, onProgress) {
    onProgress && onProgress(0.7, 'Removing objects...');
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    selections.forEach(function (sel) {
      contentAwareFill(id, sel, img.width, img.height, options.blend || 8);
    });
    ctx.putImageData(id, 0, 0);
    var base = file.name.replace(/\.[^.]+$/, '');
    canvas.toBlob(function (blob) {
      if (!blob) { reject(new Error('Failed')); return; }
      onProgress && onProgress(1, 'Done!');
      resolve({ blob: blob, filename: base + '-removed.jpg' });
    }, 'image/jpeg', 0.95);
  }

  function contentAwareFill(id, rect, w, h, blendR) {
    var d = id.data;
    var x1 = Math.max(0, rect.x), y1 = Math.max(0, rect.y);
    var x2 = Math.min(w-1, rect.x+rect.w), y2 = Math.min(h-1, rect.y+rect.h);

    for (var y = y1; y <= y2; y++) {
      for (var x = x1; x <= x2; x++) {
        var rSum = 0, gSum = 0, bSum = 0, cnt = 0;
        for (var dy = -blendR; dy <= blendR; dy++) {
          for (var dx = -blendR; dx <= blendR; dx++) {
            var nx = x + dx, ny = y + dy;
            if (nx < x1 || nx > x2 || ny < y1 || ny > y2) {
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                var idx = (ny * w + nx) * 4;
                rSum += d[idx]; gSum += d[idx+1]; bSum += d[idx+2]; cnt++;
              }
            }
          }
        }
        if (cnt > 0) {
          var i = (y * w + x) * 4;
          d[i] = Math.round(rSum/cnt); d[i+1] = Math.round(gSum/cnt); d[i+2] = Math.round(bSum/cnt);
        }
      }
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

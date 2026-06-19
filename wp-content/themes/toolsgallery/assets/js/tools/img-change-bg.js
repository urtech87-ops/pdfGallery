/**
 * ToolsGallery — Change Image Background
 * Handler: img-change-bg
 * URL: /tool/change-background/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-change-bg' };
  var _subjectRect = null;
  var _origImg = null;

  function getOptionsHTML() {
    return '<p class="tg-opt-info">Draw a rectangle around the subject you want to keep. Then choose a new background.</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Background</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="icb-bg" value="color" checked> Solid Color</label>' +
        '<label><input type="radio" name="icb-bg" value="image"> Upload Image</label>' +
        '<label><input type="radio" name="icb-bg" value="gradient"> Gradient</label>' +
      '</div>' +
    '</div>' +
    '<div id="icb-color-wrap" class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icb-color">Color</label>' +
      '<input type="color" id="icb-color" value="#4a90e2">' +
    '</div>' +
    '<div id="icb-image-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label">Background Image</label>' +
      '<input type="file" id="icb-bg-file" accept="image/*" class="tg-text-input">' +
    '</div>' +
    '<div id="icb-gradient-wrap" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="icb-grad1">Color 1</label>' +
        '<input type="color" id="icb-grad1" value="#667eea">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="icb-grad2">Color 2</label>' +
        '<input type="color" id="icb-grad2" value="#764ba2">' +
      '</div>' +
    '</div>' +
    '<div id="icb-canvas-wrap" style="margin-top:12px;display:none;position:relative">' +
      '<canvas id="icb-canvas" style="display:block;max-width:100%;cursor:crosshair;border:1px solid #ddd;border-radius:4px"></canvas>' +
      '<canvas id="icb-overlay" style="position:absolute;top:0;left:0;pointer-events:none"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'document.querySelectorAll("input[name=\'icb-bg\']").forEach(function(r){r.addEventListener("change",function(){' +
        'document.getElementById("icb-color-wrap").hidden=r.value!=="color";' +
        'document.getElementById("icb-image-wrap").hidden=r.value!=="image";' +
        'document.getElementById("icb-gradient-wrap").hidden=r.value!=="gradient";' +
      '});});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var bgType = optionsEl.querySelector('input[name="icb-bg"]:checked');
    var color = optionsEl.querySelector('#icb-color');
    var bgFile = optionsEl.querySelector('#icb-bg-file');
    var grad1 = optionsEl.querySelector('#icb-grad1');
    var grad2 = optionsEl.querySelector('#icb-grad2');
    return {
      bgType: bgType ? bgType.value : 'color',
      color: color ? color.value : '#4a90e2',
      bgFile: bgFile ? bgFile.files[0] : null,
      grad1: grad1 ? grad1.value : '#667eea',
      grad2: grad2 ? grad2.value : '#764ba2',
    };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');

    return new Promise(function (resolve, reject) {
      if (_origImg && window._icbFile === file && _subjectRect) {
        applyBgChange(_origImg, _subjectRect, options, file, resolve, reject, onProgress);
        return;
      }

      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        _origImg = img; window._icbFile = file; _subjectRect = null;

        var wrap = document.getElementById('icb-canvas-wrap');
        var canvas = document.getElementById('icb-canvas');
        var overlay = document.getElementById('icb-overlay');
        if (!wrap || !canvas || !overlay) { reject(new Error('UI not ready')); return; }

        var maxW = Math.min(700, window.innerWidth - 40);
        var sc = Math.min(1, maxW / img.width);
        var dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);
        canvas.width = dw; canvas.height = dh;
        canvas.getContext('2d').drawImage(img, 0, 0, dw, dh);
        overlay.width = dw; overlay.height = dh; overlay.style.width = dw + 'px'; overlay.style.height = dh + 'px';
        wrap.style.display = 'block'; wrap.style.width = dw + 'px'; wrap.style.height = dh + 'px';

        var drawing = false, sx = 0, sy = 0;
        canvas.addEventListener('mousedown', function (e) { var r = canvas.getBoundingClientRect(); sx = e.clientX-r.left; sy = e.clientY-r.top; drawing = true; });
        canvas.addEventListener('mousemove', function (e) {
          if (!drawing) return;
          var r = canvas.getBoundingClientRect(); var ex = e.clientX-r.left, ey = e.clientY-r.top;
          var octx = overlay.getContext('2d'); octx.clearRect(0,0,dw,dh);
          octx.strokeStyle = '#00cc00'; octx.lineWidth = 2; octx.setLineDash([5,3]);
          octx.strokeRect(sx, sy, ex-sx, ey-sy); octx.fillStyle = 'rgba(0,200,0,0.1)'; octx.fillRect(sx,sy,ex-sx,ey-sy);
        });
        canvas.addEventListener('mouseup', function (e) {
          drawing = false;
          var r = canvas.getBoundingClientRect(); var ex = e.clientX-r.left, ey = e.clientY-r.top;
          if (Math.abs(ex-sx) > 10 && Math.abs(ey-sy) > 10) {
            _subjectRect = { x: Math.round(Math.min(sx,ex)/sc), y: Math.round(Math.min(sy,ey)/sc), w: Math.round(Math.abs(ex-sx)/sc), h: Math.round(Math.abs(ey-sy)/sc) };
          }
        });
        onProgress && onProgress(0.5, 'Draw rectangle around subject, then click the button.');
        resolve({ _wait: true, file: file, options: options });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    }).then(function (r) {
      if (r && r._wait) {
        if (!_subjectRect) throw new Error('Please draw a rectangle around the subject first.');
        return new Promise(function (res, rej) { applyBgChange(_origImg, _subjectRect, r.options, r.file, res, rej, function(){}); });
      }
      return r;
    });
  }

  async function applyBgChange(img, rect, options, file, resolve, reject, onProgress) {
    onProgress && onProgress(0.7, 'Compositing...');
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');

    // Draw background
    if (options.bgType === 'color') {
      ctx.fillStyle = options.color; ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (options.bgType === 'gradient') {
      var grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, options.grad1); grad.addColorStop(1, options.grad2);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (options.bgType === 'image' && options.bgFile) {
      await new Promise(function (res) {
        var bgImg = new Image(); bgImg.onload = function () { ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); res(); };
        bgImg.src = URL.createObjectURL(options.bgFile);
      });
    } else {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw subject on top
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);

    var base = file.name.replace(/\.[^.]+$/, '');
    canvas.toBlob(function (blob) {
      if (!blob) { reject(new Error('Failed')); return; }
      onProgress && onProgress(1, 'Done!');
      resolve({ blob: blob, filename: base + '-new-bg.jpg' });
    }, 'image/jpeg', 0.92);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

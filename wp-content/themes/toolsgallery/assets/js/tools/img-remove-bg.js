/**
 * ToolsGallery — Remove Background
 * Handler: img-remove-bg
 * URL: /tool/remove-background/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-bg' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Method</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="irb-method" value="api" checked> AI (remove.bg API — best quality)</label>' +
        '<label><input type="radio" name="irb-method" value="manual"> Manual color select (no API needed)</label>' +
      '</div>' +
    '</div>' +
    '<div id="irb-manual-wrap" hidden>' +
      '<p class="tg-opt-info">After loading, click on the background color in the image preview below.</p>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="irb-tolerance">Tolerance: <span id="irb-tol-val">30</span></label>' +
        '<input type="range" id="irb-tolerance" min="1" max="100" value="30" style="flex:1">' +
      '</div>' +
    '</div>' +
    '<div id="irb-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Original</p>' +
          '<canvas id="irb-before" style="max-width:200px;border:1px solid #ddd;cursor:crosshair"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Result</p>' +
          '<canvas id="irb-after" style="max-width:200px;border:1px solid #ddd;background:repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0 / 12px 12px"></canvas></div>' +
      '</div>' +
    '</div>' +
    '<script>(function(){' +
      'var methodR=document.querySelectorAll("input[name=\'irb-method\']");' +
      'var mWrap=document.getElementById("irb-manual-wrap");' +
      'methodR.forEach(function(r){r.addEventListener("change",function(){if(mWrap)mWrap.hidden=r.value!=="manual";});});' +
      'var tol=document.getElementById("irb-tolerance"),tv=document.getElementById("irb-tol-val");' +
      'if(tol&&tv)tol.addEventListener("input",function(){tv.textContent=tol.value;});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var method = optionsEl.querySelector('input[name="irb-method"]:checked');
    var tol = optionsEl.querySelector('#irb-tolerance');
    return {
      method: method ? method.value : 'api',
      tolerance: tol ? parseInt(tol.value) : 30,
    };
  }

  var _origImg = null;

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');

    if (options.method === 'api') {
      return removeViaApi(file, onProgress);
    }

    return removeManual(file, options, onProgress);
  }

  async function removeViaApi(file, onProgress) {
    onProgress && onProgress(0.2, 'Sending to API...');
    var config = window.tgAiConfig || {};
    var ajaxUrl = config.ajaxUrl || '/wp-admin/admin-ajax.php';
    var nonce = config.nonce || '';

    // Try remove.bg via AJAX
    var formData = new FormData();
    formData.append('action', 'tg_removebg');
    formData.append('nonce', nonce);
    formData.append('image_file', file, file.name);

    try {
      var resp = await fetch(ajaxUrl, { method: 'POST', body: formData });
      var json = await resp.json();
      if (json.success && json.data && json.data.image) {
        onProgress && onProgress(0.9, 'Done!');
        var b64 = json.data.image;
        var bytes = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
        var blob = new Blob([bytes], { type: 'image/png' });
        return { blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '-no-bg.png' };
      }
      // Fallback to manual
      return removeManual(file, { tolerance: 30 }, onProgress);
    } catch (e) {
      return removeManual(file, { tolerance: 30 }, onProgress);
    }
  }

  async function removeManual(file, options, onProgress) {
    onProgress && onProgress(0.2, 'Loading image for manual removal...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        _origImg = img;

        var beforeEl = document.getElementById('irb-before');
        var afterEl = document.getElementById('irb-after');
        var wrap = document.getElementById('irb-preview-wrap');

        if (!beforeEl || !afterEl || !wrap) {
          // No preview available, use corner color
          var result = floodFill(img, 0, 0, options.tolerance || 30);
          result.toBlob(function (blob) {
            resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '-no-bg.png' });
          }, 'image/png');
          return;
        }

        var maxW = 200;
        var sc = Math.min(1, maxW / img.width);
        var dw = Math.round(img.width * sc), dh = Math.round(img.height * sc);

        beforeEl.width = dw; beforeEl.height = dh;
        beforeEl.getContext('2d').drawImage(img, 0, 0, dw, dh);
        afterEl.width = dw; afterEl.height = dh;
        wrap.style.display = 'block';

        onProgress && onProgress(0.5, 'Click on the background in the left image...');

        beforeEl.addEventListener('click', function handler(e) {
          var rect = beforeEl.getBoundingClientRect();
          var px = Math.round((e.clientX - rect.left) / sc);
          var py = Math.round((e.clientY - rect.top) / sc);
          var resultCanvas = floodFill(img, px, py, options.tolerance || 30);
          afterEl.width = dw; afterEl.height = dh;
          afterEl.getContext('2d').drawImage(resultCanvas, 0, 0, dw, dh);
          onProgress && onProgress(0.9, 'Background removed. Click action button to download.');
          resultCanvas.toBlob(function (blob) {
            resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '-no-bg.png' });
            beforeEl.removeEventListener('click', handler);
          }, 'image/png');
        });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function floodFill(img, startX, startY, tolerance) {
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    var w = canvas.width, h = canvas.height;
    var data = ctx.getImageData(0, 0, w, h);
    var pixels = data.data;
    var idx = (startY * w + startX) * 4;
    var targetR = pixels[idx], targetG = pixels[idx+1], targetB = pixels[idx+2];

    var stack = [[startX, startY]];
    var visited = new Uint8Array(w * h);

    while (stack.length) {
      var pos = stack.pop();
      var x = pos[0], y = pos[1];
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      var i = y * w + x;
      if (visited[i]) continue;
      visited[i] = 1;
      var pi = i * 4;
      var dr = pixels[pi] - targetR, dg = pixels[pi+1] - targetG, db = pixels[pi+2] - targetB;
      var dist = Math.sqrt(dr*dr + dg*dg + db*db);
      if (dist > tolerance * 2) continue;
      pixels[pi+3] = 0; // Make transparent
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

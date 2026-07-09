/**
 * ToolsGallery — Remove Background
 * Handler: img-remove-bg
 * URL: /tool/remove-background/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-remove-bg' };
  var _origImg = null;
  var _pickedPoint = null;

  function apiConfigured() {
    return !!(window.tgAiConfig && parseInt(tgAiConfig.removebgConfigured));
  }

  function getOptionsHTML() {
    var api = apiConfigured();
    var methodRow = api
      ? '<div class="tg-opt-row">' +
          '<label class="tg-opt-label">Method</label>' +
          '<div class="tg-radio-group">' +
            '<label><input type="radio" name="irb-method" value="api" checked> AI (remove.bg API — best quality)</label>' +
            '<label><input type="radio" name="irb-method" value="manual"> Manual color select</label>' +
          '</div>' +
        '</div>'
      : '<input type="hidden" name="irb-method-fixed" value="manual">' +
        '<p class="tg-opt-info">Click on the background color in the image preview below, then press the action button. Works best on images with an even background.</p>';

    return methodRow +
    '<div id="irb-manual-wrap"' + (api ? ' hidden' : '') + '>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="irb-tolerance">Tolerance: <span id="irb-tol-val">30</span></label>' +
        '<input type="range" id="irb-tolerance" min="1" max="100" value="30" style="flex:1">' +
      '</div>' +
    '</div>' +
    '<div id="irb-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Original (click background)</p>' +
          '<canvas id="irb-before" style="max-width:240px;border:1px solid #ddd;cursor:crosshair"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Preview</p>' +
          '<canvas id="irb-after" style="max-width:240px;border:1px solid #ddd;background:repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0 / 12px 12px"></canvas></div>' +
      '</div>' +
    '</div>';
  }

  function wireOptions(container) {
    container.querySelectorAll('input[name="irb-method"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var mWrap = container.querySelector('#irb-manual-wrap');
        if (mWrap) mWrap.hidden = r.value !== 'manual';
      });
    });
    var tol = container.querySelector('#irb-tolerance');
    var tv = container.querySelector('#irb-tol-val');
    if (tol && tv) tol.addEventListener('input', function () {
      tv.textContent = tol.value;
      updateManualPreview(container);
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { method: apiConfigured() ? 'api' : 'manual', tolerance: 30 };
    var method = optionsEl.querySelector('input[name="irb-method"]:checked');
    var tol = optionsEl.querySelector('#irb-tolerance');
    return {
      method: method ? method.value : (apiConfigured() ? 'api' : 'manual'),
      tolerance: tol ? parseInt(tol.value) : 30,
    };
  }

  function updateManualPreview(optionsEl) {
    if (!_origImg || !_pickedPoint) return;
    var afterEl = document.getElementById('irb-after');
    if (!afterEl) return;
    var opts = getOptions(optionsEl || document);
    var resultCanvas = floodFill(_origImg, _pickedPoint.x, _pickedPoint.y, opts.tolerance);
    TGImageUtil.drawPreview(resultCanvas, afterEl, 240);
  }

  function onFileReady(file, optionsEl) {
    _origImg = null;
    _pickedPoint = null;
    if (!file) return;

    TGImageUtil.loadImage(file).then(function (img) {
      _origImg = img;

      var beforeEl = document.getElementById('irb-before');
      var afterEl = document.getElementById('irb-after');
      var wrap = document.getElementById('irb-preview-wrap');
      if (!beforeEl || !afterEl || !wrap) return;

      var sc = TGImageUtil.drawPreview(img, beforeEl, 240);
      afterEl.width = beforeEl.width;
      afterEl.height = beforeEl.height;
      wrap.style.display = 'block';

      beforeEl.onclick = function (e) {
        var rect = beforeEl.getBoundingClientRect();
        // Account for CSS max-width scaling on top of the canvas scale
        var cssScale = rect.width / beforeEl.width;
        _pickedPoint = {
          x: Math.min(img.naturalWidth - 1, Math.max(0, Math.round((e.clientX - rect.left) / cssScale / sc))),
          y: Math.min(img.naturalHeight - 1, Math.max(0, Math.round((e.clientY - rect.top) / cssScale / sc))),
        };
        updateManualPreview(optionsEl);
      };
    }).catch(function () {});
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');

    if (options.method === 'api' && apiConfigured()) {
      try {
        return await removeViaApi(file, onProgress);
      } catch (e) {
        onProgress && onProgress(0.3, 'API unavailable, using manual removal...');
      }
    }
    return removeManual(file, options, onProgress);
  }

  async function removeViaApi(file, onProgress) {
    onProgress && onProgress(0.3, 'Removing background with AI...');
    var config = window.tgAiConfig || {};
    var formData = new FormData();
    formData.append('action', 'tg_removebg');
    formData.append('nonce', config.nonce || '');
    formData.append('image_file', file, file.name);

    var resp = await fetch(config.ajaxUrl || '/wp-admin/admin-ajax.php', { method: 'POST', body: formData });
    var json = await resp.json();
    if (!json.success || !json.data || !json.data.image) {
      throw new Error((json.data && json.data.message) || 'Remove.bg request failed');
    }

    onProgress && onProgress(0.9, 'Done!');
    var bytes = Uint8Array.from(atob(json.data.image), function (c) { return c.charCodeAt(0); });
    var blob = new Blob([bytes], { type: 'image/png' });
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-no-bg.png' };
  }

  async function removeManual(file, options, onProgress) {
    onProgress && onProgress(0.4, 'Removing background...');
    var img = _origImg || await TGImageUtil.loadImage(file);

    // Use the clicked background point, or fall back to the top-left corner
    var px = _pickedPoint ? _pickedPoint.x : 0;
    var py = _pickedPoint ? _pickedPoint.y : 0;
    var resultCanvas = floodFill(img, px, py, options.tolerance || 30);

    var afterEl = document.getElementById('irb-after');
    if (afterEl) TGImageUtil.drawPreview(resultCanvas, afterEl, 240);

    onProgress && onProgress(0.8, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(resultCanvas, 'image/png', 1.0);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-no-bg.png' };
  }

  function floodFill(img, startX, startY, tolerance) {
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    var w = canvas.width, h = canvas.height;
    var data = ctx.getImageData(0, 0, w, h);
    var pixels = data.data;
    var idx = (startY * w + startX) * 4;
    var targetR = pixels[idx], targetG = pixels[idx + 1], targetB = pixels[idx + 2];

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
      var dr = pixels[pi] - targetR, dg = pixels[pi + 1] - targetG, db = pixels[pi + 2] - targetB;
      var dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist > tolerance * 2) continue;
      pixels[pi + 3] = 0; // Make transparent
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

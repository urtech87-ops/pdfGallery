/**
 * ToolsGallery — QR Code Generator
 * Handler: img-qr
 * URL: /tool/qr-code-generator/
 * Input type: data (no file upload) — self-contained init() tool.
 *
 * Live preview regenerates on every input change (debounced). Rendering
 * reads the QR module matrix from qrcodejs so canvas, colors, quiet zone
 * and SVG export all stay pixel-perfect at any size.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-qr', inputType: 'data' };

  var QRCODE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

  function init(box) {
    var optionsEl = box.querySelector('.tg-options');
    if (!optionsEl) return;
    optionsEl.hidden = false;

    optionsEl.innerHTML =
      '<div class="tg-opt-row" style="flex-direction:column;align-items:flex-start">' +
        '<label class="tg-opt-label" for="iqr-text">Text / URL</label>' +
        '<textarea id="iqr-text" class="tg-text-input" rows="3" style="width:100%;margin-top:4px" placeholder="https://example.com">https://example.com</textarea>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iqr-size">Size: <span id="iqr-size-val">300</span>px</label>' +
        '<input type="range" id="iqr-size" min="100" max="1000" step="50" value="300" style="flex:1">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iqr-ec">Error Correction</label>' +
        '<select id="iqr-ec" class="tg-select">' +
          '<option value="L">Low (7%)</option>' +
          '<option value="M" selected>Medium (15%)</option>' +
          '<option value="Q">Quartile (25%)</option>' +
          '<option value="H">High (30%)</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iqr-fg">Foreground</label>' +
        '<input type="color" id="iqr-fg" value="#000000">' +
        '<label class="tg-opt-label" for="iqr-bg" style="margin-left:16px">Background</label>' +
        '<input type="color" id="iqr-bg" value="#ffffff">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iqr-margin">Quiet Zone: <span id="iqr-margin-val">4</span> modules</label>' +
        '<input type="range" id="iqr-margin" min="0" max="10" value="4" style="flex:1">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iqr-format">Download Format</label>' +
        '<select id="iqr-format" class="tg-select">' +
          '<option value="png">PNG</option>' +
          '<option value="jpeg">JPEG</option>' +
          '<option value="svg">SVG</option>' +
        '</select>' +
      '</div>' +
      '<div id="iqr-error" class="tg-opt-info" hidden style="color:#dc2626"></div>' +
      '<div id="iqr-preview-wrap" style="margin-top:12px;text-align:center">' +
        '<p class="tg-opt-info" id="iqr-loading">Loading QR library...</p>' +
        '<div id="iqr-preview-inner" style="display:none;border:1px solid #ddd;border-radius:4px;padding:8px;background:#fff;max-width:100%">' +
          '<canvas id="iqr-canvas" style="max-width:280px;width:100%;height:auto;display:block;margin:0 auto"></canvas>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:12px;text-align:center">' +
        '<button type="button" class="tg-action-btn" id="iqr-download" disabled>Download QR Code</button>' +
      '</div>';

    var textEl   = optionsEl.querySelector('#iqr-text');
    var sizeEl   = optionsEl.querySelector('#iqr-size');
    var ecEl     = optionsEl.querySelector('#iqr-ec');
    var fgEl     = optionsEl.querySelector('#iqr-fg');
    var bgEl     = optionsEl.querySelector('#iqr-bg');
    var marginEl = optionsEl.querySelector('#iqr-margin');
    var fmtEl    = optionsEl.querySelector('#iqr-format');
    var canvas   = optionsEl.querySelector('#iqr-canvas');
    var dlBtn    = optionsEl.querySelector('#iqr-download');
    var errEl    = optionsEl.querySelector('#iqr-error');
    var loadingEl = optionsEl.querySelector('#iqr-loading');
    var innerEl  = optionsEl.querySelector('#iqr-preview-inner');

    function opts() {
      return {
        text: textEl.value.trim(),
        size: parseInt(sizeEl.value, 10) || 300,
        ec: ecEl.value,
        fg: fgEl.value,
        bg: bgEl.value,
        margin: parseInt(marginEl.value, 10) || 0,
        format: fmtEl.value,
      };
    }

    function showError(msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
      dlBtn.disabled = true;
    }
    function clearError() {
      errEl.hidden = true;
    }

    /* Build the QR module matrix using qrcodejs' internal model.
       Returns { count, isDark(r,c) } or null on failure. */
    function buildModel(text, ecLevel) {
      var tmp = document.createElement('div');
      tmp.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(tmp);
      try {
        var qr = new QRCode(tmp, {
          text: text,
          width: 64, height: 64,
          correctLevel: QRCode.CorrectLevel[ecLevel] || QRCode.CorrectLevel.M,
        });
        var model = qr._oQRCode;
        if (model && typeof model.getModuleCount === 'function') {
          return { count: model.getModuleCount(), isDark: model.isDark.bind(model) };
        }
        // Fallback: sample the rendered canvas if internals ever change
        var src = tmp.querySelector('canvas');
        if (src) {
          var sctx = src.getContext('2d');
          var img = sctx.getImageData(0, 0, src.width, src.height);
          return {
            count: src.width,
            isDark: function (r, c) {
              var i = (r * src.width + c) * 4;
              return img.data[i] < 128;
            },
          };
        }
        return null;
      } finally {
        document.body.removeChild(tmp);
      }
    }

    function drawToCanvas(model, target, size, marginModules, fg, bg) {
      var total = model.count + marginModules * 2;
      var scale = size / total;
      target.width = size;
      target.height = size;
      var ctx = target.getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = fg;
      for (var r = 0; r < model.count; r++) {
        for (var c = 0; c < model.count; c++) {
          if (!model.isDark(r, c)) continue;
          var x = (c + marginModules) * scale;
          var y = (r + marginModules) * scale;
          // ceil the cell edge so adjacent modules never show hairline seams
          ctx.fillRect(Math.floor(x), Math.floor(y),
            Math.ceil(x + scale) - Math.floor(x), Math.ceil(y + scale) - Math.floor(y));
        }
      }
    }

    function buildSvg(model, marginModules, fg, bg) {
      var total = model.count + marginModules * 2;
      var rects = [];
      for (var r = 0; r < model.count; r++) {
        for (var c = 0; c < model.count; c++) {
          if (!model.isDark(r, c)) continue;
          rects.push('M' + (c + marginModules) + ' ' + (r + marginModules) + 'h1v1h-1z');
        }
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
        '<rect width="' + total + '" height="' + total + '" fill="' + bg + '"/>' +
        '<path d="' + rects.join('') + '" fill="' + fg + '"/>' +
        '</svg>';
    }

    var _model = null;

    function render() {
      if (!window.QRCode) return;
      var o = opts();
      if (!o.text) {
        _model = null;
        showError('Enter text or a URL above to generate a QR code.');
        innerEl.style.display = 'none';
        return;
      }
      try {
        _model = buildModel(o.text, o.ec);
      } catch (e) {
        _model = null;
        showError('Text is too long for this error-correction level — shorten it or lower the level.');
        return;
      }
      if (!_model) {
        showError('Could not generate the QR code. Please try again.');
        return;
      }
      clearError();
      drawToCanvas(_model, canvas, o.size, o.margin, o.fg, o.bg);
      innerEl.style.display = 'block';
      innerEl.style.background = o.bg;
      dlBtn.disabled = false;
    }

    var _debounce = null;
    function scheduleRender() {
      clearTimeout(_debounce);
      _debounce = setTimeout(render, 150);
    }

    [textEl, sizeEl, ecEl, fgEl, bgEl, marginEl].forEach(function (input) {
      input.addEventListener('input', function () {
        if (input === sizeEl) optionsEl.querySelector('#iqr-size-val').textContent = sizeEl.value;
        if (input === marginEl) optionsEl.querySelector('#iqr-margin-val').textContent = marginEl.value;
        scheduleRender();
      });
      input.addEventListener('change', scheduleRender);
    });

    dlBtn.addEventListener('click', function () {
      if (!_model) return;
      var o = opts();
      if (o.format === 'svg') {
        var svg = buildSvg(_model, o.margin, o.fg, o.bg);
        var blob = new Blob([svg], { type: 'image/svg+xml' });
        triggerDownload(blob, 'qr-code.svg');
        return;
      }
      // Render a fresh full-size canvas (preview canvas is already full size,
      // but re-draw so JPEG never inherits transparency)
      var out = document.createElement('canvas');
      drawToCanvas(_model, out, o.size, o.margin, o.fg, o.bg);
      var mime = o.format === 'jpeg' ? 'image/jpeg' : 'image/png';
      out.toBlob(function (b) {
        if (b) triggerDownload(b, 'qr-code.' + (o.format === 'jpeg' ? 'jpg' : 'png'));
      }, mime, 0.95);
    });

    function triggerDownload(blob, filename) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }

    function ready() {
      loadingEl.style.display = 'none';
      render();
    }

    if (window.QRCode) {
      ready();
    } else if (window.TGImageUtil) {
      TGImageUtil.loadScript(QRCODE_CDN).then(ready).catch(function () {
        loadingEl.textContent = 'Could not load the QR library. Please check your connection and refresh.';
      });
    } else {
      loadingEl.textContent = 'QR library not available. Please refresh the page.';
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init: init, CONFIG: CONFIG };
})();

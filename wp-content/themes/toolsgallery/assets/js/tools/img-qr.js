/**
 * ToolsGallery — QR Code Generator
 * Handler: img-qr
 * URL: /tool/qr-code-generator/
 * Input type: data (no file upload)
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-qr', inputType: 'data' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;align-items:flex-start">' +
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
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iqr-bg">Background</label>' +
      '<input type="color" id="iqr-bg" value="#ffffff">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iqr-margin">Margin: <span id="iqr-margin-val">4</span> modules</label>' +
      '<input type="range" id="iqr-margin" min="0" max="10" value="4" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iqr-format">Download Format</label>' +
      '<select id="iqr-format" class="tg-select">' +
        '<option value="png">PNG</option>' +
        '<option value="jpeg">JPEG</option>' +
      '</select>' +
    '</div>' +
    '<div id="iqr-preview-wrap" style="margin-top:12px;display:none;text-align:center">' +
      '<div id="iqr-preview-inner" style="display:inline-block;border:1px solid #ddd;border-radius:4px;padding:8px;background:#fff"></div>' +
    '</div>';
  }

  function wireOptions(container) {
    function link(id, vid) {
      var s = container.querySelector('#' + id);
      var v = container.querySelector('#' + vid);
      if (s && v) s.addEventListener('input', function () { v.textContent = s.value; });
    }
    link('iqr-size', 'iqr-size-val');
    link('iqr-margin', 'iqr-margin-val');
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var text = optionsEl.querySelector('#iqr-text');
    var size = optionsEl.querySelector('#iqr-size');
    var ec = optionsEl.querySelector('#iqr-ec');
    var fg = optionsEl.querySelector('#iqr-fg');
    var bg = optionsEl.querySelector('#iqr-bg');
    var margin = optionsEl.querySelector('#iqr-margin');
    var format = optionsEl.querySelector('#iqr-format');
    return {
      text: text ? text.value.trim() : 'https://example.com',
      size: size ? parseInt(size.value) : 300,
      errorCorrectionLevel: ec ? ec.value : 'M',
      colorDark: fg ? fg.value : '#000000',
      colorLight: bg ? bg.value : '#ffffff',
      margin: margin ? parseInt(margin.value) : 4,
      format: format ? format.value : 'png',
    };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Generating QR code...');

    if (!options.text) throw new Error('Please enter text or a URL.');
    if (!window.QRCode) throw new Error('QRCode.js not loaded');

    // Create a temporary container for QRCode.js
    var tmpDiv = document.createElement('div');
    tmpDiv.style.position = 'absolute';
    tmpDiv.style.left = '-9999px';
    document.body.appendChild(tmpDiv);

    try {
      new QRCode(tmpDiv, {
        text: options.text,
        width: options.size,
        height: options.size,
        colorDark: options.colorDark,
        colorLight: options.colorLight,
        correctLevel: QRCode.CorrectLevel[options.errorCorrectionLevel] || QRCode.CorrectLevel.M,
      });

      // QRCode.js renders a canvas or img inside tmpDiv
      await new Promise(function (res) { setTimeout(res, 80); });

      var srcCanvas = tmpDiv.querySelector('canvas');
      var srcImg = tmpDiv.querySelector('img');

      var outCanvas = document.createElement('canvas');
      var margin = options.margin * Math.round(options.size / 25);
      outCanvas.width = options.size + margin * 2;
      outCanvas.height = options.size + margin * 2;
      var ctx = outCanvas.getContext('2d');
      ctx.fillStyle = options.colorLight;
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

      if (srcCanvas) {
        ctx.drawImage(srcCanvas, margin, margin, options.size, options.size);
      } else if (srcImg) {
        await new Promise(function (res, rej) {
          if (srcImg.complete) { ctx.drawImage(srcImg, margin, margin, options.size, options.size); res(); return; }
          srcImg.onload = function () { ctx.drawImage(srcImg, margin, margin, options.size, options.size); res(); };
          srcImg.onerror = rej;
        });
      } else {
        throw new Error('QR render failed — no canvas or image found.');
      }

      // Preview
      var previewInner = document.getElementById('iqr-preview-inner');
      var previewWrap = document.getElementById('iqr-preview-wrap');
      if (previewInner && previewWrap) {
        var maxW = 250; var sc = Math.min(1, maxW / outCanvas.width);
        var prev = document.createElement('canvas');
        prev.width = Math.round(outCanvas.width * sc);
        prev.height = Math.round(outCanvas.height * sc);
        prev.getContext('2d').drawImage(outCanvas, 0, 0, prev.width, prev.height);
        prev.style.display = 'block';
        previewInner.innerHTML = '';
        previewInner.appendChild(prev);
        previewWrap.style.display = 'block';
      }

      var mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
      var quality = options.format === 'jpeg' ? 0.92 : undefined;
      var blob = await new Promise(function (res) { outCanvas.toBlob(function (b) { res(b); }, mime, quality); });
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: 'qr-code.' + options.format };
    } finally {
      document.body.removeChild(tmpDiv);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

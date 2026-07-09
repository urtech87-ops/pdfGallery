/**
 * ToolsGallery — Meme Generator
 * Handler: img-meme
 * URL: /tool/meme-generator/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-meme' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-top">Top Text</label>' +
      '<input type="text" id="imm-top" class="tg-text-input" value="TOP TEXT" placeholder="Top caption">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-bot">Bottom Text</label>' +
      '<input type="text" id="imm-bot" class="tg-text-input" value="BOTTOM TEXT" placeholder="Bottom caption">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-font">Font</label>' +
      '<select id="imm-font" class="tg-select">' +
        '<option value="Impact">Impact</option>' +
        '<option value="Arial">Arial</option>' +
        '<option value="Comic Sans MS">Comic Sans</option>' +
        '<option value="Georgia">Georgia</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-size">Font Size: <span id="imm-size-val">10</span>%</label>' +
      '<input type="range" id="imm-size" min="4" max="20" value="10" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-color">Text Color</label>' +
      '<input type="color" id="imm-color" value="#ffffff">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-stroke">Outline Color</label>' +
      '<input type="color" id="imm-stroke" value="#000000">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="imm-stroke-w">Outline Width: <span id="imm-stroke-w-val">3</span>px</label>' +
      '<input type="range" id="imm-stroke-w" min="0" max="12" value="3" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Text Style</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="imm-case" value="upper" checked> UPPERCASE</label>' +
        '<label><input type="radio" name="imm-case" value="original"> As typed</label>' +
      '</div>' +
    '</div>' +
    '<div id="imm-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="imm-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    function link(id, vid, suf) {
      var s = container.querySelector('#' + id);
      var v = container.querySelector('#' + vid);
      if (s && v) s.addEventListener('input', function () { v.textContent = s.value + (suf || ''); });
    }
    link('imm-size', 'imm-size-val', '%');
    link('imm-stroke-w', 'imm-stroke-w-val', 'px');
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var top = optionsEl.querySelector('#imm-top');
    var bot = optionsEl.querySelector('#imm-bot');
    var font = optionsEl.querySelector('#imm-font');
    var size = optionsEl.querySelector('#imm-size');
    var color = optionsEl.querySelector('#imm-color');
    var stroke = optionsEl.querySelector('#imm-stroke');
    var strokeW = optionsEl.querySelector('#imm-stroke-w');
    var textCase = optionsEl.querySelector('input[name="imm-case"]:checked');
    return {
      topText: top ? top.value : 'TOP TEXT',
      botText: bot ? bot.value : 'BOTTOM TEXT',
      font: font ? font.value : 'Impact',
      sizePct: size ? parseInt(size.value) : 10,
      color: color ? color.value : '#ffffff',
      strokeColor: stroke ? stroke.value : '#000000',
      strokeWidth: strokeW ? parseInt(strokeW.value) : 3,
      textCase: textCase ? textCase.value : 'upper',
    };
  }

  function drawMemeText(ctx, text, x, y, maxWidth, fontSize, options) {
    ctx.font = 'bold ' + fontSize + 'px ' + options.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';

    if (options.strokeWidth > 0) {
      ctx.strokeStyle = options.strokeColor;
      ctx.lineWidth = options.strokeWidth * 2;
      ctx.strokeText(text, x, y, maxWidth);
    }
    ctx.fillStyle = options.color;
    ctx.fillText(text, x, y, maxWidth);
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        var topText = options.topText || '';
        var botText = options.botText || '';
        if (options.textCase === 'upper') {
          topText = topText.toUpperCase();
          botText = botText.toUpperCase();
        }

        var fontSize = Math.round(img.height * options.sizePct / 100);
        var padY = Math.round(fontSize * 0.3);
        var cx = img.width / 2;
        var maxWidth = img.width * 0.9;

        if (topText) {
          drawMemeText(ctx, topText, cx, padY, maxWidth, fontSize, options);
        }
        if (botText) {
          var botY = img.height - fontSize - padY;
          drawMemeText(ctx, botText, cx, botY, maxWidth, fontSize, options);
        }

        // Preview
        var previewEl = document.getElementById('imm-preview');
        var previewWrap = document.getElementById('imm-preview-wrap');
        if (previewEl && previewWrap) {
          var maxW = 500; var sc = Math.min(1, maxW / canvas.width);
          previewEl.width = Math.round(canvas.width * sc);
          previewEl.height = Math.round(canvas.height * sc);
          previewEl.getContext('2d').drawImage(canvas, 0, 0, previewEl.width, previewEl.height);
          previewWrap.style.display = 'block';
        }

        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed to create meme')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: 'meme.jpg' });
        }, 'image/jpeg', 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Flip Image
 * Handler: img-flip
 * URL: /tool/flip-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-flip' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:10px">' +
      '<label class="tg-opt-label">Flip Direction</label>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary tg-flip-btn tg-flip-btn--active" data-flip="h">Flip Horizontal</button>' +
        '<button type="button" class="tg-btn-secondary tg-flip-btn" data-flip="v">Flip Vertical</button>' +
        '<button type="button" class="tg-btn-secondary tg-flip-btn" data-flip="both">Both</button>' +
      '</div>' +
    '</div>' +
    '<div id="if-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="if-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'var btns=document.querySelectorAll(".tg-flip-btn");' +
      'btns.forEach(function(b){b.addEventListener("click",function(){' +
        'btns.forEach(function(x){x.classList.remove("tg-flip-btn--active");});' +
        'b.classList.add("tg-flip-btn--active");' +
        'if(window._ifUpdatePreview)window._ifUpdatePreview(b.dataset.flip);' +
      '});});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { flip: 'h' };
    var active = optionsEl.querySelector('.tg-flip-btn--active');
    return { flip: active ? active.dataset.flip : 'h' };
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

        var flipH = options.flip === 'h' || options.flip === 'both';
        var flipV = options.flip === 'v' || options.flip === 'both';

        ctx.save();
        ctx.translate(flipH ? img.width : 0, flipV ? img.height : 0);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // Update preview
        var preview = document.getElementById('if-preview');
        var previewWrap = document.getElementById('if-preview-wrap');
        if (preview && previewWrap) {
          var maxW = 400;
          var scale = Math.min(1, maxW / img.width);
          preview.width = Math.round(img.width * scale);
          preview.height = Math.round(img.height * scale);
          var pCtx = preview.getContext('2d');
          pCtx.drawImage(canvas, 0, 0, preview.width, preview.height);
          previewWrap.style.display = 'block';
        }

        window._ifUpdatePreview = function (flipDir) {
          var c2 = document.createElement('canvas');
          c2.width = img.width; c2.height = img.height;
          var c2x = c2.getContext('2d');
          var fH = flipDir === 'h' || flipDir === 'both';
          var fV = flipDir === 'v' || flipDir === 'both';
          c2x.save();
          c2x.translate(fH ? img.width : 0, fV ? img.height : 0);
          c2x.scale(fH ? -1 : 1, fV ? -1 : 1);
          c2x.drawImage(img, 0, 0);
          c2x.restore();
          if (preview) {
            var pC = preview.getContext('2d');
            pC.drawImage(c2, 0, 0, preview.width, preview.height);
          }
        };

        var ext = file.name.match(/\.[^.]+$/) ? file.name.match(/\.[^.]+$/)[0] : '.jpg';
        var mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        var base = file.name.replace(/\.[^.]+$/, '');

        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed to create image')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-flipped' + ext });
        }, mime, 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

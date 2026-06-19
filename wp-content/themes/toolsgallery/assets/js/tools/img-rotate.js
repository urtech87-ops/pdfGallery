/**
 * ToolsGallery — Rotate Image
 * Handler: img-rotate
 * URL: /tool/rotate-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-rotate' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:10px">' +
      '<label class="tg-opt-label">Quick Rotate</label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary" id="ir-left90">90° Left</button>' +
        '<button type="button" class="tg-btn-secondary" id="ir-right90">90° Right</button>' +
        '<button type="button" class="tg-btn-secondary" id="ir-180">180°</button>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ir-angle">Custom Angle: <span id="ir-angle-val">0</span>°</label>' +
      '<input type="range" id="ir-angle" min="-180" max="180" value="0" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ir-bg">Background</label>' +
      '<select id="ir-bg" class="tg-select">' +
        '<option value="transparent">Transparent</option>' +
        '<option value="#ffffff" selected>White</option>' +
        '<option value="#000000">Black</option>' +
        '<option value="custom">Custom color...</option>' +
      '</select>' +
    '</div>' +
    '<div id="ir-bg-custom-wrap" hidden style="margin-top:6px">' +
      '<input type="color" id="ir-bg-custom" value="#ffffff">' +
    '</div>' +
    '<div id="ir-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="ir-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'var ang=document.getElementById("ir-angle"),angV=document.getElementById("ir-angle-val");' +
      'if(ang&&angV)ang.addEventListener("input",function(){angV.textContent=ang.value;if(window._irUpdate)window._irUpdate(parseInt(ang.value));});' +
      'document.getElementById("ir-left90") && document.getElementById("ir-left90").addEventListener("click",function(){if(ang){var v=((parseInt(ang.value)-90)+360)%360;if(v>180)v-=360;ang.value=v;angV.textContent=v;if(window._irUpdate)window._irUpdate(v);}});' +
      'document.getElementById("ir-right90") && document.getElementById("ir-right90").addEventListener("click",function(){if(ang){var v=((parseInt(ang.value)+90)+360)%360;if(v>180)v-=360;ang.value=v;angV.textContent=v;if(window._irUpdate)window._irUpdate(v);}});' +
      'document.getElementById("ir-180") && document.getElementById("ir-180").addEventListener("click",function(){if(ang){ang.value=180;angV.textContent=180;if(window._irUpdate)window._irUpdate(180);}});' +
      'var bgSel=document.getElementById("ir-bg"),bgCW=document.getElementById("ir-bg-custom-wrap");' +
      'if(bgSel&&bgCW)bgSel.addEventListener("change",function(){bgCW.hidden=bgSel.value!=="custom";});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var ang = optionsEl.querySelector('#ir-angle');
    var bg = optionsEl.querySelector('#ir-bg');
    var bgC = optionsEl.querySelector('#ir-bg-custom');
    var bgVal = bg ? bg.value : '#ffffff';
    if (bgVal === 'custom') bgVal = bgC ? bgC.value : '#ffffff';
    return {
      angle: ang ? parseInt(ang.value) : 0,
      background: bgVal,
    };
  }

  function rotateCanvas(img, degrees, bgColor) {
    var rad = degrees * Math.PI / 180;
    var cos = Math.abs(Math.cos(rad));
    var sin = Math.abs(Math.sin(rad));
    var w = Math.round(img.width * cos + img.height * sin);
    var h = Math.round(img.width * sin + img.height * cos);

    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');

    if (bgColor && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.translate(w / 2, h / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    return canvas;
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var angle = options.angle || 0;
        var canvas = rotateCanvas(img, angle, options.background);

        // Setup live preview
        var preview = document.getElementById('ir-preview');
        var previewWrap = document.getElementById('ir-preview-wrap');
        if (preview && previewWrap) {
          var maxW = 300;
          var sc = Math.min(1, maxW / canvas.width);
          preview.width = Math.round(canvas.width * sc);
          preview.height = Math.round(canvas.height * sc);
          preview.getContext('2d').drawImage(canvas, 0, 0, preview.width, preview.height);
          previewWrap.style.display = 'block';
        }

        window._irUpdate = function (deg) {
          var c2 = rotateCanvas(img, deg, options.background);
          if (preview) {
            var sc2 = Math.min(1, 300 / c2.width);
            preview.width = Math.round(c2.width * sc2);
            preview.height = Math.round(c2.height * sc2);
            preview.getContext('2d').drawImage(c2, 0, 0, preview.width, preview.height);
          }
        };

        var usePng = options.background === 'transparent' || file.type === 'image/png';
        var mime = usePng ? 'image/png' : 'image/jpeg';
        var ext = usePng ? '.png' : '.jpg';
        var base = file.name.replace(/\.[^.]+$/, '');

        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed to create image')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-rotated' + ext });
        }, mime, 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

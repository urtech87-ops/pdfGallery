/**
 * ToolsGallery — Make Round Image
 * Handler: img-round
 * URL: /tool/round-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-round' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Shape</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ird-shape" value="circle" checked> Circle</label>' +
        '<label><input type="radio" name="ird-shape" value="rounded"> Rounded Rectangle</label>' +
      '</div>' +
    '</div>' +
    '<div id="ird-radius-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ird-radius">Corner Radius: <span id="ird-radius-val">20</span>%</label>' +
      '<input type="range" id="ird-radius" min="1" max="50" value="20" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Background</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ird-bg" value="transparent" checked> Transparent</label>' +
        '<label><input type="radio" name="ird-bg" value="white"> White</label>' +
        '<label><input type="radio" name="ird-bg" value="custom"> Custom</label>' +
      '</div>' +
    '</div>' +
    '<div id="ird-bg-custom-wrap" hidden class="tg-opt-row">' +
      '<input type="color" id="ird-bg-color" value="#ffffff">' +
    '</div>' +
    '<div id="ird-preview-wrap" style="margin-top:12px;display:none;text-align:center">' +
      '<canvas id="ird-preview" style="max-width:300px;border-radius:50%"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'document.querySelectorAll("input[name=\'ird-shape\']").forEach(function(r){r.addEventListener("change",function(){var w=document.getElementById("ird-radius-wrap");if(w)w.hidden=r.value!=="rounded";});});' +
      'document.querySelectorAll("input[name=\'ird-bg\']").forEach(function(r){r.addEventListener("change",function(){var w=document.getElementById("ird-bg-custom-wrap");if(w)w.hidden=r.value!=="custom";});});' +
      'var sl=document.getElementById("ird-radius"),sv=document.getElementById("ird-radius-val");' +
      'if(sl&&sv)sl.addEventListener("input",function(){sv.textContent=sl.value;});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var shape = optionsEl.querySelector('input[name="ird-shape"]:checked');
    var radius = optionsEl.querySelector('#ird-radius');
    var bg = optionsEl.querySelector('input[name="ird-bg"]:checked');
    var bgColor = optionsEl.querySelector('#ird-bg-color');
    var bgVal = bg ? bg.value : 'transparent';
    if (bgVal === 'custom') bgVal = bgColor ? bgColor.value : '#ffffff';
    else if (bgVal === 'white') bgVal = '#ffffff';
    return {
      shape: shape ? shape.value : 'circle',
      radius: radius ? parseInt(radius.value) / 100 : 0.2,
      background: bgVal,
    };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);

        // Make square by cropping center
        var size = Math.min(img.width, img.height);
        var sx = (img.width - size) / 2, sy = (img.height - size) / 2;

        var canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        var ctx = canvas.getContext('2d');

        if (options.background && options.background !== 'transparent') {
          ctx.fillStyle = options.background;
          ctx.fillRect(0, 0, size, size);
        }

        ctx.save();
        if (options.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
          ctx.clip();
        } else {
          var r = Math.round(size * options.radius);
          ctx.beginPath();
          ctx.moveTo(r, 0); ctx.lineTo(size-r, 0); ctx.arcTo(size, 0, size, r, r);
          ctx.lineTo(size, size-r); ctx.arcTo(size, size, size-r, size, r);
          ctx.lineTo(r, size); ctx.arcTo(0, size, 0, size-r, r);
          ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r);
          ctx.closePath(); ctx.clip();
        }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        ctx.restore();

        // Preview
        var previewEl = document.getElementById('ird-preview');
        var previewWrap = document.getElementById('ird-preview-wrap');
        if (previewEl && previewWrap) {
          var maxW = 200; var sc = Math.min(1, maxW / size);
          previewEl.width = Math.round(size*sc); previewEl.height = Math.round(size*sc);
          previewEl.getContext('2d').drawImage(canvas, 0, 0, previewEl.width, previewEl.height);
          previewEl.style.borderRadius = options.shape === 'circle' ? '50%' : Math.round(options.radius * 50) + '%';
          previewWrap.style.display = 'block';
        }

        var base = file.name.replace(/\.[^.]+$/, '');
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-round.png' });
        }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Upscale Image
 * Handler: img-upscale
 * URL: /tool/upscale-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-upscale' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column">' +
      '<label class="tg-opt-label">Scale Factor</label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" class="tg-btn-secondary iu-scale-btn iu-scale-btn--active" data-scale="2">2x</button>' +
        '<button type="button" class="tg-btn-secondary iu-scale-btn" data-scale="3">3x</button>' +
        '<button type="button" class="tg-btn-secondary iu-scale-btn" data-scale="4">4x</button>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iu-quality">JPEG Quality: <span id="iu-quality-val">95</span>%</label>' +
      '<input type="range" id="iu-quality" min="50" max="100" value="95" style="flex:1">' +
    '</div>' +
    '<p class="tg-opt-info">Note: Browser upscaling uses bicubic interpolation. Results are best for 2x. For AI-based super-resolution, a server-side API is required.</p>' +
    '<div id="iu-info" style="margin-top:8px"></div>' +
    '<script>(function(){' +
      'var btns=document.querySelectorAll(".iu-scale-btn");' +
      'btns.forEach(function(b){b.addEventListener("click",function(){' +
        'btns.forEach(function(x){x.classList.remove("iu-scale-btn--active");});' +
        'b.classList.add("iu-scale-btn--active");' +
      '});});' +
      'var sl=document.getElementById("iu-quality"),sv=document.getElementById("iu-quality-val");' +
      'if(sl&&sv)sl.addEventListener("input",function(){sv.textContent=sl.value;});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var active = optionsEl.querySelector('.iu-scale-btn--active');
    var quality = optionsEl.querySelector('#iu-quality');
    return {
      scale: active ? parseInt(active.dataset.scale) : 2,
      quality: quality ? parseInt(quality.value) / 100 : 0.95,
    };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var scale = options.scale || 2;
        var nw = img.width * scale, nh = img.height * scale;

        onProgress && onProgress(0.3, 'Upscaling ' + img.width + 'x' + img.height + ' → ' + nw + 'x' + nh + '...');

        var infoEl = document.getElementById('iu-info');
        if (infoEl) infoEl.innerHTML = '<p class="tg-opt-info">Upscaling from <strong>' + img.width + '×' + img.height + '</strong> to <strong>' + nw + '×' + nh + '</strong></p>';

        var canvas = document.createElement('canvas');
        canvas.width = nw; canvas.height = nh;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, nw, nh);

        var ext = file.name.match(/\.[^.]+$/) ? file.name.match(/\.[^.]+$/)[0] : '.jpg';
        var mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        var base = file.name.replace(/\.[^.]+$/, '');

        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: base + '-' + scale + 'x' + ext });
        }, mime, options.quality || 0.95);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

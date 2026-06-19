/**
 * ToolsGallery — Combine Images
 * Handler: img-combine
 * URL: /tool/combine-images/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-combine' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Layout</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="icm-layout" value="horizontal" checked> Horizontal</label>' +
        '<label><input type="radio" name="icm-layout" value="vertical"> Vertical</label>' +
        '<label><input type="radio" name="icm-layout" value="grid"> Grid</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icm-gap">Gap: <span id="icm-gap-val">10</span>px</label>' +
      '<input type="range" id="icm-gap" min="0" max="50" value="10" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icm-bg">Background Color</label>' +
      '<input type="color" id="icm-bg" value="#ffffff">' +
    '</div>' +
    '<div id="icm-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="icm-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'var sl=document.getElementById("icm-gap"),sv=document.getElementById("icm-gap-val");' +
      'if(sl&&sv)sl.addEventListener("input",function(){sv.textContent=sl.value;});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var layout = optionsEl.querySelector('input[name="icm-layout"]:checked');
    var gap = optionsEl.querySelector('#icm-gap');
    var bg = optionsEl.querySelector('#icm-bg');
    return {
      layout: layout ? layout.value : 'horizontal',
      gap: gap ? parseInt(gap.value) : 10,
      background: bg ? bg.value : '#ffffff',
    };
  }

  async function loadImages(files) {
    return Promise.all(Array.from(files).map(function (file) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        var url = URL.createObjectURL(file);
        img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load ' + file.name)); };
        img.src = url;
      });
    }));
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading images...');

    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];

    if (files.length < 2) throw new Error('Please upload at least 2 images to combine.');

    var images = await loadImages(files);
    onProgress && onProgress(0.4, 'Compositing...');

    var gap = options.gap || 0;
    var layout = options.layout || 'horizontal';
    var canvas = document.createElement('canvas');
    var ctx;

    if (layout === 'horizontal') {
      var totalW = images.reduce(function (s, i) { return s + i.width; }, 0) + gap * (images.length - 1);
      var maxH = Math.max.apply(null, images.map(function (i) { return i.height; }));
      canvas.width = totalW; canvas.height = maxH;
      ctx = canvas.getContext('2d');
      ctx.fillStyle = options.background || '#ffffff'; ctx.fillRect(0, 0, totalW, maxH);
      var x = 0;
      images.forEach(function (img) {
        ctx.drawImage(img, x, Math.round((maxH - img.height) / 2));
        x += img.width + gap;
      });
    } else if (layout === 'vertical') {
      var maxW2 = Math.max.apply(null, images.map(function (i) { return i.width; }));
      var totalH = images.reduce(function (s, i) { return s + i.height; }, 0) + gap * (images.length - 1);
      canvas.width = maxW2; canvas.height = totalH;
      ctx = canvas.getContext('2d');
      ctx.fillStyle = options.background || '#ffffff'; ctx.fillRect(0, 0, maxW2, totalH);
      var y = 0;
      images.forEach(function (img) {
        ctx.drawImage(img, Math.round((maxW2 - img.width) / 2), y);
        y += img.height + gap;
      });
    } else {
      // Grid
      var cols = Math.ceil(Math.sqrt(images.length));
      var rows = Math.ceil(images.length / cols);
      var cellW = Math.max.apply(null, images.map(function (i) { return i.width; }));
      var cellH = Math.max.apply(null, images.map(function (i) { return i.height; }));
      canvas.width = cols * cellW + (cols - 1) * gap;
      canvas.height = rows * cellH + (rows - 1) * gap;
      ctx = canvas.getContext('2d');
      ctx.fillStyle = options.background || '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      images.forEach(function (img, idx) {
        var col = idx % cols, row = Math.floor(idx / cols);
        ctx.drawImage(img, col * (cellW + gap), row * (cellH + gap));
      });
    }

    // Show preview
    var previewEl = document.getElementById('icm-preview');
    var previewWrap = document.getElementById('icm-preview-wrap');
    if (previewEl && previewWrap) {
      var maxPreviewW = 500; var sc = Math.min(1, maxPreviewW / canvas.width);
      previewEl.width = Math.round(canvas.width * sc); previewEl.height = Math.round(canvas.height * sc);
      previewEl.getContext('2d').drawImage(canvas, 0, 0, previewEl.width, previewEl.height);
      previewWrap.style.display = 'block';
    }

    var blob = await new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/jpeg', 0.92); });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: 'combined.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

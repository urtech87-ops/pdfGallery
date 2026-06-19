/**
 * ToolsGallery — Collage Maker
 * Handler: img-collage
 * URL: /tool/collage-maker/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-collage' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Canvas Size</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="icl-size" value="square" checked> Square (1080×1080)</label>' +
        '<label><input type="radio" name="icl-size" value="portrait"> Portrait (1080×1350)</label>' +
        '<label><input type="radio" name="icl-size" value="landscape"> Landscape (1920×1080)</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icl-gap">Gap: <span id="icl-gap-val">8</span>px</label>' +
      '<input type="range" id="icl-gap" min="0" max="20" value="8" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icl-bg">Background</label>' +
      '<input type="color" id="icl-bg" value="#ffffff">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icl-radius">Photo Radius: <span id="icl-radius-val">4</span>px</label>' +
      '<input type="range" id="icl-radius" min="0" max="40" value="4" style="flex:1">' +
    '</div>' +
    '<div id="icl-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="icl-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'function link(id,vid){var s=document.getElementById(id),v=document.getElementById(vid);if(s&&v)s.addEventListener("input",function(){v.textContent=s.value;});}' +
      'link("icl-gap","icl-gap-val");link("icl-radius","icl-radius-val");' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var size = optionsEl.querySelector('input[name="icl-size"]:checked');
    var gap = optionsEl.querySelector('#icl-gap');
    var bg = optionsEl.querySelector('#icl-bg');
    var radius = optionsEl.querySelector('#icl-radius');
    return {
      size: size ? size.value : 'square',
      gap: gap ? parseInt(gap.value) : 8,
      background: bg ? bg.value : '#ffffff',
      radius: radius ? parseInt(radius.value) : 4,
    };
  }

  var SIZE_MAP = { square: [1080,1080], portrait: [1080,1350], landscape: [1920,1080] };

  // Layout templates based on photo count
  function getLayout(count, cw, ch, gap) {
    var g = gap;
    if (count === 1) return [{ x: g, y: g, w: cw-g*2, h: ch-g*2 }];
    if (count === 2) {
      var hw = (cw - g*3) / 2;
      return [
        { x: g, y: g, w: hw, h: ch-g*2 },
        { x: g*2+hw, y: g, w: hw, h: ch-g*2 },
      ];
    }
    if (count === 3) {
      var hw2 = (cw - g*3) / 2;
      var lh = ch - g*3;
      return [
        { x: g, y: g, w: hw2, h: lh },
        { x: g*2+hw2, y: g, w: hw2, h: (lh-g)/2 },
        { x: g*2+hw2, y: g+(lh-g)/2+g, w: hw2, h: (lh-g)/2 },
      ];
    }
    if (count === 4) {
      var hw3 = (cw-g*3)/2, hh = (ch-g*3)/2;
      return [
        { x: g, y: g, w: hw3, h: hh },
        { x: g*2+hw3, y: g, w: hw3, h: hh },
        { x: g, y: g*2+hh, w: hw3, h: hh },
        { x: g*2+hw3, y: g*2+hh, w: hw3, h: hh },
      ];
    }
    // 5+: grid
    var cols = Math.ceil(Math.sqrt(count));
    var rows = Math.ceil(count / cols);
    var cWd = (cw - g*(cols+1)) / cols;
    var cHt = (ch - g*(rows+1)) / rows;
    var cells = [];
    for (var i = 0; i < count; i++) {
      var col = i % cols, row = Math.floor(i / cols);
      cells.push({ x: g + col*(cWd+g), y: g + row*(cHt+g), w: cWd, h: cHt });
    }
    return cells;
  }

  function drawRoundedClip(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading images...');
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    if (files.length < 2) throw new Error('Please upload at least 2 images for the collage.');

    var count = Math.min(9, files.length);
    var dims = SIZE_MAP[options.size] || [1080, 1080];
    var cw = dims[0], ch = dims[1], gap = options.gap;
    var layout = getLayout(count, cw, ch, gap);

    var images = await Promise.all(files.slice(0, count).map(function (f) {
      return new Promise(function (resolve, reject) {
        var img = new Image(); var url = URL.createObjectURL(f);
        img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load ' + f.name)); };
        img.src = url;
      });
    }));

    onProgress && onProgress(0.5, 'Building collage...');
    var canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = options.background || '#ffffff'; ctx.fillRect(0, 0, cw, ch);

    images.forEach(function (img, i) {
      var cell = layout[i];
      if (!cell) return;
      var r = Math.min(options.radius || 0, cell.w/2, cell.h/2);
      ctx.save();
      drawRoundedClip(ctx, cell.x, cell.y, cell.w, cell.h, r);
      ctx.clip();
      // Cover fit
      var scale = Math.max(cell.w / img.width, cell.h / img.height);
      var sw = img.width * scale, sh = img.height * scale;
      var sx = cell.x + (cell.w - sw) / 2, sy = cell.y + (cell.h - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);
      ctx.restore();
    });

    // Preview
    var previewEl = document.getElementById('icl-preview');
    var previewWrap = document.getElementById('icl-preview-wrap');
    if (previewEl && previewWrap) {
      var maxPreviewW = 500; var sc = Math.min(1, maxPreviewW / cw);
      previewEl.width = Math.round(cw*sc); previewEl.height = Math.round(ch*sc);
      previewEl.getContext('2d').drawImage(canvas, 0, 0, previewEl.width, previewEl.height);
      previewWrap.style.display = 'block';
    }

    var blob = await new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/jpeg', 0.92); });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: 'collage.jpg' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

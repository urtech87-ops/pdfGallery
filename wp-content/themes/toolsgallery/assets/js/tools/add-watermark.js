/**
 * ============================================================
 * ToolsGallery — Add Watermark Tool
 * ============================================================
 * Handler key: add-watermark
 * Tool URL: /tool/add-watermark/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-lib (PDFLib)
 * ============================================================
 */
(function () {
  'use strict';

  var SF_MAP = {
    'Helvetica':   'Helvetica',
    'Times Roman': 'TimesRoman',
    'Courier':     'Courier',
  };

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    };
  }

  function getTargetIndices(opts, total) {
    var idxs = [];
    if (opts.pages === 'first') { return [0]; }
    if (opts.pages === 'custom' && opts.pageRange) {
      opts.pageRange.split(',').forEach(function (part) {
        var m = part.trim().match(/^(\d+)-(\d+)$/);
        if (m) {
          for (var p = parseInt(m[1]); p <= parseInt(m[2]); p++) {
            if (p >= 1 && p <= total) idxs.push(p - 1);
          }
        } else {
          var n = parseInt(part);
          if (n >= 1 && n <= total) idxs.push(n - 1);
        }
      });
      return idxs;
    }
    for (var i = 0; i < total; i++) idxs.push(i);
    return idxs;
  }

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;

    onProgress(20, 'Loading PDF…');
    var ab  = await files[0].arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    var allPages = doc.getPages();
    var total    = allPages.length;
    var targets  = getTargetIndices(options, total);

    if (options.type === 'text') {
      var sfName  = SF_MAP[options.font] || 'Helvetica';
      var font    = await doc.embedFont(PDFLib.StandardFonts[sfName]);
      var c       = hexToRgb(options.color || '#FF0000');
      var opacity = (options.opacity || 30) / 100;
      var fontSize= options.fontSize || 48;
      var rotation= options.rotation !== undefined ? options.rotation : -45;
      var text    = options.text || '';

      for (var ti = 0; ti < targets.length; ti++) {
        onProgress(20 + Math.round((ti / targets.length) * 70), 'Adding watermark to page ' + (ti + 1) + '…');
        var pg = allPages[targets[ti]];
        var sz = pg.getSize();
        var tw = font.widthOfTextAtSize(text, fontSize);

        if (options.position === 'diagonal') {
          var stepX = tw * 1.6, stepY = fontSize * 3;
          for (var tx = -sz.width; tx < sz.width * 2; tx += stepX) {
            for (var ty = -sz.height; ty < sz.height * 2; ty += stepY) {
              pg.drawText(text, { x: tx, y: ty, size: fontSize, font: font, color: PDFLib.rgb(c.r, c.g, c.b), opacity: opacity, rotate: PDFLib.degrees(rotation) });
            }
          }
        } else {
          var posMap = {
            'top-left':      { x: 30,                   y: sz.height - fontSize - 30 },
            'top-center':    { x: (sz.width - tw) / 2,  y: sz.height - fontSize - 30 },
            'top-right':     { x: sz.width - tw - 30,   y: sz.height - fontSize - 30 },
            'middle-left':   { x: 30,                   y: (sz.height - fontSize) / 2 },
            'center':        { x: (sz.width - tw) / 2,  y: (sz.height - fontSize) / 2 },
            'middle-right':  { x: sz.width - tw - 30,   y: (sz.height - fontSize) / 2 },
            'bottom-left':   { x: 30,                   y: 30 },
            'bottom-center': { x: (sz.width - tw) / 2,  y: 30 },
            'bottom-right':  { x: sz.width - tw - 30,   y: 30 },
          };
          var pos = posMap[options.position || 'center'] || posMap['center'];
          pg.drawText(text, { x: pos.x, y: pos.y, size: fontSize, font: font, color: PDFLib.rgb(c.r, c.g, c.b), opacity: opacity, rotate: PDFLib.degrees(rotation) });
        }
      }
    } else if (options.type === 'image') {
      if (!options.imageFile) { onError('Please select a watermark image.'); return; }
      var imgAb   = await options.imageFile.arrayBuffer();
      var imgBytes = new Uint8Array(imgAb);
      var embImg  = options.imageFile.name.toLowerCase().endsWith('.png') ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
      var imgOpacity = (options.opacity || 30) / 100;

      for (var ii = 0; ii < targets.length; ii++) {
        onProgress(20 + Math.round((ii / targets.length) * 70), 'Adding watermark to page ' + (ii + 1) + '…');
        var pg2  = allPages[targets[ii]];
        var sz2  = pg2.getSize();
        var imgScale = (options.scale || 50) / 100;
        var imgW = sz2.width * imgScale;
        var imgH = (embImg.height / embImg.width) * imgW;
        var posMap2 = {
          'top-left':      { x: 30,                       y: sz2.height - imgH - 30 },
          'top-center':    { x: (sz2.width - imgW) / 2,  y: sz2.height - imgH - 30 },
          'top-right':     { x: sz2.width - imgW - 30,   y: sz2.height - imgH - 30 },
          'middle-left':   { x: 30,                       y: (sz2.height - imgH) / 2 },
          'center':        { x: (sz2.width - imgW) / 2,  y: (sz2.height - imgH) / 2 },
          'middle-right':  { x: sz2.width - imgW - 30,   y: (sz2.height - imgH) / 2 },
          'bottom-left':   { x: 30,                       y: 30 },
          'bottom-center': { x: (sz2.width - imgW) / 2,  y: 30 },
          'bottom-right':  { x: sz2.width - imgW - 30,   y: 30 },
        };
        var pos2 = posMap2[options.position || 'center'] || posMap2['center'];
        pg2.drawImage(embImg, { x: pos2.x, y: pos2.y, width: imgW, height: imgH, opacity: imgOpacity });
      }
    }

    onProgress(95, 'Saving PDF…');
    var bytes = await doc.save();
    onSuccess(new Blob([bytes], { type: 'application/pdf' }), 'watermarked.pdf');
  }

  function getOptionsHTML() {
    return '<div class="tg-tab-group" style="margin-bottom:12px">' +
        '<button type="button" class="tg-tab-btn tg-tab-btn--active" data-tab="wm-text">Text Watermark</button>' +
        '<button type="button" class="tg-tab-btn" data-tab="wm-image">Image Watermark</button>' +
      '</div>' +
      '<div id="wm-text" class="tg-tab-pane">' +
        '<label class="tg-opt-label">Watermark Text</label>' +
        '<input type="text" id="wm-text-input" class="tg-text-input" placeholder="e.g. CONFIDENTIAL">' +
        '<div class="tg-opt-row" style="margin-top:10px"><label class="tg-opt-label" for="wm-font">Font</label><select id="wm-font" class="tg-select"><option value="Helvetica" selected>Helvetica</option><option value="Times Roman">Times Roman</option><option value="Courier">Courier</option></select></div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label" for="wm-size">Font Size</label><input type="range" id="wm-size" min="12" max="120" value="48" style="flex:1"> <span id="wm-size-val">48</span></div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label" for="wm-color">Color</label><input type="color" id="wm-color" value="#FF0000"></div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label" for="wm-opacity">Opacity</label><input type="range" id="wm-opacity" min="5" max="100" value="30" style="flex:1"> <span id="wm-opacity-val">30%</span></div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label" for="wm-rotation">Rotation</label><input type="range" id="wm-rotation" min="-180" max="180" value="-45" style="flex:1"> <span id="wm-rotation-val">-45°</span></div>' +
        '<label class="tg-opt-label" style="margin-top:8px">Position</label>' +
        '<div class="tg-wm-pos-grid">' +
          '<button type="button" class="tg-pos-btn" data-pos="top-left">↖ Top Left</button>' +
          '<button type="button" class="tg-pos-btn" data-pos="top-center">↑ Top Center</button>' +
          '<button type="button" class="tg-pos-btn" data-pos="top-right">↗ Top Right</button>' +
          '<button type="button" class="tg-pos-btn" data-pos="middle-left">← Mid Left</button>' +
          '<button type="button" class="tg-pos-btn tg-pos-btn--active" data-pos="center">Center</button>' +
          '<button type="button" class="tg-pos-btn" data-pos="middle-right">→ Mid Right</button>' +
          '<button type="button" class="tg-pos-btn" data-pos="bottom-left">↙ Bot Left</button>' +
          '<button type="button" class="tg-pos-btn" data-pos="bottom-center">↓ Bot Center</button>' +
          '<button type="button" class="tg-pos-btn" data-pos="bottom-right">↘ Bot Right</button>' +
          '<button type="button" class="tg-pos-btn" data-pos="diagonal" style="grid-column:1/-1">⟋ Diagonal (Tiled)</button>' +
        '</div>' +
        '<label class="tg-opt-label" style="margin-top:8px">Apply to</label>' +
        '<div class="tg-radio-group"><label><input type="radio" name="wm-pages" value="all" checked> All pages</label><label><input type="radio" name="wm-pages" value="first"> First page only</label><label><input type="radio" name="wm-pages" value="custom"> Custom range</label></div>' +
        '<input type="text" id="wm-page-range" class="tg-text-input" placeholder="e.g. 1,3,5-8" hidden>' +
      '</div>' +
      '<div id="wm-image" class="tg-tab-pane" hidden>' +
        '<label class="tg-opt-label">Watermark Image <span class="tg-opt-hint">(PNG recommended for transparency)</span></label>' +
        '<input type="file" id="wm-image-file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" class="tg-text-input">' +
        '<div class="tg-opt-row" style="margin-top:10px"><label class="tg-opt-label" for="wm-img-opacity">Opacity</label><input type="range" id="wm-img-opacity" min="5" max="100" value="30" style="flex:1"> <span id="wm-img-opacity-val">30%</span></div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label" for="wm-img-scale">Scale (% of page width)</label><input type="range" id="wm-img-scale" min="10" max="100" value="50" style="flex:1"> <span id="wm-img-scale-val">50%</span></div>' +
        '<label class="tg-opt-label" style="margin-top:8px">Position</label>' +
        '<div class="tg-wm-pos-grid" id="wm-img-pos-grid">' +
          '<button type="button" class="tg-pos-btn" data-imgpos="top-left">↖ Top Left</button>' +
          '<button type="button" class="tg-pos-btn" data-imgpos="top-center">↑ Top Center</button>' +
          '<button type="button" class="tg-pos-btn" data-imgpos="top-right">↗ Top Right</button>' +
          '<button type="button" class="tg-pos-btn" data-imgpos="middle-left">← Mid Left</button>' +
          '<button type="button" class="tg-pos-btn tg-pos-btn--active" data-imgpos="center">Center</button>' +
          '<button type="button" class="tg-pos-btn" data-imgpos="middle-right">→ Mid Right</button>' +
          '<button type="button" class="tg-pos-btn" data-imgpos="bottom-left">↙ Bot Left</button>' +
          '<button type="button" class="tg-pos-btn" data-imgpos="bottom-center">↓ Bot Center</button>' +
          '<button type="button" class="tg-pos-btn" data-imgpos="bottom-right">↘ Bot Right</button>' +
        '</div>' +
        '<label class="tg-opt-label" style="margin-top:8px">Apply to</label>' +
        '<div class="tg-radio-group"><label><input type="radio" name="wm-img-pages" value="all" checked> All pages</label><label><input type="radio" name="wm-img-pages" value="first"> First page only</label><label><input type="radio" name="wm-img-pages" value="custom"> Custom range</label></div>' +
        '<input type="text" id="wm-img-page-range" class="tg-text-input" placeholder="e.g. 1,3,5-8" hidden>' +
      '</div>';
  }

  function afterOptionsInjected(container) {
    /* Tab switching */
    container.querySelectorAll('.tg-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.tg-tab-btn').forEach(function (b) { b.classList.remove('tg-tab-btn--active'); });
        container.querySelectorAll('.tg-tab-pane').forEach(function (p) { p.hidden = true; });
        btn.classList.add('tg-tab-btn--active');
        var pane = container.querySelector('#' + btn.dataset.tab);
        if (pane) pane.hidden = false;
      });
    });
    /* Slider live labels */
    function linkSlider(id, valId, suffix) {
      var sl = container.querySelector('#' + id), vl = container.querySelector('#' + valId);
      if (sl && vl) sl.addEventListener('input', function () { vl.textContent = sl.value + suffix; });
    }
    linkSlider('wm-size', 'wm-size-val', '');
    linkSlider('wm-opacity', 'wm-opacity-val', '%');
    linkSlider('wm-rotation', 'wm-rotation-val', '°');
    linkSlider('wm-img-opacity', 'wm-img-opacity-val', '%');
    linkSlider('wm-img-scale', 'wm-img-scale-val', '%');
    /* Position buttons */
    container.querySelectorAll('.tg-pos-btn[data-pos]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.tg-pos-btn[data-pos]').forEach(function (b) { b.classList.remove('tg-pos-btn--active'); });
        btn.classList.add('tg-pos-btn--active');
      });
    });
    container.querySelectorAll('.tg-pos-btn[data-imgpos]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.tg-pos-btn[data-imgpos]').forEach(function (b) { b.classList.remove('tg-pos-btn--active'); });
        btn.classList.add('tg-pos-btn--active');
      });
    });
    /* Custom page range visibility */
    container.querySelectorAll('input[name="wm-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var el = container.querySelector('#wm-page-range');
        if (el) el.hidden = r.value !== 'custom';
      });
    });
    container.querySelectorAll('input[name="wm-img-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var el = container.querySelector('#wm-img-page-range');
        if (el) el.hidden = r.value !== 'custom';
      });
    });
  }

  function getOptions() {
    var activeTab = document.querySelector('.tg-tab-btn--active');
    var isImgTab  = activeTab && activeTab.dataset.tab === 'wm-image';

    if (!isImgTab) {
      var wtInp = document.querySelector('#wm-text-input');
      var pb    = document.querySelector('.tg-pos-btn[data-pos].tg-pos-btn--active');
      var pr    = document.querySelector('input[name="wm-pages"]:checked');
      return {
        type:      'text',
        text:      wtInp ? wtInp.value.trim() : '',
        font:      (document.querySelector('#wm-font') || {}).value || 'Helvetica',
        fontSize:  parseInt((document.querySelector('#wm-size') || {}).value || '48'),
        color:     (document.querySelector('#wm-color') || {}).value || '#FF0000',
        opacity:   parseInt((document.querySelector('#wm-opacity') || {}).value || '30'),
        rotation:  parseInt((document.querySelector('#wm-rotation') || {}).value || '-45'),
        position:  pb ? pb.dataset.pos : 'center',
        pages:     pr ? pr.value : 'all',
        pageRange: (document.querySelector('#wm-page-range') || {}).value || '',
      };
    } else {
      var imgFileEl = document.querySelector('#wm-image-file');
      var pb2  = document.querySelector('.tg-pos-btn[data-imgpos].tg-pos-btn--active');
      var pr2  = document.querySelector('input[name="wm-img-pages"]:checked');
      return {
        type:      'image',
        imageFile: imgFileEl && imgFileEl.files[0] ? imgFileEl.files[0] : null,
        opacity:   parseInt((document.querySelector('#wm-img-opacity') || {}).value || '30'),
        scale:     parseInt((document.querySelector('#wm-img-scale') || {}).value || '50'),
        position:  pb2 ? pb2.dataset.imgpos : 'center',
        pages:     pr2 ? pr2.value : 'all',
        pageRange: (document.querySelector('#wm-img-page-range') || {}).value || '',
      };
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['add-watermark'] = { run: run, getOptionsHTML: getOptionsHTML, afterOptionsInjected: afterOptionsInjected, getOptions: getOptions };
})();

/**
 * ToolsGallery — Add Watermark
 * Handler: add-watermark
 * URL: /tool/add-watermark/
 *
 * Supports multiple text watermarks per page. Each watermark has its own
 * text, font, size, colour, opacity, rotation and position.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'add-watermark' };

  var POSITIONS = [
    ['center', 'Center'],
    ['top-left', 'Top Left'], ['top-center', 'Top Center'], ['top-right', 'Top Right'],
    ['mid-left', 'Middle Left'], ['mid-right', 'Middle Right'],
    ['bot-left', 'Bottom Left'], ['bot-center', 'Bottom Center'], ['bot-right', 'Bottom Right'],
  ];

  function cardHTML(idx, preset) {
    preset = preset || {};
    var posOpts = POSITIONS.map(function (p) {
      var sel = (preset.position || 'center') === p[0] ? ' selected' : '';
      return '<option value="' + p[0] + '"' + sel + '>' + p[1] + '</option>';
    }).join('');
    return '<div class="aw-card" data-idx="' + idx + '" style="border:1px solid #e2e2e2;border-radius:8px;padding:12px;margin-bottom:10px;position:relative;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<strong style="font-size:13px;">Watermark <span class="aw-num">' + (idx + 1) + '</span></strong>' +
        '<button type="button" class="aw-remove tg-btn-secondary" style="padding:2px 10px;font-size:12px;">Remove</button>' +
      '</div>' +
      '<div class="tg-opt-row" style="flex-direction:column;gap:4px">' +
        '<label class="tg-opt-label">Text</label>' +
        '<input type="text" class="aw-text tg-text-input" value="' + (preset.text || 'CONFIDENTIAL') + '">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Font</label>' +
        '<select class="aw-font tg-select">' +
          '<option value="Helvetica">Helvetica</option>' +
          '<option value="TimesRoman">Times</option>' +
          '<option value="Courier">Courier</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Font Size</label>' +
        '<input type="number" class="aw-size tg-text-input" value="' + (preset.size || 48) + '" min="8" max="200" style="width:90px">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Color</label>' +
        '<input type="color" class="aw-color" value="' + (preset.color || '#cc0000') + '" style="width:60px;height:32px;padding:2px;border:1px solid #ddd;border-radius:4px;cursor:pointer">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Opacity (%)</label>' +
        '<input type="range" class="aw-opacity" min="5" max="100" value="' + (preset.opacity || 30) + '" style="flex:1">' +
        '<span class="aw-opacity-val" style="width:40px;text-align:right">' + (preset.opacity || 30) + '%</span>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Rotation (°)</label>' +
        '<input type="number" class="aw-rotation tg-text-input" value="' + (preset.rotation !== undefined ? preset.rotation : 45) + '" min="-180" max="180" style="width:90px">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Position</label>' +
        '<select class="aw-position tg-select">' + posOpts + '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label style="font-size:13px"><input type="checkbox" class="aw-tiled"> Tiled (repeat across page)</label>' +
      '</div>' +
    '</div>';
  }

  function getOptionsHTML() {
    return '<div id="aw-list">' + cardHTML(0) + '</div>' +
      '<button type="button" id="aw-add" class="tg-btn-secondary" style="margin-bottom:12px;">+ Add Another Watermark</button>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Apply to</label>' +
        '<div class="tg-radio-group">' +
          '<label><input type="radio" name="aw-pages" value="all" checked> All pages</label>' +
          '<label><input type="radio" name="aw-pages" value="first"> First page only</label>' +
          '<label><input type="radio" name="aw-pages" value="custom"> Custom range</label>' +
        '</div>' +
        '<input type="text" id="aw-page-range" class="tg-text-input" placeholder="e.g. 1,3,5-8" hidden style="margin-top:6px;">' +
      '</div>';
  }

  function renumber(container) {
    container.querySelectorAll('.aw-card').forEach(function (card, i) {
      var num = card.querySelector('.aw-num');
      if (num) num.textContent = i + 1;
      card.dataset.idx = i;
    });
  }

  function wireCard(card) {
    var op = card.querySelector('.aw-opacity');
    var ov = card.querySelector('.aw-opacity-val');
    if (op && ov) op.addEventListener('input', function () { ov.textContent = op.value + '%'; });
    var rm = card.querySelector('.aw-remove');
    if (rm) rm.addEventListener('click', function () {
      var container = card.parentNode;
      if (container.querySelectorAll('.aw-card').length <= 1) {
        /* Keep at least one watermark — clear the text instead */
        var t = card.querySelector('.aw-text');
        if (t) { t.value = ''; t.focus(); }
        return;
      }
      card.parentNode.removeChild(card);
      renumber(container);
    });
  }

  function wireOptions(optionsEl) {
    if (!optionsEl || optionsEl.dataset.awWired) return;
    optionsEl.dataset.awWired = '1';

    var list = optionsEl.querySelector('#aw-list');
    list.querySelectorAll('.aw-card').forEach(wireCard);

    var addBtn = optionsEl.querySelector('#aw-add');
    if (addBtn) addBtn.addEventListener('click', function () {
      var idx = list.querySelectorAll('.aw-card').length;
      var tmp = document.createElement('div');
      tmp.innerHTML = cardHTML(idx, { text: 'DRAFT', color: '#0000cc', rotation: 45, opacity: 25 });
      var card = tmp.firstChild;
      list.appendChild(card);
      wireCard(card);
      renumber(list);
    });

    optionsEl.querySelectorAll('input[name="aw-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var el = optionsEl.querySelector('#aw-page-range');
        if (el) el.hidden = r.value !== 'custom';
      });
    });
  }

  function onFileReady(file, optionsEl) {
    if (optionsEl) wireOptions(optionsEl);
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { watermarks: [], pages: 'all', pageRange: '' };
    var watermarks = [];
    optionsEl.querySelectorAll('.aw-card').forEach(function (card) {
      var text = (card.querySelector('.aw-text') || {}).value || '';
      if (!text.trim()) return;
      watermarks.push({
        text: text,
        font: (card.querySelector('.aw-font') || {}).value || 'Helvetica',
        size: parseInt((card.querySelector('.aw-size') || {}).value, 10) || 48,
        color: (card.querySelector('.aw-color') || {}).value || '#cc0000',
        opacity: (parseInt((card.querySelector('.aw-opacity') || {}).value, 10) || 30) / 100,
        rotation: parseInt((card.querySelector('.aw-rotation') || {}).value, 10) || 0,
        position: (card.querySelector('.aw-position') || {}).value || 'center',
        tiled: !!(card.querySelector('.aw-tiled') && card.querySelector('.aw-tiled').checked),
      });
    });
    var pagesRadio = optionsEl.querySelector('input[name="aw-pages"]:checked');
    var range = optionsEl.querySelector('#aw-page-range');
    return {
      watermarks: watermarks,
      pages: pagesRadio ? pagesRadio.value : 'all',
      pageRange: range ? range.value : '',
    };
  }

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    };
  }

  function calcPosition(pos, pageW, pageH, elW, elH, margin) {
    margin = margin || 40;
    var positions = {
      'top-left':   { x: margin,               y: pageH - margin - elH },
      'top-center': { x: (pageW - elW) / 2,    y: pageH - margin - elH },
      'top-right':  { x: pageW - margin - elW, y: pageH - margin - elH },
      'mid-left':   { x: margin,               y: (pageH - elH) / 2 },
      'center':     { x: (pageW - elW) / 2,    y: (pageH - elH) / 2 },
      'mid-right':  { x: pageW - margin - elW, y: (pageH - elH) / 2 },
      'bot-left':   { x: margin,               y: margin },
      'bot-center': { x: (pageW - elW) / 2,    y: margin },
      'bot-right':  { x: pageW - margin - elW, y: margin },
    };
    return positions[pos] || positions['center'];
  }

  function parseRange(str, total) {
    var out = [];
    String(str).split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
          if (i >= 1 && i <= total) out.push(i - 1);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) out.push(n - 1);
      }
    });
    return out;
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFLib = window.PDFLib;
    var StandardFonts = PDFLib.StandardFonts, rgb = PDFLib.rgb, degrees = PDFLib.degrees;

    var watermarks = (options.watermarks || []).filter(function (w) { return w.text && w.text.trim(); });
    if (!watermarks.length) throw new Error('Please enter watermark text.');

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(ab, { ignoreEncryption: true });
    var pages = pdfDoc.getPages();
    var totalPages = pages.length;

    /* Target pages */
    var targetIndices;
    if (options.pages === 'first') targetIndices = [0];
    else if (options.pages === 'custom' && options.pageRange) targetIndices = parseRange(options.pageRange, totalPages);
    else targetIndices = pages.map(function (_, i) { return i; });
    if (!targetIndices.length) targetIndices = pages.map(function (_, i) { return i; });

    /* Embed each distinct font once */
    var fontCache = {};
    async function getFont(name) {
      var key = StandardFonts[name] ? name : 'Helvetica';
      if (!fontCache[key]) fontCache[key] = await pdfDoc.embedFont(StandardFonts[key]);
      return fontCache[key];
    }

    onProgress && onProgress(0.3, 'Adding watermarks...');

    for (var wi = 0; wi < watermarks.length; wi++) {
      var wm = watermarks[wi];
      var font = await getFont(wm.font);
      var color = hexToRgb(wm.color || '#cc0000');

      for (var ti = 0; ti < targetIndices.length; ti++) {
        var page = pages[targetIndices[ti]];
        if (!page) continue;
        var w = page.getWidth(), h = page.getHeight();
        var textWidth = font.widthOfTextAtSize(wm.text, wm.size);
        var textHeight = wm.size;

        if (wm.tiled) {
          for (var ty = textHeight; ty < h + textHeight; ty += textHeight * 3) {
            for (var tx = -textWidth; tx < w + textWidth; tx += textWidth * 2) {
              page.drawText(wm.text, { x: tx, y: ty, size: wm.size, font: font, color: rgb(color.r, color.g, color.b), opacity: wm.opacity, rotate: degrees(wm.rotation) });
            }
          }
        } else {
          var pos = calcPosition(wm.position, w, h, textWidth, textHeight, 40);
          page.drawText(wm.text, { x: pos.x, y: pos.y, size: wm.size, font: font, color: rgb(color.r, color.g, color.b), opacity: wm.opacity, rotate: degrees(wm.rotation) });
        }
      }
      onProgress && onProgress(0.3 + ((wi + 1) / watermarks.length) * 0.6, 'Adding watermark ' + (wi + 1) + ' of ' + watermarks.length + '...');
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-watermarked.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, wireOptions: wireOptions, CONFIG: CONFIG };
})();

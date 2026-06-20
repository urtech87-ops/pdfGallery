/**
 * ToolsGallery — Add Page Numbers
 * Handler: add-page-numbers
 * URL: /tool/add-page-numbers/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'add-page-numbers' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="apn-format">Format</label>' +
      '<select id="apn-format" class="tg-select">' +
        '<option value="n">1</option>' +
        '<option value="page-n">Page 1</option>' +
        '<option value="n-of-t">1 of N</option>' +
        '<option value="page-n-of-t" selected>Page 1 of N</option>' +
        '<option value="dash-n-dash">- 1 -</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="apn-position">Position</label>' +
      '<select id="apn-position" class="tg-select">' +
        '<option value="bottom-center" selected>Bottom Center</option>' +
        '<option value="bottom-left">Bottom Left</option>' +
        '<option value="bottom-right">Bottom Right</option>' +
        '<option value="top-center">Top Center</option>' +
        '<option value="top-left">Top Left</option>' +
        '<option value="top-right">Top Right</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="apn-size">Font Size</label>' +
      '<input type="number" id="apn-size" class="tg-text-input" value="12" min="6" max="36" style="width:80px">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="apn-color">Color</label>' +
      '<input type="color" id="apn-color" value="#000000" style="width:60px;height:32px;padding:2px;border:1px solid #ddd;border-radius:4px;cursor:pointer">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="apn-margin">Margin (pt)</label>' +
      '<input type="number" id="apn-margin" class="tg-text-input" value="20" min="0" max="100" style="width:80px">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="apn-start">Starting Number</label>' +
      '<input type="number" id="apn-start" class="tg-text-input" value="1" min="1" style="width:80px">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label style="font-size:13px"><input type="checkbox" id="apn-skip-first"> Skip first page</label>' +
    '</div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { format: 'page-n-of-t', position: 'bottom-center', size: 12, color: '#000000', margin: 20, start: 1, skipFirst: false };
    var fmt = optionsEl.querySelector('#apn-format');
    var pos = optionsEl.querySelector('#apn-position');
    var sz = optionsEl.querySelector('#apn-size');
    var clr = optionsEl.querySelector('#apn-color');
    var mg = optionsEl.querySelector('#apn-margin');
    var st = optionsEl.querySelector('#apn-start');
    var sk = optionsEl.querySelector('#apn-skip-first');
    return {
      format: fmt ? fmt.value : 'page-n-of-t',
      position: pos ? pos.value : 'bottom-center',
      size: sz ? parseInt(sz.value) || 12 : 12,
      color: clr ? clr.value : '#000000',
      margin: mg ? parseInt(mg.value) || 20 : 20,
      start: st ? parseInt(st.value) || 1 : 1,
      skipFirst: !!(sk && sk.checked),
    };
  }

  function hexToRgb(hex) {
    return { r: parseInt(hex.slice(1,3),16)/255, g: parseInt(hex.slice(3,5),16)/255, b: parseInt(hex.slice(5,7),16)/255 };
  }

  function formatNumber(fmt, n, total) {
    switch (fmt) {
      case 'n': return String(n);
      case 'page-n': return 'Page ' + n;
      case 'n-of-t': return n + ' of ' + total;
      case 'page-n-of-t': return 'Page ' + n + ' of ' + total;
      case 'dash-n-dash': return '- ' + n + ' -';
      default: return String(n);
    }
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var { PDFDocument, StandardFonts, rgb, degrees } = window.PDFLib;

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
    var pages = pdfDoc.getPages();
    var total = pages.length;
    var font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    var color = hexToRgb(options.color || '#000000');
    var fontSize = options.size || 12;
    var margin = options.margin || 20;

    onProgress && onProgress(0.4, 'Adding page numbers...');
    for (var i = 0; i < pages.length; i++) {
      if (options.skipFirst && i === 0) continue;
      var page = pages[i];
      var pw = page.getWidth(), ph = page.getHeight();
      var displayNum = (options.start || 1) + (options.skipFirst ? i - 1 : i);
      var text = formatNumber(options.format, displayNum, total);
      var textW = font.widthOfTextAtSize(text, fontSize);

      var x, y;
      switch (options.position) {
        case 'bottom-left':   x = margin; y = margin; break;
        case 'bottom-center': x = (pw - textW) / 2; y = margin; break;
        case 'bottom-right':  x = pw - textW - margin; y = margin; break;
        case 'top-left':      x = margin; y = ph - margin - fontSize; break;
        case 'top-center':    x = (pw - textW) / 2; y = ph - margin - fontSize; break;
        case 'top-right':     x = pw - textW - margin; y = ph - margin - fontSize; break;
        default:              x = (pw - textW) / 2; y = margin;
      }

      page.drawText(text, { x: x, y: y, size: fontSize, font: font, color: rgb(color.r, color.g, color.b) });
    }

    onProgress && onProgress(0.9, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-numbered.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

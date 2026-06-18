/**
 * ============================================================
 * ToolsGallery — Add Page Numbers Tool
 * ============================================================
 * Handler key: add-page-numbers
 * Tool URL: /tool/add-page-numbers/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-lib (PDFLib)
 * ============================================================
 */
(function () {
  'use strict';

  var SF_MAP = { 'Helvetica': 'Helvetica', 'Times Roman': 'TimesRoman', 'Courier': 'Courier' };

  function hexToRgb(hex) {
    return { r: parseInt(hex.slice(1,3),16)/255, g: parseInt(hex.slice(3,5),16)/255, b: parseInt(hex.slice(5,7),16)/255 };
  }

  function fmtLabel(n, t, fmt) {
    switch (fmt) {
      case 'Page 1':      return 'Page ' + n;
      case '1 of N':      return n + ' of ' + t;
      case 'Page 1 of N': return 'Page ' + n + ' of ' + t;
      case '- 1 -':       return '- ' + n + ' -';
      default:            return String(n);
    }
  }

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;

    onProgress(20, 'Loading PDF…');
    var ab  = await files[0].arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    var pages = doc.getPages();
    var total = pages.length;

    var sfName   = SF_MAP[options.font] || 'Helvetica';
    var font     = await doc.embedFont(PDFLib.StandardFonts[sfName]);
    var c        = hexToRgb(options.color || '#000000');
    var fontSize = options.fontSize  || 10;
    var margin   = options.margin    || 30;
    var startNum = options.startNumber || 1;
    var skipFirst = !!options.skipFirst;

    onProgress(50, 'Adding page numbers…');
    pages.forEach(function (page, idx) {
      if (skipFirst && idx === 0) return;
      var pageNum = startNum + idx - (skipFirst ? 1 : 0);
      var label   = fmtLabel(pageNum, total, options.format || '1');
      var sz      = page.getSize();
      var tw      = font.widthOfTextAtSize(label, fontSize);
      var x, y;
      switch (options.position || 'bottom-center') {
        case 'top-left':     x = margin;                    y = sz.height - margin - fontSize; break;
        case 'top-center':   x = (sz.width - tw) / 2;      y = sz.height - margin - fontSize; break;
        case 'top-right':    x = sz.width - tw - margin;    y = sz.height - margin - fontSize; break;
        case 'bottom-left':  x = margin;                    y = margin; break;
        case 'bottom-right': x = sz.width - tw - margin;    y = margin; break;
        default:             x = (sz.width - tw) / 2;       y = margin; break;
      }
      page.drawText(label, { x: x, y: y, size: fontSize, font: font, color: PDFLib.rgb(c.r, c.g, c.b) });
    });

    onProgress(90, 'Saving PDF…');
    var bytes = await doc.save();
    onSuccess(new Blob([bytes], { type: 'application/pdf' }), 'numbered.pdf');
  }

  function getOptionsHTML() {
    return '<label class="tg-opt-label">Position</label>' +
      '<div class="tg-pn-pos-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">' +
        '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="top-left"> Top Left</label>' +
        '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="top-center"> Top Center</label>' +
        '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="top-right"> Top Right</label>' +
        '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="bottom-left"> Bottom Left</label>' +
        '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="bottom-center" checked> Bottom Center</label>' +
        '<label class="tg-pos-radio"><input type="radio" name="pn-pos" value="bottom-right"> Bottom Right</label>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label" for="pn-format">Format</label>' +
        '<select id="pn-format" class="tg-select"><option value="1">1</option><option value="Page 1">Page 1</option><option value="1 of N">1 of N</option><option value="Page 1 of N">Page 1 of N</option><option value="- 1 -">- 1 -</option></select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label" for="pn-start">Starting Number</label><input type="number" id="pn-start" class="tg-text-input" value="1" min="1" style="width:80px"></div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label" for="pn-font">Font</label><select id="pn-font" class="tg-select"><option value="Helvetica" selected>Helvetica</option><option value="Times Roman">Times Roman</option><option value="Courier">Courier</option></select></div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label" for="pn-size">Font Size</label><input type="range" id="pn-size" min="8" max="24" value="10" style="flex:1"> <span id="pn-size-val">10</span></div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label" for="pn-color">Color</label><input type="color" id="pn-color" value="#000000"></div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label" for="pn-margin">Margin from edge</label><input type="range" id="pn-margin" min="20" max="60" value="30" style="flex:1"> <span id="pn-margin-val">30pt</span></div>' +
      '<label class="tg-opt-label"><input type="checkbox" id="pn-skip-first"> Skip first page (cover page)</label>';
  }

  function afterOptionsInjected(container) {
    var sl1 = container.querySelector('#pn-size'),   vl1 = container.querySelector('#pn-size-val');
    var sl2 = container.querySelector('#pn-margin'), vl2 = container.querySelector('#pn-margin-val');
    if (sl1 && vl1) sl1.addEventListener('input', function () { vl1.textContent = sl1.value; });
    if (sl2 && vl2) sl2.addEventListener('input', function () { vl2.textContent = sl2.value + 'pt'; });
  }

  function getOptions() {
    var pos = document.querySelector('input[name="pn-pos"]:checked');
    var fmt = document.querySelector('#pn-format');
    var st  = document.querySelector('#pn-start');
    var fn  = document.querySelector('#pn-font');
    var fs  = document.querySelector('#pn-size');
    var col = document.querySelector('#pn-color');
    var mg  = document.querySelector('#pn-margin');
    var sk  = document.querySelector('#pn-skip-first');
    var sv  = parseInt((st || {}).value || '1');
    return {
      position:    pos ? pos.value : 'bottom-center',
      format:      fmt ? fmt.value : '1',
      startNumber: sv >= 1 ? sv : 1,
      font:        fn  ? fn.value  : 'Helvetica',
      fontSize:    parseInt((fs || {}).value || '10'),
      color:       col ? col.value : '#000000',
      margin:      parseInt((mg || {}).value || '30'),
      skipFirst:   sk  ? sk.checked : false,
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['add-page-numbers'] = { run: run, getOptionsHTML: getOptionsHTML, afterOptionsInjected: afterOptionsInjected, getOptions: getOptions };
})();

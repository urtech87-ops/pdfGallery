/**
 * ToolsGallery — PDF to PNG
 * Handler: pdf-to-png
 * URL: /tool/pdf-to-png/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'pdf-to-png' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ptp-res">Resolution</label>' +
      '<select id="ptp-res" class="tg-select">' +
        '<option value="1.5">Standard (150 DPI)</option>' +
        '<option value="3">High (300 DPI)</option>' +
        '<option value="6">Ultra (600 DPI)</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ptp-pages">Page Range</label>' +
      '<input type="text" id="ptp-pages" class="tg-text-input" placeholder="All pages (e.g. 1-3,5)">' +
    '</div>' +
    '<div id="ptp-info" style="margin-top:8px;font-size:13px;color:var(--color-gray-600)"></div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { scale: 1.5, pages: '' };
    var r = optionsEl.querySelector('#ptp-res');
    var p = optionsEl.querySelector('#ptp-pages');
    return { scale: r ? parseFloat(r.value) : 1.5, pages: p ? p.value.trim() : '' };
  }

  function parsePageRange(str, total) {
    if (!str) return Array.from({ length: total }, function (_, i) { return i + 1; });
    var result = [];
    str.split(',').forEach(function (part) {
      part = part.trim();
      if (part.indexOf('-') > 0) {
        var r = part.split('-');
        var s = parseInt(r[0]) || 1, e = parseInt(r[1]) || total;
        for (var i = s; i <= Math.min(e, total); i++) result.push(i);
      } else {
        var n = parseInt(part);
        if (n >= 1 && n <= total) result.push(n);
      }
    });
    return result.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
    if (!window.JSZip) throw new Error('JSZip not loaded');

    onProgress && onProgress(0.05, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    var total = pdf.numPages;
    var infoEl = document.getElementById('ptp-info');
    if (infoEl) infoEl.textContent = 'PDF has ' + total + ' page(s).';

    var pageNums = parsePageRange(options.pages, total);
    var zip = new JSZip();
    var baseName = file.name.replace(/\.pdf$/i, '');

    for (var i = 0; i < pageNums.length; i++) {
      onProgress && onProgress(0.1 + (i / pageNums.length) * 0.85, 'Rendering page ' + pageNums[i] + '...');
      var page = await pdf.getPage(pageNums[i]);
      var viewport = page.getViewport({ scale: options.scale || 1.5 });
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      // Transparent background — no fillRect
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;

      var dataUrl = canvas.toDataURL('image/png');
      var b64 = dataUrl.split(',')[1];
      zip.file(baseName + '-page' + pageNums[i] + '.png', b64, { base64: true });
    }

    if (pageNums.length === 1) {
      var singlePage = await pdf.getPage(pageNums[0]);
      var sv = singlePage.getViewport({ scale: options.scale || 1.5 });
      var sc = document.createElement('canvas');
      sc.width = Math.round(sv.width); sc.height = Math.round(sv.height);
      await singlePage.render({ canvasContext: sc.getContext('2d'), viewport: sv }).promise;
      var sBlob = await new Promise(function (res) { sc.toBlob(res, 'image/png'); });
      onProgress && onProgress(1, 'Done!');
      return { blob: sBlob, filename: baseName + '-page' + pageNums[0] + '.png' };
    }

    onProgress && onProgress(0.97, 'Creating ZIP...');
    var zipBlob = await zip.generateAsync({ type: 'blob' });
    onProgress && onProgress(1, 'Done!');
    return { blob: zipBlob, filename: baseName + '-pages-png.zip' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

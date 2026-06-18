/**
 * ============================================================
 * ToolsGallery — PDF to JPG Tool
 * ============================================================
 * Handler key: pdf-to-jpg
 * Tool URL: /tool/pdf-to-jpg/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf.js (pdfjsLib), jszip (JSZip)
 * ============================================================
 */
(function () {
  'use strict';

  var scaleMap = { web: 1.0, standard: 2.0, print: 4.0 };

  function parseRange(str, total) {
    var result = [];
    str.split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        var s = parseInt(m[1], 10), e = parseInt(m[2], 10);
        if (s >= 1 && e <= total && s <= e) for (var p = s; p <= e; p++) result.push(p);
      } else {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) result.push(n);
      }
    });
    if (!result.length) throw new Error('No valid pages specified.');
    return result;
  }

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var file  = files[0];
    var scale = scaleMap[options.quality] || 2.0;

    onProgress(10, 'Loading PDF…');
    var ab     = await file.arrayBuffer();
    var pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
    var total  = pdfDoc.numPages;

    var pages;
    if (options.pageMode === 'specific') {
      pages = parseRange(options.specificPages || '1', total);
    } else {
      pages = [];
      for (var i = 1; i <= total; i++) pages.push(i);
    }

    var results = [];
    for (var j = 0; j < pages.length; j++) {
      onProgress(10 + Math.round((j / pages.length) * 85), 'Converting page ' + (j + 1) + ' of ' + pages.length + '…');
      var page     = await pdfDoc.getPage(pages[j]);
      var viewport = page.getViewport({ scale: scale });
      var canvas   = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
      var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/jpeg', 0.92); });
      results.push({ blob: blob, name: 'page-' + pages[j] + '.jpg' });
    }

    if (results.length === 1) {
      return onSuccess(results[0].blob, results[0].name);
    }
    var zip = new JSZip();
    results.forEach(function (r) { zip.file(r.name, r.blob); });
    var zipBlob = await zip.generateAsync({ type: 'blob' });
    onSuccess(zipBlob, 'pdf-images.zip');
  }

  function getOptionsHTML() {
    return '<label class="tg-opt-label">Quality</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="jpg-quality" value="web"> Web (72 DPI)</label>' +
        '<label><input type="radio" name="jpg-quality" value="standard" checked> Standard (150 DPI)</label>' +
        '<label><input type="radio" name="jpg-quality" value="print"> Print (300 DPI)</label>' +
      '</div>' +
      '<label class="tg-opt-label" style="margin-top:12px">Pages</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="jpg-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="jpg-pages" value="specific"> Specific pages</label>' +
      '</div>' +
      '<div id="jpg-pages-wrap" hidden>' +
        '<input type="text" id="jpg-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>';
  }

  function afterOptionsInjected(container) {
    container.querySelectorAll('input[name="jpg-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = container.querySelector('#jpg-pages-wrap');
        if (w) w.hidden = r.value !== 'specific';
      });
    });
  }

  function getOptions() {
    var q  = document.querySelector('input[name="jpg-quality"]:checked');
    var pm = document.querySelector('input[name="jpg-pages"]:checked');
    var sp = document.querySelector('#jpg-pages-input');
    return {
      quality:       q  ? q.value  : 'standard',
      pageMode:      pm ? pm.value : 'all',
      specificPages: sp ? sp.value.trim() : '',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['pdf-to-jpg'] = { run: run, getOptionsHTML: getOptionsHTML, afterOptionsInjected: afterOptionsInjected, getOptions: getOptions };
})();

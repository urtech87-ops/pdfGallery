/**
 * ============================================================
 * ToolsGallery — PDF to PNG Tool
 * ============================================================
 * Handler key: pdf-to-png
 * Tool URL: /tool/pdf-to-png/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf.js (pdfjsLib), jszip (JSZip)
 * ============================================================
 */
(function () {
  'use strict';

  var scaleMap = { standard: 2.0, high: 4.0, ultra: 8.0 };

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
    var scale = scaleMap[options.resolution] || 2.0;

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
      canvas.width = viewport.width; canvas.height = viewport.height;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
      results.push({ blob: blob, name: 'page-' + pages[j] + '.png' });
    }

    if (results.length === 1) {
      return onSuccess(results[0].blob, results[0].name);
    }
    var zip = new JSZip();
    results.forEach(function (r) { zip.file(r.name, r.blob); });
    var zipBlob = await zip.generateAsync({ type: 'blob' });
    onSuccess(zipBlob, 'pdf-images-png.zip');
  }

  function getOptionsHTML() {
    return '<label class="tg-opt-label">Resolution</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="png-res" value="standard" checked> Standard (150 DPI, scale 2×)</label>' +
        '<label><input type="radio" name="png-res" value="high"> High (300 DPI, scale 4×)</label>' +
        '<label><input type="radio" name="png-res" value="ultra"> Ultra (600 DPI, scale 8×)</label>' +
      '</div>' +
      '<label class="tg-opt-label" style="margin-top:12px">Pages</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="png-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="png-pages" value="specific"> Specific pages</label>' +
      '</div>' +
      '<div id="png-pages-wrap" hidden>' +
        '<input type="text" id="png-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>';
  }

  function afterOptionsInjected(container) {
    container.querySelectorAll('input[name="png-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = container.querySelector('#png-pages-wrap');
        if (w) w.hidden = r.value !== 'specific';
      });
    });
  }

  function getOptions() {
    var res = document.querySelector('input[name="png-res"]:checked');
    var pm  = document.querySelector('input[name="png-pages"]:checked');
    var sp  = document.querySelector('#png-pages-input');
    return {
      resolution:    res ? res.value : 'standard',
      pageMode:      pm  ? pm.value  : 'all',
      specificPages: sp  ? sp.value.trim() : '',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['pdf-to-png'] = { run: run, getOptionsHTML: getOptionsHTML, afterOptionsInjected: afterOptionsInjected, getOptions: getOptions };
})();

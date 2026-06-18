/**
 * ============================================================
 * ToolsGallery — Split PDF Tool
 * ============================================================
 * Handler key: split
 * Tool URL: /tool/split-pdf/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-lib (PDFLib), jszip (JSZip)
 * ============================================================
 */
(function () {
  'use strict';

  function parsePageRange(str, total) {
    var result = [];
    var parts = str.split(',');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (!part) continue;
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        var s = parseInt(m[1], 10), e = parseInt(m[2], 10);
        if (isNaN(s) || isNaN(e) || s < 1 || e > total || s > e)
          throw new Error('Invalid range: ' + part + ' (document has ' + total + ' pages)');
        for (var p = s; p <= e; p++) result.push(p);
      } else {
        var n = parseInt(part, 10);
        if (isNaN(n) || n < 1 || n > total)
          throw new Error('Page ' + (isNaN(n) ? part : n) + ' does not exist (' + total + ' pages total)');
        result.push(n);
      }
    }
    if (!result.length) throw new Error('No valid pages specified.');
    return result;
  }

  async function makeDoc(srcDoc, indices) {
    var d = await PDFLib.PDFDocument.create();
    var copied = await d.copyPages(srcDoc, indices);
    copied.forEach(function (pg) { d.addPage(pg); });
    return await d.save();
  }

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;

    var file = files[0];
    onProgress(20, 'Loading PDF…');
    var ab     = await file.arrayBuffer();
    var srcDoc = await PDFLib.PDFDocument.load(ab);
    var total  = srcDoc.getPageCount();
    var mode   = options.mode || 'extract';
    var param  = options.param || '';

    onProgress(40, 'Splitting…');

    if (mode === 'extract') {
      var pages = parsePageRange(param, total);
      var bytes = await makeDoc(srcDoc, pages.map(function (p) { return p - 1; }));
      return onSuccess(new Blob([bytes], { type: 'application/pdf' }), 'extracted-pages.pdf');
    }

    if (mode === 'every') {
      var n = parseInt(param, 10);
      if (isNaN(n) || n < 1) throw new Error('Invalid N value.');
      var zip = new JSZip();
      for (var start = 0, c = 1; start < total; start += n, c++) {
        var end  = Math.min(start + n, total);
        var idxs = [];
        for (var j = start; j < end; j++) idxs.push(j);
        zip.file('part-' + c + '.pdf', await makeDoc(srcDoc, idxs));
      }
      var zipBlob = await zip.generateAsync({ type: 'blob' });
      return onSuccess(zipBlob, 'split-pages.zip');
    }

    if (mode === 'half') {
      var mid = Math.floor(total / 2);
      var a1 = [], a2 = [];
      for (var x = 0; x < mid; x++) a1.push(x);
      for (var y = mid; y < total; y++) a2.push(y);
      var zip2 = new JSZip();
      zip2.file('part-1.pdf', await makeDoc(srcDoc, a1));
      zip2.file('part-2.pdf', await makeDoc(srcDoc, a2));
      var zipBlob2 = await zip2.generateAsync({ type: 'blob' });
      return onSuccess(zipBlob2, 'split-pages.zip');
    }

    throw new Error('Unknown split mode: ' + mode);
  }

  function getOptionsHTML() {
    return '<label class="tg-opt-label">Split mode</label>' +
      '<div class="tg-radio-group" id="split-mode-group">' +
        '<label><input type="radio" name="split-mode" value="extract" checked> Extract pages</label>' +
        '<label><input type="radio" name="split-mode" value="every"> Split every N pages</label>' +
        '<label><input type="radio" name="split-mode" value="half"> Split in half</label>' +
      '</div>' +
      '<div id="split-extract-wrap">' +
        '<label class="tg-opt-label" for="split-pages-input">Pages to extract <span class="tg-opt-hint">e.g. 1,3,5-8</span></label>' +
        '<input type="text" id="split-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
      '<div id="split-every-wrap" hidden>' +
        '<label class="tg-opt-label" for="split-every-input">Split every N pages</label>' +
        '<input type="number" id="split-every-input" class="tg-text-input" min="1" value="1" style="width:80px">' +
      '</div>';
  }

  function afterOptionsInjected(container) {
    container.querySelectorAll('input[name="split-mode"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var ew = container.querySelector('#split-extract-wrap');
        var ev = container.querySelector('#split-every-wrap');
        if (ew) ew.hidden = radio.value !== 'extract';
        if (ev) ev.hidden = radio.value !== 'every';
      });
    });
  }

  function getOptions() {
    var modeEl  = document.querySelector('input[name="split-mode"]:checked');
    var mode    = modeEl ? modeEl.value : 'extract';
    var param   = '';
    if (mode === 'extract') {
      var el = document.querySelector('#split-pages-input');
      param = el ? el.value.trim() : '';
    } else if (mode === 'every') {
      var el2 = document.querySelector('#split-every-input');
      param = el2 ? el2.value.trim() : '1';
    }
    return { mode: mode, param: param };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['split'] = { run: run, getOptionsHTML: getOptionsHTML, afterOptionsInjected: afterOptionsInjected, getOptions: getOptions };
})();

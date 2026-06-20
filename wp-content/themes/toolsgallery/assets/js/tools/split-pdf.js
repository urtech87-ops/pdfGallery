/**
 * ToolsGallery — Split PDF
 * Handler: split
 * URL: /tool/split-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'split' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:8px">' +
      '<label class="tg-opt-label">Split Mode</label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary sp-mode-btn sp-mode-btn--active" data-mode="pages">Extract Pages</button>' +
        '<button type="button" class="tg-btn-secondary sp-mode-btn" data-mode="every">Every N Pages</button>' +
        '<button type="button" class="tg-btn-secondary sp-mode-btn" data-mode="half">Split in Half</button>' +
      '</div>' +
    '</div>' +
    '<div id="sp-pages-opt" class="tg-opt-row" style="flex-direction:column;gap:4px">' +
      '<label class="tg-opt-label" for="sp-page-list">Pages (e.g. 1,3,5-7)</label>' +
      '<input type="text" id="sp-page-list" class="tg-text-input" placeholder="1,2,5-8" value="">' +
    '</div>' +
    '<div id="sp-every-opt" class="tg-opt-row" style="display:none;flex-direction:column;gap:4px">' +
      '<label class="tg-opt-label" for="sp-every-n">Every N pages</label>' +
      '<input type="number" id="sp-every-n" class="tg-text-input" min="1" value="1">' +
    '</div>' +
    '<div id="sp-info" style="margin-top:8px;font-size:13px;color:var(--color-gray-600)"></div>' +
    '<script>(function(){' +
      'var btns=document.querySelectorAll(".sp-mode-btn");' +
      'btns.forEach(function(b){b.addEventListener("click",function(){' +
        'btns.forEach(function(x){x.classList.remove("sp-mode-btn--active");});' +
        'b.classList.add("sp-mode-btn--active");' +
        'var m=b.dataset.mode;' +
        'document.getElementById("sp-pages-opt").style.display=m==="pages"?"flex":"none";' +
        'document.getElementById("sp-every-opt").style.display=m==="every"?"flex":"none";' +
      '});});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { mode: 'pages', pages: '', everyN: 1 };
    var active = optionsEl.querySelector('.sp-mode-btn--active');
    var pageList = optionsEl.querySelector('#sp-page-list');
    var everyN = optionsEl.querySelector('#sp-every-n');
    return {
      mode: active ? active.dataset.mode : 'pages',
      pages: pageList ? pageList.value.trim() : '',
      everyN: everyN ? parseInt(everyN.value) || 1 : 1,
    };
  }

  function parsePageList(str, total) {
    var indices = [];
    var parts = str.split(',');
    parts.forEach(function (part) {
      part = part.trim();
      if (!part) return;
      if (part.indexOf('-') > 0) {
        var r = part.split('-');
        var s = parseInt(r[0]) || 1;
        var e = parseInt(r[1]) || total;
        for (var i = s; i <= Math.min(e, total); i++) indices.push(i - 1);
      } else {
        var n = parseInt(part);
        if (n >= 1 && n <= total) indices.push(n - 1);
      }
    });
    return indices.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    if (!window.JSZip) throw new Error('JSZip not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var srcDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
    var total = srcDoc.getPageCount();

    document.getElementById('sp-info') && (document.getElementById('sp-info').textContent = 'PDF has ' + total + ' pages.');

    var chunks = []; // each chunk is an array of 0-based page indices
    if (options.mode === 'pages') {
      var indices = parsePageList(options.pages || '1', total);
      if (!indices.length) throw new Error('No valid pages specified.');
      chunks.push(indices);
    } else if (options.mode === 'every') {
      var n = Math.max(1, options.everyN);
      for (var start = 0; start < total; start += n) {
        var chunk = [];
        for (var j = start; j < Math.min(start + n, total); j++) chunk.push(j);
        chunks.push(chunk);
      }
    } else { // half
      var mid = Math.ceil(total / 2);
      var first = [], second = [];
      for (var k = 0; k < mid; k++) first.push(k);
      for (var l = mid; l < total; l++) second.push(l);
      if (first.length) chunks.push(first);
      if (second.length) chunks.push(second);
    }

    var baseName = file.name.replace(/\.pdf$/i, '');
    var zip = new JSZip();
    for (var ci = 0; ci < chunks.length; ci++) {
      onProgress && onProgress(0.2 + (ci / chunks.length) * 0.7, 'Building part ' + (ci + 1) + '...');
      var newDoc = await PDFDocument.create();
      var copied = await newDoc.copyPages(srcDoc, chunks[ci]);
      copied.forEach(function (pg) { newDoc.addPage(pg); });
      var bytes = await newDoc.save();
      zip.file(baseName + '-part' + (ci + 1) + '.pdf', bytes);
    }

    if (chunks.length === 1) {
      onProgress && onProgress(1, 'Done!');
      var singleDoc = await PDFDocument.create();
      var singleCopied = await singleDoc.copyPages(srcDoc, chunks[0]);
      singleCopied.forEach(function (pg) { singleDoc.addPage(pg); });
      var singleBytes = await singleDoc.save();
      return { blob: new Blob([singleBytes], { type: 'application/pdf' }), filename: baseName + '-split.pdf' };
    }

    onProgress && onProgress(0.95, 'Creating ZIP...');
    var zipBlob = await zip.generateAsync({ type: 'blob' });
    onProgress && onProgress(1, 'Done!');
    return { blob: zipBlob, filename: baseName + '-split.zip' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

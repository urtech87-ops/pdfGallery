/* ToolsGallery — pdf-to-word.js
   Handler: pdf-to-word
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-to-word',
    downloadName: 'converted.docx',
  };

  function getOptionsHTML(pageCount) {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Page range</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="word-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="word-pages" value="custom"> Custom range</label>' +
      '</div>' +
      '<input type="text" id="word-page-range" class="tg-input" placeholder="e.g. 1-5, 8, 11-13" style="display:none;margin-top:6px;" />' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Font size</label>' +
      '<select id="word-fontsize" class="tg-select">' +
        '<option value="11">11pt (default)</option>' +
        '<option value="12">12pt</option>' +
        '<option value="10">10pt</option>' +
      '</select>' +
    '</div>' +
    '<p class="tg-opt-info">Text-based PDFs produce the best results. Scanned PDFs may not convert correctly.</p>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var pagesRadio = optionsEl.querySelector('input[name="word-pages"]:checked');
    var rangeInput = optionsEl.querySelector('#word-page-range');
    var fontsize   = optionsEl.querySelector('#word-fontsize');
    return {
      pages:    pagesRadio ? pagesRadio.value : 'all',
      range:    rangeInput ? rangeInput.value : '',
      fontsize: fontsize ? parseInt(fontsize.value, 10) : 11,
    };
  }

  function parsePageRange(rangeStr, totalPages) {
    var pages = [];
    var parts = rangeStr.split(',');
    parts.forEach(function (part) {
      part = part.trim();
      var dash = part.indexOf('-');
      if (dash !== -1) {
        var from = parseInt(part.slice(0, dash), 10);
        var to   = parseInt(part.slice(dash + 1), 10);
        if (!isNaN(from) && !isNaN(to)) {
          for (var i = from; i <= Math.min(to, totalPages); i++) pages.push(i);
        }
      } else {
        var n = parseInt(part, 10);
        if (!isNaN(n) && n >= 1 && n <= totalPages) pages.push(n);
      }
    });
    return pages.length ? pages : null;
  }

  async function waitForDocx(maxAttempts) {
    maxAttempts = maxAttempts || 10;
    for (var i = 0; i < maxAttempts; i++) {
      if (window.docx && window.docx.Document) return true;
      await new Promise(function (r) { setTimeout(r, 200); });
    }
    return false;
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF library not loaded. Please refresh the page.');

    onProgress && onProgress(0.05, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var totalPages = pdf.numPages;

    var pageNums;
    if (options.pages === 'custom' && options.range) {
      pageNums = parsePageRange(options.range, totalPages);
      if (!pageNums) pageNums = Array.from({ length: totalPages }, function (_, i) { return i + 1; });
    } else {
      pageNums = Array.from({ length: totalPages }, function (_, i) { return i + 1; });
    }

    onProgress && onProgress(0.1, 'Extracting text...');
    var paragraphTexts = [];
    for (var pi = 0; pi < pageNums.length; pi++) {
      var pageNum = pageNums[pi];
      onProgress && onProgress(0.1 + (pi / pageNums.length) * 0.5, 'Reading page ' + pageNum + '...');
      var page = await pdf.getPage(pageNum);
      var tc   = await page.getTextContent();

      var lines = [];
      var currentLine = null;
      tc.items.forEach(function (item) {
        if (!item.str) return;
        var y = Math.round(item.transform[5]);
        if (currentLine === null || Math.abs(currentLine.y - y) > 3) {
          currentLine = { y: y, texts: [] };
          lines.push(currentLine);
        }
        currentLine.texts.push(item.str);
      });

      lines.sort(function (a, b) { return b.y - a.y; });
      lines.forEach(function (line) {
        var text = line.texts.join(' ').trim();
        if (text) paragraphTexts.push(text);
      });

      if (pi < pageNums.length - 1) {
        paragraphTexts.push('');
      }
    }

    if (!paragraphTexts.some(function (t) { return t.trim().length > 0; })) {
      throw new Error('No text found in PDF. The document may contain only images or be scanned.');
    }

    onProgress && onProgress(0.65, 'Loading Word library...');

    var docxLoaded = await waitForDocx();
    if (!docxLoaded) {
      await new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://unpkg.com/docx@7.8.2/build/index.umd.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
      docxLoaded = await waitForDocx(5);
      if (!docxLoaded) {
        throw new Error('Document library failed to load. Please check your internet connection and refresh.');
      }
    }

    onProgress && onProgress(0.75, 'Building Word document...');

    var fontSize = (options.fontsize || 11) * 2; // half-points

    var children = paragraphTexts.map(function (text) {
      return new window.docx.Paragraph({
        children: [new window.docx.TextRun({ text: text, size: fontSize })],
        spacing: { after: text ? 120 : 0 },
      });
    });

    var doc = new window.docx.Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    onProgress && onProgress(0.9, 'Generating .docx file...');
    var blob = await window.docx.Packer.toBlob(doc);

    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

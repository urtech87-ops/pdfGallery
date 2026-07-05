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

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.05, 'Loading libraries...');

    if (!window.pdfjsLib) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    var docxLoaded = await waitForDocx(3);
    if (!docxLoaded) {
      await loadScript('https://unpkg.com/docx@7.8.2/build/index.umd.js');
      docxLoaded = await waitForDocx(5);
      if (!docxLoaded) {
        throw new Error('Document library failed to load. Please check your internet connection and refresh.');
      }
    }
    var docx = window.docx;

    onProgress && onProgress(0.15, 'Reading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var totalPages = pdf.numPages;

    var pageNums = null;
    if (options.pages === 'custom' && options.range) {
      pageNums = parsePageRange(options.range, totalPages);
    }
    if (!pageNums || !pageNums.length) {
      pageNums = Array.from({ length: totalPages }, function (_, i) { return i + 1; });
    }

    var fontSize = parseInt(options.fontsize || '11', 10);
    var paragraphs = [];
    var foundText = false;

    for (var p = 0; p < pageNums.length; p++) {
      onProgress && onProgress(0.2 + (p / pageNums.length) * 0.5, 'Extracting page ' + pageNums[p] + '...');

      var page = await pdf.getPage(pageNums[p]);
      var tc   = await page.getTextContent();

      /* Group text items into lines by Y position */
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

      /* Page heading */
      if (pageNums.length > 1) {
        paragraphs.push(new docx.Paragraph({
          text: 'Page ' + pageNums[p],
          heading: docx.HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        }));
      }

      lines.forEach(function (line) {
        var text = line.texts.join(' ').trim();
        if (!text) return;
        foundText = true;
        paragraphs.push(new docx.Paragraph({
          children: [new docx.TextRun({ text: text, size: fontSize * 2 })],
          spacing: { after: 100 },
        }));
      });

      /* Page break between pages */
      if (p < pageNums.length - 1) {
        paragraphs.push(new docx.Paragraph({
          children: [new docx.PageBreak()],
        }));
      }
    }

    if (!foundText) {
      throw new Error('No text found in PDF. The document may contain only images or be scanned.');
    }

    onProgress && onProgress(0.8, 'Creating Word document...');

    var doc = new docx.Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    onProgress && onProgress(0.9, 'Generating .docx file...');
    var blob = await docx.Packer.toBlob(doc);

    onProgress && onProgress(1.0, 'Done!');

    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '.docx',
    };
  }

  function onFileReady(file, optionsEl) {
    if (!optionsEl) return;
    var rangeInput = optionsEl.querySelector('#word-page-range');
    if (!rangeInput || rangeInput.dataset.wired) return;
    rangeInput.dataset.wired = '1';
    optionsEl.querySelectorAll('input[name="word-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var input = optionsEl.querySelector('#word-page-range');
        if (input) input.style.display = r.value === 'custom' ? 'block' : 'none';
      });
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

/* ToolsGallery — pdf-to-word.js
   Handler: pdf-to-word
   Converts PDF to DOCX using PDF.js and docx.js.
   Loads docx.js from multiple CDNs with timeout + retry so the
   "Document library failed to load" error cannot occur unless the
   user is fully offline.
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-to-word',
    downloadName: 'document.docx',
  };

  var CDNS = {
    pdfjs: [
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    ],
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    docx: [
      'https://cdnjs.cloudflare.com/ajax/libs/docx/7.8.2/docx.umd.min.js',
      'https://cdn.jsdelivr.net/npm/docx@7.8.2/build/index.umd.js',
      'https://unpkg.com/docx@7.8.2/build/index.umd.js',
    ],
  };

  function loadOneScript(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + url + '"]');
      if (existing && existing.dataset.tgLoaded) return resolve();
      var s = existing || document.createElement('script');
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error('Timeout loading ' + url));
      }, timeoutMs || 15000);
      s.addEventListener('load', function () {
        s.dataset.tgLoaded = '1';
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      });
      s.addEventListener('error', function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(new Error('Failed loading ' + url));
      });
      if (!existing) {
        s.src = url;
        document.head.appendChild(s);
      }
    });
  }

  /* Try each URL in order until one loads. */
  async function loadScript(urls) {
    var urlList = Array.isArray(urls) ? urls : [urls];
    var lastErr = null;
    for (var i = 0; i < urlList.length; i++) {
      try {
        await loadOneScript(urlList[i]);
        return true;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Failed to load library from all sources.');
  }

  /* The theme also enqueues docx.js via WordPress — give the enqueued
     copy a moment to finish before falling back to dynamic loading. */
  async function waitForDocx(maxAttempts) {
    for (var i = 0; i < (maxAttempts || 5); i++) {
      if (window.docx && window.docx.Document) return true;
      await new Promise(function (r) { setTimeout(r, 200); });
    }
    return !!(window.docx && window.docx.Document);
  }

  function getOptionsHTML() {
    return '<div class="tg-opt-section">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Page Range</label>' +
        '<div class="tg-radio-group">' +
          '<label class="tg-radio-label"><input type="radio" name="p2w-pages" value="all" checked> <span>All Pages</span></label>' +
          '<label class="tg-radio-label"><input type="radio" name="p2w-pages" value="custom"> <span>Custom Range</span></label>' +
        '</div>' +
        '<div id="p2w-range-wrap" style="display:none;margin-top:8px;">' +
          '<input type="text" id="p2w-range" class="tg-input" placeholder="e.g. 1-5, 8, 11-13">' +
        '</div>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Font Size</label>' +
        '<select id="p2w-fontsize" class="tg-select">' +
          '<option value="10">10pt</option>' +
          '<option value="11" selected>11pt (default)</option>' +
          '<option value="12">12pt</option>' +
          '<option value="14">14pt</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-info-box">Text-based PDFs produce the best results. Scanned PDFs may contain no extractable text.</div>' +
    '</div>';
  }

  /* Inline <script> tags in injected markup never execute — events are
     wired here (called by tool-runner via wireOptions/onFileReady). */
  function wireOptions(optionsEl) {
    if (!optionsEl || optionsEl.dataset.p2wWired) return;
    optionsEl.dataset.p2wWired = '1';
    optionsEl.querySelectorAll('input[name="p2w-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = optionsEl.querySelector('#p2w-range-wrap');
        if (w) w.style.display = r.value === 'custom' ? 'block' : 'none';
      });
    });
  }

  function onFileReady(file, optionsEl) {
    wireOptions(optionsEl);
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var pages = optionsEl.querySelector('input[name="p2w-pages"]:checked');
    var range = optionsEl.querySelector('#p2w-range');
    var fs    = optionsEl.querySelector('#p2w-fontsize');
    return {
      pages:    pages ? pages.value : 'all',
      range:    range ? range.value : '',
      fontsize: fs ? fs.value : '11',
    };
  }

  function parseRange(str, total) {
    var pages = [];
    str.split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= Math.min(parseInt(m[2], 10), total); i++) pages.push(i);
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n);
      }
    });
    return pages.length ? pages : null;
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.02, 'Initializing...');

    /* Load PDF.js */
    if (!window.pdfjsLib) {
      onProgress && onProgress(0.05, 'Loading PDF reader...');
      try { await loadScript(CDNS.pdfjs); } catch (e) { /* checked below */ }
      if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = CDNS.pdfWorker;
      }
    }
    if (!window.pdfjsLib) {
      throw new Error('PDF reader could not be loaded. Please check your internet connection and try again.');
    }

    /* Load docx.js — wait for the WordPress-enqueued copy first, then
       fall back to loading from each CDN in turn. */
    if (!(window.docx && window.docx.Document)) {
      onProgress && onProgress(0.08, 'Loading Word library...');
      var ready = await waitForDocx(5);
      if (!ready) {
        for (var d = 0; d < CDNS.docx.length && !ready; d++) {
          try {
            await loadOneScript(CDNS.docx[d]);
            ready = await waitForDocx(5);
          } catch (e) { /* try next CDN */ }
        }
      }
      if (!ready) {
        throw new Error('Word library could not be loaded. Please check your internet connection and try again.');
      }
    }
    var docx = window.docx;

    onProgress && onProgress(0.12, 'Reading PDF...');
    var ab = await file.arrayBuffer();
    var pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    } catch (e) {
      throw new Error('Could not read PDF file. Make sure it is a valid PDF. Error: ' + (e && e.message ? e.message : 'unknown'));
    }

    var totalPages = pdf.numPages;
    var pageNums;
    if (options.pages === 'custom' && options.range) {
      pageNums = parseRange(options.range, totalPages);
      if (!pageNums) throw new Error('Invalid page range. Use format: 1-5, 8, 11-13');
    } else {
      pageNums = [];
      for (var i = 1; i <= totalPages; i++) pageNums.push(i);
    }

    var fontSize = parseInt(options.fontsize || '11', 10);
    var paragraphs = [];
    var foundText = false;

    for (var p = 0; p < pageNums.length; p++) {
      var pNum = pageNums[p];
      onProgress && onProgress(0.15 + (p / pageNums.length) * 0.65,
        'Converting page ' + pNum + ' of ' + totalPages + '...');

      var page = await pdf.getPage(pNum);
      var tc   = await page.getTextContent();

      /* Group items into lines by Y position (3pt tolerance) */
      var lineMap = {};
      tc.items.forEach(function (item) {
        if (!item.str) return;
        var y = Math.round(item.transform[5] / 3) * 3;
        if (!lineMap[y]) lineMap[y] = [];
        lineMap[y].push({
          x: item.transform[4],
          str: item.str,
          height: item.height || fontSize,
        });
      });

      var sortedYs = Object.keys(lineMap).map(Number).sort(function (a, b) { return b - a; });

      if (p > 0) {
        paragraphs.push(new docx.Paragraph({ children: [new docx.PageBreak()] }));
      }

      sortedYs.forEach(function (y) {
        var items = lineMap[y].sort(function (a, b) { return a.x - b.x; });
        var line = items.map(function (it) { return it.str; }).join(' ')
          .replace(/\s{2,}/g, ' ').trim();
        if (!line) return;
        foundText = true;

        var isHeading = items[0] && items[0].height > fontSize + 2;
        paragraphs.push(
          isHeading
            ? new docx.Paragraph({
                text: line,
                heading: docx.HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
              })
            : new docx.Paragraph({
                children: [new docx.TextRun({ text: line, size: fontSize * 2 })],
                spacing: { after: 80 },
              })
        );
      });
    }

    if (!foundText) {
      throw new Error('No text content found in this PDF. The document may contain only images or scanned content.');
    }

    onProgress && onProgress(0.85, 'Building Word document...');

    var doc = new docx.Document({
      sections: [{
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children: paragraphs,
      }],
    });

    onProgress && onProgress(0.92, 'Generating DOCX file...');
    var blob = await docx.Packer.toBlob(doc);
    if (!blob || !blob.size) {
      throw new Error('Failed to generate Word document.');
    }

    onProgress && onProgress(1.0, 'Done! Document converted successfully.');

    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '.docx',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = {
    run: run,
    getOptionsHTML: getOptionsHTML,
    getOptions: getOptions,
    onFileReady: onFileReady,
    wireOptions: wireOptions,
    CONFIG: CONFIG,
  };
})();

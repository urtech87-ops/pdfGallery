/* ToolsGallery — pdf-to-ppt.js
   Handler: pdf-to-ppt
   Converts PDF pages to PPTX slides
   Each page rendered as image slide
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-to-ppt',
    downloadName: 'presentation.pptx',
  };

  function getOptionsHTML(pageCount) {
    return [
      '<div class="tg-opt-row">',
        '<label class="tg-opt-label">Slide Size</label>',
        '<div class="tg-radio-group">',
          '<label><input type="radio" name="ppt-size" value="169" checked> 16:9 Widescreen (recommended)</label>',
          '<label><input type="radio" name="ppt-size" value="43"> 4:3 Standard</label>',
        '</div>',
      '</div>',
      '<div class="tg-opt-row">',
        '<label class="tg-opt-label">Image Quality</label>',
        '<div class="tg-radio-group">',
          '<label><input type="radio" name="ppt-quality" value="1.5" checked> Standard (faster)</label>',
          '<label><input type="radio" name="ppt-quality" value="2.5"> High Quality (slower)</label>',
        '</div>',
      '</div>',
      '<div class="tg-opt-row">',
        '<label class="tg-opt-label">Pages to Convert</label>',
        '<div class="tg-radio-group">',
          '<label><input type="radio" name="ppt-pages" value="all" checked> All pages</label>',
          '<label><input type="radio" name="ppt-pages" value="custom"> Custom range</label>',
        '</div>',
        '<div id="ppt-custom-wrap" hidden style="margin-top:6px;">',
          '<input type="text" id="ppt-custom-pages" class="tg-text-input" placeholder="e.g. 1,3,5-8">',
        '</div>',
      '</div>',
    ].join('');
  }

  /* Options HTML is injected via innerHTML, so inline <script> tags would
     never execute — use document-level delegation for the custom toggle. */
  document.addEventListener('change', function (e) {
    if (!e.target || e.target.name !== 'ppt-pages') return;
    var w = document.getElementById('ppt-custom-wrap');
    if (w) w.hidden = e.target.value !== 'custom';
  });

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var size = optionsEl.querySelector('input[name="ppt-size"]:checked');
    var quality = optionsEl.querySelector('input[name="ppt-quality"]:checked');
    var pages = optionsEl.querySelector('input[name="ppt-pages"]:checked');
    var customPages = optionsEl.querySelector('#ppt-custom-pages');
    return {
      size: size ? size.value : '169',
      quality: parseFloat(quality ? quality.value : '1.5'),
      pagesMode: pages ? pages.value : 'all',
      customPages: customPages ? customPages.value : '',
    };
  }

  function parsePageRange(str, total) {
    var pages = [];
    str.split(',').forEach(function (part) {
      part = part.trim();
      var range = part.match(/^(\d+)-(\d+)$/);
      if (range) {
        var start = parseInt(range[1], 10);
        var end = parseInt(range[2], 10);
        for (var i = start; i <= end; i++) {
          if (i >= 1 && i <= total) pages.push(i);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n);
      }
    });
    return pages.length ? pages : null;
  }

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + url + '"]');
      if (existing) {
        if (existing.dataset.tgLoaded === '1') { resolve(); return; }
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', function () {
          reject(new Error('Failed to load: ' + url));
        });
        return;
      }
      var s = document.createElement('script');
      s.src = url;
      s.onload = function () { s.dataset.tgLoaded = '1'; resolve(); };
      s.onerror = function () { reject(new Error('Failed to load: ' + url)); };
      document.head.appendChild(s);
    });
  }

  async function run(file, options, onProgress) {

    // Step 1: Load PptxGenJS library
    onProgress && onProgress(0.05, 'Loading PowerPoint library...');

    if (!window.PptxGenJS) {
      try {
        await loadScript(
          'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
        );
      } catch (e) {
        throw new Error(
          'Could not load PowerPoint library. Please check your internet connection and try again.');
      }
    }

    // Step 2: Load PDF.js if not available
    onProgress && onProgress(0.1, 'Loading PDF reader...');

    if (!window.pdfjsLib) {
      try {
        await loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
        );
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      } catch (e) {
        throw new Error('Could not load PDF reader. Please refresh and try again.');
      }
    }

    // Step 3: Read the PDF file
    onProgress && onProgress(0.15, 'Reading PDF file...');

    var arrayBuffer = await file.arrayBuffer();
    var pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch (e) {
      throw new Error('Could not read PDF. Make sure it is a valid PDF file.');
    }

    var totalPages = pdf.numPages;
    if (totalPages === 0) {
      throw new Error('PDF has no pages.');
    }

    // Step 4: Determine which pages to convert
    var pageNums;
    if (options.pagesMode === 'custom' && options.customPages) {
      pageNums = parsePageRange(options.customPages, totalPages);
      if (!pageNums) {
        throw new Error('Invalid page range. Use format like: 1,3,5-8');
      }
    } else {
      pageNums = [];
      for (var i = 1; i <= totalPages; i++) pageNums.push(i);
    }

    // Step 5: Set up slide dimensions
    var slideWidth, slideHeight;
    if (options.size === '43') {
      slideWidth  = 10;  // inches
      slideHeight = 7.5;
    } else {
      slideWidth  = 13.33; // 16:9
      slideHeight = 7.5;
    }

    // Step 6: Create PowerPoint
    onProgress && onProgress(0.2, 'Creating presentation...');

    var pptx = new PptxGenJS();
    pptx.layout = options.size === '43' ? 'LAYOUT_4x3' : 'LAYOUT_WIDE';

    // Step 7: Convert each PDF page to slide
    var scale = options.quality || 1.5;

    for (var p = 0; p < pageNums.length; p++) {
      var pageNum = pageNums[p];
      var progress = 0.2 + (p / pageNums.length) * 0.7;

      onProgress && onProgress(progress,
        'Converting page ' + pageNum + ' of ' + totalPages + '...');

      // Render PDF page to canvas
      var page = await pdf.getPage(pageNum);
      var viewport = page.getViewport({ scale: scale });

      var canvas = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      var ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      // Convert canvas to base64 image
      var imgData = canvas.toDataURL('image/jpeg', 0.92);
      var base64 = imgData.replace(/^data:image\/jpeg;base64,/, '');

      // Add slide to PowerPoint
      var slide = pptx.addSlide();
      slide.addImage({
        data: 'image/jpeg;base64,' + base64,
        x: 0,
        y: 0,
        w: slideWidth,
        h: slideHeight,
        sizing: { type: 'contain', w: slideWidth, h: slideHeight },
      });

      // Clean up canvas
      canvas.width  = 0;
      canvas.height = 0;
    }

    // Step 8: Generate PPTX file
    onProgress && onProgress(0.92, 'Generating PPTX file...');

    var pptxBlob;
    try {
      var buffer = await pptx.write({ outputType: 'arraybuffer' });
      pptxBlob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
    } catch (e) {
      throw new Error('Failed to generate PPTX file: ' + e.message);
    }

    if (!pptxBlob || pptxBlob.size === 0) {
      throw new Error('Generated file is empty. Please try again with a different PDF.');
    }

    onProgress && onProgress(1.0, 'Done! ' + pageNums.length + ' slides created.');

    return {
      blob: pptxBlob,
      filename: file.name.replace(/\.pdf$/i, '') + '.pptx',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = {
    run: run,
    getOptionsHTML: getOptionsHTML,
    getOptions: getOptions,
    CONFIG: CONFIG,
  };

})();

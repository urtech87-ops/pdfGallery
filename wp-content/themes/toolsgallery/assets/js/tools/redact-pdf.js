/* ToolsGallery — redact-pdf.js
   Handler: redact-pdf
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'redact-pdf',
    downloadName: 'redacted.pdf',
  };

  var _redactAreas = []; // [{pageIndex, x, y, w, h} in PDF coords]

  function getOptionsHTML(pageCount) {
    return '<div style="background:#ffebee;border:1px solid #ef9a9a;border-radius:6px;padding:10px;margin-bottom:12px;">' +
      '<strong>Warning:</strong> Redaction permanently blacks out selected areas. This cannot be undone. Always keep a copy of the original.' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Method</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="redact-method" value="manual" checked> Manual (draw boxes)</label>' +
        '<label><input type="radio" name="redact-method" value="text"> Auto (search text)</label>' +
      '</div>' +
    '</div>' +
    '<div id="redact-manual-opts">' +
      '<p class="tg-opt-info">Draw black redaction boxes on the PDF preview below. Boxes will be applied to the target pages.</p>' +
      '<canvas id="redact-canvas" style="border:1px solid #ccc;max-width:100%;cursor:crosshair;display:block;"></canvas>' +
      '<div style="display:flex;gap:8px;margin-top:6px;">' +
        '<button type="button" id="redact-clear" class="tg-btn-secondary">Clear All Boxes</button>' +
        '<button type="button" id="redact-preview" class="tg-btn-secondary">Preview Redactions</button>' +
      '</div>' +
    '</div>' +
    '<div id="redact-text-opts" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="redact-search-text">Text to redact</label>' +
        '<input type="text" id="redact-search-text" class="tg-text-input" placeholder="e.g. John Smith, 123-45-6789...">' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Apply boxes to pages</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="redact-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="redact-pages" value="current"> Shown page only</label>' +
        '<label><input type="radio" name="redact-pages" value="custom"> Custom</label>' +
      '</div>' +
      '<div id="redact-custom-pages-wrap" hidden style="margin-top:6px;">' +
        '<input type="text" id="redact-custom-pages" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>' +
    '<script>' +
    '(function(){' +
      'window._tgRedactBoxes=[];window._tgRedactPageSize={w:612,h:792};' +
      'var methodR=document.querySelectorAll("input[name=\\'redact-method\\']");' +
      'methodR.forEach(function(r){r.addEventListener("change",function(){' +
        'document.getElementById("redact-manual-opts").hidden=r.value!=="manual";' +
        'document.getElementById("redact-text-opts").hidden=r.value!=="text";' +
      '});});' +
      'var pagesR=document.querySelectorAll("input[name=\\'redact-pages\\']");' +
      'pagesR.forEach(function(r){r.addEventListener("change",function(){' +
        'var w=document.getElementById("redact-custom-pages-wrap");if(w)w.hidden=r.value!=="custom";' +
      '});});' +
      'var rc=document.getElementById("redact-canvas");' +
      'if(rc){var rctx=rc.getContext("2d");var drawing=false,sx=0,sy=0;' +
        'rc.addEventListener("mousedown",function(e){drawing=true;var r=rc.getBoundingClientRect();sx=e.clientX-r.left;sy=e.clientY-r.top;});' +
        'rc.addEventListener("mouseup",function(e){if(!drawing)return;drawing=false;' +
          'var r=rc.getBoundingClientRect();var ex=e.clientX-r.left;var ey=e.clientY-r.top;' +
          'var box={x:Math.min(sx,ex),y:Math.min(sy,ey),w:Math.abs(ex-sx),h:Math.abs(ey-sy)};' +
          'rctx.fillStyle="#000000";rctx.fillRect(box.x,box.y,box.w,box.h);' +
          'var cw=rc.offsetWidth,ch=rc.offsetHeight;' +
          'window._tgRedactBoxes.push({xFrac:box.x/cw,yFrac:box.y/ch,wFrac:box.w/cw,hFrac:box.h/ch});' +
        '});' +
        'var clearBtn=document.getElementById("redact-clear");' +
        'if(clearBtn)clearBtn.addEventListener("click",function(){window._tgRedactBoxes=[];rctx.clearRect(0,0,rc.width,rc.height);window._tgRedactRenderedPage&&renderPage(window._tgRedactRenderedPage);});' +
      '}' +
      'window.renderRedactCanvas=function(canvas,pageNum){window._tgRedactRenderedPage=pageNum;};' +
    '})();' +
    '<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var method = optionsEl.querySelector('input[name="redact-method"]:checked');
    var searchText = optionsEl.querySelector('#redact-search-text');
    var pages = optionsEl.querySelector('input[name="redact-pages"]:checked');
    var customPages = optionsEl.querySelector('#redact-custom-pages');
    return {
      method: method ? method.value : 'manual',
      searchText: searchText ? searchText.value.trim() : '',
      pagesMode: pages ? pages.value : 'all',
      customPagesStr: customPages ? customPages.value : '',
      manualBoxes: window._tgRedactBoxes || [],
    };
  }

  function parsePageRange(rangeStr, total) {
    var pages = [];
    rangeStr.split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
          if (i >= 1 && i <= total) pages.push(i - 1);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n - 1);
      }
    });
    return pages;
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded.');
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded.');

    onProgress && onProgress(0.05, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    var allPages = pdfDoc.getPages();
    var totalPages = allPages.length;

    // Render page 1 to canvas for user to draw
    var rc = document.getElementById('redact-canvas');
    if (rc && rc.width === 0) {
      try {
        var pdf4render = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        var pg1 = await pdf4render.getPage(1);
        var vp = pg1.getViewport({ scale: 1.0 });
        var scale = Math.min(500 / vp.width, 400 / vp.height);
        var rvp = pg1.getViewport({ scale: scale });
        rc.width = rvp.width;
        rc.height = rvp.height;
        await pg1.render({ canvasContext: rc.getContext('2d'), viewport: rvp }).promise;
      } catch (e) {}
    }

    var targetIndices;
    if (options.pagesMode === 'current') {
      targetIndices = [0];
    } else if (options.pagesMode === 'custom' && options.customPagesStr) {
      targetIndices = parsePageRange(options.customPagesStr, totalPages);
    } else {
      targetIndices = allPages.map(function (_, i) { return i; });
    }

    if (options.method === 'manual') {
      var boxes = options.manualBoxes || [];
      if (!boxes.length) throw new Error('Please draw at least one redaction box on the PDF preview before processing.');

      for (var i = 0; i < targetIndices.length; i++) {
        onProgress && onProgress(0.2 + i / targetIndices.length * 0.7, 'Redacting page ' + (targetIndices[i] + 1) + '...');
        var pg = allPages[targetIndices[i]];
        var sz = pg.getSize();
        boxes.forEach(function (box) {
          pg.drawRectangle({
            x: box.xFrac * sz.width,
            y: (1 - box.yFrac - box.hFrac) * sz.height,
            width: box.wFrac * sz.width,
            height: box.hFrac * sz.height,
            color: PDFLib.rgb(0, 0, 0),
          });
        });
      }
    } else {
      // Text search redaction
      if (!options.searchText) throw new Error('Please enter the text you want to redact.');
      var pdf4search = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      var searchLower = options.searchText.toLowerCase();

      for (var i = 0; i < targetIndices.length; i++) {
        onProgress && onProgress(0.2 + i / targetIndices.length * 0.7, 'Searching page ' + (targetIndices[i] + 1) + '...');
        var page4 = await pdf4search.getPage(targetIndices[i] + 1);
        var tc = await page4.getTextContent();
        var pg = allPages[targetIndices[i]];
        var sz = pg.getSize();

        tc.items.forEach(function (item) {
          if (!item.str || !item.str.toLowerCase().includes(searchLower)) return;
          var x = item.transform[4];
          var y = item.transform[5];
          var w = Math.max(item.width || 60, 60);
          var h = Math.max(item.height || 14, 14);
          pg.drawRectangle({
            x: x - 2,
            y: y - 2,
            width: w + 4,
            height: h + 4,
            color: PDFLib.rgb(0, 0, 0),
          });
        });
      }
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

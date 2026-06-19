/* ToolsGallery — remove-watermark.js
   Handler: remove-watermark
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'remove-watermark',
    downloadName: 'cleaned.pdf',
  };

  function getOptionsHTML(pageCount) {
    return '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;">' +
      '<strong>Note:</strong> Watermark removal covers visual watermarks with white rectangles. Complex image watermarks embedded in the page may not be fully removable.' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Method</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="wm-method" value="auto" checked> Auto-detect (finds repeated text)</label>' +
        '<label><input type="radio" name="wm-method" value="manual"> Manual (draw rectangles over watermark)</label>' +
      '</div>' +
    '</div>' +
    '<div id="wm-auto-opts">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="wm-text">Watermark text (leave blank to auto-detect)</label>' +
        '<input type="text" id="wm-text" class="tg-text-input" placeholder="e.g. CONFIDENTIAL, DRAFT...">' +
      '</div>' +
    '</div>' +
    '<div id="wm-manual-opts" hidden>' +
      '<p class="tg-opt-info">After processing starts, you can draw rectangles on the PDF page preview to mark watermark areas.</p>' +
      '<canvas id="wm-draw-canvas" style="border:1px solid #ccc;max-width:100%;cursor:crosshair;display:block;margin-bottom:8px;"></canvas>' +
      '<button type="button" id="wm-clear-rects" class="tg-btn-secondary">Clear All Rectangles</button>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Apply to</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="wm-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="wm-pages" value="custom"> Custom pages</label>' +
      '</div>' +
      '<div id="wm-custom-pages-wrap" hidden style="margin-top:6px;">' +
        '<input type="text" id="wm-custom-pages" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>' +
    '<script>' +
    '(function(){' +
      'var methodRadios=document.querySelectorAll("input[name=\\'wm-method\\']");' +
      'methodRadios.forEach(function(r){r.addEventListener("change",function(){' +
        'document.getElementById("wm-auto-opts").hidden=r.value!=="auto";' +
        'document.getElementById("wm-manual-opts").hidden=r.value!=="manual";' +
      '});});' +
      'var pagesRadios=document.querySelectorAll("input[name=\\'wm-pages\\']");' +
      'pagesRadios.forEach(function(r){r.addEventListener("change",function(){' +
        'var wrap=document.getElementById("wm-custom-pages-wrap");if(wrap)wrap.hidden=r.value!=="custom";' +
      '});});' +
      // Manual drawing
      'var dc=document.getElementById("wm-draw-canvas");' +
      'window._tgWmRects=[];' +
      'if(dc){var dctx=dc.getContext("2d");var drawing=false,startX=0,startY=0;' +
        'dc.addEventListener("mousedown",function(e){drawing=true;var r=dc.getBoundingClientRect();startX=e.clientX-r.left;startY=e.clientY-r.top;});' +
        'dc.addEventListener("mouseup",function(e){if(!drawing)return;drawing=false;var r=dc.getBoundingClientRect();var ex=e.clientX-r.left;var ey=e.clientY-r.top;' +
          'var rect={x:Math.min(startX,ex)/dc.offsetWidth,y:Math.min(startY,ey)/dc.offsetHeight,w:Math.abs(ex-startX)/dc.offsetWidth,h:Math.abs(ey-startY)/dc.offsetHeight};' +
          'window._tgWmRects.push(rect);' +
          'dctx.strokeStyle="#FF0000";dctx.lineWidth=2;' +
          'dctx.strokeRect(Math.min(startX,ex),Math.min(startY,ey),Math.abs(ex-startX),Math.abs(ey-startY));' +
        '});' +
        'var clearBtn=document.getElementById("wm-clear-rects");' +
        'if(clearBtn)clearBtn.addEventListener("click",function(){window._tgWmRects=[];dctx.clearRect(0,0,dc.width,dc.height);});' +
      '}' +
    '})();' +
    '<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var method = optionsEl.querySelector('input[name="wm-method"]:checked');
    var wmText = optionsEl.querySelector('#wm-text');
    var pages = optionsEl.querySelector('input[name="wm-pages"]:checked');
    var customPages = optionsEl.querySelector('#wm-custom-pages');
    return {
      method: method ? method.value : 'auto',
      wmText: wmText ? wmText.value.trim() : '',
      pagesMode: pages ? pages.value : 'all',
      customPagesStr: customPages ? customPages.value : '',
      manualRects: window._tgWmRects || [],
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

    onProgress && onProgress(0.1, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    var allPages = pdfDoc.getPages();
    var totalPages = allPages.length;

    var targetIndices;
    if (options.pagesMode === 'custom' && options.customPagesStr) {
      targetIndices = parsePageRange(options.customPagesStr, totalPages);
    } else {
      targetIndices = allPages.map(function (_, i) { return i; });
    }

    if (options.method === 'auto') {
      // Detect watermarks via PDF.js text content
      onProgress && onProgress(0.2, 'Detecting watermarks...');
      var pdf4detect = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      var textCounts = {};

      for (var p = 0; p < Math.min(totalPages, 5); p++) {
        var page = await pdf4detect.getPage(p + 1);
        var tc = await page.getTextContent();
        tc.items.forEach(function (item) {
          var s = item.str.trim();
          if (s) textCounts[s] = (textCounts[s] || 0) + 1;
        });
      }

      // Find repeated strings (appear on multiple pages)
      var watermarkTexts = [];
      if (options.wmText) {
        watermarkTexts.push(options.wmText.toLowerCase());
      } else {
        Object.keys(textCounts).forEach(function (t) {
          if (textCounts[t] >= Math.min(3, totalPages) && t.length > 2) {
            watermarkTexts.push(t.toLowerCase());
          }
        });
      }

      if (!watermarkTexts.length) {
        // Cover center area as fallback
        for (var i = 0; i < targetIndices.length; i++) {
          var pg = allPages[targetIndices[i]];
          var sz = pg.getSize();
          pg.drawRectangle({ x: sz.width * 0.2, y: sz.height * 0.35, width: sz.width * 0.6, height: sz.height * 0.3, color: PDFLib.rgb(1, 1, 1), opacity: 0.9 });
        }
      } else {
        for (var i = 0; i < targetIndices.length; i++) {
          onProgress && onProgress(0.3 + i / targetIndices.length * 0.6, 'Processing page ' + (targetIndices[i] + 1) + '...');
          var page4 = await pdf4detect.getPage(targetIndices[i] + 1);
          var tc4 = await page4.getTextContent();
          var pg4 = allPages[targetIndices[i]];
          var sz4 = pg4.getSize();

          tc4.items.forEach(function (item) {
            if (!item.str.trim()) return;
            var txt = item.str.trim().toLowerCase();
            var isWm = watermarkTexts.some(function (wmt) { return txt.includes(wmt) || wmt.includes(txt); });
            if (isWm) {
              var x = item.transform[4];
              var y = item.transform[5];
              var w = Math.max(item.width || 100, 80);
              var h = Math.max(item.height || 20, 20);
              pg4.drawRectangle({ x: x - 5, y: y - 5, width: w + 10, height: h + 10, color: PDFLib.rgb(1, 1, 1) });
            }
          });
        }
      }
    } else {
      // Manual rectangles
      var rects = options.manualRects || [];
      for (var i = 0; i < targetIndices.length; i++) {
        onProgress && onProgress(0.2 + i / targetIndices.length * 0.7, 'Applying to page ' + (targetIndices[i] + 1) + '...');
        var pg = allPages[targetIndices[i]];
        var sz = pg.getSize();
        rects.forEach(function (rect) {
          pg.drawRectangle({
            x: rect.x * sz.width,
            y: (1 - rect.y - rect.h) * sz.height,
            width: rect.w * sz.width,
            height: rect.h * sz.height,
            color: PDFLib.rgb(1, 1, 1),
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

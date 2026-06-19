/* ToolsGallery — crop-pdf.js
   Handler: crop-pdf
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'crop-pdf',
    downloadName: 'cropped.pdf',
  };

  var _cropBox = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }; // as fractions of page

  function getOptionsHTML(pageCount) {
    return '<div id="crop-preview-wrap" style="position:relative;display:inline-block;margin-bottom:12px;">' +
      '<canvas id="crop-preview-canvas" style="border:1px solid #ccc;max-width:100%;display:block;"></canvas>' +
      '<div id="crop-overlay" style="position:absolute;border:2px solid #E07B39;box-shadow:0 0 0 9999px rgba(0,0,0,0.4);cursor:move;"></div>' +
    '</div>' +
    '<p id="crop-dim-label" class="tg-opt-info" style="margin-bottom:8px;">Crop area: adjusting...</p>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Presets</label>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="a4p">A4 Portrait</button>' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="a4l">A4 Landscape</button>' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="letter">Letter</button>' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="square">Square</button>' +
        '<button type="button" class="tg-btn-secondary crop-preset" data-preset="169">16:9</button>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Apply to</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="crop-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="crop-pages" value="current"> First page only</label>' +
        '<label><input type="radio" name="crop-pages" value="custom"> Custom</label>' +
      '</div>' +
      '<div id="crop-custom-pages-wrap" hidden style="margin-top:6px;">' +
        '<input type="text" id="crop-custom-pages" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>' +
    '<script>' +
    '(function(){' +
      'var overlay=document.getElementById("crop-overlay");' +
      'var canvas=document.getElementById("crop-preview-canvas");' +
      'var dimLabel=document.getElementById("crop-dim-label");' +
      'if(!overlay||!canvas)return;' +
      'var isDragging=false,isResizing=false,dragStartX=0,dragStartY=0;' +
      'var cropFrac={x:0.1,y:0.1,w:0.8,h:0.8};' +
      'function updateOverlay(){' +
        'var cw=canvas.offsetWidth,ch=canvas.offsetHeight;' +
        'overlay.style.left=(cropFrac.x*cw)+"px";' +
        'overlay.style.top=(cropFrac.y*ch)+"px";' +
        'overlay.style.width=(cropFrac.w*cw)+"px";' +
        'overlay.style.height=(cropFrac.h*ch)+"px";' +
        'if(dimLabel)dimLabel.textContent="Crop area: "+Math.round(cropFrac.x*100)+"%, "+Math.round(cropFrac.y*100)+"% — "+Math.round((cropFrac.x+cropFrac.w)*100)+"%, "+Math.round((cropFrac.y+cropFrac.h)*100)+"%";' +
        'window._tgCropFrac=cropFrac;' +
      '}' +
      'overlay.addEventListener("mousedown",function(e){isDragging=true;dragStartX=e.clientX-overlay.offsetLeft;dragStartY=e.clientY-overlay.offsetTop;e.preventDefault();});' +
      'document.addEventListener("mousemove",function(e){' +
        'if(!isDragging)return;' +
        'var cw=canvas.offsetWidth,ch=canvas.offsetHeight;' +
        'var nx=(e.clientX-canvas.getBoundingClientRect().left-dragStartX);' +
        'var ny=(e.clientY-canvas.getBoundingClientRect().top-dragStartY);' +
        'cropFrac.x=Math.max(0,Math.min(nx/cw,1-cropFrac.w));' +
        'cropFrac.y=Math.max(0,Math.min(ny/ch,1-cropFrac.h));' +
        'updateOverlay();' +
      '});' +
      'document.addEventListener("mouseup",function(){isDragging=false;});' +
      'document.querySelectorAll(".crop-preset").forEach(function(btn){btn.addEventListener("click",function(){' +
        'var p=btn.dataset.preset;' +
        'if(p==="a4p"){cropFrac={x:0.05,y:0.05,w:0.9,h:0.9};}' +
        'else if(p==="a4l"){cropFrac={x:0.05,y:0.15,w:0.9,h:0.7};}' +
        'else if(p==="letter"){cropFrac={x:0.05,y:0.05,w:0.9,h:0.9};}' +
        'else if(p==="square"){var s=Math.min(0.9,0.9);cropFrac={x:0.05,y:(1-s)/2,w:s,h:s};}' +
        'else if(p==="169"){cropFrac={x:0.0,y:0.1,w:1.0,h:0.8};}' +
        'updateOverlay();' +
      '});});' +
      'var radioGroup=document.querySelectorAll("input[name=\\'crop-pages\\']");' +
      'radioGroup.forEach(function(r){r.addEventListener("change",function(){' +
        'var wrap=document.getElementById("crop-custom-pages-wrap");' +
        'if(wrap)wrap.hidden=r.value!=="custom";' +
      '});});' +
      'updateOverlay();' +
    '})();' +
    '<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var pagesMode = optionsEl.querySelector('input[name="crop-pages"]:checked');
    var customPages = optionsEl.querySelector('#crop-custom-pages');
    return {
      cropFrac: window._tgCropFrac || { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
      pagesMode: pagesMode ? pagesMode.value : 'all',
      customPagesStr: customPages ? customPages.value : '',
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
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    var allPages = pdfDoc.getPages();
    var totalPages = allPages.length;

    // Render first page to show crop preview
    var pdf4preview = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    var pg1 = await pdf4preview.getPage(1);
    var vp = pg1.getViewport({ scale: 1.0 });
    var previewCanvas = document.getElementById('crop-preview-canvas');
    if (previewCanvas) {
      var scale = Math.min(400 / vp.width, 300 / vp.height);
      var rvp = pg1.getViewport({ scale: scale });
      previewCanvas.width = rvp.width;
      previewCanvas.height = rvp.height;
      await pg1.render({ canvasContext: previewCanvas.getContext('2d'), viewport: rvp }).promise;
      // Update overlay after render
      var overlay = document.getElementById('crop-overlay');
      var cw = previewCanvas.offsetWidth || rvp.width;
      var ch = previewCanvas.offsetHeight || rvp.height;
      if (overlay) {
        var cf = options.cropFrac || { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
        overlay.style.left = (cf.x * cw) + 'px';
        overlay.style.top = (cf.y * ch) + 'px';
        overlay.style.width = (cf.w * cw) + 'px';
        overlay.style.height = (cf.h * ch) + 'px';
      }
    }

    var cf = options.cropFrac || { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };

    var targetIndices;
    if (options.pagesMode === 'current') {
      targetIndices = [0];
    } else if (options.pagesMode === 'custom' && options.customPagesStr) {
      targetIndices = parsePageRange(options.customPagesStr, totalPages);
    } else {
      targetIndices = allPages.map(function (_, i) { return i; });
    }

    for (var i = 0; i < targetIndices.length; i++) {
      onProgress && onProgress(0.2 + i / targetIndices.length * 0.7, 'Cropping page ' + (targetIndices[i] + 1) + '...');
      var page = allPages[targetIndices[i]];
      var size = page.getSize();
      var pdfLeft = cf.x * size.width;
      var pdfBottom = (1 - cf.y - cf.h) * size.height;
      var pdfWidth = cf.w * size.width;
      var pdfHeight = cf.h * size.height;
      page.setCropBox(pdfLeft, pdfBottom, pdfWidth, pdfHeight);
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/* ToolsGallery — extract-images.js
   Handler: extract-images
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'extract-images',
    downloadName: 'images.zip',
  };

  var _extractedImages = [];

  function getOptionsHTML(pageCount) {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Pages</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ei-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="ei-pages" value="specific"> Specific pages</label>' +
      '</div>' +
      '<div id="ei-pages-wrap" hidden style="margin-top:6px;">' +
        '<input type="text" id="ei-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Minimum image size (px)</label>' +
      '<select id="ei-min-size" class="tg-select">' +
        '<option value="50">50px (include small)</option>' +
        '<option value="100" selected>100px (standard)</option>' +
        '<option value="200">200px (large only)</option>' +
      '</select>' +
    '</div>' +
    '<p class="tg-opt-info">If direct image extraction fails, each page will be rendered as an image instead.</p>' +
    '<div id="ei-grid" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;"></div>' +
    '<div id="ei-download-all-wrap" hidden style="margin-top:10px;">' +
      '<button type="button" id="ei-download-all" class="tg-action-btn" style="width:auto;padding:10px 20px;">Download All as ZIP</button>' +
    '</div>' +
    '<script>' +
    '(function(){' +
      'var pagesR=document.querySelectorAll("input[name=\\'ei-pages\\']");' +
      'pagesR.forEach(function(r){r.addEventListener("change",function(){' +
        'var w=document.getElementById("ei-pages-wrap");if(w)w.hidden=r.value!=="specific";' +
      '});});' +
    '})();' +
    '<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var pagesMode = optionsEl.querySelector('input[name="ei-pages"]:checked');
    var pagesInput = optionsEl.querySelector('#ei-pages-input');
    var minSize = optionsEl.querySelector('#ei-min-size');
    return {
      pagesMode: pagesMode ? pagesMode.value : 'all',
      pagesRange: pagesInput ? pagesInput.value : '',
      minSize: minSize ? parseInt(minSize.value, 10) : 100,
    };
  }

  function parsePageRange(rangeStr, total) {
    var pages = [];
    rangeStr.split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
          if (i >= 1 && i <= total) pages.push(i);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n);
      }
    });
    return pages.length ? pages : null;
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded.');
    if (!window.JSZip) {
      await new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    _extractedImages = [];

    onProgress && onProgress(0.05, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var totalPages = pdf.numPages;

    var pageNums = (options.pagesMode === 'specific' && options.pagesRange)
      ? parsePageRange(options.pagesRange, totalPages)
      : null;
    if (!pageNums) {
      pageNums = [];
      for (var i = 1; i <= totalPages; i++) pageNums.push(i);
    }

    var minSize = options.minSize || 100;
    var imageCount = 0;
    var usePageRender = false;

    // Try operator-list extraction first
    try {
      for (var p = 0; p < Math.min(pageNums.length, 1); p++) {
        var page = await pdf.getPage(pageNums[p]);
        var ops = await page.getOperatorList();
        var imgOps = ops.fnArray.filter(function (fn) {
          return fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintJpegXObject;
        });
        if (imgOps.length === 0) usePageRender = true;
      }
    } catch (e) {
      usePageRender = true;
    }

    if (!usePageRender) {
      // Operator list approach
      for (var p = 0; p < pageNums.length; p++) {
        onProgress && onProgress(0.1 + p / pageNums.length * 0.7, 'Extracting images from page ' + pageNums[p] + '...');
        try {
          var page = await pdf.getPage(pageNums[p]);
          var ops = await page.getOperatorList();

          for (var i = 0; i < ops.fnArray.length; i++) {
            if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject || ops.fnArray[i] === pdfjsLib.OPS.paintJpegXObject) {
              var imgName = ops.argsArray[i][0];
              await new Promise(function (resolve) {
                page.objs.get(imgName, function (img) {
                  if (!img || !img.data) { resolve(); return; }
                  if (img.width < minSize || img.height < minSize) { resolve(); return; }
                  try {
                    var c = document.createElement('canvas');
                    c.width = img.width;
                    c.height = img.height;
                    var ctx = c.getContext('2d');
                    var imgData = ctx.createImageData(img.width, img.height);
                    imgData.data.set(img.data);
                    ctx.putImageData(imgData, 0, 0);
                    var dataUrl = c.toDataURL('image/png');
                    imageCount++;
                    _extractedImages.push({ dataUrl: dataUrl, name: 'image-p' + pageNums[p] + '-' + imageCount + '.png' });
                  } catch (e2) {}
                  resolve();
                });
              });
            }
          }
        } catch (e) {}
      }
    }

    // Fallback: render pages
    if (_extractedImages.length === 0) {
      usePageRender = true;
    }

    if (usePageRender) {
      for (var p = 0; p < pageNums.length; p++) {
        onProgress && onProgress(0.1 + p / pageNums.length * 0.7, 'Rendering page ' + pageNums[p] + ' as image...');
        var page = await pdf.getPage(pageNums[p]);
        var vp = page.getViewport({ scale: 2.0 });
        var c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        var dataUrl = c.toDataURL('image/png');
        imageCount++;
        _extractedImages.push({ dataUrl: dataUrl, name: 'page-' + pageNums[p] + '.png' });
      }
    }

    if (!_extractedImages.length) throw new Error('No images found in this PDF.');

    onProgress && onProgress(0.8, 'Building preview...');

    // Show thumbnails
    var grid = document.getElementById('ei-grid');
    if (grid) {
      grid.innerHTML = '';
      _extractedImages.forEach(function (img, idx) {
        var card = document.createElement('div');
        card.style.cssText = 'border:1px solid #ddd;border-radius:4px;padding:4px;text-align:center;';
        var imgEl = document.createElement('img');
        imgEl.src = img.dataUrl;
        imgEl.style.cssText = 'max-width:120px;max-height:120px;display:block;margin:0 auto;';
        var label = document.createElement('p');
        label.style.cssText = 'font-size:11px;color:#666;margin:4px 0 2px;';
        label.textContent = img.name;
        var dlBtn = document.createElement('button');
        dlBtn.type = 'button';
        dlBtn.className = 'tg-btn-secondary';
        dlBtn.style.cssText = 'font-size:11px;padding:2px 8px;';
        dlBtn.textContent = 'Download';
        dlBtn.addEventListener('click', function () {
          var a = document.createElement('a');
          a.href = img.dataUrl;
          a.download = img.name;
          a.click();
        });
        card.appendChild(imgEl);
        card.appendChild(label);
        card.appendChild(dlBtn);
        grid.appendChild(card);
      });
    }

    var dlAllWrap = document.getElementById('ei-download-all-wrap');
    if (dlAllWrap) dlAllWrap.hidden = false;

    var dlAllBtn = document.getElementById('ei-download-all');
    if (dlAllBtn) {
      dlAllBtn.addEventListener('click', async function () {
        dlAllBtn.disabled = true;
        dlAllBtn.textContent = 'Building ZIP...';
        var zip = new JSZip();
        _extractedImages.forEach(function (img) {
          var base64 = img.dataUrl.replace(/^data:image\/png;base64,/, '');
          zip.file(img.name, base64, { base64: true });
        });
        var zipData = await zip.generateAsync({ type: 'blob' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(zipData);
        a.download = 'extracted-images.zip';
        a.click();
        dlAllBtn.disabled = false;
        dlAllBtn.textContent = 'Download All as ZIP';
      });
    }

    // Return first image as the "result"
    var base64 = _extractedImages[0].dataUrl.replace(/^data:image\/png;base64,/, '');
    var bytes = Uint8Array.from(atob(base64), function (c) { return c.charCodeAt(0); });
    var blob = new Blob([bytes], { type: 'image/png' });
    return { blob: blob, filename: _extractedImages[0].name };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

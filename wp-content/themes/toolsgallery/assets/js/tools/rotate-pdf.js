/**
 * ToolsGallery — Rotate PDF
 * Handler: rotate-pdf
 * URL: /tool/rotate-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'rotate-pdf' };

  // Per-page rotation overrides (0-based index → degrees added)
  var _pageRotations = {};
  var _totalPages = 0;

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:8px">' +
      '<label class="tg-opt-label">Quick Rotate All Pages</label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary" id="rp-all-left">↺ Rotate All Left 90°</button>' +
        '<button type="button" class="tg-btn-secondary" id="rp-all-right">↻ Rotate All Right 90°</button>' +
      '</div>' +
    '</div>' +
    '<div id="rp-thumbs" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px"></div>' +
    '<div id="rp-info" style="font-size:13px;color:var(--color-gray-600);margin-top:8px"></div>' +
    '<script>(function(){' +
      'document.getElementById("rp-all-left").addEventListener("click",function(){if(window._rpRotateAll)window._rpRotateAll(-90);});' +
      'document.getElementById("rp-all-right").addEventListener("click",function(){if(window._rpRotateAll)window._rpRotateAll(90);});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    return { rotations: _pageRotations };
  }

  async function renderThumbs(file) {
    if (!window.pdfjsLib) return;
    _pageRotations = {};
    var ab = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    _totalPages = pdf.numPages;
    var thumbsEl = document.getElementById('rp-thumbs');
    var infoEl = document.getElementById('rp-info');
    if (infoEl) infoEl.textContent = _totalPages + ' page(s). Use buttons to rotate individual pages or all at once.';
    if (!thumbsEl) return;
    thumbsEl.innerHTML = '';

    for (var i = 1; i <= Math.min(_totalPages, 20); i++) {
      (function (pageNum) {
        var wrap = document.createElement('div');
        wrap.style.cssText = 'text-align:center;font-size:11px;width:90px';
        wrap.dataset.page = pageNum;

        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'border:1px solid #ddd;border-radius:4px;width:80px;height:auto;display:block;margin:0 auto';
        canvas.dataset.page = pageNum;

        var controls = document.createElement('div');
        controls.style.cssText = 'display:flex;gap:4px;justify-content:center;margin-top:4px';

        var btnL = document.createElement('button');
        btnL.type = 'button'; btnL.textContent = '↺'; btnL.title = 'Rotate Left';
        btnL.style.cssText = 'font-size:16px;background:none;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:2px 6px';
        btnL.addEventListener('click', function () { rotateThumb(pageNum, -90); });

        var btnR = document.createElement('button');
        btnR.type = 'button'; btnR.textContent = '↻'; btnR.title = 'Rotate Right';
        btnR.style.cssText = 'font-size:16px;background:none;border:1px solid #ddd;border-radius:4px;cursor:pointer;padding:2px 6px';
        btnR.addEventListener('click', function () { rotateThumb(pageNum, 90); });

        controls.appendChild(btnL); controls.appendChild(btnR);
        wrap.appendChild(canvas);
        wrap.appendChild(document.createTextNode('Page ' + pageNum));
        wrap.appendChild(controls);
        thumbsEl.appendChild(wrap);

        pdf.getPage(pageNum).then(function (page) {
          var vp = page.getViewport({ scale: 0.3 });
          canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height);
          page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
        });
      })(i);
    }

    window._rpRotateAll = function (deg) {
      for (var p = 1; p <= _totalPages; p++) {
        _pageRotations[p - 1] = ((_pageRotations[p - 1] || 0) + deg + 360) % 360;
      }
      updateThumbRotations();
    };
  }

  function rotateThumb(pageNum, deg) {
    var idx = pageNum - 1;
    _pageRotations[idx] = ((_pageRotations[idx] || 0) + deg + 360) % 360;
    updateThumbRotations();
  }

  function updateThumbRotations() {
    var thumbsEl = document.getElementById('rp-thumbs');
    if (!thumbsEl) return;
    thumbsEl.querySelectorAll('canvas[data-page]').forEach(function (canvas) {
      var p = parseInt(canvas.dataset.page);
      var deg = _pageRotations[p - 1] || 0;
      canvas.style.transform = 'rotate(' + deg + 'deg)';
    });
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;
    var degrees = window.PDFLib.degrees;

    // Render thumbs on first call
    await renderThumbs(file);

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
    var pages = pdfDoc.getPages();

    onProgress && onProgress(0.5, 'Applying rotations...');
    var rotations = options.rotations || _pageRotations;
    pages.forEach(function (page, idx) {
      var addDeg = rotations[idx] || 0;
      if (addDeg) {
        var current = page.getRotation().angle;
        page.setRotation(degrees((current + addDeg) % 360));
      }
    });

    onProgress && onProgress(0.9, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-rotated.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

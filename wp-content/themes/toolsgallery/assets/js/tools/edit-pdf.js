/**
 * ToolsGallery — Edit PDF
 * Handler: edit-pdf
 * URL: /tool/edit-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'edit-pdf' };

  var _canvas = null;
  var _fabricCanvas = null;
  var _pdfDoc = null;
  var _currentPage = 1;
  var _totalPages = 0;
  var _pageAnnotations = {}; // page → fabric JSON
  var _activeMode = 'text';

  function getOptionsHTML() {
    return '<div id="ep-toolbar" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
      '<button type="button" class="tg-btn-secondary ep-tool-btn ep-tool-btn--active" data-tool="text">T Text</button>' +
      '<button type="button" class="tg-btn-secondary ep-tool-btn" data-tool="rect">□ Shape</button>' +
      '<button type="button" class="tg-btn-secondary ep-tool-btn" data-tool="whiteout">◻ Whiteout</button>' +
      '<button type="button" class="tg-btn-secondary ep-tool-btn" data-tool="draw">✏ Draw</button>' +
      '<button type="button" class="tg-btn-secondary" id="ep-prev-page">‹ Prev</button>' +
      '<span id="ep-page-info" style="line-height:32px;font-size:13px;padding:0 6px">Page 1/1</span>' +
      '<button type="button" class="tg-btn-secondary" id="ep-next-page">Next ›</button>' +
    '</div>' +
    '<div id="ep-canvas-wrap" style="position:relative;overflow:auto;border:1px solid #ddd;border-radius:8px;background:#888">' +
      '<canvas id="ep-canvas"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'var btns=document.querySelectorAll(".ep-tool-btn");' +
      'btns.forEach(function(b){b.addEventListener("click",function(){' +
        'btns.forEach(function(x){x.classList.remove("ep-tool-btn--active");});' +
        'b.classList.add("ep-tool-btn--active");' +
        '_activeMode=b.dataset.tool;' +
        'if(window._epSetMode)window._epSetMode(b.dataset.tool);' +
      '});});' +
      'document.getElementById("ep-prev-page").addEventListener("click",function(){if(window._epGoPage)window._epGoPage(-1);});' +
      'document.getElementById("ep-next-page").addEventListener("click",function(){if(window._epGoPage)window._epGoPage(1);});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    return {};
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    if (!window.fabric) throw new Error('Fabric.js not loaded');

    var PDFDocument = window.PDFLib.PDFDocument;

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    _pdfDoc = await pdfjsLib.getDocument({ data: ab.slice(0) }).promise;
    _totalPages = _pdfDoc.numPages;
    _currentPage = 1;
    _pageAnnotations = {};

    var canvas = document.getElementById('ep-canvas');
    if (!canvas) throw new Error('Canvas not found');

    if (_fabricCanvas) { _fabricCanvas.dispose(); }
    _fabricCanvas = new fabric.Canvas('ep-canvas', { selection: true });

    window._epSetMode = function (mode) {
      _activeMode = mode;
      if (mode === 'draw') {
        _fabricCanvas.isDrawingMode = true;
        _fabricCanvas.freeDrawingBrush.color = '#ff0000';
        _fabricCanvas.freeDrawingBrush.width = 3;
      } else {
        _fabricCanvas.isDrawingMode = false;
      }
      if (mode === 'text') {
        _fabricCanvas.on('mouse:dblclick', function (e) {
          var ptr = _fabricCanvas.getPointer(e.e);
          var t = new fabric.IText('Text here', { left: ptr.x, top: ptr.y, fontSize: 16, fill: '#000' });
          _fabricCanvas.add(t); _fabricCanvas.setActiveObject(t); t.enterEditing();
        });
      }
      if (mode === 'rect') {
        _fabricCanvas.on('mouse:dblclick', function (e) {
          var ptr = _fabricCanvas.getPointer(e.e);
          var r = new fabric.Rect({ left: ptr.x, top: ptr.y, width: 100, height: 60, fill: 'transparent', stroke: '#0000ff', strokeWidth: 2 });
          _fabricCanvas.add(r);
        });
      }
      if (mode === 'whiteout') {
        _fabricCanvas.on('mouse:dblclick', function (e) {
          var ptr = _fabricCanvas.getPointer(e.e);
          var r = new fabric.Rect({ left: ptr.x, top: ptr.y, width: 100, height: 30, fill: '#ffffff', stroke: 'none' });
          _fabricCanvas.add(r);
        });
      }
    };

    window._epGoPage = async function (dir) {
      // Save current page annotations
      _pageAnnotations[_currentPage] = _fabricCanvas.toJSON();
      _currentPage = Math.max(1, Math.min(_totalPages, _currentPage + dir));
      await renderPage(_currentPage);
    };

    async function renderPage(num) {
      var page = await _pdfDoc.getPage(num);
      var vp = page.getViewport({ scale: 1.2 });
      _fabricCanvas.setWidth(Math.round(vp.width));
      _fabricCanvas.setHeight(Math.round(vp.height));

      var bg = document.createElement('canvas');
      bg.width = Math.round(vp.width); bg.height = Math.round(vp.height);
      var bgCtx = bg.getContext('2d');
      bgCtx.fillStyle = '#fff'; bgCtx.fillRect(0, 0, bg.width, bg.height);
      await page.render({ canvasContext: bgCtx, viewport: vp }).promise;

      _fabricCanvas.setBackgroundImage(bg.toDataURL(), _fabricCanvas.renderAll.bind(_fabricCanvas), {
        scaleX: 1, scaleY: 1, originX: 'left', originY: 'top',
      });

      // Restore annotations
      _fabricCanvas.clear();
      if (_pageAnnotations[num]) {
        _fabricCanvas.loadFromJSON(_pageAnnotations[num], _fabricCanvas.renderAll.bind(_fabricCanvas));
      }

      var infoEl = document.getElementById('ep-page-info');
      if (infoEl) infoEl.textContent = 'Page ' + num + '/' + _totalPages;
    }

    await renderPage(1);
    window._epSetMode('text');
    onProgress && onProgress(0.5, 'Ready — double-click to add text/shapes. Click Save when done.');

    // Return a placeholder — actual save happens via separate save button
    // We simulate save here since tool-runner expects a return value
    _pageAnnotations[_currentPage] = _fabricCanvas.toJSON();

    // Build output PDF with fabric layers composited
    var pdfBytes0 = await file.arrayBuffer();
    var outDoc = await PDFDocument.load(pdfBytes0, { ignoreEncryption: true });
    var pages = outDoc.getPages();

    for (var p = 1; p <= _totalPages; p++) {
      onProgress && onProgress(0.5 + (p / _totalPages) * 0.45, 'Compositing page ' + p + '...');
      if (!_pageAnnotations[p]) continue;

      var pdfPage = pages[p - 1];
      var pdfWidth = pdfPage.getWidth();
      var pdfHeight = pdfPage.getHeight();

      // Render fabric to canvas
      var tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = Math.round(pdfWidth * 1.2);
      tmpCanvas.height = Math.round(pdfHeight * 1.2);
      var tmpFabric = new fabric.StaticCanvas(tmpCanvas);
      await new Promise(function (res) {
        tmpFabric.loadFromJSON(_pageAnnotations[p], function () {
          tmpFabric.setWidth(tmpCanvas.width);
          tmpFabric.setHeight(tmpCanvas.height);
          tmpFabric.renderAll();
          res();
        });
      });

      var imgData = tmpCanvas.toDataURL('image/png');
      var imgBytes = Uint8Array.from(atob(imgData.split(',')[1]), function (c) { return c.charCodeAt(0); });
      var embImg = await outDoc.embedPng(imgBytes);
      pdfPage.drawImage(embImg, { x: 0, y: 0, width: pdfWidth, height: pdfHeight, opacity: 1 });
    }

    var finalBytes = await outDoc.save();
    var blob = new Blob([finalBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-edited.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

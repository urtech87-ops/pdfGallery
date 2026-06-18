/**
 * ============================================================
 * ToolsGallery — Edit PDF Tool
 * ============================================================
 * Handler key: edit-pdf
 * Tool URL: /tool/edit-pdf/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-lib (PDFLib), pdf.js (pdfjsLib), fabric.js (fabric)
 * ============================================================
 */
(function () {
  'use strict';

  /* Module state */
  var editPdfOps           = [];
  var editPdfDeleted       = [];
  var editPdfRotations     = {};
  var editPdfPageIdx       = 0;
  var editPdfPdfDoc        = null;
  var editPdfFabric        = null;
  var editPdfPageObjects   = {};
  var editPdfRenderScale   = 1.5;
  var editPdfUndoHistory   = [];
  var editPdfRedoHistory   = [];
  var renderedHeights      = {};
  var toolBoxRef           = null;

  function pushUndo() {
    if (!editPdfFabric) return;
    editPdfUndoHistory.push(JSON.stringify(editPdfFabric.toJSON(['tgType', 'tgData'])));
    editPdfRedoHistory = [];
  }

  function doUndo() {
    if (!editPdfFabric || !editPdfUndoHistory.length) return;
    editPdfRedoHistory.push(JSON.stringify(editPdfFabric.toJSON(['tgType', 'tgData'])));
    var prev = JSON.parse(editPdfUndoHistory.pop());
    editPdfFabric.loadFromJSON(prev, function () { editPdfFabric.renderAll(); });
  }

  function doRedo() {
    if (!editPdfFabric || !editPdfRedoHistory.length) return;
    editPdfUndoHistory.push(JSON.stringify(editPdfFabric.toJSON(['tgType', 'tgData'])));
    var next = JSON.parse(editPdfRedoHistory.pop());
    editPdfFabric.loadFromJSON(next, function () { editPdfFabric.renderAll(); });
  }

  function setupFabricCanvas(wrap, w, h, onMouseDown) {
    if (editPdfFabric) {
      try { editPdfFabric.dispose(); } catch (e) {}
      editPdfFabric = null;
    }
    var fc = new fabric.Canvas('pdf-edit-canvas', { selection: true, preserveObjectStacking: true });
    fc.setWidth(w);
    fc.setHeight(h);
    if (fc.wrapperEl) {
      fc.wrapperEl.style.position = 'absolute';
      fc.wrapperEl.style.top  = '0';
      fc.wrapperEl.style.left = '0';
      fc.wrapperEl.style.zIndex = '10';
    }
    editPdfFabric = fc;
    fc.on('mouse:down', onMouseDown);
    return fc;
  }

  function buildEditSidePanel(wrap, pdfDoc, file) {
    var side = wrap.querySelector('#ep-side');
    if (!side) return;
    side.innerHTML = '';
    window.TGPdfTools.renderAllThumbnails(file, 0.15, null).then(function (pages) {
      pages.forEach(function (p, idx) {
        var card = document.createElement('div');
        card.className = 'tg-ep-thumb';
        card.style.cssText = 'border:2px solid ' + (idx === editPdfPageIdx ? '#E07B39' : '#ccc') + ';border-radius:4px;padding:3px;margin-bottom:6px;cursor:pointer;text-align:center;opacity:' + (editPdfDeleted.indexOf(idx) !== -1 ? '0.4' : '1');
        var tc = p.canvas.cloneNode(true);
        tc.style.cssText = 'max-width:90px;height:auto;display:block;margin:0 auto';
        card.appendChild(tc);
        var sp = document.createElement('span');
        sp.style.cssText = 'font-size:10px;color:#666';
        sp.textContent = idx + 1;
        card.appendChild(sp);
        card.addEventListener('click', function () { navigateEditPage(wrap, idx, pdfDoc, file); });
        side.appendChild(card);
      });
    });
  }

  function renderEditPage(wrap, pageIdx, pdfDoc, file, onMouseDown) {
    if (!pdfDoc) return;
    pdfDoc.getPage(pageIdx + 1).then(function (page) {
      var viewport  = page.getViewport({ scale: editPdfRenderScale });
      var pdfCanvas = wrap.querySelector('#pdf-base-canvas');
      if (!pdfCanvas) return;
      pdfCanvas.width  = viewport.width;
      pdfCanvas.height = viewport.height;
      renderedHeights[pageIdx] = viewport.height;
      var cw = wrap.querySelector('#ep-canvas-wrap');
      if (cw) { cw.style.width = viewport.width + 'px'; cw.style.height = viewport.height + 'px'; }
      page.render({ canvasContext: pdfCanvas.getContext('2d'), viewport: viewport }).promise.then(function () {
        var fc = setupFabricCanvas(wrap, viewport.width, viewport.height, onMouseDown);
        if (editPdfPageObjects[pageIdx]) {
          fc.loadFromJSON(editPdfPageObjects[pageIdx], function () { fc.renderAll(); });
        }
        var lbl = wrap.querySelector('#ep-page-label');
        if (lbl) lbl.textContent = 'Page ' + (pageIdx + 1) + ' of ' + pdfDoc.numPages;
        var dp = wrap.querySelector('#ep-del-page');
        if (dp) dp.textContent = editPdfDeleted.indexOf(pageIdx) !== -1 ? '✓ Restore page' : '🗑 Delete page';
      });
    });
  }

  function navigateEditPage(wrap, newIdx, pdfDoc, file, onMouseDown) {
    if (editPdfFabric) editPdfPageObjects[editPdfPageIdx] = editPdfFabric.toJSON(['tgType', 'tgData']);
    editPdfPageIdx = newIdx;
    editPdfUndoHistory = []; editPdfRedoHistory = [];
    renderEditPage(wrap, newIdx, pdfDoc, file, onMouseDown);
    wrap.querySelectorAll('.tg-ep-thumb').forEach(function (c, ci) {
      c.style.borderColor = ci === newIdx ? '#E07B39' : '#ccc';
    });
  }

  function onFileReady(file, toolBox) {
    toolBoxRef = toolBox;
    var existing = toolBox.querySelector('.tg-edit-pdf-wrap');
    if (existing) existing.parentNode.removeChild(existing);

    editPdfOps = []; editPdfDeleted = []; editPdfRotations = {}; editPdfPageIdx = 0;
    editPdfPageObjects = {}; editPdfUndoHistory = []; editPdfRedoHistory = [];
    renderedHeights = {};

    var wrap = document.createElement('div');
    wrap.className = 'tg-edit-pdf-wrap';
    wrap.style.cssText = 'margin-top:12px';
    wrap.innerHTML =
      '<div class="tg-edit-toolbar" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f5f5f5;border-radius:6px;margin-bottom:0;position:sticky;top:0;z-index:10;align-items:center;border-bottom:2px solid #E07B39">' +
        '<button type="button" class="tg-ep-mode-btn tg-btn-xs" data-mode="text">✏ Text</button>' +
        '<button type="button" class="tg-ep-mode-btn tg-btn-xs" data-mode="highlight">🖍 Highlight</button>' +
        '<button type="button" class="tg-ep-mode-btn tg-btn-xs" data-mode="whiteout">⬜ Whiteout</button>' +
        '<div style="position:relative;display:inline-block">' +
          '<button type="button" id="ep-shapes-btn" class="tg-btn-xs">⬡ Shapes ▾</button>' +
          '<div id="ep-shapes-menu" style="display:none;position:absolute;top:100%;left:0;background:#fff;border:1px solid #ddd;border-radius:4px;z-index:20;min-width:130px;box-shadow:0 2px 8px rgba(0,0,0,.15);margin-top:2px">' +
            '<button type="button" class="tg-ep-mode-btn" data-mode="rectangle" style="display:block;width:100%;text-align:left;padding:7px 12px;border:none;background:none;cursor:pointer;font-size:13px">▭ Rectangle</button>' +
            '<button type="button" class="tg-ep-mode-btn" data-mode="ellipse"   style="display:block;width:100%;text-align:left;padding:7px 12px;border:none;background:none;cursor:pointer;font-size:13px">⬤ Ellipse</button>' +
            '<button type="button" class="tg-ep-mode-btn" data-mode="line"      style="display:block;width:100%;text-align:left;padding:7px 12px;border:none;background:none;cursor:pointer;font-size:13px">╱ Line</button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="tg-ep-mode-btn tg-btn-xs" data-mode="sign">✍ Sign</button>' +
        '<button type="button" class="tg-btn-xs" id="ep-insert-img" title="Insert image">🖼 Image</button>' +
        '<span style="width:1px;height:22px;background:#ccc;flex-shrink:0"></span>' +
        '<select id="ep-font" class="tg-select" style="font-size:12px"><option value="Helvetica">Helvetica</option><option value="TimesRoman">Times Roman</option><option value="Courier">Courier</option></select>' +
        '<select id="ep-fontsize" class="tg-select" style="font-size:12px;width:58px"><option>8</option><option>10</option><option value="12" selected>12</option><option>14</option><option>16</option><option>18</option><option>24</option><option>36</option><option>48</option></select>' +
        '<input type="color" id="ep-color" value="#000000" title="Color" style="width:30px;height:26px;padding:0;border:1px solid #ccc;cursor:pointer;border-radius:3px">' +
        '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" id="ep-bold"> Bold</label>' +
        '<span style="width:1px;height:22px;background:#ccc;flex-shrink:0"></span>' +
        '<button type="button" class="tg-btn-xs" id="ep-undo">↩ Undo</button>' +
        '<button type="button" class="tg-btn-xs" id="ep-redo">↪ Redo</button>' +
        '<input type="file" id="ep-img-input" accept="image/*" style="display:none">' +
      '</div>' +
      '<div id="ep-hint" style="background:#E07B39;color:#fff;padding:7px 14px;font-size:13px;font-weight:500;border-radius:0 0 4px 4px;margin-bottom:8px">💡 Click anywhere on the page to add text</div>' +
      '<div style="display:flex;gap:10px">' +
        '<div class="tg-edit-sidepanel" style="width:110px;flex-shrink:0;overflow-y:auto;max-height:600px;border:1px solid #eee;border-radius:4px;padding:4px" id="ep-side"></div>' +
        '<div style="flex:1;overflow-x:auto">' +
          '<div class="tg-edit-canvas-wrap" style="position:relative;display:inline-block" id="ep-canvas-wrap">' +
            '<canvas id="pdf-base-canvas" style="display:block"></canvas>' +
            '<canvas id="pdf-edit-canvas" style="position:absolute;top:0;left:0;cursor:text"></canvas>' +
          '</div>' +
          '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<button type="button" class="tg-btn-xs" id="ep-prev">◀ Prev</button>' +
            '<span id="ep-page-label" style="font-size:13px">Page 1</span>' +
            '<button type="button" class="tg-btn-xs" id="ep-next">Next ▶</button>' +
            '<button type="button" class="tg-btn-xs" id="ep-del-page" style="margin-left:12px;color:#c00">🗑 Delete page</button>' +
            '<button type="button" class="tg-btn-xs" id="ep-zoom-in">🔍+</button>' +
            '<button type="button" class="tg-btn-xs" id="ep-zoom-out">🔍−</button>' +
            '<button type="button" class="tg-btn-xs" id="ep-rot-cw">↻ Rotate</button>' +
          '</div>' +
          '<div id="ep-sign-pad" style="display:none;margin-top:8px;border:1px solid #ccc;border-radius:4px;padding:8px">' +
            '<p style="margin:0 0 6px;font-size:13px;font-weight:600">Draw your signature:</p>' +
            '<canvas id="ep-sig-canvas" width="400" height="120" style="border:1px solid #ddd;background:#fff;cursor:crosshair;touch-action:none"></canvas>' +
            '<div style="margin-top:6px;display:flex;gap:6px">' +
              '<button type="button" class="tg-btn-xs" id="ep-sig-clear">Clear</button>' +
              '<button type="button" class="tg-btn-xs" id="ep-sig-add">Add to PDF</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var actionBtn = toolBox.querySelector('.tg-action-btn');
    if (actionBtn && actionBtn.parentNode) actionBtn.parentNode.insertBefore(wrap, actionBtn);

    var currentMode = 'text';
    var hintFirstTextAdded = false;
    var colorEl   = wrap.querySelector('#ep-color');
    var fontEl    = wrap.querySelector('#ep-font');
    var sizeEl    = wrap.querySelector('#ep-fontsize');
    var boldEl    = wrap.querySelector('#ep-bold');
    var imgInput  = wrap.querySelector('#ep-img-input');
    var signPad   = wrap.querySelector('#ep-sign-pad');
    var sigCanvas = wrap.querySelector('#ep-sig-canvas');
    var hintEl    = wrap.querySelector('#ep-hint');
    var shapesBtn = wrap.querySelector('#ep-shapes-btn');
    var shapesMenu= wrap.querySelector('#ep-shapes-menu');
    var modeBtns  = wrap.querySelectorAll('.tg-ep-mode-btn');

    function updateCursor(mode) {
      var upperCanvas = wrap.querySelector('.upper-canvas');
      var cur = (mode === 'text') ? 'text' : (['highlight','whiteout','rectangle','ellipse','line'].indexOf(mode) !== -1 ? 'crosshair' : 'default');
      if (upperCanvas) upperCanvas.style.cursor = cur;
      var ec = wrap.querySelector('#pdf-edit-canvas');
      if (ec) ec.style.cursor = cur;
    }

    function setMode(mode) {
      currentMode = mode;
      modeBtns.forEach(function (btn) {
        var bm = btn.getAttribute('data-mode');
        btn.style.background = bm === mode ? '#E07B39' : '';
        btn.style.color      = bm === mode ? '#fff'    : '';
      });
      if (shapesBtn) {
        var isShape = ['rectangle','ellipse','line'].indexOf(mode) !== -1;
        shapesBtn.style.background = isShape ? '#E07B39' : '';
        shapesBtn.style.color      = isShape ? '#fff'    : '';
      }
      if (hintEl) {
        var hintMap = {
          text:       '💡 Click anywhere on the page to add text',
          highlight:  '💡 Click and drag to highlight an area',
          whiteout:   '💡 Click and drag to cover content',
          rectangle:  '💡 Click and drag to draw a shape',
          ellipse:    '💡 Click and drag to draw a shape',
          line:       '💡 Click and drag to draw a shape',
          sign:       '💡 Draw your signature below, then drag it into position',
        };
        if (mode === 'text' && hintFirstTextAdded) { hintEl.style.display = 'none'; }
        else { hintEl.textContent = hintMap[mode] || ''; hintEl.style.display = hintMap[mode] ? '' : 'none'; }
      }
      updateCursor(mode);
      if (signPad) signPad.style.display = mode === 'sign' ? '' : 'none';
    }

    function onFabricMouseDown(e) {
      if (!editPdfFabric || e.target) return;
      var color    = colorEl ? colorEl.value : '#000000';
      var fontSize = sizeEl  ? parseInt(sizeEl.value, 10) : 12;
      var fontName = fontEl  ? fontEl.value  : 'Helvetica';
      var isBold   = boldEl  ? boldEl.checked : false;

      if (currentMode === 'text') {
        var pointer  = editPdfFabric.getPointer(e.e);
        var fbFamily = fontName.replace('TimesRoman', 'Times New Roman');
        var itext    = new fabric.IText('Click to edit', {
          left: pointer.x, top: pointer.y,
          fontFamily: fbFamily, fontSize: fontSize, fill: color,
          fontWeight: isBold ? 'bold' : 'normal', editable: true, selectable: true,
        });
        itext.tgType = 'text';
        itext.tgData = { fontName: fontName, bold: isBold };
        editPdfFabric.add(itext);
        editPdfFabric.setActiveObject(itext);
        itext.enterEditing(); itext.selectAll(); editPdfFabric.renderAll();
        if (!hintFirstTextAdded) { hintFirstTextAdded = true; if (hintEl) hintEl.style.display = 'none'; }
        itext.on('editing:exited', function () { pushUndo(); });
        return;
      }

      var pointer2 = editPdfFabric.getPointer(e.e);
      var sx = pointer2.x, sy = pointer2.y, shape = null;
      if (currentMode === 'whiteout')   { shape = new fabric.Rect({ left:sx, top:sy, width:1, height:1, fill:'rgba(255,255,255,1)', selectable:false }); shape.tgType = 'whiteout'; }
      else if (currentMode === 'highlight')  { shape = new fabric.Rect({ left:sx, top:sy, width:1, height:1, fill:'rgba(255,255,0,0.35)', selectable:false }); shape.tgType = 'highlight'; }
      else if (currentMode === 'rectangle') { shape = new fabric.Rect({ left:sx, top:sy, width:1, height:1, fill:'transparent', stroke:color, strokeWidth:2, selectable:false }); shape.tgType = 'rect'; }
      else if (currentMode === 'ellipse')   { shape = new fabric.Ellipse({ left:sx, top:sy, rx:1, ry:1, fill:'transparent', stroke:color, strokeWidth:2, selectable:false }); shape.tgType = 'ellipse'; }
      else if (currentMode === 'line')      { shape = new fabric.Line([sx,sy,sx,sy], { stroke:color, strokeWidth:2, selectable:false }); shape.tgType = 'line'; }

      if (shape) {
        editPdfFabric.add(shape);
        var onMove = function (me) {
          var p = editPdfFabric.getPointer(me.e);
          if (['whiteout','highlight','rectangle'].indexOf(currentMode) !== -1) {
            shape.set({ width: Math.max(1, Math.abs(p.x-sx)), height: Math.max(1, Math.abs(p.y-sy)), left: Math.min(p.x,sx), top: Math.min(p.y,sy) });
          } else if (currentMode === 'ellipse') {
            shape.set({ rx: Math.max(1, Math.abs(p.x-sx)/2), ry: Math.max(1, Math.abs(p.y-sy)/2), left: Math.min(p.x,sx), top: Math.min(p.y,sy) });
          } else if (currentMode === 'line') {
            shape.set({ x2: p.x, y2: p.y });
          }
          editPdfFabric.renderAll();
        };
        editPdfFabric.on('mouse:move', onMove);
        editPdfFabric.once('mouse:up', function () {
          editPdfFabric.off('mouse:move', onMove);
          shape.set('selectable', true);
          editPdfFabric.setActiveObject(shape); editPdfFabric.renderAll(); pushUndo();
        });
      }
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var mode = btn.getAttribute('data-mode');
        if (!mode) return;
        if (shapesMenu) shapesMenu.style.display = 'none';
        setMode(mode); e.stopPropagation();
      });
    });

    if (shapesBtn) {
      shapesBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (shapesMenu) shapesMenu.style.display = (shapesMenu.style.display === 'block') ? 'none' : 'block';
      });
    }
    document.addEventListener('click', function () { if (shapesMenu) shapesMenu.style.display = 'none'; });

    var insertImgBtn = wrap.querySelector('#ep-insert-img');
    if (insertImgBtn) insertImgBtn.addEventListener('click', function () { if (imgInput) imgInput.click(); });
    if (imgInput) imgInput.addEventListener('change', function () {
      var f = imgInput.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var dataUrl = ev.target.result;
        var isPng   = f.name.toLowerCase().endsWith('.png');
        fabric.Image.fromURL(dataUrl, function (img) {
          img.set({ left: 50, top: 50, scaleX: 1, scaleY: 1 });
          img.tgType = 'image';
          img.tgData = { imageData: null, isPng: isPng, dataUrl: dataUrl };
          f.arrayBuffer().then(function (imgAb) { img.tgData.imageData = new Uint8Array(imgAb); });
          if (editPdfFabric) { editPdfFabric.add(img); editPdfFabric.renderAll(); pushUndo(); }
        });
      };
      reader.readAsDataURL(f);
      imgInput.value = '';
    });

    if (sigCanvas) {
      var sigCtx = sigCanvas.getContext('2d');
      var sigDrawing = false;
      sigCtx.strokeStyle = '#000'; sigCtx.lineWidth = 2; sigCtx.lineCap = 'round';
      sigCanvas.addEventListener('mousedown', function (e) { sigDrawing = true; sigCtx.beginPath(); sigCtx.moveTo(e.offsetX, e.offsetY); });
      sigCanvas.addEventListener('mousemove', function (e) { if (!sigDrawing) return; sigCtx.lineTo(e.offsetX, e.offsetY); sigCtx.stroke(); });
      sigCanvas.addEventListener('mouseup',    function () { sigDrawing = false; });
      sigCanvas.addEventListener('mouseleave', function () { sigDrawing = false; });
      var sigClear = wrap.querySelector('#ep-sig-clear');
      if (sigClear) sigClear.addEventListener('click', function () { sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height); });
      var sigAdd = wrap.querySelector('#ep-sig-add');
      if (sigAdd) sigAdd.addEventListener('click', function () {
        var dataUrl2 = sigCanvas.toDataURL('image/png');
        fabric.Image.fromURL(dataUrl2, function (img) {
          img.set({ left: 50, top: 50, scaleX: 0.5, scaleY: 0.5 });
          img.tgType = 'signature';
          var bs = atob(dataUrl2.split(',')[1]), arr = new Uint8Array(bs.length);
          for (var bi = 0; bi < bs.length; bi++) arr[bi] = bs.charCodeAt(bi);
          img.tgData = { imageData: arr, isPng: true };
          if (editPdfFabric) { editPdfFabric.add(img); editPdfFabric.renderAll(); pushUndo(); }
        });
        if (signPad) signPad.style.display = 'none';
        setMode('text');
      });
    }

    wrap.querySelector('#ep-undo') && wrap.querySelector('#ep-undo').addEventListener('click', doUndo);
    wrap.querySelector('#ep-redo') && wrap.querySelector('#ep-redo').addEventListener('click', doRedo);

    document.addEventListener('keydown', function (e) {
      if (!toolBox.querySelector('.tg-edit-pdf-wrap')) return;
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { doUndo(); e.preventDefault(); return; }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) { doRedo(); e.preventDefault(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && editPdfFabric) {
        var ao = editPdfFabric.getActiveObject();
        if (ao && ao.type !== 'i-text') { pushUndo(); editPdfFabric.remove(ao); editPdfFabric.renderAll(); e.preventDefault(); }
      }
    });

    var prevBtn   = wrap.querySelector('#ep-prev');
    var nextBtn   = wrap.querySelector('#ep-next');
    var delPgBtn  = wrap.querySelector('#ep-del-page');
    var zoomInBtn = wrap.querySelector('#ep-zoom-in');
    var zoomOutBtn= wrap.querySelector('#ep-zoom-out');
    var rotCwBtn  = wrap.querySelector('#ep-rot-cw');

    file.arrayBuffer().then(function (ab) {
      return pdfjsLib.getDocument({ data: ab }).promise;
    }).then(function (pdfDoc) {
      editPdfPdfDoc = pdfDoc;
      toolBox.dataset.pageCount = pdfDoc.numPages;

      renderEditPage(wrap, 0, pdfDoc, file, onFabricMouseDown);
      buildEditSidePanel(wrap, pdfDoc, file);

      if (prevBtn) prevBtn.addEventListener('click', function () {
        if (editPdfPageIdx > 0) navigateEditPage(wrap, editPdfPageIdx - 1, pdfDoc, file, onFabricMouseDown);
      });
      if (nextBtn) nextBtn.addEventListener('click', function () {
        if (editPdfPageIdx < pdfDoc.numPages - 1) navigateEditPage(wrap, editPdfPageIdx + 1, pdfDoc, file, onFabricMouseDown);
      });
      if (delPgBtn) delPgBtn.addEventListener('click', function () {
        var actv = pdfDoc.numPages - editPdfDeleted.length;
        if (actv <= 1) { return; }
        var idx2 = editPdfDeleted.indexOf(editPdfPageIdx);
        if (idx2 === -1) editPdfDeleted.push(editPdfPageIdx);
        else editPdfDeleted.splice(idx2, 1);
        delPgBtn.textContent = editPdfDeleted.indexOf(editPdfPageIdx) !== -1 ? '✓ Restore page' : '🗑 Delete page';
        buildEditSidePanel(wrap, pdfDoc, file);
      });
      if (zoomInBtn)  zoomInBtn.addEventListener('click',  function () { editPdfRenderScale = Math.min(editPdfRenderScale + 0.25, 4); renderEditPage(wrap, editPdfPageIdx, pdfDoc, file, onFabricMouseDown); });
      if (zoomOutBtn) zoomOutBtn.addEventListener('click', function () { editPdfRenderScale = Math.max(editPdfRenderScale - 0.25, 0.5); renderEditPage(wrap, editPdfPageIdx, pdfDoc, file, onFabricMouseDown); });
      if (rotCwBtn)   rotCwBtn.addEventListener('click', function () {
        editPdfRotations[editPdfPageIdx] = ((editPdfRotations[editPdfPageIdx] || 0) + 90) % 360;
        rotCwBtn.textContent = '↻ ' + (editPdfRotations[editPdfPageIdx] || 0) + '°';
      });
    }).catch(function () {
      wrap.innerHTML += '<p style="color:red">Could not load PDF for editing.</p>';
    });

    setMode('text');
  }

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;

    if (editPdfFabric) {
      editPdfPageObjects[editPdfPageIdx] = editPdfFabric.toJSON(['tgType', 'tgData']);
    }

    onProgress(20, 'Processing edits…');
    var scale = editPdfRenderScale;
    var ops   = [];

    Object.keys(editPdfPageObjects).forEach(function (pgIdx) {
      var pgIdxN = parseInt(pgIdx, 10);
      var json   = editPdfPageObjects[pgIdx];
      var rh     = renderedHeights[pgIdx] || 800;
      var objects = (json && json.objects) ? json.objects : [];
      objects.forEach(function (j) {
        var tgType = j.tgType, tgData = j.tgData || {};
        if (tgType === 'text') {
          ops.push({ type:'text', pageIndex:pgIdxN, text:j.text, x:j.left/scale, y:(rh-j.top-(j.fontSize||12))/scale, size:j.fontSize||12, color:j.fill||'#000000', fontName:tgData.fontName||'Helvetica', bold:!!tgData.bold });
        } else if (tgType === 'whiteout' || tgType === 'highlight' || tgType === 'rect') {
          var fill = j.fill || (tgType === 'highlight' ? '#FFFF00' : '#FFFFFF');
          ops.push({ type:'rect', pageIndex:pgIdxN, x:j.left/scale, y:j.top/scale, width:j.width*(j.scaleX||1)/scale, height:j.height*(j.scaleY||1)/scale, color:fill, fill:true, opacity:j.opacity||(tgType==='highlight'?0.3:1), borderColor:j.stroke||null, borderWidth:j.strokeWidth||0 });
        } else if (tgType === 'image' || tgType === 'signature') {
          if (tgData && tgData.imageData) {
            ops.push({ type:'image', pageIndex:pgIdxN, x:j.left/scale, y:j.top/scale, width:j.width*(j.scaleX||1)/scale, height:j.height*(j.scaleY||1)/scale, imageData:tgData.imageData, isPng:tgData.isPng!==false });
          }
        } else if (tgType === 'line') {
          ops.push({ type:'line', pageIndex:pgIdxN, x1:(j.left+j.x1)/scale, y1:j.top/scale, x2:(j.left+j.x2)/scale, y2:(j.top+j.height*(j.scaleY||1))/scale, color:j.stroke||'#000000', thickness:j.strokeWidth||1 });
        } else if (tgType === 'ellipse') {
          ops.push({ type:'ellipse', pageIndex:pgIdxN, x:(j.left+j.width/2*(j.scaleX||1))/scale, y:(rh-j.top-j.height/2*(j.scaleY||1))/scale, rx:(j.rx||0)*(j.scaleX||1)/scale, ry:(j.ry||0)*(j.scaleY||1)/scale, color:j.stroke||'#000000', borderWidth:j.strokeWidth||1 });
        }
      });
    });

    onProgress(50, 'Saving PDF…');
    var blob = await window.TGPdfTools.applyEditsAndSave(files[0], ops, editPdfDeleted.slice(), editPdfRotations);
    onSuccess(blob, 'edited.pdf');
  }

  function getOptionsHTML() { return ''; }
  function getOptions() { return {}; }

  function reset(toolBox) {
    editPdfOps = []; editPdfDeleted = []; editPdfRotations = {}; editPdfPageIdx = 0;
    editPdfPdfDoc = null; editPdfPageObjects = {}; editPdfUndoHistory = []; editPdfRedoHistory = [];
    renderedHeights = {};
    if (editPdfFabric) { try { editPdfFabric.dispose(); } catch (e) {} editPdfFabric = null; }
    var ew = toolBox ? toolBox.querySelector('.tg-edit-pdf-wrap') : null;
    if (ew) ew.parentNode.removeChild(ew);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['edit-pdf'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, reset: reset };
})();

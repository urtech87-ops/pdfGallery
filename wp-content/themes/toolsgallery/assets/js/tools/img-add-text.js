/**
 * ToolsGallery — Add Text to Image
 * Handler: img-add-text
 * URL: /tool/add-text-to-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-add-text' };
  var _fabricCanvas = null;
  var _scale = 1;
  var _history = [];
  var _future = [];

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-text">Text</label>' +
      '<input type="text" id="iat-text" class="tg-text-input" placeholder="Enter text..." value="Your Text Here">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-font">Font</label>' +
      '<select id="iat-font" class="tg-select">' +
        '<option value="Arial">Arial</option>' +
        '<option value="Impact">Impact</option>' +
        '<option value="Georgia">Georgia</option>' +
        '<option value="Times New Roman">Times New Roman</option>' +
        '<option value="Courier New">Courier New</option>' +
        '<option value="Verdana">Verdana</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-size">Size: <span id="iat-size-val">36</span>px</label>' +
      '<input type="range" id="iat-size" min="8" max="200" value="36" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-color">Color</label>' +
      '<input type="color" id="iat-color" value="#ffffff">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label><input type="checkbox" id="iat-bold"> Bold</label>&nbsp;' +
      '<label><input type="checkbox" id="iat-italic"> Italic</label>&nbsp;' +
      '<label><input type="checkbox" id="iat-underline"> Underline</label>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-align">Alignment</label>' +
      '<select id="iat-align" class="tg-select">' +
        '<option value="left">Left</option>' +
        '<option value="center" selected>Center</option>' +
        '<option value="right">Right</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iat-opacity">Text Opacity: <span id="iat-opacity-val">100</span>%</label>' +
      '<input type="range" id="iat-opacity" min="10" max="100" value="100" style="flex:1">' +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      '<button type="button" class="tg-btn-secondary" id="iat-add-btn">+ Add Text</button>' +
      '<button type="button" class="tg-btn-secondary" id="iat-del-btn">Delete Selected</button>' +
      '<button type="button" class="tg-btn-secondary" id="iat-undo-btn">Undo</button>' +
      '<button type="button" class="tg-btn-secondary" id="iat-redo-btn">Redo</button>' +
    '</div>' +
    '<div id="iat-canvas-wrap" style="margin-top:8px;display:none;border:1px solid #ddd;border-radius:4px;overflow:hidden">' +
      '<canvas id="iat-canvas"></canvas>' +
    '</div>' +
    '<p class="tg-opt-info" id="iat-hint" style="margin-top:6px">Load an image first, then add text. Click text objects to select/move them. When ready, click the action button to save.</p>';
  }

  function saveState() {
    if (!_fabricCanvas) return;
    _history.push(JSON.stringify(_fabricCanvas.toJSON()));
    _future = [];
  }

  function addText(container) {
    if (!_fabricCanvas) return;
    var get = function (id) { return container.querySelector('#' + id) || document.getElementById(id); };
    var textEl = get('iat-text');
    var fontEl = get('iat-font');
    var sizeEl = get('iat-size');
    var colorEl = get('iat-color');
    var boldEl = get('iat-bold');
    var italicEl = get('iat-italic');
    var underEl = get('iat-underline');
    var alignEl = get('iat-align');
    var opEl = get('iat-opacity');

    var text = new fabric.IText(textEl && textEl.value ? textEl.value : 'Text', {
      left: _fabricCanvas.getWidth() / 2,
      top: _fabricCanvas.getHeight() / 2,
      originX: 'center', originY: 'center',
      fontFamily: fontEl ? fontEl.value : 'Arial',
      fontSize: sizeEl ? parseInt(sizeEl.value) : 36,
      fill: colorEl ? colorEl.value : '#ffffff',
      fontWeight: boldEl && boldEl.checked ? 'bold' : 'normal',
      fontStyle: italicEl && italicEl.checked ? 'italic' : 'normal',
      underline: underEl ? underEl.checked : false,
      textAlign: alignEl ? alignEl.value : 'center',
      opacity: opEl ? parseInt(opEl.value) / 100 : 1,
    });
    saveState();
    _fabricCanvas.add(text);
    _fabricCanvas.setActiveObject(text);
    _fabricCanvas.renderAll();
  }

  function wireOptions(container) {
    var sz = container.querySelector('#iat-size');
    var szv = container.querySelector('#iat-size-val');
    if (sz && szv) sz.addEventListener('input', function () { szv.textContent = sz.value; });
    var op = container.querySelector('#iat-opacity');
    var opv = container.querySelector('#iat-opacity-val');
    if (op && opv) op.addEventListener('input', function () { opv.textContent = op.value; });

    var addBtn = container.querySelector('#iat-add-btn');
    if (addBtn) addBtn.addEventListener('click', function () { addText(container); });

    var delBtn = container.querySelector('#iat-del-btn');
    if (delBtn) delBtn.addEventListener('click', function () {
      if (!_fabricCanvas) return;
      var obj = _fabricCanvas.getActiveObject();
      if (obj) { saveState(); _fabricCanvas.remove(obj); _fabricCanvas.renderAll(); }
    });

    var undoBtn = container.querySelector('#iat-undo-btn');
    if (undoBtn) undoBtn.addEventListener('click', function () {
      if (!_fabricCanvas || _history.length === 0) return;
      _future.push(JSON.stringify(_fabricCanvas.toJSON()));
      var state = _history.pop();
      _fabricCanvas.loadFromJSON(state, function () { _fabricCanvas.renderAll(); });
    });

    var redoBtn = container.querySelector('#iat-redo-btn');
    if (redoBtn) redoBtn.addEventListener('click', function () {
      if (!_fabricCanvas || _future.length === 0) return;
      _history.push(JSON.stringify(_fabricCanvas.toJSON()));
      var state = _future.pop();
      _fabricCanvas.loadFromJSON(state, function () { _fabricCanvas.renderAll(); });
    });
  }

  function onFileReady(file) {
    if (!file || !window.fabric || !window.TGImageUtil) return;

    TGImageUtil.loadImage(file).then(function (img) {
      var canvasEl = document.getElementById('iat-canvas');
      var canvasWrap = document.getElementById('iat-canvas-wrap');
      if (!canvasEl || !canvasWrap) return;

      canvasWrap.style.display = 'block';

      var maxW = Math.min(800, window.innerWidth - 40);
      _scale = Math.min(1, maxW / img.naturalWidth);
      var cw = Math.round(img.naturalWidth * _scale);
      var ch = Math.round(img.naturalHeight * _scale);

      if (_fabricCanvas) { _fabricCanvas.dispose(); _fabricCanvas = null; }
      _fabricCanvas = new fabric.Canvas('iat-canvas', { width: cw, height: ch });
      _history = []; _future = [];

      fabric.Image.fromURL(img.src, function (fImg) {
        fImg.set({ scaleX: cw / img.naturalWidth, scaleY: ch / img.naturalHeight, selectable: false, evented: false });
        _fabricCanvas.setBackgroundImage(fImg, _fabricCanvas.renderAll.bind(_fabricCanvas));
      });
    }).catch(function () {});
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    if (!window.fabric) throw new Error('Fabric.js failed to load. Please refresh the page.');
    if (!_fabricCanvas) throw new Error('Editor not ready yet — wait for the image preview, add your text, then try again.');

    onProgress && onProgress(0.6, 'Saving image...');
    _fabricCanvas.discardActiveObject();
    _fabricCanvas.renderAll();

    // Export at original resolution
    var multiplier = _scale ? 1 / _scale : 1;
    var dataUrl = _fabricCanvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: multiplier });
    var blob = await fetch(dataUrl).then(function (r) { return r.blob(); });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-text.jpg' };
  }

  function getOptions() { return {}; }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

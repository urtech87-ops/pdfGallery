/**
 * ToolsGallery — Add Text to Image
 * Handler: img-add-text
 * URL: /tool/add-text-to-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-add-text' };
  var _fabricCanvas = null;

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
    '<p class="tg-opt-info" id="iat-hint" style="margin-top:6px">Load an image first, then add text. Click text objects to select/move them.</p>' +
    '<script>(function(){' +
      'var sz=document.getElementById("iat-size"),szv=document.getElementById("iat-size-val");' +
      'if(sz&&szv)sz.addEventListener("input",function(){szv.textContent=sz.value;});' +
      'var op=document.getElementById("iat-opacity"),opv=document.getElementById("iat-opacity-val");' +
      'if(op&&opv)op.addEventListener("input",function(){opv.textContent=op.value;});' +
      'document.getElementById("iat-add-btn") && document.getElementById("iat-add-btn").addEventListener("click",function(){if(window._iatAddText)window._iatAddText();});' +
      'document.getElementById("iat-del-btn") && document.getElementById("iat-del-btn").addEventListener("click",function(){if(window._iatDelSelected)window._iatDelSelected();});' +
      'document.getElementById("iat-undo-btn") && document.getElementById("iat-undo-btn").addEventListener("click",function(){if(window._iatUndo)window._iatUndo();});' +
      'document.getElementById("iat-redo-btn") && document.getElementById("iat-redo-btn").addEventListener("click",function(){if(window._iatRedo)window._iatRedo();});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    return {};
  }

  var _history = [], _future = [];

  function saveState() {
    if (!_fabricCanvas) return;
    _history.push(JSON.stringify(_fabricCanvas.toJSON()));
    _future = [];
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');

    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        if (!window.fabric) { reject(new Error('Fabric.js not loaded')); return; }

        var canvasEl = document.getElementById('iat-canvas');
        var canvasWrap = document.getElementById('iat-canvas-wrap');
        if (!canvasEl || !canvasWrap) { reject(new Error('Canvas not ready')); return; }

        canvasWrap.style.display = 'block';

        // Scale to fit viewport
        var maxW = Math.min(800, window.innerWidth - 40);
        var scale = Math.min(1, maxW / img.width);
        var cw = Math.round(img.width * scale);
        var ch = Math.round(img.height * scale);

        if (_fabricCanvas) { _fabricCanvas.dispose(); _fabricCanvas = null; }
        _fabricCanvas = new fabric.Canvas('iat-canvas', { width: cw, height: ch });

        // Set background image
        fabric.Image.fromURL(img.src, function (fImg) {
          fImg.set({ scaleX: cw / img.width, scaleY: ch / img.height, selectable: false, evented: false });
          _fabricCanvas.setBackgroundImage(fImg, _fabricCanvas.renderAll.bind(_fabricCanvas));
        });

        _history = []; _future = [];

        window._iatAddText = function () {
          var textEl = document.getElementById('iat-text');
          var fontEl = document.getElementById('iat-font');
          var sizeEl = document.getElementById('iat-size');
          var colorEl = document.getElementById('iat-color');
          var boldEl = document.getElementById('iat-bold');
          var italicEl = document.getElementById('iat-italic');
          var underEl = document.getElementById('iat-underline');
          var alignEl = document.getElementById('iat-align');
          var opEl = document.getElementById('iat-opacity');

          var text = new fabric.IText(textEl ? textEl.value || 'Text' : 'Text', {
            left: cw / 2, top: ch / 2,
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
        };

        window._iatDelSelected = function () {
          var obj = _fabricCanvas.getActiveObject();
          if (obj) { saveState(); _fabricCanvas.remove(obj); _fabricCanvas.renderAll(); }
        };

        window._iatUndo = function () {
          if (_history.length === 0) return;
          _future.push(JSON.stringify(_fabricCanvas.toJSON()));
          var state = _history.pop();
          _fabricCanvas.loadFromJSON(state, function () { _fabricCanvas.renderAll(); });
        };

        window._iatRedo = function () {
          if (_future.length === 0) return;
          _history.push(JSON.stringify(_fabricCanvas.toJSON()));
          var state = _future.pop();
          _fabricCanvas.loadFromJSON(state, function () { _fabricCanvas.renderAll(); });
        };

        onProgress && onProgress(0.5, 'Image loaded. Add text, then click Save Image.');

        // On second call (run again), export
        if (window._iatReady) {
          exportImage(file, resolve, reject, onProgress, scale);
          return;
        }
        window._iatReady = true;
        // Return a proxy that re-runs export
        resolve({ _waitForExport: true, file: file, scale: scale });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    }).then(function (result) {
      if (result && result._waitForExport) {
        return new Promise(function (res, rej) {
          exportImage(result.file, res, rej, function(){}, result.scale);
        });
      }
      return result;
    });
  }

  function exportImage(file, resolve, reject, onProgress, scale) {
    if (!_fabricCanvas) { reject(new Error('No canvas')); return; }
    onProgress && onProgress(0.8, 'Saving...');

    // Export at original resolution
    var multiplier = scale ? 1 / scale : 1;
    var dataUrl = _fabricCanvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: multiplier });
    fetch(dataUrl).then(function (r) { return r.blob(); }).then(function (blob) {
      var base = file.name.replace(/\.[^.]+$/, '');
      window._iatReady = false;
      onProgress && onProgress(1, 'Done!');
      resolve({ blob: blob, filename: base + '-text.jpg' });
    }).catch(function (e) { reject(e); });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Add Watermark to Image
 * Handler: img-watermark
 * URL: /tool/add-watermark/
 *
 * Live WYSIWYG preview: the watermarked image renders on the canvas as
 * soon as the file loads and re-renders on every option change. The
 * watermark can also be dragged straight onto the preview to position
 * it freely.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-watermark' };

  var _img = null;
  var _optionsEl = null;
  var _positionMode = 'preset';   // 'preset' | 'custom' (after dragging)
  var _customPos = null;          // { rx, ry } watermark centre, 0..1 of image
  var _wmImgCache = { file: null, img: null };
  var _renderPending = false;
  var _previewScale = 1;

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Watermark Type</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="iwm-type" value="text" checked> Text</label>' +
        '<label><input type="radio" name="iwm-type" value="image"> Image</label>' +
      '</div>' +
    '</div>' +
    '<div id="iwm-text-wrap">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iwm-text">Text</label>' +
        '<input type="text" id="iwm-text" class="tg-text-input" value="© Copyright" placeholder="Watermark text">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iwm-font">Font</label>' +
        '<select id="iwm-font" class="tg-select">' +
          '<option>Arial</option><option>Impact</option><option>Georgia</option><option>Verdana</option><option>Courier New</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iwm-size">Size: <span id="iwm-size-val">40</span>px</label>' +
        '<input type="range" id="iwm-size" min="8" max="200" value="40" style="flex:1">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iwm-color">Color</label>' +
        '<input type="color" id="iwm-color" value="#ffffff">' +
      '</div>' +
    '</div>' +
    '<div id="iwm-img-wrap" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Watermark Image</label>' +
        '<input type="file" id="iwm-img-file" accept="image/*" class="tg-text-input">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="iwm-img-scale">Scale: <span id="iwm-img-scale-val">30</span>%</label>' +
        '<input type="range" id="iwm-img-scale" min="5" max="80" value="30" style="flex:1">' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iwm-opacity">Opacity: <span id="iwm-opacity-val">50</span>%</label>' +
      '<input type="range" id="iwm-opacity" min="5" max="100" value="50" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iwm-rotation">Rotation: <span id="iwm-rotation-val">-30</span>°</label>' +
      '<input type="range" id="iwm-rotation" min="-180" max="180" value="-30" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row" style="flex-direction:column">' +
      '<label class="tg-opt-label">Position <span class="tg-opt-hint">(or drag the watermark on the preview)</span></label>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:220px;margin-top:6px">' +
        ['top-left','top-center','top-right','middle-left','center','middle-right','bottom-left','bottom-center','bottom-right'].map(function(p){
          return '<button type="button" class="tg-btn-secondary iwm-pos-btn' + (p==='bottom-right'?' iwm-pos-btn--active':'') + '" data-pos="' + p + '" style="font-size:11px;padding:4px">' + p.replace(/-/g,' ') + '</button>';
        }).join('') +
        '<button type="button" class="tg-btn-secondary iwm-pos-btn" data-pos="tiled" style="font-size:11px;padding:4px;grid-column:1/-1">Tiled</button>' +
      '</div>' +
    '</div>' +
    '<div id="iwm-preview-wrap" style="margin-top:12px;display:none;max-width:100%">' +
      '<canvas id="iwm-preview" style="display:block;max-width:100%;border:1px solid #ddd;border-radius:4px;cursor:move;touch-action:none"></canvas>' +
      '<p class="tg-opt-info" style="margin-top:4px">Drag on the preview to place the watermark anywhere.</p>' +
    '</div>';
  }

  function wireOptions(container) {
    _optionsEl = container;

    container.querySelectorAll('input[name="iwm-type"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var textWrap = container.querySelector('#iwm-text-wrap');
        var imgWrap = container.querySelector('#iwm-img-wrap');
        if (textWrap) textWrap.hidden = r.value !== 'text';
        if (imgWrap) imgWrap.hidden = r.value !== 'image';
        schedulePreview();
      });
    });

    function link(id, vid, suf) {
      var s = container.querySelector('#' + id);
      var v = container.querySelector('#' + vid);
      if (s && v) s.addEventListener('input', function () { v.textContent = s.value + (suf || ''); });
    }
    link('iwm-size', 'iwm-size-val', '');
    link('iwm-opacity', 'iwm-opacity-val', '%');
    link('iwm-rotation', 'iwm-rotation-val', '°');
    link('iwm-img-scale', 'iwm-img-scale-val', '%');

    // Any option change re-renders the preview
    ['iwm-text', 'iwm-font', 'iwm-size', 'iwm-color', 'iwm-img-file',
      'iwm-img-scale', 'iwm-opacity', 'iwm-rotation'].forEach(function (id) {
      var el = container.querySelector('#' + id);
      if (!el) return;
      el.addEventListener('input', schedulePreview);
      el.addEventListener('change', schedulePreview);
    });

    var posBtns = container.querySelectorAll('.iwm-pos-btn');
    posBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        posBtns.forEach(function (x) { x.classList.remove('iwm-pos-btn--active'); });
        b.classList.add('iwm-pos-btn--active');
        _positionMode = 'preset';
        _customPos = null;
        schedulePreview();
      });
    });

    setupPreviewDrag(container);
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var type = optionsEl.querySelector('input[name="iwm-type"]:checked');
    var text = optionsEl.querySelector('#iwm-text');
    var font = optionsEl.querySelector('#iwm-font');
    var size = optionsEl.querySelector('#iwm-size');
    var color = optionsEl.querySelector('#iwm-color');
    var imgFile = optionsEl.querySelector('#iwm-img-file');
    var imgScale = optionsEl.querySelector('#iwm-img-scale');
    var opacity = optionsEl.querySelector('#iwm-opacity');
    var rotation = optionsEl.querySelector('#iwm-rotation');
    var posBtn = optionsEl.querySelector('.iwm-pos-btn--active');
    return {
      type: type ? type.value : 'text',
      text: text ? text.value : '© Copyright',
      font: font ? font.value : 'Arial',
      fontSize: size ? parseInt(size.value, 10) : 40,
      color: color ? color.value : '#ffffff',
      wmFile: imgFile ? imgFile.files[0] : null,
      wmScale: imgScale ? parseInt(imgScale.value, 10) / 100 : 0.3,
      opacity: opacity ? parseInt(opacity.value, 10) / 100 : 0.5,
      rotation: rotation ? parseInt(rotation.value, 10) : -30,
      position: _positionMode === 'custom' && _customPos ? 'custom' : (posBtn ? posBtn.dataset.pos : 'bottom-right'),
      customPos: _customPos,
    };
  }

  function getPositionXY(options, cw, ch, wmW, wmH) {
    if (options.position === 'custom' && options.customPos) {
      return [options.customPos.rx * cw - wmW / 2, options.customPos.ry * ch - wmH / 2];
    }
    var pad = 20;
    switch (options.position) {
      case 'top-left': return [pad, pad];
      case 'top-center': return [(cw - wmW) / 2, pad];
      case 'top-right': return [cw - wmW - pad, pad];
      case 'middle-left': return [pad, (ch - wmH) / 2];
      case 'center': return [(cw - wmW) / 2, (ch - wmH) / 2];
      case 'middle-right': return [cw - wmW - pad, (ch - wmH) / 2];
      case 'bottom-left': return [pad, ch - wmH - pad];
      case 'bottom-center': return [(cw - wmW) / 2, ch - wmH - pad];
      case 'bottom-right': return [cw - wmW - pad, ch - wmH - pad];
      default: return [cw - wmW - pad, ch - wmH - pad];
    }
  }

  function loadWmImage(file) {
    if (_wmImgCache.file === file && _wmImgCache.img) {
      return Promise.resolve(_wmImgCache.img);
    }
    return new Promise(function (res, rej) {
      var wi = new Image();
      var url = URL.createObjectURL(file);
      wi.onload = function () {
        URL.revokeObjectURL(url);
        _wmImgCache = { file: file, img: wi };
        res(wi);
      };
      wi.onerror = function () {
        URL.revokeObjectURL(url);
        rej(new Error('Could not load watermark image'));
      };
      wi.src = url;
    });
  }

  async function applyWatermarkToCanvas(img, options) {
    var cw = img.naturalWidth || img.width;
    var ch = img.naturalHeight || img.height;
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, cw, ch);
    ctx.globalAlpha = options.opacity;

    var rad = options.rotation * Math.PI / 180;

    if (options.type === 'text') {
      ctx.font = 'bold ' + options.fontSize + 'px "' + (options.font || 'Arial') + '"';
      ctx.fillStyle = options.color;
      var metrics = ctx.measureText(options.text);
      var wmW = metrics.width, wmH = options.fontSize;

      if (options.position === 'tiled') {
        var spacing = Math.max(wmW, wmH) * 2;
        for (var ty = -spacing; ty < ch + spacing; ty += spacing) {
          for (var tx = -spacing; tx < cw + spacing; tx += spacing) {
            ctx.save();
            ctx.translate(tx + wmW / 2, ty + wmH / 2);
            ctx.rotate(rad);
            ctx.fillText(options.text, -wmW / 2, wmH / 2);
            ctx.restore();
          }
        }
      } else {
        var pos = getPositionXY(options, cw, ch, wmW, wmH);
        ctx.save();
        ctx.translate(pos[0] + wmW / 2, pos[1] + wmH / 2);
        ctx.rotate(rad);
        ctx.fillText(options.text, -wmW / 2, wmH / 2);
        ctx.restore();
      }
    } else if (options.type === 'image' && options.wmFile) {
      var wmImg = await loadWmImage(options.wmFile);
      var wmW2 = Math.round(cw * options.wmScale);
      var wmH2 = Math.round(wmImg.naturalHeight * wmW2 / wmImg.naturalWidth);
      var pos2 = getPositionXY(options, cw, ch, wmW2, wmH2);
      ctx.save();
      ctx.translate(pos2[0] + wmW2 / 2, pos2[1] + wmH2 / 2);
      ctx.rotate(rad);
      ctx.drawImage(wmImg, -wmW2 / 2, -wmH2 / 2, wmW2, wmH2);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    return canvas;
  }

  /* ── Live preview ── */

  function schedulePreview() {
    if (!_img || _renderPending) return;
    _renderPending = true;
    requestAnimationFrame(function () {
      _renderPending = false;
      renderPreview();
    });
  }

  function renderPreview() {
    if (!_img || !_optionsEl || !window.TGImageUtil) return;
    var previewEl = document.getElementById('iwm-preview');
    var previewWrap = document.getElementById('iwm-preview-wrap');
    if (!previewEl || !previewWrap) return;

    var options = getOptions(_optionsEl);
    applyWatermarkToCanvas(_img, options).then(function (canvas) {
      var maxW = Math.min(550, window.innerWidth - 40);
      _previewScale = TGImageUtil.drawPreview(canvas, previewEl, maxW);
      previewWrap.style.display = 'block';
    }).catch(function () {});
  }

  function setupPreviewDrag(container) {
    var previewEl = container.querySelector('#iwm-preview');
    if (!previewEl || previewEl._iwmWired) return;
    previewEl._iwmWired = true;

    var dragging = false;

    function setPosFromEvent(clientX, clientY) {
      var r = previewEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      _customPos = {
        rx: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
        ry: Math.max(0, Math.min(1, (clientY - r.top) / r.height)),
      };
      _positionMode = 'custom';
      container.querySelectorAll('.iwm-pos-btn').forEach(function (x) {
        x.classList.remove('iwm-pos-btn--active');
      });
      schedulePreview();
    }

    previewEl.addEventListener('mousedown', function (e) {
      dragging = true;
      setPosFromEvent(e.clientX, e.clientY);
    });
    previewEl.addEventListener('mousemove', function (e) {
      if (dragging) setPosFromEvent(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', function () { dragging = false; });

    previewEl.addEventListener('touchstart', function (e) {
      e.preventDefault();
      dragging = true;
      setPosFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    previewEl.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (dragging) setPosFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    previewEl.addEventListener('touchend', function (e) {
      e.preventDefault();
      dragging = false;
    }, { passive: false });
  }

  function onFileReady(file) {
    _img = null;
    if (!file) return;

    var img = new Image();
    var objectUrl = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      _img = img;
      renderPreview();
    };
    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      alert('Could not load image. Please try a different file.');
    };
    img.src = objectUrl;
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Loading images...');
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];

    if (files.length === 1) {
      var img = (files[0] === file && _img) ? _img : await TGImageUtil.loadImage(files[0]);
      onProgress && onProgress(0.5, 'Applying watermark...');
      var canvas = await applyWatermarkToCanvas(img, options);
      var blob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', 0.92);
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: TGImageUtil.stripExt(files[0].name) + '-watermarked.jpg' };
    }

    // Batch: ZIP
    if (!window.JSZip) throw new Error('JSZip not loaded');
    var zip = new JSZip();
    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress(i / files.length * 0.9, 'Processing ' + files[i].name + '...');
      var img2 = await TGImageUtil.loadImage(files[i]);
      var canvas2 = await applyWatermarkToCanvas(img2, options);
      var blob2 = await TGImageUtil.canvasToBlob(canvas2, 'image/jpeg', 0.92);
      zip.file(TGImageUtil.stripExt(files[i].name) + '-watermarked.jpg', blob2);
    }
    var zipBlob = await zip.generateAsync({ type: 'blob' });
    onProgress && onProgress(1, 'Done!');
    return { blob: zipBlob, filename: 'watermarked-images.zip' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

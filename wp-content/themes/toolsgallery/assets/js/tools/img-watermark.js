/**
 * ToolsGallery — Add Watermark to Image
 * Handler: img-watermark
 * URL: /tool/add-watermark/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-watermark' };

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
      '<label class="tg-opt-label">Position</label>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:220px;margin-top:6px">' +
        ['top-left','top-center','top-right','middle-left','center','middle-right','bottom-left','bottom-center','bottom-right'].map(function(p,i){
          return '<button type="button" class="tg-btn-secondary iwm-pos-btn' + (p==='bottom-right'?' iwm-pos-btn--active':'') + '" data-pos="' + p + '" style="font-size:11px;padding:4px">' + p.replace(/-/g,' ') + '</button>';
        }).join('') +
        '<button type="button" class="tg-btn-secondary iwm-pos-btn" data-pos="tiled" style="font-size:11px;padding:4px;grid-column:1/-1">Tiled</button>' +
      '</div>' +
    '</div>' +
    '<script>(function(){' +
      'document.querySelectorAll("input[name=\'iwm-type\']").forEach(function(r){r.addEventListener("change",function(){' +
        'document.getElementById("iwm-text-wrap").hidden=r.value!=="text";' +
        'document.getElementById("iwm-img-wrap").hidden=r.value!=="image";' +
      '});});' +
      'function link(id,vid,suf){var s=document.getElementById(id),v=document.getElementById(vid);if(s&&v)s.addEventListener("input",function(){v.textContent=s.value+(suf||"");});}' +
      'link("iwm-size","iwm-size-val","");link("iwm-opacity","iwm-opacity-val","%");link("iwm-rotation","iwm-rotation-val","°");link("iwm-img-scale","iwm-img-scale-val","%");' +
      'var posBtns=document.querySelectorAll(".iwm-pos-btn");' +
      'posBtns.forEach(function(b){b.addEventListener("click",function(){posBtns.forEach(function(x){x.classList.remove("iwm-pos-btn--active");});b.classList.add("iwm-pos-btn--active");});});' +
    '})();<\/script>';
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
      fontSize: size ? parseInt(size.value) : 40,
      color: color ? color.value : '#ffffff',
      wmFile: imgFile ? imgFile.files[0] : null,
      wmScale: imgScale ? parseInt(imgScale.value) / 100 : 0.3,
      opacity: opacity ? parseInt(opacity.value) / 100 : 0.5,
      rotation: rotation ? parseInt(rotation.value) : -30,
      position: posBtn ? posBtn.dataset.pos : 'bottom-right',
    };
  }

  function getPositionXY(position, cw, ch, wmW, wmH) {
    var pad = 20;
    switch (position) {
      case 'top-left': return [pad, pad];
      case 'top-center': return [(cw - wmW)/2, pad];
      case 'top-right': return [cw - wmW - pad, pad];
      case 'middle-left': return [pad, (ch - wmH)/2];
      case 'center': return [(cw - wmW)/2, (ch - wmH)/2];
      case 'middle-right': return [cw - wmW - pad, (ch - wmH)/2];
      case 'bottom-left': return [pad, ch - wmH - pad];
      case 'bottom-center': return [(cw - wmW)/2, ch - wmH - pad];
      case 'bottom-right': return [cw - wmW - pad, ch - wmH - pad];
      default: return [pad, ch - wmH - pad];
    }
  }

  async function applyWatermarkToCanvas(img, options) {
    var canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = options.opacity;

    var rad = options.rotation * Math.PI / 180;

    if (options.type === 'text') {
      var fontSize = Math.round(Math.max(12, img.width * options.fontSize / 1000) * (options.fontSize / 10));
      ctx.font = 'bold ' + options.fontSize + 'px ' + (options.font || 'Arial');
      ctx.fillStyle = options.color;
      var metrics = ctx.measureText(options.text);
      var wmW = metrics.width, wmH = options.fontSize;

      if (options.position === 'tiled') {
        var spacing = Math.max(wmW, wmH) * 2;
        for (var ty = -spacing; ty < img.height + spacing; ty += spacing) {
          for (var tx = -spacing; tx < img.width + spacing; tx += spacing) {
            ctx.save();
            ctx.translate(tx + wmW/2, ty + wmH/2);
            ctx.rotate(rad);
            ctx.fillText(options.text, -wmW/2, wmH/2);
            ctx.restore();
          }
        }
      } else {
        var pos = getPositionXY(options.position, img.width, img.height, wmW, wmH);
        ctx.save();
        ctx.translate(pos[0] + wmW/2, pos[1] + wmH/2);
        ctx.rotate(rad);
        ctx.fillText(options.text, -wmW/2, wmH/2);
        ctx.restore();
      }
    } else if (options.type === 'image' && options.wmFile) {
      var wmImg = await new Promise(function (res, rej) {
        var wi = new Image(); var url = URL.createObjectURL(options.wmFile);
        wi.onload = function () { URL.revokeObjectURL(url); res(wi); };
        wi.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Could not load watermark image')); };
        wi.src = url;
      });
      var wmW2 = Math.round(img.width * options.wmScale);
      var wmH2 = Math.round(wmImg.height * wmW2 / wmImg.width);
      var pos2 = getPositionXY(options.position, img.width, img.height, wmW2, wmH2);
      ctx.save();
      ctx.translate(pos2[0] + wmW2/2, pos2[1] + wmH2/2);
      ctx.rotate(rad);
      ctx.drawImage(wmImg, -wmW2/2, -wmH2/2, wmW2, wmH2);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    return canvas;
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading images...');
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];

    if (files.length === 1) {
      var img = await loadImg(files[0]);
      onProgress && onProgress(0.5, 'Applying watermark...');
      var canvas = await applyWatermarkToCanvas(img, options);
      var blob = await new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/jpeg', 0.92); });
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: files[0].name.replace(/\.[^.]+$/, '') + '-watermarked.jpg' };
    }

    // Batch: ZIP
    if (!window.JSZip) throw new Error('JSZip not loaded');
    var zip = new JSZip();
    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress(i / files.length * 0.9, 'Processing ' + files[i].name + '...');
      var img2 = await loadImg(files[i]);
      var canvas2 = await applyWatermarkToCanvas(img2, options);
      var blob2 = await new Promise(function (res) { canvas2.toBlob(function (b) { res(b); }, 'image/jpeg', 0.92); });
      zip.file(files[i].name.replace(/\.[^.]+$/, '') + '-watermarked.jpg', blob2);
    }
    var zipBlob = await zip.generateAsync({ type: 'blob' });
    onProgress && onProgress(1, 'Done!');
    return { blob: zipBlob, filename: 'watermarked-images.zip' };
  }

  function loadImg(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image(); var url = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load ' + file.name)); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

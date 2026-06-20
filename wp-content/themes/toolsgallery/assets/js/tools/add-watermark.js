/**
 * ToolsGallery — Add Watermark
 * Handler: add-watermark
 * URL: /tool/add-watermark/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'add-watermark' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:6px">' +
      '<label class="tg-opt-label">Watermark Type</label>' +
      '<div style="display:flex;gap:8px">' +
        '<button type="button" class="tg-btn-secondary aw-type-btn aw-type-btn--active" data-type="text">Text</button>' +
        '<button type="button" class="tg-btn-secondary aw-type-btn" data-type="image">Image</button>' +
      '</div>' +
    '</div>' +
    '<div id="aw-text-opts">' +
      '<div class="tg-opt-row" style="flex-direction:column;gap:4px">' +
        '<label class="tg-opt-label" for="aw-text">Watermark Text</label>' +
        '<input type="text" id="aw-text" class="tg-text-input" value="CONFIDENTIAL">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="aw-font">Font</label>' +
        '<select id="aw-font" class="tg-select">' +
          '<option value="Helvetica">Helvetica</option>' +
          '<option value="Times-Roman">Times</option>' +
          '<option value="Courier">Courier</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="aw-size">Font Size</label>' +
        '<input type="number" id="aw-size" class="tg-text-input" value="48" min="10" max="200" style="width:80px">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="aw-color">Color</label>' +
        '<input type="color" id="aw-color" value="#cc0000" style="width:60px;height:32px;padding:2px;border:1px solid #ddd;border-radius:4px;cursor:pointer">' +
      '</div>' +
    '</div>' +
    '<div id="aw-img-opts" style="display:none">' +
      '<div class="tg-opt-row" style="flex-direction:column;gap:4px">' +
        '<label class="tg-opt-label">Watermark Image</label>' +
        '<input type="file" id="aw-img-file" accept="image/*" class="tg-text-input">' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="aw-opacity">Opacity (%)</label>' +
      '<input type="range" id="aw-opacity" min="5" max="100" value="30" style="flex:1">' +
      '<span id="aw-opacity-val" style="width:36px;text-align:right">30%</span>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="aw-rotation">Rotation (°)</label>' +
      '<input type="number" id="aw-rotation" class="tg-text-input" value="45" min="-180" max="180" style="width:80px">' +
    '</div>' +
    '<div class="tg-opt-row" style="flex-direction:column;gap:6px">' +
      '<label class="tg-opt-label">Position</label>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:200px">' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn" data-pos="top-left">↖</button>' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn" data-pos="top-center">↑</button>' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn" data-pos="top-right">↗</button>' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn" data-pos="mid-left">←</button>' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn aw-pos-btn--active" data-pos="center">●</button>' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn" data-pos="mid-right">→</button>' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn" data-pos="bot-left">↙</button>' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn" data-pos="bot-center">↓</button>' +
        '<button type="button" class="tg-btn-secondary aw-pos-btn" data-pos="bot-right">↘</button>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label style="font-size:13px"><input type="checkbox" id="aw-tiled"> Tiled (repeat across page)</label>' +
    '</div>' +
    '<script>(function(){' +
      'var typeBtns=document.querySelectorAll(".aw-type-btn");' +
      'typeBtns.forEach(function(b){b.addEventListener("click",function(){' +
        'typeBtns.forEach(function(x){x.classList.remove("aw-type-btn--active");});' +
        'b.classList.add("aw-type-btn--active");' +
        'document.getElementById("aw-text-opts").style.display=b.dataset.type==="text"?"block":"none";' +
        'document.getElementById("aw-img-opts").style.display=b.dataset.type==="image"?"block":"none";' +
      '});});' +
      'var posBtns=document.querySelectorAll(".aw-pos-btn");' +
      'posBtns.forEach(function(b){b.addEventListener("click",function(){' +
        'posBtns.forEach(function(x){x.classList.remove("aw-pos-btn--active");});' +
        'b.classList.add("aw-pos-btn--active");' +
      '});});' +
      'var op=document.getElementById("aw-opacity"),ov=document.getElementById("aw-opacity-val");' +
      'if(op&&ov)op.addEventListener("input",function(){ov.textContent=op.value+"%";});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { type: 'text', text: 'CONFIDENTIAL', font: 'Helvetica', size: 48, color: '#cc0000', opacity: 0.3, rotation: 45, position: 'center', tiled: false };
    var typeActive = optionsEl.querySelector('.aw-type-btn--active');
    var posActive = optionsEl.querySelector('.aw-pos-btn--active');
    var op = optionsEl.querySelector('#aw-opacity');
    var imgFile = optionsEl.querySelector('#aw-img-file');
    return {
      type: typeActive ? typeActive.dataset.type : 'text',
      text: (optionsEl.querySelector('#aw-text') || {}).value || 'CONFIDENTIAL',
      font: (optionsEl.querySelector('#aw-font') || {}).value || 'Helvetica',
      size: parseInt((optionsEl.querySelector('#aw-size') || {}).value) || 48,
      color: (optionsEl.querySelector('#aw-color') || {}).value || '#cc0000',
      opacity: op ? parseInt(op.value) / 100 : 0.3,
      rotation: parseInt((optionsEl.querySelector('#aw-rotation') || {}).value) || 45,
      position: posActive ? posActive.dataset.pos : 'center',
      tiled: !!(optionsEl.querySelector('#aw-tiled') && optionsEl.querySelector('#aw-tiled').checked),
      imgFile: imgFile && imgFile.files.length ? imgFile.files[0] : null,
    };
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r: r, g: g, b: b };
  }

  function calcPosition(pos, pageW, pageH, elW, elH, margin) {
    margin = margin || 40;
    var positions = {
      'top-left':    { x: margin,              y: pageH - margin - elH },
      'top-center':  { x: (pageW - elW) / 2,  y: pageH - margin - elH },
      'top-right':   { x: pageW - margin - elW, y: pageH - margin - elH },
      'mid-left':    { x: margin,              y: (pageH - elH) / 2 },
      'center':      { x: (pageW - elW) / 2,  y: (pageH - elH) / 2 },
      'mid-right':   { x: pageW - margin - elW, y: (pageH - elH) / 2 },
      'bot-left':    { x: margin,              y: margin },
      'bot-center':  { x: (pageW - elW) / 2,  y: margin },
      'bot-right':   { x: pageW - margin - elW, y: margin },
    };
    return positions[pos] || positions['center'];
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var { PDFDocument, StandardFonts, rgb, degrees, grayscale } = window.PDFLib;

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
    var pages = pdfDoc.getPages();

    var font = await pdfDoc.embedFont(StandardFonts[options.font] || StandardFonts.Helvetica);
    var color = hexToRgb(options.color || '#cc0000');
    var fontSize = options.size || 48;
    var opacity = options.opacity !== undefined ? options.opacity : 0.3;
    var rotDeg = options.rotation || 45;

    onProgress && onProgress(0.4, 'Adding watermarks...');
    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var w = page.getWidth(), h = page.getHeight();

      if (options.type === 'text') {
        var textWidth = font.widthOfTextAtSize(options.text, fontSize);
        var textHeight = fontSize;

        if (options.tiled) {
          for (var ty = textHeight; ty < h + textHeight; ty += textHeight * 3) {
            for (var tx = -textWidth; tx < w + textWidth; tx += textWidth * 2) {
              page.drawText(options.text, { x: tx, y: ty, size: fontSize, font: font, color: rgb(color.r, color.g, color.b), opacity: opacity, rotate: degrees(rotDeg) });
            }
          }
        } else {
          var pos = calcPosition(options.position, w, h, textWidth, textHeight, 40);
          page.drawText(options.text, { x: pos.x, y: pos.y, size: fontSize, font: font, color: rgb(color.r, color.g, color.b), opacity: opacity, rotate: degrees(rotDeg) });
        }
      }
    }

    onProgress && onProgress(0.9, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-watermarked.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — JPG to PDF
 * Handler: jpg-to-pdf
 * URL: /tool/jpg-to-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'jpg-to-pdf', multiFile: true };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="j2p-size">Page Size</label>' +
      '<select id="j2p-size" class="tg-select">' +
        '<option value="a4">A4 (210×297mm)</option>' +
        '<option value="letter">Letter (8.5×11in)</option>' +
        '<option value="auto">Auto-fit to image</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="j2p-orient">Orientation</label>' +
      '<select id="j2p-orient" class="tg-select">' +
        '<option value="portrait">Portrait</option>' +
        '<option value="landscape">Landscape</option>' +
      '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="j2p-margin">Margin (px)</label>' +
      '<input type="number" id="j2p-margin" class="tg-text-input" min="0" max="100" value="20" style="width:80px">' +
    '</div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { size: 'a4', orient: 'portrait', margin: 20 };
    var sz = optionsEl.querySelector('#j2p-size');
    var or = optionsEl.querySelector('#j2p-orient');
    var mg = optionsEl.querySelector('#j2p-margin');
    return {
      size: sz ? sz.value : 'a4',
      orient: or ? or.value : 'portrait',
      margin: mg ? parseInt(mg.value) || 0 : 20,
    };
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;

    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];

    onProgress && onProgress(0.05, 'Creating PDF...');
    var pdfDoc = await PDFDocument.create();

    // Page dimensions in points (1pt = 1/72 inch)
    var pageSizes = {
      a4:     { w: 595.28, h: 841.89 },
      letter: { w: 612,    h: 792    },
    };

    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress(0.1 + (i / files.length) * 0.8, 'Embedding ' + files[i].name + '...');
      var ab = await files[i].arrayBuffer();
      var imgBytes = new Uint8Array(ab);
      var mime = files[i].type || 'image/jpeg';
      var embeddedImg;
      try {
        if (mime === 'image/png') {
          embeddedImg = await pdfDoc.embedPng(imgBytes);
        } else {
          embeddedImg = await pdfDoc.embedJpg(imgBytes);
        }
      } catch (e) {
        // Fallback: try JPEG
        try { embeddedImg = await pdfDoc.embedJpg(imgBytes); }
        catch (e2) { embeddedImg = await pdfDoc.embedPng(imgBytes); }
      }

      var imgW = embeddedImg.width, imgH = embeddedImg.height;
      var margin = options.margin || 0;

      var pageW, pageH;
      if (options.size === 'auto') {
        pageW = imgW + margin * 2;
        pageH = imgH + margin * 2;
      } else {
        var dims = pageSizes[options.size] || pageSizes.a4;
        pageW = dims.w; pageH = dims.h;
        if (options.orient === 'landscape') { var tmp = pageW; pageW = pageH; pageH = tmp; }
      }

      var page = pdfDoc.addPage([pageW, pageH]);
      var drawW = pageW - margin * 2;
      var drawH = pageH - margin * 2;
      var scale = Math.min(drawW / imgW, drawH / imgH);
      var dw = imgW * scale, dh = imgH * scale;
      var dx = margin + (drawW - dw) / 2;
      var dy = margin + (drawH - dh) / 2;
      page.drawImage(embeddedImg, { x: dx, y: dy, width: dw, height: dh });
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: 'images-to-pdf.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

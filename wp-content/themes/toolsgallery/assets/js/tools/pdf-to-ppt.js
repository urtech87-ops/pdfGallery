(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-to-ppt',
    downloadName: 'presentation.pptx',
  };

  var PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

  function getOptionsHTML(pageCount) {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Slide size</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ppt-size" value="169" checked> 16:9 Widescreen</label>' +
        '<label><input type="radio" name="ppt-size" value="43"> 4:3 Standard</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Include text layer</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ppt-text" value="no" checked> No (image only)</label>' +
        '<label><input type="radio" name="ppt-text" value="yes"> Yes (add text boxes)</label>' +
      '</div>' +
    '</div>' +
    '<p class="tg-opt-info">Each PDF page is rendered as a slide image at high resolution.</p>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var size = optionsEl.querySelector('input[name="ppt-size"]:checked');
    var text = optionsEl.querySelector('input[name="ppt-text"]:checked');
    return {
      slideSize: size ? size.value : '169',
      includeText: text ? text.value : 'no',
    };
  }

  // Convert a base64 string to a Uint8Array (fallback for old pptxgenjs versions)
  function base64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // Normalize whatever pptx.write() returns into a proper binary Blob
  function toPptxBlob(out) {
    if (out instanceof Blob) {
      // Re-wrap to force the correct MIME type
      return new Blob([out], { type: PPTX_MIME });
    }
    if (out instanceof ArrayBuffer || ArrayBuffer.isView(out)) {
      return new Blob([out], { type: PPTX_MIME });
    }
    if (typeof out === 'string') {
      // Old pptxgenjs returned base64 — decode it to real bytes
      var b64 = out.indexOf('base64,') !== -1 ? out.split('base64,')[1] : out;
      return new Blob([base64ToBytes(b64)], { type: PPTX_MIME });
    }
    throw new Error('Unexpected output from PptxGenJS: ' + Object.prototype.toString.call(out));
  }

  async function run(file, options, onProgress) {
    if (!window.PptxGenJS) throw new Error('PptxGenJS library not loaded. Please refresh the page.');
    if (!window.pdfjsLib) throw new Error('PDF library not loaded.');

    onProgress && onProgress(0.05, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var totalPages = pdf.numPages;

    var pptx = new PptxGenJS();

    if (options.slideSize === '43') {
      pptx.layout = 'LAYOUT_4x3';
    } else {
      pptx.layout = 'LAYOUT_16x9';
    }

    var slideW = options.slideSize === '43' ? 10 : 13.33;
    var slideH = 7.5;

    for (var p = 1; p <= totalPages; p++) {
      onProgress && onProgress(0.05 + (p / totalPages) * 0.85, 'Converting page ' + p + ' of ' + totalPages + ' to slide...');

      var page = await pdf.getPage(p);
      var viewport = page.getViewport({ scale: 2.0 });

      var canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      var ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      // Full data URL — pptxgenjs v3 accepts this directly in `data`
      var imgData = canvas.toDataURL('image/png');

      var slide = pptx.addSlide();

      // Fit the page image inside the slide while preserving aspect ratio
      var pageRatio = viewport.width / viewport.height;
      var slideRatio = slideW / slideH;
      var imgW, imgH, imgX, imgY;
      if (pageRatio > slideRatio) {
        imgW = slideW;
        imgH = slideW / pageRatio;
        imgX = 0;
        imgY = (slideH - imgH) / 2;
      } else {
        imgH = slideH;
        imgW = slideH * pageRatio;
        imgY = 0;
        imgX = (slideW - imgW) / 2;
      }

      slide.addImage({ data: imgData, x: imgX, y: imgY, w: imgW, h: imgH });

      if (options.includeText === 'yes') {
        try {
          var tc = await page.getTextContent();
          var pgVp = page.getViewport({ scale: 1.0 });
          tc.items.forEach(function (item) {
            if (!item.str || !item.str.trim()) return;
            var xPct = item.transform[4] / pgVp.width;
            var yPct = 1 - (item.transform[5] + (item.height || 12)) / pgVp.height;
            var wPct = (item.width || 100) / pgVp.width;
            var hPct = (item.height || 12) / pgVp.height;
            slide.addText(item.str, {
              x: imgX + xPct * imgW,
              y: imgY + yPct * imgH,
              w: Math.max(wPct * imgW, 0.5),
              h: Math.max(hPct * imgH, 0.2),
              fontSize: 10,
              color: 'FFFFFF',
              // Invisible overlay text: no fill, no border (default), near-white text
            });
          });
        } catch (e) { /* text layer optional */ }
      }

      // Free canvas memory on large PDFs
      canvas.width = 0;
      canvas.height = 0;
    }

    onProgress && onProgress(0.95, 'Building presentation file...');

    var out;
    try {
      // pptxgenjs v3.x style
      out = await pptx.write({ outputType: 'blob' });
    } catch (e1) {
      try {
        // pptxgenjs older v3 / v2 style
        out = await pptx.write('arraybuffer');
      } catch (e2) {
        out = await pptx.write('base64');
      }
    }

    var blob = toPptxBlob(out);

    if (!blob || blob.size < 1000) {
      throw new Error('Generated PPTX appears empty (' + (blob ? blob.size : 0) + ' bytes). Check console for PptxGenJS errors.');
    }

    return { blob: blob, filename: CONFIG.downloadName, mimeType: PPTX_MIME };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
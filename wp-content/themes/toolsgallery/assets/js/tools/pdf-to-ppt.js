/* ToolsGallery — pdf-to-ppt.js
   Handler: pdf-to-ppt
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-to-ppt',
    downloadName: 'presentation.pptx',
  };

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
    var slideH = options.slideSize === '43' ? 7.5 : 7.5;

    for (var p = 1; p <= totalPages; p++) {
      onProgress && onProgress(p / totalPages * 0.9, 'Converting page ' + p + ' of ' + totalPages + ' to slide...');

      var page = await pdf.getPage(p);
      var viewport = page.getViewport({ scale: 2.0 });

      var canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      var ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      var imgData = canvas.toDataURL('image/png');
      // Strip data URL prefix for pptxgenjs
      var base64 = imgData.replace(/^data:image\/png;base64,/, '');

      var slide = pptx.addSlide();
      slide.addImage({ data: 'image/png;base64,' + base64, x: 0, y: 0, w: slideW, h: slideH });

      if (options.includeText === 'yes') {
        try {
          var tc = await page.getTextContent();
          var pgVp = page.getViewport({ scale: 1.0 });
          tc.items.forEach(function (item) {
            if (!item.str || !item.str.trim()) return;
            var xPct = item.transform[4] / pgVp.width;
            var yPct = 1 - (item.transform[5] + item.height) / pgVp.height;
            var wPct = (item.width || 100) / pgVp.width;
            var hPct = (item.height || 12) / pgVp.height;
            slide.addText(item.str, {
              x: xPct * slideW,
              y: yPct * slideH,
              w: Math.max(wPct * slideW, 0.5),
              h: Math.max(hPct * slideH, 0.2),
              fontSize: 10,
              color: 'FFFFFF',
              transparent: true,
            });
          });
        } catch (e) { /* text layer optional */ }
      }
    }

    onProgress && onProgress(0.95, 'Building presentation file...');
    var pptxArrayBuffer = await pptx.write({ outputType: 'arraybuffer' });
    var blob = new Blob([pptxArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });

    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

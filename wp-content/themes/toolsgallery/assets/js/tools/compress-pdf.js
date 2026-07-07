/**
 * ToolsGallery — Compress PDF
 * Handler: compress
 * URL: /tool/compress-pdf/
 *
 * Renders each page to canvas via PDF.js at a reduced scale, re-encodes it
 * as JPEG and rebuilds the document with pdf-lib. This achieves real size
 * reduction on image-heavy / already-optimized PDFs, at the cost of
 * converting pages to images (text is no longer selectable).
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'compress' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Compression Level</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="compress-quality" value="screen" checked> Maximum (smallest file)</label>' +
        '<label><input type="radio" name="compress-quality" value="ebook"> Balanced (recommended)</label>' +
        '<label><input type="radio" name="compress-quality" value="print"> Light (best quality)</label>' +
      '</div>' +
    '</div>' +
    '<p class="tg-opt-info">Pages are re-rendered as optimized images. Text will no longer be selectable in the compressed PDF.</p>' +
    '<div id="cp-result-info" style="margin-top:10px"></div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { quality: 'screen' };
    var q = optionsEl.querySelector('input[name="compress-quality"]:checked');
    return { quality: q ? q.value : 'screen' };
  }

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF library not loaded. Please refresh the page.');
    if (!window.PDFLib) throw new Error('PDF library not loaded. Please refresh the page.');

    var qualityMap = {
      'screen': { q: 0.5, s: 1.0 },
      'ebook':  { q: 0.7, s: 1.5 },
      'print':  { q: 0.9, s: 2.0 },
    };
    var qSettings = qualityMap[options.quality] || qualityMap['screen'];

    onProgress && onProgress(0.05, 'Reading PDF...');
    var ab = await file.arrayBuffer();

    /* Structural pass with pdf-lib (metadata strip + object streams) as a
       safety net — used when the raster rebuild ends up bigger. */
    var structuralBlob = null;
    try {
      var pdfDoc = await PDFLib.PDFDocument.load(ab.slice(0), { ignoreEncryption: true });
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      var structuralBytes = await pdfDoc.save({ useObjectStreams: true });
      structuralBlob = new Blob([structuralBytes], { type: 'application/pdf' });
    } catch (e) { /* raster path below still applies */ }

    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    var totalPages = pdf.numPages;

    var newPdf = await PDFLib.PDFDocument.create();

    for (var p = 1; p <= totalPages; p++) {
      onProgress && onProgress(0.05 + (p / totalPages) * 0.85, 'Compressing page ' + p + ' of ' + totalPages + '...');

      var page = await pdf.getPage(p);
      var baseVp = page.getViewport({ scale: 1.0 });
      var vp = page.getViewport({ scale: qSettings.s });

      var canvas = document.createElement('canvas');
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      var imgData = canvas.toDataURL('image/jpeg', qSettings.q);
      var base64 = imgData.split(',')[1];
      var imgBytes = Uint8Array.from(atob(base64), function (c) { return c.charCodeAt(0); });

      var jpgImage = await newPdf.embedJpg(imgBytes);

      /* Keep the original page dimensions in PDF points */
      var newPage = newPdf.addPage([baseVp.width, baseVp.height]);
      newPage.drawImage(jpgImage, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });

      canvas.width = 0;
      canvas.height = 0;
    }

    onProgress && onProgress(0.95, 'Saving compressed PDF...');

    var pdfBytes = await newPdf.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });

    /* Pick whichever output is actually smaller */
    var method = 'image';
    if (structuralBlob && structuralBlob.size < blob.size) {
      blob = structuralBlob;
      method = 'structural';
    }

    var originalSize = file.size;
    var newSize = blob.size;
    var reduction = Math.round((1 - newSize / originalSize) * 100);

    var infoEl = document.getElementById('cp-result-info');
    if (infoEl) {
      var note = method === 'structural'
        ? '<p style="color:#1e40af;font-size:12px;margin:4px 0 0">Structure optimization gave the best result — text stays selectable.</p>'
        : '';
      var warn = reduction < 5 ? '<p style="color:#b45309;font-size:12px;margin:4px 0 0">⚠ Less than 5% reduction — this PDF is already highly optimized.</p>' : '';
      infoEl.innerHTML = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;font-size:13px">' +
        '<div>Original: <strong>' + fmtBytes(originalSize) + '</strong></div>' +
        '<div>Compressed: <strong>' + fmtBytes(newSize) + '</strong></div>' +
        '<div>Reduction: <strong style="color:var(--color-success)">' + (reduction > 0 ? '-' + reduction + '%' : '~0%') + '</strong></div>' +
        note + warn + '</div>';
    }

    onProgress && onProgress(1.0, 'Compressed! Reduced by ' + Math.max(reduction, 0) + '%');

    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '-compressed.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

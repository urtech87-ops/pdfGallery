/**
 * ToolsGallery — Compress PDF
 * Handler: compress
 * URL: /tool/compress-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'compress' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Compression strips metadata and optimizes object streams.</label>' +
    '</div>' +
    '<div id="cp-result-info" style="margin-top:10px"></div>';
  }

  function getOptions(optionsEl) {
    return {};
  }

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();

    onProgress && onProgress(0.3, 'Stripping metadata...');
    var pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });

    // Strip metadata to reduce size
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    onProgress && onProgress(0.7, 'Saving compressed PDF...');
    var pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });

    var origSize = file.size;
    var newSize = blob.size;
    var reduction = Math.round((1 - newSize / origSize) * 100);

    var infoEl = document.getElementById('cp-result-info');
    if (infoEl) {
      var warn = reduction < 5 ? '<p style="color:#b45309;font-size:12px;margin:4px 0 0">⚠ Less than 5% reduction — PDF may already be optimized or contains mostly images.</p>' : '';
      infoEl.innerHTML = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;font-size:13px">' +
        '<div>Original: <strong>' + fmtBytes(origSize) + '</strong></div>' +
        '<div>Compressed: <strong>' + fmtBytes(newSize) + '</strong></div>' +
        '<div>Reduction: <strong style="color:var(--color-success)">' + (reduction > 0 ? '-' + reduction + '%' : '~0%') + '</strong></div>' +
        warn + '</div>';
    }

    onProgress && onProgress(1, 'Done!');
    var baseName = file.name.replace(/\.pdf$/i, '');
    return { blob: blob, filename: baseName + '-compressed.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

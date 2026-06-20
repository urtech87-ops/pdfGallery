/**
 * ToolsGallery — Merge PDF
 * Handler: merge
 * URL: /tool/merge-pdf/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'merge', multiFile: true };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:8px">' +
      '<label class="tg-opt-label">Upload multiple PDF files to merge them into one.</label>' +
      '<p style="font-size:13px;color:var(--color-gray-600);margin:0">Files will be merged in the order shown. Use the file picker to select multiple PDFs at once.</p>' +
    '</div>' +
    '<div id="mp-file-list" style="margin-top:10px"></div>';
  }

  function getOptions(optionsEl) {
    return {};
  }

  async function run(file, options, onProgress) {
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];

    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;

    onProgress && onProgress(0.05, 'Starting merge...');

    var mergedDoc = await PDFDocument.create();
    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress(0.1 + (i / files.length) * 0.8, 'Merging ' + files[i].name + '...');
      var ab = await files[i].arrayBuffer();
      var srcDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
      var pageCount = srcDoc.getPageCount();
      var indices = Array.from({ length: pageCount }, function (_, j) { return j; });
      var copiedPages = await mergedDoc.copyPages(srcDoc, indices);
      copiedPages.forEach(function (pg) { mergedDoc.addPage(pg); });
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await mergedDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Show file list summary
    var listEl = document.getElementById('mp-file-list');
    if (listEl) {
      listEl.innerHTML = '<p style="font-size:13px;color:var(--color-success)">✓ Merged ' + files.length + ' file(s), total pages: ' + mergedDoc.getPageCount() + '</p>';
    }

    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: 'merged.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

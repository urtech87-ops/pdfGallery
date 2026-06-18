/**
 * ============================================================
 * ToolsGallery — Merge PDF Tool
 * ============================================================
 * Handler key: merge
 * Tool URL: /tool/merge-pdf/
 *
 * HOW TO MODIFY THIS TOOL:
 * - Change CONFIG values at the top for quick adjustments
 * - Edit the run() function to change processing logic
 * - Edit getOptionsHTML() to add/change UI options
 * - Edit getOptions() to read your new option values
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-lib (PDFLib)
 *
 * TESTING:
 * After editing, refresh: /tool/merge-pdf/
 * Open browser console (F12) to see any errors
 * ============================================================
 */
(function () {
  'use strict';

  var CONFIG = {
    minFilesRequired: 2,
    outputFilename: 'merged.pdf',
  };

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;

    if (files.length < CONFIG.minFilesRequired) {
      if (callbacks.onInlineError) callbacks.onInlineError('Please add at least ' + CONFIG.minFilesRequired + ' PDF files to merge.');
      return;
    }

    onProgress(10, 'Starting merge…');
    var mergedPdf = await PDFLib.PDFDocument.create();

    for (var i = 0; i < files.length; i++) {
      onProgress(10 + Math.round((i / files.length) * 80), 'Processing file ' + (i + 1) + ' of ' + files.length + '…');
      var ab  = await files[i].arrayBuffer();
      var doc = await PDFLib.PDFDocument.load(ab);
      var copied = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copied.forEach(function (page) { mergedPdf.addPage(page); });
    }

    onProgress(95, 'Saving merged PDF…');
    var bytes = await mergedPdf.save();
    onSuccess(new Blob([bytes], { type: 'application/pdf' }), CONFIG.outputFilename);
  }

  function getOptionsHTML() { return ''; }
  function getOptions() { return {}; }

  window.TGTools = window.TGTools || {};
  window.TGTools['merge'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions };
})();

/**
 * ============================================================
 * ToolsGallery — Compress PDF Tool
 * ============================================================
 * Handler key: compress
 * Tool URL: /tool/compress-pdf/
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
 * After editing, refresh: /tool/compress-pdf/
 * Open browser console (F12) to see any errors
 * ============================================================
 */
(function () {
  'use strict';

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;
    var file = files[0];
    var originalSize = file.size;

    onProgress(20, 'Loading PDF…');
    var ab  = await file.arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);

    if (options.level === 'aggressive') {
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setProducer('');
      doc.setCreator('');
    }

    onProgress(70, 'Compressing…');
    var bytes = await doc.save({ useObjectStreams: true });
    var compressedSize = bytes.byteLength;
    var reduction = Math.round((1 - compressedSize / originalSize) * 100);

    onSuccess(
      new Blob([bytes], { type: 'application/pdf' }),
      'compressed.pdf',
      { originalSize: originalSize, compressedSize: compressedSize, reduction: reduction }
    );
  }

  function getOptionsHTML() {
    return '<label class="tg-opt-label">Compression level</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="compress-quality" value="standard" checked> Standard <span class="tg-opt-hint">(removes redundant data)</span></label>' +
        '<label><input type="radio" name="compress-quality" value="aggressive"> Aggressive <span class="tg-opt-hint">(also strips metadata)</span></label>' +
      '</div>' +
      '<p class="tg-opt-info">&#8505;&#65039; Browser-based compression optimizes PDF structure. For image-heavy PDFs, results may vary.</p>';
  }

  function getOptions() {
    var el = document.querySelector('input[name="compress-quality"]:checked');
    return { level: el ? el.value : 'standard' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['compress'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions };
})();

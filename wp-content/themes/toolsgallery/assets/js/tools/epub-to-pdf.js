/* ToolsGallery — epub-to-pdf.js
   Handler: epub-to-pdf
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'epub-to-pdf',
    downloadName: 'converted.pdf',
  };

  function getOptionsHTML(pageCount) {
    return '<p class="tg-opt-info">The EPUB chapters will be combined and opened in a print window. Select "Save as PDF" in your print dialog.</p>';
  }

  function getOptions(optionsEl) {
    return {};
  }

  async function run(file, options, onProgress) {
    if (!window.JSZip) {
      await new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    onProgress && onProgress(0.1, 'Reading EPUB...');
    var arrayBuffer = await file.arrayBuffer();
    var zip = await JSZip.loadAsync(arrayBuffer);

    onProgress && onProgress(0.2, 'Parsing EPUB structure...');

    // Parse container.xml
    var containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('Invalid EPUB: missing META-INF/container.xml');
    var containerXml = await containerFile.async('text');

    var opfMatch = containerXml.match(/full-path="([^"]+)"/);
    if (!opfMatch) throw new Error('Invalid EPUB: cannot find OPF path');
    var opfPath = opfMatch[1];
    var opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

    var opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('Invalid EPUB: OPF file not found at ' + opfPath);
    var opfXml = await opfFile.async('text');

    // Parse spine
    var spineMatches = opfXml.match(/<itemref[^>]+idref="([^"]+)"/g) || [];
    var idrefs = spineMatches.map(function (m) { return m.match(/idref="([^"]+)"/)[1]; });

    // Build id->href map from manifest
    var manifestMatches = opfXml.match(/<item[^>]+id="[^"]*"[^>]*href="[^"]*"[^>]*>/g) || [];
    var idHrefMap = {};
    manifestMatches.forEach(function (m) {
      var idM = m.match(/id="([^"]+)"/);
      var hrefM = m.match(/href="([^"]+)"/);
      if (idM && hrefM) idHrefMap[idM[1]] = hrefM[1];
    });

    var htmlParts = [];
    var total = idrefs.length || 1;

    for (var i = 0; i < idrefs.length; i++) {
      onProgress && onProgress(0.3 + i / total * 0.5, 'Reading chapter ' + (i + 1) + '...');
      var href = idHrefMap[idrefs[i]];
      if (!href) continue;
      var fullPath = opfDir + href;
      var chFile = zip.file(fullPath);
      if (!chFile) continue;
      var chHtml = await chFile.async('text');
      // Extract body content
      var bodyMatch = chHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) htmlParts.push(bodyMatch[1]);
    }

    if (!htmlParts.length) throw new Error('No readable chapters found in this EPUB.');

    onProgress && onProgress(0.85, 'Opening print window...');

    var combined = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + file.name + '</title><style>' +
      'body{font-family:Georgia,serif;max-width:800px;margin:auto;padding:20px;line-height:1.7;}' +
      'h1,h2,h3{color:#222;}p{margin:0.8em 0;}' +
      '.chapter-break{border:none;border-top:2px solid #ccc;margin:30px 0;}' +
      '.no-print{background:#f0f4ff;padding:15px;margin-bottom:20px;border-radius:8px;border:1px solid #c0c8f0;}' +
      '@media print{.no-print{display:none}@page{margin:2cm}}' +
      '</style></head><body>' +
      '<div class="no-print">' +
        '<strong>How to save as PDF:</strong>' +
        '<ol style="margin:8px 0 0 0;padding-left:20px;">' +
          '<li>Press <strong>Ctrl+P</strong> (Cmd+P on Mac)</li>' +
          '<li>Select <strong>"Save as PDF"</strong> as destination</li>' +
          '<li>Click <strong>Save</strong></li>' +
        '</ol>' +
      '</div>' +
      htmlParts.join('<hr class="chapter-break"/>') +
      '</body></html>';

    var win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(combined);
      win.document.close();
      setTimeout(function () { win.print(); }, 500);
    }

    return { noDownload: true };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

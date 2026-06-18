/**
 * ============================================================
 * ToolsGallery — PDF to Word Tool
 * ============================================================
 * Handler key: pdf-to-word
 * Tool URL: /tool/pdf-to-word/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf.js (pdfjsLib), docx.js (window.docx)
 * ============================================================
 */
(function () {
  'use strict';

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;

    if (!window.docx || !window.docx.Document) {
      onError('Document library not loaded. Please refresh the page.');
      return;
    }

    onProgress(10, 'Loading PDF…');
    var ab     = await files[0].arrayBuffer();
    var pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
    var numPages = pdfDoc.numPages;
    var paragraphs = [];

    for (var i = 1; i <= numPages; i++) {
      onProgress(10 + Math.round((i / numPages) * 75), 'Extracting page ' + i + ' of ' + numPages + '…');
      var page        = await pdfDoc.getPage(i);
      var textContent = await page.getTextContent();
      var items = textContent.items.filter(function (it) { return it.str && it.str.trim(); });

      var lines = [];
      items.forEach(function (item) {
        var y  = Math.round(item.transform[5]);
        var fs = Math.abs(item.transform[3]) || 12;
        var last = lines[lines.length - 1];
        if (!last || Math.abs(last.y - y) > 5) {
          lines.push({ y: y, text: item.str, fontSize: fs });
        } else {
          last.text += item.str;
          last.fontSize = Math.max(last.fontSize, fs);
        }
      });
      lines.sort(function (a, b) { return b.y - a.y; });

      var prevY = null;
      lines.forEach(function (line) {
        if (prevY === null || (prevY - line.y) > 20) {
          paragraphs.push({ text: line.text, fontSize: line.fontSize });
        } else {
          var last = paragraphs[paragraphs.length - 1];
          if (last) last.text += ' ' + line.text;
        }
        prevY = line.y;
      });

      if (i < numPages) paragraphs.push({ text: '', isBreak: true });
    }

    onProgress(90, 'Building Word document…');
    var children = paragraphs.map(function (p) {
      if (p.isBreak) return new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: '' })] });
      if (p.fontSize > 14) {
        return new window.docx.Paragraph({
          heading: window.docx.HeadingLevel ? window.docx.HeadingLevel.HEADING_2 : undefined,
          children: [new window.docx.TextRun({ text: p.text })]
        });
      }
      return new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: p.text })] });
    });

    var doc  = new window.docx.Document({ sections: [{ properties: {}, children: children }] });
    var blob = await window.docx.Packer.toBlob(doc);
    onSuccess(blob, 'converted.docx', { message: '✓ Text extracted successfully. Complex layouts and images are not preserved — this works best for text-heavy PDFs.' });
  }

  function getOptionsHTML() { return ''; }
  function getOptions() { return {}; }

  window.TGTools = window.TGTools || {};
  window.TGTools['pdf-to-word'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions };
})();

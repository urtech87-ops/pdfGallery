/* ToolsGallery — ppt-to-pdf.js
   Handler: ppt-to-pdf
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'ppt-to-pdf',
    downloadName: 'presentation.pptx',
  };

  function getOptionsHTML(pageCount) {
    return '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:12px;margin-bottom:12px;">' +
      '<strong>Note:</strong> Direct PPTX-to-PDF conversion in the browser is not possible without installing PowerPoint or LibreOffice. ' +
      'We will provide your file and step-by-step instructions.' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Conversion method</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ppt2pdf-method" value="instructions" checked> Show print instructions (recommended)</label>' +
        '<label><input type="radio" name="ppt2pdf-method" value="download"> Download original + instructions</label>' +
      '</div>' +
    '</div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var method = optionsEl.querySelector('input[name="ppt2pdf-method"]:checked');
    return { method: method ? method.value : 'instructions' };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.3, 'Preparing instructions...');

    var instrHTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PPT to PDF Instructions</title>' +
      '<style>body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px;line-height:1.6;}' +
      'h1{color:#333;}ol li{margin-bottom:10px;}' +
      '.note{background:#e3f2fd;padding:12px;border-radius:6px;margin-top:20px;}' +
      '</style></head><body>' +
      '<h1>How to Convert PPTX to PDF</h1>' +
      '<p>Browser-based PPTX to PDF conversion requires your local presentation software. Follow these steps:</p>' +
      '<h2>Option 1: Using Microsoft PowerPoint</h2>' +
      '<ol>' +
        '<li>Open your PPTX file in Microsoft PowerPoint</li>' +
        '<li>Click <strong>File → Export → Create PDF/XPS</strong></li>' +
        '<li>Choose a save location and click <strong>Publish</strong></li>' +
      '</ol>' +
      '<h2>Option 2: Using LibreOffice (Free)</h2>' +
      '<ol>' +
        '<li>Open your PPTX file in LibreOffice Impress</li>' +
        '<li>Click <strong>File → Export as PDF...</strong></li>' +
        '<li>Configure options and click <strong>Export</strong></li>' +
      '</ol>' +
      '<h2>Option 3: Print to PDF</h2>' +
      '<ol>' +
        '<li>Open your PPTX file in any presentation software</li>' +
        '<li>Press <strong>Ctrl+P</strong> to open print dialog</li>' +
        '<li>Select <strong>"Save as PDF"</strong> as the printer/destination</li>' +
        '<li>Click <strong>Save</strong></li>' +
      '</ol>' +
      '<div class="note"><strong>Online alternative:</strong> You can also use LibreOffice online at <a href="https://www.libreoffice.org/download/libreoffice-online/" target="_blank">libreoffice.org</a> for free conversion.</div>' +
      '</body></html>';

    onProgress && onProgress(0.6, 'Opening instructions...');

    var win = window.open('', '_blank', 'width=700,height=600');
    if (win) {
      win.document.write(instrHTML);
      win.document.close();
    }

    // Return the original file for download
    var blob = new Blob([await file.arrayBuffer()], { type: file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    return { blob: blob, filename: file.name || CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

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
    return '<p class="tg-opt-info">Upload your PowerPoint file and click Convert to see step-by-step instructions for saving it as a PDF.</p>';
  }

  function getOptions(optionsEl) {
    return {};
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.5, 'Preparing instructions...');

    var instrHTML =
      '<div class="tg-ppt-instructions" style="font-family:inherit;">' +
        '<h3 style="margin-top:0;color:#1a1a2e;font-size:1.1em;">Convert your PowerPoint to PDF:</h3>' +
        '<div class="tg-instruction-step" style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start;">' +
          '<span class="step-num" style="background:#667eea;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;">1</span>' +
          '<div>' +
            '<strong>Open in LibreOffice (Free)</strong>' +
            '<p style="margin:4px 0 8px;color:#555;">Download LibreOffice free, open your PPTX file, then go to <strong>File → Export as PDF</strong></p>' +
            '<a href="https://www.libreoffice.org/download/libreoffice/" target="_blank" rel="noopener" style="display:inline-block;padding:6px 14px;background:#667eea;color:#fff;text-decoration:none;border-radius:4px;font-size:0.875em;">Download LibreOffice Free →</a>' +
          '</div>' +
        '</div>' +
        '<div class="tg-instruction-step" style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start;">' +
          '<span class="step-num" style="background:#667eea;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;">2</span>' +
          '<div>' +
            '<strong>Use Microsoft PowerPoint</strong>' +
            '<p style="margin:4px 0;color:#555;">Open your file in PowerPoint, then click <strong>File → Save As</strong> and choose <strong>PDF (*.pdf)</strong> as the format.</p>' +
          '</div>' +
        '</div>' +
        '<div class="tg-instruction-step" style="display:flex;gap:12px;align-items:flex-start;">' +
          '<span class="step-num" style="background:#667eea;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;">3</span>' +
          '<div>' +
            '<strong>Use Google Slides (Free)</strong>' +
            '<p style="margin:4px 0 8px;color:#555;">Upload your file to Google Drive, open with Google Slides, then <strong>File → Download → PDF Document (.pdf)</strong></p>' +
            '<a href="https://drive.google.com" target="_blank" rel="noopener" style="display:inline-block;padding:6px 14px;background:#34a853;color:#fff;text-decoration:none;border-radius:4px;font-size:0.875em;">Open Google Drive →</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    onProgress && onProgress(1.0, 'Done');

    return {
      blob: null,
      filename: null,
      html: instrHTML,
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

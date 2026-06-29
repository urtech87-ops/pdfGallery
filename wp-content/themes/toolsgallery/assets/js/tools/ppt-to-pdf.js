/* ToolsGallery — ppt-to-pdf.js
   Handler: ppt-to-pdf
   Phase 10 — extracts slide text and opens print window
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'ppt-to-pdf',
    downloadName: 'presentation.pdf',
  };

  function getOptionsHTML() {
    return '<p class="tg-opt-info">Upload your PowerPoint (.pptx) file and click Convert. Slide content will open in a print window — use Ctrl+P and choose "Save as PDF".</p>';
  }

  function getOptions() {
    return {};
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

    onProgress && onProgress(0.1, 'Reading PowerPoint file...');
    var arrayBuffer = await file.arrayBuffer();

    var zip;
    try {
      zip = await JSZip.loadAsync(arrayBuffer);
    } catch (e) {
      throw new Error('Could not read PPTX file. Ensure it is a valid .pptx file.');
    }

    onProgress && onProgress(0.3, 'Extracting slides...');

    var slideFiles = [];
    var slidesFolder = zip.folder('ppt/slides');
    if (slidesFolder) {
      slidesFolder.forEach(function (path, file) {
        if (/^slide\d+\.xml$/.test(path)) {
          slideFiles.push({ path: path, file: file });
        }
      });
    }

    slideFiles.sort(function (a, b) {
      return parseInt(a.path.match(/\d+/)[0], 10) - parseInt(b.path.match(/\d+/)[0], 10);
    });

    if (!slideFiles.length) throw new Error('No slides found in this PPTX file.');

    var slidesHtml = [];
    for (var i = 0; i < slideFiles.length; i++) {
      onProgress && onProgress(0.3 + (i / slideFiles.length) * 0.4, 'Processing slide ' + (i + 1) + '...');

      var xml = await slideFiles[i].file.async('text');
      var texts = [];
      var matches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      matches.forEach(function (m) {
        var t = m.replace(/<[^>]+>/g, '').trim();
        if (t) texts.push(t);
      });

      var slideHtml = '<div class="slide" style="page-break-after:always;min-height:18cm;' +
        'border:1px solid #ddd;padding:2cm;margin-bottom:20px;background:white;">' +
        '<div style="color:#999;font-size:11px;margin-bottom:10px;">Slide ' + (i + 1) + ' of ' + slideFiles.length + '</div>';

      if (texts.length) {
        slideHtml += '<h2 style="margin-top:0;color:#333;">' + escapeHtml(texts[0]) + '</h2>';
        if (texts.length > 1) {
          slideHtml += '<ul style="margin-top:20px;">';
          texts.slice(1).forEach(function (t) {
            slideHtml += '<li style="margin-bottom:8px;line-height:1.5;">' + escapeHtml(t) + '</li>';
          });
          slideHtml += '</ul>';
        }
      } else {
        slideHtml += '<p style="color:#999;font-style:italic;">(No text content on this slide)</p>';
      }
      slideHtml += '</div>';
      slidesHtml.push(slideHtml);
    }

    onProgress && onProgress(0.8, 'Preparing print view...');

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(file.name) + '</title>' +
      '<style>' +
      'body{font-family:Arial,sans-serif;margin:1cm;background:#f5f5f5;}' +
      '.slide{box-shadow:0 2px 8px rgba(0,0,0,0.1);}' +
      '@media print{body{background:white;margin:0;}.no-print{display:none;}.slide{box-shadow:none;border:none;margin:0;}}' +
      '</style></head><body>' +
      '<div class="no-print" style="background:#e8f4fd;padding:12px;border-radius:6px;margin-bottom:20px;border:1px solid #90caf9;">' +
        '<strong>' + slideFiles.length + ' slides extracted.</strong> ' +
        'Press <strong>Ctrl+P</strong> then choose <strong>Save as PDF</strong>.<br><br>' +
        '<button onclick="window.print()" style="background:#F97316;color:white;border:none;' +
        'padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;">Save as PDF</button>' +
      '</div>' +
      slidesHtml.join('') +
      '</body></html>';

    var pw = window.open('', '_blank', 'width=900,height=700');
    if (!pw) throw new Error('Popup blocked. Please allow popups for this site and try again.');
    pw.document.write(html);
    pw.document.close();

    onProgress && onProgress(1.0, slideFiles.length + ' slides ready!');

    return { noDownload: true };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

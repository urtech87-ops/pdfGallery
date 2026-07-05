/* ToolsGallery — excel-to-pdf.js
   Handler: excel-to-pdf
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'excel-to-pdf',
    downloadName: 'converted.pdf',
  };

  function getOptionsHTML(pageCount) {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Page orientation</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="xls2pdf-orient" value="portrait" checked> Portrait</label>' +
        '<label><input type="radio" name="xls2pdf-orient" value="landscape"> Landscape</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Fit to page</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="xls2pdf-fit" value="yes" checked> Yes</label>' +
        '<label><input type="radio" name="xls2pdf-fit" value="no"> No</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Header styling</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="xls2pdf-header" value="bold" checked> Bold headers</label>' +
        '<label><input type="radio" name="xls2pdf-header" value="none"> No styling</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-preview-info" id="xls-preview-info" style="margin-top:8px;padding:8px;background:#f5f5f5;border-radius:4px;font-size:14px;color:#555;display:none"></div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var orient = optionsEl.querySelector('input[name="xls2pdf-orient"]:checked');
    var fit = optionsEl.querySelector('input[name="xls2pdf-fit"]:checked');
    var header = optionsEl.querySelector('input[name="xls2pdf-header"]:checked');
    return {
      orientation: orient ? orient.value : 'portrait',
      fit: fit ? fit.value : 'yes',
      headerStyle: header ? header.value : 'bold',
    };
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function escCell(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function run(file, options, onProgress) {
    if (!window.XLSX) {
      onProgress && onProgress(0.05, 'Loading spreadsheet library...');
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      if (!window.XLSX) throw new Error('Spreadsheet library failed to load. Please refresh.');
    }

    onProgress && onProgress(0.2, 'Reading Excel file...');
    var arrayBuffer = await file.arrayBuffer();
    var wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    onProgress && onProgress(0.5, 'Converting to HTML...');

    var isLandscape = options.orientation === 'landscape';
    var fitPage = options.fit === 'yes';
    var boldHeader = options.headerStyle === 'bold';

    var tableStyle = fitPage
      ? 'width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px;'
      : 'border-collapse:collapse;font-size:12px;';

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escCell(file.name) + '</title><style>' +
      'body{margin:10px;font-family:Arial,sans-serif;}' +
      'table{' + tableStyle + 'margin-bottom:20px;}' +
      'th,td{border:1px solid #999;padding:4px 8px;text-align:left;word-break:break-word;}' +
      (boldHeader ? 'th{background:#e0e0e0;font-weight:bold;}' : '') +
      'h2{color:#374151;margin-top:20px;}' +
      '@media print{' +
        '@page{size:' + (isLandscape ? 'landscape' : 'portrait') + ';margin:1cm;}' +
        '.no-print{display:none}' +
        'table{page-break-inside:auto}' +
        'tr{page-break-inside:avoid}' +
      '}' +
    '</style></head><body>' +
    '<div class="no-print" style="background:#eff6ff;padding:12px;border-radius:6px;margin-bottom:20px;border:1px solid #bfdbfe;">' +
      '<strong>Ready to save as PDF!</strong>' +
      ' Press <strong>Ctrl+P</strong> then choose <strong>Save as PDF</strong>.' +
      '<br><br>' +
      '<button onclick="window.print()" style="background:#F97316;color:white;border:none;' +
        'padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;">' +
      'Open Print Dialog</button>' +
    '</div>';

    wb.SheetNames.forEach(function (sheetName) {
      var ws = wb.Sheets[sheetName];
      var data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!data.length) return;
      var cols = data.reduce(function (max, r) { return Math.max(max, r.length); }, 0);

      if (wb.SheetNames.length > 1) html += '<h2>' + escCell(sheetName) + '</h2>';
      html += '<table>';
      data.forEach(function (row, ri) {
        html += '<tr>';
        for (var ci = 0; ci < cols; ci++) {
          var cell = row[ci] !== undefined ? String(row[ci]) : '';
          if (boldHeader && ri === 0) {
            html += '<th>' + escCell(cell) + '</th>';
          } else {
            html += '<td>' + escCell(cell) + '</td>';
          }
        }
        html += '</tr>';
      });
      html += '</table>';
    });

    html += '</body></html>';

    onProgress && onProgress(0.8, 'Opening print dialog...');

    var pw = window.open('', '_blank', 'width=1000,height=700');
    if (!pw) throw new Error('Popup blocked. Please allow popups for this site and try again.');
    pw.document.write(html);
    pw.document.close();
    setTimeout(function () { pw.print(); }, 500);

    onProgress && onProgress(1.0, 'Excel opened for printing!');

    return {
      blob: new Blob([''], { type: 'text/plain' }),
      filename: file.name.replace(/\.(xlsx?|csv)$/i, '') + '.pdf',
      noDownload: true,
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

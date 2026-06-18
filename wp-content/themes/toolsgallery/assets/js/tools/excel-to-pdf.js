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

  async function run(file, options, onProgress) {
    if (!window.XLSX) throw new Error('Spreadsheet library failed to load. Please refresh.');

    onProgress && onProgress(0.1, 'Reading spreadsheet...');
    var arrayBuffer = await file.arrayBuffer();
    var wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    var sheetName = wb.SheetNames[0];
    var ws = wb.Sheets[sheetName];
    var data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    var rows = data.length;
    var cols = data.reduce(function (max, r) { return Math.max(max, r.length); }, 0);

    onProgress && onProgress(0.4, 'Building HTML table...');

    var isLandscape = options.orientation === 'landscape';
    var fitPage = options.fit === 'yes';
    var boldHeader = options.headerStyle === 'bold';

    var tableStyle = fitPage
      ? 'width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px;'
      : 'border-collapse:collapse;font-size:12px;';

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + sheetName + '</title><style>' +
      'body{margin:10px;font-family:Arial,sans-serif;}' +
      'table{' + tableStyle + '}' +
      'th,td{border:1px solid #999;padding:4px 8px;text-align:left;word-break:break-word;}' +
      (boldHeader ? 'th{background:#e0e0e0;font-weight:bold;}' : '') +
      '@media print{' +
        '@page{size:' + (isLandscape ? 'landscape' : 'portrait') + ';margin:1cm;}' +
        '.no-print{display:none}' +
        'table{page-break-inside:auto}' +
        'tr{page-break-inside:avoid}' +
      '}' +
    '</style></head><body>' +
    '<div class="no-print" style="background:#f0f4ff;padding:15px;margin-bottom:20px;border-radius:8px;border:1px solid #c0c8f0;">' +
      '<strong>How to save as PDF:</strong>' +
      '<ol style="margin:8px 0 0 0;padding-left:20px;">' +
        '<li>Press <strong>Ctrl+P</strong> (or Cmd+P on Mac)</li>' +
        '<li>Select <strong>"Save as PDF"</strong> as the destination</li>' +
        '<li>Click <strong>Save</strong></li>' +
      '</ol>' +
    '</div>' +
    '<table>';

    data.forEach(function (row, ri) {
      html += '<tr>';
      for (var ci = 0; ci < cols; ci++) {
        var cell = row[ci] !== undefined ? String(row[ci]) : '';
        if (boldHeader && ri === 0) {
          html += '<th>' + cell.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</th>';
        } else {
          html += '<td>' + cell.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</td>';
        }
      }
      html += '</tr>';
    });
    html += '</table></body></html>';

    onProgress && onProgress(0.8, 'Opening print dialog...');

    var win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(function () { win.print(); }, 500);
    }

    // Return a text file with instructions since we opened the print window
    var blob = new Blob([
      'Excel to PDF Conversion\n\n' +
      'Spreadsheet: ' + sheetName + '\n' +
      'Rows: ' + rows + '\n' +
      'Columns: ' + cols + '\n\n' +
      'A print window has been opened. Please select "Save as PDF" in your print dialog.\n\n' +
      'Steps:\n' +
      '1. The print dialog has opened automatically (or will open shortly)\n' +
      '2. Select "Save as PDF" as the destination\n' +
      '3. Click Save'
    ], { type: 'text/plain' });

    return { blob: blob, filename: 'excel-to-pdf-instructions.txt' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

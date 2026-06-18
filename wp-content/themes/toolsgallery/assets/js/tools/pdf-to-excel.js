/* ToolsGallery — pdf-to-excel.js
   Handler: pdf-to-excel
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-to-excel',
    downloadName: 'extracted.xlsx',
  };

  function getOptionsHTML(pageCount) {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Pages</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="xls-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="xls-pages" value="specific"> Specific pages</label>' +
      '</div>' +
      '<div id="xls-pages-wrap" hidden>' +
        '<input type="text" id="xls-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Table detection sensitivity</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="xls-sensitivity" value="auto" checked> Auto</label>' +
        '<label><input type="radio" name="xls-sensitivity" value="conservative"> Conservative</label>' +
        '<label><input type="radio" name="xls-sensitivity" value="aggressive"> Aggressive</label>' +
      '</div>' +
    '</div>' +
    '<p class="tg-opt-info">Table detection groups text items by Y position and detects columns at consistent X positions.</p>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var pagesMode = optionsEl.querySelector('input[name="xls-pages"]:checked');
    var pagesInput = optionsEl.querySelector('#xls-pages-input');
    var sensitivity = optionsEl.querySelector('input[name="xls-sensitivity"]:checked');
    return {
      pagesMode: pagesMode ? pagesMode.value : 'all',
      pagesRange: pagesInput ? pagesInput.value : '',
      sensitivity: sensitivity ? sensitivity.value : 'auto',
    };
  }

  function parsePageRange(rangeStr, total) {
    var pages = [];
    var parts = rangeStr.split(',');
    parts.forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
          if (i >= 1 && i <= total) pages.push(i);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n);
      }
    });
    return pages.length ? pages : null;
  }

  async function run(file, options, onProgress) {
    if (!window.XLSX) throw new Error('Spreadsheet library failed to load. Please refresh.');
    if (!window.pdfjsLib) throw new Error('PDF library not loaded.');

    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var totalPages = pdf.numPages;

    var pageNums = (options.pagesMode === 'specific' && options.pagesRange)
      ? parsePageRange(options.pagesRange, totalPages)
      : null;
    if (!pageNums) {
      pageNums = [];
      for (var i = 1; i <= totalPages; i++) pageNums.push(i);
    }

    var yTol = options.sensitivity === 'conservative' ? 1 : options.sensitivity === 'aggressive' ? 5 : 3;
    var xTol = options.sensitivity === 'conservative' ? 5 : options.sensitivity === 'aggressive' ? 15 : 10;

    var wb = XLSX.utils.book_new();
    var allText = [];
    var tablesFound = 0;

    for (var p = 0; p < pageNums.length; p++) {
      onProgress && onProgress(p / pageNums.length, 'Processing page ' + pageNums[p] + '...');
      var page = await pdf.getPage(pageNums[p]);
      var tc = await page.getTextContent();
      var items = tc.items.filter(function (it) { return it.str && it.str.trim(); });

      if (!items.length) continue;
      allText = allText.concat(items.map(function (it) { return it.str; }));

      // Group by Y (rows)
      var rows = [];
      items.forEach(function (it) {
        var y = Math.round(it.transform[5]);
        var found = false;
        for (var r = 0; r < rows.length; r++) {
          if (Math.abs(rows[r].y - y) <= yTol) {
            rows[r].items.push(it);
            found = true;
            break;
          }
        }
        if (!found) rows.push({ y: y, items: [it] });
      });
      rows.sort(function (a, b) { return b.y - a.y; });
      rows.forEach(function (r) { r.items.sort(function (a, b) { return a.transform[4] - b.transform[4]; }); });

      // Detect tables: rows with multiple items at consistent X positions
      var colPositions = [];
      rows.forEach(function (r) {
        if (r.items.length >= 2) {
          r.items.forEach(function (it) {
            var x = it.transform[4];
            var matched = false;
            for (var c = 0; c < colPositions.length; c++) {
              if (Math.abs(colPositions[c] - x) <= xTol) { matched = true; break; }
            }
            if (!matched) colPositions.push(x);
          });
        }
      });
      colPositions.sort(function (a, b) { return a - b; });

      var isTable = colPositions.length >= 2 && rows.filter(function (r) { return r.items.length >= 2; }).length >= 2;

      var sheetData = [];
      if (isTable) {
        tablesFound++;
        rows.forEach(function (r) {
          var row = new Array(colPositions.length).fill('');
          r.items.forEach(function (it) {
            var x = it.transform[4];
            var bestCol = 0, bestDist = Infinity;
            colPositions.forEach(function (cp, ci) {
              var d = Math.abs(cp - x);
              if (d < bestDist) { bestDist = d; bestCol = ci; }
            });
            row[bestCol] = (row[bestCol] ? row[bestCol] + ' ' : '') + it.str;
          });
          sheetData.push(row);
        });
      } else {
        rows.forEach(function (r) {
          sheetData.push([r.items.map(function (it) { return it.str; }).join(' ')]);
        });
      }

      var ws = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, 'Page ' + pageNums[p]);
    }

    if (!allText.length) throw new Error('This PDF appears to contain only images.');

    onProgress && onProgress(0.95, 'Building spreadsheet...');
    var xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    var blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

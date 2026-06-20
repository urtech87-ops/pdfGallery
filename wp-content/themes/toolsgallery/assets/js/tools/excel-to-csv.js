/* Excel to CSV — Phase 7 Tool 1 */
(function () {
  'use strict';
  var CONFIG = { handler: 'excel-to-csv' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Sheet Selection</label>
    <select id="opt-sheet-select"><option value="all">All Sheets</option></select>
  </div>
  <div class="tg-option-group">
    <label>Delimiter</label>
    <select id="opt-delimiter">
      <option value=",">Comma (,)</option>
      <option value=";">Semicolon (;)</option>
      <option value="\t">Tab</option>
      <option value="|">Pipe (|)</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Encoding</label>
    <select id="opt-encoding">
      <option value="utf8">UTF-8</option>
      <option value="utf8bom">UTF-8 BOM (Excel compatible)</option>
    </select>
  </div>
</div>`;
  }

  function getOptions(el) {
    return {
      sheet: el.querySelector('#opt-sheet-select').value,
      delimiter: el.querySelector('#opt-delimiter').value,
      encoding: el.querySelector('#opt-encoding').value,
    };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(10, 'Reading Excel file…');
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array' });
    const names = workbook.SheetNames;

    // Populate sheet selector after workbook is known
    const sel = document.getElementById('opt-sheet-select');
    if (sel && sel.options.length === 1) {
      names.forEach(n => {
        const o = document.createElement('option');
        o.value = n; o.textContent = n;
        sel.appendChild(o);
      });
    }

    const delim = options.delimiter || ',';
    const selectedSheet = options.sheet || 'all';
    const sheets = selectedSheet === 'all' ? names : [selectedSheet];

    onProgress && onProgress(40, 'Converting sheets…');

    const results = sheets.map(name => {
      const ws = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: delim });
      return { name, csv };
    });

    onProgress && onProgress(80, 'Preparing download…');

    if (results.length === 1) {
      let content = results[0].csv;
      if (options.encoding === 'utf8bom') content = '﻿' + content;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      const outName = file.name.replace(/\.(xlsx|xls)$/i, '') + '.csv';

      // Show preview
      showPreview(results[0].csv, results[0].name);

      return { blob, filename: outName };
    }

    // Multiple sheets → ZIP
    const zip = new JSZip();
    results.forEach(r => {
      let content = r.csv;
      if (options.encoding === 'utf8bom') content = '﻿' + content;
      zip.file(r.name + '.csv', content);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const baseName = file.name.replace(/\.(xlsx|xls)$/i, '');

    showPreview(results[0].csv, results[0].name + ' (first sheet)');

    return { blob: zipBlob, filename: baseName + '_sheets.zip' };
  }

  function showPreview(csv, sheetName) {
    const rows = csv.split('\n').slice(0, 6).filter(Boolean);
    if (!rows.length) return;
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;

    let prev = document.getElementById('tg-csv-preview');
    if (prev) prev.remove();

    const div = document.createElement('div');
    div.id = 'tg-csv-preview';
    div.style.cssText = 'margin:16px 0;overflow-x:auto';
    const cols = rows[0].split(',');
    let html = `<p style="font-size:13px;color:#666;margin-bottom:8px">Preview: <strong>${sheetName}</strong> (first 5 rows)</p><table style="width:100%;border-collapse:collapse;font-size:13px">`;
    rows.forEach((row, i) => {
      const cells = row.split(',');
      html += '<tr>';
      cells.forEach(c => {
        const tag = i === 0 ? 'th' : 'td';
        html += `<${tag} style="border:1px solid #e0e0e0;padding:4px 8px;background:${i===0?'#f5f5f5':'#fff'}">${c}</${tag}>`;
      });
      html += '</tr>';
    });
    html += '</table>';
    div.innerHTML = html;
    container.insertBefore(div, container.querySelector('.tg-action-btn') || container.firstChild);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

/* CSV to Excel — Phase 7 Tool 2 */
(function () {
  'use strict';
  var CONFIG = { handler: 'csv-to-excel', multiFile: true };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Delimiter</label>
    <select id="opt-delimiter">
      <option value="auto">Auto-detect</option>
      <option value=",">Comma (,)</option>
      <option value=";">Semicolon (;)</option>
      <option value="\t">Tab</option>
      <option value="|">Pipe (|)</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>First Row</label>
    <select id="opt-header">
      <option value="yes">Is Header Row</option>
      <option value="no">Not a Header</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Sheet Name</label>
    <select id="opt-sheetname" onchange="document.getElementById('opt-sheetname-custom').style.display=this.value==='custom'?'block':'none'">
      <option value="filename">Use Filename</option>
      <option value="custom">Custom…</option>
    </select>
    <input id="opt-sheetname-custom" type="text" placeholder="Sheet name" style="display:none;margin-top:6px;width:100%;padding:6px;border:1px solid #ddd;border-radius:4px">
  </div>
</div>`;
  }

  function getOptions(el) {
    const sheetMode = el.querySelector('#opt-sheetname').value;
    return {
      delimiter: el.querySelector('#opt-delimiter').value,
      firstRowHeader: el.querySelector('#opt-header').value === 'yes',
      sheetNameMode: sheetMode,
      customSheetName: el.querySelector('#opt-sheetname-custom').value || 'Sheet1',
    };
  }

  function detectDelimiter(text) {
    const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
    const sample = text.slice(0, 2000);
    for (const ch of sample) if (ch in counts) counts[ch]++;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
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

  async function run(files, options, onProgress) {
    if (!window.XLSX) {
      onProgress && onProgress(0.05, 'Loading spreadsheet library…');
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      if (!window.XLSX) throw new Error('Excel library not loaded. Please refresh the page.');
    }
    const fileList = Array.isArray(files) ? files : [files];
    const workbook = XLSX.utils.book_new();

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      onProgress && onProgress((i / fileList.length) * 0.8, `Processing ${file.name}…`);
      const text = await file.text();
      const delim = options.delimiter === 'auto' ? detectDelimiter(text) : options.delimiter;
      const ws = XLSX.utils.csv_to_sheet(text, { FS: delim });
      const sheetName = options.sheetNameMode === 'custom'
        ? (options.customSheetName || 'Sheet' + (i + 1))
        : file.name.replace(/\.csv$/i, '').slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }

    onProgress && onProgress(0.9, 'Writing Excel…');
    const excelBuf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    showPreview(fileList[0]);

    const outName = fileList.length === 1
      ? fileList[0].name.replace(/\.csv$/i, '') + '.xlsx'
      : 'converted.xlsx';
    return { blob, filename: outName };
  }

  async function showPreview(file) {
    try {
      const text = await file.text();
      const rows = text.split('\n').slice(0, 6).filter(Boolean);
      const container = document.querySelector('.tg-tool-box');
      if (!container || !rows.length) return;
      let prev = document.getElementById('tg-csv-preview');
      if (prev) prev.remove();
      const div = document.createElement('div');
      div.id = 'tg-csv-preview';
      div.style.cssText = 'margin:16px 0;overflow-x:auto';
      let html = `<p style="font-size:13px;color:#666;margin-bottom:8px">Preview: <strong>${file.name}</strong></p><table style="width:100%;border-collapse:collapse;font-size:13px">`;
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
      container.appendChild(div);
    } catch (e) {}
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

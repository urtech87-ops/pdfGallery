/* CSV to JSON — Phase 7 Tool 4 */
(function () {
  'use strict';
  var CONFIG = { handler: 'csv-to-json' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>First Row</label>
    <select id="opt-header">
      <option value="yes">Is Header Row</option>
      <option value="no">Use Column Indices</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Output Format</label>
    <select id="opt-format">
      <option value="array">Array of Objects [{…},{…}]</option>
      <option value="indexed">Indexed Object {"0":{…}}</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Number Detection</label>
    <select id="opt-numbers">
      <option value="yes">Auto-convert numbers</option>
      <option value="no">Keep as strings</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Pretty Print</label>
    <select id="opt-pretty">
      <option value="yes">Yes (2 spaces)</option>
      <option value="no">Minified</option>
    </select>
  </div>
</div>`;
  }

  function getOptions(el) {
    return {
      hasHeader: el.querySelector('#opt-header').value === 'yes',
      format: el.querySelector('#opt-format').value,
      autoNumbers: el.querySelector('#opt-numbers').value === 'yes',
      pretty: el.querySelector('#opt-pretty').value === 'yes',
    };
  }

  function parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current); current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  function detectDelimiter(text) {
    const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
    const sample = text.slice(0, 2000);
    for (const ch of sample) if (ch in counts) counts[ch]++;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Reading CSV…');
    const text = await file.text();
    const delim = detectDelimiter(text);
    const lines = text.split(/\r?\n/).filter(l => l.trim());

    onProgress && onProgress(0.4, 'Parsing…');
    let headers, dataLines;
    if (options.hasHeader) {
      headers = parseCSVLine(lines[0], delim).map(h => h.trim());
      dataLines = lines.slice(1);
    } else {
      const cols = parseCSVLine(lines[0], delim).length;
      headers = Array.from({ length: cols }, (_, i) => String(i));
      dataLines = lines;
    }

    const rows = dataLines.map(line => {
      const vals = parseCSVLine(line, delim);
      return headers.reduce((obj, h, i) => {
        let v = (vals[i] || '').trim();
        if (options.autoNumbers && v !== '' && !isNaN(v)) v = Number(v);
        obj[h] = v;
        return obj;
      }, {});
    });

    let result;
    if (options.format === 'indexed') {
      result = rows.reduce((obj, row, i) => { obj[i] = row; return obj; }, {});
    } else {
      result = rows;
    }

    const jsonStr = options.pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
    onProgress && onProgress(0.8, 'Rendering…');

    showOutput(jsonStr, rows.length, headers.length);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    return { blob, filename: file.name.replace(/\.csv$/i, '') + '.json' };
  }

  function showOutput(jsonStr, rowCount, colCount) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-json-output');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-json-output';
    div.style.cssText = 'margin:16px 0';
    div.innerHTML = `
      <p style="font-size:13px;color:#555;margin-bottom:8px"><strong>${rowCount}</strong> rows · <strong>${colCount}</strong> columns detected</p>
      <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:12px;padding:10px;border:1px solid #ddd;border-radius:6px;resize:vertical">${jsonStr.slice(0, 5000)}${jsonStr.length > 5000 ? '\n// …truncated for preview' : ''}</textarea>
      <button onclick="navigator.clipboard.writeText(document.getElementById('tg-json-full').value)" style="margin-top:8px;padding:6px 14px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer">Copy JSON</button>
      <textarea id="tg-json-full" style="display:none">${jsonStr}</textarea>`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

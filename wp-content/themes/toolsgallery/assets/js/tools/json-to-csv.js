/* JSON to CSV — Phase 7 Tool 3 */
(function () {
  'use strict';
  var CONFIG = { handler: 'json-to-csv' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Flatten Nested Objects</label>
    <select id="opt-flatten">
      <option value="yes">Yes (dot notation keys)</option>
      <option value="no">No</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Array Handling</label>
    <select id="opt-arrays">
      <option value="stringify">Stringify arrays</option>
      <option value="expand">Expand (one row per item)</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Delimiter</label>
    <select id="opt-delimiter">
      <option value=",">Comma (,)</option>
      <option value=";">Semicolon (;)</option>
      <option value="\t">Tab</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Include Headers</label>
    <select id="opt-headers">
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  </div>
</div>`;
  }

  function getOptions(el) {
    return {
      flatten: el.querySelector('#opt-flatten').value === 'yes',
      arrayHandling: el.querySelector('#opt-arrays').value,
      delimiter: el.querySelector('#opt-delimiter').value,
      includeHeaders: el.querySelector('#opt-headers').value === 'yes',
    };
  }

  function flattenObject(obj, prefix) {
    prefix = prefix || '';
    return Object.keys(obj).reduce(function (acc, key) {
      const fullKey = prefix ? prefix + '.' + key : key;
      const val = obj[key];
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(acc, flattenObject(val, fullKey));
      } else {
        acc[fullKey] = Array.isArray(val) ? JSON.stringify(val) : val;
      }
      return acc;
    }, {});
  }

  function quoteCSVField(val, delim) {
    const s = val === null || val === undefined ? '' : String(val);
    if (s.includes(delim) || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Reading JSON…');
    const text = await file.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON: ' + e.message);
    }

    let rows = Array.isArray(json) ? json : [json];

    if (options.arrayHandling === 'expand') {
      const expanded = [];
      rows.forEach(r => {
        let hasArray = false;
        Object.entries(r).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            hasArray = true;
            v.forEach(item => expanded.push(Object.assign({}, r, { [k]: item })));
          }
        });
        if (!hasArray) expanded.push(r);
      });
      rows = expanded;
    }

    onProgress && onProgress(0.4, 'Flattening…');
    const flatRows = options.flatten ? rows.map(r => flattenObject(r)) : rows;
    const headers = [...new Set(flatRows.flatMap(r => Object.keys(r)))];
    const delim = options.delimiter;

    const csvLines = [];
    if (options.includeHeaders) {
      csvLines.push(headers.map(h => quoteCSVField(h, delim)).join(delim));
    }
    flatRows.forEach(r => {
      csvLines.push(headers.map(h => quoteCSVField(r[h], delim)).join(delim));
    });
    const csv = csvLines.join('\n');

    onProgress && onProgress(0.8, 'Done');
    showInfo(rows.length, headers.length, json);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    return { blob, filename: file.name.replace(/\.json$/i, '') + '.csv' };
  }

  function showInfo(rowCount, fieldCount, json) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-json-info');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-json-info';
    div.style.cssText = 'margin:12px 0;padding:10px 14px;background:#f0f9ff;border-radius:6px;font-size:13px;color:#555';
    div.innerHTML = `<strong>Detected:</strong> ${rowCount} rows · ${fieldCount} fields · JSON type: ${Array.isArray(json) ? 'Array' : 'Object'}`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

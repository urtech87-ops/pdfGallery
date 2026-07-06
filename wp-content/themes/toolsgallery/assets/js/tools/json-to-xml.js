/* JSON to XML — Phase 7 Tool 6 */
(function () {
  'use strict';
  var CONFIG = { handler: 'json-to-xml' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Root Element Name</label>
    <input id="opt-root" type="text" value="root" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px">
  </div>
  <div class="tg-option-group">
    <label>Array Item Tag</label>
    <input id="opt-item-tag" type="text" value="item" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px">
  </div>
  <div class="tg-option-group">
    <label>Indentation</label>
    <select id="opt-indent">
      <option value="2">2 Spaces</option>
      <option value="4">4 Spaces</option>
      <option value="tab">Tab</option>
      <option value="0">Minified</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>XML Declaration</label>
    <select id="opt-decl">
      <option value="yes">Include</option>
      <option value="no">Exclude</option>
    </select>
  </div>
</div>`;
  }

  function getOptions(el) {
    return {
      rootName: (el.querySelector('#opt-root').value || 'root').replace(/[^a-zA-Z0-9_-]/g, '_'),
      itemTag: (el.querySelector('#opt-item-tag').value || 'item').replace(/[^a-zA-Z0-9_-]/g, '_'),
      indent: el.querySelector('#opt-indent').value,
      declaration: el.querySelector('#opt-decl').value === 'yes',
    };
  }

  function safeTag(key) {
    return key.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/^([0-9])/, '_$1') || '_element';
  }

  function jsonToXml(obj, itemTag, indentStr, depth) {
    const pad = indentStr.repeat(depth);
    const childPad = indentStr.repeat(depth + 1);
    const nl = indentStr ? '\n' : '';

    if (Array.isArray(obj)) {
      return obj.map(item => {
        const inner = jsonToXml(item, itemTag, indentStr, depth + 1);
        const hasChildren = typeof item === 'object' && item !== null;
        return hasChildren
          ? `${pad}<${itemTag}>${nl}${inner}${nl}${pad}</${itemTag}>`
          : `${pad}<${itemTag}>${inner}</${itemTag}>`;
      }).join(nl);
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).map(([key, val]) => {
        const tag = safeTag(key);
        if (typeof val === 'object' && val !== null) {
          const inner = jsonToXml(val, itemTag, indentStr, depth + 1);
          const isArr = Array.isArray(val);
          if (isArr) {
            return `${pad}<${tag}>${nl}${inner}${nl}${pad}</${tag}>`;
          }
          return `${pad}<${tag}>${nl}${inner}${nl}${pad}</${tag}>`;
        }
        const escaped = String(val === null ? '' : val)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
        return `${pad}<${tag}>${escaped}</${tag}>`;
      }).join(nl);
    }

    return String(obj === null ? '' : obj);
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Reading JSON…');
    const text = await file.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON: ' + e.message); }

    onProgress && onProgress(0.4, 'Converting…');
    const indentChar = options.indent === 'tab' ? '\t' : options.indent === '0' ? '' : ' '.repeat(Number(options.indent));
    const nl = indentChar ? '\n' : '';
    const inner = jsonToXml(json, options.itemTag, indentChar, 1);
    let xml = `${indentChar ? '' : ''}<${options.rootName}>${nl}${inner}${nl}</${options.rootName}>`;
    if (options.declaration) xml = `<?xml version="1.0" encoding="UTF-8"?>${nl}${xml}`;

    onProgress && onProgress(0.8, 'Done');
    showOutput(xml);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    return { blob, filename: file.name.replace(/\.json$/i, '') + '.xml' };
  }

  function showOutput(xml) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-xml-output');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-xml-output';
    div.style.cssText = 'margin:16px 0';
    div.innerHTML = `
      <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:12px;padding:10px;border:1px solid #ddd;border-radius:6px;resize:vertical">${xml.replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0, 5000)}</textarea>
      <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)" style="margin-top:8px;padding:6px 14px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer">Copy XML</button>`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

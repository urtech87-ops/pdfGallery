/* XML to JSON — Phase 7 Tool 5 */
(function () {
  'use strict';
  var CONFIG = { handler: 'xml-to-json' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>XML Attributes</label>
    <select id="opt-attrs">
      <option value="yes">Include (@attributes key)</option>
      <option value="no">Ignore attributes</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Remove Namespace Prefixes</label>
    <select id="opt-ns">
      <option value="yes">Yes</option>
      <option value="no">No</option>
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
      includeAttrs: el.querySelector('#opt-attrs').value === 'yes',
      removeNS: el.querySelector('#opt-ns').value === 'yes',
      pretty: el.querySelector('#opt-pretty').value === 'yes',
    };
  }

  function xmlToJson(node, options) {
    if (node.nodeType === 3) {
      const text = node.nodeValue.trim();
      return text || undefined;
    }
    if (node.nodeType === 8) return undefined; // comment

    const obj = {};
    if (options.includeAttrs && node.attributes && node.attributes.length > 0) {
      obj['@attributes'] = {};
      for (const attr of node.attributes) {
        const attrName = options.removeNS ? attr.nodeName.replace(/^[^:]+:/, '') : attr.nodeName;
        obj['@attributes'][attrName] = attr.nodeValue;
      }
    }

    if (node.hasChildNodes()) {
      for (const child of node.childNodes) {
        const childJson = xmlToJson(child, options);
        if (childJson === undefined) continue;
        let nodeName = child.nodeName;
        if (options.removeNS) nodeName = nodeName.replace(/^[^:]+:/, '');
        if (nodeName === '#text') {
          if (Object.keys(obj).length === 0) return childJson;
          obj['#text'] = childJson;
        } else if (obj[nodeName] === undefined) {
          obj[nodeName] = childJson;
        } else if (Array.isArray(obj[nodeName])) {
          obj[nodeName].push(childJson);
        } else {
          obj[nodeName] = [obj[nodeName], childJson];
        }
      }
    }

    return obj;
  }

  function countElements(node) {
    let count = 0, depth = 0;
    function walk(n, d) {
      if (n.nodeType === 1) { count++; depth = Math.max(depth, d); }
      for (const c of n.childNodes) walk(c, d + 1);
    }
    walk(node, 0);
    return { count, depth };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Reading XML…');
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'application/xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) throw new Error('Invalid XML: ' + parseError.textContent.slice(0, 200));

    onProgress && onProgress(0.4, 'Converting…');
    const { count, depth } = countElements(xmlDoc.documentElement);
    const json = {};
    const rootName = xmlDoc.documentElement.nodeName;
    json[options.removeNS ? rootName.replace(/^[^:]+:/, '') : rootName] = xmlToJson(xmlDoc.documentElement, options);

    const jsonStr = options.pretty ? JSON.stringify(json, null, 2) : JSON.stringify(json);
    onProgress && onProgress(0.8, 'Done');

    showOutput(jsonStr, count, depth);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    return { blob, filename: file.name.replace(/\.xml$/i, '') + '.json' };
  }

  function showOutput(jsonStr, elemCount, maxDepth) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-xml-output');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-xml-output';
    div.style.cssText = 'margin:16px 0';
    div.innerHTML = `
      <p style="font-size:13px;color:#555;margin-bottom:8px"><strong>${elemCount}</strong> elements · max depth <strong>${maxDepth}</strong></p>
      <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:12px;padding:10px;border:1px solid #ddd;border-radius:6px;resize:vertical">${jsonStr.slice(0, 5000)}${jsonStr.length > 5000 ? '\n// …truncated' : ''}</textarea>
      <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)" style="margin-top:8px;padding:6px 14px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer">Copy JSON</button>`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

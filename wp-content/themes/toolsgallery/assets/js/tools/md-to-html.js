/* Markdown to HTML — Phase 7 Tool 7 */
(function () {
  'use strict';
  var CONFIG = { handler: 'md-to-html' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Output Type</label>
    <select id="opt-output-type">
      <option value="fragment">Fragment (content only)</option>
      <option value="full">Full HTML page</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Include CSS</label>
    <select id="opt-css">
      <option value="none">None</option>
      <option value="basic">Basic Typography</option>
      <option value="github">GitHub Style</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Live Preview</label>
    <select id="opt-preview">
      <option value="yes">Show Split Preview</option>
      <option value="no">No Preview</option>
    </select>
  </div>
</div>`;
  }

  function getOptions(el) {
    return {
      outputType: el.querySelector('#opt-output-type').value,
      css: el.querySelector('#opt-css').value,
      preview: el.querySelector('#opt-preview').value === 'yes',
    };
  }

  const GITHUB_CSS = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#24292e;max-width:980px;margin:0 auto;padding:45px}h1,h2,h3,h4,h5,h6{margin-top:24px;margin-bottom:16px;font-weight:600;line-height:1.25}h1{font-size:2em;border-bottom:1px solid #eaecef;padding-bottom:.3em}h2{font-size:1.5em;border-bottom:1px solid #eaecef;padding-bottom:.3em}p{margin-top:0;margin-bottom:16px}code{background:#f6f8fa;padding:.2em .4em;border-radius:3px;font-family:monospace}pre{background:#f6f8fa;padding:16px;border-radius:6px;overflow:auto}pre code{background:none;padding:0}blockquote{margin:0;padding:0 1em;color:#6a737d;border-left:.25em solid #dfe2e5}table{border-collapse:collapse;width:100%}th,td{padding:6px 13px;border:1px solid #dfe2e5}tr:nth-child(even){background:#f6f8fa}a{color:#0366d6}img{max-width:100%}ul,ol{padding-left:2em;margin:0 0 16px}`;
  const BASIC_CSS = `body{font-family:Georgia,serif;font-size:16px;line-height:1.6;max-width:800px;margin:40px auto;padding:0 20px;color:#333}h1,h2,h3{margin-top:1.5em}code{background:#f4f4f4;padding:2px 6px;border-radius:3px;font-family:monospace}pre{background:#f4f4f4;padding:12px;border-radius:4px}blockquote{border-left:4px solid #ccc;padding-left:16px;color:#666}`;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Reading Markdown…');
    const mdText = await file.text();

    if (typeof marked === 'undefined') {
      onProgress && onProgress(0.2, 'Loading Markdown parser…');
      await loadScript('https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js');
      if (typeof marked === 'undefined') throw new Error('marked.js not loaded. Please refresh.');
    }

    marked.setOptions({ breaks: true, gfm: true });
    const htmlContent = marked.parse(mdText);

    onProgress && onProgress(0.6, 'Building output…');

    let finalHtml;
    if (options.outputType === 'full') {
      const css = options.css === 'github' ? GITHUB_CSS : options.css === 'basic' ? BASIC_CSS : '';
      finalHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${file.name.replace(/\.(md|markdown)$/i, '')}</title>${css ? `\n<style>\n${css}\n</style>` : ''}\n</head>\n<body>\n${htmlContent}\n</body>\n</html>`;
    } else {
      finalHtml = htmlContent;
    }

    if (options.preview) showPreview(mdText, htmlContent);
    else showCodeOutput(finalHtml);

    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    return { blob, filename: file.name.replace(/\.(md|markdown)$/i, '') + '.html' };
  }

  function showPreview(mdText, htmlContent) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-md-preview');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-md-preview';
    div.style.cssText = 'margin:16px 0;display:grid;grid-template-columns:1fr 1fr;gap:12px';
    div.innerHTML = `
      <div>
        <p style="font-size:12px;color:#888;margin:0 0 4px">Markdown</p>
        <textarea id="tg-md-source" style="width:100%;height:300px;font-family:monospace;font-size:13px;padding:10px;border:1px solid #ddd;border-radius:6px;resize:vertical;box-sizing:border-box">${mdText.replace(/</g,'&lt;')}</textarea>
      </div>
      <div>
        <p style="font-size:12px;color:#888;margin:0 0 4px">Preview</p>
        <div id="tg-md-rendered" style="height:300px;overflow:auto;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;line-height:1.6">${htmlContent}</div>
      </div>`;
    container.appendChild(div);
    document.getElementById('tg-md-source').addEventListener('input', function () {
      document.getElementById('tg-md-rendered').innerHTML = marked.parse(this.value);
    });
  }

  function showCodeOutput(html) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-md-preview');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-md-preview';
    div.style.cssText = 'margin:16px 0';
    div.innerHTML = `<textarea readonly style="width:100%;height:250px;font-family:monospace;font-size:12px;padding:10px;border:1px solid #ddd;border-radius:6px;resize:vertical">${html.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

/* HTML to Markdown — Phase 7 Tool 8 */
(function () {
  'use strict';
  var CONFIG = { handler: 'html-to-md' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Heading Style</label>
    <select id="opt-heading">
      <option value="atx">ATX (## Heading)</option>
      <option value="setext">Setext (underline)</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Code Block Style</label>
    <select id="opt-code">
      <option value="fenced">Fenced (\`\`\`)</option>
      <option value="indented">Indented (4 spaces)</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Link Style</label>
    <select id="opt-links">
      <option value="inlined">Inline</option>
      <option value="referenced">Reference</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Image Alt Text</label>
    <select id="opt-img">
      <option value="keep">Keep</option>
      <option value="remove">Remove</option>
    </select>
  </div>
</div>`;
  }

  function getOptions(el) {
    return {
      headingStyle: el.querySelector('#opt-heading').value,
      codeBlockStyle: el.querySelector('#opt-code').value,
      linkStyle: el.querySelector('#opt-links').value,
      keepImageAlt: el.querySelector('#opt-img').value === 'keep',
    };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Reading HTML…');
    const html = await file.text();

    // Turndown is enqueued server-side (COEP blocks runtime script injection)
    if (typeof TurndownService === 'undefined') throw new Error('Converter failed to load. Please refresh.');

    onProgress && onProgress(0.4, 'Converting…');
    const td = new TurndownService({
      headingStyle: options.headingStyle,
      codeBlockStyle: options.codeBlockStyle,
      linkStyle: options.linkStyle,
      bulletListMarker: '-',
      hr: '---',
    });

    // GFM table support
    td.addRule('table', {
      filter: 'table',
      replacement: function (_, node) {
        const rows = Array.from(node.querySelectorAll('tr'));
        if (!rows.length) return '';
        const headerCells = Array.from(rows[0].querySelectorAll('th,td')).map(c => c.textContent.trim().replace(/\|/g, '\\|'));
        const sep = headerCells.map(() => '---');
        let md = '| ' + headerCells.join(' | ') + ' |\n';
        md += '| ' + sep.join(' | ') + ' |\n';
        rows.slice(1).forEach(row => {
          const cells = Array.from(row.querySelectorAll('td,th')).map(c => c.textContent.trim().replace(/\|/g, '\\|'));
          md += '| ' + cells.join(' | ') + ' |\n';
        });
        return '\n\n' + md + '\n';
      },
    });

    if (!options.keepImageAlt) {
      td.addRule('removeImages', { filter: 'img', replacement: () => '' });
    }

    const markdown = td.turndown(html);
    onProgress && onProgress(0.8, 'Done');

    showOutput(markdown);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    return { blob, filename: file.name.replace(/\.html?$/i, '') + '.md' };
  }

  function showOutput(markdown) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-html-md-output');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-html-md-output';
    div.style.cssText = 'margin:16px 0';
    div.innerHTML = `
      <p style="font-size:13px;color:#555;margin-bottom:8px">Converted Markdown (${markdown.split('\n').length} lines)</p>
      <textarea readonly style="width:100%;height:250px;font-family:monospace;font-size:13px;padding:10px;border:1px solid #ddd;border-radius:6px;resize:vertical">${markdown.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
      <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)" style="margin-top:8px;padding:6px 14px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer">Copy Markdown</button>`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

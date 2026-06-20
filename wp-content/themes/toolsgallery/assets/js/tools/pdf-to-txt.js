/* PDF to TXT — Phase 7 Tool 10 */
(function () {
  'use strict';
  var CONFIG = { handler: 'pdf-to-txt' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Page Separator</label>
    <select id="opt-separator">
      <option value="dash">--- Page N ---</option>
      <option value="equals">===== Page N =====</option>
      <option value="none">None</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Pages</label>
    <select id="opt-pages">
      <option value="all">All Pages</option>
      <option value="range">Page Range…</option>
    </select>
    <input id="opt-page-range" type="text" placeholder="e.g. 1-3, 5, 7-9" style="display:none;margin-top:6px;width:100%;padding:6px;border:1px solid #ddd;border-radius:4px">
  </div>
</div>
<script>
(function(){
  var s=document.getElementById('opt-pages'),r=document.getElementById('opt-page-range');
  if(s) s.addEventListener('change',function(){ r.style.display=s.value==='range'?'block':'none'; });
})();
</script>`;
  }

  function getOptions(el) {
    return {
      separator: el.querySelector('#opt-separator').value,
      pageMode: el.querySelector('#opt-pages').value,
      pageRange: el.querySelector('#opt-page-range').value,
    };
  }

  function parsePageRange(rangeStr, total) {
    const pages = new Set();
    rangeStr.split(',').forEach(part => {
      part = part.trim();
      const m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (let i = Number(m[1]); i <= Math.min(Number(m[2]), total); i++) pages.add(i);
      } else if (/^\d+$/.test(part)) {
        const n = Number(part);
        if (n >= 1 && n <= total) pages.add(n);
      }
    });
    return pages.size ? [...pages].sort((a, b) => a - b) : null;
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(10, 'Loading PDF…');
    const buf = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
    const total = pdfDoc.numPages;

    let pageNums;
    if (options.pageMode === 'range' && options.pageRange) {
      pageNums = parsePageRange(options.pageRange, total) || Array.from({ length: total }, (_, i) => i + 1);
    } else {
      pageNums = Array.from({ length: total }, (_, i) => i + 1);
    }

    let fullText = '';
    for (let idx = 0; idx < pageNums.length; idx++) {
      const pageNum = pageNums[idx];
      onProgress && onProgress(10 + Math.round((idx / pageNums.length) * 80), `Extracting page ${pageNum}/${total}…`);
      const page = await pdfDoc.getPage(pageNum);
      const tc = await page.getTextContent();
      const pageText = tc.items.map(i => i.str).join(' ').replace(/ {2,}/g, ' ').trim();

      if (options.separator === 'dash') fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
      else if (options.separator === 'equals') fullText += `===== Page ${pageNum} =====\n${pageText}\n\n`;
      else fullText += pageText + '\n\n';
    }

    onProgress && onProgress(95, 'Done');
    showOutput(fullText, total);
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    return { blob, filename: file.name.replace(/\.pdf$/i, '') + '.txt' };
  }

  function showOutput(text, totalPages) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-txt-output');
    if (el) el.remove();
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    const div = document.createElement('div');
    div.id = 'tg-txt-output';
    div.style.cssText = 'margin:16px 0';
    div.innerHTML = `
      <p style="font-size:13px;color:#555;margin-bottom:8px">${totalPages} pages · ${words.toLocaleString()} words · ${chars.toLocaleString()} characters</p>
      <textarea readonly style="width:100%;height:250px;font-family:monospace;font-size:12px;padding:10px;border:1px solid #ddd;border-radius:6px;resize:vertical">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0, 8000)}${text.length > 8000 ? '\n\n[…truncated in preview]' : ''}</textarea>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button onclick="navigator.clipboard.writeText(document.getElementById('tg-txt-full').value)" style="padding:6px 14px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer">Copy All</button>
      </div>
      <textarea id="tg-txt-full" style="display:none">${text}</textarea>`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

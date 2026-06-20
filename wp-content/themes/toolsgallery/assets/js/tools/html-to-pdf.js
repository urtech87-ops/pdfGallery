/* HTML to PDF — Phase 7 Tool 11 */
(function () {
  'use strict';
  var CONFIG = { handler: 'html-to-pdf' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Page Size</label>
    <select id="opt-pagesize">
      <option value="a4">A4</option>
      <option value="letter">Letter</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Orientation</label>
    <select id="opt-orient">
      <option value="portrait">Portrait</option>
      <option value="landscape">Landscape</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Margins</label>
    <select id="opt-margin">
      <option value="none">None</option>
      <option value="normal" selected>Normal</option>
      <option value="wide">Wide</option>
    </select>
  </div>
</div>
<div id="tg-html-tabs" style="margin:16px 0">
  <div style="display:flex;gap:0;border-bottom:2px solid #e0e0e0;margin-bottom:12px">
    <button id="tab-upload" onclick="tgHtmlTab('upload')" style="padding:8px 18px;border:none;background:#0073aa;color:#fff;cursor:pointer;border-radius:4px 4px 0 0">Upload HTML File</button>
    <button id="tab-paste" onclick="tgHtmlTab('paste')" style="padding:8px 18px;border:none;background:#f0f0f0;color:#333;cursor:pointer;border-radius:4px 4px 0 0;margin-left:4px">Paste HTML</button>
  </div>
  <div id="tab-upload-panel"></div>
  <div id="tab-paste-panel" style="display:none">
    <textarea id="tg-html-input" placeholder="Paste your HTML code here…" style="width:100%;height:200px;font-family:monospace;font-size:13px;padding:10px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;resize:vertical"></textarea>
    <button onclick="tgHtmlRender()" style="margin-top:8px;padding:8px 20px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer">Convert to PDF</button>
    <div id="tg-html-preview-frame" style="margin-top:12px;border:1px solid #ddd;border-radius:6px;overflow:hidden;display:none">
      <iframe id="tg-html-iframe" style="width:100%;height:400px;border:none" sandbox="allow-same-origin"></iframe>
    </div>
  </div>
</div>`;
  }

  function getOptions(el) {
    return {
      pageSize: el.querySelector('#opt-pagesize').value,
      orientation: el.querySelector('#opt-orient').value,
      margin: el.querySelector('#opt-margin').value,
    };
  }

  // Tab switcher (global for onclick)
  window.tgHtmlTab = function (tab) {
    document.getElementById('tab-upload-panel').style.display = tab === 'upload' ? '' : 'none';
    document.getElementById('tab-paste-panel').style.display = tab === 'paste' ? '' : 'none';
    document.getElementById('tab-upload').style.background = tab === 'upload' ? '#0073aa' : '#f0f0f0';
    document.getElementById('tab-upload').style.color = tab === 'upload' ? '#fff' : '#333';
    document.getElementById('tab-paste').style.background = tab === 'paste' ? '#0073aa' : '#f0f0f0';
    document.getElementById('tab-paste').style.color = tab === 'paste' ? '#fff' : '#333';
  };

  window.tgHtmlRender = async function () {
    const html = document.getElementById('tg-html-input').value;
    if (!html.trim()) { alert('Please paste some HTML first.'); return; }
    const frameWrap = document.getElementById('tg-html-preview-frame');
    const iframe = document.getElementById('tg-html-iframe');
    iframe.srcdoc = html;
    frameWrap.style.display = '';
    await convertPastedHtml(html);
  };

  async function convertPastedHtml(html) {
    if (typeof html2canvas === 'undefined') {
      alert('html2canvas library not loaded. Please refresh.');
      return;
    }
    const iframe = document.getElementById('tg-html-iframe');
    await new Promise(r => setTimeout(r, 500)); // wait for render
    const canvas = await html2canvas(iframe.contentDocument.body, { useCORS: true, scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const img = await pdfDoc.embedPng(imgData);
    const page = pdfDoc.addPage([img.width / 2, img.height / 2]);
    page.drawImage(img, { x: 0, y: 0, width: img.width / 2, height: img.height / 2 });
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    download(blob, 'page.pdf', 'application/pdf');
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(20, 'Reading HTML file…');
    const html = await file.text();

    // Inject print CSS and open print window
    const marginMap = { none: '0', normal: '1cm', wide: '2cm' };
    const marginVal = marginMap[options.margin] || '1cm';
    const sizeVal = options.pageSize === 'letter' ? 'letter' : 'A4';
    const orientVal = options.orientation === 'landscape' ? 'landscape' : 'portrait';
    const printCss = `<style>@page{size:${sizeVal} ${orientVal};margin:${marginVal}}@media print{body{-webkit-print-color-adjust:exact}}</style>`;
    const fullHtml = html.includes('<head>') ? html.replace('</head>', printCss + '</head>') : printCss + html;

    onProgress && onProgress(60, 'Opening print dialog…');
    const win = window.open('', '_blank');
    if (!win) throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
    win.document.write(fullHtml);
    win.document.close();
    await new Promise(r => setTimeout(r, 800));
    win.print();

    showInstructions();
    // Return a dummy blob — actual PDF comes from print dialog
    const blob = new Blob([fullHtml], { type: 'text/html' });
    return { blob, filename: file.name.replace(/\.html?$/i, '') + '.html', skipDownload: true };
  }

  function showInstructions() {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-print-info');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-print-info';
    div.style.cssText = 'margin:12px 0;padding:12px 16px;background:#fff8e1;border-left:4px solid #ffc107;border-radius:4px;font-size:14px';
    div.innerHTML = `<strong>Print to PDF:</strong><ol style="margin:8px 0 0 16px;padding:0"><li>A new window opened with your HTML</li><li>In the print dialog, select <strong>Save as PDF</strong></li><li>Click <strong>Save</strong> to download the PDF</li></ol>`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

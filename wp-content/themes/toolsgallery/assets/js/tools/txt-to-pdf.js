/* TXT to PDF — Phase 7 Tool 9 */
(function () {
  'use strict';
  var CONFIG = { handler: 'txt-to-pdf' };

  function getOptionsHTML() {
    return `
<div class="tg-options">
  <div class="tg-option-group">
    <label>Page Size</label>
    <select id="opt-pagesize">
      <option value="a4">A4</option>
      <option value="letter">Letter</option>
      <option value="a5">A5</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Font</label>
    <select id="opt-font">
      <option value="Helvetica">Helvetica</option>
      <option value="Courier">Courier (Monospace)</option>
      <option value="TimesRoman">Times Roman</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Font Size</label>
    <select id="opt-fontsize">
      <option value="10">10pt</option>
      <option value="11" selected>11pt</option>
      <option value="12">12pt</option>
      <option value="14">14pt</option>
      <option value="16">16pt</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Margins</label>
    <select id="opt-margins">
      <option value="28">Narrow (10mm)</option>
      <option value="57" selected>Normal (20mm)</option>
      <option value="85">Wide (30mm)</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Line Spacing</label>
    <select id="opt-spacing">
      <option value="1">Single</option>
      <option value="1.5" selected>1.5</option>
      <option value="2">Double</option>
    </select>
  </div>
  <div class="tg-option-group">
    <label>Page Numbers</label>
    <select id="opt-pagenums">
      <option value="no">No</option>
      <option value="yes">Yes</option>
    </select>
  </div>
</div>`;
  }

  function getOptions(el) {
    return {
      pageSize: el.querySelector('#opt-pagesize').value,
      font: el.querySelector('#opt-font').value,
      fontSize: Number(el.querySelector('#opt-fontsize').value),
      margin: Number(el.querySelector('#opt-margins').value),
      lineSpacing: Number(el.querySelector('#opt-spacing').value),
      pageNumbers: el.querySelector('#opt-pagenums').value === 'yes',
    };
  }

  const PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    a5: [419.53, 595.28],
  };

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Reading text…');
    const text = await file.text();
    if (!text.trim()) throw new Error('File is empty. Please upload a text file with content.');

    if (typeof PDFLib === 'undefined') throw new Error('PDF library not loaded. Please refresh.');
    const { PDFDocument, StandardFonts, rgb } = PDFLib;

    onProgress && onProgress(0.2, 'Creating PDF…');
    const pdfDoc = await PDFDocument.create();
    const [pageWidth, pageHeight] = PAGE_SIZES[options.pageSize] || PAGE_SIZES.a4;
    const margin = options.margin;
    const fontSize = options.fontSize;
    const lineHeight = fontSize * options.lineSpacing * 1.2;

    const fontName = options.font === 'Courier' ? StandardFonts.Courier
      : options.font === 'TimesRoman' ? StandardFonts.TimesRoman
      : StandardFonts.Helvetica;
    const font = await pdfDoc.embedFont(fontName);

    const maxWidth = pageWidth - 2 * margin;
    const charWidth = fontSize * 0.5; // rough estimate
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);

    // Word-wrap lines
    const wrappedLines = [];
    text.split('\n').forEach(rawLine => {
      if (rawLine.length === 0) { wrappedLines.push(''); return; }
      let line = '';
      rawLine.split(' ').forEach(word => {
        if ((line + ' ' + word).trim().length > maxCharsPerLine) {
          wrappedLines.push(line.trim());
          line = word;
        } else {
          line = (line + ' ' + word).trim();
        }
      });
      if (line) wrappedLines.push(line);
    });

    const linesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);
    const totalPages = Math.ceil(wrappedLines.length / linesPerPage);

    onProgress && onProgress(0.4, `Building ${totalPages} page(s)…`);

    for (let p = 0; p < totalPages; p++) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const pageLines = wrappedLines.slice(p * linesPerPage, (p + 1) * linesPerPage);
      pageLines.forEach((line, j) => {
        if (!line && j === 0) return;
        page.drawText(line, {
          x: margin,
          y: pageHeight - margin - j * lineHeight,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });
      if (options.pageNumbers) {
        page.drawText(`${p + 1} / ${totalPages}`, {
          x: pageWidth / 2 - 20,
          y: margin / 2,
          size: 9,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      onProgress && onProgress(0.4 + (p / totalPages) * 0.5, `Page ${p + 1}/${totalPages}…`);
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    showInfo(wrappedLines.length, totalPages);
    return { blob, filename: file.name.replace(/\.txt$/i, '') + '.pdf' };
  }

  function showInfo(lines, pages) {
    const container = document.querySelector('.tg-tool-box');
    if (!container) return;
    let el = document.getElementById('tg-txt-info');
    if (el) el.remove();
    const div = document.createElement('div');
    div.id = 'tg-txt-info';
    div.style.cssText = 'margin:12px 0;padding:10px 14px;background:#f0f9ff;border-radius:6px;font-size:13px;color:#555';
    div.textContent = `Estimated: ${lines} lines → ${pages} page(s)`;
    container.appendChild(div);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run, getOptionsHTML, getOptions, CONFIG };
})();

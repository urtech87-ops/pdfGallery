/* ToolsGallery — pdf-tools.js
   Client-side PDF processing handlers.
   Exposes window.TGPdfTools registry; each key returns a Promise<Blob>.
*/
window.TGPdfTools = {

  /* ── MERGE ──────────────────────────────────────────────── */
  merge: async function (files) {
    var mergedPdf = await PDFLib.PDFDocument.create();
    for (var i = 0; i < files.length; i++) {
      var ab = await files[i].arrayBuffer();
      var doc = await PDFLib.PDFDocument.load(ab);
      var copied = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copied.forEach(function (page) { mergedPdf.addPage(page); });
    }
    var bytes = await mergedPdf.save();
    return new Blob([bytes], { type: 'application/pdf' });
  },

  /* ── COMPRESS ────────────────────────────────────────────── */
  compress: async function (file, quality) {
    var ab = await file.arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    if (quality === 'aggressive') {
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setProducer('');
      doc.setCreator('');
    }
    var bytes = await doc.save({ useObjectStreams: true });
    return {
      blob: new Blob([bytes], { type: 'application/pdf' }),
      originalSize: file.size,
      compressedSize: bytes.byteLength,
    };
  },

  /* ── SPLIT ───────────────────────────────────────────────── */
  split: async function (file, mode, param) {
    var ab = await file.arrayBuffer();
    var srcDoc = await PDFLib.PDFDocument.load(ab);
    var totalPages = srcDoc.getPageCount();

    function parsePageRange(str, total) {
      var result = [];
      var parts = str.split(',');
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (!part) continue;
        var rangeMatch = part.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
          var start = parseInt(rangeMatch[1], 10);
          var end   = parseInt(rangeMatch[2], 10);
          if (isNaN(start) || isNaN(end) || start < 1 || end > total || start > end) {
            throw new Error('Invalid range: ' + part + ' (document has ' + total + ' pages)');
          }
          for (var p = start; p <= end; p++) result.push(p);
        } else {
          var n = parseInt(part, 10);
          if (isNaN(n) || n < 1 || n > total) {
            throw new Error('Page ' + (isNaN(n) ? part : n) + ' does not exist in this document (' + total + ' pages total)');
          }
          result.push(n);
        }
      }
      if (!result.length) throw new Error('No valid pages specified.');
      return result;
    }

    async function makeDoc(indices) {
      var d = await PDFLib.PDFDocument.create();
      var copied = await d.copyPages(srcDoc, indices);
      copied.forEach(function (pg) { d.addPage(pg); });
      return await d.save();
    }

    if (mode === 'extract') {
      var pages = parsePageRange(param, totalPages);
      var indices = pages.map(function (p) { return p - 1; });
      var bytes = await makeDoc(indices);
      return { type: 'single', blob: new Blob([bytes], { type: 'application/pdf' }), filename: 'extracted-pages.pdf' };
    }

    if (mode === 'every') {
      var n = parseInt(param, 10);
      if (isNaN(n) || n < 1) throw new Error('Invalid N value.');
      var chunks = [];
      for (var start = 0; start < totalPages; start += n) {
        var end = Math.min(start + n, totalPages);
        var idxs = [];
        for (var j = start; j < end; j++) idxs.push(j);
        chunks.push(idxs);
      }
      var zip = new JSZip();
      for (var c = 0; c < chunks.length; c++) {
        var b = await makeDoc(chunks[c]);
        zip.file('page-' + (c + 1) + '.pdf', b);
      }
      var zipBlob = await zip.generateAsync({ type: 'blob' });
      return { type: 'zip', blob: zipBlob, filename: 'split-pages.zip' };
    }

    if (mode === 'half') {
      var mid = Math.floor(totalPages / 2);
      var firstIdxs = [], secondIdxs = [];
      for (var x = 0; x < mid; x++) firstIdxs.push(x);
      for (var y = mid; y < totalPages; y++) secondIdxs.push(y);
      var zip2 = new JSZip();
      zip2.file('part-1.pdf', await makeDoc(firstIdxs));
      zip2.file('part-2.pdf', await makeDoc(secondIdxs));
      var zipBlob2 = await zip2.generateAsync({ type: 'blob' });
      return { type: 'zip', blob: zipBlob2, filename: 'split-pages.zip' };
    }

    throw new Error('Unknown split mode: ' + mode);
  },

  /* ── PDF TO JPG ──────────────────────────────────────────── */
  pdfToJpg: async function (file, selectedPages, scale, onProgress) {
    var ab = await file.arrayBuffer();
    var pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
    var results = [];
    for (var i = 0; i < selectedPages.length; i++) {
      var pageNum = selectedPages[i];
      if (onProgress) onProgress(i + 1, selectedPages.length);
      var page = await pdfDoc.getPage(pageNum);
      var viewport = page.getViewport({ scale: scale });
      var canvas = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
      var blob = await new Promise(function (resolve) {
        canvas.toBlob(resolve, 'image/jpeg', 0.92);
      });
      results.push({ blob: blob, name: 'page-' + pageNum + '.jpg' });
    }
    return results;
  },

  /* ── JPG TO PDF ──────────────────────────────────────────── */
  jpgToPdf: async function (files, pageSize, orientation, margin) {
    var pageSizes = {
      A4:     [595.28, 841.89],
      Letter: [612, 792],
    };
    var doc = await PDFLib.PDFDocument.create();

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var ab = await file.arrayBuffer();
      var bytes = new Uint8Array(ab);

      var embeddedImg;
      var isJpeg = file.type === 'image/jpeg' || /\.(jpg|jpeg)$/i.test(file.name);
      var isPng  = file.type === 'image/png'  || /\.png$/i.test(file.name);
      var isWebp = file.type === 'image/webp' || /\.webp$/i.test(file.name);

      if (isWebp) {
        var imgEl = await new Promise(function (resolve, reject) {
          var img = new Image();
          img.onload = function () { resolve(img); };
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });
        var cvs = document.createElement('canvas');
        cvs.width  = imgEl.naturalWidth;
        cvs.height = imgEl.naturalHeight;
        cvs.getContext('2d').drawImage(imgEl, 0, 0);
        var jpegAb = await new Promise(function (resolve) {
          cvs.toBlob(function (b) {
            b.arrayBuffer().then(resolve);
          }, 'image/jpeg', 0.92);
        });
        bytes = new Uint8Array(jpegAb);
        embeddedImg = await doc.embedJpg(bytes);
      } else if (isPng) {
        embeddedImg = await doc.embedPng(bytes);
      } else {
        embeddedImg = await doc.embedJpg(bytes);
      }

      var dims;
      if (pageSize === 'auto') {
        dims = [embeddedImg.width, embeddedImg.height];
      } else {
        dims = pageSizes[pageSize] || pageSizes.A4;
      }

      var pageW = dims[0];
      var pageH = dims[1];
      if (orientation === 'landscape') { var tmp = pageW; pageW = pageH; pageH = tmp; }

      var marginPt = margin === 'none' ? 0 : (margin === 'small' ? 10 : 20);
      var drawW = pageW - 2 * marginPt;
      var drawH = pageH - 2 * marginPt;
      var imgAspect = embeddedImg.width / embeddedImg.height;
      var boxAspect = drawW / drawH;
      var finalW, finalH;
      if (imgAspect > boxAspect) {
        finalW = drawW;
        finalH = drawW / imgAspect;
      } else {
        finalH = drawH;
        finalW = drawH * imgAspect;
      }
      var x = marginPt + (drawW - finalW) / 2;
      var y = marginPt + (drawH - finalH) / 2;

      var page = doc.addPage([pageW, pageH]);
      page.drawImage(embeddedImg, { x: x, y: y, width: finalW, height: finalH });
    }

    var bytes2 = await doc.save();
    return new Blob([bytes2], { type: 'application/pdf' });
  },

  /* ── ROTATE PDF ──────────────────────────────────────────── */
  rotatePdf: async function (file, rotationMap) {
    var ab = await file.arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    var pages = doc.getPages();
    for (var i = 0; i < pages.length; i++) {
      var deg = rotationMap[i + 1];
      if (deg !== undefined) {
        pages[i].setRotation(PDFLib.degrees(deg));
      }
    }
    var bytes = await doc.save();
    return new Blob([bytes], { type: 'application/pdf' });
  },

  /* ── HELPERS ─────────────────────────────────────────────── */
  getPageCount: async function (file) {
    var ab = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    return pdf.numPages;
  },

  renderThumbnail: async function (file, pageNum, scale) {
    var ab = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    var page = await pdf.getPage(pageNum);
    var viewport = page.getViewport({ scale: scale });
    var canvas = document.createElement('canvas');
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
    return { canvas: canvas, originalRotation: page.rotate };
  },

  renderAllThumbnails: async function (file, scale, onPage) {
    var ab = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    var total = pdf.numPages;
    var results = [];
    for (var i = 1; i <= total; i++) {
      var page = await pdf.getPage(i);
      var viewport = page.getViewport({ scale: scale });
      var canvas = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
      results.push({ canvas: canvas, originalRotation: page.rotate, pageNum: i });
      if (onPage) onPage(i, total);
    }
    return results;
  },

  /* ── PDF TO WORD ─────────────────────────────────── */
  pdfToWord: async function (file, onProgress) {
    var ab = await file.arrayBuffer();
    var pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
    var numPages = pdfDoc.numPages;
    var docParagraphs = [];

    for (var i = 1; i <= numPages; i++) {
      if (onProgress) onProgress(i, numPages);
      var page = await pdfDoc.getPage(i);
      var textContent = await page.getTextContent();
      var items = textContent.items.filter(function (it) { return it.str && it.str.trim(); });

      /* group items into lines by Y proximity */
      var lines = [];
      items.forEach(function (item) {
        var y = Math.round(item.transform[5]);
        var fs = Math.abs(item.transform[3]) || 12;
        var last = lines[lines.length - 1];
        if (!last || Math.abs(last.y - y) > 5) {
          lines.push({ y: y, text: item.str, fontSize: fs });
        } else {
          last.text += item.str;
          last.fontSize = Math.max(last.fontSize, fs);
        }
      });
      lines.sort(function (a, b) { return b.y - a.y; });

      /* group lines into paragraphs */
      var prevY = null;
      lines.forEach(function (line) {
        if (prevY === null || (prevY - line.y) > 20) {
          docParagraphs.push({ text: line.text, fontSize: line.fontSize });
        } else {
          var last = docParagraphs[docParagraphs.length - 1];
          if (last) last.text += ' ' + line.text;
        }
        prevY = line.y;
      });

      if (i < numPages) docParagraphs.push({ text: '', isBreak: true });
    }

    /* Build .docx */
    var _docx = window.docx;
    var children = docParagraphs.map(function (p) {
      if (p.isBreak) return new _docx.Paragraph({ text: '' });
      if (p.fontSize > 14) {
        return new _docx.Paragraph({ text: p.text, heading: _docx.HeadingLevel.HEADING_2 });
      }
      return new _docx.Paragraph({ text: p.text });
    });

    var doc = new _docx.Document({ sections: [{ properties: {}, children: children }] });
    return _docx.Packer.toBlob(doc);
  },

  /* ── UNLOCK PDF ──────────────────────────────────── */
  unlockPdf: async function (file, password) {
    var ab = await file.arrayBuffer();
    var bytes = new Uint8Array(ab);
    var decryptLib = window.pdfDecryptLib;
    if (!decryptLib) throw new Error('PDF decrypt library not loaded.');

    var isEnc = await decryptLib.isEncrypted(bytes);
    if (!isEnc.encrypted) {
      /* Non-encrypted — return as-is */
      return new Blob([bytes], { type: 'application/pdf' });
    }

    var decrypted;
    try {
      decrypted = await decryptLib.decryptPDF(bytes, password || '');
    } catch (e) {
      if (e && e.message && /password|incorrect/i.test(e.message)) {
        throw new Error('WRONG_PASSWORD');
      }
      throw e;
    }
    return new Blob([decrypted], { type: 'application/pdf' });
  },

  /* ── PROTECT PDF ─────────────────────────────────── */
  protectPdf: async function (file, userPassword, ownerPassword, perms) {
    var ab = await file.arrayBuffer();
    var bytes = new Uint8Array(ab);
    var encryptFn = window.pdfEncryptLib && window.pdfEncryptLib.encryptPDF;
    if (!encryptFn) throw new Error('PDF encryption library not loaded.');
    var encrypted = await encryptFn(bytes, userPassword, {
      ownerPassword:          ownerPassword,
      algorithm:              'AES-256',
      allowPrinting:          perms.printing,
      allowHighQualityPrint:  perms.printing,
      allowModifying:         perms.modifying,
      allowCopying:           perms.copying,
      allowAnnotating:        perms.annotating,
      allowFillingForms:      perms.annotating,
      allowExtraction:        perms.copying,
      allowAssembly:          false,
    });
    return new Blob([encrypted], { type: 'application/pdf' });
  },

  /* ── APPLY EDITS & SAVE (edit-pdf) ───────────────── */
  applyEditsAndSave: async function (file, operations, deletedIndices, pageRotations) {
    var ab = await file.arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);

    /* Apply per-page rotations */
    var pages = doc.getPages();
    Object.keys(pageRotations).forEach(function (idx) {
      if (pages[idx]) pages[idx].setRotation(PDFLib.degrees(pageRotations[idx]));
    });

    /* Delete pages in reverse */
    var toDelete = deletedIndices.slice().sort(function (a, b) { return b - a; });
    toDelete.forEach(function (idx) { doc.removePage(idx); });

    /* Re-fetch pages after deletions */
    pages = doc.getPages();

    /* Pre-embed fonts */
    var fonts = {};
    var fontNames = ['Helvetica', 'HelveticaBold', 'TimesRoman', 'TimesRomanItalic', 'Courier'];
    for (var fi = 0; fi < fontNames.length; fi++) {
      fonts[fontNames[fi]] = await doc.embedFont(PDFLib.StandardFonts[fontNames[fi]]);
    }

    for (var oi = 0; oi < operations.length; oi++) {
      var op = operations[oi];
      var page = pages[op.pageIndex];
      if (!page) continue;
      var ps = page.getSize();

      if (op.type === 'text') {
        var f = fonts[op.bold ? op.fontName + 'Bold' : op.fontName] || fonts['Helvetica'];
        var hex = op.color || '#000000';
        page.drawText(op.text, {
          x: op.x, y: ps.height - op.y - op.size,
          size: op.size || 12,
          font: f,
          color: PDFLib.rgb(parseInt(hex.slice(1,3),16)/255, parseInt(hex.slice(3,5),16)/255, parseInt(hex.slice(5,7),16)/255),
        });
      } else if (op.type === 'image') {
        var imgBytes = new Uint8Array(op.imageData);
        var embImg = op.isPng ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
        page.drawImage(embImg, { x: op.x, y: ps.height - op.y - op.height, width: op.width, height: op.height });
      } else if (op.type === 'rect') {
        var hexC = op.color || '#ffffff';
        var drawR = {
          x: op.x, y: ps.height - op.y - op.height,
          width: op.width, height: op.height,
        };
        if (op.fill !== false) {
          drawR.color = PDFLib.rgb(parseInt(hexC.slice(1,3),16)/255, parseInt(hexC.slice(3,5),16)/255, parseInt(hexC.slice(5,7),16)/255);
        }
        if (op.opacity !== undefined) drawR.opacity = op.opacity;
        if (op.borderColor) {
          var hB = op.borderColor;
          drawR.borderColor = PDFLib.rgb(parseInt(hB.slice(1,3),16)/255, parseInt(hB.slice(3,5),16)/255, parseInt(hB.slice(5,7),16)/255);
          drawR.borderWidth = op.borderWidth || 1;
        }
        page.drawRectangle(drawR);
      } else if (op.type === 'line') {
        var hL = op.color || '#000000';
        page.drawLine({
          start: { x: op.x1, y: ps.height - op.y1 },
          end:   { x: op.x2, y: ps.height - op.y2 },
          thickness: op.thickness || 1,
          color: PDFLib.rgb(parseInt(hL.slice(1,3),16)/255, parseInt(hL.slice(3,5),16)/255, parseInt(hL.slice(5,7),16)/255),
        });
      } else if (op.type === 'ellipse') {
        var hE = op.color || '#000000';
        page.drawEllipse({
          x: op.x, y: ps.height - op.y,
          xScale: op.rx, yScale: op.ry,
          borderColor: PDFLib.rgb(parseInt(hE.slice(1,3),16)/255, parseInt(hE.slice(3,5),16)/255, parseInt(hE.slice(5,7),16)/255),
          borderWidth: op.borderWidth || 1,
          opacity: 0,
        });
      }
    }

    var bytes = await doc.save();
    return new Blob([bytes], { type: 'application/pdf' });
  },

  /* ── PDF TO PNG ──────────────────────────────────── */
  pdfToPng: async function (file, selectedPages, scale, onProgress) {
    var ab = await file.arrayBuffer();
    var pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
    var results = [];
    for (var i = 0; i < selectedPages.length; i++) {
      var pageNum = selectedPages[i];
      if (onProgress) onProgress(i + 1, selectedPages.length);
      var page = await pdfDoc.getPage(pageNum);
      var viewport = page.getViewport({ scale: scale });
      var canvas = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
      results.push({ blob: blob, name: 'page-' + pageNum + '.png' });
    }
    return results;
  },

  /* ── ADD WATERMARK ───────────────────────────────── */
  addWatermark: async function (file, opts) {
    var ab = await file.arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    var allPages = doc.getPages();
    var total = allPages.length;

    var targetIdxs = [];
    if (opts.pages === 'first') {
      targetIdxs = [0];
    } else if (opts.pages === 'custom' && opts.pageRange) {
      opts.pageRange.split(',').forEach(function (part) {
        var m = part.trim().match(/^(\d+)-(\d+)$/);
        if (m) {
          for (var p = parseInt(m[1]); p <= parseInt(m[2]); p++) { if (p >= 1 && p <= total) targetIdxs.push(p - 1); }
        } else {
          var n = parseInt(part); if (n >= 1 && n <= total) targetIdxs.push(n - 1);
        }
      });
    } else {
      for (var i = 0; i < total; i++) targetIdxs.push(i);
    }

    if (opts.type === 'text') {
      var sfMap = { 'Helvetica': PDFLib.StandardFonts.Helvetica, 'Times Roman': PDFLib.StandardFonts.TimesRoman, 'Courier': PDFLib.StandardFonts.Courier };
      var font = await doc.embedFont(sfMap[opts.font] || PDFLib.StandardFonts.Helvetica);
      var hex = opts.color || '#FF0000';
      var cr = parseInt(hex.slice(1,3),16)/255, cg = parseInt(hex.slice(3,5),16)/255, cb = parseInt(hex.slice(5,7),16)/255;
      var opacity = (opts.opacity || 30) / 100;
      var fontSize = opts.fontSize || 48;
      var rotation = opts.rotation !== undefined ? opts.rotation : -45;

      for (var ti = 0; ti < targetIdxs.length; ti++) {
        var pg = allPages[targetIdxs[ti]];
        var sz = pg.getSize();
        var tw = font.widthOfTextAtSize(opts.text, fontSize);

        if (opts.position === 'diagonal') {
          var stepX = tw * 1.6, stepY = fontSize * 3;
          for (var tx = -sz.width; tx < sz.width * 2; tx += stepX) {
            for (var ty = -sz.height; ty < sz.height * 2; ty += stepY) {
              pg.drawText(opts.text, { x: tx, y: ty, size: fontSize, font: font, color: PDFLib.rgb(cr,cg,cb), opacity: opacity, rotate: PDFLib.degrees(rotation) });
            }
          }
        } else {
          var posMap = {
            'top-left':      { x: 30,                    y: sz.height - fontSize - 30 },
            'top-center':    { x: (sz.width - tw) / 2,  y: sz.height - fontSize - 30 },
            'top-right':     { x: sz.width - tw - 30,   y: sz.height - fontSize - 30 },
            'middle-left':   { x: 30,                    y: (sz.height - fontSize) / 2 },
            'center':        { x: (sz.width - tw) / 2,  y: (sz.height - fontSize) / 2 },
            'middle-right':  { x: sz.width - tw - 30,   y: (sz.height - fontSize) / 2 },
            'bottom-left':   { x: 30,                    y: 30 },
            'bottom-center': { x: (sz.width - tw) / 2,  y: 30 },
            'bottom-right':  { x: sz.width - tw - 30,   y: 30 },
          };
          var pos = posMap[opts.position || 'center'] || posMap['center'];
          pg.drawText(opts.text, { x: pos.x, y: pos.y, size: fontSize, font: font, color: PDFLib.rgb(cr,cg,cb), opacity: opacity, rotate: PDFLib.degrees(rotation) });
        }
      }
    } else if (opts.type === 'image') {
      var imgAb = await opts.imageFile.arrayBuffer();
      var imgBytes = new Uint8Array(imgAb);
      var embImg = opts.imageFile.name.toLowerCase().endsWith('.png') ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
      var imgOpacity = (opts.opacity || 30) / 100;

      for (var ii = 0; ii < targetIdxs.length; ii++) {
        var pg2 = allPages[targetIdxs[ii]];
        var sz2 = pg2.getSize();
        var imgScale = (opts.scale || 50) / 100;
        var imgW = sz2.width * imgScale;
        var imgH = (embImg.height / embImg.width) * imgW;
        var posMap2 = {
          'top-left':      { x: 30,                      y: sz2.height - imgH - 30 },
          'top-center':    { x: (sz2.width - imgW) / 2, y: sz2.height - imgH - 30 },
          'top-right':     { x: sz2.width - imgW - 30,  y: sz2.height - imgH - 30 },
          'middle-left':   { x: 30,                      y: (sz2.height - imgH) / 2 },
          'center':        { x: (sz2.width - imgW) / 2, y: (sz2.height - imgH) / 2 },
          'middle-right':  { x: sz2.width - imgW - 30,  y: (sz2.height - imgH) / 2 },
          'bottom-left':   { x: 30,                      y: 30 },
          'bottom-center': { x: (sz2.width - imgW) / 2, y: 30 },
          'bottom-right':  { x: sz2.width - imgW - 30,  y: 30 },
        };
        var pos2 = posMap2[opts.position || 'center'] || posMap2['center'];
        pg2.drawImage(embImg, { x: pos2.x, y: pos2.y, width: imgW, height: imgH, opacity: imgOpacity });
      }
    }

    var bytes = await doc.save();
    return new Blob([bytes], { type: 'application/pdf' });
  },

  /* ── ADD PAGE NUMBERS ────────────────────────────── */
  addPageNumbers: async function (file, opts) {
    var ab = await file.arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    var pages = doc.getPages();
    var total = pages.length;

    var sfMap = { 'Helvetica': PDFLib.StandardFonts.Helvetica, 'Times Roman': PDFLib.StandardFonts.TimesRoman, 'Courier': PDFLib.StandardFonts.Courier };
    var font = await doc.embedFont(sfMap[opts.font] || PDFLib.StandardFonts.Helvetica);
    var hex = opts.color || '#000000';
    var cr = parseInt(hex.slice(1,3),16)/255, cg = parseInt(hex.slice(3,5),16)/255, cb = parseInt(hex.slice(5,7),16)/255;
    var fontSize = opts.fontSize || 10;
    var margin = opts.margin || 30;
    var startNum = opts.startNumber || 1;
    var skipFirst = !!opts.skipFirst;

    function fmtLabel(n, t, fmt) {
      switch (fmt) {
        case 'Page 1':     return 'Page ' + n;
        case '1 of N':     return n + ' of ' + t;
        case 'Page 1 of N':return 'Page ' + n + ' of ' + t;
        case '- 1 -':      return '- ' + n + ' -';
        default:           return String(n);
      }
    }

    pages.forEach(function (page, idx) {
      if (skipFirst && idx === 0) return;
      var pageNum = startNum + idx - (skipFirst ? 1 : 0);
      var label = fmtLabel(pageNum, total, opts.format || '1');
      var sz = page.getSize();
      var tw = font.widthOfTextAtSize(label, fontSize);
      var x, y;
      switch (opts.position || 'bottom-center') {
        case 'top-left':     x = margin; y = sz.height - margin - fontSize; break;
        case 'top-center':   x = (sz.width - tw) / 2; y = sz.height - margin - fontSize; break;
        case 'top-right':    x = sz.width - tw - margin; y = sz.height - margin - fontSize; break;
        case 'bottom-left':  x = margin; y = margin; break;
        case 'bottom-right': x = sz.width - tw - margin; y = margin; break;
        default:             x = (sz.width - tw) / 2; y = margin; break;
      }
      page.drawText(label, { x: x, y: y, size: fontSize, font: font, color: PDFLib.rgb(cr, cg, cb) });
    });

    var bytes = await doc.save();
    return new Blob([bytes], { type: 'application/pdf' });
  },

  /* ── EXTRACT TEXT ────────────────────────────────── */
  extractText: async function (file, targetPage, onProgress) {
    var ab = await file.arrayBuffer();
    var pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
    var numPages = pdfDoc.numPages;
    var pagesToProcess = targetPage ? [targetPage] : [];
    if (!targetPage) { for (var i = 1; i <= numPages; i++) pagesToProcess.push(i); }

    var results = [];
    for (var j = 0; j < pagesToProcess.length; j++) {
      var pageNum = pagesToProcess[j];
      if (onProgress) onProgress(j + 1, pagesToProcess.length);
      var page = await pdfDoc.getPage(pageNum);
      var textContent = await page.getTextContent();
      var items = textContent.items;

      var lines = [];
      items.forEach(function (item) {
        if (!item.str) return;
        var y = Math.round(item.transform[5]);
        var fs = Math.abs(item.transform[3]) || 12;
        var last = lines[lines.length - 1];
        if (!last || Math.abs(last.y - y) > 3) {
          lines.push({ y: y, text: item.str, fontSize: fs, x: item.transform[4] });
        } else {
          last.text += item.str;
          last.fontSize = Math.max(last.fontSize, fs);
        }
      });
      lines.sort(function (a, b) { return b.y - a.y; });

      results.push({
        page: pageNum,
        text: lines.map(function (l) { return l.text; }).join('\n'),
        lines: lines,
        items: items.map(function (it) {
          return { x: Math.round(it.transform[4]), y: Math.round(it.transform[5]), str: it.str, fontSize: Math.round(Math.abs(it.transform[3])) };
        }),
      });
    }
    return results;
  },

  /* ── REARRANGE PDF ───────────────────────────────── */
  rearrangePdf: async function (file, pageOrder) {
    var ab = await file.arrayBuffer();
    var srcDoc = await PDFLib.PDFDocument.load(ab);
    var newDoc = await PDFLib.PDFDocument.create();
    for (var i = 0; i < pageOrder.length; i++) {
      var copied = await newDoc.copyPages(srcDoc, [pageOrder[i]]);
      newDoc.addPage(copied[0]);
    }
    var bytes = await newDoc.save();
    return new Blob([bytes], { type: 'application/pdf' });
  },
};

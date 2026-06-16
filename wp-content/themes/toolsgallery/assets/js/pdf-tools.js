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
};

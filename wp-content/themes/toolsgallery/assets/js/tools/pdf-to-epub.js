/* ToolsGallery — pdf-to-epub.js
   Handler: pdf-to-epub
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-to-epub',
    downloadName: 'converted.epub',
  };

  function getOptionsHTML(pageCount) {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Chapter detection</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="epub-chapters" value="auto" checked> Auto (by font size / gaps)</label>' +
        '<label><input type="radio" name="epub-chapters" value="page"> One chapter per page</label>' +
        '<label><input type="radio" name="epub-chapters" value="none"> Single chapter</label>' +
      '</div>' +
    '</div>' +
    '<p class="tg="tg-opt-info">Extracts all text from the PDF and packages it as a standard EPUB 2.0 ebook.</p>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var chapters = optionsEl.querySelector('input[name="epub-chapters"]:checked');
    return { chapterMode: chapters ? chapters.value : 'auto' };
  }

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async function run(file, options, onProgress) {
    if (!window.JSZip) throw new Error('JSZip library not loaded. Please refresh.');
    if (!window.pdfjsLib) throw new Error('PDF library not loaded.');

    onProgress && onProgress(0.05, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var totalPages = pdf.numPages;
    var title = file.name.replace(/\.pdf$/i, '') || 'Document';

    var chapters = [];
    var currentChapter = { title: 'Chapter 1', paragraphs: [] };

    for (var p = 1; p <= totalPages; p++) {
      onProgress && onProgress(p / totalPages * 0.7, 'Extracting page ' + p + '...');
      var page = await pdf.getPage(p);
      var tc = await page.getTextContent();

      if (options.chapterMode === 'page') {
        if (p > 1) {
          chapters.push(currentChapter);
          currentChapter = { title: 'Chapter ' + p, paragraphs: [] };
        }
      }

      var prevY = null;
      var lineItems = [];
      var lines = [];

      tc.items.forEach(function (item) {
        if (!item.str) return;
        var y = Math.round(item.transform[5]);
        var h = item.height || 0;
        if (prevY !== null && Math.abs(prevY - y) > 2) {
          if (lineItems.length) lines.push({ y: prevY, text: lineItems.join(' '), height: h });
          lineItems = [];
        }
        lineItems.push(item.str);
        prevY = y;
      });
      if (lineItems.length) lines.push({ y: prevY, text: lineItems.join(' '), height: 0 });

      var prevLineY = null;
      lines.forEach(function (line, li) {
        if (!line.text.trim()) return;

        // Auto chapter detection: large gap or large font
        if (options.chapterMode === 'auto' && prevLineY !== null) {
          var gap = Math.abs(prevLineY - line.y);
          if (gap > 50 && currentChapter.paragraphs.length > 0) {
            chapters.push(currentChapter);
            currentChapter = { title: line.text.trim().substring(0, 60), paragraphs: [] };
            prevLineY = line.y;
            return;
          }
        }

        currentChapter.paragraphs.push(line.text);
        prevLineY = line.y;
      });
    }
    chapters.push(currentChapter);

    if (options.chapterMode === 'none') {
      var allParas = chapters.reduce(function (acc, ch) { return acc.concat(ch.paragraphs); }, []);
      chapters = [{ title: title, paragraphs: allParas }];
    }

    onProgress && onProgress(0.8, 'Building EPUB...');

    var zip = new JSZip();
    var uid = 'toolsgallery-' + Date.now();

    // mimetype MUST be first and uncompressed
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    zip.file('META-INF/container.xml',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<container version="1.0" xmlns="urn:oasis:schemas:container">\n' +
      '  <rootfiles>\n' +
      '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n' +
      '  </rootfiles>\n' +
      '</container>');

    var manifest = '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n';
    manifest += '<item id="css" href="style.css" media-type="text/css"/>\n';
    var spine = '';
    var navPoints = '';

    chapters.forEach(function (ch, i) {
      var id = 'chapter-' + (i + 1);
      var filename = id + '.html';
      manifest += '<item id="' + id + '" href="' + filename + '" media-type="application/xhtml+xml"/>\n';
      spine += '<itemref idref="' + id + '"/>\n';
      navPoints += '<navPoint id="nav-' + (i + 1) + '" playOrder="' + (i + 1) + '">' +
        '<navLabel><text>' + escapeXml(ch.title) + '</text></navLabel>' +
        '<content src="' + filename + '"/>' +
        '</navPoint>\n';

      var chHtml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">\n' +
        '<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8"/>' +
        '<title>' + escapeXml(ch.title) + '</title>' +
        '<link rel="stylesheet" type="text/css" href="style.css"/>' +
        '</head><body>' +
        '<h1>' + escapeXml(ch.title) + '</h1>' +
        ch.paragraphs.map(function (p) { return '<p>' + escapeXml(p) + '</p>'; }).join('\n') +
        '</body></html>';
      zip.file('OEBPS/' + filename, chHtml);
    });

    zip.file('OEBPS/content.opf',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid">\n' +
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">\n' +
      '<dc:title>' + escapeXml(title) + '</dc:title>\n' +
      '<dc:identifier id="uid">' + uid + '</dc:identifier>\n' +
      '<dc:language>en</dc:language>\n' +
      '</metadata>\n' +
      '<manifest>\n' + manifest + '</manifest>\n' +
      '<spine toc="ncx">\n' + spine + '</spine>\n' +
      '</package>');

    zip.file('OEBPS/toc.ncx',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n' +
      '<head><meta name="dtb:uid" content="' + uid + '"/></head>\n' +
      '<docTitle><text>' + escapeXml(title) + '</text></docTitle>\n' +
      '<navMap>\n' + navPoints + '</navMap>\n' +
      '</ncx>');

    zip.file('OEBPS/style.css',
      'body{font-family:Georgia,serif;line-height:1.6;margin:1em;}' +
      'h1{font-size:1.5em;margin-bottom:0.5em;}' +
      'p{margin:0.5em 0;text-indent:1em;}');

    onProgress && onProgress(0.95, 'Compressing...');
    var epubData = await zip.generateAsync({ type: 'arraybuffer', mimeType: 'application/epub+zip' });
    var blob = new Blob([epubData], { type: 'application/epub+zip' });
    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

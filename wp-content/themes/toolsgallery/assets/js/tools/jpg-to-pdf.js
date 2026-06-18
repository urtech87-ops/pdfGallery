/**
 * ============================================================
 * ToolsGallery — JPG to PDF Tool
 * ============================================================
 * Handler key: jpg-to-pdf
 * Tool URL: /tool/jpg-to-pdf/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-lib (PDFLib)
 * ============================================================
 */
(function () {
  'use strict';

  var PAGE_SIZES = { A4: [595.28, 841.89], Letter: [612, 792] };

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var pageSize    = options.pageSize    || 'A4';
    var orientation = options.orientation || 'portrait';
    var margin      = options.margin      || 'normal';

    onProgress(10, 'Starting conversion…');
    var doc = await PDFLib.PDFDocument.create();

    for (var i = 0; i < files.length; i++) {
      onProgress(10 + Math.round((i / files.length) * 85), 'Processing image ' + (i + 1) + ' of ' + files.length + '…');
      var file = files[i];
      var ab   = await file.arrayBuffer();
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
        cvs.width = imgEl.naturalWidth; cvs.height = imgEl.naturalHeight;
        cvs.getContext('2d').drawImage(imgEl, 0, 0);
        var jpegAb = await new Promise(function (resolve) { cvs.toBlob(function (b) { b.arrayBuffer().then(resolve); }, 'image/jpeg', 0.92); });
        bytes = new Uint8Array(jpegAb);
        embeddedImg = await doc.embedJpg(bytes);
      } else if (isPng) {
        embeddedImg = await doc.embedPng(bytes);
      } else {
        embeddedImg = await doc.embedJpg(bytes);
      }

      var dims = pageSize === 'auto' ? [embeddedImg.width, embeddedImg.height] : (PAGE_SIZES[pageSize] || PAGE_SIZES.A4);
      var pageW = dims[0], pageH = dims[1];
      if (orientation === 'landscape') { var tmp = pageW; pageW = pageH; pageH = tmp; }

      var marginPt = margin === 'none' ? 0 : (margin === 'small' ? 10 : 20);
      var drawW = pageW - 2 * marginPt, drawH = pageH - 2 * marginPt;
      var imgAspect = embeddedImg.width / embeddedImg.height;
      var boxAspect = drawW / drawH;
      var finalW, finalH;
      if (imgAspect > boxAspect) { finalW = drawW; finalH = drawW / imgAspect; }
      else { finalH = drawH; finalW = drawH * imgAspect; }
      var x = marginPt + (drawW - finalW) / 2;
      var y = marginPt + (drawH - finalH) / 2;

      var page = doc.addPage([pageW, pageH]);
      page.drawImage(embeddedImg, { x: x, y: y, width: finalW, height: finalH });
    }

    onProgress(98, 'Saving PDF…');
    var outBytes = await doc.save();
    onSuccess(new Blob([outBytes], { type: 'application/pdf' }), 'images.pdf');
  }

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="page-size-sel">Page size</label>' +
        '<select name="page-size" id="page-size-sel" class="tg-select">' +
          '<option value="A4" selected>A4</option>' +
          '<option value="Letter">Letter</option>' +
          '<option value="auto">Auto-fit (match image)</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="orientation-sel">Orientation</label>' +
        '<select name="orientation" id="orientation-sel" class="tg-select">' +
          '<option value="portrait" selected>Portrait</option>' +
          '<option value="landscape">Landscape</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="margin-sel">Margin</label>' +
        '<select name="margin" id="margin-sel" class="tg-select">' +
          '<option value="none">None</option>' +
          '<option value="small">Small (10 pt)</option>' +
          '<option value="normal" selected>Normal (20 pt)</option>' +
        '</select>' +
      '</div>';
  }

  function getOptions() {
    var ps = document.querySelector('select[name="page-size"]');
    var or = document.querySelector('select[name="orientation"]');
    var mg = document.querySelector('select[name="margin"]');
    return {
      pageSize:    ps ? ps.value : 'A4',
      orientation: or ? or.value : 'portrait',
      margin:      mg ? mg.value : 'normal',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['jpg-to-pdf'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions };
})();

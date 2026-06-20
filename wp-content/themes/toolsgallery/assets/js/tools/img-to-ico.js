/**
 * ToolsGallery — Image to ICO
 * Handler: img-to-ico
 * URL: /tool/img-to-ico/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-ico' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:6px">' +
      '<label class="tg-opt-label">ICO sizes to include</label>' +
      '<label style="font-size:13px"><input type="checkbox" class="ico-size" value="16" checked> 16×16</label>' +
      '<label style="font-size:13px"><input type="checkbox" class="ico-size" value="32" checked> 32×32</label>' +
      '<label style="font-size:13px"><input type="checkbox" class="ico-size" value="48" checked> 48×48</label>' +
      '<label style="font-size:13px"><input type="checkbox" class="ico-size" value="64"> 64×64</label>' +
    '</div>' +
    '<p style="font-size:12px;color:var(--color-gray-600);margin:6px 0 0">Single file only. ICO contains PNG data for each size.</p>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { sizes: [16, 32, 48] };
    var checked = Array.from(optionsEl.querySelectorAll('.ico-size:checked')).map(function (cb) { return parseInt(cb.value); });
    return { sizes: checked.length ? checked : [16, 32, 48] };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    var sizes = options.sizes || [16, 32, 48];

    var img = await loadImage(file);
    var pngDataArrays = [];

    for (var i = 0; i < sizes.length; i++) {
      onProgress && onProgress(0.2 + (i / sizes.length) * 0.5, 'Rendering ' + sizes[i] + 'x' + sizes[i] + '...');
      var size = sizes[i];
      var canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      var pngData = await canvasToPngBytes(canvas);
      pngDataArrays.push({ size: size, data: pngData });
    }

    onProgress && onProgress(0.8, 'Building ICO file...');
    var icoBlob = buildIco(pngDataArrays);
    onProgress && onProgress(1, 'Done!');
    return { blob: icoBlob, filename: file.name.replace(/\.[^.]+$/, '') + '.ico' };
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function canvasToPngBytes(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        var reader = new FileReader();
        reader.onload = function () { resolve(new Uint8Array(reader.result)); };
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    });
  }

  function buildIco(images) {
    var count = images.length;
    var headerSize = 6;
    var dirEntrySize = 16;
    var dirSize = headerSize + dirEntrySize * count;

    var totalSize = dirSize;
    images.forEach(function (img) { totalSize += img.data.length; });

    var buf = new ArrayBuffer(totalSize);
    var view = new DataView(buf);

    // ICO header
    view.setUint16(0, 0, true);     // reserved
    view.setUint16(2, 1, true);     // type: 1=ICO
    view.setUint16(4, count, true); // image count

    var offset = dirSize;
    images.forEach(function (img, i) {
      var entry = headerSize + i * dirEntrySize;
      var sz = img.size > 255 ? 0 : img.size;
      view.setUint8(entry, sz);     // width (0=256)
      view.setUint8(entry+1, sz);   // height
      view.setUint8(entry+2, 0);    // color count
      view.setUint8(entry+3, 0);    // reserved
      view.setUint16(entry+4, 1, true); // color planes
      view.setUint16(entry+6, 32, true); // bits per pixel
      view.setUint32(entry+8, img.data.length, true);
      view.setUint32(entry+12, offset, true);

      new Uint8Array(buf).set(img.data, offset);
      offset += img.data.length;
    });

    return new Blob([buf], { type: 'image/x-icon' });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

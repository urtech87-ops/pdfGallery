/**
 * ToolsGallery — Image to BMP
 * Handler: img-to-bmp
 * URL: /tool/img-to-bmp/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-bmp', multiFile: true };

  function getOptionsHTML() {
    return '<p style="font-size:13px;color:var(--color-gray-600);margin:0">Converts images to BMP format (24-bit uncompressed).</p>' +
    '<div id="i2bmp-results" style="margin-top:8px"></div>' +
    '<div id="i2bmp-dl-all-wrap" hidden style="margin-top:8px">' +
      '<button type="button" id="i2bmp-dl-all" class="tg-btn-secondary">Download All as ZIP</button>' +
    '</div>';
  }

  function getOptions(optionsEl) { return {}; }

  var _results = [];

  async function run(file, options, onProgress) {
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _results = [];
    var resultsEl = document.getElementById('i2bmp-results');
    if (resultsEl) resultsEl.innerHTML = '';

    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress((i / files.length) * 0.9, 'Converting ' + files[i].name + '...');
      var result = await convertOne(files[i]);
      _results.push(result);
      if (resultsEl) {
        var idx = _results.length - 1;
        resultsEl.insertAdjacentHTML('beforeend',
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px">' +
          '<span>' + escHtml(result.filename) + '</span>' +
          '<button type="button" class="tg-btn-secondary" style="font-size:11px;padding:2px 8px" data-idx="' + idx + '">Download</button>' +
          '</div>');
      }
    }

    if (resultsEl) {
      resultsEl.querySelectorAll('[data-idx]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var item = _results[parseInt(btn.dataset.idx)];
          if (item) { var a = document.createElement('a'); a.href = URL.createObjectURL(item.blob); a.download = item.filename; a.click(); }
        });
      });
    }

    if (_results.length > 1) {
      var wrap = document.getElementById('i2bmp-dl-all-wrap');
      if (wrap) {
        wrap.hidden = false;
        document.getElementById('i2bmp-dl-all').addEventListener('click', async function () {
          if (!window.JSZip) { alert('JSZip not loaded'); return; }
          var zip = new JSZip();
          _results.forEach(function (r) { zip.file(r.filename, r.blob); });
          var zipBlob = await zip.generateAsync({ type: 'blob' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob); a.download = 'images-bmp.zip'; a.click();
        });
      }
    }

    onProgress && onProgress(1, 'Done!');
    return { blob: _results[0].blob, filename: _results[0].filename };
  }

  function convertOne(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);

        // Try native BMP
        canvas.toBlob(function (blob) {
          if (blob && blob.type === 'image/bmp') {
            resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '.bmp' });
            return;
          }
          // Manual 24-bit BMP
          var imageData = ctx.getImageData(0, 0, w, h);
          var rowSize = Math.ceil(w * 3 / 4) * 4; // padded to 4 bytes
          var pixelDataSize = rowSize * h;
          var fileSize = 54 + pixelDataSize;
          var buf = new ArrayBuffer(fileSize);
          var view = new DataView(buf);

          // BMP file header
          view.setUint16(0, 0x424D, false); // 'BM'
          view.setUint32(2, fileSize, true);
          view.setUint32(6, 0, true);
          view.setUint32(10, 54, true); // pixel data offset

          // DIB header (BITMAPINFOHEADER)
          view.setUint32(14, 40, true); // header size
          view.setInt32(18, w, true);
          view.setInt32(22, -h, true); // negative = top-down
          view.setUint16(26, 1, true);  // color planes
          view.setUint16(28, 24, true); // bits per pixel
          view.setUint32(30, 0, true);  // compression (none)
          view.setUint32(34, pixelDataSize, true);
          view.setInt32(38, 2835, true); // 72 DPI
          view.setInt32(42, 2835, true);
          view.setUint32(46, 0, true); // colors in table
          view.setUint32(50, 0, true); // important colors

          // Pixel data (BGR)
          var offset = 54;
          for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
              var i = (y * w + x) * 4;
              view.setUint8(offset++, imageData.data[i + 2]); // B
              view.setUint8(offset++, imageData.data[i + 1]); // G
              view.setUint8(offset++, imageData.data[i]);     // R
            }
            // row padding
            for (var p = w * 3; p % 4 !== 0; p++) view.setUint8(offset++, 0);
          }

          resolve({ blob: new Blob([buf], { type: 'image/bmp' }), filename: file.name.replace(/\.[^.]+$/, '') + '.bmp' });
        }, 'image/bmp');
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

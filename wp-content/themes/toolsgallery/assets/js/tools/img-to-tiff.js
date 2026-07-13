/**
 * ToolsGallery — Image to TIFF
 * Handler: img-to-tiff
 * URL: /tool/img-to-tiff/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-tiff', multiFile: true };

  function getOptionsHTML() {
    return '<div id="i2t-support-msg" style="font-size:13px;color:var(--color-gray-600);margin-bottom:8px">Converts images to TIFF (uncompressed RGBA).</div>' +
    '<div id="i2t-results" style="margin-top:8px"></div>';
  }

  function wireOptions(container) {
    var msg = container.querySelector('#i2t-support-msg');
    if (msg && !window.UTIF) {
      msg.innerHTML = '⚠ TIFF encoder not loaded — files will be exported as <strong>PNG</strong> instead.';
    }
  }

  function getOptions(optionsEl) { return {}; }

  var _results = [];

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _results = [];
    var resultsEl = document.getElementById('i2t-results');
    if (resultsEl) resultsEl.innerHTML = '';

    var supported = !!window.UTIF;

    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress((i / files.length) * 0.9, 'Converting ' + files[i].name + '...');
      var result = await convertOne(files[i], supported);
      _results.push(result);
      if (resultsEl) {
        var idx = _results.length - 1;
        resultsEl.insertAdjacentHTML('beforeend',
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px">' +
          '<span>' + escHtml(result.filename) + (!supported ? ' <em style="color:#92400e">(PNG fallback)</em>' : '') + '</span>' +
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

    // 2+ files: the main Download button delivers a ZIP of every output
    if (_results.length > 1) {
      onProgress && onProgress(0.95, 'Building ZIP...');
      var zipBlob = await buildZip(_results);
      if (zipBlob) {
        onProgress && onProgress(1, 'Done!');
        return { blob: zipBlob, filename: 'images-tiff.zip' };
      }
    }

    onProgress && onProgress(1, 'Done!');
    return { blob: _results[0].blob, filename: _results[0].filename };
  }

  /* Bundle all output blobs into one ZIP; returns null if the ZIP
     library can't be loaded (caller falls back to the first file). */
  async function buildZip(items) {
    if (!window.JSZip && window.TGImageUtil && TGImageUtil.loadScript) {
      try {
        await TGImageUtil.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      } catch (e) { /* offline / blocked CDN */ }
    }
    if (!window.JSZip) return null;
    var zip = new JSZip();
    items.forEach(function (item) { zip.file(item.filename, item.blob); });
    return zip.generateAsync({ type: 'blob' });
  }

  async function convertOne(file, utifAvailable) {
    var img = await TGImageUtil.loadImage(file);
    var w = img.naturalWidth, h = img.naturalHeight;
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    if (utifAvailable) {
      var imageData = ctx.getImageData(0, 0, w, h);
      var tiffBuffer = UTIF.encodeImage(imageData.data.buffer, w, h);
      return {
        blob: new Blob([tiffBuffer], { type: 'image/tiff' }),
        filename: TGImageUtil.stripExt(file.name) + '.tiff',
      };
    }

    var blob = await TGImageUtil.canvasToBlob(canvas, 'image/png', 1.0);
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '.png' };
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

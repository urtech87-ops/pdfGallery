/**
 * ToolsGallery — Image to GIF
 * Handler: img-to-gif
 * URL: /tool/img-to-gif/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-gif', multiFile: true };

  function getOptionsHTML() {
    return '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:10px;font-size:13px;margin-bottom:8px">' +
      '⚠ GIF is limited to 256 colors. For best results, use images with few colors. Photos will lose quality.' +
    '</div>' +
    '<div id="i2g-results" style="margin-top:8px"></div>';
  }

  function getOptions(optionsEl) { return {}; }

  var _results = [];
  var _workerUrlPromise = null;

  /* gif.js runs its encoder in a Web Worker. Workers can't be constructed
     from a cross-origin CDN URL, so fetch the worker source and serve it
     from a same-origin blob URL. */
  function getGifWorkerUrl() {
    if (_workerUrlPromise) return _workerUrlPromise;
    _workerUrlPromise = fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js')
      .then(function (r) {
        if (!r.ok) throw new Error('worker fetch failed');
        return r.text();
      })
      .then(function (src) {
        return URL.createObjectURL(new Blob([src], { type: 'application/javascript' }));
      })
      .catch(function (e) { _workerUrlPromise = null; throw e; });
    return _workerUrlPromise;
  }

  function encodeGif(canvas, workerUrl) {
    return new Promise(function (resolve, reject) {
      var gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: workerUrl,
      });
      gif.addFrame(canvas, { delay: 0 });
      gif.on('finished', function (blob) { resolve(blob); });
      gif.on('abort', function () { reject(new Error('GIF encoding aborted')); });
      try { gif.render(); } catch (e) { reject(e); }
    });
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _results = [];
    var resultsEl = document.getElementById('i2g-results');
    if (resultsEl) resultsEl.innerHTML = '';

    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress((i / files.length) * 0.9, 'Converting ' + files[i].name + '...');
      var result = await convertOne(files[i]);
      _results.push(result);
      if (resultsEl) {
        var idx = _results.length - 1;
        resultsEl.insertAdjacentHTML('beforeend',
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px">' +
          '<span>' + escHtml(result.filename) + (result.fallback ? ' <em style="color:#92400e">(PNG fallback)</em>' : '') + '</span>' +
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
        return { blob: zipBlob, filename: 'images-gif.zip' };
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

  async function convertOne(file) {
    var img = await TGImageUtil.loadImage(file);
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    // GIF has no alpha gradient — flatten transparency onto white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Encode a real single-frame GIF with gif.js; fall back to PNG
    if (window.GIF) {
      try {
        var workerUrl = await getGifWorkerUrl();
        var gifBlob = await encodeGif(canvas, workerUrl);
        return { blob: gifBlob, filename: TGImageUtil.stripExt(file.name) + '.gif', fallback: false };
      } catch (e) {
        // fall through to PNG fallback
      }
    }

    var pngBlob = await TGImageUtil.canvasToBlob(canvas, 'image/png', 1.0);
    return { blob: pngBlob, filename: TGImageUtil.stripExt(file.name) + '.png', fallback: true };
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

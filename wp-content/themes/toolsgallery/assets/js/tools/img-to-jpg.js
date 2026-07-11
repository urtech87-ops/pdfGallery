/**
 * ToolsGallery — Image to JPG
 * Handler: img-to-jpg
 * URL: /tool/img-to-jpg/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-jpg', multiFile: true };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="i2j-quality">Quality: <span id="i2j-quality-val">92</span>%</label>' +
      '<input type="range" id="i2j-quality" min="10" max="100" value="92" style="flex:1">' +
    '</div>' +
    '<div id="i2j-results"></div>';
  }

  function wireOptions(container) {
    var q = container.querySelector('#i2j-quality');
    var v = container.querySelector('#i2j-quality-val');
    if (q && v) q.addEventListener('input', function () { v.textContent = q.value; });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { quality: 0.92 };
    var q = optionsEl.querySelector('#i2j-quality');
    return { quality: q ? parseInt(q.value) / 100 : 0.92 };
  }

  var _results = [];

  async function run(file, options, onProgress) {
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _results = [];
    var resultsEl = document.getElementById('i2j-results');
    if (resultsEl) resultsEl.innerHTML = '';

    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress((i / files.length) * 0.9, 'Converting ' + files[i].name + '...');
      var result = await convertOne(files[i], options);
      _results.push(result);
      if (resultsEl) {
        var idx = _results.length - 1;
        var row = '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px">' +
          '<span>' + escHtml(result.filename) + '</span>' +
          '<button type="button" class="tg-btn-secondary" style="font-size:11px;padding:2px 8px" data-idx="' + idx + '">Download</button>' +
        '</div>';
        resultsEl.insertAdjacentHTML('beforeend', row);
      }
    }

    if (resultsEl) {
      resultsEl.querySelectorAll('[data-idx]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var item = _results[parseInt(btn.dataset.idx)];
          if (!item) return;
          var a = document.createElement('a'); a.href = URL.createObjectURL(item.blob); a.download = item.filename; a.click();
        });
      });
    }

    // 2+ files: the main Download button delivers a ZIP of every output
    if (_results.length > 1) {
      onProgress && onProgress(0.95, 'Building ZIP...');
      var zipBlob = await buildZip(_results);
      if (zipBlob) {
        onProgress && onProgress(1, 'Done!');
        return { blob: zipBlob, filename: 'images-jpg.zip' };
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

  function convertOne(file, options) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Conversion failed')); return; }
          resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '.jpg' });
        }, 'image/jpeg', options.quality || 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

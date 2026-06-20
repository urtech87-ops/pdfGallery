/**
 * ToolsGallery — Image to SVG
 * Handler: img-to-svg
 * URL: /tool/img-to-svg/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-svg', multiFile: true };

  function getOptionsHTML() {
    return '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px;font-size:13px;margin-bottom:8px">' +
      'ℹ Creates an SVG that embeds the raster image as base64. Vector tracing is not performed.' +
    '</div>' +
    '<div id="i2s-results" style="margin-top:8px"></div>' +
    '<div id="i2s-dl-all-wrap" hidden style="margin-top:8px">' +
      '<button type="button" id="i2s-dl-all" class="tg-btn-secondary">Download All as ZIP</button>' +
    '</div>';
  }

  function getOptions(optionsEl) { return {}; }

  var _results = [];

  async function run(file, options, onProgress) {
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _results = [];
    var resultsEl = document.getElementById('i2s-results');
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
      var wrap = document.getElementById('i2s-dl-all-wrap');
      if (wrap) {
        wrap.hidden = false;
        document.getElementById('i2s-dl-all').addEventListener('click', async function () {
          if (!window.JSZip) { alert('JSZip not loaded'); return; }
          var zip = new JSZip();
          _results.forEach(function (r) { zip.file(r.filename, r.blob); });
          var zipBlob = await zip.generateAsync({ type: 'blob' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob); a.download = 'images-svg.zip'; a.click();
        });
      }
    }

    onProgress && onProgress(1, 'Done!');
    return { blob: _results[0].blob, filename: _results[0].filename };
  }

  function convertOne(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target.result;
        var img = new Image();
        img.onload = function () {
          var w = img.width, h = img.height;
          var mime = file.type || 'image/jpeg';
          var svg = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">\n' +
            '  <image href="' + dataUrl + '" x="0" y="0" width="' + w + '" height="' + h + '"/>\n' +
            '</svg>';
          var blob = new Blob([svg], { type: 'image/svg+xml' });
          resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '.svg' });
        };
        img.onerror = function () { reject(new Error('Could not load image')); };
        img.src = dataUrl;
      };
      reader.onerror = function () { reject(new Error('Could not read file')); };
      reader.readAsDataURL(file);
    });
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

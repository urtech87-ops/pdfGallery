/**
 * ToolsGallery — Image to TIFF
 * Handler: img-to-tiff
 * URL: /tool/img-to-tiff/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-tiff', multiFile: true };

  var _tiffSupported = null;

  function checkTiffSupport() {
    if (_tiffSupported !== null) return Promise.resolve(_tiffSupported);
    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      canvas.toBlob(function (blob) {
        _tiffSupported = blob && blob.type === 'image/tiff';
        resolve(_tiffSupported);
      }, 'image/tiff');
    });
  }

  function getOptionsHTML() {
    return '<div id="i2t-support-msg" style="font-size:13px;color:var(--color-gray-600);margin-bottom:8px">Checking TIFF support...</div>' +
    '<div id="i2t-results" style="margin-top:8px"></div>' +
    '<div id="i2t-dl-all-wrap" hidden style="margin-top:8px">' +
      '<button type="button" id="i2t-dl-all" class="tg-btn-secondary">Download All as ZIP</button>' +
    '</div>' +
    '<script>(function(){' +
      'var canvas=document.createElement("canvas");canvas.width=1;canvas.height=1;' +
      'canvas.toBlob(function(blob){' +
        'var msg=document.getElementById("i2t-support-msg");if(!msg)return;' +
        'if(blob&&blob.type==="image/tiff"){msg.textContent="✓ TIFF format supported by your browser.";}' +
        'else{msg.innerHTML="⚠ TIFF not supported — files will be exported as <strong>PNG</strong> instead.";}' +
      '},"image/tiff");' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) { return {}; }

  var _results = [];

  async function run(file, options, onProgress) {
    var supported = await checkTiffSupport();
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _results = [];
    var resultsEl = document.getElementById('i2t-results');
    if (resultsEl) resultsEl.innerHTML = '';

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

    if (_results.length > 1) {
      var wrap = document.getElementById('i2t-dl-all-wrap');
      if (wrap) {
        wrap.hidden = false;
        document.getElementById('i2t-dl-all').addEventListener('click', async function () {
          if (!window.JSZip) { alert('JSZip not loaded'); return; }
          var zip = new JSZip();
          _results.forEach(function (r) { zip.file(r.filename, r.blob); });
          var zipBlob = await zip.generateAsync({ type: 'blob' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob); a.download = 'images-tiff.zip'; a.click();
        });
      }
    }

    onProgress && onProgress(1, 'Done!');
    return { blob: _results[0].blob, filename: _results[0].filename };
  }

  function convertOne(file, tiffSupported) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        var mime = tiffSupported ? 'image/tiff' : 'image/png';
        var ext = tiffSupported ? '.tiff' : '.png';
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Conversion failed')); return; }
          resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + ext });
        }, mime);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Image to AVIF
 * Handler: img-to-avif
 * URL: /tool/img-to-avif/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-avif', multiFile: true };

  var _avifSupported = null;

  function checkAvifSupport() {
    if (_avifSupported !== null) return Promise.resolve(_avifSupported);
    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      canvas.toBlob(function (blob) {
        _avifSupported = blob && blob.type === 'image/avif';
        resolve(_avifSupported);
      }, 'image/avif');
    });
  }

  function getOptionsHTML() {
    return '<div id="i2av-support-msg" style="font-size:13px;color:var(--color-gray-600);margin-bottom:8px">Checking AVIF support...</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="i2av-quality">Quality: <span id="i2av-quality-val">85</span>%</label>' +
      '<input type="range" id="i2av-quality" min="10" max="100" value="85" style="flex:1">' +
    '</div>' +
    '<div id="i2av-results" style="margin-top:8px"></div>' +
    '<div id="i2av-dl-all-wrap" hidden style="margin-top:8px">' +
      '<button type="button" id="i2av-dl-all" class="tg-btn-secondary">Download All as ZIP</button>' +
    '</div>' +
    '<script>(function(){' +
      'var q=document.getElementById("i2av-quality"),v=document.getElementById("i2av-quality-val");' +
      'if(q&&v)q.addEventListener("input",function(){v.textContent=q.value;});' +
      'var canvas=document.createElement("canvas");canvas.width=1;canvas.height=1;' +
      'canvas.toBlob(function(blob){' +
        'var msg=document.getElementById("i2av-support-msg");if(!msg)return;' +
        'if(blob&&blob.type==="image/avif"){msg.textContent="✓ AVIF format supported by your browser.";}' +
        'else{msg.innerHTML="⚠ AVIF not supported — will fall back to <strong>WebP</strong>.";}' +
      '},"image/avif");' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { quality: 0.85 };
    var q = optionsEl.querySelector('#i2av-quality');
    return { quality: q ? parseInt(q.value) / 100 : 0.85 };
  }

  var _results = [];

  async function run(file, options, onProgress) {
    var avifSupported = await checkAvifSupport();
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _results = [];
    var resultsEl = document.getElementById('i2av-results');
    if (resultsEl) resultsEl.innerHTML = '';

    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress((i / files.length) * 0.9, 'Converting ' + files[i].name + '...');
      var result = await convertOne(files[i], options, avifSupported);
      _results.push(result);
      if (resultsEl) {
        var idx = _results.length - 1;
        resultsEl.insertAdjacentHTML('beforeend',
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px">' +
          '<span>' + escHtml(result.filename) + (!avifSupported ? ' <em style="color:#92400e">(WebP fallback)</em>' : '') + '</span>' +
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
      var wrap = document.getElementById('i2av-dl-all-wrap');
      if (wrap) {
        wrap.hidden = false;
        document.getElementById('i2av-dl-all').addEventListener('click', async function () {
          if (!window.JSZip) { alert('JSZip not loaded'); return; }
          var zip = new JSZip();
          _results.forEach(function (r) { zip.file(r.filename, r.blob); });
          var zipBlob = await zip.generateAsync({ type: 'blob' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob); a.download = 'images-avif.zip'; a.click();
        });
      }
    }

    onProgress && onProgress(1, 'Done!');
    return { blob: _results[0].blob, filename: _results[0].filename };
  }

  function convertOne(file, options, avifSupported) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        var mime = avifSupported ? 'image/avif' : 'image/webp';
        var ext = avifSupported ? '.avif' : '.webp';
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Conversion failed')); return; }
          resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + ext });
        }, mime, options.quality || 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

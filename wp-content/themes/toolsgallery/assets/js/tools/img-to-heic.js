/**
 * ToolsGallery — HEIC Converter
 * Handler: img-to-heic
 * URL: /tool/img-to-heic/
 *
 * Browsers cannot encode HEIC. This tool:
 *  - decodes HEIC/HEIF input (iPhone/Mac photos) to high-quality JPEG
 *  - converts any other image to high-quality JPEG with a note
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-to-heic', multiFile: true };

  function getOptionsHTML() {
    return '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px;font-size:13px;margin-bottom:8px">' +
      'Upload HEIC/HEIF files (from iPhone/Mac) to convert them to JPEG. ' +
      'Note: web browsers cannot create HEIC files — other images are saved as high-quality JPEG.' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="h2j-quality">Output Quality: <span id="h2j-quality-val">90</span>%</label>' +
      '<input type="range" id="h2j-quality" min="10" max="100" value="90" style="flex:1">' +
    '</div>' +
    '<div id="h2j-results" style="margin-top:8px"></div>' +
    '<div id="h2j-dl-all-wrap" hidden style="margin-top:8px">' +
      '<button type="button" id="h2j-dl-all" class="tg-btn-secondary">Download All as ZIP</button>' +
    '</div>';
  }

  function wireOptions(container) {
    var q = container.querySelector('#h2j-quality');
    var v = container.querySelector('#h2j-quality-val');
    if (q && v) q.addEventListener('input', function () { v.textContent = q.value; });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { quality: 0.90 };
    var q = optionsEl.querySelector('#h2j-quality');
    return { quality: q ? parseInt(q.value) / 100 : 0.90 };
  }

  function isHeic(file) {
    return /\.hei[cf]$/i.test(file.name) ||
      file.type === 'image/heic' || file.type === 'image/heif';
  }

  var _results = [];

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _results = [];
    var resultsEl = document.getElementById('h2j-results');
    if (resultsEl) resultsEl.innerHTML = '';

    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress((i / files.length) * 0.9, 'Converting ' + files[i].name + '...');
      var result = await convertOne(files[i], options);
      _results.push(result);
      if (resultsEl) {
        var idx = _results.length - 1;
        resultsEl.insertAdjacentHTML('beforeend',
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px">' +
          '<span>' + escHtml(result.filename) + (result.note ? ' <em style="color:#92400e">(' + result.note + ')</em>' : '') + '</span>' +
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
      var wrap = document.getElementById('h2j-dl-all-wrap');
      if (wrap) {
        wrap.hidden = false;
        document.getElementById('h2j-dl-all').addEventListener('click', async function () {
          if (!window.JSZip) { alert('JSZip not loaded'); return; }
          var zip = new JSZip();
          _results.forEach(function (r) { zip.file(r.filename, r.blob); });
          var zipBlob = await zip.generateAsync({ type: 'blob' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob); a.download = 'heic-converted.zip'; a.click();
        });
      }
    }

    onProgress && onProgress(1, 'Done!');
    return { blob: _results[0].blob, filename: _results[0].filename };
  }

  async function convertOne(file, options) {
    if (isHeic(file)) {
      if (!window.heic2any) {
        throw new Error('HEIC conversion library did not load. Please refresh the page and try again.');
      }
      var resultBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: options.quality || 0.90,
      });
      // heic2any can return array or blob
      var blob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
      return { blob: blob, filename: file.name.replace(/\.hei[cf]$/i, '') + '.jpg' };
    }

    // Non-HEIC input: browsers cannot encode HEIC — save as high-quality JPEG
    var img = await TGImageUtil.loadImage(file);
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    var jpgBlob = await TGImageUtil.canvasToBlob(canvas, 'image/jpeg', Math.max(options.quality || 0.90, 0.9));
    return {
      blob: jpgBlob,
      filename: TGImageUtil.stripExt(file.name) + '.jpg',
      note: 'HEIC encoding unsupported in browsers — saved as JPEG',
    };
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Compress Image
 * Handler: img-compress
 * URL: /tool/compress-image/
 */
(function () {
  'use strict';

  var CONFIG = { handler: 'img-compress' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ic-quality">Quality: <span id="ic-quality-val">80</span>%</label>' +
      '<input type="range" id="ic-quality" min="1" max="100" value="80" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ic-maxw">Max Width</label>' +
      '<select id="ic-maxw" class="tg-select">' +
        '<option value="0">Original</option>' +
        '<option value="1920">1920px</option>' +
        '<option value="1280">1280px</option>' +
        '<option value="800">800px</option>' +
        '<option value="custom">Custom...</option>' +
      '</select>' +
    '</div>' +
    '<div id="ic-custom-w-wrap" hidden style="margin-top:6px">' +
      '<input type="number" id="ic-custom-w" class="tg-text-input" placeholder="Width in px" min="1" max="10000">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label><input type="checkbox" id="ic-png2jpg"> Convert PNG to JPG</label>' +
    '</div>' +
    '<p id="ic-png-note" class="tg-opt-info" hidden style="color:#b45309">' +
      'PNG is lossless — the quality slider has no effect on PNG output. ' +
      'For smaller files enable "Convert PNG to JPG" or reduce Max Width.' +
    '</p>' +
    '<div id="ic-preview-wrap" hidden style="margin-top:12px">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Before (<span id="ic-before-size"></span>)</p>' +
          '<canvas id="ic-before" style="max-width:220px;border:1px solid #ddd;border-radius:4px"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">After (<span id="ic-after-size"></span>)</p>' +
          '<canvas id="ic-after" style="max-width:220px;border:1px solid #ddd;border-radius:4px"></canvas></div>' +
      '</div>' +
      '<p id="ic-preview-note" class="tg-opt-info" style="margin-top:4px"></p>' +
    '</div>' +
    '<div id="ic-results-wrap" style="margin-top:12px"></div>' +
    '<div id="ic-dl-all-wrap" hidden style="margin-top:10px">' +
      '<button type="button" id="ic-dl-all" class="tg-btn-secondary">Download All as ZIP</button>' +
    '</div>';
  }

  function wireOptions(container) {
    var q = container.querySelector('#ic-quality');
    var v = container.querySelector('#ic-quality-val');
    if (q && v) q.addEventListener('input', function () { v.textContent = q.value; });
    var s = container.querySelector('#ic-maxw');
    var w = container.querySelector('#ic-custom-w-wrap');
    if (s && w) s.addEventListener('change', function () { w.hidden = s.value !== 'custom'; });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var q = optionsEl.querySelector('#ic-quality');
    var mw = optionsEl.querySelector('#ic-maxw');
    var cw = optionsEl.querySelector('#ic-custom-w');
    var p2j = optionsEl.querySelector('#ic-png2jpg');
    var maxW = 0;
    if (mw) {
      if (mw.value === 'custom') maxW = cw ? parseInt(cw.value) || 0 : 0;
      else maxW = parseInt(mw.value) || 0;
    }
    return {
      quality: q ? parseInt(q.value) / 100 : 0.8,
      maxWidth: maxW,
      png2jpg: p2j ? p2j.checked : false,
    };
  }

  var _compressedFiles = [];

  async function run(file, options, onProgress) {
    // For multi-file, tool-runner passes first file. We handle multi via stored files array.
    // Grab files from the tool box.
    var box = document.querySelector('.tg-tool-box');
    var files = [];
    if (box && box._tgFiles && box._tgFiles.length) {
      files = Array.from(box._tgFiles);
    } else {
      files = [file];
    }

    _compressedFiles = [];
    var resultsWrap = document.getElementById('ic-results-wrap');
    if (resultsWrap) resultsWrap.innerHTML = '';

    var tableHtml = '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:#f5f5f5">' +
        '<th style="padding:6px 8px;text-align:left;border:1px solid #ddd">File</th>' +
        '<th style="padding:6px 8px;text-align:right;border:1px solid #ddd">Original</th>' +
        '<th style="padding:6px 8px;text-align:right;border:1px solid #ddd">Compressed</th>' +
        '<th style="padding:6px 8px;text-align:right;border:1px solid #ddd">Saved</th>' +
        '<th style="padding:6px 8px;border:1px solid #ddd">Download</th>' +
      '</tr></thead><tbody id="ic-table-body"></tbody></table>';

    if (resultsWrap) resultsWrap.innerHTML = tableHtml;

    var anyPngKeptAsPng = false;
    var firstResult = null;
    var firstImg = null;
    var firstOrigSize = 0;

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      onProgress && onProgress((i / files.length) * 0.9, 'Compressing ' + f.name + '...');

      try {
        var result = await compressOne(f, options);
        _compressedFiles.push(result);
        if (result.pngLossless) anyPngKeptAsPng = true;
        if (!firstResult) { firstResult = result; firstImg = result.sourceImg; firstOrigSize = f.size; }

        var saved = Math.round((1 - result.blob.size / f.size) * 100);
        var row = '<tr>' +
          '<td style="padding:6px 8px;border:1px solid #ddd">' + escHtml(f.name) + '</td>' +
          '<td style="padding:6px 8px;text-align:right;border:1px solid #ddd">' + fmtBytes(f.size) + '</td>' +
          '<td style="padding:6px 8px;text-align:right;border:1px solid #ddd">' + fmtBytes(result.blob.size) + '</td>' +
          '<td style="padding:6px 8px;text-align:right;border:1px solid #ddd;color:' + (saved > 0 ? 'green' : '#999') + '">' + (saved > 0 ? '-' + saved + '%' : '~0%') + '</td>' +
          '<td style="padding:6px 8px;border:1px solid #ddd">' +
            '<button type="button" class="tg-btn-secondary" style="font-size:11px;padding:2px 8px" data-ic-idx="' + (_compressedFiles.length - 1) + '">Download</button>' +
          '</td>' +
        '</tr>';

        var tbody = document.getElementById('ic-table-body');
        if (tbody) tbody.insertAdjacentHTML('beforeend', row);
      } catch (e) {
        console.error('Compress error:', e);
      }
    }

    // PNG-is-lossless note: quality slider cannot shrink a PNG kept as PNG
    var pngNote = document.getElementById('ic-png-note');
    if (pngNote) pngNote.hidden = !anyPngKeptAsPng;

    // Before → after preview of the first compressed file
    if (firstResult && firstImg) {
      await renderPreview(firstImg, firstResult, firstOrigSize);
    }

    // Attach download handlers
    var tbody2 = document.getElementById('ic-table-body');
    if (tbody2) {
      tbody2.querySelectorAll('[data-ic-idx]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.dataset.icIdx);
          var item = _compressedFiles[idx];
          if (!item) return;
          var a = document.createElement('a');
          a.href = URL.createObjectURL(item.blob);
          a.download = item.filename;
          a.click();
        });
      });
    }

    var dlAllWrap = document.getElementById('ic-dl-all-wrap');
    if (dlAllWrap && _compressedFiles.length > 1) {
      dlAllWrap.hidden = false;
      var dlAllBtn = document.getElementById('ic-dl-all');
      if (dlAllBtn) {
        // onclick (not addEventListener) so repeated runs don't stack handlers
        dlAllBtn.onclick = async function () {
          if (!window.JSZip) {
            try {
              await TGImageUtil.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            } catch (e) { alert('Could not load ZIP library. Please check your connection.'); return; }
          }
          dlAllBtn.disabled = true;
          dlAllBtn.textContent = 'Building ZIP...';
          var zip = new JSZip();
          _compressedFiles.forEach(function (item) {
            zip.file(item.filename, item.blob);
          });
          var zipBlob = await zip.generateAsync({ type: 'blob' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(zipBlob);
          a.download = 'compressed-images.zip';
          a.click();
          dlAllBtn.disabled = false;
          dlAllBtn.textContent = 'Download All as ZIP';
        };
      }
    }

    onProgress && onProgress(1, 'Done!');
    var firstItem = _compressedFiles[0];
    if (!firstItem) throw new Error('No files could be compressed.');
    return { blob: firstItem.blob, filename: firstItem.filename };
  }

  async function renderPreview(origImg, result, origSize) {
    var wrap = document.getElementById('ic-preview-wrap');
    var beforeEl = document.getElementById('ic-before');
    var afterEl = document.getElementById('ic-after');
    if (!wrap || !beforeEl || !afterEl) return;

    TGImageUtil.drawPreview(origImg, beforeEl, 220);
    try {
      var compImg = await TGImageUtil.loadImage(result.blob);
      TGImageUtil.drawPreview(compImg, afterEl, 220);
    } catch (e) { /* preview is best-effort */ }

    var beforeSize = document.getElementById('ic-before-size');
    var afterSize = document.getElementById('ic-after-size');
    if (beforeSize) beforeSize.textContent = fmtBytes(origSize);
    if (afterSize) afterSize.textContent = fmtBytes(result.blob.size);

    var note = document.getElementById('ic-preview-note');
    if (note) {
      var saved = origSize ? Math.round((1 - result.blob.size / origSize) * 100) : 0;
      note.textContent = saved > 0
        ? 'Compressed result — ' + saved + '% smaller.'
        : 'Output is not smaller — try a lower quality or a smaller Max Width.';
    }
    wrap.hidden = false;
  }

  async function compressOne(file, options) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        if (options.maxWidth && w > options.maxWidth) {
          h = Math.round(h * options.maxWidth / w);
          w = options.maxWidth;
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        var isPng = file.type === 'image/png';
        var isWebp = file.type === 'image/webp';
        var outMime = (isPng && options.png2jpg) ? 'image/jpeg'
          : (isPng ? 'image/png' : (isWebp ? 'image/webp' : 'image/jpeg'));
        var ext = outMime === 'image/png' ? '.png' : (outMime === 'image/webp' ? '.webp' : '.jpg');
        var baseName = file.name.replace(/\.[^.]+$/, '');
        // JPEG output over a transparent PNG needs a white backing
        if (outMime === 'image/jpeg' && isPng) {
          var flat = document.createElement('canvas');
          flat.width = w; flat.height = h;
          var fctx = flat.getContext('2d');
          fctx.fillStyle = '#ffffff';
          fctx.fillRect(0, 0, w, h);
          fctx.drawImage(canvas, 0, 0);
          canvas = flat;
        }

        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          resolve({
            blob: blob,
            filename: baseName + '-compressed' + ext,
            pngLossless: outMime === 'image/png',
            sourceImg: img,
          });
        }, outMime, options.quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

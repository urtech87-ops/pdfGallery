/**
 * ToolsGallery — Image Converter
 * Handler: img-convert
 * URL: /tool/convert-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-convert' };

  var MIME_MAP = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    bmp: 'image/bmp',
    gif: 'image/gif',
    avif: 'image/avif',
  };

  function getOptionsHTML() {
    var box = document.querySelector('.tg-tool-box');
    var inputFmt = box ? box.dataset.inputFormat : '';
    var outputFmt = box ? box.dataset.outputFormat : '';

    var fmtOpts = ['jpg','png','webp','bmp','gif','avif'].map(function (f) {
      var sel = (outputFmt && f === outputFmt) ? ' selected' : (!outputFmt && f === 'png' ? ' selected' : '');
      return '<option value="' + f + '"' + sel + '>' + f.toUpperCase() + '</option>';
    }).join('');

    var locked = inputFmt && outputFmt;

    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icv-fmt">Convert to</label>' +
      '<select id="icv-fmt" class="tg-select"' + (locked ? ' disabled' : '') + '>' + fmtOpts + '</select>' +
    '</div>' +
    (locked ? '<p class="tg-opt-info">Converting ' + inputFmt.toUpperCase() + ' to ' + outputFmt.toUpperCase() + '</p>' : '') +
    '<div id="icv-results" style="margin-top:12px"></div>' +
    '<div id="icv-dl-all-wrap" hidden style="margin-top:10px">' +
      '<button type="button" id="icv-dl-all" class="tg-btn-secondary">Download All as ZIP</button>' +
    '</div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var fmt = optionsEl.querySelector('#icv-fmt');
    return { format: fmt ? fmt.value : 'png' };
  }

  var _convertedFiles = [];

  async function run(file, options, onProgress) {
    var box = document.querySelector('.tg-tool-box');
    var outputFmt = (box && box.dataset.outputFormat) ? box.dataset.outputFormat : options.format || 'png';

    var files = [];
    if (box && box._tgFiles && box._tgFiles.length) {
      files = Array.from(box._tgFiles);
    } else {
      files = [file];
    }

    _convertedFiles = [];
    var resultsWrap = document.getElementById('icv-results');
    if (resultsWrap) {
      resultsWrap.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="background:#f5f5f5">' +
          '<th style="padding:6px;text-align:left;border:1px solid #ddd">File</th>' +
          '<th style="padding:6px;border:1px solid #ddd">Preview</th>' +
          '<th style="padding:6px;border:1px solid #ddd">Status</th>' +
          '<th style="padding:6px;border:1px solid #ddd">Download</th>' +
        '</tr></thead><tbody id="icv-tbody"></tbody></table>';
    }

    var lastError = null;

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      onProgress && onProgress(i / files.length * 0.9, 'Converting ' + f.name + '...');
      try {
        var result = await convertOne(f, outputFmt);
        _convertedFiles.push(result);

        var tbody = document.getElementById('icv-tbody');
        if (tbody) {
          var idx = _convertedFiles.length - 1;
          var tr = document.createElement('tr');
          tr.innerHTML = '<td style="padding:6px;border:1px solid #ddd">' + escHtml(result.filename) + '</td>' +
            '<td style="padding:6px;border:1px solid #ddd;text-align:center"></td>' +
            '<td style="padding:6px;border:1px solid #ddd;color:green;text-align:center">Done (' + fmtBytes(result.blob.size) + ')</td>' +
            '<td style="padding:6px;border:1px solid #ddd;text-align:center">' +
              '<button type="button" class="tg-btn-secondary" style="font-size:11px;padding:2px 8px" data-icv-idx="' + idx + '">Download</button>' +
            '</td>';
          tbody.appendChild(tr);

          // Output thumbnail rendered from the converted blob itself
          var thumbCell = tr.children[1];
          var thumb = document.createElement('img');
          thumb.alt = 'Converted preview';
          thumb.style.cssText = 'max-width:80px;max-height:60px;border:1px solid #eee;border-radius:3px;vertical-align:middle;background:repeating-conic-gradient(#eee 0% 25%,#fff 0% 50%) 0 0 / 10px 10px';
          var thumbUrl = URL.createObjectURL(result.blob);
          thumb.onload = function () { /* keep URL alive while displayed */ };
          thumb.src = thumbUrl;
          thumbCell.appendChild(thumb);

          tr.querySelector('[data-icv-idx]').addEventListener('click', function () {
            var item = _convertedFiles[parseInt(this.dataset.icvIdx)];
            if (!item) return;
            var a = document.createElement('a');
            a.href = URL.createObjectURL(item.blob);
            a.download = item.filename;
            a.click();
          });
        }
      } catch (e) {
        lastError = e;
        var tbody2 = document.getElementById('icv-tbody');
        if (tbody2) {
          var tr2 = document.createElement('tr');
          tr2.innerHTML = '<td style="padding:6px;border:1px solid #ddd">' + escHtml(f.name) + '</td>' +
            '<td colspan="3" style="padding:6px;border:1px solid #ddd;color:red">' + escHtml(e.message) + '</td>';
          tbody2.appendChild(tr2);
        }
      }
    }

    var dlAllWrap = document.getElementById('icv-dl-all-wrap');
    if (dlAllWrap && _convertedFiles.length > 1) {
      dlAllWrap.hidden = false;
      var dlAllBtn = document.getElementById('icv-dl-all');
      if (dlAllBtn) {
        // onclick (not addEventListener) so repeated runs don't stack handlers
        dlAllBtn.onclick = async function () {
          if (!window.JSZip) {
            try {
              await TGImageUtil.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            } catch (e) { alert('Could not load ZIP library. Please check your connection.'); return; }
          }
          dlAllBtn.disabled = true; dlAllBtn.textContent = 'Building ZIP...';
          var zip = new JSZip();
          _convertedFiles.forEach(function (item) { zip.file(item.filename, item.blob); });
          var zipBlob = await zip.generateAsync({ type: 'blob' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob); a.download = 'converted-images.zip'; a.click();
          dlAllBtn.disabled = false; dlAllBtn.textContent = 'Download All as ZIP';
        };
      }
    }

    onProgress && onProgress(1, 'Done!');
    var first = _convertedFiles[0];
    if (!first) throw (lastError || new Error('No files could be converted.'));
    return { blob: first.blob, filename: first.filename };
  }

  async function convertOne(file, toFmt) {
    // HEIC handling
    if ((file.type === 'image/heic' || file.type === 'image/heif' ||
         file.name.toLowerCase().match(/\.(heic|heif)$/)) && window.heic2any) {
      var converted = await window.heic2any({ blob: file, toType: MIME_MAP[toFmt] || 'image/jpeg' });
      var blob = Array.isArray(converted) ? converted[0] : converted;
      return { blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '.' + toFmt };
    }

    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        if (toFmt === 'jpg' || toFmt === 'jpeg' || toFmt === 'bmp') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        var mime = MIME_MAP[toFmt] || 'image/jpeg';
        canvas.toBlob(function (blob) {
          /* Browsers that can't encode a format either return null or
             silently fall back to PNG (blob.type mismatch) — both mean
             the chosen format is unsupported here. */
          if (!blob || blob.type !== mime) {
            reject(new Error('This browser can\'t export ' + toFmt.toUpperCase() + ' — try PNG or JPG instead.'));
            return;
          }
          resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '.' + toFmt });
        }, mime, 0.92);
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

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

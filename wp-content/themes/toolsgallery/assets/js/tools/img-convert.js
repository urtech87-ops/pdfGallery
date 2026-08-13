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
    '<p class="tg-opt-info">Images are converted in the order shown below. Drag a frame (or its number badge on touch) to reorder, rotate one with &#8635;, or remove it with &times;.</p>' +
    '<div id="icv-frames"></div>' +
    '<div id="icv-results" style="margin-top:12px"></div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var fmt = optionsEl.querySelector('#icv-fmt');
    return { format: fmt ? fmt.value : 'png' };
  }

  /* Frame grid: one preview card per uploaded image, drag-to-reorder with
     per-image rotation. Conversion runs in the frames' visual order — the
     grid replaces the old single inline thumbnail, which only ever showed
     the first file and could not show a rotation. */
  var frames = window.TGImageFrames ? window.TGImageFrames.create({
    host: 'icv-frames',
    countLabel: function (n) {
      return n + ' image' + (n === 1 ? '' : 's') + ' — converted in this order';
    },
  }) : null;

  /* Called by tool-runner when a file is selected — guarantees the
     format selector is visible and (re)builds the frame grid. */
  function onFileReady(file, optionsEl) {
    if (!optionsEl) return;
    if (!optionsEl.querySelector('#icv-fmt')) optionsEl.innerHTML = getOptionsHTML();
    optionsEl.hidden = false;
    if (frames) frames.update(window.TGImageFrames.selection(file));
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

    /* The frames are the source of truth for order and rotation; re-sync
       first so a selection changed outside this UI can never convert the
       wrong set. */
    var items;
    if (frames) {
      frames.sync(files);
      items = frames.items();
    } else {
      items = files.map(function (f) { return { file: f, rotation: 0 }; });
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

    for (var i = 0; i < items.length; i++) {
      var f = items[i].file;
      onProgress && onProgress(i / items.length * 0.9, 'Converting ' + f.name + '...');
      try {
        var result = await convertOne(f, outputFmt, items[i].rotation);
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

    var first = _convertedFiles[0];
    if (!first) throw (lastError || new Error('No files could be converted.'));

    if (frames) {
      frames.setSummary('✓ Converted ' + _convertedFiles.length +
        ' image' + (_convertedFiles.length === 1 ? '' : 's') + ' to ' + outputFmt.toUpperCase());
    }

    // 2+ files: the main Download button delivers a ZIP of every output
    if (_convertedFiles.length > 1) {
      onProgress && onProgress(0.95, 'Building ZIP...');
      var zipBlob = await buildZip(_convertedFiles);
      if (zipBlob) {
        onProgress && onProgress(1, 'Done!');
        return { blob: zipBlob, filename: 'converted-images.zip' };
      }
    }

    onProgress && onProgress(1, 'Done!');
    return { blob: first.blob, filename: first.filename };
  }

  /* Bundle all output blobs into one ZIP; returns null if the ZIP
     library can't be loaded (caller falls back to the first file). */
  async function buildZip(items) {
    if (!window.JSZip) {
      try {
        await TGImageUtil.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      } catch (e) { /* offline / blocked CDN */ }
    }
    if (!window.JSZip) return null;
    var zip = new JSZip();
    items.forEach(function (item) { zip.file(item.filename, item.blob); });
    return zip.generateAsync({ type: 'blob' });
  }

  async function convertOne(file, toFmt, rotation) {
    var outName = file.name.replace(/\.[^.]+$/, '') + '.' + toFmt;

    // HEIC handling
    if ((file.type === 'image/heic' || file.type === 'image/heif' ||
         file.name.toLowerCase().match(/\.(heic|heif)$/)) && window.heic2any) {
      var converted = await window.heic2any({ blob: file, toType: MIME_MAP[toFmt] || 'image/jpeg' });
      var blob = Array.isArray(converted) ? converted[0] : converted;
      /* heic2any cannot rotate — re-encode the decoded result when the
         frame asked for a turn. */
      if (rotation) blob = await encodeSource(await TGImageUtil.loadImage(blob), toFmt, rotation);
      return { blob: blob, filename: outName };
    }

    var img = await TGImageUtil.loadImage(file);
    return { blob: await encodeSource(img, toFmt, rotation), filename: outName };
  }

  /* Draw the (optionally rotated) source into the target format. */
  function encodeSource(img, toFmt, rotation) {
    var source = TGImageUtil.rotateSource(img, rotation || 0);
    var canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    var ctx = canvas.getContext('2d');
    if (toFmt === 'jpg' || toFmt === 'jpeg' || toFmt === 'bmp') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(source, 0, 0);
    var mime = MIME_MAP[toFmt] || 'image/jpeg';
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        /* Browsers that can't encode a format either return null or
           silently fall back to PNG (blob.type mismatch) — both mean
           the chosen format is unsupported here. */
        if (!blob || blob.type !== mime) {
          reject(new Error('This browser can\'t export ' + toFmt.toUpperCase() + ' — try PNG or JPG instead.'));
          return;
        }
        resolve(blob);
      }, mime, 0.92);
    });
  }

  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Add Subtitles to Video
 * Handler: vid-subtitles
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-subtitles' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Subtitles are burned into the video (hardcoded).') : '';
    return notice +
      '<div class="tg-opt-row"><label class="tg-opt-label">Subtitle Source</label>' +
        '<select id="vsub-source" class="tg-select">' +
          '<option value="upload">Upload SRT file</option>' +
          '<option value="manual">Create manually</option>' +
        '</select>' +
      '</div>' +
      '<div id="vsub-upload-wrap">' +
        '<input type="file" id="vsub-srt" accept=".srt,text/plain" style="margin-top:8px;font-size:13px">' +
      '</div>' +
      '<div id="vsub-manual-wrap" hidden>' +
        '<div style="margin-top:8px">' +
          '<button type="button" id="vsub-add-row" class="tg-btn-secondary" style="font-size:12px">+ Add Subtitle</button>' +
        '</div>' +
        '<div id="vsub-rows" style="margin-top:8px;max-height:200px;overflow-y:auto"></div>' +
      '</div>' +
      '<div style="margin-top:12px"><label class="tg-opt-label" style="display:block;margin-bottom:6px">Style</label>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Font Size</label>' +
          '<select id="vsub-size" class="tg-select">' +
            '<option value="18">Small</option><option value="24" selected>Medium</option><option value="32">Large</option>' +
          '</select>' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Color</label>' +
          '<select id="vsub-color" class="tg-select">' +
            '<option value="white" selected>White</option><option value="yellow">Yellow</option><option value="black">Black</option>' +
          '</select>' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Position</label>' +
          '<select id="vsub-pos" class="tg-select">' +
            '<option value="bottom" selected>Bottom</option><option value="top">Top</option>' +
          '</select>' +
        '</div>' +
      '</div>';
  }

  function wireOptions(container) {
    var src = container.querySelector('#vsub-source');
    var uw = container.querySelector('#vsub-upload-wrap');
    var mw = container.querySelector('#vsub-manual-wrap');
    if (src) {
      src.addEventListener('change', function () {
        if (uw) uw.hidden = src.value !== 'upload';
        if (mw) mw.hidden = src.value !== 'manual';
      });
    }
    var rowCount = 0;
    var addBtn = container.querySelector('#vsub-add-row');
    var rowsEl = container.querySelector('#vsub-rows');
    if (addBtn && rowsEl) {
      addBtn.addEventListener('click', function () {
        if (rowCount >= 50) return;
        rowCount++;
        var div = document.createElement('div');
        div.style.cssText = 'display:flex;gap:4px;align-items:center;margin-bottom:4px';
        div.innerHTML =
          '<input type="text" class="tg-text-input vsub-start" placeholder="0:01" style="width:65px">' +
          '<input type="text" class="tg-text-input vsub-end" placeholder="0:04" style="width:65px">' +
          '<input type="text" class="tg-text-input vsub-text" placeholder="Subtitle text" style="flex:1">' +
          '<button type="button" class="vsub-del" style="background:none;border:none;cursor:pointer;color:#e53935;font-size:14px">&#x2715;</button>';
        div.querySelector('.vsub-del').addEventListener('click', function () { div.remove(); });
        rowsEl.appendChild(div);
      });
    }
  }

  function padTime(n) { return String(n).padStart(2, '0'); }

  function secToSRT(s) {
    var ms = Math.round((s % 1) * 1000);
    var sec = Math.floor(s);
    var h = Math.floor(sec / 3600); sec %= 3600;
    var m = Math.floor(sec / 60); sec %= 60;
    return padTime(h) + ':' + padTime(m) + ':' + padTime(sec) + ',' + String(ms).padStart(3, '0');
  }

  function getOptions(el) {
    if (!el) return {};
    var src = el.querySelector('#vsub-source');
    var srt = el.querySelector('#vsub-srt');
    var size = el.querySelector('#vsub-size');
    var color = el.querySelector('#vsub-color');
    var pos = el.querySelector('#vsub-pos');
    var rows = [];
    el.querySelectorAll('#vsub-rows > div').forEach(function (row) {
      var st = row.querySelector('.vsub-start');
      var en = row.querySelector('.vsub-end');
      var tx = row.querySelector('.vsub-text');
      if (tx && tx.value.trim()) {
        rows.push({ start: st ? st.value : '0:00', end: en ? en.value : '0:05', text: tx.value });
      }
    });
    return {
      source: src ? src.value : 'upload',
      srtFile: srt && srt.files[0] ? srt.files[0] : null,
      rows: rows,
      fontSize: size ? size.value : '24',
      color: color ? color.value : 'white',
      position: pos ? pos.value : 'bottom',
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var srtContent = '';
    if (options.source === 'upload' && options.srtFile) {
      srtContent = await options.srtFile.text();
    } else if (options.source === 'manual' && options.rows.length > 0) {
      options.rows.forEach(function (row, i) {
        srtContent += (i + 1) + '\n';
        srtContent += secToSRT(U.parseTime(row.start)) + ' --> ' + secToSRT(U.parseTime(row.end)) + '\n';
        srtContent += row.text + '\n\n';
      });
    } else {
      throw new Error('Please provide subtitles (upload an SRT file or add manual entries).');
    }

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);
      U.writeText(ffmpeg, 'subtitles.srt', srtContent);

      /* libass has no system fonts in wasm — load one and point the
         subtitles filter at it. */
      await U.loadFont(ffmpeg, onProgress);

      var colorMap = { white: '&Hffffff', yellow: '&H00ffff', black: '&H000000' };
      var colorCode = colorMap[options.color] || '&Hffffff';
      var alignment = options.position === 'top' ? 'Alignment=6' : 'Alignment=2';
      var forceStyle = 'FontName=' + U.FONT_NAME + ',FontSize=' + options.fontSize + ',PrimaryColour=' + colorCode + ',' + alignment;
      var vf = "subtitles=subtitles.srt:fontsdir=/:force_style='" + forceStyle + "'";

      onProgress && onProgress(0.15, 'Burning in subtitles...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', vf, '-c:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-subtitled.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName, 'subtitles.srt']);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

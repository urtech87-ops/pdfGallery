/**
 * ToolsGallery — Add Subtitles to Video
 * Handler: vid-subtitles
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-subtitles' };
  var _ffmpeg = null, _loaded = false;
  var _subtitleRows = [];

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Subtitles are burned into the video (hardcoded). Processing may take a few minutes.</div>';

  function getOptionsHTML() {
    return NOTICE +
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
      '</div>' +
      '<script>(function(){' +
        'var src=document.getElementById("vsub-source");' +
        'var uw=document.getElementById("vsub-upload-wrap");' +
        'var mw=document.getElementById("vsub-manual-wrap");' +
        'if(src)src.addEventListener("change",function(){uw.hidden=src.value!=="upload";mw.hidden=src.value!=="manual";});' +
        'var rowCount=0;' +
        'var addBtn=document.getElementById("vsub-add-row");' +
        'var rowsEl=document.getElementById("vsub-rows");' +
        'if(addBtn)addBtn.addEventListener("click",function(){' +
          'if(rowCount>=50)return;rowCount++;' +
          'var id="vsub-row-"+rowCount;' +
          'var div=document.createElement("div");div.id=id;' +
          'div.style.cssText="display:flex;gap:4px;align-items:center;margin-bottom:4px";' +
          'div.innerHTML=\'<input type="text" class="tg-text-input vsub-start" placeholder="0:01" style="width:65px"><input type="text" class="tg-text-input vsub-end" placeholder="0:04" style="width:65px"><input type="text" class="tg-text-input vsub-text" placeholder="Subtitle text" style="flex:1"><button type="button" style="background:none;border:none;cursor:pointer;color:#e53935;font-size:14px" onclick="this.parentNode.remove()">&#x2715;</button>\';' +
          'if(rowsEl)rowsEl.appendChild(div);' +
        '});' +
      '})();<\/script>';
  }

  function padTime(n) { return String(n).padStart(2, '0'); }

  function secToSRT(s) {
    var ms = Math.round((s % 1) * 1000);
    var sec = Math.floor(s);
    var h = Math.floor(sec / 3600); sec %= 3600;
    var m = Math.floor(sec / 60); sec %= 60;
    return padTime(h) + ':' + padTime(m) + ':' + padTime(sec) + ',' + String(ms).padStart(3, '0');
  }

  function parseMMSS(s) {
    var p = s.split(':');
    return p.length === 2 ? parseInt(p[0]) * 60 + parseInt(p[1]) : parseInt(s) || 0;
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

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Adding subtitles... ' + Math.round(e.progress * 100) + '%');
    });
    onProgress && onProgress(5, 'Loading processor...');
    var base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await _ffmpeg.load({
      coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm'),
    });
    _loaded = true;
  }

  async function run(file, options, onProgress) {
    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    var srtContent = '';
    if (options.source === 'upload' && options.srtFile) {
      srtContent = await options.srtFile.text();
    } else if (options.source === 'manual' && options.rows.length > 0) {
      options.rows.forEach(function (row, i) {
        srtContent += (i + 1) + '\n';
        srtContent += secToSRT(parseMMSS(row.start)) + ' --> ' + secToSRT(parseMMSS(row.end)) + '\n';
        srtContent += row.text + '\n\n';
      });
    } else {
      throw new Error('Please provide subtitles (upload SRT or add manual entries).');
    }

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));
    var enc = new TextEncoder();
    await _ffmpeg.writeFile('subtitles.srt', enc.encode(srtContent));

    var colorMap = { white: '&Hffffff', yellow: '&H00ffff', black: '&H000000' };
    var colorCode = colorMap[options.color] || '&Hffffff';
    var alignment = options.position === 'top' ? 'Alignment=6' : 'Alignment=2';
    var forceStyle = 'FontSize=' + options.fontSize + ',PrimaryColour=' + colorCode + ',' + alignment;

    onProgress && onProgress(20, 'Burning in subtitles...');
    await _ffmpeg.exec(['-i', inName, '-vf', 'subtitles=subtitles.srt:force_style=\'' + forceStyle + '\'', '-c:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'subtitled.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

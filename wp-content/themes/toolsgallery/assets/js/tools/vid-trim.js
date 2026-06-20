/**
 * ToolsGallery — Trim Video
 * Handler: vid-trim
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-trim' };
  var _ffmpeg = null, _loaded = false;
  var _duration = 0;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Trim runs in your browser. Fast trim (stream copy) is near-instant. Precise trim re-encodes and takes longer.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div id="vt-preview-wrap" style="margin-bottom:12px">' +
        '<video id="vt-preview" style="max-width:100%;border-radius:6px;background:#000" controls></video>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Start Time</label>' +
        '<input type="text" id="vt-start" class="tg-text-input" placeholder="0:00" value="0:00" style="width:80px">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">End Time</label>' +
        '<input type="text" id="vt-end" class="tg-text-input" placeholder="0:30" value="0:30" style="width:80px">' +
      '</div>' +
      '<div id="vt-dur-info" style="font-size:12px;color:#666;margin-top:4px"></div>' +
      '<div class="tg-opt-row" style="margin-top:8px"><label class="tg-opt-label">Trim Mode</label>' +
        '<select id="vt-mode" class="tg-select">' +
          '<option value="fast">Fast trim (recommended)</option>' +
          '<option value="precise">Precise trim (re-encodes, slower)</option>' +
        '</select>' +
      '</div>' +
      '<script>(function(){' +
        'function parseMMSS(s){var p=s.split(":");return p.length===2?parseInt(p[0])*60+parseInt(p[1]):parseInt(s)||0;}' +
        'function update(){' +
          'var st=document.getElementById("vt-start"),en=document.getElementById("vt-end"),di=document.getElementById("vt-dur-info");' +
          'if(st&&en&&di){var d=parseMMSS(en.value)-parseMMSS(st.value);di.textContent=d>0?"Trimmed duration: "+d+" seconds":"";} ' +
        '}' +
        'var s=document.getElementById("vt-start"),e=document.getElementById("vt-end");' +
        'if(s)s.addEventListener("input",update);if(e)e.addEventListener("input",update);' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    var st = el.querySelector('#vt-start');
    var en = el.querySelector('#vt-end');
    var mode = el.querySelector('#vt-mode');
    return {
      start: st ? st.value : '0:00',
      end: en ? en.value : '0:30',
      mode: mode ? mode.value : 'fast',
    };
  }

  function parseMMSS(s) {
    var p = s.split(':');
    return p.length === 2 ? parseInt(p[0]) * 60 + parseInt(p[1]) : parseInt(s) || 0;
  }

  function toHHMMSS(secs) {
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    return (h ? String(h).padStart(2,'0') + ':' : '') + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Trimming... ' + Math.round(e.progress * 100) + '%');
    });
    onProgress && onProgress(5, 'Loading processor...');
    var base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await _ffmpeg.load({
      coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm'),
    });
    _loaded = true;
  }

  // Load video preview when file is selected
  var _origOnFileReady = null;
  function onFileAttached(file) {
    var preview = document.getElementById('vt-preview');
    if (!preview) return;
    var url = URL.createObjectURL(file);
    preview.src = url;
    preview.onloadedmetadata = function () {
      _duration = Math.floor(preview.duration);
      var endEl = document.getElementById('vt-end');
      if (endEl) endEl.value = toHHMMSS(_duration);
      var di = document.getElementById('vt-dur-info');
      if (di) di.textContent = 'Video duration: ' + toHHMMSS(_duration);
    };
  }

  async function run(file, options, onProgress) {
    var startSec = parseMMSS(options.start || '0:00');
    var endSec = parseMMSS(options.end || '0:30');
    if (endSec <= startSec) throw new Error('End time must be after start time.');

    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onFileAttached(file);

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var codec = options.mode === 'precise' ? ['-c:v', 'libx264', '-c:a', 'aac'] : ['-c', 'copy'];
    var args = ['-i', inName, '-ss', toHHMMSS(startSec), '-to', toHHMMSS(endSec)].concat(codec).concat(['output.mp4']);

    onProgress && onProgress(20, 'Trimming video...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'trimmed.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

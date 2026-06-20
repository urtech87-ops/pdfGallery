/**
 * ToolsGallery — Video to Audio
 * Handler: vid-to-mp3
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-to-mp3' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Audio extraction runs in your browser. First load ~30MB. Do not close this tab.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div class="tg-opt-row"><label class="tg-opt-label">Output Format</label>' +
        '<select id="v2a-fmt" class="tg-select">' +
          '<option value="mp3">MP3</option><option value="aac">AAC</option>' +
          '<option value="wav">WAV</option><option value="ogg">OGG</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Quality</label>' +
        '<select id="v2a-q" class="tg-select">' +
          '<option value="320k">High (320kbps)</option>' +
          '<option value="192k" selected>Standard (192kbps)</option>' +
          '<option value="128k">Low (128kbps)</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Extract Section</label>' +
        '<select id="v2a-section" class="tg-select">' +
          '<option value="full">Full audio</option>' +
          '<option value="custom">Custom range</option>' +
        '</select>' +
      '</div>' +
      '<div id="v2a-range" hidden style="margin-top:8px">' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Start (MM:SS)</label>' +
          '<input type="text" id="v2a-start" class="tg-text-input" placeholder="0:00" value="0:00">' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">End (MM:SS)</label>' +
          '<input type="text" id="v2a-end" class="tg-text-input" placeholder="1:00" value="1:00">' +
        '</div>' +
      '</div>' +
      '<script>(function(){' +
        'var s=document.getElementById("v2a-section"),r=document.getElementById("v2a-range");' +
        'if(s&&r)s.addEventListener("change",function(){r.hidden=s.value!=="custom";});' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    var fmt = el.querySelector('#v2a-fmt');
    var q = el.querySelector('#v2a-q');
    var sec = el.querySelector('#v2a-section');
    var st = el.querySelector('#v2a-start');
    var en = el.querySelector('#v2a-end');
    return {
      format: fmt ? fmt.value : 'mp3',
      bitrate: q ? q.value : '192k',
      section: sec ? sec.value : 'full',
      start: st ? st.value : '0:00',
      end: en ? en.value : '',
    };
  }

  function parseMMSS(str) {
    var parts = str.split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return parseInt(str) || 0;
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Extracting audio... ' + Math.round(e.progress * 100) + '%');
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

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var fmt = options.format || 'mp3';
    var outName = 'audio.' + fmt;
    var args = ['-i', inName];

    if (options.section === 'custom') {
      args = args.concat(['-ss', String(parseMMSS(options.start)), '-to', String(parseMMSS(options.end))]);
    }

    args = args.concat(['-vn']);

    var codecMap = { mp3: ['-acodec', 'libmp3lame', '-b:a', options.bitrate], aac: ['-acodec', 'aac', '-b:a', options.bitrate], wav: ['-acodec', 'pcm_s16le'], ogg: ['-acodec', 'libvorbis', '-b:a', options.bitrate] };
    args = args.concat(codecMap[fmt] || ['-acodec', 'libmp3lame', '-b:a', '192k']);
    args.push(outName);

    onProgress && onProgress(20, 'Extracting audio...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var mimes = { mp3: 'audio/mpeg', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg' };
    var data = await _ffmpeg.readFile(outName);
    var blob = new Blob([data.buffer], { type: mimes[fmt] || 'audio/mpeg' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: outName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

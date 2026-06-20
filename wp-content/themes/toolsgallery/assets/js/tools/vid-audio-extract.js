/**
 * ToolsGallery — Audio Extractor (Advanced)
 * Handler: vid-audio-extract
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-audio-extract' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Audio extraction runs in your browser. WAV and FLAC files may be large.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div class="tg-opt-row"><label class="tg-opt-label">Output Format</label>' +
        '<select id="vae-fmt" class="tg-select">' +
          '<option value="mp3">MP3</option><option value="wav">WAV (lossless)</option>' +
          '<option value="aac">AAC</option><option value="flac">FLAC (lossless)</option>' +
          '<option value="ogg">OGG Vorbis</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Normalize Audio</label>' +
        '<select id="vae-norm" class="tg-select">' +
          '<option value="no">No (keep original levels)</option>' +
          '<option value="yes">Yes (loudnorm filter)</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Trim</label>' +
        '<select id="vae-trim" class="tg-select">' +
          '<option value="full">Full audio</option>' +
          '<option value="custom">Custom range</option>' +
        '</select>' +
      '</div>' +
      '<div id="vae-range" hidden style="margin-top:8px">' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Start (MM:SS)</label>' +
          '<input type="text" id="vae-start" class="tg-text-input" placeholder="0:00" value="0:00" style="width:80px">' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">End (MM:SS)</label>' +
          '<input type="text" id="vae-end" class="tg-text-input" placeholder="1:00" value="1:00" style="width:80px">' +
        '</div>' +
      '</div>' +
      '<script>(function(){' +
        'var t=document.getElementById("vae-trim"),r=document.getElementById("vae-range");' +
        'if(t&&r)t.addEventListener("change",function(){r.hidden=t.value!=="custom";});' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    return {
      format: (el.querySelector('#vae-fmt') || {}).value || 'mp3',
      normalize: (el.querySelector('#vae-norm') || {}).value || 'no',
      trim: (el.querySelector('#vae-trim') || {}).value || 'full',
      start: (el.querySelector('#vae-start') || {}).value || '0:00',
      end: (el.querySelector('#vae-end') || {}).value || '',
    };
  }

  function parseMMSS(s) {
    var p = s.split(':');
    return p.length === 2 ? parseInt(p[0]) * 60 + parseInt(p[1]) : parseInt(s) || 0;
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Extracting... ' + Math.round(e.progress * 100) + '%');
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
    var outName = 'extracted-audio.' + fmt;
    var args = ['-i', inName];

    if (options.trim === 'custom') {
      args = args.concat(['-ss', String(parseMMSS(options.start)), '-to', String(parseMMSS(options.end))]);
    }

    args = args.concat(['-vn']);

    var audioFilter = options.normalize === 'yes' ? ['-af', 'loudnorm'] : [];
    var codecMap = {
      mp3: ['-acodec', 'libmp3lame', '-q:a', '2'],
      wav: ['-acodec', 'pcm_s16le'],
      aac: ['-acodec', 'aac', '-b:a', '192k'],
      flac: ['-acodec', 'flac'],
      ogg: ['-acodec', 'libvorbis', '-q:a', '5'],
    };
    args = args.concat(audioFilter).concat(codecMap[fmt] || ['-acodec', 'libmp3lame']);
    args.push(outName);

    onProgress && onProgress(20, 'Extracting audio...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var mimes = { mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', flac: 'audio/flac', ogg: 'audio/ogg' };
    var data = await _ffmpeg.readFile(outName);
    var blob = new Blob([data.buffer], { type: mimes[fmt] || 'audio/mpeg' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: outName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

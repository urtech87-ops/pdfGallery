/**
 * ToolsGallery — Change Video Speed
 * Handler: vid-speed
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-speed' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Speed change re-encodes the video. Processing time depends on file size and speed factor.</div>';

  function getOptionsHTML() {
    var presets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
    var btnHtml = presets.map(function (s) {
      return '<button type="button" class="vs-preset" data-vs="' + s + '" style="padding:8px 12px;border:2px solid #ddd;background:#fff;border-radius:6px;cursor:pointer;font-size:13px' + (s === 1 ? ';border-color:#4a90e2;background:#e8f0fe' : '') + '">' + s + 'x</button>';
    }).join('');
    return NOTICE +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' + btnHtml + '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Custom Speed</label>' +
        '<input type="range" id="vs-speed" min="0.1" max="10" step="0.1" value="1" style="flex:1">' +
        '<span id="vs-speed-val" style="margin-left:8px;min-width:32px;font-size:13px">1x</span>' +
      '</div>' +
      '<div id="vs-dur-info" style="font-size:12px;color:#666;margin-top:4px"></div>' +
      '<div class="tg-opt-row" style="margin-top:8px"><label class="tg-opt-label">Audio</label>' +
        '<select id="vs-audio" class="tg-select">' +
          '<option value="keep">Keep audio (pitch-corrected)</option>' +
          '<option value="remove">Remove audio</option>' +
          '<option value="pitch">Keep audio (with pitch change)</option>' +
        '</select>' +
      '</div>' +
      '<input type="hidden" id="vs-speed-val-h" value="1">' +
      '<script>(function(){' +
        'var slider=document.getElementById("vs-speed"),label=document.getElementById("vs-speed-val"),hidden=document.getElementById("vs-speed-val-h");' +
        'function setSpeed(s){' +
          'slider.value=s;label.textContent=s+"x";hidden.value=s;' +
          'document.querySelectorAll(".vs-preset").forEach(function(b){b.style.borderColor="#ddd";b.style.background="#fff";});' +
        '}' +
        'slider.addEventListener("input",function(){setSpeed(slider.value);});' +
        'document.querySelectorAll(".vs-preset").forEach(function(b){' +
          'b.addEventListener("click",function(){setSpeed(b.dataset.vs);b.style.borderColor="#4a90e2";b.style.background="#e8f0fe";});' +
        '});' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    var s = el.querySelector('#vs-speed-val-h');
    var a = el.querySelector('#vs-audio');
    return { speed: s ? parseFloat(s.value) : 1, audio: a ? a.value : 'keep' };
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Adjusting speed... ' + Math.round(e.progress * 100) + '%');
    });
    onProgress && onProgress(5, 'Loading processor...');
    var base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await _ffmpeg.load({
      coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm'),
    });
    _loaded = true;
  }

  function buildAtempoChain(speed) {
    // atempo must be between 0.5 and 100
    var filters = [];
    var remaining = speed;
    while (remaining > 2.0) { filters.push('atempo=2.0'); remaining /= 2.0; }
    while (remaining < 0.5) { filters.push('atempo=0.5'); remaining /= 0.5; }
    filters.push('atempo=' + remaining.toFixed(4));
    return filters.join(',');
  }

  async function run(file, options, onProgress) {
    var speed = options.speed || 1;
    if (speed < 0.1) throw new Error('Minimum speed is 0.1x.');
    if (speed === 1) throw new Error('Speed is already 1x. Please select a different speed.');

    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var pts = (1 / speed).toFixed(4);
    var args = ['-i', inName];

    if (options.audio === 'remove') {
      args = args.concat(['-filter:v', 'setpts=' + pts + '*PTS', '-an']);
    } else if (options.audio === 'pitch') {
      args = args.concat(['-filter_complex', '[0:v]setpts=' + pts + '*PTS[v];[0:a]asetrate=44100*' + speed + ',aresample=44100[a]', '-map', '[v]', '-map', '[a]']);
    } else {
      var atempo = buildAtempoChain(speed);
      args = args.concat(['-filter_complex', '[0:v]setpts=' + pts + '*PTS[v];[0:a]' + atempo + '[a]', '-map', '[v]', '-map', '[a]']);
    }
    args.push('output.mp4');

    onProgress && onProgress(20, 'Adjusting video speed...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'speed-adjusted.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

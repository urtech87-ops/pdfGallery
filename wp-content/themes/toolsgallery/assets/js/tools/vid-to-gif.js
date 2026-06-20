/**
 * ToolsGallery — Video to GIF
 * Handler: vid-to-gif
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-to-gif' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; GIF creation uses a 2-pass palette method for best quality. Keep clips short (&le;10s) for reasonable file sizes.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div class="tg-opt-row"><label class="tg-opt-label">Start (MM:SS)</label>' +
        '<input type="text" id="vtg-start" class="tg-text-input" placeholder="0:00" value="0:00" style="width:80px">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Duration (seconds)</label>' +
        '<input type="range" id="vtg-dur" min="1" max="30" value="5" style="flex:1">' +
        '<span id="vtg-dur-val" style="margin-left:8px;font-size:13px">5s</span>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Width</label>' +
        '<select id="vtg-width" class="tg-select">' +
          '<option value="240">240px</option><option value="320">320px</option>' +
          '<option value="480" selected>480px</option><option value="640">640px</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Frame Rate</label>' +
        '<select id="vtg-fps" class="tg-select">' +
          '<option value="5">5 fps</option><option value="10" selected>10 fps</option>' +
          '<option value="15">15 fps</option><option value="20">20 fps</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Loop</label>' +
        '<select id="vtg-loop" class="tg-select">' +
          '<option value="0">Forever</option><option value="1">Once</option><option value="3">3 times</option>' +
        '</select>' +
      '</div>' +
      '<div id="vtg-preview" style="margin-top:12px"></div>' +
      '<script>(function(){' +
        'var d=document.getElementById("vtg-dur"),v=document.getElementById("vtg-dur-val");' +
        'if(d&&v)d.addEventListener("input",function(){v.textContent=d.value+"s";});' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    var st = el.querySelector('#vtg-start');
    var dur = el.querySelector('#vtg-dur');
    var w = el.querySelector('#vtg-width');
    var fps = el.querySelector('#vtg-fps');
    var loop = el.querySelector('#vtg-loop');
    return {
      start: st ? st.value : '0:00',
      duration: dur ? dur.value : '5',
      width: w ? w.value : '480',
      fps: fps ? fps.value : '10',
      loop: loop ? loop.value : '0',
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
      onProgress && onProgress(20 + Math.round(e.progress * 60), 'Creating GIF... ' + Math.round(e.progress * 100) + '%');
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

    var startSec = parseMMSS(options.start || '0:00');
    var dur = options.duration || '5';
    var fps = options.fps || '10';
    var width = options.width || '480';
    var loop = options.loop || '0';

    onProgress && onProgress(20, 'Generating palette...');
    await _ffmpeg.exec(['-i', inName, '-ss', String(startSec), '-t', dur,
      '-vf', 'fps=' + fps + ',scale=' + width + ':-1:flags=lanczos,palettegen', 'palette.png']);

    onProgress && onProgress(55, 'Creating GIF...');
    await _ffmpeg.exec(['-i', inName, '-i', 'palette.png',
      '-ss', String(startSec), '-t', dur,
      '-filter_complex', 'fps=' + fps + ',scale=' + width + ':-1:flags=lanczos[x];[x][1:v]paletteuse',
      '-loop', loop, 'output.gif']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.gif');
    var blob = new Blob([data.buffer], { type: 'image/gif' });

    // Show preview
    var previewEl = document.getElementById('vtg-preview');
    if (previewEl) {
      var url = URL.createObjectURL(blob);
      var sizeWarn = blob.size > 10485760 ? '<p style="color:#e53935;font-size:12px">&#9888; GIF is ' + (blob.size/1048576).toFixed(1) + 'MB. Consider reducing duration or width.</p>' : '';
      previewEl.innerHTML = '<img src="' + url + '" style="max-width:100%;border-radius:6px" alt="GIF preview">' + sizeWarn;
    }

    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'animation.gif' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Video Compressor
 * Handler: vid-compress
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-compress' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Video processing runs in your browser using WebAssembly. ' +
    'First load downloads ~30MB. Large files (>100MB) may take several minutes. ' +
    'Do not close this tab while processing.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Quality Preset</label>' +
        '<select id="vc-quality" class="tg-select">' +
          '<option value="28">Web (smaller file, good quality)</option>' +
          '<option value="23" selected>Balanced (recommended)</option>' +
          '<option value="18">High Quality (larger file)</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Resolution</label>' +
        '<select id="vc-res" class="tg-select">' +
          '<option value="">Keep original</option>' +
          '<option value="1920:1080">1080p</option>' +
          '<option value="1280:720">720p</option>' +
          '<option value="854:480">480p</option>' +
          '<option value="640:360">360p</option>' +
        '</select>' +
      '</div>' +
      '<div id="vc-size-info" style="margin-top:8px;font-size:12px;color:#666"></div>';
  }

  function getOptions(el) {
    if (!el) return {};
    var q = el.querySelector('#vc-quality');
    var r = el.querySelector('#vc-res');
    return {
      crf: q ? q.value : '23',
      res: r ? r.value : '',
    };
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded. Please refresh the page.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Compressing... ' + Math.round(e.progress * 100) + '%');
    });
    onProgress && onProgress(5, 'Loading video processor (first load ~30s)...');
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

    if (file.size > 524288000) {
      var proceed = confirm('This file is ' + (file.size / 1048576).toFixed(0) + 'MB. Processing may take a very long time. Continue?');
      if (!proceed) throw new Error('Cancelled by user.');
    }

    onProgress && onProgress(3, 'Loading video processor...');
    await loadFFmpeg(onProgress);

    onProgress && onProgress(15, 'Reading video file...');
    await _ffmpeg.writeFile('input.mp4', await fetchFile(file));

    var args = ['-i', 'input.mp4', '-vcodec', 'libx264', '-crf', options.crf || '23', '-preset', 'fast', '-acodec', 'aac', '-b:a', '128k'];
    if (options.res) {
      args = args.concat(['-vf', 'scale=' + options.res + ':force_original_aspect_ratio=decrease']);
    }
    args.push('output.mp4');

    onProgress && onProgress(20, 'Compressing video...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });

    var infoEl = document.getElementById('vc-size-info');
    if (infoEl) {
      var saved = Math.round((1 - blob.size / file.size) * 100);
      infoEl.innerHTML = '<strong>Original:</strong> ' + fmtBytes(file.size) +
        ' &rarr; <strong>Compressed:</strong> ' + fmtBytes(blob.size) +
        ' <span style="color:' + (saved > 0 ? 'green' : '#999') + '">(' + (saved > 0 ? saved + '% smaller' : 'no change') + ')</span>';
    }

    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'compressed.mp4' };
  }

  function fmtBytes(b) {
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Remove Audio from Video
 * Handler: vid-remove-audio
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-remove-audio' };
  var _ffmpeg = null, _loaded = false;

  function getOptionsHTML() {
    return '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
      '&#9889; Audio removal uses stream copy — it\'s very fast (no re-encoding).</div>' +
      '<div id="vra-info" style="font-size:13px;color:#555;padding:8px;background:#f9f9f9;border-radius:4px">' +
        'Upload a video to see its info.' +
      '</div>';
  }

  function getOptions(el) { return {}; }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    var _hasAudio = false;
    _ffmpeg.on('log', function (e) {
      if (e.message && e.message.indexOf('Audio') !== -1) _hasAudio = true;
      console.log('[FFmpeg]', e.message);
    });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Removing audio... ' + Math.round(e.progress * 100) + '%');
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

    // Show file info
    var infoEl = document.getElementById('vra-info');
    if (infoEl) {
      infoEl.innerHTML = '<strong>File:</strong> ' + file.name + ' (' + (file.size / 1048576).toFixed(1) + ' MB)';
    }

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    onProgress && onProgress(20, 'Removing audio track...');
    await _ffmpeg.exec(['-i', inName, '-vcodec', 'copy', '-an', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });

    if (infoEl) {
      infoEl.innerHTML += '<br><strong>Result:</strong> Audio removed. ' + (blob.size / 1048576).toFixed(1) + ' MB';
    }

    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'muted.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

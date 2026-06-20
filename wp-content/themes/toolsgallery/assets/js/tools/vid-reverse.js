/**
 * ToolsGallery — Reverse Video
 * Handler: vid-reverse
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-reverse' };
  var _ffmpeg = null, _loaded = false;

  function getOptionsHTML() {
    return '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
      '&#9889; The reverse filter loads the entire video into memory. Videos over 30 seconds may be slow — consider trimming first.</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Reverse</label>' +
        '<select id="vrev-mode" class="tg-select">' +
          '<option value="both">Video and audio</option>' +
          '<option value="video">Video only</option>' +
          '<option value="audio">Audio only</option>' +
        '</select>' +
      '</div>';
  }

  function getOptions(el) {
    if (!el) return {};
    var m = el.querySelector('#vrev-mode');
    return { mode: m ? m.value : 'both' };
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Reversing... ' + Math.round(e.progress * 100) + '%');
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

    var args = ['-i', inName];
    if (options.mode === 'both') {
      args = args.concat(['-vf', 'reverse', '-af', 'areverse']);
    } else if (options.mode === 'video') {
      args = args.concat(['-vf', 'reverse', '-c:a', 'copy']);
    } else {
      args = args.concat(['-c:v', 'copy', '-af', 'areverse']);
    }
    args.push('output.mp4');

    onProgress && onProgress(20, 'Reversing video...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'reversed.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

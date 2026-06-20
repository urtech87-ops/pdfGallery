/**
 * ToolsGallery — Create Video Loop
 * Handler: vid-loop
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-loop' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Boomerang mode generates a reversed copy before concatenating, which takes extra time.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div class="tg-opt-row"><label class="tg-opt-label">Number of Loops</label>' +
        '<select id="vlo-count" class="tg-select">' +
          '<option value="2">2 times</option><option value="3" selected>3 times</option>' +
          '<option value="5">5 times</option><option value="10">10 times</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Loop Type</label>' +
        '<select id="vlo-type" class="tg-select">' +
          '<option value="standard">Standard loop (repeat)</option>' +
          '<option value="boomerang">Boomerang (forward + reverse)</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Total Duration Limit</label>' +
        '<select id="vlo-limit" class="tg-select">' +
          '<option value="">No limit</option><option value="30">30 seconds</option>' +
          '<option value="60">1 minute</option><option value="300">5 minutes</option>' +
        '</select>' +
      '</div>';
  }

  function getOptions(el) {
    if (!el) return {};
    var count = el.querySelector('#vlo-count');
    var type = el.querySelector('#vlo-type');
    var limit = el.querySelector('#vlo-limit');
    return {
      count: count ? parseInt(count.value) : 3,
      type: type ? type.value : 'standard',
      limit: limit ? limit.value : '',
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
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Creating loop... ' + Math.round(e.progress * 100) + '%');
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

    // Normalize to MP4 first
    onProgress && onProgress(20, 'Preparing video...');
    await _ffmpeg.exec(['-i', inName, '-vcodec', 'libx264', '-acodec', 'aac', '-crf', '23', 'norm.mp4']);

    var count = Math.min(options.count || 3, 10);
    var concatList = '';
    var enc = new TextEncoder();

    if (options.type === 'boomerang') {
      onProgress && onProgress(40, 'Creating reversed copy...');
      await _ffmpeg.exec(['-i', 'norm.mp4', '-vf', 'reverse', '-af', 'areverse', 'rev.mp4']);
      for (var i = 0; i < count; i++) {
        concatList += 'file norm.mp4\nfile rev.mp4\n';
      }
    } else {
      for (var j = 0; j < count; j++) {
        concatList += 'file norm.mp4\n';
      }
    }

    onProgress && onProgress(60, 'Concatenating loops...');
    await _ffmpeg.writeFile('list.txt', enc.encode(concatList));

    var concatArgs = ['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy'];
    if (options.limit) concatArgs = concatArgs.concat(['-t', options.limit]);
    concatArgs.push('output.mp4');
    await _ffmpeg.exec(concatArgs);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'looped.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

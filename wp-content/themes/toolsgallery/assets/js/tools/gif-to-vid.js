/**
 * ToolsGallery — GIF to Video
 * Handler: gif-to-vid
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'gif-to-vid' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Converts GIF to MP4 or WebM in your browser. The resulting video will loop-friendly.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div class="tg-opt-row"><label class="tg-opt-label">Output Format</label>' +
        '<select id="g2v-fmt" class="tg-select">' +
          '<option value="mp4">MP4</option><option value="webm">WebM</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Scale</label>' +
        '<select id="g2v-scale" class="tg-select">' +
          '<option value="1">Original size</option>' +
          '<option value="2">2x larger</option>' +
          '<option value="0.5">Half size</option>' +
        '</select>' +
      '</div>';
  }

  function getOptions(el) {
    if (!el) return {};
    var fmt = el.querySelector('#g2v-fmt');
    var sc = el.querySelector('#g2v-scale');
    return { format: fmt ? fmt.value : 'mp4', scale: sc ? sc.value : '1' };
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Converting... ' + Math.round(e.progress * 100) + '%');
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

    if (!file.name.toLowerCase().endsWith('.gif') && file.type !== 'image/gif') {
      throw new Error('Please upload a GIF file.');
    }

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    onProgress && onProgress(15, 'Reading GIF...');
    await _ffmpeg.writeFile('input.gif', await fetchFile(file));

    var fmt = options.format || 'mp4';
    var outName = 'video.' + fmt;
    var scaleVal = parseFloat(options.scale || '1');
    var scaleFilter = scaleVal === 1 ? 'scale=trunc(iw/2)*2:trunc(ih/2)*2' : 'scale=trunc(iw*' + scaleVal + '/2)*2:trunc(ih*' + scaleVal + '/2)*2';

    var args;
    if (fmt === 'mp4') {
      args = ['-i', 'input.gif', '-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', scaleFilter, outName];
    } else {
      args = ['-i', 'input.gif', '-vcodec', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-vf', scaleFilter, outName];
    }

    onProgress && onProgress(20, 'Converting GIF to video...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var mimes = { mp4: 'video/mp4', webm: 'video/webm' };
    var data = await _ffmpeg.readFile(outName);
    var blob = new Blob([data.buffer], { type: mimes[fmt] || 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: outName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

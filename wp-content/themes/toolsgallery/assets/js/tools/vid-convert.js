/**
 * ToolsGallery — Video Converter
 * Handler: vid-convert
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-convert' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; First load downloads ~30MB of WebAssembly. Do not close this tab while processing.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Output Format</label>' +
        '<select id="vconv-fmt" class="tg-select">' +
          '<option value="mp4">MP4 (H.264)</option>' +
          '<option value="webm">WebM (VP9)</option>' +
          '<option value="avi">AVI</option>' +
          '<option value="mov">MOV</option>' +
          '<option value="gif">GIF</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Quality</label>' +
        '<select id="vconv-q" class="tg-select">' +
          '<option value="high">High</option>' +
          '<option value="medium" selected>Medium</option>' +
          '<option value="low">Low</option>' +
        '</select>' +
      '</div>' +
      '<div id="vconv-gif-opts" hidden style="margin-top:8px">' +
        '<div class="tg-opt-row"><label class="tg-opt-label">GIF FPS</label>' +
          '<select id="vconv-fps" class="tg-select">' +
            '<option value="5">5 fps</option><option value="10" selected>10 fps</option><option value="15">15 fps</option>' +
          '</select>' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">GIF Width</label>' +
          '<select id="vconv-gw" class="tg-select">' +
            '<option value="320">320px</option><option value="480" selected>480px</option><option value="640">640px</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<script>(function(){' +
        'var f=document.getElementById("vconv-fmt"),g=document.getElementById("vconv-gif-opts");' +
        'if(f&&g)f.addEventListener("change",function(){g.hidden=f.value!=="gif";});' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    var fmt = el.querySelector('#vconv-fmt');
    var q = el.querySelector('#vconv-q');
    var fps = el.querySelector('#vconv-fps');
    var gw = el.querySelector('#vconv-gw');
    return {
      format: fmt ? fmt.value : 'mp4',
      quality: q ? q.value : 'medium',
      gifFps: fps ? fps.value : '10',
      gifWidth: gw ? gw.value : '480',
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
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Converting... ' + Math.round(e.progress * 100) + '%');
    });
    onProgress && onProgress(5, 'Loading video processor...');
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

    onProgress && onProgress(3, 'Loading video processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var fmt = options.format || 'mp4';
    var outName = 'converted.' + fmt;
    var args;
    var crfMap = { high: '18', medium: '23', low: '28' };
    var crf = crfMap[options.quality] || '23';

    if (fmt === 'mp4') {
      args = ['-i', inName, '-vcodec', 'libx264', '-crf', crf, '-acodec', 'aac', outName];
    } else if (fmt === 'webm') {
      args = ['-i', inName, '-vcodec', 'libvpx-vp9', '-crf', crf, '-b:v', '0', '-acodec', 'libopus', outName];
    } else if (fmt === 'avi') {
      args = ['-i', inName, '-vcodec', 'mpeg4', '-acodec', 'mp3', outName];
    } else if (fmt === 'mov') {
      args = ['-i', inName, '-vcodec', 'libx264', '-acodec', 'aac', outName];
    } else if (fmt === 'gif') {
      var fps = options.gifFps || '10';
      var gw = options.gifWidth || '480';
      onProgress && onProgress(20, 'Generating palette...');
      await _ffmpeg.exec(['-i', inName, '-vf', 'fps=' + fps + ',scale=' + gw + ':-1:flags=lanczos,palettegen', 'palette.png']);
      onProgress && onProgress(50, 'Creating GIF...');
      await _ffmpeg.exec(['-i', inName, '-i', 'palette.png', '-filter_complex',
        'fps=' + fps + ',scale=' + gw + ':-1:flags=lanczos[x];[x][1:v]paletteuse', '-loop', '0', outName]);
      var data = await _ffmpeg.readFile(outName);
      var blob = new Blob([data.buffer], { type: 'image/gif' });
      onProgress && onProgress(100, 'Done!');
      return { blob: blob, filename: outName };
    } else {
      args = ['-i', inName, outName];
    }

    onProgress && onProgress(20, 'Converting...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var mimes = { mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo', mov: 'video/quicktime', gif: 'image/gif' };
    var data = await _ffmpeg.readFile(outName);
    var blob = new Blob([data.buffer], { type: mimes[fmt] || 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: outName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

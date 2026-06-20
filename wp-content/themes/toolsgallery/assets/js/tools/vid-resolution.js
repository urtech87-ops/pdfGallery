/**
 * ToolsGallery — Video Resolution Changer
 * Handler: vid-resolution
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-resolution' };
  var _ffmpeg = null, _loaded = false;

  var RESOLUTIONS = [
    { label: '8K (7680×4320)', w: 7680, h: 4320 },
    { label: '4K (3840×2160)', w: 3840, h: 2160 },
    { label: '2K (2560×1440)', w: 2560, h: 1440 },
    { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
    { label: 'HD (1280×720)', w: 1280, h: 720 },
    { label: 'SD (854×480)', w: 854, h: 480 },
    { label: '360p (640×360)', w: 640, h: 360 },
    { label: '240p (426×240)', w: 426, h: 240 },
  ];

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Resolution change re-encodes the video. Upscaling cannot add detail beyond what was originally captured.</div>';

  function getOptionsHTML() {
    var opts = RESOLUTIONS.map(function (r) {
      return '<option value="' + r.w + ':' + r.h + '"' + (r.w === 1920 ? ' selected' : '') + '>' + r.label + '</option>';
    }).join('');
    return NOTICE +
      '<div id="vres-info" style="font-size:12px;color:#666;margin-bottom:8px">Upload a video to see current resolution.</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Target Resolution</label>' +
        '<select id="vres-target" class="tg-select">' + opts + '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Aspect Ratio Handling</label>' +
        '<select id="vres-ar" class="tg-select">' +
          '<option value="letterbox" selected>Letterbox (add black bars)</option>' +
          '<option value="crop">Crop to fill</option>' +
          '<option value="stretch">Stretch (may distort)</option>' +
        '</select>' +
      '</div>';
  }

  function getOptions(el) {
    if (!el) return {};
    var target = el.querySelector('#vres-target');
    var ar = el.querySelector('#vres-ar');
    return {
      target: target ? target.value : '1920:1080',
      ar: ar ? ar.value : 'letterbox',
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
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Changing resolution... ' + Math.round(e.progress * 100) + '%');
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

    var parts = (options.target || '1920:1080').split(':');
    var w = parts[0] || '1920';
    var h = parts[1] || '1080';
    var vf;

    if (options.ar === 'letterbox') {
      vf = 'scale=' + w + ':' + h + ':force_original_aspect_ratio=decrease,pad=' + w + ':' + h + ':(ow-iw)/2:(oh-ih)/2:black';
    } else if (options.ar === 'crop') {
      vf = 'scale=' + w + ':' + h + ':force_original_aspect_ratio=increase,crop=' + w + ':' + h;
    } else {
      vf = 'scale=' + w + ':' + h;
    }

    onProgress && onProgress(20, 'Changing resolution...');
    await _ffmpeg.exec(['-i', inName, '-vf', vf, '-c:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'resized.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

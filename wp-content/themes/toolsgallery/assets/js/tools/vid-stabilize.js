/**
 * ToolsGallery — Video Stabilizer
 * Handler: vid-stabilize
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-stabilize' };
  var _ffmpeg = null, _loaded = false;

  function getOptionsHTML() {
    return '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
      '&#9889; Video stabilization requires the vidstab FFmpeg filter. If unavailable in this build, a helpful message will be shown with alternative tools.</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Smoothing Level</label>' +
        '<select id="vstab-smooth" class="tg-select">' +
          '<option value="5">Low</option><option value="10" selected>Medium</option><option value="20">High</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Black Border Handling</label>' +
        '<select id="vstab-crop" class="tg-select">' +
          '<option value="crop" selected>Crop black borders</option>' +
          '<option value="keep">Keep black borders</option>' +
        '</select>' +
      '</div>';
  }

  function getOptions(el) {
    if (!el) return {};
    var s = el.querySelector('#vstab-smooth');
    var c = el.querySelector('#vstab-crop');
    return { smoothing: s ? s.value : '10', crop: c ? c.value : 'crop' };
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 60), 'Stabilizing... ' + Math.round(e.progress * 100) + '%');
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

    onProgress && onProgress(20, 'Step 1/2: Detecting motion...');
    try {
      await _ffmpeg.exec(['-i', inName, '-vf', 'vidstabdetect=stepsize=6:shakiness=8:accuracy=9:result=transforms.trf', '-f', 'null', '-']);
    } catch (e) {
      throw new Error('Video stabilization (vidstab) is not available in this browser build of FFmpeg. ' +
        'For video stabilization, try HandBrake (free desktop app at handbrake.fr) or Adobe Premiere.');
    }

    var cropOpt = options.crop === 'crop' ? ':crop=black' : '';
    var transformFilter = 'vidstabtransform=smoothing=' + (options.smoothing || '10') + ':input=transforms.trf' + cropOpt;
    onProgress && onProgress(60, 'Step 2/2: Applying stabilization...');
    await _ffmpeg.exec(['-i', inName, '-vf', transformFilter, '-c:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'stabilized.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

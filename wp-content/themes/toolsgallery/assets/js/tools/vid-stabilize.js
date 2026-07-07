/**
 * ToolsGallery — Video Stabilizer
 * Handler: vid-stabilize
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-stabilize' };

  var UNAVAILABLE_MSG = 'Video stabilization requires the vidstab FFmpeg filter, ' +
    'which is not included in the browser build of FFmpeg. ' +
    'For video stabilization, try HandBrake (free desktop app at handbrake.fr) or a video editor.';

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Stabilization runs two passes (analyze + transform), so it takes roughly twice as long as other tools. If the vidstab filter is unavailable in this browser build, a helpful message will be shown.') : '';
    return notice +
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

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      onProgress && onProgress(0.15, 'Step 1/2: Detecting motion...');
      try {
        await U.exec(ffmpeg, ['-i', inName, '-vf', 'vidstabdetect=stepsize=6:shakiness=8:accuracy=9:result=transforms.trf', '-f', 'null', '-']);
      } catch (e) {
        throw new Error(UNAVAILABLE_MSG);
      }

      /* ffmpeg.wasm 0.11 run() can resolve even when the filter is
         missing — confirm the analysis file actually exists. */
      try {
        ffmpeg.FS('readFile', 'transforms.trf');
      } catch (e) {
        throw new Error(UNAVAILABLE_MSG);
      }

      var cropOpt = options.crop === 'crop' ? ':crop=black' : '';
      var transformFilter = 'vidstabtransform=smoothing=' + (options.smoothing || '10') + ':input=transforms.trf' + cropOpt + ',unsharp=5:5:0.8:3:3:0.4';
      onProgress && onProgress(0.55, 'Step 2/2: Applying stabilization...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', transformFilter, '-c:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-stabilized.mp4' };
    } catch (e) {
      if (e && e.message === UNAVAILABLE_MSG) throw e;
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName, 'transforms.trf']);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

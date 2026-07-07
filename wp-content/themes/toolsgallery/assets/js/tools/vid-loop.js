/**
 * ToolsGallery — Create Video Loop
 * Handler: vid-loop
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-loop' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Boomerang mode generates a reversed copy before concatenating, which takes extra time.') : '';
    return notice +
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

      /* Normalize to MP4 so concat with stream copy works */
      onProgress && onProgress(0.12, 'Preparing video...');
      await U.exec(ffmpeg, ['-i', inName, '-vcodec', 'libx264', '-acodec', 'aac', '-crf', '23', 'norm.mp4']);

      var count = Math.min(options.count || 3, 10);
      var concatList = '';

      if (options.type === 'boomerang') {
        onProgress && onProgress(0.4, 'Creating reversed copy...');
        await U.exec(ffmpeg, ['-i', 'norm.mp4', '-vf', 'reverse', '-af', 'areverse', 'rev.mp4']);
        /* Silent clips make areverse fail — retry video-only */
        try {
          U.readFile(ffmpeg, 'rev.mp4');
        } catch (e) {
          await U.exec(ffmpeg, ['-i', 'norm.mp4', '-vf', 'reverse', '-an', 'rev.mp4']);
        }
        for (var i = 0; i < count; i++) {
          concatList += 'file norm.mp4\nfile rev.mp4\n';
        }
      } else {
        for (var j = 0; j < count; j++) {
          concatList += 'file norm.mp4\n';
        }
      }

      onProgress && onProgress(0.7, 'Concatenating loops...');
      U.writeText(ffmpeg, 'concat.txt', concatList);

      var concatArgs = ['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy'];
      if (options.limit) concatArgs = concatArgs.concat(['-t', options.limit]);
      concatArgs.push(outName);
      await U.exec(ffmpeg, concatArgs);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-looped.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName, 'norm.mp4', 'rev.mp4', 'concat.txt']);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

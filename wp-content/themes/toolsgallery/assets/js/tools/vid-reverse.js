/**
 * ToolsGallery — Reverse Video
 * Handler: vid-reverse
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-reverse' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('The reverse filter loads the entire video into memory &mdash; videos over 30 seconds may be slow. Consider trimming first.') : '';
    return notice +
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

      var args = ['-i', inName];
      if (options.mode === 'video') {
        args = args.concat(['-vf', 'reverse', '-c:a', 'copy']);
      } else if (options.mode === 'audio') {
        args = args.concat(['-c:v', 'copy', '-af', 'areverse']);
      } else {
        args = args.concat(['-vf', 'reverse', '-af', 'areverse']);
      }
      args.push(outName);

      onProgress && onProgress(0.15, 'Reversing video...');
      await U.exec(ffmpeg, args);

      /* Videos without an audio track make areverse fail — retry
         video-only before giving up. */
      var data;
      try {
        data = U.readFile(ffmpeg, outName);
      } catch (readErr) {
        if (options.mode === 'both') {
          onProgress && onProgress(0.5, 'No audio track found — retrying video only...');
          await U.exec(ffmpeg, ['-i', inName, '-vf', 'reverse', '-an', outName]);
          data = U.readFile(ffmpeg, outName);
        } else {
          throw readErr;
        }
      }

      onProgress && onProgress(0.92, 'Creating output file...');
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-reversed.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

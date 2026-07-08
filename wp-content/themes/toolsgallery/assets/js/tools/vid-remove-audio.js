/**
 * ToolsGallery — Remove Audio from Video
 * Handler: vid-remove-audio
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-remove-audio' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Audio removal uses stream copy &mdash; it is very fast (no re-encoding).') : '';
    return notice +
      '<div id="vra-info" style="font-size:13px;color:#555;padding:8px;background:#f9f9f9;border-radius:4px">' +
        'Upload a video to see its info.' +
      '</div>';
  }

  function getOptions(el) { return {}; }

  function onFileReady(file) {
    var infoEl = document.getElementById('vra-info');
    if (infoEl) {
      infoEl.innerHTML = '<strong>File:</strong> ' + file.name + ' (' + (file.size / 1048576).toFixed(1) + ' MB)';
    }
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    /* Stream copy keeps the source container */
    var inExt = U.getExt(file.name);
    var inName = 'input.' + inExt;
    var outName = 'output.' + inExt;
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      onProgress && onProgress(0.15, 'Removing audio track...');
      await U.exec(ffmpeg, ['-i', inName, '-c:v', 'copy', '-an', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, U.mimeForExt(inExt));

      var infoEl = document.getElementById('vra-info');
      if (infoEl) {
        infoEl.innerHTML = '<strong>File:</strong> ' + file.name + ' (' + (file.size / 1048576).toFixed(1) + ' MB)' +
          '<br><strong>Result:</strong> Audio removed. ' + (blob.size / 1048576).toFixed(1) + ' MB';
      }

      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-muted.' + inExt };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

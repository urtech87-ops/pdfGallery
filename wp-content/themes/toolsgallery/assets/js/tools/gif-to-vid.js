/**
 * ToolsGallery — GIF to Video
 * Handler: gif-to-vid
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'gif-to-vid' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML() : '';
    return notice +
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

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    if (!file.name.toLowerCase().endsWith('.gif') && file.type !== 'image/gif') {
      throw new Error('Please upload a GIF file.');
    }

    var fmt = options.format || 'mp4';
    var inName = 'input.gif';
    var outName = 'output.' + fmt;
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading GIF...');
      await U.writeFile(ffmpeg, inName, file);

      var scaleVal = parseFloat(options.scale || '1');
      var scaleFilter = scaleVal === 1
        ? 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
        : 'scale=trunc(iw*' + scaleVal + '/2)*2:trunc(ih*' + scaleVal + '/2)*2';

      var args;
      if (fmt === 'mp4') {
        args = ['-f', 'gif', '-i', inName, '-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', scaleFilter, outName];
      } else {
        args = ['-f', 'gif', '-i', inName, '-vcodec', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-vf', scaleFilter, outName];
      }

      onProgress && onProgress(0.15, 'Converting GIF to video...');
      await U.exec(ffmpeg, args);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, U.mimeForExt(fmt));
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '.' + fmt };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

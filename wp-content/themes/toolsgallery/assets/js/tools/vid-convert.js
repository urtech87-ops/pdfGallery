/**
 * ToolsGallery — Video Converter
 * Handler: vid-convert
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-convert' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML() : '';
    return notice +
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
      '</div>';
  }

  /* Inline <script> tags never execute in injected HTML — the runner
     calls wireOptions(container) instead. */
  function wireOptions(container) {
    var f = container.querySelector('#vconv-fmt');
    var g = container.querySelector('#vconv-gif-opts');
    if (f && g) f.addEventListener('change', function () { g.hidden = f.value !== 'gif'; });
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

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var fmt = options.format || 'mp4';
    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.' + fmt;
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      var crfMap = { high: '18', medium: '23', low: '28' };
      var crf = crfMap[options.quality] || '23';

      if (fmt === 'gif') {
        var fps = options.gifFps || '10';
        var gw = options.gifWidth || '480';
        onProgress && onProgress(0.15, 'Generating palette...');
        await U.exec(ffmpeg, ['-i', inName, '-vf', 'fps=' + fps + ',scale=' + gw + ':-1:flags=lanczos,palettegen', 'palette.png']);
        onProgress && onProgress(0.5, 'Creating GIF...');
        await U.exec(ffmpeg, ['-i', inName, '-i', 'palette.png', '-filter_complex',
          'fps=' + fps + ',scale=' + gw + ':-1:flags=lanczos[x];[x][1:v]paletteuse', '-loop', '0', outName]);
      } else {
        var args;
        if (fmt === 'mp4') {
          args = ['-i', inName, '-vcodec', 'libx264', '-crf', crf, '-acodec', 'aac', outName];
        } else if (fmt === 'webm') {
          args = ['-i', inName, '-vcodec', 'libvpx-vp9', '-crf', crf, '-b:v', '0', '-acodec', 'libopus', outName];
        } else if (fmt === 'avi') {
          args = ['-i', inName, '-vcodec', 'mpeg4', '-acodec', 'libmp3lame', outName];
        } else if (fmt === 'mov') {
          args = ['-i', inName, '-vcodec', 'libx264', '-crf', crf, '-acodec', 'aac', outName];
        } else {
          args = ['-i', inName, outName];
        }
        onProgress && onProgress(0.15, 'Converting...');
        await U.exec(ffmpeg, args);
      }

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, U.mimeForExt(fmt));
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '.' + fmt };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName, 'palette.png']);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

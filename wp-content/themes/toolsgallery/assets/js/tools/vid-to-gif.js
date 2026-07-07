/**
 * ToolsGallery — Video to GIF
 * Handler: vid-to-gif
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-to-gif' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('GIF creation uses a 2-pass palette method for best quality. Keep clips short (&le;10s) for reasonable file sizes.') : '';
    return notice +
      '<div class="tg-opt-row"><label class="tg-opt-label">Start (MM:SS)</label>' +
        '<input type="text" id="vtg-start" class="tg-text-input" placeholder="0:00" value="0:00" style="width:80px">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Duration (seconds)</label>' +
        '<input type="range" id="vtg-dur" min="1" max="30" value="5" style="flex:1">' +
        '<span id="vtg-dur-val" style="margin-left:8px;font-size:13px">5s</span>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Width</label>' +
        '<select id="vtg-width" class="tg-select">' +
          '<option value="240">240px</option><option value="320">320px</option>' +
          '<option value="480" selected>480px</option><option value="640">640px</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Frame Rate</label>' +
        '<select id="vtg-fps" class="tg-select">' +
          '<option value="5">5 fps</option><option value="10" selected>10 fps</option>' +
          '<option value="15">15 fps</option><option value="20">20 fps</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Loop</label>' +
        '<select id="vtg-loop" class="tg-select">' +
          '<option value="0">Forever</option><option value="1">Once</option><option value="3">3 times</option>' +
        '</select>' +
      '</div>' +
      '<div id="vtg-preview" style="margin-top:12px"></div>';
  }

  function wireOptions(container) {
    var d = container.querySelector('#vtg-dur');
    var v = container.querySelector('#vtg-dur-val');
    if (d && v) d.addEventListener('input', function () { v.textContent = d.value + 's'; });
  }

  function getOptions(el) {
    if (!el) return {};
    var st = el.querySelector('#vtg-start');
    var dur = el.querySelector('#vtg-dur');
    var w = el.querySelector('#vtg-width');
    var fps = el.querySelector('#vtg-fps');
    var loop = el.querySelector('#vtg-loop');
    return {
      start: st ? st.value : '0:00',
      duration: dur ? dur.value : '5',
      width: w ? w.value : '480',
      fps: fps ? fps.value : '10',
      loop: loop ? loop.value : '0',
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.gif';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      var startSec = String(U.parseTime(options.start || '0:00'));
      var dur = options.duration || '5';
      var fps = options.fps || '10';
      var width = options.width || '480';
      var loop = options.loop || '0';

      onProgress && onProgress(0.15, 'Generating palette...');
      await U.exec(ffmpeg, ['-i', inName, '-ss', startSec, '-t', dur,
        '-vf', 'fps=' + fps + ',scale=' + width + ':-1:flags=lanczos,palettegen', 'palette.png']);

      onProgress && onProgress(0.5, 'Creating GIF...');
      await U.exec(ffmpeg, ['-i', inName, '-i', 'palette.png',
        '-ss', startSec, '-t', dur,
        '-filter_complex', 'fps=' + fps + ',scale=' + width + ':-1:flags=lanczos[x];[x][1:v]paletteuse',
        '-loop', loop, outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'image/gif');

      var previewEl = document.getElementById('vtg-preview');
      if (previewEl) {
        var url = URL.createObjectURL(blob);
        var sizeWarn = blob.size > 10485760 ? '<p style="color:#e53935;font-size:12px">&#9888; GIF is ' + (blob.size / 1048576).toFixed(1) + 'MB. Consider reducing duration or width.</p>' : '';
        previewEl.innerHTML = '<img src="' + url + '" style="max-width:100%;border-radius:6px" alt="GIF preview">' + sizeWarn;
      }

      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '.gif' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName, 'palette.png']);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

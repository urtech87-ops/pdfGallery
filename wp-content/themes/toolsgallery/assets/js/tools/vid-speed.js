/**
 * ToolsGallery — Change Video Speed
 * Handler: vid-speed
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-speed' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML() : '';
    var presets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
    var btnHtml = presets.map(function (s) {
      return '<button type="button" class="vs-preset" data-vs="' + s + '" style="padding:8px 12px;border:2px solid #ddd;background:#fff;border-radius:6px;cursor:pointer;font-size:13px' + (s === 1 ? ';border-color:#4a90e2;background:#e8f0fe' : '') + '">' + s + 'x</button>';
    }).join('');
    return notice +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' + btnHtml + '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Custom Speed</label>' +
        '<input type="range" id="vs-speed" min="0.1" max="10" step="0.1" value="1" style="flex:1">' +
        '<span id="vs-speed-val" style="margin-left:8px;min-width:32px;font-size:13px">1x</span>' +
      '</div>' +
      '<div class="tg-opt-row" style="margin-top:8px"><label class="tg-opt-label">Audio</label>' +
        '<select id="vs-audio" class="tg-select">' +
          '<option value="keep">Keep audio (pitch-corrected)</option>' +
          '<option value="remove">Remove audio</option>' +
          '<option value="pitch">Keep audio (with pitch change)</option>' +
        '</select>' +
      '</div>' +
      '<input type="hidden" id="vs-speed-val-h" value="1">';
  }

  function wireOptions(container) {
    var slider = container.querySelector('#vs-speed');
    var label = container.querySelector('#vs-speed-val');
    var hidden = container.querySelector('#vs-speed-val-h');
    if (!slider || !label || !hidden) return;
    function setSpeed(s) {
      slider.value = s;
      label.textContent = s + 'x';
      hidden.value = s;
      container.querySelectorAll('.vs-preset').forEach(function (b) { b.style.borderColor = '#ddd'; b.style.background = '#fff'; });
    }
    slider.addEventListener('input', function () { setSpeed(slider.value); });
    container.querySelectorAll('.vs-preset').forEach(function (b) {
      b.addEventListener('click', function () {
        setSpeed(b.dataset.vs);
        b.style.borderColor = '#4a90e2';
        b.style.background = '#e8f0fe';
      });
    });
  }

  function getOptions(el) {
    if (!el) return {};
    var s = el.querySelector('#vs-speed-val-h');
    var a = el.querySelector('#vs-audio');
    return { speed: s ? parseFloat(s.value) : 1, audio: a ? a.value : 'keep' };
  }

  function buildAtempoChain(speed) {
    /* atempo only accepts 0.5–2.0 per instance, so chain filters */
    var filters = [];
    var remaining = speed;
    while (remaining > 2.0) { filters.push('atempo=2.0'); remaining /= 2.0; }
    while (remaining < 0.5) { filters.push('atempo=0.5'); remaining /= 0.5; }
    filters.push('atempo=' + remaining.toFixed(4));
    return filters.join(',');
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var speed = options.speed || 1;
    if (speed < 0.1) throw new Error('Minimum speed is 0.1x.');
    if (speed === 1) throw new Error('Speed is already 1x. Please select a different speed.');

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      var pts = (1 / speed).toFixed(4);
      var args = ['-i', inName];

      if (options.audio === 'remove') {
        args = args.concat(['-filter:v', 'setpts=' + pts + '*PTS', '-an']);
      } else if (options.audio === 'pitch') {
        args = args.concat(['-filter_complex', '[0:v]setpts=' + pts + '*PTS[v];[0:a]asetrate=44100*' + speed + ',aresample=44100[a]', '-map', '[v]', '-map', '[a]']);
      } else {
        var atempo = buildAtempoChain(speed);
        args = args.concat(['-filter_complex', '[0:v]setpts=' + pts + '*PTS[v];[0:a]' + atempo + '[a]', '-map', '[v]', '-map', '[a]']);
      }
      args.push(outName);

      onProgress && onProgress(0.15, 'Adjusting video speed...');
      await U.exec(ffmpeg, args);

      /* Videos without an audio track make the audio filter graph fail —
         retry video-only before giving up. */
      var data;
      try {
        data = U.readFile(ffmpeg, outName);
      } catch (readErr) {
        if (options.audio !== 'remove') {
          onProgress && onProgress(0.5, 'No audio track found — retrying video only...');
          await U.exec(ffmpeg, ['-i', inName, '-filter:v', 'setpts=' + pts + '*PTS', '-an', outName]);
          data = U.readFile(ffmpeg, outName);
        } else {
          throw readErr;
        }
      }

      onProgress && onProgress(0.92, 'Creating output file...');
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-' + speed + 'x.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Resize Video
 * Handler: vid-resize
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-resize' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML() : '';
    return notice +
      '<div id="vrs-info" style="font-size:12px;color:#666;margin-bottom:8px">Upload a video to see current resolution.</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Resize Mode</label>' +
        '<select id="vrs-mode" class="tg-select">' +
          '<option value="preset">Preset resolution</option>' +
          '<option value="percent">Scale by percentage</option>' +
          '<option value="custom">Custom dimensions</option>' +
        '</select>' +
      '</div>' +
      '<div id="vrs-preset-wrap">' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Resolution</label>' +
          '<select id="vrs-preset" class="tg-select">' +
            '<option value="3840:2160">4K (3840&times;2160)</option>' +
            '<option value="1920:1080" selected>1080p (1920&times;1080)</option>' +
            '<option value="1280:720">720p (1280&times;720)</option>' +
            '<option value="854:480">480p (854&times;480)</option>' +
            '<option value="640:360">360p (640&times;360)</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div id="vrs-percent-wrap" hidden>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Scale</label>' +
          '<select id="vrs-pct" class="tg-select">' +
            '<option value="0.25">25%</option><option value="0.5" selected>50%</option>' +
            '<option value="0.75">75%</option><option value="custom">Custom%</option>' +
          '</select>' +
        '</div>' +
        '<div id="vrs-pct-custom-wrap" hidden>' +
          '<input type="number" id="vrs-pct-val" class="tg-text-input" min="1" max="400" value="50" placeholder="e.g. 50">' +
        '</div>' +
      '</div>' +
      '<div id="vrs-custom-wrap" hidden>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Width (px)</label>' +
          '<input type="number" id="vrs-cw" class="tg-text-input" min="2" max="7680" value="1280">' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Height (px)</label>' +
          '<input type="number" id="vrs-ch" class="tg-text-input" min="2" max="4320" value="720">' +
        '</div>' +
      '</div>';
  }

  function wireOptions(container) {
    var mode = container.querySelector('#vrs-mode');
    var pw = container.querySelector('#vrs-preset-wrap');
    var pc = container.querySelector('#vrs-percent-wrap');
    var cw = container.querySelector('#vrs-custom-wrap');
    if (mode) {
      mode.addEventListener('change', function () {
        if (pw) pw.hidden = mode.value !== 'preset';
        if (pc) pc.hidden = mode.value !== 'percent';
        if (cw) cw.hidden = mode.value !== 'custom';
      });
    }
    var pct = container.querySelector('#vrs-pct');
    var pctCust = container.querySelector('#vrs-pct-custom-wrap');
    if (pct && pctCust) pct.addEventListener('change', function () { pctCust.hidden = pct.value !== 'custom'; });
  }

  function onFileReady(file) {
    var infoEl = document.getElementById('vrs-info');
    if (!infoEl) return;
    var vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = URL.createObjectURL(file);
    vid.onloadedmetadata = function () {
      infoEl.textContent = 'Current resolution: ' + vid.videoWidth + ' × ' + vid.videoHeight + ' px';
      URL.revokeObjectURL(vid.src);
    };
  }

  function getOptions(el) {
    if (!el) return {};
    var mode = el.querySelector('#vrs-mode');
    var preset = el.querySelector('#vrs-preset');
    var pct = el.querySelector('#vrs-pct');
    var pctVal = el.querySelector('#vrs-pct-val');
    var cw = el.querySelector('#vrs-cw');
    var ch = el.querySelector('#vrs-ch');
    return {
      mode: mode ? mode.value : 'preset',
      preset: preset ? preset.value : '1920:1080',
      percent: pct ? (pct.value === 'custom' ? (parseFloat(pctVal && pctVal.value) / 100 || 0.5) : parseFloat(pct.value)) : 0.5,
      customW: cw ? parseInt(cw.value) : 1280,
      customH: ch ? parseInt(ch.value) : 720,
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

      var vf;
      if (options.mode === 'preset') {
        var parts = (options.preset || '1920:1080').split(':');
        var w = parts[0], h = parts[1];
        vf = 'scale=' + w + ':' + h + ':force_original_aspect_ratio=decrease:force_divisible_by=2,pad=' + w + ':' + h + ':(ow-iw)/2:(oh-ih)/2';
      } else if (options.mode === 'percent') {
        var p = options.percent || 0.5;
        vf = 'scale=trunc(iw*' + p + '/2)*2:trunc(ih*' + p + '/2)*2';
      } else {
        /* libx264 needs even dimensions */
        var cw = Math.max(2, (options.customW || 1280) - ((options.customW || 1280) % 2));
        var ch = Math.max(2, (options.customH || 720) - ((options.customH || 720) % 2));
        vf = 'scale=' + cw + ':' + ch;
      }

      onProgress && onProgress(0.15, 'Resizing video...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', vf, '-c:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-resized.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Video Resolution Changer
 * Handler: vid-resolution
 * Preset or custom target resolutions with letterbox / crop / stretch
 * aspect-ratio handling; warns before upscaling.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-resolution' };
  var _srcW = 0, _srcH = 0;

  var RESOLUTIONS = [
    { label: '4K (3840×2160)', w: 3840, h: 2160 },
    { label: '2K (2560×1440)', w: 2560, h: 1440 },
    { label: '1080p (1920×1080)', w: 1920, h: 1080 },
    { label: '720p (1280×720)', w: 1280, h: 720 },
    { label: '480p (854×480)', w: 854, h: 480 },
    { label: '360p (640×360)', w: 640, h: 360 },
    { label: '240p (426×240)', w: 426, h: 240 },
  ];

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Resolution change re-encodes the video.') : '';
    var opts = RESOLUTIONS.map(function (r) {
      return '<option value="' + r.w + 'x' + r.h + '"' + (r.h === 720 ? ' selected' : '') + '>' + r.label + '</option>';
    }).join('') + '<option value="custom">Custom...</option>';
    return notice +
      '<div id="vres-info" style="font-size:12px;color:#666;margin-bottom:8px">Upload a video to see its current resolution.</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Target Resolution</label>' +
        '<select id="vres-target" class="tg-select">' + opts + '</select>' +
      '</div>' +
      '<div id="vres-custom-wrap" hidden>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Width (px)</label>' +
          '<input type="number" id="vres-cw" class="tg-text-input" min="2" max="7680" value="1280" style="width:100px">' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Height (px)</label>' +
          '<input type="number" id="vres-ch" class="tg-text-input" min="2" max="4320" value="720" style="width:100px">' +
        '</div>' +
        '<div class="tg-opt-row"><label><input type="checkbox" id="vres-keep-ar" checked> Maintain aspect ratio (height follows width)</label></div>' +
      '</div>' +
      '<div class="tg-opt-row" id="vres-ar-row"><label class="tg-opt-label">Aspect Ratio Handling</label>' +
        '<select id="vres-ar" class="tg-select">' +
          '<option value="letterbox" selected>Letterbox (add black bars)</option>' +
          '<option value="crop">Crop to fill</option>' +
          '<option value="stretch">Stretch (may distort)</option>' +
        '</select>' +
      '</div>' +
      '<div id="vres-warning" hidden style="font-size:12px;color:#b45309;background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:8px 12px;margin-top:8px">' +
        '&#9888;&#65039; The target is larger than the source — upscaling cannot add detail beyond what was originally captured.' +
      '</div>';
  }

  function targetDims(container) {
    var target = container.querySelector('#vres-target');
    if (target && target.value === 'custom') {
      var cw = container.querySelector('#vres-cw');
      return { w: cw ? parseInt(cw.value, 10) || 1280 : 1280, h: 0 };
    }
    var parts = (target ? target.value : '1280x720').split('x');
    return { w: parseInt(parts[0], 10) || 1280, h: parseInt(parts[1], 10) || 720 };
  }

  function refreshInfo(container) {
    var warning = container.querySelector('#vres-warning');
    var infoEl = container.querySelector('#vres-info');
    var dims = targetDims(container);
    if (infoEl && _srcW) {
      infoEl.textContent = 'Current: ' + _srcW + ' × ' + _srcH + ' px → Target: ' +
        dims.w + (dims.h ? ' × ' + dims.h : ' px wide (height auto)') + (dims.h ? ' px' : '');
    }
    if (warning) warning.hidden = !(_srcW && dims.w > _srcW);
  }

  function wireOptions(container) {
    var target = container.querySelector('#vres-target');
    var customWrap = container.querySelector('#vres-custom-wrap');
    var arRow = container.querySelector('#vres-ar-row');
    var keepAr = container.querySelector('#vres-keep-ar');
    var ch = container.querySelector('#vres-ch');

    function syncCustom() {
      var isCustom = target && target.value === 'custom';
      if (customWrap) customWrap.hidden = !isCustom;
      /* letterbox/crop/stretch only applies to fixed W×H targets */
      if (arRow) arRow.hidden = isCustom && keepAr && keepAr.checked;
      if (ch && keepAr) ch.disabled = keepAr.checked;
      refreshInfo(container);
    }
    if (target) target.addEventListener('change', syncCustom);
    if (keepAr) keepAr.addEventListener('change', syncCustom);
    ['#vres-cw', '#vres-ch'].forEach(function (sel) {
      var el = container.querySelector(sel);
      if (el) el.addEventListener('input', function () { refreshInfo(container); });
    });
    syncCustom();
  }

  function onFileReady(file, optionsEl) {
    _srcW = 0; _srcH = 0;
    var vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = URL.createObjectURL(file);
    vid.onloadedmetadata = function () {
      _srcW = vid.videoWidth; _srcH = vid.videoHeight;
      if (optionsEl) refreshInfo(optionsEl);
      URL.revokeObjectURL(vid.src);
    };
  }

  function even(n) { return Math.max(2, n - (n % 2)); }

  function getOptions(el) {
    if (!el) return {};
    var target = el.querySelector('#vres-target');
    return {
      target: target ? target.value : '1280x720',
      customW: parseInt((el.querySelector('#vres-cw') || {}).value, 10) || 1280,
      customH: parseInt((el.querySelector('#vres-ch') || {}).value, 10) || 720,
      keepAr: !!(el.querySelector('#vres-keep-ar') || {}).checked,
      ar: (el.querySelector('#vres-ar') || {}).value || 'letterbox',
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    var vf, suffix;
    if (options.target === 'custom' && options.keepAr) {
      var cw = even(options.customW);
      vf = 'scale=' + cw + ':-2';
      suffix = cw + 'w';
    } else {
      var w, h;
      if (options.target === 'custom') {
        w = even(options.customW); h = even(options.customH);
      } else {
        var parts = options.target.split('x');
        w = parseInt(parts[0], 10) || 1280; h = parseInt(parts[1], 10) || 720;
      }
      if (options.ar === 'letterbox') {
        vf = 'scale=' + w + ':' + h + ':force_original_aspect_ratio=decrease:force_divisible_by=2,pad=' + w + ':' + h + ':(ow-iw)/2:(oh-ih)/2:black';
      } else if (options.ar === 'crop') {
        vf = 'scale=' + w + ':' + h + ':force_original_aspect_ratio=increase:force_divisible_by=2,crop=' + w + ':' + h;
      } else {
        vf = 'scale=' + w + ':' + h;
      }
      suffix = h + 'p';
    }

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      onProgress && onProgress(0.15, 'Changing resolution...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', vf, '-crf', '23', '-preset', 'fast', '-c:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-' + suffix + '.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

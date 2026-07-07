/**
 * ToolsGallery — Blur Video
 * Handler: vid-blur
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-blur' };
  var _videoW = 0, _videoH = 0;

  var INTENSITY_MAP = { light: '5', medium: '10', heavy: '20' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Blur re-encodes the video.') : '';
    return notice +
      '<div class="tg-opt-row"><label class="tg-opt-label">Blur Type</label>' +
        '<select id="vbl-type" class="tg-select">' +
          '<option value="full">Full video blur</option>' +
          '<option value="region">Blur specific region</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Blur Intensity</label>' +
        '<select id="vbl-intensity" class="tg-select">' +
          '<option value="light">Light</option><option value="medium" selected>Medium</option><option value="heavy">Heavy</option>' +
        '</select>' +
      '</div>' +
      '<div id="vbl-region-wrap" hidden style="margin-top:8px">' +
        '<p style="font-size:12px;color:#666;margin-bottom:6px">Draw the region to blur on the preview:</p>' +
        '<canvas id="vbl-canvas" style="max-width:100%;border:1px solid #ddd;border-radius:4px;cursor:crosshair;display:block"></canvas>' +
        '<div id="vbl-region-info" style="font-size:12px;color:#666;margin-top:4px">No region selected</div>' +
        '<input type="hidden" id="vbl-rx" value="0"><input type="hidden" id="vbl-ry" value="0">' +
        '<input type="hidden" id="vbl-rw" value="0"><input type="hidden" id="vbl-rh" value="0">' +
      '</div>';
  }

  function wireOptions(container) {
    var typeEl = container.querySelector('#vbl-type');
    var regionWrap = container.querySelector('#vbl-region-wrap');
    if (typeEl && regionWrap) {
      typeEl.addEventListener('change', function () { regionWrap.hidden = typeEl.value !== 'region'; });
    }
    var canvas = container.querySelector('#vbl-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dragging = false, sx = 0, sy = 0;
    var rect = { x: 0, y: 0, w: 0, h: 0 };
    canvas.addEventListener('mousedown', function (e) {
      var r = canvas.getBoundingClientRect();
      sx = e.clientX - r.left;
      sy = e.clientY - r.top;
      dragging = true;
    });
    canvas.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var r = canvas.getBoundingClientRect();
      var cx = e.clientX - r.left, cy = e.clientY - r.top;
      rect = { x: Math.min(sx, cx), y: Math.min(sy, cy), w: Math.abs(cx - sx), h: Math.abs(cy - sy) };
      if (container._vblFrame) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(container._vblFrame, 0, 0, canvas.width, canvas.height);
      }
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(229,57,53,0.15)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      if (_videoW && canvas.offsetWidth) {
        var sx2 = _videoW / canvas.offsetWidth, sy2 = _videoH / canvas.offsetHeight;
        container.querySelector('#vbl-rx').value = Math.round(rect.x * sx2);
        container.querySelector('#vbl-ry').value = Math.round(rect.y * sy2);
        container.querySelector('#vbl-rw').value = Math.round(rect.w * sx2);
        container.querySelector('#vbl-rh').value = Math.round(rect.h * sy2);
        var info = container.querySelector('#vbl-region-info');
        if (info) info.textContent = 'Region: ' + Math.round(rect.w * sx2) + 'x' + Math.round(rect.h * sy2) + ' at (' + Math.round(rect.x * sx2) + ',' + Math.round(rect.y * sy2) + ')';
      }
    });
    canvas.addEventListener('mouseup', function () { dragging = false; });
  }

  function onFileReady(file, optionsEl) {
    var canvas = document.getElementById('vbl-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var vid = document.createElement('video');
    vid.src = URL.createObjectURL(file);
    vid.muted = true;
    vid.onloadedmetadata = function () {
      _videoW = vid.videoWidth;
      _videoH = vid.videoHeight;
      vid.currentTime = 0;
    };
    vid.onseeked = function () {
      var maxW = Math.min(vid.videoWidth, 500);
      var scale = maxW / vid.videoWidth;
      canvas.width = maxW;
      canvas.height = Math.round(vid.videoHeight * scale);
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      if (optionsEl) optionsEl._vblFrame = vid;
    };
  }

  function getOptions(el) {
    if (!el) return {};
    return {
      type: (el.querySelector('#vbl-type') || {}).value || 'full',
      intensity: (el.querySelector('#vbl-intensity') || {}).value || 'medium',
      rx: parseInt((el.querySelector('#vbl-rx') || {}).value) || 0,
      ry: parseInt((el.querySelector('#vbl-ry') || {}).value) || 0,
      rw: parseInt((el.querySelector('#vbl-rw') || {}).value) || 0,
      rh: parseInt((el.querySelector('#vbl-rh') || {}).value) || 0,
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    if (options.type === 'region' && (!options.rw || !options.rh)) {
      throw new Error('Please draw the region to blur on the preview first.');
    }

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      var blurVal = INTENSITY_MAP[options.intensity] || '10';
      var vf;
      if (options.type === 'region') {
        vf = 'split[original][copy];[copy]crop=' + options.rw + ':' + options.rh + ':' + options.rx + ':' + options.ry +
          ',boxblur=' + blurVal + '[blurred];[original][blurred]overlay=' + options.rx + ':' + options.ry;
      } else {
        vf = 'boxblur=' + blurVal + ':1';
      }

      onProgress && onProgress(0.15, 'Blurring video...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', vf, '-c:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-blurred.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

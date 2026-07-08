/**
 * ToolsGallery — Crop Video
 * Handler: vid-crop
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-crop' };
  var _videoW = 0, _videoH = 0;

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Drag on the preview to set the crop area, then click the action button to process.') : '';
    return notice +
      '<div id="vc-canvas-wrap" style="position:relative;display:inline-block;user-select:none;margin-bottom:12px">' +
        '<canvas id="vc-canvas" style="max-width:100%;border-radius:6px;cursor:crosshair;display:block"></canvas>' +
        '<canvas id="vc-overlay" style="position:absolute;top:0;left:0;cursor:crosshair"></canvas>' +
      '</div>' +
      '<div id="vc-dims" style="font-size:12px;color:#666;margin-bottom:8px">Upload a video to set crop area.</div>' +
      '<input type="hidden" id="vc-crop-x" value="0">' +
      '<input type="hidden" id="vc-crop-y" value="0">' +
      '<input type="hidden" id="vc-crop-w" value="0">' +
      '<input type="hidden" id="vc-crop-h" value="0">';
  }

  function wireOptions(container) {
    var canvas = container.querySelector('#vc-canvas');
    var overlay = container.querySelector('#vc-overlay');
    if (!canvas || !overlay) return;
    var octx = overlay.getContext('2d');
    var dragging = false, startX = 0, startY = 0;
    var cropRect = { x: 0, y: 0, w: 0, h: 0 };

    function syncOverlay() {
      overlay.width = canvas.offsetWidth;
      overlay.height = canvas.offsetHeight;
      overlay.style.width = canvas.offsetWidth + 'px';
      overlay.style.height = canvas.offsetHeight + 'px';
    }
    container._vcSyncOverlay = syncOverlay;

    function updateHidden() {
      if (!_videoW || !overlay.offsetWidth) return;
      var sx = _videoW / overlay.offsetWidth;
      var sy = _videoH / overlay.offsetHeight;
      container.querySelector('#vc-crop-x').value = Math.round(cropRect.x * sx);
      container.querySelector('#vc-crop-y').value = Math.round(cropRect.y * sy);
      container.querySelector('#vc-crop-w').value = Math.round(cropRect.w * sx);
      container.querySelector('#vc-crop-h').value = Math.round(cropRect.h * sy);
      var dims = container.querySelector('#vc-dims');
      if (dims) dims.textContent = 'Crop: ' + Math.round(cropRect.w * sx) + ' x ' + Math.round(cropRect.h * sy) + ' px';
    }

    overlay.addEventListener('mousedown', function (e) {
      var r = overlay.getBoundingClientRect();
      startX = e.clientX - r.left;
      startY = e.clientY - r.top;
      dragging = true;
    });
    overlay.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var r = overlay.getBoundingClientRect();
      var cx = e.clientX - r.left, cy = e.clientY - r.top;
      cropRect = { x: Math.min(startX, cx), y: Math.min(startY, cy), w: Math.abs(cx - startX), h: Math.abs(cy - startY) };
      octx.clearRect(0, 0, overlay.width, overlay.height);
      octx.fillStyle = 'rgba(0,0,0,0.4)';
      octx.fillRect(0, 0, overlay.width, overlay.height);
      octx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      octx.strokeStyle = '#4a90e2';
      octx.lineWidth = 2;
      octx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      updateHidden();
    });
    overlay.addEventListener('mouseup', function () { dragging = false; });
  }

  function onFileReady(file, optionsEl) {
    var canvas = document.getElementById('vc-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var vid = document.createElement('video');
    vid.src = URL.createObjectURL(file);
    vid.muted = true;
    vid.onloadedmetadata = function () {
      _videoW = vid.videoWidth;
      _videoH = vid.videoHeight;
      var maxW = Math.min(vid.videoWidth, 600);
      var scale = maxW / vid.videoWidth;
      canvas.width = maxW;
      canvas.height = Math.round(vid.videoHeight * scale);
      canvas.style.width = canvas.width + 'px';
      canvas.style.height = canvas.height + 'px';
      vid.currentTime = 0;
    };
    vid.onseeked = function () {
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      if (optionsEl && optionsEl._vcSyncOverlay) optionsEl._vcSyncOverlay();
    };
  }

  function getOptions(el) {
    if (!el) return {};
    return {
      x: parseInt(el.querySelector('#vc-crop-x').value) || 0,
      y: parseInt(el.querySelector('#vc-crop-y').value) || 0,
      w: parseInt(el.querySelector('#vc-crop-w').value) || 0,
      h: parseInt(el.querySelector('#vc-crop-h').value) || 0,
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');
    if (!options.w || !options.h) throw new Error('Please draw a crop area on the preview image first.');

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      /* libx264 needs even dimensions */
      var w = options.w - (options.w % 2);
      var h = options.h - (options.h % 2);
      var cropFilter = 'crop=' + w + ':' + h + ':' + options.x + ':' + options.y;

      onProgress && onProgress(0.15, 'Cropping video...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', cropFilter, '-c:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-cropped.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

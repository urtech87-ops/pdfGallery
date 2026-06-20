/**
 * ToolsGallery — Crop Video
 * Handler: vid-crop
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-crop' };
  var _ffmpeg = null, _loaded = false;
  var _cropData = { x: 0, y: 0, w: 0, h: 0, vw: 0, vh: 0 };

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Drag on the preview to set the crop area, then click the action button to process.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div id="vc-canvas-wrap" style="position:relative;display:inline-block;user-select:none;margin-bottom:12px">' +
        '<canvas id="vc-canvas" style="max-width:100%;border-radius:6px;cursor:crosshair;display:block"></canvas>' +
        '<canvas id="vc-overlay" style="position:absolute;top:0;left:0;cursor:crosshair"></canvas>' +
      '</div>' +
      '<div id="vc-dims" style="font-size:12px;color:#666;margin-bottom:8px">Upload a video to set crop area.</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Aspect Ratio</label>' +
        '<select id="vc-ratio" class="tg-select">' +
          '<option value="free">Free</option><option value="16:9">16:9</option>' +
          '<option value="9:16">9:16</option><option value="1:1">1:1</option><option value="4:3">4:3</option>' +
        '</select>' +
      '</div>' +
      '<input type="hidden" id="vc-crop-x" value="0">' +
      '<input type="hidden" id="vc-crop-y" value="0">' +
      '<input type="hidden" id="vc-crop-w" value="0">' +
      '<input type="hidden" id="vc-crop-h" value="0">' +
      '<script>(function(){' +
        'var canvas=document.getElementById("vc-canvas");' +
        'var overlay=document.getElementById("vc-overlay");' +
        'if(!canvas||!overlay)return;' +
        'var ctx=canvas.getContext("2d");' +
        'var octx=overlay.getContext("2d");' +
        'var dragging=false,startX=0,startY=0,cropRect={x:0,y:0,w:0,h:0};' +
        'function syncOverlay(){overlay.width=canvas.offsetWidth;overlay.height=canvas.offsetHeight;overlay.style.width=canvas.offsetWidth+"px";overlay.style.height=canvas.offsetHeight+"px";}' +
        'overlay.addEventListener("mousedown",function(e){' +
          'var r=overlay.getBoundingClientRect();' +
          'startX=e.clientX-r.left;startY=e.clientY-r.top;dragging=true;' +
        '});' +
        'overlay.addEventListener("mousemove",function(e){' +
          'if(!dragging)return;' +
          'var r=overlay.getBoundingClientRect();' +
          'var cx=e.clientX-r.left,cy=e.clientY-r.top;' +
          'cropRect={x:Math.min(startX,cx),y:Math.min(startY,cy),w:Math.abs(cx-startX),h:Math.abs(cy-startY)};' +
          'octx.clearRect(0,0,overlay.width,overlay.height);' +
          'octx.fillStyle="rgba(0,0,0,0.4)";octx.fillRect(0,0,overlay.width,overlay.height);' +
          'octx.clearRect(cropRect.x,cropRect.y,cropRect.w,cropRect.h);' +
          'octx.strokeStyle="#4a90e2";octx.lineWidth=2;octx.strokeRect(cropRect.x,cropRect.y,cropRect.w,cropRect.h);' +
          'updateHidden();' +
        '});' +
        'overlay.addEventListener("mouseup",function(){dragging=false;});' +
        'function updateHidden(){' +
          'if(!window._vcrVideoW)return;' +
          'var sx=window._vcrVideoW/overlay.offsetWidth;var sy=window._vcrVideoH/overlay.offsetHeight;' +
          'document.getElementById("vc-crop-x").value=Math.round(cropRect.x*sx);' +
          'document.getElementById("vc-crop-y").value=Math.round(cropRect.y*sy);' +
          'document.getElementById("vc-crop-w").value=Math.round(cropRect.w*sx);' +
          'document.getElementById("vc-crop-h").value=Math.round(cropRect.h*sy);' +
          'document.getElementById("vc-dims").textContent="Crop: "+Math.round(cropRect.w*sx)+" x "+Math.round(cropRect.h*sy)+" px";' +
        '}' +
        'window._vcrInitCanvas=function(file){' +
          'var vid=document.createElement("video");' +
          'vid.src=URL.createObjectURL(file);' +
          'vid.onloadedmetadata=function(){' +
            'window._vcrVideoW=vid.videoWidth;window._vcrVideoH=vid.videoHeight;' +
            'var maxW=Math.min(vid.videoWidth,600);var scale=maxW/vid.videoWidth;' +
            'canvas.width=maxW;canvas.height=Math.round(vid.videoHeight*scale);' +
            'canvas.style.width=canvas.width+"px";canvas.style.height=canvas.height+"px";' +
            'syncOverlay();' +
            'vid.currentTime=0;' +
          '};' +
          'vid.onseeked=function(){' +
            'ctx.drawImage(vid,0,0,canvas.width,canvas.height);' +
            'syncOverlay();' +
          '};' +
        '};' +
      '})();<\/script>';
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

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Cropping... ' + Math.round(e.progress * 100) + '%');
    });
    onProgress && onProgress(5, 'Loading processor...');
    var base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await _ffmpeg.load({
      coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm'),
    });
    _loaded = true;
  }

  async function run(file, options, onProgress) {
    if (window._vcrInitCanvas) window._vcrInitCanvas(file);

    if (!options.w || !options.h) throw new Error('Please draw a crop area on the preview image first.');

    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var cropFilter = 'crop=' + options.w + ':' + options.h + ':' + options.x + ':' + options.y;
    onProgress && onProgress(20, 'Cropping video...');
    await _ffmpeg.exec(['-i', inName, '-vf', cropFilter, '-c:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'cropped.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

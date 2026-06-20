/**
 * ToolsGallery — Blur Video
 * Handler: vid-blur
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-blur' };
  var _ffmpeg = null, _loaded = false;
  var _regionData = { x: 0, y: 0, w: 0, h: 0 };

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Blur re-encodes the video. Processing time depends on file size.</div>';

  var INTENSITY_MAP = { light: '5', medium: '10', heavy: '20' };

  function getOptionsHTML() {
    return NOTICE +
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
      '</div>' +
      '<script>(function(){' +
        'var typeEl=document.getElementById("vbl-type");' +
        'var rw=document.getElementById("vbl-region-wrap");' +
        'if(typeEl)typeEl.addEventListener("change",function(){rw.hidden=typeEl.value!=="region";});' +
        'var canvas=document.getElementById("vbl-canvas");' +
        'if(!canvas)return;' +
        'var ctx=canvas.getContext("2d");' +
        'var dragging=false,sx=0,sy=0,rect={x:0,y:0,w:0,h:0};' +
        'canvas.addEventListener("mousedown",function(e){var r=canvas.getBoundingClientRect();sx=e.clientX-r.left;sy=e.clientY-r.top;dragging=true;});' +
        'canvas.addEventListener("mousemove",function(e){' +
          'if(!dragging)return;' +
          'var r=canvas.getBoundingClientRect();var cx=e.clientX-r.left,cy=e.clientY-r.top;' +
          'rect={x:Math.min(sx,cx),y:Math.min(sy,cy),w:Math.abs(cx-sx),h:Math.abs(cy-sy)};' +
          'if(window._vblImg){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(window._vblImg,0,0,canvas.width,canvas.height);}' +
          'ctx.strokeStyle="#e53935";ctx.lineWidth=2;ctx.strokeRect(rect.x,rect.y,rect.w,rect.h);' +
          'ctx.fillStyle="rgba(229,57,53,0.15)";ctx.fillRect(rect.x,rect.y,rect.w,rect.h);' +
          'var sx2=window._vblVideoW/canvas.offsetWidth,sy2=window._vblVideoH/canvas.offsetHeight;' +
          'document.getElementById("vbl-rx").value=Math.round(rect.x*sx2);' +
          'document.getElementById("vbl-ry").value=Math.round(rect.y*sy2);' +
          'document.getElementById("vbl-rw").value=Math.round(rect.w*sx2);' +
          'document.getElementById("vbl-rh").value=Math.round(rect.h*sy2);' +
          'document.getElementById("vbl-region-info").textContent="Region: "+Math.round(rect.w*sx2)+"x"+Math.round(rect.h*sy2)+" at ("+Math.round(rect.x*sx2)+","+Math.round(rect.y*sy2)+")";' +
        '});' +
        'canvas.addEventListener("mouseup",function(){dragging=false;});' +
        'window._vblInitCanvas=function(file){' +
          'var vid=document.createElement("video");vid.src=URL.createObjectURL(file);' +
          'vid.onloadedmetadata=function(){window._vblVideoW=vid.videoWidth;window._vblVideoH=vid.videoHeight;vid.currentTime=0;};' +
          'vid.onseeked=function(){var maxW=Math.min(vid.videoWidth,500);var scale=maxW/vid.videoWidth;canvas.width=maxW;canvas.height=Math.round(vid.videoHeight*scale);ctx.drawImage(vid,0,0,canvas.width,canvas.height);window._vblImg=vid;};' +
        '};' +
      '})();<\/script>';
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

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Blurring... ' + Math.round(e.progress * 100) + '%');
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
    if (window._vblInitCanvas) window._vblInitCanvas(file);

    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var blurVal = INTENSITY_MAP[options.intensity] || '10';
    var vf;
    if (options.type === 'region' && options.rw > 0 && options.rh > 0) {
      vf = 'split[original][copy];[copy]crop=' + options.rw + ':' + options.rh + ':' + options.rx + ':' + options.ry + ',boxblur=' + blurVal + '[blurred];[original][blurred]overlay=' + options.rx + ':' + options.ry;
    } else {
      vf = 'boxblur=' + blurVal + ':1';
    }

    onProgress && onProgress(20, 'Blurring video...');
    await _ffmpeg.exec(['-i', inName, '-vf', vf, '-c:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'blurred.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

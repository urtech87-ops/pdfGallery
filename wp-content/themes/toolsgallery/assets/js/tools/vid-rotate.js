/**
 * ToolsGallery — Rotate Video
 * Handler: vid-rotate
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-rotate' };
  var _ffmpeg = null, _loaded = false;
  var _rotation = '';

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Select a rotation/flip. A live CSS preview shows the result before processing.</div>';

  function getOptionsHTML() {
    var btnStyle = 'padding:10px 16px;border:2px solid #ddd;background:#fff;border-radius:6px;cursor:pointer;font-size:18px;transition:all 0.15s';
    return NOTICE +
      '<div id="vr-preview-wrap" style="margin-bottom:12px;text-align:center">' +
        '<video id="vr-preview" style="max-height:200px;border-radius:6px;background:#000" controls muted></video>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:12px">' +
        '<button type="button" class="vr-btn" data-vr="transpose=2" style="' + btnStyle + '">&#8634; 90&deg; Left</button>' +
        '<button type="button" class="vr-btn" data-vr="transpose=1" style="' + btnStyle + '">&#8635; 90&deg; Right</button>' +
        '<button type="button" class="vr-btn" data-vr="transpose=2,transpose=2" style="' + btnStyle + '">&#8629; 180&deg;</button>' +
        '<button type="button" class="vr-btn" data-vr="hflip" style="' + btnStyle + '">&#8596; Flip H</button>' +
        '<button type="button" class="vr-btn" data-vr="vflip" style="' + btnStyle + '">&#8597; Flip V</button>' +
      '</div>' +
      '<div id="vr-selected" style="text-align:center;font-size:13px;color:#666;margin-bottom:8px">No rotation selected</div>' +
      '<input type="hidden" id="vr-filter" value="">' +
      '<script>(function(){' +
        'var cssMap={"transpose=2":"rotate(-90deg)","transpose=1":"rotate(90deg)","transpose=2,transpose=2":"rotate(180deg)","hflip":"scaleX(-1)","vflip":"scaleY(-1)"};' +
        'var labels={"transpose=2":"90° Left","transpose=1":"90° Right","transpose=2,transpose=2":"180°","hflip":"Flip Horizontal","vflip":"Flip Vertical"};' +
        'document.querySelectorAll(".vr-btn").forEach(function(btn){' +
          'btn.addEventListener("click",function(){' +
            'document.querySelectorAll(".vr-btn").forEach(function(b){b.style.borderColor="#ddd";b.style.background="#fff";});' +
            'btn.style.borderColor="#4a90e2";btn.style.background="#e8f0fe";' +
            'var f=btn.dataset.vr;' +
            'document.getElementById("vr-filter").value=f;' +
            'document.getElementById("vr-selected").textContent="Selected: "+labels[f];' +
            'var v=document.getElementById("vr-preview");' +
            'if(v)v.style.transform=cssMap[f]||"";' +
          '});' +
        '});' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    var f = el.querySelector('#vr-filter');
    return { filter: f ? f.value : '' };
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Rotating... ' + Math.round(e.progress * 100) + '%');
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
    if (!options.filter) throw new Error('Please select a rotation or flip option.');

    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    // Load preview
    var preview = document.getElementById('vr-preview');
    if (preview && !preview.src) {
      preview.src = URL.createObjectURL(file);
    }

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    onProgress && onProgress(20, 'Rotating video...');
    await _ffmpeg.exec(['-i', inName, '-vf', options.filter, '-c:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'rotated.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

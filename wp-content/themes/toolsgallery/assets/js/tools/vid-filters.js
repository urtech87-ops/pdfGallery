/**
 * ToolsGallery — Video Filters
 * Handler: vid-filters
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-filters' };
  var _ffmpeg = null, _loaded = false;

  var FILTERS = [
    { id: 'grayscale', label: 'Grayscale', css: 'grayscale(100%)', ffmpeg: 'hue=s=0' },
    { id: 'sepia', label: 'Sepia', css: 'sepia(100%)', ffmpeg: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131' },
    { id: 'bright', label: 'Brightness +20%', css: 'brightness(120%)', ffmpeg: 'eq=brightness=0.2' },
    { id: 'saturate', label: 'Saturate 2x', css: 'saturate(200%)', ffmpeg: 'eq=saturation=2' },
    { id: 'sharpen', label: 'Sharpen', css: 'contrast(110%)', ffmpeg: 'unsharp=5:5:1.5:5:5:0.0' },
    { id: 'vignette', label: 'Vignette', css: 'brightness(85%)', ffmpeg: 'vignette=PI/4' },
    { id: 'vintage', label: 'Vintage', css: 'sepia(50%) brightness(90%)', ffmpeg: 'colorbalance=rs=0.1:gs=0.1:bs=-0.1,eq=brightness=-0.05:contrast=1.1' },
    { id: 'cool', label: 'Cool Tone', css: 'hue-rotate(180deg) saturate(130%)', ffmpeg: 'colorbalance=bs=0.3' },
    { id: 'warm', label: 'Warm Tone', css: 'sepia(30%) saturate(120%)', ffmpeg: 'colorbalance=rs=0.3' },
    { id: 'negative', label: 'Negative', css: 'invert(100%)', ffmpeg: 'negate' },
  ];

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Live CSS preview shows how the filter will look. Applying re-encodes the video.</div>';

  function getOptionsHTML() {
    var preview = '<div id="vflt-preview-wrap" style="margin-bottom:12px">' +
      '<video id="vflt-preview" style="max-width:100%;max-height:180px;border-radius:6px;background:#000" controls muted loop></video>' +
    '</div>';
    var cards = FILTERS.map(function (f) {
      return '<button type="button" class="vflt-btn" data-flt-id="' + f.id + '" data-flt-css="' + f.css + '" data-flt-ff="' + f.ffmpeg + '"' +
        ' style="padding:8px 12px;border:2px solid #ddd;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;text-align:center">' +
        f.label + '</button>';
    }).join('');
    return NOTICE + preview +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;margin-bottom:8px">' + cards + '</div>' +
      '<div id="vflt-selected" style="font-size:12px;color:#666">No filter selected</div>' +
      '<input type="hidden" id="vflt-ff-val" value="">' +
      '<script>(function(){' +
        'var preview=document.getElementById("vflt-preview");' +
        'document.querySelectorAll(".vflt-btn").forEach(function(btn){' +
          'btn.addEventListener("click",function(){' +
            'document.querySelectorAll(".vflt-btn").forEach(function(b){b.style.borderColor="#ddd";b.style.background="#fff";});' +
            'btn.style.borderColor="#4a90e2";btn.style.background="#e8f0fe";' +
            'if(preview)preview.style.filter=btn.dataset.fltCss;' +
            'document.getElementById("vflt-ff-val").value=btn.dataset.fltFf;' +
            'document.getElementById("vflt-selected").textContent="Filter: "+btn.textContent;' +
          '});' +
        '});' +
        'window._vfltInitPreview=function(file){' +
          'if(preview)preview.src=URL.createObjectURL(file);' +
        '};' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    var f = el.querySelector('#vflt-ff-val');
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
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Applying filter... ' + Math.round(e.progress * 100) + '%');
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
    if (!options.filter) throw new Error('Please select a filter to apply.');

    if (window._vfltInitPreview) window._vfltInitPreview(file);

    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    onProgress && onProgress(20, 'Applying filter...');
    await _ffmpeg.exec(['-i', inName, '-vf', options.filter, '-c:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'filtered.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

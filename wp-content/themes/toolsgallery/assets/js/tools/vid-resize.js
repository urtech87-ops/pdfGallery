/**
 * ToolsGallery — Resize Video
 * Handler: vid-resize
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-resize' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Resize runs in your browser. Re-encoding may take a few minutes for large files.</div>';

  function getOptionsHTML() {
    return NOTICE +
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
            '<option value="3840:2160">4K (3840×2160)</option>' +
            '<option value="1920:1080" selected>1080p (1920×1080)</option>' +
            '<option value="1280:720">720p (1280×720)</option>' +
            '<option value="854:480">480p (854×480)</option>' +
            '<option value="640:360">360p (640×360)</option>' +
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
      '</div>' +
      '<script>(function(){' +
        'var mode=document.getElementById("vrs-mode");' +
        'var pw=document.getElementById("vrs-preset-wrap");' +
        'var pc=document.getElementById("vrs-percent-wrap");' +
        'var cw=document.getElementById("vrs-custom-wrap");' +
        'if(mode)mode.addEventListener("change",function(){' +
          'pw.hidden=mode.value!=="preset";' +
          'pc.hidden=mode.value!=="percent";' +
          'cw.hidden=mode.value!=="custom";' +
        '});' +
        'var pct=document.getElementById("vrs-pct");' +
        'var pctCust=document.getElementById("vrs-pct-custom-wrap");' +
        'if(pct&&pctCust)pct.addEventListener("change",function(){pctCust.hidden=pct.value!=="custom";});' +
      '})();<\/script>';
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

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Resizing... ' + Math.round(e.progress * 100) + '%');
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
    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var vf;
    if (options.mode === 'preset') {
      var parts = (options.preset || '1920:1080').split(':');
      var w = parts[0], h = parts[1];
      vf = 'scale=' + w + ':' + h + ':force_original_aspect_ratio=decrease,pad=' + w + ':' + h + ':(ow-iw)/2:(oh-ih)/2';
    } else if (options.mode === 'percent') {
      var p = options.percent || 0.5;
      vf = 'scale=trunc(iw*' + p + '/2)*2:trunc(ih*' + p + '/2)*2';
    } else {
      var cw = options.customW || 1280;
      var ch = options.customH || 720;
      vf = 'scale=' + cw + ':' + ch;
    }

    onProgress && onProgress(20, 'Resizing video...');
    await _ffmpeg.exec(['-i', inName, '-vf', vf, '-c:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'resized.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

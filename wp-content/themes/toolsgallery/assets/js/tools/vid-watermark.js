/**
 * ToolsGallery — Add Watermark to Video
 * Handler: vid-watermark
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-watermark' };
  var _ffmpeg = null, _loaded = false;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Text watermarks are burned into the video. Processing takes a few minutes for large files.</div>';

  var POS_MAP = {
    'tl': 'x=10:y=10', 'tc': 'x=(w-tw)/2:y=10', 'tr': 'x=w-tw-10:y=10',
    'ml': 'x=10:y=(h-th)/2', 'mc': 'x=(w-tw)/2:y=(h-th)/2', 'mr': 'x=w-tw-10:y=(h-th)/2',
    'bl': 'x=10:y=h-th-10', 'bc': 'x=(w-tw)/2:y=h-th-10', 'br': 'x=w-tw-10:y=h-th-10',
  };
  var POS_LABELS = { tl:'↖ Top Left', tc:'↑ Top Center', tr:'↗ Top Right', ml:'← Mid Left', mc:'⊕ Center', mr:'→ Mid Right', bl:'↙ Bot Left', bc:'↓ Bot Center', br:'↘ Bot Right' };

  function getOptionsHTML() {
    var posHtml = Object.keys(POS_MAP).map(function (k) {
      return '<button type="button" class="vw-pos" data-pos="' + k + '" style="padding:4px 8px;border:2px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:11px' + (k === 'br' ? ';border-color:#4a90e2;background:#e8f0fe' : '') + '">' + POS_LABELS[k] + '</button>';
    }).join('');
    return NOTICE +
      '<div class="tg-opt-row"><label class="tg-opt-label">Watermark Text</label>' +
        '<input type="text" id="vw-text" class="tg-text-input" placeholder="Your watermark text" value="© Your Name">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Font Size</label>' +
        '<input type="range" id="vw-size" min="12" max="72" value="32" style="flex:1">' +
        '<span id="vw-size-val" style="margin-left:8px;font-size:13px">32px</span>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Color</label>' +
        '<input type="color" id="vw-color" value="#ffffff" style="width:48px;height:32px;border:none;cursor:pointer">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Opacity</label>' +
        '<input type="range" id="vw-opacity" min="10" max="100" value="80" style="flex:1">' +
        '<span id="vw-opacity-val" style="margin-left:8px;font-size:13px">80%</span>' +
      '</div>' +
      '<div style="margin-top:8px"><label class="tg-opt-label" style="display:block;margin-bottom:6px">Position</label>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">' + posHtml + '</div>' +
      '</div>' +
      '<input type="hidden" id="vw-pos-val" value="br">' +
      '<script>(function(){' +
        'var sz=document.getElementById("vw-size"),szv=document.getElementById("vw-size-val");' +
        'var op=document.getElementById("vw-opacity"),opv=document.getElementById("vw-opacity-val");' +
        'if(sz&&szv)sz.addEventListener("input",function(){szv.textContent=sz.value+"px";});' +
        'if(op&&opv)op.addEventListener("input",function(){opv.textContent=op.value+"%";});' +
        'document.querySelectorAll(".vw-pos").forEach(function(b){' +
          'b.addEventListener("click",function(){' +
            'document.querySelectorAll(".vw-pos").forEach(function(x){x.style.borderColor="#ddd";x.style.background="#fff";});' +
            'b.style.borderColor="#4a90e2";b.style.background="#e8f0fe";' +
            'document.getElementById("vw-pos-val").value=b.dataset.pos;' +
          '});' +
        '});' +
      '})();<\/script>';
  }

  function getOptions(el) {
    if (!el) return {};
    return {
      text: (el.querySelector('#vw-text') || {}).value || 'Watermark',
      size: (el.querySelector('#vw-size') || {}).value || '32',
      color: (el.querySelector('#vw-color') || {}).value || '#ffffff',
      opacity: (el.querySelector('#vw-opacity') || {}).value || '80',
      pos: (el.querySelector('#vw-pos-val') || {}).value || 'br',
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
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Adding watermark... ' + Math.round(e.progress * 100) + '%');
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
    if (!options.text || !options.text.trim()) throw new Error('Please enter watermark text.');

    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var hex = options.color || '#ffffff';
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var opacity = (parseInt(options.opacity) / 100).toFixed(2);
    var fontcolor = r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0') + Math.round(parseFloat(opacity) * 255).toString(16).padStart(2,'0');
    var posFilter = POS_MAP[options.pos] || POS_MAP.br;
    var text = options.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
    var vf = 'drawtext=text=\'' + text + '\':fontsize=' + options.size + ':fontcolor=0x' + fontcolor + ':' + posFilter;

    onProgress && onProgress(20, 'Adding watermark to video...');
    await _ffmpeg.exec(['-i', inName, '-vf', vf, '-codec:a', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'watermarked.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

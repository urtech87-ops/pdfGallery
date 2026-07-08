/**
 * ToolsGallery — Add Watermark to Video
 * Handler: vid-watermark
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-watermark' };

  var POS_MAP = {
    'tl': 'x=10:y=10', 'tc': 'x=(w-tw)/2:y=10', 'tr': 'x=w-tw-10:y=10',
    'ml': 'x=10:y=(h-th)/2', 'mc': 'x=(w-tw)/2:y=(h-th)/2', 'mr': 'x=w-tw-10:y=(h-th)/2',
    'bl': 'x=10:y=h-th-10', 'bc': 'x=(w-tw)/2:y=h-th-10', 'br': 'x=w-tw-10:y=h-th-10',
  };
  var POS_LABELS = { tl: '↖ Top Left', tc: '↑ Top Center', tr: '↗ Top Right', ml: '← Mid Left', mc: '⊕ Center', mr: '→ Mid Right', bl: '↙ Bot Left', bc: '↓ Bot Center', br: '↘ Bot Right' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Text watermarks are burned into the video.') : '';
    var posHtml = Object.keys(POS_MAP).map(function (k) {
      return '<button type="button" class="vw-pos" data-pos="' + k + '" style="padding:4px 8px;border:2px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:11px' + (k === 'br' ? ';border-color:#4a90e2;background:#e8f0fe' : '') + '">' + POS_LABELS[k] + '</button>';
    }).join('');
    return notice +
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
      '<input type="hidden" id="vw-pos-val" value="br">';
  }

  function wireOptions(container) {
    var sz = container.querySelector('#vw-size');
    var szv = container.querySelector('#vw-size-val');
    var op = container.querySelector('#vw-opacity');
    var opv = container.querySelector('#vw-opacity-val');
    if (sz && szv) sz.addEventListener('input', function () { szv.textContent = sz.value + 'px'; });
    if (op && opv) op.addEventListener('input', function () { opv.textContent = op.value + '%'; });
    container.querySelectorAll('.vw-pos').forEach(function (b) {
      b.addEventListener('click', function () {
        container.querySelectorAll('.vw-pos').forEach(function (x) { x.style.borderColor = '#ddd'; x.style.background = '#fff'; });
        b.style.borderColor = '#4a90e2';
        b.style.background = '#e8f0fe';
        var posEl = container.querySelector('#vw-pos-val');
        if (posEl) posEl.value = b.dataset.pos;
      });
    });
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

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');
    if (!options.text || !options.text.trim()) throw new Error('Please enter watermark text.');

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      /* drawtext needs an actual font file — the wasm build has none */
      var fontName = await U.loadFont(ffmpeg, onProgress);

      var hex = options.color || '#ffffff';
      var opacity = Math.round((parseInt(options.opacity, 10) / 100) * 255);
      var fontcolor = '0x' + hex.slice(1) + opacity.toString(16).padStart(2, '0');
      var posFilter = POS_MAP[options.pos] || POS_MAP.br;
      var text = options.text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/:/g, '\\:')
        .replace(/%/g, '\\%');
      var vf = 'drawtext=fontfile=' + fontName + ":text='" + text + "':fontsize=" + options.size + ':fontcolor=' + fontcolor + ':' + posFilter;

      onProgress && onProgress(0.15, 'Adding watermark to video...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', vf, '-codec:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-watermarked.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

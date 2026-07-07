/**
 * ToolsGallery — Rotate Video
 * Handler: vid-rotate
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-rotate' };

  var CSS_MAP = {
    'transpose=2': 'rotate(-90deg)',
    'transpose=1': 'rotate(90deg)',
    'transpose=2,transpose=2': 'rotate(180deg)',
    'hflip': 'scaleX(-1)',
    'vflip': 'scaleY(-1)',
  };
  var LABELS = {
    'transpose=2': '90° Left',
    'transpose=1': '90° Right',
    'transpose=2,transpose=2': '180°',
    'hflip': 'Flip Horizontal',
    'vflip': 'Flip Vertical',
  };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('A live CSS preview shows the result before processing.') : '';
    var btnStyle = 'padding:10px 16px;border:2px solid #ddd;background:#fff;border-radius:6px;cursor:pointer;font-size:18px;transition:all 0.15s';
    return notice +
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
      '<input type="hidden" id="vr-filter" value="">';
  }

  function wireOptions(container) {
    container.querySelectorAll('.vr-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.vr-btn').forEach(function (b) { b.style.borderColor = '#ddd'; b.style.background = '#fff'; });
        btn.style.borderColor = '#4a90e2';
        btn.style.background = '#e8f0fe';
        var f = btn.dataset.vr;
        var filterEl = container.querySelector('#vr-filter');
        if (filterEl) filterEl.value = f;
        var sel = container.querySelector('#vr-selected');
        if (sel) sel.textContent = 'Selected: ' + LABELS[f];
        var v = container.querySelector('#vr-preview');
        if (v) v.style.transform = CSS_MAP[f] || '';
      });
    });
  }

  function onFileReady(file) {
    var preview = document.getElementById('vr-preview');
    if (preview) preview.src = URL.createObjectURL(file);
  }

  function getOptions(el) {
    if (!el) return {};
    var f = el.querySelector('#vr-filter');
    return { filter: f ? f.value : '' };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');
    if (!options.filter) throw new Error('Please select a rotation or flip option.');

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      onProgress && onProgress(0.15, 'Rotating video...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', options.filter, '-c:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-rotated.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

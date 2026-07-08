/**
 * ToolsGallery — Video Filters
 * Handler: vid-filters
 * Live CSS preview of each preset on the uploaded video; the intensity
 * slider scales filters that support it. FFmpeg re-encodes on apply.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-filters' };
  var _selectedId = '';

  /* i = intensity 0.1–1. Filters without a "scale" flag ignore the slider. */
  var FILTERS = [
    { id: 'grayscale', label: 'Grayscale', scale: true,
      css: function (i) { return 'grayscale(' + Math.round(i * 100) + '%)'; },
      ff: function (i) { return 'hue=s=' + (1 - i).toFixed(2); } },
    { id: 'sepia', label: 'Sepia',
      css: function () { return 'sepia(100%)'; },
      ff: function () { return 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131'; } },
    { id: 'vintage', label: 'Vintage',
      css: function () { return 'sepia(50%) brightness(90%) contrast(110%)'; },
      ff: function () { return 'curves=vintage'; } },
    { id: 'sharpen', label: 'Sharpen', scale: true,
      css: function () { return 'contrast(110%)'; },
      ff: function (i) { return 'unsharp=5:5:' + (1.5 * i).toFixed(2) + ':5:5:0.0'; } },
    { id: 'blur', label: 'Blur', scale: true,
      css: function (i) { return 'blur(' + (4 * i).toFixed(1) + 'px)'; },
      ff: function (i) { return 'boxblur=' + Math.max(1, Math.round(8 * i)) + ':1'; } },
    { id: 'brighten', label: 'Brighten', scale: true,
      css: function (i) { return 'brightness(' + Math.round(100 + 40 * i) + '%)'; },
      ff: function (i) { return 'eq=brightness=' + (0.4 * i).toFixed(2); } },
    { id: 'darken', label: 'Darken', scale: true,
      css: function (i) { return 'brightness(' + Math.round(100 - 40 * i) + '%)'; },
      ff: function (i) { return 'eq=brightness=-' + (0.4 * i).toFixed(2); } },
    { id: 'contrast', label: 'Contrast', scale: true,
      css: function (i) { return 'contrast(' + Math.round(100 + 60 * i) + '%)'; },
      ff: function (i) { return 'eq=contrast=' + (1 + 0.6 * i).toFixed(2); } },
    { id: 'saturate', label: 'Saturate', scale: true,
      css: function (i) { return 'saturate(' + Math.round(100 + 150 * i) + '%)'; },
      ff: function (i) { return 'eq=saturation=' + (1 + 1.5 * i).toFixed(2); } },
    { id: 'vignette', label: 'Vignette',
      css: function () { return 'brightness(85%)'; },
      ff: function () { return 'vignette=PI/4'; } },
    { id: 'mirror', label: 'Mirror (flip)',
      css: function () { return ''; },
      ff: function () { return 'hflip'; } },
    { id: 'cool', label: 'Cool Tone',
      css: function () { return 'saturate(120%) hue-rotate(15deg)'; },
      ff: function () { return 'colorbalance=bs=0.3'; } },
    { id: 'warm', label: 'Warm Tone',
      css: function () { return 'sepia(30%) saturate(120%)'; },
      ff: function () { return 'colorbalance=rs=0.3'; } },
    { id: 'negative', label: 'Negative',
      css: function () { return 'invert(100%)'; },
      ff: function () { return 'negate'; } },
  ];

  function findFilter(id) {
    for (var i = 0; i < FILTERS.length; i++) if (FILTERS[i].id === id) return FILTERS[i];
    return null;
  }

  function getOptionsHTML() {
    _selectedId = '';
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('The preview shows a live approximation; applying re-encodes the video.') : '';
    var cards = FILTERS.map(function (f) {
      return '<button type="button" class="vflt-btn" data-flt-id="' + f.id + '"' +
        ' style="padding:8px 12px;border:2px solid #ddd;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;text-align:center">' +
        f.label + '</button>';
    }).join('');
    return notice +
      '<div id="vflt-preview-wrap" hidden style="margin-bottom:12px">' +
        '<video id="vflt-preview" style="max-width:100%;max-height:180px;border-radius:6px;background:#000" controls muted loop></video>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;margin-bottom:8px">' + cards + '</div>' +
      '<div class="tg-opt-row" id="vflt-intensity-row" hidden>' +
        '<label class="tg-opt-label">Intensity</label>' +
        '<input type="range" id="vflt-intensity" min="10" max="100" value="100" style="flex:1">' +
        ' <span id="vflt-intensity-val">100%</span>' +
      '</div>' +
      '<div id="vflt-selected" style="font-size:12px;color:#666">No filter selected</div>';
  }

  function intensityValue(container) {
    var sl = container.querySelector('#vflt-intensity');
    return sl ? (parseInt(sl.value, 10) || 100) / 100 : 1;
  }

  function updatePreview(container) {
    var preview = container.querySelector('#vflt-preview');
    var f = findFilter(_selectedId);
    if (preview && f) preview.style.filter = f.css(intensityValue(container));
  }

  function wireOptions(container) {
    var slider = container.querySelector('#vflt-intensity');
    var sliderVal = container.querySelector('#vflt-intensity-val');
    var sliderRow = container.querySelector('#vflt-intensity-row');
    var selectedEl = container.querySelector('#vflt-selected');

    container.querySelectorAll('.vflt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.vflt-btn').forEach(function (b) {
          b.style.borderColor = '#ddd'; b.style.background = '#fff';
        });
        btn.style.borderColor = '#4a90e2'; btn.style.background = '#e8f0fe';
        _selectedId = btn.dataset.fltId;
        var f = findFilter(_selectedId);
        if (sliderRow) sliderRow.hidden = !(f && f.scale);
        if (selectedEl) selectedEl.textContent = 'Filter: ' + btn.textContent;
        updatePreview(container);
      });
    });

    if (slider) {
      slider.addEventListener('input', function () {
        if (sliderVal) sliderVal.textContent = slider.value + '%';
        updatePreview(container);
      });
    }
  }

  function onFileReady(file) {
    var preview = document.getElementById('vflt-preview');
    var wrap = document.getElementById('vflt-preview-wrap');
    if (preview) preview.src = URL.createObjectURL(file);
    if (wrap) wrap.hidden = false;
  }

  function getOptions(el) {
    if (!el) return {};
    var f = findFilter(_selectedId);
    return {
      filter: f ? f.ff(intensityValue(el)) : '',
      label: f ? f.id : '',
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');
    if (!options.filter) throw new Error('Please select a filter to apply.');

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      onProgress && onProgress(0.15, 'Applying filter...');
      await U.exec(ffmpeg, ['-i', inName, '-vf', options.filter, '-c:a', 'copy', outName]);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-' + (options.label || 'filtered') + '.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

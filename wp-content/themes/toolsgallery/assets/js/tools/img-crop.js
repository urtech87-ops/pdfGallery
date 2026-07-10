/**
 * ToolsGallery — Crop Image
 * Handler: img-crop
 * URL: /tool/crop-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-crop' };
  var _cropper = null;
  var _objectUrl = null;

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Aspect Ratio</label>' +
      '<div class="tg-radio-group" id="ic-ar-group">' +
        '<label><input type="radio" name="ic-ar" value="free" checked> Free</label>' +
        '<label><input type="radio" name="ic-ar" value="1"> 1:1</label>' +
        '<label><input type="radio" name="ic-ar" value="1.333"> 4:3</label>' +
        '<label><input type="radio" name="ic-ar" value="1.778"> 16:9</label>' +
        '<label><input type="radio" name="ic-ar" value="0.5625"> 9:16</label>' +
        '<label><input type="radio" name="ic-ar" value="0.75"> 3:4</label>' +
        '<label><input type="radio" name="ic-ar" value="2"> 2:1</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label><input type="checkbox" id="ic-circle"> Circle crop (output PNG)</label>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ic-fmt">Output Format</label>' +
      '<select id="ic-fmt" class="tg-select">' +
        '<option value="same">Same as input</option>' +
        '<option value="image/jpeg">JPG</option>' +
        '<option value="image/png">PNG</option>' +
      '</select>' +
    '</div>' +
    '<p id="ic-crop-dims" class="tg-opt-info" style="margin-top:6px"></p>' +
    '<div id="ic-cropper-container" style="max-width:100%;margin-top:12px;display:none">' +
      '<img id="ic-cropper-img" style="max-width:100%;display:block">' +
    '</div>';
  }

  function wireOptions(container) {
    container.querySelectorAll('input[name="ic-ar"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (_cropper) {
          var v = parseFloat(r.value);
          _cropper.setAspectRatio(isNaN(v) ? NaN : v);
        }
      });
    });
    var circleChk = container.querySelector('#ic-circle');
    if (circleChk) circleChk.addEventListener('change', function () {
      if (_cropper && circleChk.checked) _cropper.setAspectRatio(1);
    });
  }

  function onFileReady(file, optionsEl) {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) return;

    var container = document.getElementById('ic-cropper-container');
    var imgEl = document.getElementById('ic-cropper-img');
    if (!container || !imgEl) return;

    if (_cropper) { _cropper.destroy(); _cropper = null; }
    if (_objectUrl) { URL.revokeObjectURL(_objectUrl); }

    _objectUrl = URL.createObjectURL(file);
    container.style.display = 'block';

    imgEl.onload = function () {
      if (!window.Cropper) return;
      var arInput = optionsEl ? optionsEl.querySelector('input[name="ic-ar"]:checked') : null;
      var ar = arInput && arInput.value !== 'free' ? parseFloat(arInput.value) : NaN;
      _cropper = new Cropper(imgEl, {
        aspectRatio: isNaN(ar) ? NaN : ar,
        viewMode: 1,
        responsive: true,
        autoCropArea: 0.8,
        crop: function (event) {
          var d = event.detail;
          var el = document.getElementById('ic-crop-dims');
          if (el) el.textContent = 'Crop area: ' + Math.round(d.width) + ' × ' + Math.round(d.height) + 'px';
        },
      });
    };
    imgEl.src = _objectUrl;
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    if (!window.Cropper) throw new Error('Cropper.js failed to load. Please refresh the page.');
    if (!_cropper) throw new Error('Crop area not ready yet — wait for the image preview, adjust the selection, then try again.');

    onProgress && onProgress(0.5, 'Cropping...');
    var cropCanvas = _cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
    if (!cropCanvas) throw new Error('Crop failed.');

    var circle = options.circle;
    if (circle) {
      var cw = cropCanvas.width, ch = cropCanvas.height;
      var out = document.createElement('canvas');
      out.width = cw; out.height = ch;
      var ctx = out.getContext('2d');
      ctx.beginPath();
      ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(cropCanvas, 0, 0);
      cropCanvas = out;
    }

    var mime = circle ? 'image/png'
      : (options.format === 'same'
        ? (file.type === 'image/png' ? 'image/png' : 'image/jpeg')
        : options.format);
    var ext = mime === 'image/png' ? '.png' : '.jpg';

    onProgress && onProgress(0.8, 'Saving...');
    var blob = await TGImageUtil.canvasToBlob(cropCanvas, mime, 0.92);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-cropped' + ext };
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var circle = optionsEl.querySelector('#ic-circle');
    var fmt = optionsEl.querySelector('#ic-fmt');
    return {
      circle: circle ? circle.checked : false,
      format: fmt ? fmt.value : 'same',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

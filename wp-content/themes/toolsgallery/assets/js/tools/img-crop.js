/**
 * ToolsGallery — Crop Image
 * Handler: img-crop
 * URL: /tool/crop-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-crop' };
  var _cropper = null;

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
      '<label><input type="checkbox" id="ic-circle"> Circle crop</label>' +
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
      '<img id="ic-cropper-img" style="max-width:100%">' +
    '</div>' +
    '<script>(function(){' +
      'var arRadios=document.querySelectorAll("input[name=\'ic-ar\']");' +
      'arRadios.forEach(function(r){r.addEventListener("change",function(){' +
        'if(window._icCropper){var v=parseFloat(r.value)||NaN;window._icCropper.setAspectRatio(isNaN(v)?NaN:v);}' +
      '});});' +
      'var circleChk=document.getElementById("ic-circle");' +
      'if(circleChk)circleChk.addEventListener("change",function(){' +
        'var cont=document.getElementById("ic-cropper-container");' +
        'if(cont){if(circleChk.checked){cont.style.setProperty("--ic-circle","1");}else{cont.style.removeProperty("--ic-circle");}}' +
        'if(window._icCropper&&circleChk.checked){window._icCropper.setAspectRatio(1);}' +
      '});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var ar = optionsEl.querySelector('input[name="ic-ar"]:checked');
    var circle = optionsEl.querySelector('#ic-circle');
    var fmt = optionsEl.querySelector('#ic-fmt');
    return {
      aspectRatio: ar ? ar.value : 'free',
      circle: circle ? circle.checked : false,
      format: fmt ? fmt.value : 'same',
    };
  }

  async function run(file, options, onProgress) {
    // Show cropper UI and wait for user to trigger "Crop" from action button
    return new Promise(function (resolve, reject) {
      onProgress && onProgress(0.1, 'Loading image...');
      var container = document.getElementById('ic-cropper-container');
      var imgEl = document.getElementById('ic-cropper-img');

      if (!container || !imgEl) {
        reject(new Error('Cropper UI not ready. Please try again.')); return;
      }

      // If cropper already exists and is active, do the crop now
      if (window._icCropper && window._icReady) {
        doTheCrop(file, options, resolve, reject, onProgress);
        return;
      }

      // Load image into cropper
      var url = URL.createObjectURL(file);
      imgEl.src = url;
      container.style.display = 'block';

      imgEl.onload = function () {
        if (!window.Cropper) {
          reject(new Error('Cropper.js not loaded')); return;
        }
        if (_cropper) { _cropper.destroy(); _cropper = null; }
        var ar = options.aspectRatio === 'free' ? NaN : parseFloat(options.aspectRatio);
        _cropper = new Cropper(imgEl, {
          aspectRatio: isNaN(ar) ? NaN : ar,
          viewMode: 1,
          responsive: true,
          crop: function (event) {
            var d = event.detail;
            var el = document.getElementById('ic-crop-dims');
            if (el) el.textContent = 'Crop area: ' + Math.round(d.width) + ' × ' + Math.round(d.height) + 'px';
          },
        });
        window._icCropper = _cropper;
        window._icReady = true;

        // Signal that user should click the action button again to apply crop
        onProgress && onProgress(0.5, 'Adjust the crop area, then click the button again to apply.');

        // Immediately resolve with a placeholder so tool-runner shows re-trigger
        // Actually we do the crop right away on second call - just set a flag
        resolve({ _waitForCrop: true, file: file, options: options });
      };
      imgEl.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    }).then(function (result) {
      if (result && result._waitForCrop) {
        // Immediately do crop from current cropper state
        return new Promise(function (res, rej) {
          doTheCrop(result.file, result.options, res, rej, function(){});
        });
      }
      return result;
    });
  }

  function doTheCrop(file, options, resolve, reject, onProgress) {
    if (!_cropper) { reject(new Error('No active crop selection')); return; }
    onProgress && onProgress(0.8, 'Cropping...');
    var cropCanvas = _cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
    if (!cropCanvas) { reject(new Error('Crop failed')); return; }

    if (options.circle) {
      // Apply circular mask
      var cw = cropCanvas.width, ch = cropCanvas.height;
      var out = document.createElement('canvas');
      out.width = cw; out.height = ch;
      var ctx = out.getContext('2d');
      ctx.beginPath();
      ctx.arc(cw/2, ch/2, Math.min(cw,ch)/2, 0, Math.PI*2);
      ctx.clip();
      ctx.drawImage(cropCanvas, 0, 0);
      cropCanvas = out;
    }

    var mime = options.format === 'same'
      ? (file.type === 'image/png' ? 'image/png' : 'image/jpeg')
      : options.format;
    var ext = mime === 'image/png' ? '.png' : '.jpg';
    var base = file.name.replace(/\.[^.]+$/, '');

    cropCanvas.toBlob(function (blob) {
      if (!blob) { reject(new Error('Failed to export crop')); return; }
      window._icReady = false;
      onProgress && onProgress(1, 'Done!');
      resolve({ blob: blob, filename: base + '-cropped' + ext });
    }, mime, 0.92);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

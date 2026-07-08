/**
 * ToolsGallery — Profile Photo Maker
 * Handler: img-profile
 * URL: /tool/profile-photo-maker/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-profile' };
  var _cropper = null;
  var _cropperUrl = null;

  var PLATFORMS = {
    linkedin: { size: 400, shape: 'circle', label: 'LinkedIn' },
    twitter: { size: 400, shape: 'circle', label: 'Twitter/X' },
    facebook: { size: 180, shape: 'circle', label: 'Facebook' },
    instagram: { size: 320, shape: 'circle', label: 'Instagram' },
    whatsapp: { size: 192, shape: 'circle', label: 'WhatsApp' },
    youtube: { size: 800, shape: 'circle', label: 'YouTube' },
    github: { size: 460, shape: 'circle', label: 'GitHub' },
    custom: { size: 500, shape: 'circle', label: 'Custom' },
  };

  function getOptionsHTML() {
    var platOpts = Object.keys(PLATFORMS).map(function (k) {
      var p = PLATFORMS[k];
      return '<option value="' + k + '">' + p.label + (k !== 'custom' ? ' (' + p.size + 'px)' : '') + '</option>';
    }).join('');

    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ipf-platform">Platform</label>' +
      '<select id="ipf-platform" class="tg-select">' + platOpts + '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Shape</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="ipf-shape" value="circle" checked> Circle</label>' +
        '<label><input type="radio" name="ipf-shape" value="square"> Square</label>' +
        '<label><input type="radio" name="ipf-shape" value="rounded"> Rounded Square</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ipf-size">Output Size: <span id="ipf-size-val">400</span>px</label>' +
      '<input type="range" id="ipf-size" min="100" max="1000" value="400" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label><input type="checkbox" id="ipf-bg"> Add background color</label>' +
    '</div>' +
    '<div id="ipf-bg-wrap" hidden class="tg-opt-row">' +
      '<input type="color" id="ipf-bg-color" value="#4a90e2">' +
    '</div>' +
    '<div id="ipf-cropper-wrap" style="margin-top:12px;display:none;max-width:100%">' +
      '<p class="tg-opt-info">Drag to position and zoom your photo, then click the button below.</p>' +
      '<img id="ipf-img" style="max-width:100%;display:block">' +
    '</div>' +
    '<div id="ipf-preview-label" hidden style="margin-top:8px;text-align:center">' +
      '<p class="tg-opt-info">Preview</p>' +
      '<canvas id="ipf-preview" style="border-radius:50%;border:2px solid #ddd;max-width:150px"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    var sl = container.querySelector('#ipf-size');
    var sv = container.querySelector('#ipf-size-val');
    if (sl && sv) sl.addEventListener('input', function () { sv.textContent = sl.value; });

    var platSel = container.querySelector('#ipf-platform');
    if (platSel) {
      platSel.addEventListener('change', function () {
        var p = PLATFORMS[platSel.value];
        if (!p) return;
        if (sl) { sl.value = p.size; if (sv) sv.textContent = p.size; }
        container.querySelectorAll('input[name="ipf-shape"]').forEach(function (r) {
          r.checked = r.value === p.shape;
        });
      });
    }

    var bgChk = container.querySelector('#ipf-bg');
    var bgWrap = container.querySelector('#ipf-bg-wrap');
    if (bgChk && bgWrap) bgChk.addEventListener('change', function () { bgWrap.hidden = !bgChk.checked; });
  }

  /* Called by tool-runner when a file is selected — sets up the cropper so
     the user can position the photo before running the export. */
  function onFileReady(file) {
    var cropperWrap = document.getElementById('ipf-cropper-wrap');
    var imgEl = document.getElementById('ipf-img');
    if (!cropperWrap || !imgEl || !window.Cropper) return;

    if (_cropper) { try { _cropper.destroy(); } catch (e) {} _cropper = null; }
    if (_cropperUrl) { URL.revokeObjectURL(_cropperUrl); _cropperUrl = null; }

    _cropperUrl = URL.createObjectURL(file);
    imgEl.onload = function () {
      _cropper = new Cropper(imgEl, {
        aspectRatio: 1,
        viewMode: 1,
        responsive: true,
        autoCropArea: 1,
      });
    };
    imgEl.src = _cropperUrl;
    cropperWrap.style.display = 'block';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var platform = optionsEl.querySelector('#ipf-platform');
    var shape = optionsEl.querySelector('input[name="ipf-shape"]:checked');
    var size = optionsEl.querySelector('#ipf-size');
    var bgChk = optionsEl.querySelector('#ipf-bg');
    var bgColor = optionsEl.querySelector('#ipf-bg-color');
    return {
      platform: platform ? platform.value : 'linkedin',
      shape: shape ? shape.value : 'circle',
      size: size ? parseInt(size.value) : 400,
      addBg: bgChk ? bgChk.checked : false,
      bgColor: bgColor ? bgColor.value : '#4a90e2',
    };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.2, 'Cropping photo...');
    var size = options.size || 400;
    var cropCanvas;

    if (_cropper) {
      cropCanvas = _cropper.getCroppedCanvas({ width: size, height: size });
      if (!cropCanvas) throw new Error('Crop failed. Please try again.');
    } else {
      // Cropper unavailable — fall back to a centered square crop
      var img = await TGImageUtil.loadImage(file);
      var side = Math.min(img.naturalWidth, img.naturalHeight);
      var sx = (img.naturalWidth - side) / 2;
      var sy = (img.naturalHeight - side) / 2;
      cropCanvas = document.createElement('canvas');
      cropCanvas.width = size;
      cropCanvas.height = size;
      cropCanvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
    }

    onProgress && onProgress(0.6, 'Exporting...');
    var outCanvas = document.createElement('canvas');
    outCanvas.width = size; outCanvas.height = size;
    var ctx = outCanvas.getContext('2d');

    if (options.addBg) { ctx.fillStyle = options.bgColor; ctx.fillRect(0, 0, size, size); }

    if (options.shape !== 'square') {
      ctx.save();
      if (options.shape === 'circle') {
        ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.clip();
      } else {
        var r = size * 0.15;
        ctx.beginPath();
        ctx.moveTo(r,0); ctx.lineTo(size-r,0); ctx.arcTo(size,0,size,r,r);
        ctx.lineTo(size,size-r); ctx.arcTo(size,size,size-r,size,r);
        ctx.lineTo(r,size); ctx.arcTo(0,size,0,size-r,r);
        ctx.lineTo(0,r); ctx.arcTo(0,0,r,0,r); ctx.closePath(); ctx.clip();
      }
      ctx.drawImage(cropCanvas, 0, 0); ctx.restore();
    } else {
      ctx.drawImage(cropCanvas, 0, 0);
    }

    // Show preview
    var previewEl = document.getElementById('ipf-preview');
    var previewLabel = document.getElementById('ipf-preview-label');
    if (previewEl && previewLabel) {
      var maxW = 150; var sc = Math.min(1, maxW / size);
      previewEl.width = Math.round(size*sc); previewEl.height = Math.round(size*sc);
      previewEl.getContext('2d').drawImage(outCanvas, 0, 0, previewEl.width, previewEl.height);
      previewEl.style.borderRadius = options.shape === 'circle' ? '50%' : (options.shape === 'rounded' ? '15%' : '0');
      previewLabel.hidden = false;
    }

    var blob = await TGImageUtil.canvasToBlob(outCanvas, 'image/png', 1.0);
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: 'profile-' + (options.platform || 'photo') + '.png' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

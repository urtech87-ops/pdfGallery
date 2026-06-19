/**
 * ToolsGallery — Profile Photo Maker
 * Handler: img-profile
 * URL: /tool/profile-photo-maker/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-profile' };
  var _cropper = null;

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
      '<img id="ipf-img" style="max-width:100%">' +
    '</div>' +
    '<div id="ipf-preview-label" hidden style="margin-top:8px;text-align:center">' +
      '<p class="tg-opt-info">Preview (circle)</p>' +
      '<canvas id="ipf-preview" style="border-radius:50%;border:2px solid #ddd;max-width:150px"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'var sl=document.getElementById("ipf-size"),sv=document.getElementById("ipf-size-val");' +
      'if(sl&&sv)sl.addEventListener("input",function(){sv.textContent=sl.value;});' +
      'var platSel=document.getElementById("ipf-platform");' +
      'if(platSel)platSel.addEventListener("change",function(){' +
        'var platforms=' + JSON.stringify(PLATFORMS) + ';' +
        'var p=platforms[platSel.value];if(!p)return;' +
        'var ss=document.getElementById("ipf-size");if(ss){ss.value=p.size;if(sv)sv.textContent=p.size;}' +
        'var radios=document.querySelectorAll("input[name=\'ipf-shape\']");' +
        'radios.forEach(function(r){r.checked=r.value===p.shape;});' +
      '});' +
      'var bgChk=document.getElementById("ipf-bg"),bgWrap=document.getElementById("ipf-bg-wrap");' +
      'if(bgChk&&bgWrap)bgChk.addEventListener("change",function(){bgWrap.hidden=!bgChk.checked;});' +
    '})();<\/script>';
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
    onProgress && onProgress(0.1, 'Loading image...');

    return new Promise(function (resolve, reject) {
      var cropperWrap = document.getElementById('ipf-cropper-wrap');
      var imgEl = document.getElementById('ipf-img');

      if (!cropperWrap || !imgEl) { reject(new Error('UI not ready')); return; }

      if (window._ipfCropper && window._ipfReady) {
        doCrop(file, options, resolve, reject, onProgress);
        return;
      }

      var url = URL.createObjectURL(file);
      imgEl.src = url;
      cropperWrap.style.display = 'block';

      imgEl.onload = function () {
        if (!window.Cropper) { reject(new Error('Cropper.js not loaded')); return; }
        if (_cropper) { _cropper.destroy(); _cropper = null; }
        _cropper = new Cropper(imgEl, {
          aspectRatio: 1,
          viewMode: 1,
          responsive: true,
        });
        window._ipfCropper = _cropper;
        window._ipfReady = true;
        onProgress && onProgress(0.5, 'Position your photo, then click the button to export.');
        resolve({ _wait: true, file: file, options: options });
      };
      imgEl.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    }).then(function (r) {
      if (r && r._wait) {
        return new Promise(function (res, rej) { doCrop(r.file, r.options, res, rej, function(){}); });
      }
      return r;
    });
  }

  function doCrop(file, options, resolve, reject, onProgress) {
    if (!_cropper) { reject(new Error('No active cropper')); return; }
    onProgress && onProgress(0.7, 'Exporting...');
    var size = options.size || 400;
    var cropCanvas = _cropper.getCroppedCanvas({ width: size, height: size });
    if (!cropCanvas) { reject(new Error('Crop failed')); return; }

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

    var platform = options.platform || 'linkedin';
    outCanvas.toBlob(function (blob) {
      if (!blob) { reject(new Error('Export failed')); return; }
      window._ipfReady = false;
      onProgress && onProgress(1, 'Done!');
      resolve({ blob: blob, filename: 'profile-' + platform + '.png' });
    }, 'image/png');
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/**
 * ToolsGallery — Change Image Background
 * Handler: img-change-bg
 * URL: /tool/change-image-background/
 *
 * Detection is fully automatic — there is no rectangle to drag, which is
 * what used to make this tool fail on people and any other irregular
 * subject. TGImageUtil.autoCutout produces the subject, and
 * TGImageUtil.applyMask paints the chosen background behind it: a solid
 * colour, one of the gradient presets, or an uploaded image (cover-fitted,
 * so it fills the frame without being stretched).
 *
 * The preview re-renders on every option change. Canvas width/height are
 * set inside render(), which only ever runs once the image has loaded and
 * a cutout exists — never before.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-change-bg' };

  var _origImg = null;
  var _cutout = null;         // { subjectCanvas, mask, width, height, method }
  var _cutoutPromise = null;
  var _bgImg = null;          // uploaded background image
  var _manualTolerance = false;

  var DEFAULT_TOLERANCE = 30;
  var PREVIEW_W = 320;

  /* Gradient presets — name, then the two stops used corner to corner. */
  var GRADIENTS = [
    { id: 'sky',     label: 'Sky',     from: '#4facfe', to: '#00f2fe' },
    { id: 'sunset',  label: 'Sunset',  from: '#fa709a', to: '#fee140' },
    { id: 'violet',  label: 'Violet',  from: '#667eea', to: '#764ba2' },
    { id: 'forest',  label: 'Forest',  from: '#0ba360', to: '#3cba92' },
    { id: 'peach',   label: 'Peach',   from: '#ffecd2', to: '#fcb69f' },
    { id: 'slate',   label: 'Studio',  from: '#e0eafc', to: '#cfdef3' },
    { id: 'ember',   label: 'Ember',   from: '#f83600', to: '#f9d423' },
    { id: 'night',   label: 'Night',   from: '#232526', to: '#414345' },
  ];

  function gradientSwatchHTML() {
    return GRADIENTS.map(function (g) {
      return '<button type="button" class="tg-grad-swatch" data-from="' + g.from + '" data-to="' + g.to + '" ' +
        'title="' + g.label + '" aria-label="' + g.label + ' gradient" ' +
        'style="background:linear-gradient(135deg,' + g.from + ',' + g.to + ')"></button>';
    }).join('');
  }

  function getOptionsHTML() {
    return '<p class="tg-opt-info" id="icb-status">Upload a photo — the subject is detected automatically, then pick a new background.</p>' +
    '<p class="tg-opt-info" id="icb-method" hidden></p>' +

    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Background</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="icb-bg" value="color" checked> Solid Colour</label>' +
        '<label><input type="radio" name="icb-bg" value="gradient"> Gradient</label>' +
        '<label><input type="radio" name="icb-bg" value="image"> Upload Image</label>' +
      '</div>' +
    '</div>' +

    '<div id="icb-color-wrap" class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icb-color">Colour</label>' +
      '<input type="color" id="icb-color" value="#4a90e2">' +
    '</div>' +

    '<div id="icb-gradient-wrap" hidden>' +
      '<div class="tg-opt-row" style="align-items:flex-start">' +
        '<label class="tg-opt-label">Presets</label>' +
        '<div class="tg-grad-swatches">' + gradientSwatchHTML() + '</div>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="icb-grad1">From</label>' +
        '<input type="color" id="icb-grad1" value="#667eea">' +
        '<label class="tg-opt-label" for="icb-grad2" style="margin-left:12px">To</label>' +
        '<input type="color" id="icb-grad2" value="#764ba2">' +
      '</div>' +
    '</div>' +

    '<div id="icb-image-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icb-bg-file">Background Image</label>' +
      '<input type="file" id="icb-bg-file" accept="image/*" class="tg-text-input">' +
    '</div>' +

    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Save as</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="icb-format" value="png" checked> PNG</label>' +
        '<label><input type="radio" name="icb-format" value="jpg"> JPG</label>' +
      '</div>' +
    '</div>' +

    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="icb-tolerance">Edge tolerance: <span id="icb-tol-val">' + DEFAULT_TOLERANCE + '</span></label>' +
      '<input type="range" id="icb-tolerance" min="5" max="120" value="' + DEFAULT_TOLERANCE + '" style="flex:1">' +
    '</div>' +
    '<p class="tg-opt-info tg-opt-hint">Nudge the tolerance if too much or too little of the original background is left behind.</p>' +

    '<div id="icb-preview-wrap" style="margin-top:12px;display:none">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">Original</p>' +
          '<canvas id="icb-before" class="tg-img-preview-canvas"></canvas></div>' +
        '<div><p style="margin:0 0 4px;font-size:12px;font-weight:600">New background</p>' +
          '<canvas id="icb-after" class="tg-img-preview-canvas tg-img-checker"></canvas></div>' +
      '</div>' +
    '</div>';
  }

  function wireOptions(container) {
    container.querySelectorAll('input[name="icb-bg"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var colorWrap = container.querySelector('#icb-color-wrap');
        var imageWrap = container.querySelector('#icb-image-wrap');
        var gradWrap = container.querySelector('#icb-gradient-wrap');
        if (colorWrap) colorWrap.hidden = r.value !== 'color';
        if (imageWrap) imageWrap.hidden = r.value !== 'image';
        if (gradWrap) gradWrap.hidden = r.value !== 'gradient';
        updatePreview(container);
      });
    });

    ['#icb-color', '#icb-grad1', '#icb-grad2'].forEach(function (sel) {
      var input = container.querySelector(sel);
      if (input) input.addEventListener('input', function () { updatePreview(container); });
    });

    container.querySelectorAll('input[name="icb-format"]').forEach(function (r) {
      r.addEventListener('change', function () { updatePreview(container); });
    });

    /* Preset swatches fill the two colour inputs, so a preset is just a
       starting point the user can still edit. */
    container.querySelectorAll('.tg-grad-swatch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var g1 = container.querySelector('#icb-grad1');
        var g2 = container.querySelector('#icb-grad2');
        if (g1) g1.value = btn.getAttribute('data-from');
        if (g2) g2.value = btn.getAttribute('data-to');
        container.querySelectorAll('.tg-grad-swatch').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        updatePreview(container);
      });
    });

    var bgFile = container.querySelector('#icb-bg-file');
    if (bgFile) bgFile.addEventListener('change', function () {
      _bgImg = null;
      if (bgFile.files && bgFile.files[0]) {
        /* The background image is only drawn once it has loaded — the
           preview is refreshed from inside the load callback. */
        TGImageUtil.loadImage(bgFile.files[0]).then(function (img) {
          _bgImg = img;
          updatePreview(container);
        }).catch(function () {
          setStatus('Could not read that background image — try another file.');
        });
      }
    });

    var tol = container.querySelector('#icb-tolerance');
    var tv = container.querySelector('#icb-tol-val');
    if (tol && tv) {
      var debounce = null;
      tol.addEventListener('input', function () {
        tv.textContent = tol.value;
        clearTimeout(debounce);
        debounce = setTimeout(function () {
          if (!_origImg) return;
          _manualTolerance = true;
          runLocalDetection(parseInt(tol.value, 10));
          updatePreview(container);
        }, 180);
      });
    }
  }

  function getOptions(optionsEl) {
    var el = optionsEl || document.querySelector('.tg-tool-box .tg-options') || document;
    var bgType = el.querySelector('input[name="icb-bg"]:checked');
    var format = el.querySelector('input[name="icb-format"]:checked');
    var color = el.querySelector('#icb-color');
    var bgFile = el.querySelector('#icb-bg-file');
    var grad1 = el.querySelector('#icb-grad1');
    var grad2 = el.querySelector('#icb-grad2');
    var tol = el.querySelector('#icb-tolerance');
    return {
      bgType: bgType ? bgType.value : 'color',
      format: format ? format.value : 'png',
      color: color ? color.value : '#4a90e2',
      bgFile: bgFile && bgFile.files ? bgFile.files[0] : null,
      grad1: grad1 ? grad1.value : '#667eea',
      grad2: grad2 ? grad2.value : '#764ba2',
      tolerance: tol ? parseInt(tol.value, 10) : DEFAULT_TOLERANCE,
    };
  }

  function setStatus(msg) {
    var el = document.getElementById('icb-status');
    if (el) el.textContent = msg;
  }

  function setMethodNote(cutout) {
    var el = document.getElementById('icb-method');
    if (!el) return;
    if (!cutout) { el.hidden = true; return; }
    var msg;
    if (cutout.method === 'removebg') {
      msg = 'Subject cut out with remove.bg.';
    } else if (cutout.method === 'local') {
      if (cutout.coverage < 0.02) {
        msg = 'Almost none of the original background matched — it is probably too busy for colour detection. Try raising the tolerance.';
      } else if (cutout.coverage > 0.97) {
        msg = 'Nearly the whole photo was treated as background. Lower the tolerance to keep more of the subject.';
      } else {
        msg = 'Subject isolated with colour detection — works best on an even background.';
      }
    } else {
      msg = 'Subject detected with on-device AI.';
    }
    el.textContent = msg;
    el.hidden = false;
  }

  /* Which applyMask mode + options the current form describes. */
  function maskArgs(opts) {
    if (opts.bgType === 'gradient') {
      return ['fill', { gradient: { from: opts.grad1, to: opts.grad2 } }];
    }
    if (opts.bgType === 'image' && _bgImg) {
      return ['image', { image: _bgImg }];
    }
    if (opts.bgType === 'image' && !_bgImg) {
      /* No image chosen yet — show the subject over a neutral card rather
         than a blank frame. */
      return ['fill', { color: '#ffffff' }];
    }
    return ['fill', { color: opts.color }];
  }

  /* Render the composite into targetCanvas at renderW pixels wide.
     Sizes the canvas here, after the cutout exists. */
  function render(targetCanvas, renderW, opts) {
    if (!_cutout || !_origImg) return false;
    var scale = Math.min(1, renderW / _cutout.width);
    var w = Math.max(1, Math.round(_cutout.width * scale));
    var h = Math.max(1, Math.round(_cutout.height * scale));
    targetCanvas.width = w;
    targetCanvas.height = h;

    var ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    /* applyMask cuts the subject out of whatever the canvas holds, so the
       photo goes down first. */
    ctx.drawImage(_origImg, 0, 0, w, h);
    var args = maskArgs(opts);
    TGImageUtil.applyMask(targetCanvas, _cutout.mask, args[0], args[1]);
    return true;
  }

  function updatePreview(optionsEl) {
    if (!_cutout) return;
    var afterEl = document.getElementById('icb-after');
    if (!afterEl) return;
    render(afterEl, PREVIEW_W, getOptions(optionsEl));
  }

  /* Local detection at an explicit tolerance — what the slider drives. */
  function runLocalDetection(tolerance) {
    if (!_origImg) return null;
    var mask = TGImageUtil.backgroundMaskFor(_origImg, { tolerance: tolerance });
    _cutout = {
      subjectCanvas: TGImageUtil.cutoutFromMask(_origImg, mask),
      mask: mask,
      width: _origImg.naturalWidth,
      height: _origImg.naturalHeight,
      method: 'local',
      coverage: mask.coverage,
    };
    _cutoutPromise = Promise.resolve(_cutout);
    setMethodNote(_cutout);
    setStatus('Background replaced — the preview updates as you change the options.');
    return _cutout;
  }

  function startCutout(file) {
    _cutoutPromise = TGImageUtil.autoCutout(file || _origImg, {
      tolerance: DEFAULT_TOLERANCE,
      useModel: !_manualTolerance,
    }, function (pct, msg) {
      if (msg) setStatus(msg);
    }).then(function (result) {
      _cutout = result;
      setStatus('Subject detected — pick a background below, the preview updates live.');
      setMethodNote(result);
      updatePreview();
      return result;
    }).catch(function (e) {
      setStatus('Could not detect the subject: ' + (e && e.message ? e.message : 'unknown error'));
      throw e;
    });
    return _cutoutPromise;
  }

  function onFileReady(file) {
    _origImg = null;
    _cutout = null;
    _cutoutPromise = null;
    _manualTolerance = false;
    if (!file) return;

    TGImageUtil.loadImage(file).then(function (img) {
      _origImg = img;
      var beforeEl = document.getElementById('icb-before');
      var wrap = document.getElementById('icb-preview-wrap');
      if (beforeEl) TGImageUtil.drawPreview(img, beforeEl, 280);
      if (wrap) wrap.style.display = 'block';
      setStatus('Detecting subject...');
      startCutout(file);
    }).catch(function () {
      alert('Could not load image. Please try a different file.');
    });
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    onProgress && onProgress(0.1, 'Preparing...');
    if (!_origImg) _origImg = await TGImageUtil.loadImage(file);
    if (options.bgType === 'image' && options.bgFile && !_bgImg) {
      _bgImg = await TGImageUtil.loadImage(options.bgFile);
    }

    if (!_cutout) {
      try {
        await (_cutoutPromise || startCutout(file));
      } catch (e) {
        runLocalDetection(options.tolerance || DEFAULT_TOLERANCE);
      }
    }
    if (!_cutout) throw new Error('Could not detect the subject in this image.');

    onProgress && onProgress(0.7, 'Compositing...');
    var canvas = document.createElement('canvas');
    render(canvas, _cutout.width, options);

    updatePreview();
    onProgress && onProgress(0.9, 'Saving...');

    /* Every background here is opaque, so JPG is a real choice; PNG stays
       the default because it does not re-compress the subject's edges. */
    var jpg = options.format === 'jpg';
    var blob = await TGImageUtil.canvasToBlob(canvas, jpg ? 'image/jpeg' : 'image/png', jpg ? 0.92 : 1.0);
    onProgress && onProgress(1, 'Done!');
    return {
      blob: blob,
      filename: TGImageUtil.stripExt(file.name) + '-new-bg.' + (jpg ? 'jpg' : 'png'),
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

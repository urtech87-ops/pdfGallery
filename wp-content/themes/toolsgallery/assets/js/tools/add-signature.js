/* ToolsGallery — add-signature.js
   Handler: add-signature
   Step-wizard UI:
     Step 1 — Create signature (Draw / Type / Upload)
     Step 2 — Choose page & click to position
     Step 3 — Size, pages to apply & download
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'add-signature',
    downloadName: 'signed.pdf',
  };

  var _activeTab = 'draw';
  var _hasDrawn = false;
  var _sigUploadDataUrl = null;

  /* PDF preview / click-to-place state */
  var _previewPdf = null;
  var _previewPageIdx = 0;
  var _previewNumPages = 1;
  var _placement = null; // { xFrac, yFrac } click position on the page

  function getOptionsHTML(pageCount) {
    var pagesOptions = '<option value="current">Selected page only</option>' +
      '<option value="last">Last page only</option>' +
      '<option value="all">All pages</option>' +
      '<option value="custom">Custom page(s)</option>';
    return '<style>' +
      '.tg-sig-steps{display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid #e5e7eb;flex-wrap:wrap;}' +
      '.tg-sig-step{display:flex;align-items:center;gap:8px;padding:10px 16px;color:#9ca3af;font-size:14px;font-weight:500;}' +
      '.tg-sig-step.active{color:#F97316;border-bottom:2px solid #F97316;margin-bottom:-2px;}' +
      '.tg-sig-step-num{width:24px;height:24px;border-radius:50%;background:#e5e7eb;color:#6b7280;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}' +
      '.tg-sig-step.active .tg-sig-step-num{background:#F97316;color:#fff;}' +
      '.tg-sig-section{margin-bottom:20px;}' +
      '.tg-sig-section-title{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;margin-bottom:12px;color:inherit;}' +
      '.tg-sig-section-title .tg-sig-step-num{background:#F97316;color:#fff;}' +
      '.tg-sig-tab{padding:7px 18px;border:1.5px solid #d1d5db;border-radius:8px;background:transparent;cursor:pointer;font-size:14px;font-weight:600;color:inherit;transition:all .15s;}' +
      '.tg-sig-tab:hover{border-color:#F97316;color:#F97316;}' +
      '.tg-sig-tab--active{background:#F97316;color:#fff!important;border-color:#F97316;}' +
      '.tg-sig-thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;max-height:180px;overflow-y:auto;}' +
      '.tg-sig-thumb{border:2px solid #d1d5db;border-radius:6px;cursor:pointer;padding:2px;background:#fff;transition:border-color .15s;text-align:center;}' +
      '.tg-sig-thumb:hover{border-color:#fdba74;}' +
      '.tg-sig-thumb--active{border-color:#F97316;}' +
      '.tg-sig-thumb canvas{display:block;}' +
      '.tg-sig-thumb-label{font-size:11px;color:#6b7280;padding:2px 0;}' +
      '</style>' +

    /* ── STEP 1: create signature ── */
    '<div class="tg-sig-section">' +
      '<div class="tg-sig-section-title"><span class="tg-sig-step-num">1</span> Create Your Signature</div>' +
      '<div class="tg-sig-tabs" style="display:flex;gap:6px;margin-bottom:12px;">' +
        '<button type="button" class="tg-sig-tab tg-sig-tab--active" data-tab="draw">&#9997;&#65039; Draw</button>' +
        '<button type="button" class="tg-sig-tab" data-tab="type">&#9000;&#65039; Type</button>' +
        '<button type="button" class="tg-sig-tab" data-tab="upload">&#128228; Upload</button>' +
      '</div>' +
      '<div class="tg-sig-panel" id="sig-panel-draw">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">' +
          '<label class="tg-opt-label" style="margin:0">Color:</label>' +
          '<input type="color" id="sig-color" value="#000000" style="width:36px;height:28px;border:1px solid #ccc;border-radius:4px;">' +
          '<label class="tg-opt-label" style="margin:0">Width:</label>' +
          '<input type="range" id="sig-width" min="1" max="6" value="2" style="width:80px;">' +
          '<button type="button" id="sig-clear" class="tg-btn-sm tg-btn-outline" style="margin-left:auto;">&#128465;&#65039; Clear</button>' +
        '</div>' +
        '<canvas id="sig-canvas" width="400" height="150" style="border:1.5px dashed #d1d5db;border-radius:8px;cursor:crosshair;background:#fff;touch-action:none;max-width:100%;"></canvas>' +
        '<p style="font-size:12px;color:#9ca3af;margin:4px 0 0;">Draw your signature above with mouse or finger.</p>' +
      '</div>' +
      '<div class="tg-sig-panel" id="sig-panel-type" hidden>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="sig-name-input">Your name</label>' +
          '<input type="text" id="sig-name-input" class="tg-input" placeholder="Type your name..." style="font-size:18px;">' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label">Style</label>' +
          '<div class="tg-radio-group">' +
            '<label class="tg-radio-label"><input type="radio" name="sig-style" value="cursive" checked> <span>Script</span></label>' +
            '<label class="tg-radio-label"><input type="radio" name="sig-style" value="sans-serif"> <span>Print</span></label>' +
          '</div>' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label">Color</label>' +
          '<input type="color" id="sig-type-color" value="#000080" style="width:36px;height:28px;border:1px solid #ccc;border-radius:4px;">' +
        '</div>' +
        '<canvas id="sig-type-preview" width="400" height="80" style="border:1px solid #e5e7eb;border-radius:8px;background:#fff;max-width:100%;margin-top:8px;"></canvas>' +
      '</div>' +
      '<div class="tg-sig-panel" id="sig-panel-upload" hidden>' +
        '<label class="tg-opt-label">Upload signature image (PNG/JPG)</label>' +
        '<input type="file" id="sig-upload-input" accept="image/*" class="tg-input">' +
        '<img id="sig-upload-preview" src="" alt="" style="max-width:300px;max-height:100px;margin-top:8px;border:1px solid #e5e7eb;border-radius:6px;display:none;">' +
      '</div>' +
    '</div>' +

    /* ── STEP 2: choose page & position ── */
    '<div class="tg-sig-section" id="sig-pdf-preview" hidden>' +
      '<div class="tg-sig-section-title"><span class="tg-sig-step-num">2</span> Choose Page &amp; Click to Position</div>' +
      '<div class="tg-sig-thumbs" id="sig-thumbs"></div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
        '<button type="button" id="sig-prev-page" class="tg-btn-sm tg-btn-outline">&#8592; Prev</button>' +
        '<span id="sig-page-info" style="font-size:13px;">Page 1</span>' +
        '<button type="button" id="sig-next-page" class="tg-btn-sm tg-btn-outline">Next &#8594;</button>' +
        '<span id="sig-pos-info" style="margin-left:auto;font-size:12px;color:#6b7280;"></span>' +
      '</div>' +
      '<div id="sig-preview-canvas-wrap" style="position:relative;display:inline-block;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;">' +
        '<canvas id="sig-preview-canvas" style="display:block;cursor:crosshair;max-width:100%;"></canvas>' +
        '<div id="sig-preview-marker" hidden style="position:absolute;pointer-events:none;border:2px dashed #F97316;background:rgba(249,115,22,0.15);transform:translate(-50%,-50%);border-radius:4px;"></div>' +
      '</div>' +
      '<p style="font-size:12px;color:#9ca3af;margin:6px 0 0;">Click on the page where you want your signature. Use the thumbnails or Prev/Next to change page.</p>' +
    '</div>' +

    /* ── STEP 3: options ── */
    '<div class="tg-sig-section">' +
      '<div class="tg-sig-section-title"><span class="tg-sig-step-num">3</span> Size, Pages &amp; Download</div>' +
      '<div class="tg-opt-section">' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="sig-position-sel">Position</label>' +
          '<select id="sig-position-sel" class="tg-select">' +
            '<option value="custom">Where I clicked (custom X/Y)</option>' +
            '<option value="bottom-right" selected>Bottom Right</option>' +
            '<option value="bottom-center">Bottom Center</option>' +
            '<option value="bottom-left">Bottom Left</option>' +
          '</select>' +
        '</div>' +
        '<div id="sig-custom-pos" hidden style="display:flex;gap:12px;">' +
          '<label style="font-size:13px;">X%: <input type="number" id="sig-custom-x" min="0" max="100" value="70" style="width:64px;"></label>' +
          '<label style="font-size:13px;">Y%: <input type="number" id="sig-custom-y" min="0" max="100" value="85" style="width:64px;"></label>' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label" for="sig-pages-sel">Apply to pages</label>' +
          '<select id="sig-pages-sel" class="tg-select">' + pagesOptions + '</select>' +
        '</div>' +
        '<div id="sig-custom-pages-wrap" hidden>' +
          '<input type="text" id="sig-custom-pages" class="tg-input" placeholder="e.g. 1,3,5-8">' +
        '</div>' +
        '<div class="tg-opt-row">' +
          '<label class="tg-opt-label">Signature size</label>' +
          '<div class="tg-slider-wrap">' +
            '<input type="range" id="sig-size" class="tg-slider" min="50" max="300" value="150">' +
            '<span id="sig-size-label" class="tg-slider-value">150px</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderSigPreview(optionsEl) {
    if (!_previewPdf) return;
    var canvas = optionsEl.querySelector('#sig-preview-canvas');
    var info = optionsEl.querySelector('#sig-page-info');
    if (!canvas) return;
    _previewPdf.getPage(_previewPageIdx + 1).then(function (page) {
      var vp = page.getViewport({ scale: 1.0 });
      var scale = Math.min(460 / vp.width, 560 / vp.height, 1.5);
      var rvp = page.getViewport({ scale: scale });
      canvas.width = rvp.width;
      canvas.height = rvp.height;
      page.render({ canvasContext: canvas.getContext('2d'), viewport: rvp });
      if (info) info.textContent = 'Page ' + (_previewPageIdx + 1) + ' of ' + _previewNumPages;
      highlightThumb(optionsEl);
      updatePreviewMarker(optionsEl);
    }).catch(function () {});
  }

  function highlightThumb(optionsEl) {
    optionsEl.querySelectorAll('.tg-sig-thumb').forEach(function (t, i) {
      t.classList.toggle('tg-sig-thumb--active', i === _previewPageIdx);
    });
  }

  function updatePreviewMarker(optionsEl) {
    var marker = optionsEl.querySelector('#sig-preview-marker');
    var canvas = optionsEl.querySelector('#sig-preview-canvas');
    var posInfo = optionsEl.querySelector('#sig-pos-info');
    if (!marker || !canvas) return;
    if (!_placement) {
      marker.hidden = true;
      if (posInfo) posInfo.textContent = '';
      return;
    }
    var szSlider = optionsEl.querySelector('#sig-size');
    var sigW = szSlider ? parseInt(szSlider.value, 10) : 150;
    var wpx = canvas.offsetWidth || canvas.width;
    var scaleFactor = wpx / (canvas.width || 1);
    marker.hidden = false;
    marker.style.left = (_placement.xFrac * 100) + '%';
    marker.style.top = (_placement.yFrac * 100) + '%';
    marker.style.width = Math.max(20, sigW * 0.4 * scaleFactor) + 'px';
    marker.style.height = Math.max(10, sigW * 0.15 * scaleFactor) + 'px';
    if (posInfo) posInfo.textContent = 'Position: ' + Math.round(_placement.xFrac * 100) + '%, ' + Math.round(_placement.yFrac * 100) + '%';
  }

  function buildThumbnails(optionsEl) {
    var wrap = optionsEl.querySelector('#sig-thumbs');
    if (!wrap || !_previewPdf) return;
    wrap.innerHTML = '';
    var maxThumbs = Math.min(_previewNumPages, 24);
    /* Cells are created synchronously in page order (async rendering
       fills them in later) so thumbnail order always matches page order. */
    var makeThumb = function (idx) {
      var cell = document.createElement('div');
      cell.className = 'tg-sig-thumb' + (idx === _previewPageIdx ? ' tg-sig-thumb--active' : '');
      var c = document.createElement('canvas');
      c.width = 70;
      c.height = 95;
      cell.appendChild(c);
      var lbl = document.createElement('div');
      lbl.className = 'tg-sig-thumb-label';
      lbl.textContent = String(idx + 1);
      cell.appendChild(lbl);
      cell.addEventListener('click', function () {
        _previewPageIdx = idx;
        renderSigPreview(optionsEl);
      });
      wrap.appendChild(cell);
      _previewPdf.getPage(idx + 1).then(function (page) {
        var vp = page.getViewport({ scale: 1.0 });
        var scale = Math.min(70 / vp.width, 95 / vp.height);
        var rvp = page.getViewport({ scale: scale });
        c.width = rvp.width;
        c.height = rvp.height;
        page.render({ canvasContext: c.getContext('2d'), viewport: rvp });
      }).catch(function () {});
    };
    for (var i = 0; i < maxThumbs; i++) makeThumb(i);
    if (_previewNumPages > maxThumbs) {
      var more = document.createElement('div');
      more.className = 'tg-sig-thumb-label';
      more.style.cssText = 'align-self:center;padding:0 6px;';
      more.textContent = '+' + (_previewNumPages - maxThumbs) + ' more (use Prev/Next)';
      wrap.appendChild(more);
    }
  }

  function initPreview(file, optionsEl) {
    if (!window.pdfjsLib) return;
    var wrap = optionsEl.querySelector('#sig-pdf-preview');
    file.arrayBuffer().then(function (ab) {
      return pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
    }).then(function (pdf) {
      _previewPdf = pdf;
      _previewNumPages = pdf.numPages;
      _previewPageIdx = 0;
      if (wrap) wrap.hidden = false;
      buildThumbnails(optionsEl);
      renderSigPreview(optionsEl);
    }).catch(function () {});
  }

  function wireOptions(optionsEl) {
    var c = optionsEl.querySelector('#sig-canvas');
    if (!c || c.dataset.wired) return;
    c.dataset.wired = '1';

    _activeTab = 'draw';
    _hasDrawn = false;
    _sigUploadDataUrl = null;
    _placement = null;
    _previewPageIdx = 0;

    /* PDF preview navigation + click-to-place */
    var prevBtn = optionsEl.querySelector('#sig-prev-page');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (_previewPageIdx > 0) { _previewPageIdx--; renderSigPreview(optionsEl); }
    });
    var nextBtn = optionsEl.querySelector('#sig-next-page');
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (_previewPageIdx < _previewNumPages - 1) { _previewPageIdx++; renderSigPreview(optionsEl); }
    });
    var previewCanvas = optionsEl.querySelector('#sig-preview-canvas');
    if (previewCanvas) previewCanvas.addEventListener('click', function (e) {
      var r = previewCanvas.getBoundingClientRect();
      _placement = {
        xFrac: Math.max(0, Math.min((e.clientX - r.left) / r.width, 1)),
        yFrac: Math.max(0, Math.min((e.clientY - r.top) / r.height, 1)),
      };
      /* Sync the custom-position controls so run() picks it up */
      var posSel2 = optionsEl.querySelector('#sig-position-sel');
      if (posSel2) {
        posSel2.value = 'custom';
        var cp = optionsEl.querySelector('#sig-custom-pos');
        if (cp) cp.hidden = false;
      }
      var cx = optionsEl.querySelector('#sig-custom-x');
      var cy = optionsEl.querySelector('#sig-custom-y');
      if (cx) cx.value = Math.round(_placement.xFrac * 100);
      if (cy) cy.value = Math.round(_placement.yFrac * 100);
      /* Default the apply-to selector to the shown page */
      var pgSel2 = optionsEl.querySelector('#sig-pages-sel');
      if (pgSel2 && (pgSel2.value === 'last' || pgSel2.value === 'all')) pgSel2.value = 'current';
      updatePreviewMarker(optionsEl);
    });

    /* Signature tabs */
    var tabs = optionsEl.querySelectorAll('.tg-sig-tab');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('tg-sig-tab--active'); });
        t.classList.add('tg-sig-tab--active');
        optionsEl.querySelectorAll('.tg-sig-panel').forEach(function (p) { p.hidden = true; });
        var panel = optionsEl.querySelector('#sig-panel-' + t.dataset.tab);
        if (panel) panel.hidden = false;
        _activeTab = t.dataset.tab;
      });
    });

    /* Draw canvas — smooth strokes */
    var ctx = c.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var drawing = false, lx = 0, ly = 0;

    function getPos(e) {
      var r = c.getBoundingClientRect();
      var cl = e.touches ? e.touches[0] : e;
      return {
        x: (cl.clientX - r.left) * (c.width / r.width),
        y: (cl.clientY - r.top) * (c.height / r.height),
      };
    }

    c.addEventListener('mousedown', function (e) {
      drawing = true;
      _hasDrawn = true;
      var p = getPos(e);
      lx = p.x; ly = p.y;
      ctx.beginPath();
      ctx.arc(lx, ly, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    });
    c.addEventListener('mousemove', function (e) {
      if (!drawing) return;
      var p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(lx, ly, p.x, p.y);
      ctx.stroke();
      lx = p.x; ly = p.y;
    });
    document.addEventListener('mouseup', function () { drawing = false; });
    c.addEventListener('touchstart', function (e) {
      e.preventDefault();
      drawing = true;
      _hasDrawn = true;
      var p = getPos(e);
      lx = p.x; ly = p.y;
    }, { passive: false });
    c.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (!drawing) return;
      var p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lx = p.x; ly = p.y;
    }, { passive: false });
    c.addEventListener('touchend', function () { drawing = false; });

    var clearBtn = optionsEl.querySelector('#sig-clear');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      ctx.clearRect(0, 0, c.width, c.height);
      _hasDrawn = false;
    });
    var colorInput = optionsEl.querySelector('#sig-color');
    if (colorInput) colorInput.addEventListener('input', function (e) {
      ctx.strokeStyle = e.target.value;
      ctx.fillStyle = e.target.value;
    });
    var widthInput = optionsEl.querySelector('#sig-width');
    if (widthInput) widthInput.addEventListener('input', function (e) {
      ctx.lineWidth = parseInt(e.target.value, 10);
    });

    /* Type tab */
    function updateTypePreview() {
      var nameEl = optionsEl.querySelector('#sig-name-input');
      var styleEl = optionsEl.querySelector('input[name="sig-style"]:checked');
      var colorEl = optionsEl.querySelector('#sig-type-color');
      var previewC = optionsEl.querySelector('#sig-type-preview');
      if (!nameEl || !previewC) return;
      var pCtx = previewC.getContext('2d');
      pCtx.clearRect(0, 0, previewC.width, previewC.height);
      var font = styleEl ? styleEl.value : 'cursive';
      pCtx.font = '36px ' + font;
      pCtx.fillStyle = colorEl ? colorEl.value : '#000080';
      pCtx.fillText(nameEl.value || 'Your Signature', 10, 55);
    }
    var ni = optionsEl.querySelector('#sig-name-input');
    if (ni) ni.addEventListener('input', updateTypePreview);
    var tcEl = optionsEl.querySelector('#sig-type-color');
    if (tcEl) tcEl.addEventListener('input', updateTypePreview);
    optionsEl.querySelectorAll('input[name="sig-style"]').forEach(function (r) {
      r.addEventListener('change', updateTypePreview);
    });
    updateTypePreview();

    /* Upload tab */
    var ui = optionsEl.querySelector('#sig-upload-input');
    if (ui) ui.addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var img = optionsEl.querySelector('#sig-upload-preview');
        if (img) { img.src = ev.target.result; img.style.display = 'block'; }
        _sigUploadDataUrl = ev.target.result;
      };
      reader.readAsDataURL(f);
    });

    /* Position / pages / size */
    var posSel = optionsEl.querySelector('#sig-position-sel');
    if (posSel) posSel.addEventListener('change', function () {
      var cp = optionsEl.querySelector('#sig-custom-pos');
      if (cp) cp.hidden = posSel.value !== 'custom';
    });
    var pgSel = optionsEl.querySelector('#sig-pages-sel');
    if (pgSel) pgSel.addEventListener('change', function () {
      var cpw = optionsEl.querySelector('#sig-custom-pages-wrap');
      if (cpw) cpw.hidden = pgSel.value !== 'custom';
    });
    var szSlider = optionsEl.querySelector('#sig-size');
    if (szSlider) szSlider.addEventListener('input', function () {
      var lbl = optionsEl.querySelector('#sig-size-label');
      if (lbl) lbl.textContent = szSlider.value + 'px';
      updatePreviewMarker(optionsEl);
    });
  }

  function onFileReady(file, optionsEl) {
    if (!optionsEl) return;
    wireOptions(optionsEl);
    if (file) initPreview(file, optionsEl);
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var pos = optionsEl.querySelector('#sig-position-sel');
    var pages = optionsEl.querySelector('#sig-pages-sel');
    var customPages = optionsEl.querySelector('#sig-custom-pages');
    var sizeSlider = optionsEl.querySelector('#sig-size');
    var customX = optionsEl.querySelector('#sig-custom-x');
    var customY = optionsEl.querySelector('#sig-custom-y');
    var activeTab = _activeTab || 'draw';

    var sigDataUrl = null;
    var drawCanvas = optionsEl.querySelector('#sig-canvas');
    var typeCanvas = optionsEl.querySelector('#sig-type-preview');
    var nameInput = optionsEl.querySelector('#sig-name-input');
    if (activeTab === 'draw' && drawCanvas && _hasDrawn) {
      sigDataUrl = drawCanvas.toDataURL('image/png');
    } else if (activeTab === 'type' && typeCanvas && nameInput && nameInput.value.trim()) {
      sigDataUrl = typeCanvas.toDataURL('image/png');
    } else if (activeTab === 'upload' && _sigUploadDataUrl) {
      sigDataUrl = _sigUploadDataUrl;
    }

    return {
      sigDataUrl: sigDataUrl,
      position: pos ? pos.value : 'bottom-right',
      customX: customX ? parseInt(customX.value, 10) : 70,
      customY: customY ? parseInt(customY.value, 10) : 85,
      pagesMode: pages ? pages.value : 'current',
      customPagesStr: customPages ? customPages.value : '',
      sigWidth: sizeSlider ? parseInt(sizeSlider.value, 10) : 150,
      previewPageIdx: _previewPageIdx,
    };
  }

  function parsePageRange(rangeStr, total) {
    var pages = [];
    rangeStr.split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
          if (i >= 1 && i <= total) pages.push(i - 1);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n - 1);
      }
    });
    return pages;
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded. Please refresh the page.');

    if (!options.sigDataUrl) {
      throw new Error('Please create a signature first (Step 1): draw, type or upload one.');
    }

    onProgress && onProgress(0.1, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    var pages = pdfDoc.getPages();
    var totalPages = pages.length;

    var targetPageIndices;
    if (options.pagesMode === 'all') {
      targetPageIndices = pages.map(function (_, i) { return i; });
    } else if (options.pagesMode === 'current') {
      var idx = Math.max(0, Math.min(options.previewPageIdx || 0, totalPages - 1));
      targetPageIndices = [idx];
    } else if (options.pagesMode === 'custom' && options.customPagesStr) {
      targetPageIndices = parsePageRange(options.customPagesStr, totalPages);
    } else {
      targetPageIndices = [totalPages - 1]; // last page
    }
    if (!targetPageIndices.length) targetPageIndices = [totalPages - 1];

    onProgress && onProgress(0.3, 'Embedding signature...');

    if (!/^data:image\/(png|jpeg|jpg);base64,/.test(options.sigDataUrl)) {
      throw new Error('Unsupported signature image format. Please use a PNG or JPG image.');
    }

    var base64 = options.sigDataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    var bytes = Uint8Array.from(atob(base64), function (ch) { return ch.charCodeAt(0); });

    var sigImage;
    if (options.sigDataUrl.startsWith('data:image/png')) {
      sigImage = await pdfDoc.embedPng(bytes);
    } else {
      sigImage = await pdfDoc.embedJpg(bytes);
    }

    var targetWidth = options.sigWidth;
    var dims = sigImage.scaleToFit(targetWidth, targetWidth * (sigImage.height / sigImage.width));

    for (var i = 0; i < targetPageIndices.length; i++) {
      onProgress && onProgress(0.3 + i / targetPageIndices.length * 0.6, 'Signing page ' + (targetPageIndices[i] + 1) + '...');
      var page = pages[targetPageIndices[i]];
      var pageSize = page.getSize();

      var x, y;
      if (options.position === 'bottom-right') {
        x = pageSize.width - dims.width - 20;
        y = 20;
      } else if (options.position === 'bottom-center') {
        x = (pageSize.width - dims.width) / 2;
        y = 20;
      } else if (options.position === 'bottom-left') {
        x = 20;
        y = 20;
      } else {
        /* Click position marks the signature center */
        x = (options.customX / 100) * pageSize.width - dims.width / 2;
        y = (1 - options.customY / 100) * pageSize.height - dims.height / 2;
        x = Math.max(0, Math.min(x, pageSize.width - dims.width));
        y = Math.max(0, Math.min(y, pageSize.height - dims.height));
      }

      page.drawImage(sigImage, { x: x, y: y, width: dims.width, height: dims.height });
    }

    onProgress && onProgress(0.95, 'Saving signed PDF...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress && onProgress(1.0, 'Done! PDF signed successfully.');
    return {
      blob: blob,
      filename: file.name.replace(/\.pdf$/i, '') + '-signed.pdf',
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, wireOptions: wireOptions, CONFIG: CONFIG };
})();

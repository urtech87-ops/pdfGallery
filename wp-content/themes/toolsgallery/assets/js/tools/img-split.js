/**
 * ToolsGallery — Split Image
 * Handler: img-split
 * URL: /tool/split-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-split' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Split Mode</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="isp-mode" value="grid" checked> Grid</label>' +
        '<label><input type="radio" name="isp-mode" value="h"> Equal Halves (Horizontal)</label>' +
        '<label><input type="radio" name="isp-mode" value="v"> Equal Halves (Vertical)</label>' +
      '</div>' +
    '</div>' +
    '<div id="isp-grid-wrap">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="isp-grid">Grid Preset</label>' +
        '<select id="isp-grid" class="tg-select">' +
          '<option value="2x2">2×2 (4 pieces)</option>' +
          '<option value="3x3">3×3 (9 pieces)</option>' +
          '<option value="4x4">4×4 (16 pieces)</option>' +
          '<option value="custom">Custom...</option>' +
        '</select>' +
      '</div>' +
      '<div id="isp-custom-wrap" hidden style="display:flex;gap:12px">' +
        '<div class="tg-opt-row"><label class="tg-opt-label" for="isp-rows">Rows</label><input type="number" id="isp-rows" class="tg-text-input" value="2" min="1" max="10" style="width:70px"></div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label" for="isp-cols">Cols</label><input type="number" id="isp-cols" class="tg-text-input" value="2" min="1" max="10" style="width:70px"></div>' +
      '</div>' +
    '</div>' +
    '<div id="isp-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="isp-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>';
  }

  function wireOptions(container) {
    container.querySelectorAll('input[name="isp-mode"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var g = container.querySelector('#isp-grid-wrap');
        if (g) g.hidden = r.value !== 'grid';
      });
    });
    var gs = container.querySelector('#isp-grid');
    var cw = container.querySelector('#isp-custom-wrap');
    if (gs && cw) gs.addEventListener('change', function () { cw.hidden = gs.value !== 'custom'; });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var mode = optionsEl.querySelector('input[name="isp-mode"]:checked');
    var grid = optionsEl.querySelector('#isp-grid');
    var rows = optionsEl.querySelector('#isp-rows');
    var cols = optionsEl.querySelector('#isp-cols');

    var modeVal = mode ? mode.value : 'grid';
    var gridVal = grid ? grid.value : '2x2';
    var gridRows = 2, gridCols = 2;

    if (modeVal === 'grid') {
      if (gridVal === 'custom') {
        gridRows = rows ? parseInt(rows.value) || 2 : 2;
        gridCols = cols ? parseInt(cols.value) || 2 : 2;
      } else {
        var parts = gridVal.split('x');
        gridRows = parseInt(parts[0]) || 2;
        gridCols = parseInt(parts[1]) || 2;
      }
    } else if (modeVal === 'h') { gridRows = 2; gridCols = 1; }
    else if (modeVal === 'v') { gridRows = 1; gridCols = 2; }

    return { mode: modeVal, rows: gridRows, cols: gridCols };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = async function () {
        URL.revokeObjectURL(url);

        var rows = options.rows || 2, cols = options.cols || 2;
        var pw = Math.floor(img.width / cols), ph = Math.floor(img.height / rows);

        // Show grid overlay preview
        var previewEl = document.getElementById('isp-preview');
        var previewWrap = document.getElementById('isp-preview-wrap');
        if (previewEl && previewWrap) {
          var maxW = 400; var sc = Math.min(1, maxW / img.width);
          previewEl.width = Math.round(img.width * sc); previewEl.height = Math.round(img.height * sc);
          var pCtx = previewEl.getContext('2d');
          pCtx.drawImage(img, 0, 0, previewEl.width, previewEl.height);
          pCtx.strokeStyle = '#E07B39'; pCtx.lineWidth = 2;
          for (var r = 1; r < rows; r++) { var y = Math.round(r * ph * sc); pCtx.beginPath(); pCtx.moveTo(0, y); pCtx.lineTo(previewEl.width, y); pCtx.stroke(); }
          for (var c = 1; c < cols; c++) { var x = Math.round(c * pw * sc); pCtx.beginPath(); pCtx.moveTo(x, 0); pCtx.lineTo(x, previewEl.height); pCtx.stroke(); }
          previewWrap.style.display = 'block';
        }

        if (!window.JSZip) { reject(new Error('JSZip not loaded')); return; }

        onProgress && onProgress(0.3, 'Splitting image...');
        var zip = new JSZip();
        var total = rows * cols;
        var count = 0;

        for (var ri = 0; ri < rows; ri++) {
          for (var ci = 0; ci < cols; ci++) {
            var sx = ci * pw, sy = ri * ph;
            var sw = (ci === cols - 1) ? img.width - sx : pw;
            var sh = (ri === rows - 1) ? img.height - sy : ph;

            var piece = document.createElement('canvas');
            piece.width = sw; piece.height = sh;
            piece.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

            var pieceBlob = await new Promise(function (res) { piece.toBlob(function (b) { res(b); }, 'image/jpeg', 0.92); });
            zip.file('piece-' + (ri+1) + '-' + (ci+1) + '.jpg', pieceBlob);
            count++;
            onProgress && onProgress(0.3 + count / total * 0.6, 'Processing piece ' + count + ' of ' + total + '...');
          }
        }

        var zipBlob = await zip.generateAsync({ type: 'blob' });
        onProgress && onProgress(1, 'Done!');
        resolve({ blob: zipBlob, filename: file.name.replace(/\.[^.]+$/, '') + '-split.zip' });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

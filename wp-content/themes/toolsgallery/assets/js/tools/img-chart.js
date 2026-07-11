/**
 * ToolsGallery — Chart Maker
 * Handler: img-chart
 * URL: /tool/chart-maker/
 * Input type: data (no file upload) — self-contained init() tool.
 *
 * Editable data grid + full customisation with a live Chart.js preview
 * that re-renders on every change. The previous Chart instance is
 * destroyed before each render (_chartInstance) to avoid leaks.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-chart', inputType: 'data' };
  var _chartInstance = null;

  var CHARTJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';

  var CHART_TYPES = [
    { value: 'bar',        label: 'Bar' },
    { value: 'hbar',       label: 'Horizontal Bar' },
    { value: 'line',       label: 'Line' },
    { value: 'area',       label: 'Area' },
    { value: 'pie',        label: 'Pie' },
    { value: 'doughnut',   label: 'Doughnut' },
    { value: 'radar',      label: 'Radar' },
    { value: 'polarArea',  label: 'Polar Area' },
  ];

  var PALETTES = {
    default: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ac'],
    pastel: ['#aec6cf','#ffb347','#b39eb5','#ff6961','#77dd77','#fdfd96','#84b6f4','#fdcae1','#cfcfc4','#836953'],
    dark: ['#2c3e50','#e74c3c','#27ae60','#f39c12','#8e44ad','#16a085','#d35400','#2980b9','#c0392b','#1abc9c'],
    vivid: ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#42d4f4','#f032e6','#bfef45','#fabed4'],
  };

  var DEFAULT_ROWS = [
    { label: 'Category A', value: 40 },
    { label: 'Category B', value: 65 },
    { label: 'Category C', value: 30 },
    { label: 'Category D', value: 80 },
    { label: 'Category E', value: 55 },
  ];

  function escAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function init(box) {
    var optionsEl = box.querySelector('.tg-options');
    if (!optionsEl) return;
    optionsEl.hidden = false;

    var typeOpts = CHART_TYPES.map(function (t) {
      return '<option value="' + t.value + '">' + t.label + '</option>';
    }).join('');
    var paletteOpts = Object.keys(PALETTES).map(function (p) {
      return '<option value="' + p + '">' + p.charAt(0).toUpperCase() + p.slice(1) + '</option>';
    }).join('');

    optionsEl.innerHTML =
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ict-type">Chart Type</label>' +
        '<select id="ict-type" class="tg-select">' + typeOpts + '</select>' +
        '<label class="tg-opt-label" for="ict-palette" style="margin-left:16px">Palette</label>' +
        '<select id="ict-palette" class="tg-select">' + paletteOpts + '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ict-title">Title</label>' +
        '<input type="text" id="ict-title" class="tg-text-input" value="My Chart" placeholder="Chart title" style="flex:1">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ict-xlabel">X Axis Label</label>' +
        '<input type="text" id="ict-xlabel" class="tg-text-input" placeholder="e.g. Month" style="flex:1">' +
        '<label class="tg-opt-label" for="ict-ylabel" style="margin-left:12px">Y Axis Label</label>' +
        '<input type="text" id="ict-ylabel" class="tg-text-input" placeholder="e.g. Sales" style="flex:1">' +
      '</div>' +

      '<div style="margin-top:10px">' +
        '<label class="tg-opt-label">Data</label>' +
        '<table id="ict-grid" style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">' +
          '<thead><tr style="background:#f5f5f5">' +
            '<th style="padding:4px 8px;text-align:left;border:1px solid #ddd">Label</th>' +
            '<th style="padding:4px 8px;text-align:left;border:1px solid #ddd;width:110px">Value</th>' +
            '<th style="padding:4px 8px;border:1px solid #ddd;width:60px">Color</th>' +
            '<th style="padding:4px 8px;border:1px solid #ddd;width:36px"></th>' +
          '</tr></thead>' +
          '<tbody id="ict-grid-body"></tbody>' +
        '</table>' +
        '<button type="button" class="tg-btn-secondary" id="ict-add-row" style="margin-top:6px;font-size:12px">+ Add Row</button>' +
        '<details style="margin-top:8px"><summary class="tg-opt-label" style="cursor:pointer">Paste data (label,value per line)</summary>' +
          '<textarea id="ict-paste" class="tg-text-input" rows="4" style="width:100%;font-family:monospace;font-size:12px;margin-top:4px" placeholder="January,120&#10;February,90"></textarea>' +
          '<button type="button" class="tg-btn-secondary" id="ict-paste-apply" style="margin-top:4px;font-size:12px">Apply to Grid</button>' +
        '</details>' +
      '</div>' +

      '<div class="tg-opt-row" style="margin-top:10px">' +
        '<label><input type="checkbox" id="ict-legend" checked> Legend</label>' +
        '<select id="ict-legend-pos" class="tg-select" style="margin-left:6px">' +
          '<option value="top" selected>Top</option><option value="bottom">Bottom</option>' +
          '<option value="left">Left</option><option value="right">Right</option>' +
        '</select>' +
        '<label style="margin-left:16px"><input type="checkbox" id="ict-grid-lines" checked> Gridlines</label>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ict-w">Width: <span id="ict-w-val">800</span>px</label>' +
        '<input type="range" id="ict-w" min="400" max="2000" step="100" value="800" style="flex:1">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ict-h">Height: <span id="ict-h-val">500</span>px</label>' +
        '<input type="range" id="ict-h" min="300" max="1500" step="100" value="500" style="flex:1">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="ict-bg">Background</label>' +
        '<input type="color" id="ict-bg" value="#ffffff">' +
        '<label class="tg-opt-label" for="ict-font" style="margin-left:16px">Font Size: <span id="ict-font-val">14</span></label>' +
        '<input type="range" id="ict-font" min="10" max="28" value="14" style="flex:1">' +
      '</div>' +

      '<div id="ict-error" class="tg-opt-info" hidden style="color:#dc2626"></div>' +
      '<div id="ict-preview-wrap" style="margin-top:12px">' +
        '<p class="tg-opt-info" id="ict-loading">Loading chart library...</p>' +
        '<div id="ict-canvas-holder" style="display:none;border:1px solid #ddd;border-radius:4px;padding:8px;overflow:auto">' +
          '<canvas id="ict-canvas" style="max-width:100%;height:auto"></canvas>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:12px;text-align:center">' +
        '<button type="button" class="tg-action-btn" id="ict-download" disabled>Download PNG</button>' +
      '</div>';

    var gridBody   = optionsEl.querySelector('#ict-grid-body');
    var typeEl     = optionsEl.querySelector('#ict-type');
    var paletteEl  = optionsEl.querySelector('#ict-palette');
    var titleEl    = optionsEl.querySelector('#ict-title');
    var xLabelEl   = optionsEl.querySelector('#ict-xlabel');
    var yLabelEl   = optionsEl.querySelector('#ict-ylabel');
    var legendEl   = optionsEl.querySelector('#ict-legend');
    var legendPosEl = optionsEl.querySelector('#ict-legend-pos');
    var gridLinesEl = optionsEl.querySelector('#ict-grid-lines');
    var wEl        = optionsEl.querySelector('#ict-w');
    var hEl        = optionsEl.querySelector('#ict-h');
    var bgEl       = optionsEl.querySelector('#ict-bg');
    var fontEl     = optionsEl.querySelector('#ict-font');
    var canvas     = optionsEl.querySelector('#ict-canvas');
    var holder     = optionsEl.querySelector('#ict-canvas-holder');
    var loadingEl  = optionsEl.querySelector('#ict-loading');
    var errEl      = optionsEl.querySelector('#ict-error');
    var dlBtn      = optionsEl.querySelector('#ict-download');

    /* ── Data grid ── */
    function paletteColor(i) {
      var colors = PALETTES[paletteEl.value] || PALETTES.default;
      return colors[i % colors.length];
    }

    function addRow(label, value, color) {
      var idx = gridBody.children.length;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td style="padding:2px;border:1px solid #ddd"><input type="text" class="ict-row-label tg-text-input" value="' + escAttr(label) + '" style="width:100%;border:none;padding:4px 6px;font-size:13px"></td>' +
        '<td style="padding:2px;border:1px solid #ddd"><input type="number" class="ict-row-value tg-text-input" value="' + escAttr(value) + '" step="any" style="width:100%;border:none;padding:4px 6px;font-size:13px"></td>' +
        '<td style="padding:2px;border:1px solid #ddd;text-align:center"><input type="color" class="ict-row-color" value="' + (color || paletteColor(idx)) + '" style="width:32px;height:24px;border:none;padding:0;cursor:pointer"></td>' +
        '<td style="padding:2px;border:1px solid #ddd;text-align:center"><button type="button" class="ict-row-del" title="Remove row" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:16px;line-height:1">&times;</button></td>';
      gridBody.appendChild(tr);

      tr.querySelector('.ict-row-del').addEventListener('click', function () {
        if (gridBody.children.length <= 1) return; // keep at least one row
        tr.remove();
        scheduleRender();
      });
      tr.querySelectorAll('input').forEach(function (input) {
        input.addEventListener('input', scheduleRender);
      });
    }

    function readRows() {
      var rows = [];
      gridBody.querySelectorAll('tr').forEach(function (tr) {
        var label = tr.querySelector('.ict-row-label').value.trim();
        var value = parseFloat(tr.querySelector('.ict-row-value').value);
        var color = tr.querySelector('.ict-row-color').value;
        if (label && !isNaN(value)) rows.push({ label: label, value: value, color: color });
      });
      return rows;
    }

    function resetRowColors() {
      gridBody.querySelectorAll('.ict-row-color').forEach(function (input, i) {
        input.value = paletteColor(i);
      });
    }

    DEFAULT_ROWS.forEach(function (r, i) { addRow(r.label, r.value, paletteColor(i)); });

    optionsEl.querySelector('#ict-add-row').addEventListener('click', function () {
      addRow('Label ' + (gridBody.children.length + 1), 10);
      scheduleRender();
    });

    optionsEl.querySelector('#ict-paste-apply').addEventListener('click', function () {
      var text = optionsEl.querySelector('#ict-paste').value;
      var parsed = [];
      text.split('\n').forEach(function (line) {
        line = line.trim();
        if (!line) return;
        var comma = line.lastIndexOf(',');
        if (comma === -1) return;
        var label = line.slice(0, comma).trim();
        var val = parseFloat(line.slice(comma + 1).trim());
        if (label && !isNaN(val)) parsed.push({ label: label, value: val });
      });
      if (!parsed.length) return;
      gridBody.innerHTML = '';
      parsed.forEach(function (r, i) { addRow(r.label, r.value, paletteColor(i)); });
      scheduleRender();
    });

    /* ── Live render ── */
    function render() {
      if (!window.Chart) return;
      var rows = readRows();
      if (!rows.length) {
        errEl.textContent = 'Add at least one row with a label and a numeric value.';
        errEl.hidden = false;
        dlBtn.disabled = true;
        return;
      }
      errEl.hidden = true;

      var selType = typeEl.value;
      var chartType = selType === 'hbar' ? 'bar' : (selType === 'area' ? 'line' : selType);
      var isCircle = chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea';
      var isRadar = chartType === 'radar';
      var fontSize = parseInt(fontEl.value, 10) || 14;
      var width = parseInt(wEl.value, 10) || 800;
      var height = parseInt(hEl.value, 10) || 500;
      var showGrid = gridLinesEl.checked;

      var labels = rows.map(function (r) { return r.label; });
      var values = rows.map(function (r) { return r.value; });
      var colors = rows.map(function (r) { return r.color; });

      var dataset = {
        label: titleEl.value || 'Data',
        data: values,
        backgroundColor: (isCircle || chartType === 'bar') ? colors : colors[0] + '55',
        borderColor: (isCircle || chartType === 'bar') ? colors : colors[0],
        borderWidth: 2,
        pointBackgroundColor: colors,
        fill: selType === 'area' || isRadar ? true : (chartType === 'line' ? false : undefined),
        tension: chartType === 'line' ? 0.3 : undefined,
      };

      canvas.width = width;
      canvas.height = height;

      if (_chartInstance) { try { _chartInstance.destroy(); } catch (e) {} _chartInstance = null; }

      _chartInstance = new Chart(canvas.getContext('2d'), {
        type: chartType,
        data: { labels: labels, datasets: [dataset] },
        options: {
          responsive: false,
          animation: false,
          devicePixelRatio: 1,
          indexAxis: selType === 'hbar' ? 'y' : 'x',
          plugins: {
            legend: {
              display: legendEl.checked,
              position: legendPosEl.value,
              labels: { font: { size: fontSize } },
            },
            title: {
              display: !!titleEl.value,
              text: titleEl.value,
              font: { size: Math.round(fontSize * 1.4) },
            },
          },
          scales: (isCircle || isRadar) ? (isRadar ? {
            r: { grid: { display: showGrid }, ticks: { font: { size: fontSize } }, pointLabels: { font: { size: fontSize } } },
          } : {}) : {
            x: {
              grid: { display: showGrid },
              ticks: { font: { size: fontSize } },
              title: { display: !!xLabelEl.value, text: xLabelEl.value, font: { size: fontSize } },
            },
            y: {
              grid: { display: showGrid },
              ticks: { font: { size: fontSize } },
              title: { display: !!yLabelEl.value, text: yLabelEl.value, font: { size: fontSize } },
              beginAtZero: true,
            },
          },
        },
      });

      holder.style.display = 'block';
      holder.style.background = bgEl.value;
      dlBtn.disabled = false;
    }

    var _debounce = null;
    function scheduleRender() {
      clearTimeout(_debounce);
      _debounce = setTimeout(render, 150);
    }

    [typeEl, titleEl, xLabelEl, yLabelEl, legendEl, legendPosEl, gridLinesEl, wEl, hEl, bgEl, fontEl].forEach(function (input) {
      input.addEventListener('input', function () {
        if (input === wEl) optionsEl.querySelector('#ict-w-val').textContent = wEl.value;
        if (input === hEl) optionsEl.querySelector('#ict-h-val').textContent = hEl.value;
        if (input === fontEl) optionsEl.querySelector('#ict-font-val').textContent = fontEl.value;
        scheduleRender();
      });
      input.addEventListener('change', scheduleRender);
    });

    paletteEl.addEventListener('change', function () {
      resetRowColors();
      scheduleRender();
    });

    /* ── Download ── */
    dlBtn.addEventListener('click', function () {
      if (!_chartInstance) return;
      /* Chart.js renders on a transparent canvas — composite over the
         chosen background color at full resolution. */
      var out = document.createElement('canvas');
      out.width = canvas.width;
      out.height = canvas.height;
      var ctx = out.getContext('2d');
      ctx.fillStyle = bgEl.value;
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, 0, 0);
      out.toBlob(function (b) {
        if (!b) return;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        var safeName = (titleEl.value || 'chart').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
        a.download = safeName + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      }, 'image/png');
    });

    function ready() {
      loadingEl.style.display = 'none';
      render();
    }

    if (window.Chart) {
      ready();
    } else if (window.TGImageUtil) {
      TGImageUtil.loadScript(CHARTJS_CDN).then(ready).catch(function () {
        loadingEl.textContent = 'Could not load the chart library. Please check your connection and refresh.';
      });
    } else {
      loadingEl.textContent = 'Chart library not available. Please refresh the page.';
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init: init, CONFIG: CONFIG };
})();

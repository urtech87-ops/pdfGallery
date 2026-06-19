/**
 * ToolsGallery — Chart Maker
 * Handler: img-chart
 * URL: /tool/chart-maker/
 * Input type: data (no file upload)
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-chart', inputType: 'data' };
  var _chartInstance = null;

  var CHART_TYPES = ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea'];
  var DEFAULT_DATA = 'Category A,40\nCategory B,65\nCategory C,30\nCategory D,80\nCategory E,55';
  var PALETTES = {
    default: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ac'],
    pastel: ['#aec6cf','#ffb347','#b39eb5','#ff6961','#77dd77','#fdfd96','#84b6f4','#fdcae1','#cfcfc4','#836953'],
    dark: ['#2c3e50','#e74c3c','#27ae60','#f39c12','#8e44ad','#16a085','#d35400','#2980b9','#c0392b','#1abc9c'],
  };

  function getOptionsHTML() {
    var typeOpts = CHART_TYPES.map(function (t) {
      return '<option value="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>';
    }).join('');

    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ict-type">Chart Type</label>' +
      '<select id="ict-type" class="tg-select">' + typeOpts + '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ict-title">Title</label>' +
      '<input type="text" id="ict-title" class="tg-text-input" value="My Chart" placeholder="Chart title">' +
    '</div>' +
    '<div class="tg-opt-row" style="flex-direction:column;align-items:flex-start">' +
      '<label class="tg-opt-label" for="ict-data">Data (label,value — one per line)</label>' +
      '<textarea id="ict-data" class="tg-text-input" rows="6" style="width:100%;font-family:monospace;font-size:12px;margin-top:4px">' + DEFAULT_DATA + '</textarea>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="ict-palette">Color Palette</label>' +
      '<select id="ict-palette" class="tg-select">' +
        '<option value="default">Default</option>' +
        '<option value="pastel">Pastel</option>' +
        '<option value="dark">Dark</option>' +
      '</select>' +
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
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label><input type="checkbox" id="ict-legend" checked> Show Legend</label>' +
      '<label style="margin-left:12px"><input type="checkbox" id="ict-grid" checked> Show Grid</label>' +
    '</div>' +
    '<div id="ict-preview-wrap" style="margin-top:12px;display:none">' +
      '<canvas id="ict-preview" style="max-width:100%;border:1px solid #ddd;border-radius:4px"></canvas>' +
    '</div>' +
    '<script>(function(){' +
      'function link(id,vid){var s=document.getElementById(id),v=document.getElementById(vid);if(s&&v)s.addEventListener("input",function(){v.textContent=s.value;});}' +
      'link("ict-w","ict-w-val");link("ict-h","ict-h-val");' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var type = optionsEl.querySelector('#ict-type');
    var title = optionsEl.querySelector('#ict-title');
    var data = optionsEl.querySelector('#ict-data');
    var palette = optionsEl.querySelector('#ict-palette');
    var w = optionsEl.querySelector('#ict-w');
    var h = optionsEl.querySelector('#ict-h');
    var bg = optionsEl.querySelector('#ict-bg');
    var legend = optionsEl.querySelector('#ict-legend');
    var grid = optionsEl.querySelector('#ict-grid');
    return {
      chartType: type ? type.value : 'bar',
      title: title ? title.value : '',
      dataText: data ? data.value : DEFAULT_DATA,
      palette: palette ? palette.value : 'default',
      width: w ? parseInt(w.value) : 800,
      height: h ? parseInt(h.value) : 500,
      background: bg ? bg.value : '#ffffff',
      showLegend: legend ? legend.checked : true,
      showGrid: grid ? grid.checked : true,
    };
  }

  function parseData(text) {
    var labels = [], values = [];
    text.split('\n').forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var comma = line.lastIndexOf(',');
      if (comma === -1) return;
      var label = line.slice(0, comma).trim();
      var val = parseFloat(line.slice(comma + 1).trim());
      if (label && !isNaN(val)) { labels.push(label); values.push(val); }
    });
    return { labels: labels, values: values };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Building chart...');

    if (!window.Chart) throw new Error('Chart.js not loaded');

    var parsed = parseData(options.dataText || DEFAULT_DATA);
    if (!parsed.labels.length) throw new Error('No valid data. Format: Label,Value (one per line).');

    var colors = PALETTES[options.palette] || PALETTES.default;
    var bgColors = parsed.labels.map(function (_, i) { return colors[i % colors.length]; });

    var offscreen = document.createElement('canvas');
    offscreen.width = options.width;
    offscreen.height = options.height;
    var ctx = offscreen.getContext('2d');

    // Fill background
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, options.width, options.height);

    var isCircle = options.chartType === 'pie' || options.chartType === 'doughnut' || options.chartType === 'polarArea';

    var dataset = {
      data: parsed.values,
      backgroundColor: isCircle ? bgColors : bgColors.map(function(c){ return c + 'cc'; }),
      borderColor: bgColors,
      borderWidth: isCircle ? 2 : 2,
      fill: options.chartType === 'line' ? false : undefined,
      tension: options.chartType === 'line' ? 0.3 : undefined,
    };
    if (!isCircle) dataset.label = options.title || 'Data';

    if (_chartInstance) { try { _chartInstance.destroy(); } catch(e){} _chartInstance = null; }

    _chartInstance = new Chart(ctx, {
      type: options.chartType,
      data: { labels: parsed.labels, datasets: [dataset] },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: options.showLegend },
          title: { display: !!(options.title), text: options.title, font: { size: 18 } },
        },
        scales: isCircle ? {} : {
          x: { grid: { display: options.showGrid } },
          y: { grid: { display: options.showGrid }, beginAtZero: true },
        },
      },
    });

    // Give Chart.js a tick to render
    await new Promise(function (res) { setTimeout(res, 100); });

    // Preview
    var previewEl = document.getElementById('ict-preview');
    var previewWrap = document.getElementById('ict-preview-wrap');
    if (previewEl && previewWrap) {
      var maxW = 600; var sc = Math.min(1, maxW / offscreen.width);
      previewEl.width = Math.round(offscreen.width * sc);
      previewEl.height = Math.round(offscreen.height * sc);
      previewEl.getContext('2d').drawImage(offscreen, 0, 0, previewEl.width, previewEl.height);
      previewWrap.style.display = 'block';
    }

    var blob = await new Promise(function (res) { offscreen.toBlob(function (b) { res(b); }, 'image/png'); });
    onProgress && onProgress(1, 'Done!');
    var safeName = (options.title || 'chart').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    return { blob: blob, filename: safeName + '.png' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

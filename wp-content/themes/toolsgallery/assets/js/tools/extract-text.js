/**
 * ToolsGallery — Extract Text
 * Handler: extract-text
 * URL: /tool/extract-text/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'extract-text' };

  var _extracted = { plain: '', markdown: '', json: [] };
  var _activeTab = 'plain';

  function getOptionsHTML() {
    return '<div id="et-tabs" style="display:flex;gap:6px;margin-bottom:8px">' +
      '<button type="button" class="tg-btn-secondary et-tab et-tab--active" data-tab="plain">Plain Text</button>' +
      '<button type="button" class="tg-btn-secondary et-tab" data-tab="markdown">Markdown</button>' +
      '<button type="button" class="tg-btn-secondary et-tab" data-tab="json">JSON</button>' +
    '</div>' +
    '<div id="et-stats" style="font-size:12px;color:var(--color-gray-600);margin-bottom:6px"></div>' +
    '<textarea id="et-output" style="width:100%;min-height:200px;font-family:monospace;font-size:13px;border:1px solid #ddd;border-radius:6px;padding:8px;resize:vertical" readonly placeholder="Extracted text will appear here..."></textarea>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      '<button type="button" class="tg-btn-secondary" id="et-copy">Copy</button>' +
      '<button type="button" class="tg-btn-secondary" id="et-dl-txt">Download .txt</button>' +
      '<button type="button" class="tg-btn-secondary" id="et-dl-md">Download .md</button>' +
      '<button type="button" class="tg-btn-secondary" id="et-dl-json">Download .json</button>' +
    '</div>' +
    '<script>(function(){' +
      'var tabs=document.querySelectorAll(".et-tab");' +
      'tabs.forEach(function(b){b.addEventListener("click",function(){' +
        'tabs.forEach(function(x){x.classList.remove("et-tab--active");});' +
        'b.classList.add("et-tab--active");' +
        '_activeTab=b.dataset.tab;' +
        'if(window._etShowTab)window._etShowTab(b.dataset.tab);' +
      '});});' +
      'document.getElementById("et-copy").addEventListener("click",function(){' +
        'var ta=document.getElementById("et-output");if(!ta)return;' +
        'ta.select();document.execCommand("copy");' +
      '});' +
      'document.getElementById("et-dl-txt").addEventListener("click",function(){if(window._etDownload)window._etDownload("txt");});' +
      'document.getElementById("et-dl-md").addEventListener("click",function(){if(window._etDownload)window._etDownload("md");});' +
      'document.getElementById("et-dl-json").addEventListener("click",function(){if(window._etDownload)window._etDownload("json");});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    return {};
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    var total = pdf.numPages;

    _extracted = { plain: '', markdown: '', json: [] };

    for (var i = 1; i <= total; i++) {
      onProgress && onProgress(0.1 + (i / total) * 0.8, 'Extracting page ' + i + '...');
      var page = await pdf.getPage(i);
      var content = await page.getTextContent();

      var items = content.items;
      var lines = {};
      items.forEach(function (item) {
        if (!item.str) return;
        var y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item.str);
      });

      var ySorted = Object.keys(lines).map(Number).sort(function (a, b) { return b - a; });
      var pageText = ySorted.map(function (y) { return lines[y].join(' '); }).join('\n');

      _extracted.plain += (i > 1 ? '\n\n' : '') + '--- Page ' + i + ' ---\n' + pageText;
      _extracted.markdown += (i > 1 ? '\n\n' : '') + '## Page ' + i + '\n\n' + pageText;
      _extracted.json.push({ page: i, text: pageText });
    }

    var wordCount = _extracted.plain.split(/\s+/).filter(Boolean).length;
    var charCount = _extracted.plain.length;
    var statsEl = document.getElementById('et-stats');
    if (statsEl) statsEl.textContent = wordCount + ' words, ' + charCount + ' characters, ' + total + ' pages';

    window._etShowTab = function (tab) {
      var ta = document.getElementById('et-output');
      if (!ta) return;
      if (tab === 'json') ta.value = JSON.stringify(_extracted.json, null, 2);
      else if (tab === 'markdown') ta.value = _extracted.markdown;
      else ta.value = _extracted.plain;
    };

    var baseName = file.name.replace(/\.pdf$/i, '');
    window._etDownload = function (ext) {
      var content, mime, fname;
      if (ext === 'json') { content = JSON.stringify(_extracted.json, null, 2); mime = 'application/json'; fname = baseName + '.json'; }
      else if (ext === 'md') { content = _extracted.markdown; mime = 'text/markdown'; fname = baseName + '.md'; }
      else { content = _extracted.plain; mime = 'text/plain'; fname = baseName + '.txt'; }
      var blob = new Blob([content], { type: mime });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = fname; a.click();
    };

    window._etShowTab('plain');
    onProgress && onProgress(1, 'Done!');

    var blob = new Blob([_extracted.plain], { type: 'text/plain' });
    return { blob: blob, filename: baseName + '-text.txt' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

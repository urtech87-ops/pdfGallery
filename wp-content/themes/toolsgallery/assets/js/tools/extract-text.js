/**
 * ToolsGallery — Extract Text
 * Handler: extract-text
 * URL: /tool/extract-text/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'extract-text' };

  var _extracted = { plain: '', markdown: '', json: [] };
  var _baseName = 'extracted-text';

  function getOptionsHTML() {
    return '<div id="et-tabs" style="display:flex;gap:6px;margin-bottom:8px">' +
      '<button type="button" class="tg-btn-secondary et-tab et-tab--active" data-tab="plain">Plain Text</button>' +
      '<button type="button" class="tg-btn-secondary et-tab" data-tab="markdown">Markdown</button>' +
      '<button type="button" class="tg-btn-secondary et-tab" data-tab="json">JSON</button>' +
    '</div>' +
    '<div id="et-stats" style="font-size:12px;color:var(--color-gray-600);margin-bottom:6px"></div>' +
    '<textarea id="et-output" style="width:100%;min-height:220px;font-family:monospace;font-size:13px;border:1px solid #ddd;border-radius:6px;padding:8px;resize:vertical;box-sizing:border-box" readonly placeholder="Extracted text will appear here..."></textarea>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      '<button type="button" class="tg-btn-secondary" id="et-copy">Copy Text</button>' +
      '<button type="button" class="tg-btn-secondary" id="et-dl-txt">Download .txt</button>' +
      '<button type="button" class="tg-btn-secondary" id="et-dl-md">Download .md</button>' +
      '<button type="button" class="tg-btn-secondary" id="et-dl-json">Download .json</button>' +
    '</div>';
  }

  function currentTab(container) {
    var active = container.querySelector('.et-tab--active');
    return active ? active.dataset.tab : 'plain';
  }

  function showTab(container, tab) {
    var ta = container.querySelector('#et-output');
    if (!ta) return;
    if (tab === 'json') ta.value = JSON.stringify(_extracted.json, null, 2);
    else if (tab === 'markdown') ta.value = _extracted.markdown;
    else ta.value = _extracted.plain;
  }

  function download(ext) {
    var content, mime, fname;
    if (ext === 'json') { content = JSON.stringify(_extracted.json, null, 2); mime = 'application/json'; fname = _baseName + '.json'; }
    else if (ext === 'md') { content = _extracted.markdown; mime = 'text/markdown'; fname = _baseName + '.md'; }
    else { content = _extracted.plain; mime = 'text/plain'; fname = _baseName + '.txt'; }
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* Wired by tool-runner after the options HTML is injected (inline <script>
     tags in injected markup never execute, so events must be bound here). */
  function wireOptions(container) {
    if (!container || container.dataset.etWired) return;
    container.dataset.etWired = '1';

    container.querySelectorAll('.et-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.et-tab').forEach(function (b) { b.classList.remove('et-tab--active'); });
        btn.classList.add('et-tab--active');
        showTab(container, btn.dataset.tab);
      });
    });

    var copyBtn = container.querySelector('#et-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var ta = container.querySelector('#et-output');
      if (!ta) return;
      var text = ta.value || '';
      navigator.clipboard.writeText(text).catch(function () {
        ta.removeAttribute('readonly'); ta.select();
        document.execCommand('copy');
        ta.setAttribute('readonly', 'readonly');
      });
      copyBtn.textContent = 'Copied!';
      setTimeout(function () { copyBtn.textContent = 'Copy Text'; }, 2000);
    });

    var dlTxt = container.querySelector('#et-dl-txt');
    if (dlTxt) dlTxt.addEventListener('click', function () { download('txt'); });
    var dlMd = container.querySelector('#et-dl-md');
    if (dlMd) dlMd.addEventListener('click', function () { download('md'); });
    var dlJson = container.querySelector('#et-dl-json');
    if (dlJson) dlJson.addEventListener('click', function () { download('json'); });
  }

  function onFileReady(file, optionsEl) {
    if (optionsEl) wireOptions(optionsEl);
  }

  function getOptions() { return {}; }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    var total = pdf.numPages;

    _extracted = { plain: '', markdown: '', json: [] };
    _baseName = file.name.replace(/\.pdf$/i, '') || 'extracted-text';

    for (var i = 1; i <= total; i++) {
      onProgress && onProgress(0.1 + (i / total) * 0.8, 'Extracting page ' + i + '...');
      var page = await pdf.getPage(i);
      var content = await page.getTextContent();

      var lines = {};
      content.items.forEach(function (item) {
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

    if (!_extracted.plain.trim().replace(/--- Page \d+ ---/g, '').trim()) {
      throw new Error('No text found. This PDF may contain scanned images only.');
    }

    /* Populate the options panel output + wire its buttons */
    var container = document.querySelector('.tg-tool-box .tg-options');
    if (container) {
      wireOptions(container);
      var wordCount = _extracted.plain.split(/\s+/).filter(Boolean).length;
      var statsEl = container.querySelector('#et-stats');
      if (statsEl) statsEl.textContent = wordCount + ' words, ' + _extracted.plain.length + ' characters, ' + total + ' pages';
      showTab(container, currentTab(container));
    }

    onProgress && onProgress(1, 'Done!');

    var blob = new Blob([_extracted.plain], { type: 'text/plain' });
    return { blob: blob, filename: _baseName + '-text.txt' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, wireOptions: wireOptions, CONFIG: CONFIG };
})();

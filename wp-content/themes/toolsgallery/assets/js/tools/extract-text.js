/**
 * ToolsGallery — Extract Text
 * Handler: extract-text
 * URL: /tool/extract-text/
 *
 * Extracts text as Plain Text, Markdown (with heading detection) or
 * structured JSON. The main Download button delivers the format of the
 * currently selected tab; dedicated .txt / .md / .json buttons are also
 * provided.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'extract-text' };

  var _extracted = { plain: '', markdown: '', json: null };
  var _baseName = 'extracted-text';

  function getOptionsHTML() {
    return '<div class="tg-opt-section">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Output Format</label>' +
        '<div id="et-tabs" class="tg-radio-group">' +
          '<button type="button" class="tg-btn-sm tg-btn-primary et-tab et-tab--active" data-tab="plain">Plain Text</button>' +
          '<button type="button" class="tg-btn-sm tg-btn-outline et-tab" data-tab="markdown">Markdown</button>' +
          '<button type="button" class="tg-btn-sm tg-btn-outline et-tab" data-tab="json">JSON</button>' +
        '</div>' +
      '</div>' +
      '<div id="et-stats" style="font-size:12px;color:#6b7280;"></div>' +
      '<textarea id="et-output" style="width:100%;min-height:260px;font-family:monospace;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;padding:12px;resize:vertical;box-sizing:border-box;line-height:1.5;" readonly placeholder="Extracted text will appear here after processing..."></textarea>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button type="button" class="tg-btn-sm tg-btn-outline" id="et-copy">&#128203; Copy</button>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline" id="et-dl-txt">&#11015;&#65039; Download .txt</button>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline" id="et-dl-md">&#11015;&#65039; Download .md</button>' +
        '<button type="button" class="tg-btn-sm tg-btn-outline" id="et-dl-json">&#11015;&#65039; Download .json</button>' +
      '</div>' +
    '</div>';
  }

  function currentTab(container) {
    var active = container ? container.querySelector('.et-tab--active') : null;
    return active ? active.dataset.tab : 'plain';
  }

  function formatContent(tab) {
    if (tab === 'json') return _extracted.json ? JSON.stringify(_extracted.json, null, 2) : '';
    if (tab === 'markdown') return _extracted.markdown;
    return _extracted.plain;
  }

  function showTab(container, tab) {
    var ta = container.querySelector('#et-output');
    if (ta) ta.value = formatContent(tab);
  }

  function download(ext) {
    var content, mime, fname;
    if (ext === 'json')    { content = formatContent('json');     mime = 'application/json'; fname = _baseName + '.json'; }
    else if (ext === 'md') { content = formatContent('markdown'); mime = 'text/markdown';    fname = _baseName + '.md'; }
    else                   { content = formatContent('plain');    mime = 'text/plain';       fname = _baseName + '.txt'; }
    if (!content) return;
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  /* Wired by tool-runner after the options HTML is injected (inline <script>
     tags in injected markup never execute, so events must be bound here). */
  function wireOptions(container) {
    if (!container || container.dataset.etWired) return;
    container.dataset.etWired = '1';

    container.querySelectorAll('.et-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.et-tab').forEach(function (b) {
          b.classList.remove('et-tab--active', 'tg-btn-primary');
          b.classList.add('tg-btn-outline');
        });
        btn.classList.add('et-tab--active', 'tg-btn-primary');
        btn.classList.remove('tg-btn-outline');
        showTab(container, btn.dataset.tab);
      });
    });

    var copyBtn = container.querySelector('#et-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var ta = container.querySelector('#et-output');
      if (!ta) return;
      navigator.clipboard.writeText(ta.value || '').catch(function () {
        ta.removeAttribute('readonly'); ta.select();
        document.execCommand('copy');
        ta.setAttribute('readonly', 'readonly');
      });
      copyBtn.textContent = '✓ Copied!';
      setTimeout(function () { copyBtn.textContent = '📋 Copy'; }, 2000);
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

  function getOptions(optionsEl) {
    return { format: currentTab(optionsEl) };
  }

  /* Heading heuristic for Markdown: short, mostly-uppercase lines. */
  function toMarkdownLine(line) {
    line = line.trim();
    if (!line) return '';
    var letters = line.replace(/[^a-zA-Z]/g, '');
    if (line.length > 3 && line.length < 60 && letters.length > 2 && line === line.toUpperCase()) {
      return '### ' + line;
    }
    return line;
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded. Please refresh the page.');

    onProgress && onProgress(0.1, 'Loading PDF...');
    var ab = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    var total = pdf.numPages;

    _baseName = file.name.replace(/\.pdf$/i, '') || 'extracted-text';
    var pages = [];

    for (var i = 1; i <= total; i++) {
      onProgress && onProgress(0.1 + (i / total) * 0.75, 'Extracting page ' + i + ' of ' + total + '...');
      var page = await pdf.getPage(i);
      var content = await page.getTextContent();

      var lines = {};
      content.items.forEach(function (item) {
        if (!item.str) return;
        var y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push({ x: item.transform[4], str: item.str });
      });

      var ySorted = Object.keys(lines).map(Number).sort(function (a, b) { return b - a; });
      var pageText = ySorted.map(function (y) {
        return lines[y].sort(function (a, b) { return a.x - b.x; })
          .map(function (it) { return it.str; }).join(' ');
      }).join('\n');

      pages.push(pageText);
    }

    var joined = pages.join('\n').trim();
    if (!joined) {
      throw new Error('No text found. This PDF may contain scanned images only.');
    }

    onProgress && onProgress(0.9, 'Formatting output...');

    /* Plain text */
    _extracted.plain = pages.map(function (t, idx) {
      return '--- Page ' + (idx + 1) + ' ---\n' + t;
    }).join('\n\n');

    /* Markdown with heading detection */
    var mdLines = [];
    pages.forEach(function (pageText, idx) {
      mdLines.push('## Page ' + (idx + 1));
      mdLines.push('');
      pageText.split('\n').forEach(function (line) {
        var md = toMarkdownLine(line);
        if (!md) return;
        mdLines.push(md);
        mdLines.push('');
      });
    });
    _extracted.markdown = mdLines.join('\n');

    /* Structured JSON */
    var countWords = function (t) { return t.trim().split(/\s+/).filter(Boolean).length; };
    _extracted.json = {
      filename: file.name,
      totalPages: pages.length,
      extractedAt: new Date().toISOString(),
      pages: pages.map(function (text, idx) {
        return {
          pageNumber: idx + 1,
          content: text.trim(),
          wordCount: countWords(text),
          charCount: text.trim().length,
        };
      }),
      totalWordCount: pages.reduce(function (sum, t) { return sum + countWords(t); }, 0),
    };

    /* Populate the options panel output + stats */
    var container = document.querySelector('.tg-tool-box .tg-options');
    if (container) {
      wireOptions(container);
      var statsEl = container.querySelector('#et-stats');
      if (statsEl) {
        statsEl.textContent = _extracted.json.totalWordCount + ' words · ' +
          _extracted.plain.length + ' characters · ' + total + ' page' + (total !== 1 ? 's' : '');
      }
      showTab(container, currentTab(container));
    }

    onProgress && onProgress(1, 'Done!');

    /* The main Download button delivers the format of the selected tab */
    var format = (options && options.format) || currentTab(container);
    var outputText, mimeType, extension;
    if (format === 'markdown')  { outputText = _extracted.markdown;              mimeType = 'text/markdown';    extension = '.md'; }
    else if (format === 'json') { outputText = formatContent('json');            mimeType = 'application/json'; extension = '.json'; }
    else                        { outputText = _extracted.plain;                 mimeType = 'text/plain';       extension = '.txt'; }

    return {
      blob: new Blob([outputText], { type: mimeType }),
      filename: _baseName + extension,
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, wireOptions: wireOptions, CONFIG: CONFIG };
})();

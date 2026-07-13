/* ToolsGallery — pdf-translate.js
   Handler: pdf-translate
   Extracts PDF text with PDF.js and translates it via the AI proxy
   (tg_ai_proxy). Result is shown in a copyable/downloadable text box.
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-translate',
    downloadName: 'translation.txt',
  };

  var LANGUAGES = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
    'Russian', 'Arabic', 'Chinese (Simplified)', 'Chinese (Traditional)',
    'Japanese', 'Korean', 'Hindi', 'Turkish', 'Polish', 'Swedish',
    'Norwegian', 'Danish', 'Finnish', 'Greek', 'Hebrew', 'Thai',
    'Vietnamese', 'Indonesian', 'Malay', 'English',
  ];

  /* Long documents are processed in chunks instead of being truncated */
  var CHUNK_SIZE = 6000;
  var MAX_CHUNKS = 10;

  /* Split text into ~chunkSize pieces on paragraph boundaries */
  function splitIntoChunks(text, chunkSize, maxChunks) {
    var paragraphs = text.split(/\n{2,}/);
    var chunks = [];
    var current = '';
    for (var i = 0; i < paragraphs.length; i++) {
      var para = paragraphs[i];
      /* A single paragraph longer than a chunk gets hard-split */
      while (para.length > chunkSize) {
        if (current) { chunks.push(current); current = ''; }
        chunks.push(para.substring(0, chunkSize));
        para = para.substring(chunkSize);
      }
      if (!current) {
        current = para;
      } else if (current.length + 2 + para.length <= chunkSize) {
        current += '\n\n' + para;
      } else {
        chunks.push(current);
        current = para;
      }
    }
    if (current) chunks.push(current);
    var truncated = false;
    if (chunks.length > maxChunks) {
      chunks = chunks.slice(0, maxChunks);
      truncated = true;
    }
    return { chunks: chunks, truncated: truncated };
  }

  /* POST one request to the AI proxy; throws the server's real error message */
  async function callAiProxy(fields) {
    var formData = new FormData();
    formData.append('action', 'tg_ai_proxy');
    formData.append('nonce', tgAiConfig.nonce);
    formData.append('tool', CONFIG.handler);
    Object.keys(fields).forEach(function (k) {
      formData.append('payload[' + k + ']', fields[k]);
    });
    var response = await fetch(tgAiConfig.ajaxUrl, { method: 'POST', body: formData });
    var data = null;
    try { data = await response.json(); } catch (e) { /* non-JSON error page */ }
    if (!response.ok || !data || !data.success) {
      var msg = (data && data.data && data.data.message)
        ? data.data.message
        : 'Translation service error (' + response.status + '). Please try again.';
      throw new Error(msg);
    }
    return (data.data && data.data.result) ? String(data.data.result) : '';
  }

  function getOptionsHTML(pageCount) {
    var langOpts = LANGUAGES.map(function (l) {
      return '<option value="' + l + '">' + l + '</option>';
    }).join('');
    return '<div class="tg-opt-section">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="trans-lang">&#127760; Translate To</label>' +
        '<select id="trans-lang" class="tg-select">' + langOpts + '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="trans-style">Translation Style</label>' +
        '<select id="trans-style" class="tg-select">' +
          '<option value="natural">Natural (recommended)</option>' +
          '<option value="formal">Formal / Professional</option>' +
          '<option value="literal">Literal / Close to original</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Pages</label>' +
        '<div class="tg-radio-group">' +
          '<label class="tg-radio-label"><input type="radio" name="trans-pages" value="all" checked> <span>All pages</span></label>' +
          '<label class="tg-radio-label"><input type="radio" name="trans-pages" value="specific"> <span>Specific pages</span></label>' +
        '</div>' +
        '<div id="trans-pages-wrap" hidden style="margin-top:6px;">' +
          '<input type="text" id="trans-pages-input" class="tg-input" placeholder="e.g. 1,3,5-8">' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div id="trans-output-wrap" hidden style="margin-top:12px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px;">' +
        '<strong style="font-size:15px;">&#127760; Translation Result</strong>' +
        '<div style="display:flex;gap:8px;">' +
          '<button type="button" id="trans-copy-btn" class="tg-btn-sm tg-btn-outline">&#128203; Copy</button>' +
          '<button type="button" id="trans-dl-txt" class="tg-btn-sm tg-btn-primary">&#11015;&#65039; Download TXT</button>' +
        '</div>' +
      '</div>' +
      '<textarea id="trans-output-content" readonly style="width:100%;height:320px;padding:14px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>' +
    '</div>';
  }

  /* Inline <script> tags in injected markup never execute — wired here. */
  function wireOptions(optionsEl) {
    if (!optionsEl || optionsEl.dataset.transWired) return;
    optionsEl.dataset.transWired = '1';
    optionsEl.querySelectorAll('input[name="trans-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var wrap = optionsEl.querySelector('#trans-pages-wrap');
        if (wrap) wrap.hidden = r.value !== 'specific';
      });
    });
    var copyBtn = optionsEl.querySelector('#trans-copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var ta = optionsEl.querySelector('#trans-output-content');
      if (!ta || !ta.value) return;
      navigator.clipboard.writeText(ta.value).catch(function () {
        ta.select();
        document.execCommand('copy');
      });
      copyBtn.textContent = '✓ Copied!';
      setTimeout(function () { copyBtn.textContent = '📋 Copy'; }, 2000);
    });
    var dlBtn = optionsEl.querySelector('#trans-dl-txt');
    if (dlBtn) dlBtn.addEventListener('click', function () {
      var ta = optionsEl.querySelector('#trans-output-content');
      if (!ta || !ta.value) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ta.value], { type: 'text/plain' }));
      a.download = 'translation.txt';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    });
  }

  function onFileReady(file, optionsEl) {
    wireOptions(optionsEl);
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var lang = optionsEl.querySelector('#trans-lang');
    var style = optionsEl.querySelector('#trans-style');
    var pagesMode = optionsEl.querySelector('input[name="trans-pages"]:checked');
    var pagesInput = optionsEl.querySelector('#trans-pages-input');
    return {
      language: lang ? lang.value : 'Spanish',
      style: style ? style.value : 'natural',
      pagesMode: pagesMode ? pagesMode.value : 'all',
      pagesRange: pagesInput ? pagesInput.value : '',
    };
  }

  function parsePageRange(rangeStr, total) {
    var pages = [];
    rangeStr.split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
          if (i >= 1 && i <= total) pages.push(i);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n);
      }
    });
    return pages.length ? pages : null;
  }

  function showResult(text) {
    var wrap = document.getElementById('trans-output-wrap');
    var ta = document.getElementById('trans-output-content');
    if (wrap) { wrap.hidden = false; wrap.style.display = 'block'; }
    if (ta) ta.value = text;
    try { wrap && wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded. Please refresh the page.');
    if (typeof tgAiConfig === 'undefined') {
      throw new Error('AI configuration not found. Please refresh the page.');
    }

    onProgress && onProgress(0.1, 'Reading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var totalPages = pdf.numPages;

    var pageNums = (options.pagesMode === 'specific' && options.pagesRange)
      ? parsePageRange(options.pagesRange, totalPages)
      : null;
    if (!pageNums) {
      pageNums = [];
      for (var i = 1; i <= totalPages; i++) pageNums.push(i);
    }

    var extractedParts = [];
    for (var p = 0; p < pageNums.length; p++) {
      onProgress && onProgress(0.1 + (p / pageNums.length) * 0.3,
        'Extracting page ' + pageNums[p] + ' of ' + totalPages + '...');
      var page = await pdf.getPage(pageNums[p]);
      var tc = await page.getTextContent();
      var pageText = tc.items.map(function (it) { return it.str; }).join(' ').trim();
      if (pageText) extractedParts.push('--- Page ' + pageNums[p] + ' ---\n' + pageText);
    }

    if (!extractedParts.length) {
      throw new Error('No text found in this PDF — it appears to be scanned or image-only. Use the Image OCR tool (/tool/img-ocr/) to pull the text out of scanned pages first, then translate it here.');
    }

    var text = extractedParts.join('\n\n');
    var targetLang = options.language + (options.style && options.style !== 'natural' ? ' (' + options.style + ' style)' : '');
    var split = splitIntoChunks(text, CHUNK_SIZE, MAX_CHUNKS);
    var chunks = split.chunks;

    var parts = [];
    for (var c = 0; c < chunks.length; c++) {
      onProgress && onProgress(0.45 + (c / chunks.length) * 0.45,
        chunks.length > 1
          ? 'Translating part ' + (c + 1) + ' of ' + chunks.length + ' to ' + options.language + '...'
          : 'Translating to ' + options.language + '...');
      var part = await callAiProxy({
        text: chunks[c],
        language: targetLang,
      });
      if (part.trim()) parts.push(part.trim());
    }

    var translated = parts.join('\n\n');
    if (!translated.trim()) throw new Error('AI returned an empty translation. Please try again.');
    if (split.truncated) {
      translated += '\n\n[Note: this document is very long — only the first ' +
        MAX_CHUNKS + ' sections (~' + (CHUNK_SIZE * MAX_CHUNKS / 1000) +
        'k characters) were translated.]';
    }

    onProgress && onProgress(0.95, 'Displaying result...');
    showResult(translated);

    onProgress && onProgress(1.0, 'Translation complete!');
    var blob = new Blob([translated], { type: 'text/plain' });
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-' + options.language.toLowerCase().replace(/[^a-z]+/g, '-') + '.txt' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, wireOptions: wireOptions, CONFIG: CONFIG };
})();

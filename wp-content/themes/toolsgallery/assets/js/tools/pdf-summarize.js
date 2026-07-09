/* ToolsGallery — pdf-summarize.js
   Handler: pdf-summarize
   Extracts PDF text with PDF.js and summarizes it via the AI proxy
   (tg_ai_proxy). Same structure as pdf-translate.js.
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-summarize',
    downloadName: 'summary.txt',
  };

  var MAX_CHARS = 8000;

  function getOptionsHTML(pageCount) {
    return '<div class="tg-opt-section">' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="sum-type">&#128221; Summary Type</label>' +
        '<select id="sum-type" class="tg-select">' +
          '<option value="brief">Brief (3-5 key points)</option>' +
          '<option value="standard" selected>Standard (paragraph summary)</option>' +
          '<option value="detailed">Detailed (section by section)</option>' +
          '<option value="bullets">Bullet Points</option>' +
          '<option value="executive">Executive Summary</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="sum-lang">Summary Language</label>' +
        '<select id="sum-lang" class="tg-select">' +
          '<option value="same as document">Same as source</option>' +
          '<option value="English">English</option>' +
          '<option value="Spanish">Spanish</option>' +
          '<option value="French">French</option>' +
          '<option value="German">German</option>' +
          '<option value="Portuguese">Portuguese</option>' +
          '<option value="Arabic">Arabic</option>' +
          '<option value="Hindi">Hindi</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div id="sum-output-wrap" hidden style="margin-top:12px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px;">' +
        '<strong style="font-size:15px;">&#128221; Summary</strong>' +
        '<div style="display:flex;gap:8px;">' +
          '<button type="button" id="sum-copy-btn" class="tg-btn-sm tg-btn-outline">&#128203; Copy</button>' +
          '<button type="button" id="sum-dl-txt" class="tg-btn-sm tg-btn-primary">&#11015;&#65039; Download TXT</button>' +
        '</div>' +
      '</div>' +
      '<textarea id="sum-output-content" readonly style="width:100%;height:320px;padding:14px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>' +
    '</div>';
  }

  /* Inline <script> tags in injected markup never execute — wired here. */
  function wireOptions(optionsEl) {
    if (!optionsEl || optionsEl.dataset.sumWired) return;
    optionsEl.dataset.sumWired = '1';
    var copyBtn = optionsEl.querySelector('#sum-copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var ta = optionsEl.querySelector('#sum-output-content');
      if (!ta || !ta.value) return;
      navigator.clipboard.writeText(ta.value).catch(function () {
        ta.select();
        document.execCommand('copy');
      });
      copyBtn.textContent = '✓ Copied!';
      setTimeout(function () { copyBtn.textContent = '📋 Copy'; }, 2000);
    });
    var dlBtn = optionsEl.querySelector('#sum-dl-txt');
    if (dlBtn) dlBtn.addEventListener('click', function () {
      var ta = optionsEl.querySelector('#sum-output-content');
      if (!ta || !ta.value) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ta.value], { type: 'text/plain' }));
      a.download = 'summary.txt';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    });
  }

  function onFileReady(file, optionsEl) {
    wireOptions(optionsEl);
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var type = optionsEl.querySelector('#sum-type');
    var lang = optionsEl.querySelector('#sum-lang');
    return {
      type: type ? type.value : 'standard',
      language: lang ? lang.value : 'same as document',
    };
  }

  /* Map summary type to the AI proxy's {format} and {length} slots */
  function typeToPayload(type, language) {
    var map = {
      brief:     { format: 'as 3-5 concise key points', length: 'brief' },
      standard:  { format: 'in clear paragraphs',       length: 'standard' },
      detailed:  { format: 'section by section, covering every major topic', length: 'detailed' },
      bullets:   { format: 'in bullet points',          length: 'standard' },
      executive: { format: 'as an executive summary',   length: 'standard' },
    };
    var out = map[type] || map.standard;
    var format = out.format;
    if (language && language !== 'same as document') {
      format += ', written in ' + language;
    }
    return { format: format, length: out.length };
  }

  function showResult(text) {
    var wrap = document.getElementById('sum-output-wrap');
    var ta = document.getElementById('sum-output-content');
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

    var textParts = [];
    for (var p = 1; p <= totalPages; p++) {
      onProgress && onProgress(0.1 + (p / totalPages) * 0.3,
        'Extracting page ' + p + ' of ' + totalPages + '...');
      var page = await pdf.getPage(p);
      var tc = await page.getTextContent();
      var pageText = tc.items.map(function (it) { return it.str; }).join(' ').trim();
      if (pageText) textParts.push(pageText);
    }

    var fullText = textParts.join('\n\n');
    if (!fullText || fullText.trim().length < 50) {
      throw new Error('Could not extract text from this PDF. The document may contain only images or be scanned. Text-based PDFs work best for summarization.');
    }

    var text = fullText;
    if (text.length > MAX_CHARS) {
      text = text.substring(0, MAX_CHARS) +
        '\n\n[Document truncated for summarization. Total length: ' + fullText.length + ' characters]';
    }

    onProgress && onProgress(0.5, 'Generating summary...');

    var payload = typeToPayload(options.type, options.language);
    var formData = new FormData();
    formData.append('action', 'tg_ai_proxy');
    formData.append('nonce', tgAiConfig.nonce);
    formData.append('tool', 'pdf-summarize');
    formData.append('payload[text]', text);
    formData.append('payload[format]', payload.format);
    formData.append('payload[length]', payload.length);

    var response = await fetch(tgAiConfig.ajaxUrl, { method: 'POST', body: formData });
    if (!response.ok) {
      var httpMsg = 'Summarization service error (' + response.status + '). Please try again.';
      try {
        var errData = await response.json();
        if (errData && errData.data && errData.data.message) httpMsg = errData.data.message;
      } catch (pe) { /* keep generic message */ }
      throw new Error(httpMsg);
    }
    var data = await response.json();
    if (!data.success) {
      throw new Error((data.data && data.data.message) ? data.data.message : 'Summarization failed. Please try again.');
    }

    var summary = (data.data && data.data.result) ? String(data.data.result) : '';
    if (!summary.trim()) throw new Error('AI returned an empty summary. Please try again or use a different PDF.');

    onProgress && onProgress(0.95, 'Displaying summary...');
    showResult(summary);

    onProgress && onProgress(1.0, 'Summary complete!');
    var blob = new Blob([summary], { type: 'text/plain' });
    return { blob: blob, filename: file.name.replace(/\.pdf$/i, '') + '-summary.txt' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, wireOptions: wireOptions, CONFIG: CONFIG };
})();

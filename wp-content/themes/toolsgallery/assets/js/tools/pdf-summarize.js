/* ToolsGallery — pdf-summarize.js
   Handler: pdf-summarize
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-summarize',
    downloadName: 'summary.txt',
  };

  function getOptionsHTML(pageCount) {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Summary length</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="sum-length" value="brief"> Brief</label>' +
        '<label><input type="radio" name="sum-length" value="standard" checked> Standard</label>' +
        '<label><input type="radio" name="sum-length" value="detailed"> Detailed</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Format</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="sum-format" value="bullets" checked> Bullet points</label>' +
        '<label><input type="radio" name="sum-format" value="paragraphs"> Paragraphs</label>' +
        '<label><input type="radio" name="sum-format" value="executive"> Executive summary</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="sum-lang">Output language</label>' +
      '<select id="sum-lang" class="tg-select">' +
        '<option value="same as document">Same as document</option>' +
        '<option value="English">English</option>' +
        '<option value="Spanish">Spanish</option>' +
        '<option value="French">French</option>' +
        '<option value="German">German</option>' +
      '</select>' +
    '</div>' +
    '<div id="sum-output-wrap" hidden style="margin-top:12px;">' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
        '<button type="button" id="sum-copy-btn" class="tg-btn-secondary">Copy Text</button>' +
        '<button type="button" id="sum-dl-txt" class="tg-btn-secondary">Download .txt</button>' +
      '</div>' +
      '<div id="sum-output-content" style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:12px;max-height:350px;overflow-y:auto;white-space:pre-wrap;font-family:Georgia,serif;line-height:1.6;font-size:14px;"></div>' +
    '</div>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var length = optionsEl.querySelector('input[name="sum-length"]:checked');
    var format = optionsEl.querySelector('input[name="sum-format"]:checked');
    var lang = optionsEl.querySelector('#sum-lang');
    return {
      length: length ? length.value : 'standard',
      format: format ? format.value : 'bullets',
      language: lang ? lang.value : 'same as document',
    };
  }

  function formatToPrompt(format) {
    if (format === 'bullets') return 'in bullet points';
    if (format === 'executive') return 'as an executive summary';
    return 'in clear paragraphs';
  }

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded.');
    if (typeof tgAiConfig === 'undefined') throw new Error('AI config not available.');

    onProgress && onProgress(0.1, 'Extracting text from PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var totalPages = pdf.numPages;

    var textParts = [];
    for (var p = 1; p <= totalPages; p++) {
      onProgress && onProgress(0.1 + p / totalPages * 0.3, 'Reading page ' + p + '...');
      var page = await pdf.getPage(p);
      var tc = await page.getTextContent();
      var pageText = tc.items.map(function (it) { return it.str; }).join(' ').trim();
      if (pageText) textParts.push(pageText);
    }

    var fullText = textParts.join('\n\n');
    if (!fullText || fullText.trim().length < 50) {
      callbacks.onError ?
        callbacks.onError('Could not extract text from this PDF. The document may contain only images or be scanned. Text-based PDFs work best for summarization.') :
        (() => { throw new Error('Could not extract text from this PDF. The document may contain only images or be scanned.'); })();
      return;
    }

    var maxChars = options.length === 'brief' ? 2000 : options.length === 'detailed' ? 5000 : 3500;
    var text = fullText.length > maxChars ? fullText.substring(0, maxChars) + '...\n[Text truncated]' : fullText;

    onProgress && onProgress(0.5, 'Generating summary...');

    var formatStr = formatToPrompt(options.format);
    if (options.language !== 'same as document') {
      formatStr += ' in ' + options.language;
    }

    var formData = new FormData();
    formData.append('action', 'tg_ai_proxy');
    formData.append('nonce', tgAiConfig.nonce);
    formData.append('tool', 'pdf-summarize');
    formData.append('payload[text]', text);
    formData.append('payload[format]', formatStr);
    formData.append('payload[length]', options.length || 'standard');

    var response = await fetch(tgAiConfig.ajaxUrl, { method: 'POST', body: formData });
    var data = await response.json();

    if (!data.success) throw new Error((data.data && data.data.message) ? data.data.message : 'Summarization failed. Please try again.');

    var summary = (data.data && data.data.result) ? data.data.result : '';
    if (!summary) throw new Error('AI returned an empty summary. Please try again or use a different PDF.');

    onProgress && onProgress(0.9, 'Displaying summary...');

    var outputWrap = document.getElementById('sum-output-wrap');
    var outputContent = document.getElementById('sum-output-content');
    if (outputWrap) outputWrap.hidden = false;
    if (outputContent) outputContent.textContent = summary;

    var copyBtn = document.getElementById('sum-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(summary).catch(function () {});
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = 'Copy Text'; }, 2000);
      });
    }

    var dlTxt = document.getElementById('sum-dl-txt');
    if (dlTxt) {
      dlTxt.addEventListener('click', function () {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([summary], { type: 'text/plain' }));
        a.download = 'summary.txt';
        a.click();
      });
    }

    var blob = new Blob([summary], { type: 'text/plain' });
    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

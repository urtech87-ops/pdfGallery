/* ToolsGallery — pdf-translate.js
   Handler: pdf-translate
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'pdf-translate',
    downloadName: 'translated.txt',
  };

  var LANGUAGES = ['English','Spanish','French','German','Italian','Portuguese','Dutch','Russian','Chinese (Simplified)','Chinese (Traditional)','Japanese','Korean','Arabic','Hindi','Turkish','Polish','Swedish','Norwegian','Danish','Finnish'];

  function getOptionsHTML(pageCount) {
    var langOpts = LANGUAGES.map(function (l) { return '<option value="' + l + '">' + l + '</option>'; }).join('');
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="trans-lang">Translate to</label>' +
      '<select id="trans-lang" class="tg-select">' + langOpts + '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Pages</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="trans-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="trans-pages" value="specific"> Specific pages</label>' +
      '</div>' +
      '<div id="trans-pages-wrap" hidden style="margin-top:6px;">' +
        '<input type="text" id="trans-pages-input" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Translation quality</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="trans-quality" value="standard" checked> Standard</label>' +
        '<label><input type="radio" name="trans-quality" value="detailed"> Detailed (slower)</label>' +
      '</div>' +
    '</div>' +
    '<div id="trans-output-wrap" hidden style="margin-top:12px;">' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">' +
        '<button type="button" id="trans-copy-btn" class="tg-btn-secondary">Copy Text</button>' +
        '<button type="button" id="trans-dl-txt" class="tg-btn-secondary">Download .txt</button>' +
      '</div>' +
      '<div id="trans-output-content" style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:12px;max-height:300px;overflow-y:auto;white-space:pre-wrap;font-family:Georgia,serif;line-height:1.6;font-size:14px;"></div>' +
    '</div>';
  }

  function onFileReady(file, optionsEl) {
    if (!optionsEl) return;
    var wrap = optionsEl.querySelector('#trans-pages-wrap');
    if (!wrap || wrap.dataset.wired) return;
    wrap.dataset.wired = '1';
    optionsEl.querySelectorAll('input[name="trans-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        wrap.hidden = r.value !== 'specific';
      });
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var lang = optionsEl.querySelector('#trans-lang');
    var pagesMode = optionsEl.querySelector('input[name="trans-pages"]:checked');
    var pagesInput = optionsEl.querySelector('#trans-pages-input');
    var quality = optionsEl.querySelector('input[name="trans-quality"]:checked');
    return {
      language: lang ? lang.value : 'Spanish',
      pagesMode: pagesMode ? pagesMode.value : 'all',
      pagesRange: pagesInput ? pagesInput.value : '',
      quality: quality ? quality.value : 'standard',
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

  async function run(file, options, onProgress) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded.');
    if (typeof tgAiConfig === 'undefined') throw new Error('AI config not available.');

    onProgress && onProgress(0.1, 'Extracting text from PDF...');
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
      onProgress && onProgress(0.1 + p / pageNums.length * 0.3, 'Extracting page ' + pageNums[p] + '...');
      var page = await pdf.getPage(pageNums[p]);
      var tc = await page.getTextContent();
      var pageText = tc.items.map(function (it) { return it.str; }).join(' ');
      if (pageText.trim()) extractedParts.push(pageText.trim());
    }

    if (!extractedParts.length) throw new Error('No text found in PDF. It may contain only images.');

    var text = extractedParts.join('\n\n');
    // Truncate to ~3000 chars for API
    if (text.length > 3000) text = text.substring(0, 3000) + '...\n[Text truncated for translation]';

    onProgress && onProgress(0.5, 'Sending to translation service...');

    var formData = new FormData();
    formData.append('action', 'tg_ai_proxy');
    formData.append('nonce', tgAiConfig.nonce);
    formData.append('tool', 'pdf-translate');
    formData.append('payload[text]', text);
    formData.append('payload[language]', options.language);

    var response = await fetch(tgAiConfig.ajaxUrl, { method: 'POST', body: formData });
    var data = await response.json();

    if (!data.success) throw new Error((data.data && data.data.message) ? data.data.message : 'Translation failed. Please try again.');

    var translated = (data.data && data.data.result) ? data.data.result : '';
    if (!translated) throw new Error('Translation returned empty result.');

    onProgress && onProgress(0.9, 'Displaying result...');

    // Show output in the options panel
    var outputWrap = document.getElementById('trans-output-wrap');
    var outputContent = document.getElementById('trans-output-content');
    if (outputWrap) outputWrap.hidden = false;
    if (outputContent) outputContent.textContent = translated;

    var copyBtn = document.getElementById('trans-copy-btn');
    if (copyBtn) {
      copyBtn.onclick = function () {
        navigator.clipboard.writeText(translated).catch(function () {
          var ta = document.createElement('textarea');
          ta.value = translated;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        });
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = 'Copy Text'; }, 2000);
      };
    }

    var dlTxt = document.getElementById('trans-dl-txt');
    if (dlTxt) {
      dlTxt.onclick = function () {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([translated], { type: 'text/plain' }));
        a.download = 'translated.txt';
        a.click();
      };
    }

    var blob = new Blob([translated], { type: 'text/plain' });
    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();

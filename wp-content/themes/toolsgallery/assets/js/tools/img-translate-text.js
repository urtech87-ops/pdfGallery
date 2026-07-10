/**
 * ToolsGallery — Translate Image Text
 * Handler: img-translate-text
 * URL: /tool/translate-image-text/
 * OCR runs in the browser via Tesseract.js; translation goes
 * through the WordPress AI proxy (tg_ai_proxy / ai-translator).
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-translate-text' };

  var TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';

  var OCR_LANGS = [
    { label: 'English', code: 'eng' },
    { label: 'Spanish', code: 'spa' },
    { label: 'French', code: 'fra' },
    { label: 'German', code: 'deu' },
    { label: 'Italian', code: 'ita' },
    { label: 'Portuguese', code: 'por' },
    { label: 'Dutch', code: 'nld' },
    { label: 'Russian', code: 'rus' },
    { label: 'Chinese (Simplified)', code: 'chi_sim' },
    { label: 'Japanese', code: 'jpn' },
    { label: 'Korean', code: 'kor' },
    { label: 'Arabic', code: 'ara' },
    { label: 'Hindi', code: 'hin' },
  ];

  var TARGET_LANGS = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Turkish', 'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek', 'Hebrew', 'Vietnamese', 'Thai', 'Indonesian'];

  function getOptionsHTML() {
    var srcOpts = OCR_LANGS.map(function (l) {
      return '<option value="' + l.code + '">' + l.label + '</option>';
    }).join('');
    var tgtOpts = TARGET_LANGS.map(function (l) {
      return '<option value="' + l + '"' + (l === 'Spanish' ? ' selected' : '') + '>' + l + '</option>';
    }).join('');
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="itt-src-lang">Text Language</label>' +
      '<select id="itt-src-lang" class="tg-select">' + srcOpts + '</select>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="itt-lang">Translate To</label>' +
      '<select id="itt-lang" class="tg-select">' + tgtOpts + '</select>' +
    '</div>' +
    '<div id="itt-result-wrap" hidden style="margin-top:12px">' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px">' +
          '<p style="font-weight:600;margin:0 0 4px;font-size:13px">Original Text</p>' +
          '<textarea id="itt-original" class="tg-text-input" rows="8" readonly style="width:100%;font-size:13px;resize:vertical;box-sizing:border-box"></textarea>' +
        '</div>' +
        '<div style="flex:1;min-width:200px">' +
          '<p style="font-weight:600;margin:0 0 4px;font-size:13px">Translation</p>' +
          '<textarea id="itt-translation" class="tg-text-input" rows="8" readonly style="width:100%;font-size:13px;resize:vertical;box-sizing:border-box"></textarea>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary" id="itt-copy">Copy Translation</button>' +
        '<button type="button" class="tg-btn-secondary" id="itt-download">Download .txt</button>' +
      '</div>' +
    '</div>';
  }

  function wireOptions(container) {
    var cp = container.querySelector('#itt-copy');
    if (cp) cp.addEventListener('click', function () {
      var ta = container.querySelector('#itt-translation');
      if (!ta) return;
      navigator.clipboard.writeText(ta.value).catch(function () {
        ta.select();
        document.execCommand('copy');
      });
      cp.textContent = 'Copied!';
      setTimeout(function () { cp.textContent = 'Copy Translation'; }, 2000);
    });
    var dl = container.querySelector('#itt-download');
    if (dl) dl.addEventListener('click', function () {
      var ta = container.querySelector('#itt-translation');
      if (!ta) return;
      var b = new Blob([ta.value], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'translation.txt';
      a.click();
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { srcLang: 'eng', language: 'Spanish' };
    var src = optionsEl.querySelector('#itt-src-lang');
    var lang = optionsEl.querySelector('#itt-lang');
    return {
      srcLang: src ? src.value : 'eng',
      language: lang ? lang.value : 'Spanish',
    };
  }

  async function ocr(file, lang, onProgress) {
    if (!window.Tesseract) {
      onProgress && onProgress(0.05, 'Loading OCR engine...');
      await TGImageUtil.loadScript(TESSERACT_SRC);
    }
    onProgress && onProgress(0.1, 'Extracting text from image...');
    var result = await Tesseract.recognize(file, lang || 'eng', {
      logger: function (m) {
        if (m.status === 'recognizing text') {
          onProgress && onProgress(0.1 + m.progress * 0.5,
            'Extracting text... ' + Math.round(m.progress * 100) + '%');
        }
      },
    });
    return result.data.text || '';
  }

  async function translate(text, language) {
    var config = window.tgAiConfig || {};
    var fd = new FormData();
    fd.append('action', 'tg_ai_proxy');
    fd.append('nonce', config.nonce || '');
    fd.append('tool', 'ai-translator');
    fd.append('payload[text]', text);
    fd.append('payload[language]', language);

    var resp = await fetch(config.ajaxUrl || '/wp-admin/admin-ajax.php', { method: 'POST', body: fd });
    var json = await resp.json();
    if (!json.success || !json.data || !json.data.result) {
      throw new Error((json.data && json.data.message) || 'Translation failed. Please try again.');
    }
    return json.data.result;
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    var originalText = await ocr(file, options.srcLang, onProgress);
    if (!originalText.trim()) {
      throw new Error('No text could be recognized in this image. Try a clearer image or a different text language.');
    }

    onProgress && onProgress(0.7, 'Translating to ' + options.language + '...');
    var translatedText = await translate(originalText, options.language);

    var resultWrap = document.getElementById('itt-result-wrap');
    var origEl = document.getElementById('itt-original');
    var transEl = document.getElementById('itt-translation');
    if (resultWrap) resultWrap.hidden = false;
    if (origEl) origEl.value = originalText;
    if (transEl) transEl.value = translatedText;

    var combined = 'Original:\n' + originalText + '\n\n---\n\nTranslation (' + options.language + '):\n' + translatedText;
    var blob = new Blob([combined], { type: 'text/plain' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-translated.txt' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();

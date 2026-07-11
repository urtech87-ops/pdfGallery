/**
 * ToolsGallery — Image to Text (OCR)
 * Handler: img-ocr
 * URL: /tool/image-to-text/
 * Uses Tesseract.js, loaded on demand from CDN.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-ocr' };

  var TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';

  var LANGS = [
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

  function getOptionsHTML() {
    var langOpts = LANGS.map(function (l) {
      return '<option value="' + l.code + '">' + l.label + '</option>';
    }).join('');
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iocr-lang">Language</label>' +
      '<select id="iocr-lang" class="tg-select">' + langOpts + '</select>' +
    '</div>' +
    '<div id="iocr-result-wrap" hidden style="margin-top:12px">' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary" id="iocr-copy">Copy Text</button>' +
        '<button type="button" class="tg-btn-secondary" id="iocr-download">Download .txt</button>' +
      '</div>' +
      '<p id="iocr-stats" class="tg-opt-info"></p>' +
      '<textarea id="iocr-output" class="tg-text-input" rows="10" readonly style="width:100%;font-family:monospace;font-size:13px;resize:vertical;box-sizing:border-box"></textarea>' +
    '</div>';
  }

  function wireOptions(container) {
    var cp = container.querySelector('#iocr-copy');
    if (cp) cp.addEventListener('click', function () {
      var ta = container.querySelector('#iocr-output');
      if (!ta) return;
      navigator.clipboard.writeText(ta.value).catch(function () {
        ta.select();
        document.execCommand('copy');
      });
      cp.textContent = 'Copied!';
      setTimeout(function () { cp.textContent = 'Copy Text'; }, 2000);
    });
    var dl = container.querySelector('#iocr-download');
    if (dl) dl.addEventListener('click', function () {
      var ta = container.querySelector('#iocr-output');
      if (!ta) return;
      var b = new Blob([ta.value], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'extracted-text.txt';
      a.click();
    });
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return { language: 'eng' };
    var lang = optionsEl.querySelector('#iocr-lang');
    return { language: lang ? lang.value : 'eng' };
  }

  async function recognizeText(file, lang, onProgress) {
    if (!window.Tesseract) {
      onProgress && onProgress(0.05, 'Loading OCR engine...');
      await TGImageUtil.loadScript(TESSERACT_SRC);
    }

    onProgress && onProgress(0.1, 'Initializing OCR engine...');

    var result = await Tesseract.recognize(file, lang || 'eng', {
      logger: function (m) {
        if (m.status === 'recognizing text') {
          onProgress && onProgress(0.2 + m.progress * 0.7,
            'Recognizing text... ' + Math.round(m.progress * 100) + '%');
        }
      },
    });

    return result.data.text || '';
  }

  async function run(file, options, onProgress) {
    if (!window.TGImageUtil) {
      throw new Error('Image processing library not loaded. Please refresh the page.');
    }
    var text = await recognizeText(file, options.language, onProgress);

    if (!text.trim()) {
      throw new Error('No text could be recognized in this image. Try a clearer image or a different language.');
    }

    onProgress && onProgress(0.95, 'Processing results...');

    var resultWrap = document.getElementById('iocr-result-wrap');
    var output = document.getElementById('iocr-output');
    var stats = document.getElementById('iocr-stats');
    if (resultWrap) resultWrap.hidden = false;
    if (output) output.value = text;
    if (stats) {
      var words = text.trim() ? text.trim().split(/\s+/).length : 0;
      stats.textContent = text.length + ' characters · ' + words + ' words';
    }

    var blob = new Blob([text], { type: 'text/plain' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: TGImageUtil.stripExt(file.name) + '-text.txt' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, recognizeText: recognizeText, CONFIG: CONFIG };
})();

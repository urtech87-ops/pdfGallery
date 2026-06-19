/**
 * ToolsGallery — Translate Image Text
 * Handler: img-translate-text
 * URL: /tool/translate-image-text/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-translate-text' };

  var LANGS = ['Spanish','French','German','Italian','Portuguese','Dutch','Russian','Chinese (Simplified)','Chinese (Traditional)','Japanese','Korean','Arabic','Hindi','Turkish','Polish','Swedish','Norwegian','Danish','Finnish','Greek','Hebrew','Vietnamese','Thai','Indonesian'];

  function getOptionsHTML() {
    var langOpts = LANGS.map(function (l) { return '<option value="' + l + '">' + l + '</option>'; }).join('');
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="itt-lang">Translate To</label>' +
      '<select id="itt-lang" class="tg-select">' + langOpts + '</select>' +
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
    '</div>' +
    '<script>(function(){' +
      'var cp=document.getElementById("itt-copy");' +
      'if(cp)cp.addEventListener("click",function(){var ta=document.getElementById("itt-translation");if(ta){navigator.clipboard.writeText(ta.value).catch(function(){ta.select();document.execCommand("copy");});cp.textContent="Copied!";setTimeout(function(){cp.textContent="Copy Translation";},2000);}});' +
      'var dl=document.getElementById("itt-download");' +
      'if(dl)dl.addEventListener("click",function(){var ta=document.getElementById("itt-translation");if(!ta)return;var b=new Blob([ta.value],{type:"text/plain"});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="translation.txt";a.click();});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var lang = optionsEl.querySelector('#itt-lang');
    return { language: lang ? lang.value : 'Spanish' };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Preparing image...');
    var config = window.tgAiConfig || {};
    var ajaxUrl = config.ajaxUrl || '/wp-admin/admin-ajax.php';
    var nonce = config.nonce || '';
    var base64 = await fileToBase64(file);

    // First pass: extract text
    onProgress && onProgress(0.2, 'Extracting text...');
    var fd1 = new FormData();
    fd1.append('action', 'tg_image_ai'); fd1.append('nonce', nonce);
    fd1.append('tool', 'img-ocr'); fd1.append('image', base64);
    fd1.append('prompt', 'Extract all visible text from this image. Return only the text, preserving line breaks.');

    var resp1 = await fetch(ajaxUrl, { method: 'POST', body: fd1 });
    var json1 = await resp1.json();
    if (!json1.success) throw new Error((json1.data && json1.data.message) || 'Text extraction failed');
    var originalText = (json1.data && json1.data.result) || '';

    // Second pass: translate
    onProgress && onProgress(0.6, 'Translating to ' + options.language + '...');
    var fd2 = new FormData();
    fd2.append('action', 'tg_image_ai'); fd2.append('nonce', nonce);
    fd2.append('tool', 'img-translate'); fd2.append('image', base64);
    fd2.append('prompt', options.language);

    var resp2 = await fetch(ajaxUrl, { method: 'POST', body: fd2 });
    var json2 = await resp2.json();
    if (!json2.success) throw new Error((json2.data && json2.data.message) || 'Translation failed');
    var translatedText = (json2.data && json2.data.result) || '';

    // Show in UI
    var resultWrap = document.getElementById('itt-result-wrap');
    var origEl = document.getElementById('itt-original');
    var transEl = document.getElementById('itt-translation');
    if (resultWrap) resultWrap.hidden = false;
    if (origEl) origEl.value = originalText;
    if (transEl) transEl.value = translatedText;

    var combined = 'Original:\n' + originalText + '\n\n---\n\nTranslation (' + options.language + '):\n' + translatedText;
    var blob = new Blob([combined], { type: 'text/plain' });
    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '-translated.txt' };
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) { resolve(e.target.result.replace(/^data:[^;]+;base64,/, '')); };
      reader.onerror = function () { reject(new Error('Could not read file')); };
      reader.readAsDataURL(file);
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

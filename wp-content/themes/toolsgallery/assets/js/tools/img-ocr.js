/**
 * ToolsGallery — Image to Text (OCR)
 * Handler: img-ocr
 * URL: /tool/image-to-text/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-ocr' };

  var LANGS = ['Auto-detect','English','Spanish','French','German','Italian','Portuguese','Dutch','Russian','Chinese','Japanese','Korean','Arabic','Hindi'];

  function getOptionsHTML() {
    var langOpts = LANGS.map(function (l) { return '<option value="' + l + '">' + l + '</option>'; }).join('');
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iocr-lang">Language Hint</label>' +
      '<select id="iocr-lang" class="tg-select">' + langOpts + '</select>' +
    '</div>' +
    '<div id="iocr-result-wrap" hidden style="margin-top:12px">' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary" id="iocr-copy">Copy Text</button>' +
        '<button type="button" class="tg-btn-secondary" id="iocr-download">Download .txt</button>' +
      '</div>' +
      '<p id="iocr-stats" class="tg-opt-info"></p>' +
      '<textarea id="iocr-output" class="tg-text-input" rows="10" readonly style="width:100%;font-family:monospace;font-size:13px;resize:vertical;box-sizing:border-box"></textarea>' +
    '</div>' +
    '<script>(function(){' +
      'var cp=document.getElementById("iocr-copy");' +
      'if(cp)cp.addEventListener("click",function(){var ta=document.getElementById("iocr-output");if(ta){navigator.clipboard.writeText(ta.value).catch(function(){ta.select();document.execCommand("copy");});cp.textContent="Copied!";setTimeout(function(){cp.textContent="Copy Text";},2000);}});' +
      'var dl=document.getElementById("iocr-download");' +
      'if(dl)dl.addEventListener("click",function(){var ta=document.getElementById("iocr-output");if(!ta)return;var b=new Blob([ta.value],{type:"text/plain"});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="extracted-text.txt";a.click();});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var lang = optionsEl.querySelector('#iocr-lang');
    return { language: lang ? lang.value : 'Auto-detect' };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Preparing image...');

    var config = window.tgAiConfig || {};
    var ajaxUrl = config.ajaxUrl || '/wp-admin/admin-ajax.php';
    var nonce = config.nonce || '';

    // Convert to base64
    var base64 = await fileToBase64(file);
    onProgress && onProgress(0.3, 'Sending to AI...');

    var formData = new FormData();
    formData.append('action', 'tg_image_ai');
    formData.append('nonce', nonce);
    formData.append('tool', 'img-ocr');
    formData.append('image', base64);
    formData.append('prompt', 'Extract all text from this image. Preserve layout and line breaks as much as possible. Language hint: ' + (options.language || 'Auto-detect'));

    try {
      var resp = await fetch(ajaxUrl, { method: 'POST', body: formData });
      var json = await resp.json();

      if (!json.success) {
        throw new Error((json.data && json.data.message) || 'OCR failed');
      }

      var text = (json.data && json.data.result) ? json.data.result : '';
      onProgress && onProgress(0.9, 'Processing results...');

      // Show in UI
      var resultWrap = document.getElementById('iocr-result-wrap');
      var output = document.getElementById('iocr-output');
      var stats = document.getElementById('iocr-stats');
      if (resultWrap) resultWrap.hidden = false;
      if (output) output.value = text;
      if (stats) {
        var words = text.trim() ? text.trim().split(/\s+/).length : 0;
        stats.textContent = text.length + ' characters · ' + words + ' words';
      }

      // Return as txt file
      var blob = new Blob([text], { type: 'text/plain' });
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '-text.txt' };
    } catch (e) {
      throw new Error('OCR failed: ' + e.message);
    }
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var result = e.target.result;
        resolve(result.replace(/^data:[^;]+;base64,/, ''));
      };
      reader.onerror = function () { reject(new Error('Could not read file')); };
      reader.readAsDataURL(file);
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();

/* ToolsGallery — ai-tool-runner.js
   AI tool UI shell: textarea → AJAX (tg_ai_proxy) → display result.
   Targets .tg-tool-box[data-tool-type="ai"].
*/
(function () {
  'use strict';

  function initAiToolRunner() {
    var box = document.querySelector('.tg-tool-box[data-tool-type="ai"]');
    if (!box) return;

    // Skip if tool has its own custom JS handler
    var handler = box.dataset.handler || '';
    if (window.TGTools && window.TGTools[handler]) return;

    var textInput = box.querySelector('#tg-text-input');
    var generateBtn = box.querySelector('.tg-generate-btn');
    var loadingEl = box.querySelector('.tg-ai-loading');
    var outputEl = box.querySelector('.tg-ai-output');
    var wordCountEl = box.querySelector('.tg-word-count');
    var copyBtn = box.querySelector('.tg-copy-btn');
    var downloadBtn = box.querySelector('.tg-download-txt');
    var outputContent = box.querySelector('.tg-output-content');
    var nonceField = document.getElementById('tg_nonce');

    var cfg = window.tgAiConfig || {};

    var API_MISSING_MSG = 'AI tools require an OpenRouter API key. Add OPENROUTER_API_KEY to wp-config.php to enable this tool.';

    /* --- Helpers --- */
    function countWords(str) {
      return str.trim().split(/\s+/).filter(Boolean).length;
    }

    function showOutput(text, isWarning) {
      if (!outputEl) return;
      outputEl.hidden = false;

      if (isWarning) {
        outputEl.dataset.warning = '';
      } else {
        delete outputEl.dataset.warning;
      }

      if (outputContent) {
        outputContent.textContent = text;
      }

      if (wordCountEl) {
        var wc = countWords(text);
        wordCountEl.textContent = wc + (wc === 1 ? ' word' : ' words');
      }
    }

    /* --- Generate button --- */
    if (generateBtn) {
      generateBtn.addEventListener('click', function () {
        var text = textInput ? textInput.value.trim() : '';
        if (!text) {
          if (textInput) textInput.focus();
          return;
        }

        generateBtn.disabled = true;
        if (loadingEl) loadingEl.hidden = false;
        if (outputEl) outputEl.hidden = true;

        var body = new URLSearchParams();
        body.append('action', 'tg_ai_proxy');
        body.append('nonce', nonceField ? nonceField.value : (cfg.nonce || ''));
        body.append('tool', box.dataset.handler || cfg.toolKey || '');
        body.append('payload[text]', text);

        fetch(cfg.ajaxUrl || '/wp-admin/admin-ajax.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            generateBtn.disabled = false;
            if (loadingEl) loadingEl.hidden = true;

            if (!data.success) {
              var msg = (data.data && data.data.message) ? data.data.message : 'An error occurred. Please try again.';
              var isApiError = msg.toLowerCase().indexOf('api') !== -1 || msg.toLowerCase().indexOf('configured') !== -1;
              showOutput(isApiError ? API_MISSING_MSG : 'Error: ' + msg, true);
            } else {
              var result = (data.data && data.data.result != null) ? data.data.result : '';
              if (!result.trim()) {
                showOutput('AI returned an empty response. Please try again or rephrase your input.', true);
              } else {
                showOutput(result, false);
              }
            }
          })
          .catch(function () {
            generateBtn.disabled = false;
            if (loadingEl) loadingEl.hidden = true;
            showOutput(API_MISSING_MSG, true);
          });
      });
    }

    /* --- Copy button --- */
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = outputContent ? outputContent.textContent : '';
        if (!text.trim()) return;
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(function () {
          var orig = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = orig; }, 2000);
        });
      });
    }

    /* --- Download .txt button --- */
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        var text = outputContent ? outputContent.textContent : '';
        if (!text.trim()) return;
        var blob = new Blob([text], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'toolsgallery-output.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  } // end initAiToolRunner

  // Use setTimeout to allow custom tool JS to register first
  setTimeout(initAiToolRunner, 0);
})();

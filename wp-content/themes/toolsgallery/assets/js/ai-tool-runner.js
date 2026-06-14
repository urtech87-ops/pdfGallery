/* ToolsGallery — ai-tool-runner.js
   Handles AI tool UI: textarea input → AJAX to tg_ai_proxy → display result.
*/
(function () {
  'use strict';

  var form    = document.querySelector('.tg-ai-form');
  var input   = document.querySelector('.tg-ai-input');
  var output  = document.querySelector('.tg-ai-output');
  var runBtn  = document.querySelector('.tg-ai-run-btn');
  var copyBtn = document.querySelector('.tg-ai-copy-btn');

  if (!form || !runBtn) return;

  /* Nonce and tool key are localised via wp_localize_script */
  var cfg = window.tgAiConfig || {};

  function setLoading(loading) {
    runBtn.disabled = loading;
    runBtn.textContent = loading ? 'Processing…' : (cfg.actionLabel || 'Run Tool');
    if (output) {
      if (loading) {
        output.classList.add('is-visible');
        output.textContent = '⏳ Thinking…';
      }
    }
  }

  function showOutput(text, isError) {
    if (!output) return;
    output.classList.add('is-visible');
    output.textContent = text;
    if (isError) output.style.color = 'var(--color-error)';
    else output.style.color = '';
  }

  runBtn.addEventListener('click', function () {
    var text = input ? input.value.trim() : '';
    if (!text) { input && input.focus(); return; }

    setLoading(true);

    var body = new URLSearchParams();
    body.append('action', 'tg_ai_proxy');
    body.append('nonce', cfg.nonce || '');
    body.append('tool', cfg.toolKey || '');
    body.append('payload[text]', text);

    fetch(cfg.ajaxUrl || '/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setLoading(false);
        if (data.success && data.data && data.data.result) {
          showOutput(data.data.result, false);
        } else {
          var msg = (data.data && data.data.message) ? data.data.message : 'An error occurred.';
          showOutput('Error: ' + msg, true);
        }
      })
      .catch(function (err) {
        setLoading(false);
        showOutput('Network error: ' + err.message, true);
      });
  });

  if (copyBtn && output) {
    copyBtn.addEventListener('click', function () {
      var text = output.textContent;
      if (!text || !text.trim()) return;
      navigator.clipboard.writeText(text).then(function () {
        var orig = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        setTimeout(function () { copyBtn.textContent = orig; }, 2000);
      });
    });
  }
})();

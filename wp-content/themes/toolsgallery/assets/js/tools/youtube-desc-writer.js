(function () {
  'use strict';

  var HANDLER = 'youtube-desc-writer';
  var box = document.querySelector('.tg-tool-box[data-handler="' + HANDLER + '"]');
  if (!box) return;

  /* ── CSS injection ── */
  if (!document.getElementById('tg-ai5-css')) {
    var style = document.createElement('style');
    style.id = 'tg-ai5-css';
    style.textContent = [
      '.tg-ai5-form{display:flex;flex-direction:column;gap:16px}',
      '.tg-ai5-label{display:block;font-size:13px;font-weight:600;color:var(--color-gray-700,#374151);margin-bottom:6px}',
      '.tg-ai5-textarea{width:100%;min-height:180px;padding:12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:15px;font-family:inherit;resize:vertical;box-sizing:border-box}',
      '.tg-ai5-textarea:focus{outline:none;border-color:var(--color-primary,#6366f1);box-shadow:0 0 0 3px rgba(99,102,241,.1)}',
      '.tg-ai5-input{width:100%;padding:10px 12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:14px;font-family:inherit;box-sizing:border-box}',
      '.tg-ai5-select{width:100%;padding:10px 12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:14px;font-family:inherit;background:#fff;box-sizing:border-box}',
      '.tg-ai5-row{display:flex;gap:12px;flex-wrap:wrap}',
      '.tg-ai5-col{flex:1;min-width:140px}',
      '.tg-ai5-toggles{display:flex;gap:8px;flex-wrap:wrap}',
      '.tg-ai5-toggle{padding:6px 14px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:20px;font-size:13px;cursor:pointer;background:#fff;transition:all .2s}',
      '.tg-ai5-toggle.active{background:var(--color-primary,#6366f1);color:#fff;border-color:var(--color-primary,#6366f1)}',
      '.tg-ai5-btn{padding:12px 28px;background:var(--color-primary,#6366f1);color:#fff;border:none;border-radius:var(--radius-md,8px);font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s}',
      '.tg-ai5-btn:hover{opacity:.9}',
      '.tg-ai5-btn:disabled{opacity:.5;cursor:not-allowed}',
      '.tg-ai5-loading{display:none;align-items:center;gap:10px;padding:16px 0;color:var(--color-gray-500,#6b7280)}',
      '.tg-ai5-loading.show{display:flex}',
      '.tg-ai5-dot{width:8px;height:8px;background:var(--color-primary,#6366f1);border-radius:50%;display:inline-block;animation:tg5bounce 1.2s infinite}',
      '.tg-ai5-dot:nth-child(2){animation-delay:.2s}',
      '.tg-ai5-dot:nth-child(3){animation-delay:.4s}',
      '@keyframes tg5bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}',
      '.tg-ai5-result{background:var(--color-gray-50,#f9fafb);border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:20px;font-size:15px;line-height:1.7;white-space:pre-wrap;max-height:500px;overflow-y:auto;margin-top:16px;display:none}',
      '.tg-ai5-result.show{display:block}',
      '.tg-ai5-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}',
      '.tg-ai5-action-btn{padding:8px 16px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:13px;cursor:pointer;background:#fff;transition:all .2s}',
      '.tg-ai5-action-btn:hover{border-color:var(--color-primary,#6366f1);color:var(--color-primary,#6366f1)}',
      '.tg-ai5-meta{font-size:12px;color:var(--color-gray-500,#6b7280);margin-top:8px}',
      '.tg-ai5-error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:var(--radius-md,8px);padding:12px;margin-top:12px;display:none}',
      '.tg-ai5-error.show{display:block}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ── AJAX helper ── */
  function callAI(handler, payload, onSuccess, onError) {
    var formData = new URLSearchParams();
    formData.append('action', 'tg_ai_proxy');
    formData.append('nonce', (window.tgAiConfig && window.tgAiConfig.nonce) || (document.getElementById('tg_nonce') ? document.getElementById('tg_nonce').value : ''));
    formData.append('tool', handler);
    Object.keys(payload).forEach(function (k) { formData.append('payload[' + k + ']', payload[k]); });
    fetch((window.tgAiConfig && window.tgAiConfig.ajaxUrl) || '/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) { onError((data.data && data.data.message) || 'An error occurred. Please try again.'); return; }
      var _r = (data.data && data.data.result != null) ? data.data.result : '';
      if (!_r.trim()) { onError('AI returned an empty response. Please try again or rephrase your input.'); return; }
      onSuccess(_r);
    }).catch(function () { onError('Network error. Please try again.'); });
  }

  /* ── Toggle helpers ── */
  function makeToggles(container, options, defaultValue, multi) {
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tg-ai5-toggle' + (opt === defaultValue ? ' active' : '');
      btn.textContent = opt;
      btn.dataset.value = opt;
      btn.addEventListener('click', function () {
        if (multi) {
          btn.classList.toggle('active');
        } else {
          container.querySelectorAll('.tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        }
      });
      container.appendChild(btn);
    });
  }

  function getActiveToggles(container) {
    return Array.from(container.querySelectorAll('.tg-ai5-toggle.active')).map(function (b) { return b.dataset.value; });
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text.trim()).then(function () {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    });
  }

  /* ── Build UI ── */
  box.innerHTML = '';

  var form = document.createElement('div');
  form.className = 'tg-ai5-form';

  /* Video title */
  var titleLabel = document.createElement('label');
  titleLabel.className = 'tg-ai5-label';
  titleLabel.textContent = 'Video Title *';
  var titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'tg-ai5-input';
  titleInput.placeholder = 'Your YouTube video title';
  var titleGroup = document.createElement('div');
  titleGroup.appendChild(titleLabel);
  titleGroup.appendChild(titleInput);
  form.appendChild(titleGroup);

  /* Topic / summary */
  var topicLabel = document.createElement('label');
  topicLabel.className = 'tg-ai5-label';
  topicLabel.textContent = 'Video Topic / Summary *';
  var topicTextarea = document.createElement('textarea');
  topicTextarea.className = 'tg-ai5-textarea';
  topicTextarea.placeholder = 'What is this video about?';
  topicTextarea.style.minHeight = '120px';
  var topicGroup = document.createElement('div');
  topicGroup.appendChild(topicLabel);
  topicGroup.appendChild(topicTextarea);
  form.appendChild(topicGroup);

  /* Niche + Keywords row */
  var row1 = document.createElement('div');
  row1.className = 'tg-ai5-row';

  var nicheCol = document.createElement('div');
  nicheCol.className = 'tg-ai5-col';
  var nicheLabel = document.createElement('label');
  nicheLabel.className = 'tg-ai5-label';
  nicheLabel.textContent = 'Channel Niche';
  var nicheInput = document.createElement('input');
  nicheInput.type = 'text';
  nicheInput.className = 'tg-ai5-input';
  nicheInput.placeholder = 'e.g. cooking, tech reviews, fitness';
  nicheCol.appendChild(nicheLabel);
  nicheCol.appendChild(nicheInput);

  var kwCol = document.createElement('div');
  kwCol.className = 'tg-ai5-col';
  var kwLabel = document.createElement('label');
  kwLabel.className = 'tg-ai5-label';
  kwLabel.textContent = 'SEO Keywords';
  var kwInput = document.createElement('input');
  kwInput.type = 'text';
  kwInput.className = 'tg-ai5-input';
  kwInput.placeholder = 'comma-separated SEO keywords';
  kwCol.appendChild(kwLabel);
  kwCol.appendChild(kwInput);

  row1.appendChild(nicheCol);
  row1.appendChild(kwCol);
  form.appendChild(row1);

  /* Chapters */
  var chapLabel = document.createElement('label');
  chapLabel.className = 'tg-ai5-label';
  chapLabel.textContent = 'Chapters (optional)';
  var chapTextarea = document.createElement('textarea');
  chapTextarea.className = 'tg-ai5-textarea';
  chapTextarea.placeholder = '0:00 Intro\n1:30 Main topic\n5:00 Conclusion';
  chapTextarea.style.minHeight = '90px';
  var chapGroup = document.createElement('div');
  chapGroup.appendChild(chapLabel);
  chapGroup.appendChild(chapTextarea);
  form.appendChild(chapGroup);

  /* Include */
  var includeLabel = document.createElement('label');
  includeLabel.className = 'tg-ai5-label';
  includeLabel.textContent = 'Include';
  var includeToggles = document.createElement('div');
  includeToggles.className = 'tg-ai5-toggles';
  makeToggles(includeToggles, ['Hook', 'Main description', 'Links section', 'Subscribe CTA', 'Hashtags', 'Chapters'], null, true);
  includeToggles.querySelectorAll('.tg-ai5-toggle').forEach(function (b) { b.classList.add('active'); });
  var includeGroup = document.createElement('div');
  includeGroup.appendChild(includeLabel);
  includeGroup.appendChild(includeToggles);
  form.appendChild(includeGroup);

  /* Submit */
  var submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'tg-ai5-btn';
  submitBtn.textContent = 'Write Description';
  submitBtn.disabled = true;
  form.appendChild(submitBtn);

  /* Loading */
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Writing your YouTube description…</span>';
  form.appendChild(loading);

  /* Error */
  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  /* Result */
  var resultWrap = document.createElement('div');

  box.appendChild(form);
  box.appendChild(resultWrap);

  function checkValid() {
    submitBtn.disabled = titleInput.value.trim() === '';
  }
  titleInput.addEventListener('input', checkValid);

  /* ── Render ── */
  function renderResults(result) {
    resultWrap.innerHTML = '';

    var charCount = document.createElement('div');
    charCount.style.cssText = 'font-size:12px;color:var(--color-gray-500,#6b7280);margin-top:16px;margin-bottom:4px';
    charCount.textContent = result.length + ' characters';
    resultWrap.appendChild(charCount);

    var resultEl = document.createElement('div');
    resultEl.className = 'tg-ai5-result show';
    resultEl.textContent = result;
    resultWrap.appendChild(resultEl);

    var actions = document.createElement('div');
    actions.className = 'tg-ai5-actions';

    var copyBtn = document.createElement('button');
    copyBtn.className = 'tg-ai5-action-btn';
    copyBtn.textContent = 'Copy Full Description';
    copyBtn.addEventListener('click', function () { copyText(result, copyBtn); });

    var downloadBtn = document.createElement('button');
    downloadBtn.className = 'tg-ai5-action-btn';
    downloadBtn.textContent = 'Download .txt';
    downloadBtn.addEventListener('click', function () {
      var blob = new Blob([result], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = HANDLER + '-output.txt';
      a.click();
    });

    var tryAgainBtn = document.createElement('button');
    tryAgainBtn.className = 'tg-ai5-action-btn';
    tryAgainBtn.textContent = 'Try Again';
    tryAgainBtn.addEventListener('click', function () {
      resultWrap.innerHTML = '';
      submitBtn.click();
    });

    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(tryAgainBtn);
    resultWrap.appendChild(actions);

    var meta = document.createElement('div');
    meta.className = 'tg-ai5-meta';
    meta.textContent = 'Powered by AI ✨';
    resultWrap.appendChild(meta);
  }

  /* ── Submit ── */
  submitBtn.addEventListener('click', function () {
    var title = titleInput.value.trim();
    if (!title) return;

    loading.classList.add('show');
    submitBtn.disabled = true;
    errorDiv.classList.remove('show');
    resultWrap.innerHTML = '';

    var payload = {
      title: title,
      topic: topicTextarea.value.trim(),
      niche: nicheInput.value.trim(),
      keywords: kwInput.value.trim(),
      chapters: chapTextarea.value.trim(),
      includes: getActiveToggles(includeToggles).join(', ')
    };

    callAI(HANDLER, payload, function (result) {
      loading.classList.remove('show');
      submitBtn.disabled = false;
      renderResults(result);
    }, function (err) {
      loading.classList.remove('show');
      submitBtn.disabled = false;
      errorDiv.textContent = err;
      errorDiv.classList.add('show');
    });
  });

  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { handler: HANDLER };

}());

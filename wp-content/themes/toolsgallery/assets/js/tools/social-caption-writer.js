(function () {
  'use strict';

  var HANDLER = 'social-caption-writer';
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
      if (data.success && data.data && data.data.result) { onSuccess(data.data.result); }
      else { onError((data.data && data.data.message) || 'An error occurred.'); }
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

  function getActiveToggle(container) {
    var active = container.querySelector('.tg-ai5-toggle.active');
    return active ? active.dataset.value : '';
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

  /* Topic textarea */
  var topicLabel = document.createElement('label');
  topicLabel.className = 'tg-ai5-label';
  topicLabel.textContent = 'What is the post about? *';
  var topicTextarea = document.createElement('textarea');
  topicTextarea.className = 'tg-ai5-textarea';
  topicTextarea.placeholder = 'Describe your post, photo or video…';
  topicTextarea.style.minHeight = '120px';
  var topicGroup = document.createElement('div');
  topicGroup.appendChild(topicLabel);
  topicGroup.appendChild(topicTextarea);
  form.appendChild(topicGroup);

  /* Platform */
  var platformLabel = document.createElement('label');
  platformLabel.className = 'tg-ai5-label';
  platformLabel.textContent = 'Platform';
  var platformToggles = document.createElement('div');
  platformToggles.className = 'tg-ai5-toggles';
  makeToggles(platformToggles, ['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'TikTok', 'Pinterest', 'YouTube'], 'Instagram', false);
  var platformGroup = document.createElement('div');
  platformGroup.appendChild(platformLabel);
  platformGroup.appendChild(platformToggles);
  form.appendChild(platformGroup);

  /* Caption tone */
  var toneLabel = document.createElement('label');
  toneLabel.className = 'tg-ai5-label';
  toneLabel.textContent = 'Caption Tone';
  var toneToggles = document.createElement('div');
  toneToggles.className = 'tg-ai5-toggles';
  makeToggles(toneToggles, ['Inspiring', 'Funny', 'Professional', 'Casual', 'Educational', 'Storytelling', 'Promotional'], 'Casual', false);
  var toneGroup = document.createElement('div');
  toneGroup.appendChild(toneLabel);
  toneGroup.appendChild(toneToggles);
  form.appendChild(toneGroup);

  /* Include */
  var includeLabel = document.createElement('label');
  includeLabel.className = 'tg-ai5-label';
  includeLabel.textContent = 'Include';
  var includeToggles = document.createElement('div');
  includeToggles.className = 'tg-ai5-toggles';
  makeToggles(includeToggles, ['Emojis', 'Hashtags', 'Call to action', 'Question to audience', 'Line breaks'], null, true);
  /* Default: Emojis + Hashtags */
  includeToggles.querySelectorAll('.tg-ai5-toggle').forEach(function (b) {
    if (b.dataset.value === 'Emojis' || b.dataset.value === 'Hashtags') b.classList.add('active');
  });
  var includeGroup = document.createElement('div');
  includeGroup.appendChild(includeLabel);
  includeGroup.appendChild(includeToggles);
  form.appendChild(includeGroup);

  /* Count + Length row */
  var row1 = document.createElement('div');
  row1.className = 'tg-ai5-row';

  var countCol = document.createElement('div');
  countCol.className = 'tg-ai5-col';
  var countLabel = document.createElement('label');
  countLabel.className = 'tg-ai5-label';
  countLabel.textContent = 'Number of Captions';
  var countToggles = document.createElement('div');
  countToggles.className = 'tg-ai5-toggles';
  makeToggles(countToggles, ['1', '3', '5'], '3', false);
  countCol.appendChild(countLabel);
  countCol.appendChild(countToggles);

  var lengthCol = document.createElement('div');
  lengthCol.className = 'tg-ai5-col';
  var lengthLabel = document.createElement('label');
  lengthLabel.className = 'tg-ai5-label';
  lengthLabel.textContent = 'Caption Length';
  var lengthToggles = document.createElement('div');
  lengthToggles.className = 'tg-ai5-toggles';
  makeToggles(lengthToggles, ['Short (<100 chars)', 'Medium', 'Long', 'Platform max'], 'Medium', false);
  lengthCol.appendChild(lengthLabel);
  lengthCol.appendChild(lengthToggles);

  row1.appendChild(countCol);
  row1.appendChild(lengthCol);
  form.appendChild(row1);

  /* Submit */
  var submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'tg-ai5-btn';
  submitBtn.textContent = 'Write Caption';
  submitBtn.disabled = true;
  form.appendChild(submitBtn);

  /* Loading */
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Writing your captions…</span>';
  form.appendChild(loading);

  /* Error */
  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  /* Result */
  var resultWrap = document.createElement('div');

  box.appendChild(form);
  box.appendChild(resultWrap);

  topicTextarea.addEventListener('input', function () {
    submitBtn.disabled = topicTextarea.value.trim() === '';
  });

  /* ── Caption parser ── */
  function parseCaptions(text, count) {
    if (count === 1) return [text.trim()];
    /* Try numbered patterns: "1.", "Caption 1:", etc. */
    var numbered = text.split(/\n(?=(?:Caption\s*)?\d+[.:)\s])/i);
    if (numbered.length >= count) return numbered.map(function (s) { return s.trim(); }).filter(Boolean);
    /* Fall back to double-newline split */
    var byBlank = text.split(/\n\n+/);
    if (byBlank.length >= 2) return byBlank.map(function (s) { return s.trim(); }).filter(Boolean);
    return [text.trim()];
  }

  function renderResults(result, count) {
    resultWrap.innerHTML = '';
    var captions = parseCaptions(result, parseInt(count, 10));

    if (captions.length > 1) {
      captions.forEach(function (cap, i) {
        var card = document.createElement('div');
        card.style.cssText = 'background:#fff;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:16px;margin-bottom:12px';

        var heading = document.createElement('div');
        heading.style.cssText = 'font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-primary,#6366f1);margin-bottom:8px';
        heading.textContent = 'Caption ' + (i + 1);

        var content = document.createElement('div');
        content.style.cssText = 'font-size:14px;line-height:1.8;white-space:pre-wrap;color:var(--color-gray-700,#374151)';
        content.textContent = cap;

        var copyBtn = document.createElement('button');
        copyBtn.className = 'tg-ai5-action-btn';
        copyBtn.textContent = 'Copy Caption';
        copyBtn.style.marginTop = '10px';
        (function (c, b) {
          b.addEventListener('click', function () { copyText(c, b); });
        }(cap, copyBtn));

        card.appendChild(heading);
        card.appendChild(content);
        card.appendChild(copyBtn);
        resultWrap.appendChild(card);
      });
    } else {
      var raw = document.createElement('div');
      raw.className = 'tg-ai5-result show';
      raw.textContent = result;
      resultWrap.appendChild(raw);
    }

    var actions = document.createElement('div');
    actions.className = 'tg-ai5-actions';

    var copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'tg-ai5-action-btn';
    copyAllBtn.textContent = 'Copy All';
    copyAllBtn.addEventListener('click', function () { copyText(result, copyAllBtn); });

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

    actions.appendChild(copyAllBtn);
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
    var topic = topicTextarea.value.trim();
    if (!topic) return;

    loading.classList.add('show');
    submitBtn.disabled = true;
    errorDiv.classList.remove('show');
    resultWrap.innerHTML = '';

    var count = getActiveToggle(countToggles);
    var payload = {
      topic: topic,
      platform: getActiveToggle(platformToggles),
      tone: getActiveToggle(toneToggles),
      count: count,
      includes: getActiveToggles(includeToggles).join(', '),
      length: getActiveToggle(lengthToggles)
    };

    callAI(HANDLER, payload, function (result) {
      loading.classList.remove('show');
      submitBtn.disabled = false;
      renderResults(result, count);
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

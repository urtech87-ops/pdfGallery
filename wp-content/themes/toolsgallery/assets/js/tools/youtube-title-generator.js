(function () {
  'use strict';

  var HANDLER = 'youtube-title-generator';
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
      '.tg-ai5-error.show{display:block}',
      /* YouTube title specific */
      '.tg-yt-title-card{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:12px 16px;margin-bottom:8px}',
      '.tg-yt-title-text{flex:1;font-size:14px;font-weight:500}',
      '.tg-yt-char-count{font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;white-space:nowrap}',
      '.tg-yt-char-ok{background:#f0fdf4;color:#16a34a}',
      '.tg-yt-char-low{background:#fefce8;color:#ca8a04}',
      '.tg-yt-char-high{background:#fff7ed;color:#ea580c}',
      '.tg-yt-char-too-long{background:#fef2f2;color:#dc2626}'
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

  function getActiveToggle(container) {
    var active = container.querySelector('.tg-ai5-toggle.active');
    return active ? active.dataset.value : '';
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

  /* Video topic */
  var topicLabel = document.createElement('label');
  topicLabel.className = 'tg-ai5-label';
  topicLabel.textContent = 'Video Topic *';
  var topicInput = document.createElement('input');
  topicInput.type = 'text';
  topicInput.className = 'tg-ai5-input';
  topicInput.placeholder = 'e.g. How to make sourdough bread';
  var topicGroup = document.createElement('div');
  topicGroup.appendChild(topicLabel);
  topicGroup.appendChild(topicInput);
  form.appendChild(topicGroup);

  /* Video type */
  var typeLabel = document.createElement('label');
  typeLabel.className = 'tg-ai5-label';
  typeLabel.textContent = 'Video Type';
  var typeSelect = document.createElement('select');
  typeSelect.className = 'tg-ai5-select';
  ['Tutorial', 'Review', 'Vlog', 'Reaction', 'Top List', 'Documentary', 'Challenge', 'Q&A', 'Commentary'].forEach(function (t) {
    var opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    typeSelect.appendChild(opt);
  });
  var typeGroup = document.createElement('div');
  typeGroup.appendChild(typeLabel);
  typeGroup.appendChild(typeSelect);
  form.appendChild(typeGroup);

  /* Audience + Keywords row */
  var row1 = document.createElement('div');
  row1.className = 'tg-ai5-row';

  var audCol = document.createElement('div');
  audCol.className = 'tg-ai5-col';
  var audLabel = document.createElement('label');
  audLabel.className = 'tg-ai5-label';
  audLabel.textContent = 'Target Audience';
  var audInput = document.createElement('input');
  audInput.type = 'text';
  audInput.className = 'tg-ai5-input';
  audInput.placeholder = 'e.g. home bakers, beginners';
  audCol.appendChild(audLabel);
  audCol.appendChild(audInput);

  var kwCol = document.createElement('div');
  kwCol.className = 'tg-ai5-col';
  var kwLabel = document.createElement('label');
  kwLabel.className = 'tg-ai5-label';
  kwLabel.textContent = 'Keywords to Include (optional)';
  var kwInput = document.createElement('input');
  kwInput.type = 'text';
  kwInput.className = 'tg-ai5-input';
  kwInput.placeholder = 'comma-separated';
  kwCol.appendChild(kwLabel);
  kwCol.appendChild(kwInput);

  row1.appendChild(audCol);
  row1.appendChild(kwCol);
  form.appendChild(row1);

  /* Title style */
  var styleLabel = document.createElement('label');
  styleLabel.className = 'tg-ai5-label';
  styleLabel.textContent = 'Title Style';
  var styleToggles = document.createElement('div');
  styleToggles.className = 'tg-ai5-toggles';
  makeToggles(styleToggles, ['Clickbait', 'Informative', 'Question', 'How-To', 'Listicle', 'Story', 'Mixed'], 'Mixed', false);
  var styleGroup = document.createElement('div');
  styleGroup.appendChild(styleLabel);
  styleGroup.appendChild(styleToggles);
  form.appendChild(styleGroup);

  /* Count */
  var countLabel = document.createElement('label');
  countLabel.className = 'tg-ai5-label';
  countLabel.textContent = 'Number of Titles';
  var countToggles = document.createElement('div');
  countToggles.className = 'tg-ai5-toggles';
  makeToggles(countToggles, ['5', '10', '15'], '10', false);
  var countGroup = document.createElement('div');
  countGroup.appendChild(countLabel);
  countGroup.appendChild(countToggles);
  form.appendChild(countGroup);

  /* Submit */
  var submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'tg-ai5-btn';
  submitBtn.textContent = 'Generate Titles';
  submitBtn.disabled = true;
  form.appendChild(submitBtn);

  /* Loading */
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Generating YouTube titles…</span>';
  form.appendChild(loading);

  /* Error */
  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  /* Result */
  var resultWrap = document.createElement('div');

  box.appendChild(form);
  box.appendChild(resultWrap);

  topicInput.addEventListener('input', function () {
    submitBtn.disabled = topicInput.value.trim() === '';
  });

  /* ── Title parser ── */
  function parseTitles(text) {
    var lines = text.split('\n');
    var titles = [];
    lines.forEach(function (line) {
      var clean = line.trim();
      if (!clean) return;
      /* Remove leading number/dot/paren */
      var m = clean.match(/^\d+[\.\):\-]\s*(.+)/);
      if (m) { titles.push(m[1].trim()); return; }
      /* Remove leading dash/bullet */
      var m2 = clean.match(/^[-•*]\s*(.+)/);
      if (m2) { titles.push(m2[1].trim()); return; }
      if (clean.length > 10) titles.push(clean);
    });
    return titles;
  }

  function charClass(len) {
    if (len >= 60 && len <= 70) return 'tg-yt-char-ok';
    if (len < 60) return 'tg-yt-char-low';
    if (len <= 90) return 'tg-yt-char-high';
    return 'tg-yt-char-too-long';
  }

  function renderResults(result) {
    resultWrap.innerHTML = '';
    var titles = parseTitles(result);

    if (titles.length > 0) {
      var wrap = document.createElement('div');
      wrap.style.marginTop = '16px';

      titles.forEach(function (title) {
        var card = document.createElement('div');
        card.className = 'tg-yt-title-card';

        var titleText = document.createElement('div');
        titleText.className = 'tg-yt-title-text';
        titleText.textContent = title;

        var charBadge = document.createElement('span');
        charBadge.className = 'tg-yt-char-count ' + charClass(title.length);
        charBadge.textContent = title.length + ' chars';

        var copyBtn = document.createElement('button');
        copyBtn.className = 'tg-ai5-action-btn';
        copyBtn.textContent = 'Copy';
        (function (t, b) {
          b.addEventListener('click', function () { copyText(t, b); });
        }(title, copyBtn));

        card.appendChild(titleText);
        card.appendChild(charBadge);
        card.appendChild(copyBtn);
        wrap.appendChild(card);
      });

      resultWrap.appendChild(wrap);
    } else {
      var raw = document.createElement('div');
      raw.className = 'tg-ai5-result show';
      raw.textContent = result;
      resultWrap.appendChild(raw);
      titles = [];
    }

    /* Actions */
    var actions = document.createElement('div');
    actions.className = 'tg-ai5-actions';

    var copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'tg-ai5-action-btn';
    copyAllBtn.textContent = 'Copy All';
    copyAllBtn.addEventListener('click', function () {
      var all = titles.length > 0 ? titles.join('\n') : result;
      copyText(all, copyAllBtn);
    });

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
    meta.textContent = 'Powered by AI ✨  |  Green = optimal (60-70 chars)  |  Yellow = short  |  Orange = long  |  Red = too long';
    resultWrap.appendChild(meta);
  }

  /* ── Submit ── */
  submitBtn.addEventListener('click', function () {
    var topic = topicInput.value.trim();
    if (!topic) return;

    loading.classList.add('show');
    submitBtn.disabled = true;
    errorDiv.classList.remove('show');
    resultWrap.innerHTML = '';

    var payload = {
      topic: topic,
      type: typeSelect.value,
      audience: audInput.value.trim(),
      keywords: kwInput.value.trim(),
      style: getActiveToggle(styleToggles),
      count: getActiveToggle(countToggles)
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

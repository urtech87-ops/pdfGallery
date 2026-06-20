(function () {
  'use strict';

  var HANDLER = 'hashtag-generator';
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
      /* Hashtag specific */
      '.tg-ht-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
      '.tg-ht-tag{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:20px;padding:6px 12px;font-size:13px;cursor:pointer;transition:all .2s}',
      '.tg-ht-tag:hover{border-color:var(--color-primary,#6366f1);background:var(--color-primary-light,#eef2ff)}',
      '.tg-ht-badge{font-size:10px;padding:1px 6px;border-radius:10px;font-weight:700}',
      '.tg-ht-huge{background:#fef2f2;color:#dc2626}',
      '.tg-ht-large{background:#fff7ed;color:#ea580c}',
      '.tg-ht-medium{background:#eff6ff;color:#2563eb}',
      '.tg-ht-niche{background:#f0fdf4;color:#16a34a}'
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

  /* Topic */
  var topicLabel = document.createElement('label');
  topicLabel.className = 'tg-ai5-label';
  topicLabel.textContent = 'Topic / Content *';
  var topicTextarea = document.createElement('textarea');
  topicTextarea.className = 'tg-ai5-textarea';
  topicTextarea.placeholder = 'Describe your content or topic…';
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
  makeToggles(platformToggles, ['Instagram', 'Twitter/X', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook', 'Pinterest'], 'Instagram', false);
  var platformGroup = document.createElement('div');
  platformGroup.appendChild(platformLabel);
  platformGroup.appendChild(platformToggles);
  form.appendChild(platformGroup);

  /* Niche */
  var nicheLabel = document.createElement('label');
  nicheLabel.className = 'tg-ai5-label';
  nicheLabel.textContent = 'Niche (optional)';
  var nicheInput = document.createElement('input');
  nicheInput.type = 'text';
  nicheInput.className = 'tg-ai5-input';
  nicheInput.placeholder = 'e.g. fitness, travel, food';
  var nicheGroup = document.createElement('div');
  nicheGroup.appendChild(nicheLabel);
  nicheGroup.appendChild(nicheInput);
  form.appendChild(nicheGroup);

  /* Mix + Count row */
  var row1 = document.createElement('div');
  row1.className = 'tg-ai5-row';

  var mixCol = document.createElement('div');
  mixCol.className = 'tg-ai5-col';
  var mixLabel = document.createElement('label');
  mixLabel.className = 'tg-ai5-label';
  mixLabel.textContent = 'Hashtag Mix';
  var mixToggles = document.createElement('div');
  mixToggles.className = 'tg-ai5-toggles';
  makeToggles(mixToggles, ['All Popular', 'Mix', 'All Niche', 'Trending Focus'], 'Mix', false);
  mixCol.appendChild(mixLabel);
  mixCol.appendChild(mixToggles);

  var countCol = document.createElement('div');
  countCol.className = 'tg-ai5-col';
  var countLabel = document.createElement('label');
  countLabel.className = 'tg-ai5-label';
  countLabel.textContent = 'Number of Hashtags';
  var countToggles = document.createElement('div');
  countToggles.className = 'tg-ai5-toggles';
  makeToggles(countToggles, ['10', '20', '30'], '20', false);
  countCol.appendChild(countLabel);
  countCol.appendChild(countToggles);

  row1.appendChild(mixCol);
  row1.appendChild(countCol);
  form.appendChild(row1);

  /* Submit */
  var submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'tg-ai5-btn';
  submitBtn.textContent = 'Generate Hashtags';
  submitBtn.disabled = true;
  form.appendChild(submitBtn);

  /* Loading */
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Finding the best hashtags…</span>';
  form.appendChild(loading);

  /* Error */
  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  /* Result area */
  var resultWrap = document.createElement('div');

  box.appendChild(form);
  box.appendChild(resultWrap);

  topicTextarea.addEventListener('input', function () {
    submitBtn.disabled = topicTextarea.value.trim() === '';
  });

  /* ── Hashtag parser ── */
  function parseHashtags(text) {
    var tags = [];
    text.split('\n').forEach(function (line) {
      line = line.trim();
      if (!line) return;
      /* Expected format: #hashtag HUGE | #hashtag [HUGE] | #hashtag - HUGE */
      var match = line.match(/^(#\S+)\s*[\-\[\(]?\s*(HUGE|LARGE|MEDIUM|NICHE)/i);
      if (match) {
        tags.push({ tag: match[1], size: match[2].toUpperCase() });
        return;
      }
      /* Fallback: just a hashtag token */
      var tagOnly = line.match(/^(#\w+)/);
      if (tagOnly) {
        tags.push({ tag: tagOnly[1], size: 'MEDIUM' });
      }
    });
    return tags;
  }

  function sizeClass(size) {
    if (size === 'HUGE') return 'tg-ht-huge';
    if (size === 'LARGE') return 'tg-ht-large';
    if (size === 'NICHE') return 'tg-ht-niche';
    return 'tg-ht-medium';
  }

  function sizeEmoji(size) {
    if (size === 'HUGE') return '🔥';
    if (size === 'LARGE') return '📈';
    if (size === 'NICHE') return '💎';
    return '🎯';
  }

  function renderResults(result) {
    resultWrap.innerHTML = '';
    var tags = parseHashtags(result);

    /* Header */
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:16px';
    var countLabel = document.createElement('span');
    countLabel.style.cssText = 'font-size:13px;font-weight:600;color:var(--color-gray-700,#374151)';
    countLabel.textContent = tags.length + ' hashtags generated';
    header.appendChild(countLabel);
    resultWrap.appendChild(header);

    if (tags.length > 0) {
      var grid = document.createElement('div');
      grid.className = 'tg-ht-grid';

      tags.forEach(function (t) {
        var tagEl = document.createElement('span');
        tagEl.className = 'tg-ht-tag';
        tagEl.title = 'Click to copy';

        var tagText = document.createElement('span');
        tagText.textContent = t.tag;

        var badge = document.createElement('span');
        badge.className = 'tg-ht-badge ' + sizeClass(t.size);
        badge.textContent = sizeEmoji(t.size) + ' ' + t.size;

        tagEl.appendChild(tagText);
        tagEl.appendChild(badge);

        tagEl.addEventListener('click', function () {
          navigator.clipboard.writeText(t.tag).then(function () {
            var orig = tagEl.style.borderColor;
            tagEl.style.borderColor = 'var(--color-primary,#6366f1)';
            tagEl.style.background = 'var(--color-primary-light,#eef2ff)';
            setTimeout(function () {
              tagEl.style.borderColor = orig;
              tagEl.style.background = '';
            }, 800);
          });
        });

        grid.appendChild(tagEl);
      });

      resultWrap.appendChild(grid);
    } else {
      /* fallback raw */
      var raw = document.createElement('div');
      raw.className = 'tg-ai5-result show';
      raw.textContent = result;
      resultWrap.appendChild(raw);
    }

    /* Actions */
    var actions = document.createElement('div');
    actions.className = 'tg-ai5-actions';

    var copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'tg-ai5-action-btn';
    copyAllBtn.textContent = 'Copy All';
    copyAllBtn.addEventListener('click', function () {
      var all = tags.length > 0 ? tags.map(function (t) { return t.tag; }).join(' ') : result;
      copyText(all, copyAllBtn);
    });

    var copyIgBtn = document.createElement('button');
    copyIgBtn.className = 'tg-ai5-action-btn';
    copyIgBtn.textContent = 'Copy for Instagram';
    copyIgBtn.addEventListener('click', function () {
      var ig = tags.length > 0 ? tags.map(function (t) { return t.tag; }).join('\n') : result;
      copyText(ig, copyIgBtn);
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
    actions.appendChild(copyIgBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(tryAgainBtn);
    resultWrap.appendChild(actions);

    var meta = document.createElement('div');
    meta.className = 'tg-ai5-meta';
    meta.textContent = 'Powered by AI ✨';
    resultWrap.appendChild(meta);
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text.trim()).then(function () {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    });
  }

  /* ── Submit ── */
  submitBtn.addEventListener('click', function () {
    var topic = topicTextarea.value.trim();
    if (!topic) return;

    loading.classList.add('show');
    submitBtn.disabled = true;
    errorDiv.classList.remove('show');
    resultWrap.innerHTML = '';

    var payload = {
      topic: topic,
      platform: getActiveToggle(platformToggles),
      niche: nicheInput.value.trim(),
      mix: getActiveToggle(mixToggles),
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

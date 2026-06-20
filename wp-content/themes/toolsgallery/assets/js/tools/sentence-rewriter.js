(function () {
  'use strict';

  var HANDLER = 'sentence-rewriter';
  var box = document.querySelector('.tg-tool-box[data-handler="' + HANDLER + '"]');
  if (!box) return;

  /* ── CSS ── */
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
      '.tg-wc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:16px}',
      '.tg-wc-card{background:#fff;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:16px;text-align:center}',
      '.tg-wc-val{font-size:24px;font-weight:700;color:var(--color-primary,#6366f1)}',
      '.tg-wc-lbl{font-size:12px;color:var(--color-gray-500,#6b7280);margin-top:4px}',
      '.tg-wc-words{margin-top:16px;padding:16px;background:#fff;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px)}',
      '.tg-wc-words h4{margin:0 0 10px;font-size:13px;color:var(--color-gray-700,#374151)}',
      '.tg-wc-word-item{display:inline-flex;gap:6px;background:var(--color-gray-50,#f9fafb);border-radius:4px;padding:3px 8px;margin:3px;font-size:13px}',
      '.tg-wc-word-count{color:var(--color-primary,#6366f1);font-weight:600}'
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

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── State ── */
  var goals = ['Simplify','Make Formal','Make Casual','Make Shorter','Make Longer','Fix Passive Voice','Improve Clarity','Add Emphasis'];
  var counts = ['1','3','5'];
  var meanings = ['Strictly','Loosely'];
  var selectedGoal = 'Simplify';
  var selectedCount = '3';
  var selectedMeaning = 'Strictly';
  var lastRawResult = '';

  function makeToggles(items, defaultVal, id) {
    return '<div class="tg-ai5-toggles" id="' + id + '">' +
      items.map(function (t) {
        return '<button class="tg-ai5-toggle' + (t === defaultVal ? ' active' : '') + '" data-val="' + t + '">' + t + '</button>';
      }).join('') +
      '</div>';
  }

  box.innerHTML = [
    '<div class="tg-ai5-form">',
    '  <div>',
    '    <label class="tg-ai5-label">Text to Rewrite</label>',
    '    <textarea class="tg-ai5-textarea" id="sr-text" placeholder="Enter text to rewrite..."></textarea>',
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Rewrite Goal</label>',
    makeToggles(goals, 'Simplify', 'sr-goals'),
    '  </div>',
    '  <div class="tg-ai5-row">',
    '    <div class="tg-ai5-col">',
    '      <label class="tg-ai5-label">Number of Alternatives</label>',
    makeToggles(counts, '3', 'sr-counts'),
    '    </div>',
    '    <div class="tg-ai5-col">',
    '      <label class="tg-ai5-label">Keep Meaning</label>',
    makeToggles(meanings, 'Strictly', 'sr-meanings'),
    '    </div>',
    '  </div>',
    '  <div><button class="tg-ai5-btn" id="sr-btn">Rewrite</button></div>',
    '</div>',
    '<div class="tg-ai5-loading" id="sr-loading">',
    '  <span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span>',
    '  <span>Rewriting your text...</span>',
    '</div>',
    '<div id="sr-results"></div>',
    '<div class="tg-ai5-actions" id="sr-actions" style="display:none">',
    '  <button class="tg-ai5-action-btn" id="sr-download">Download .txt</button>',
    '  <button class="tg-ai5-action-btn" id="sr-again">Try Again</button>',
    '</div>',
    '<div class="tg-ai5-error" id="sr-error"></div>',
    '<div class="tg-ai5-meta" id="sr-meta"></div>'
  ].join('');

  function bindToggles(groupId, setter) {
    box.querySelector('#' + groupId).addEventListener('click', function (e) {
      var btn = e.target.closest('.tg-ai5-toggle');
      if (!btn) return;
      box.querySelectorAll('#' + groupId + ' .tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      setter(btn.dataset.val);
    });
  }

  bindToggles('sr-goals', function (v) { selectedGoal = v; });
  bindToggles('sr-counts', function (v) { selectedCount = v; });
  bindToggles('sr-meanings', function (v) { selectedMeaning = v; });

  /* ── Parse alternatives ── */
  function parseAlternatives(text) {
    /* Match lines like "1.", "1)", "Option 1:", etc. */
    var regex = /(?:^|\n)\s*(?:option\s*)?\d+[.):\-]\s*/gi;
    var parts = text.split(regex).map(function (p) { return p.trim(); }).filter(Boolean);
    if (parts.length <= 1) return null;
    return parts;
  }

  function renderAlternatives(rawText) {
    var alts = parseAlternatives(rawText);
    if (!alts || alts.length <= 1) {
      return '<div class="tg-ai5-result show">' + escHtml(rawText) + '</div>';
    }
    return alts.map(function (alt, i) {
      return [
        '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:12px;background:#fff">',
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">',
        '<div style="font-size:11px;font-weight:700;color:var(--color-primary,#6366f1);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Alternative ' + (i + 1) + '</div>',
        '<button class="tg-ai5-action-btn sr-alt-copy" data-text="' + escHtml(alt) + '" style="flex-shrink:0;padding:4px 12px;font-size:12px">Copy</button>',
        '</div>',
        '<div style="font-size:15px;line-height:1.7;white-space:pre-wrap">' + escHtml(alt) + '</div>',
        '</div>'
      ].join('');
    }).join('');
  }

  var submitBtn = box.querySelector('#sr-btn');
  var loading = box.querySelector('#sr-loading');
  var resultsEl = box.querySelector('#sr-results');
  var actions = box.querySelector('#sr-actions');
  var errorEl = box.querySelector('#sr-error');
  var metaEl = box.querySelector('#sr-meta');

  function showError(msg) { errorEl.textContent = msg; errorEl.classList.add('show'); }
  function hideError() { errorEl.classList.remove('show'); }

  submitBtn.addEventListener('click', function () {
    var text = box.querySelector('#sr-text').value.trim();
    if (!text) { showError('Please enter some text to rewrite.'); return; }
    hideError();
    resultsEl.innerHTML = '';
    actions.style.display = 'none';
    metaEl.textContent = '';
    submitBtn.disabled = true;
    loading.classList.add('show');

    var keepMeaningStr = selectedMeaning === 'Strictly'
      ? 'Preserve the original meaning strictly.'
      : 'Loosely preserve the meaning.';

    callAI(HANDLER, {
      text: text,
      goal: selectedGoal,
      count: selectedCount,
      keep_meaning: keepMeaningStr
    }, function (result) {
      lastRawResult = result;
      loading.classList.remove('show');
      submitBtn.disabled = false;
      resultsEl.innerHTML = renderAlternatives(result);
      /* bind copy buttons for individual alternatives */
      resultsEl.querySelectorAll('.sr-alt-copy').forEach(function (btn) {
        btn.addEventListener('click', function () {
          navigator.clipboard && navigator.clipboard.writeText(this.dataset.text);
          this.textContent = 'Copied!';
          var self = this;
          setTimeout(function () { self.textContent = 'Copy'; }, 1500);
        });
      });
      actions.style.display = 'flex';
      metaEl.innerHTML = 'Powered by AI ✨';
    }, function (err) {
      loading.classList.remove('show');
      submitBtn.disabled = false;
      showError(err);
    });
  });

  box.querySelector('#sr-download').addEventListener('click', function () {
    var blob = new Blob([lastRawResult], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = HANDLER + '-output.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  box.querySelector('#sr-again').addEventListener('click', function () {
    resultsEl.innerHTML = '';
    actions.style.display = 'none';
    metaEl.textContent = '';
    hideError();
  });

  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { handler: HANDLER, box: box };
})();

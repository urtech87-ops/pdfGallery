(function () {
  'use strict';

  var HANDLER = 'plagiarism-checker';
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
      /* word counter extras */
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

  /* ── SVG circle score helper ── */
  function makeSVGCircle(score, label, colorFn) {
    var r = 40;
    var circ = 2 * Math.PI * r;
    var offset = circ - (score / 100) * circ;
    var color = colorFn(score);
    return [
      '<div style="display:flex;flex-direction:column;align-items:center;gap:8px">',
      '<svg width="100" height="100" viewBox="0 0 100 100">',
      '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="#e5e7eb" stroke-width="10"/>',
      '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="10"',
      ' stroke-dasharray="' + circ.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '"',
      ' stroke-linecap="round" transform="rotate(-90 50 50)" style="transition:stroke-dashoffset .6s ease"/>',
      '<text x="50" y="55" text-anchor="middle" font-size="20" font-weight="700" fill="' + color + '">' + score + '%</text>',
      '</svg>',
      '<span style="font-size:13px;font-weight:600;color:#374151;text-align:center">' + label + '</span>',
      '</div>'
    ].join('');
  }

  function originalityColor(s) { return s > 80 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626'; }
  function aiLikelihoodColor(s) { return s > 80 ? '#dc2626' : s >= 50 ? '#d97706' : '#16a34a'; }

  /* ── Render result dashboard ── */
  function renderDashboard(jsonStr, rawText) {
    var data = null;
    try { data = JSON.parse(jsonStr); } catch (e) { /* ignore */ }
    if (!data || typeof data !== 'object') {
      return '<div class="tg-ai5-result show" style="white-space:pre-wrap">' + escHtml(rawText) + '</div>';
    }

    var originality = Math.min(100, Math.max(0, parseInt(data.originality) || 0));
    var aiLikelihood = Math.min(100, Math.max(0, parseInt(data.ai_likelihood) || 0));
    var repeated = Array.isArray(data.repeated_phrases) ? data.repeated_phrases : [];
    var assessment = data.assessment || '';

    var html = '<div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:8px;padding:20px;background:#f9fafb">';

    /* circles */
    html += '<div style="display:flex;justify-content:center;gap:40px;flex-wrap:wrap;margin-bottom:20px">';
    html += makeSVGCircle(originality, 'Originality Score', originalityColor);
    html += makeSVGCircle(aiLikelihood, 'AI Likelihood', aiLikelihoodColor);
    html += '</div>';

    /* repeated phrases */
    if (repeated.length) {
      html += '<div style="margin-bottom:16px"><strong style="font-size:13px;color:#374151">Repeated / Flagged Phrases:</strong><ul style="margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.8">';
      repeated.forEach(function (p) { html += '<li>' + escHtml(String(p)) + '</li>'; });
      html += '</ul></div>';
    }

    /* assessment */
    if (assessment) {
      html += '<div style="font-size:14px;line-height:1.7;color:#374151;margin-bottom:16px"><strong>Assessment:</strong> ' + escHtml(assessment) + '</div>';
    }

    /* disclaimer */
    html += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px;font-size:13px;color:#92400e">';
    html += '⚠️ This tool uses AI analysis, not a web database. For legally reliable plagiarism detection, use Turnitin, Copyscape or iThenticate.';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Build UI ── */
  var checkTypes = ['AI Content Detection', 'Self-Similarity', 'Writing Analysis'];
  var selectedType = checkTypes[0];
  var lastRawResult = '';

  box.innerHTML = [
    '<div class="tg-ai5-form">',
    '  <div>',
    '    <label class="tg-ai5-label">Text to Analyze</label>',
    '    <textarea class="tg-ai5-textarea" id="pc-text" placeholder="Paste your text here to analyze..."></textarea>',
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Check Type</label>',
    '    <div class="tg-ai5-toggles" id="pc-types">',
    checkTypes.map(function (t, i) {
      return '<button class="tg-ai5-toggle' + (i === 0 ? ' active' : '') + '" data-val="' + t + '">' + t + '</button>';
    }).join(''),
    '    </div>',
    '  </div>',
    '  <div>',
    '    <button class="tg-ai5-btn" id="pc-btn">Check Plagiarism</button>',
    '  </div>',
    '</div>',
    '<div class="tg-ai5-loading" id="pc-loading">',
    '  <span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span>',
    '  <span>Analyzing text...</span>',
    '</div>',
    '<div id="pc-dashboard"></div>',
    '<div class="tg-ai5-actions" id="pc-actions" style="display:none">',
    '  <button class="tg-ai5-action-btn" id="pc-copy">Copy Result</button>',
    '  <button class="tg-ai5-action-btn" id="pc-download">Download .txt</button>',
    '  <button class="tg-ai5-action-btn" id="pc-again">Try Again</button>',
    '</div>',
    '<div class="tg-ai5-error" id="pc-error"></div>',
    '<div class="tg-ai5-meta" id="pc-meta"></div>'
  ].join('');

  /* toggle logic */
  box.querySelector('#pc-types').addEventListener('click', function (e) {
    var btn = e.target.closest('.tg-ai5-toggle');
    if (!btn) return;
    box.querySelectorAll('#pc-types .tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    selectedType = btn.dataset.val;
  });

  var submitBtn = box.querySelector('#pc-btn');
  var loading = box.querySelector('#pc-loading');
  var dashboard = box.querySelector('#pc-dashboard');
  var actions = box.querySelector('#pc-actions');
  var errorEl = box.querySelector('#pc-error');
  var metaEl = box.querySelector('#pc-meta');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('show');
  }
  function hideError() { errorEl.classList.remove('show'); }

  submitBtn.addEventListener('click', function () {
    var text = box.querySelector('#pc-text').value.trim();
    if (!text) { showError('Please paste some text to analyze.'); return; }
    hideError();
    dashboard.innerHTML = '';
    actions.style.display = 'none';
    metaEl.textContent = '';
    submitBtn.disabled = true;
    loading.classList.add('show');

    callAI(HANDLER, { text: text, type: selectedType }, function (result) {
      lastRawResult = result;
      loading.classList.remove('show');
      submitBtn.disabled = false;
      dashboard.innerHTML = renderDashboard(result, result);
      actions.style.display = 'flex';
      metaEl.innerHTML = 'Powered by AI ✨';
    }, function (err) {
      loading.classList.remove('show');
      submitBtn.disabled = false;
      showError(err);
    });
  });

  box.querySelector('#pc-copy').addEventListener('click', function () {
    navigator.clipboard && navigator.clipboard.writeText(lastRawResult);
    this.textContent = 'Copied!';
    var self = this;
    setTimeout(function () { self.textContent = 'Copy Result'; }, 1500);
  });

  box.querySelector('#pc-download').addEventListener('click', function () {
    var blob = new Blob([lastRawResult], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = HANDLER + '-output.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  box.querySelector('#pc-again').addEventListener('click', function () {
    dashboard.innerHTML = '';
    actions.style.display = 'none';
    metaEl.textContent = '';
    hideError();
  });

  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { handler: HANDLER, box: box };
})();

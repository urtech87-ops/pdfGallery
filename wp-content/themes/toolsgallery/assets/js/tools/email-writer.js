(function () {
  'use strict';

  var HANDLER = 'email-writer';
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
  var emailTypes = ['Professional','Follow-up','Apology','Thank You','Request','Introduction','Complaint','Newsletter','Sales','Cold Outreach','Rejection','Invitation'];
  var tones = ['Formal','Friendly','Assertive','Empathetic'];
  var lengths = ['Brief (3-5 sentences)','Standard','Detailed'];
  var includeOpts = ['Subject line','Greeting','Signature','All'];

  var selectedTone = 'Formal';
  var selectedLength = 'Standard';
  var selectedIncludes = { 'Subject line': true, 'Greeting': true, 'Signature': false, 'All': false };
  var lastRawResult = '';

  function makeToggles(items, defaultVal, id) {
    return '<div class="tg-ai5-toggles" id="' + id + '">' +
      items.map(function (t) {
        return '<button class="tg-ai5-toggle' + (t === defaultVal ? ' active' : '') + '" data-val="' + t + '">' + t + '</button>';
      }).join('') + '</div>';
  }

  function makeMultiToggles(items, activeMap, id) {
    return '<div class="tg-ai5-toggles" id="' + id + '">' +
      items.map(function (t) {
        return '<button class="tg-ai5-toggle' + (activeMap[t] ? ' active' : '') + '" data-val="' + t + '">' + t + '</button>';
      }).join('') + '</div>';
  }

  box.innerHTML = [
    '<div class="tg-ai5-form">',
    '  <div>',
    '    <label class="tg-ai5-label">Email Type</label>',
    '    <select class="tg-ai5-select" id="ew-type">' + emailTypes.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select>',
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Context / Situation <span style="color:#dc2626">*</span></label>',
    '    <textarea class="tg-ai5-textarea" id="ew-context" placeholder="Describe what the email is about..." style="min-height:120px"></textarea>',
    '  </div>',
    '  <div class="tg-ai5-row">',
    '    <div class="tg-ai5-col">',
    '      <label class="tg-ai5-label">Sender Name</label>',
    '      <input class="tg-ai5-input" id="ew-sender" type="text" placeholder="Your name (optional)">',
    '    </div>',
    '    <div class="tg-ai5-col">',
    '      <label class="tg-ai5-label">Recipient</label>',
    '      <input class="tg-ai5-input" id="ew-recipient" type="text" placeholder="e.g. my manager, client name (optional)">',
    '    </div>',
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Tone</label>',
    makeToggles(tones, 'Formal', 'ew-tones'),
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Length</label>',
    makeToggles(lengths, 'Standard', 'ew-lengths'),
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Include</label>',
    makeMultiToggles(includeOpts, selectedIncludes, 'ew-includes'),
    '  </div>',
    '  <div><button class="tg-ai5-btn" id="ew-btn" disabled>Write Email</button></div>',
    '</div>',
    '<div class="tg-ai5-loading" id="ew-loading">',
    '  <span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span>',
    '  <span>Writing your email...</span>',
    '</div>',
    '<div id="ew-subject-box" style="display:none;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-top:16px">',
    '  <div style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Subject Line</div>',
    '  <div id="ew-subject-text" style="font-size:15px;font-weight:600;color:#1e40af"></div>',
    '</div>',
    '<div class="tg-ai5-result" id="ew-result"></div>',
    '<div class="tg-ai5-actions" id="ew-actions" style="display:none">',
    '  <button class="tg-ai5-action-btn" id="ew-copy-full">Copy Full Email</button>',
    '  <button class="tg-ai5-action-btn" id="ew-copy-subject">Copy Subject Only</button>',
    '  <button class="tg-ai5-action-btn" id="ew-download">Download .txt</button>',
    '  <button class="tg-ai5-action-btn" id="ew-again">Try Again</button>',
    '</div>',
    '<div class="tg-ai5-error" id="ew-error"></div>',
    '<div class="tg-ai5-meta" id="ew-meta"></div>'
  ].join('');

  /* toggle: single */
  function bindSingleToggle(groupId, setter) {
    box.querySelector('#' + groupId).addEventListener('click', function (e) {
      var btn = e.target.closest('.tg-ai5-toggle');
      if (!btn) return;
      box.querySelectorAll('#' + groupId + ' .tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      setter(btn.dataset.val);
    });
  }

  bindSingleToggle('ew-tones', function (v) { selectedTone = v; });
  bindSingleToggle('ew-lengths', function (v) { selectedLength = v; });

  /* Include toggles: multi with "All" special logic */
  box.querySelector('#ew-includes').addEventListener('click', function (e) {
    var btn = e.target.closest('.tg-ai5-toggle');
    if (!btn) return;
    var val = btn.dataset.val;
    if (val === 'All') {
      var allActive = !selectedIncludes['All'];
      includeOpts.forEach(function (o) { selectedIncludes[o] = allActive; });
    } else {
      selectedIncludes[val] = !selectedIncludes[val];
      selectedIncludes['All'] = includeOpts.filter(function (o) { return o !== 'All'; }).every(function (o) { return selectedIncludes[o]; });
    }
    box.querySelectorAll('#ew-includes .tg-ai5-toggle').forEach(function (b) {
      b.classList.toggle('active', !!selectedIncludes[b.dataset.val]);
    });
  });

  /* enable/disable button based on context */
  var contextTA = box.querySelector('#ew-context');
  var submitBtn = box.querySelector('#ew-btn');
  contextTA.addEventListener('input', function () {
    submitBtn.disabled = !contextTA.value.trim();
  });

  var loading = box.querySelector('#ew-loading');
  var resultEl = box.querySelector('#ew-result');
  var subjectBox = box.querySelector('#ew-subject-box');
  var subjectText = box.querySelector('#ew-subject-text');
  var actions = box.querySelector('#ew-actions');
  var errorEl = box.querySelector('#ew-error');
  var metaEl = box.querySelector('#ew-meta');
  var lastSubject = '';

  function showError(msg) { errorEl.textContent = msg; errorEl.classList.add('show'); }
  function hideError() { errorEl.classList.remove('show'); }

  function extractSubject(text) {
    var m = text.match(/^Subject:\s*(.+)/im);
    return m ? m[1].trim() : '';
  }

  submitBtn.addEventListener('click', function () {
    var context = contextTA.value.trim();
    if (!context) { showError('Please describe the email context.'); return; }
    hideError();
    resultEl.classList.remove('show');
    subjectBox.style.display = 'none';
    actions.style.display = 'none';
    metaEl.textContent = '';
    submitBtn.disabled = true;
    loading.classList.add('show');

    var activeIncludes = includeOpts.filter(function (o) { return selectedIncludes[o]; }).join(', ');

    callAI(HANDLER, {
      context: context,
      type: box.querySelector('#ew-type').value,
      sender: box.querySelector('#ew-sender').value.trim(),
      recipient: box.querySelector('#ew-recipient').value.trim(),
      tone: selectedTone,
      length: selectedLength,
      includes: activeIncludes
    }, function (result) {
      lastRawResult = result;
      loading.classList.remove('show');
      submitBtn.disabled = false;
      lastSubject = extractSubject(result);
      if (lastSubject) {
        subjectText.textContent = lastSubject;
        subjectBox.style.display = 'block';
      }
      resultEl.textContent = result;
      resultEl.classList.add('show');
      actions.style.display = 'flex';
      metaEl.innerHTML = 'Powered by AI ✨';
    }, function (err) {
      loading.classList.remove('show');
      submitBtn.disabled = false;
      showError(err);
    });
  });

  box.querySelector('#ew-copy-full').addEventListener('click', function () {
    navigator.clipboard && navigator.clipboard.writeText(lastRawResult);
    this.textContent = 'Copied!';
    var self = this;
    setTimeout(function () { self.textContent = 'Copy Full Email'; }, 1500);
  });

  box.querySelector('#ew-copy-subject').addEventListener('click', function () {
    navigator.clipboard && navigator.clipboard.writeText(lastSubject || '');
    this.textContent = 'Copied!';
    var self = this;
    setTimeout(function () { self.textContent = 'Copy Subject Only'; }, 1500);
  });

  box.querySelector('#ew-download').addEventListener('click', function () {
    var blob = new Blob([lastRawResult], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = HANDLER + '-output.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  box.querySelector('#ew-again').addEventListener('click', function () {
    resultEl.classList.remove('show');
    subjectBox.style.display = 'none';
    actions.style.display = 'none';
    metaEl.textContent = '';
    hideError();
  });

  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { handler: HANDLER, box: box };
})();

(function () {
  'use strict';

  var HANDLER = 'product-desc-writer';
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
      if (!data.success) { onError((data.data && data.data.message) || 'An error occurred. Please try again.'); return; }
      var _r = (data.data && data.data.result != null) ? data.data.result : '';
      if (!_r.trim()) { onError('AI returned an empty response. Please try again or rephrase your input.'); return; }
      onSuccess(_r);
    }).catch(function () { onError('Network error. Please try again.'); });
  }

  /* ── State ── */
  var tones = ['Professional','Exciting','Luxury','Friendly','Technical','Minimalist'];
  var lengths = [
    { label: 'Short (~50w)', value: '50' },
    { label: 'Standard (~100w)', value: '100' },
    { label: 'Long (~200w)', value: '200' },
    { label: 'Detailed (~300w)', value: '300' }
  ];
  var platforms = ['General','Amazon','Shopify','eBay','Instagram','Etsy'];
  var includeOpts = ['Bullet points','SEO keywords','Call to action','Emotional appeal'];

  var selectedTone = 'Professional';
  var selectedLength = '100';
  var selectedPlatform = 'General';
  var selectedIncludes = { 'Bullet points': true, 'SEO keywords': true, 'Call to action': true, 'Emotional appeal': true };
  var lastRawResult = '';

  function makeToggles(items, defaultVal, id, labelKey, valueKey) {
    return '<div class="tg-ai5-toggles" id="' + id + '">' +
      items.map(function (t) {
        var label = labelKey ? t[labelKey] : t;
        var value = valueKey ? t[valueKey] : t;
        return '<button class="tg-ai5-toggle' + (value === defaultVal ? ' active' : '') + '" data-val="' + value + '">' + label + '</button>';
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
    '  <div class="tg-ai5-row">',
    '    <div class="tg-ai5-col">',
    '      <label class="tg-ai5-label">Product Name <span style="color:#dc2626">*</span></label>',
    '      <input class="tg-ai5-input" id="pd-name" type="text" placeholder="e.g. Wireless Noise-Cancelling Headphones">',
    '    </div>',
    '    <div class="tg-ai5-col">',
    '      <label class="tg-ai5-label">Product Category</label>',
    '      <input class="tg-ai5-input" id="pd-category" type="text" placeholder="e.g. Electronics, Fashion, Home">',
    '    </div>',
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Key Features</label>',
    '    <textarea class="tg-ai5-textarea" id="pd-features" style="min-height:120px" placeholder="List main features, specs, benefits..."></textarea>',
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Target Customer</label>',
    '    <input class="tg-ai5-input" id="pd-customer" type="text" placeholder="e.g. working professionals aged 25-45">',
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Tone</label>',
    makeToggles(tones, 'Professional', 'pd-tones', null, null),
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Length</label>',
    makeToggles(lengths, '100', 'pd-lengths', 'label', 'value'),
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Platform</label>',
    makeToggles(platforms, 'General', 'pd-platforms', null, null),
    '  </div>',
    '  <div>',
    '    <label class="tg-ai5-label">Include</label>',
    makeMultiToggles(includeOpts, selectedIncludes, 'pd-includes'),
    '  </div>',
    '  <div><button class="tg-ai5-btn" id="pd-btn" disabled>Write Description</button></div>',
    '</div>',
    '<div class="tg-ai5-loading" id="pd-loading">',
    '  <span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span>',
    '  <span>Writing your product description...</span>',
    '</div>',
    '<div class="tg-ai5-result" id="pd-result"></div>',
    '<div class="tg-ai5-actions" id="pd-actions" style="display:none">',
    '  <button class="tg-ai5-action-btn" id="pd-copy">Copy Description</button>',
    '  <button class="tg-ai5-action-btn" id="pd-download">Download .txt</button>',
    '  <button class="tg-ai5-action-btn" id="pd-again">Try Again</button>',
    '</div>',
    '<div class="tg-ai5-error" id="pd-error"></div>',
    '<div class="tg-ai5-meta" id="pd-meta"></div>'
  ].join('');

  function bindSingleToggle(groupId, setter) {
    box.querySelector('#' + groupId).addEventListener('click', function (e) {
      var btn = e.target.closest('.tg-ai5-toggle');
      if (!btn) return;
      box.querySelectorAll('#' + groupId + ' .tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      setter(btn.dataset.val);
    });
  }

  bindSingleToggle('pd-tones', function (v) { selectedTone = v; });
  bindSingleToggle('pd-lengths', function (v) { selectedLength = v; });
  bindSingleToggle('pd-platforms', function (v) { selectedPlatform = v; });

  /* multi-select includes */
  box.querySelector('#pd-includes').addEventListener('click', function (e) {
    var btn = e.target.closest('.tg-ai5-toggle');
    if (!btn) return;
    var val = btn.dataset.val;
    selectedIncludes[val] = !selectedIncludes[val];
    btn.classList.toggle('active', selectedIncludes[val]);
  });

  var nameInput = box.querySelector('#pd-name');
  var submitBtn = box.querySelector('#pd-btn');
  nameInput.addEventListener('input', function () {
    submitBtn.disabled = !nameInput.value.trim();
  });

  var loading = box.querySelector('#pd-loading');
  var resultEl = box.querySelector('#pd-result');
  var actions = box.querySelector('#pd-actions');
  var errorEl = box.querySelector('#pd-error');
  var metaEl = box.querySelector('#pd-meta');

  function showError(msg) { errorEl.textContent = msg; errorEl.classList.add('show'); }
  function hideError() { errorEl.classList.remove('show'); }

  submitBtn.addEventListener('click', function () {
    var name = nameInput.value.trim();
    if (!name) { showError('Please enter the product name.'); return; }
    hideError();
    resultEl.classList.remove('show');
    actions.style.display = 'none';
    metaEl.textContent = '';
    submitBtn.disabled = true;
    loading.classList.add('show');

    var activeIncludes = includeOpts.filter(function (o) { return selectedIncludes[o]; }).join(', ');

    callAI(HANDLER, {
      name: name,
      category: box.querySelector('#pd-category').value.trim(),
      features: box.querySelector('#pd-features').value.trim(),
      customer: box.querySelector('#pd-customer').value.trim(),
      tone: selectedTone,
      length: selectedLength,
      platform: selectedPlatform,
      includes: activeIncludes
    }, function (result) {
      lastRawResult = result;
      loading.classList.remove('show');
      submitBtn.disabled = false;
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

  box.querySelector('#pd-copy').addEventListener('click', function () {
    navigator.clipboard && navigator.clipboard.writeText(lastRawResult);
    this.textContent = 'Copied!';
    var self = this;
    setTimeout(function () { self.textContent = 'Copy Description'; }, 1500);
  });

  box.querySelector('#pd-download').addEventListener('click', function () {
    var blob = new Blob([lastRawResult], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = HANDLER + '-output.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  box.querySelector('#pd-again').addEventListener('click', function () {
    resultEl.classList.remove('show');
    actions.style.display = 'none';
    metaEl.textContent = '';
    hideError();
  });

  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { handler: HANDLER, box: box };
})();

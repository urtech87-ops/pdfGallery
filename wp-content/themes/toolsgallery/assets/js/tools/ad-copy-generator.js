(function () {
  'use strict';

  var HANDLER = 'ad-copy-generator';
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

  /* ── Toggle helper ── */
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

  /* ── Build UI ── */
  box.innerHTML = '';

  var form = document.createElement('div');
  form.className = 'tg-ai5-form';

  /* Product name */
  var productLabel = document.createElement('label');
  productLabel.className = 'tg-ai5-label';
  productLabel.textContent = 'Product / Service Name *';
  var productInput = document.createElement('input');
  productInput.type = 'text';
  productInput.className = 'tg-ai5-input';
  productInput.placeholder = 'e.g. Premium Coffee Subscription';
  productInput.required = true;

  var productGroup = document.createElement('div');
  productGroup.appendChild(productLabel);
  productGroup.appendChild(productInput);
  form.appendChild(productGroup);

  /* Ad platform */
  var platformLabel = document.createElement('label');
  platformLabel.className = 'tg-ai5-label';
  platformLabel.textContent = 'Ad Platform';
  var platformToggles = document.createElement('div');
  platformToggles.className = 'tg-ai5-toggles';
  makeToggles(platformToggles, ['Google Ads', 'Facebook/Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 'YouTube', 'General'], 'Google Ads', false);

  var platformGroup = document.createElement('div');
  platformGroup.appendChild(platformLabel);
  platformGroup.appendChild(platformToggles);
  form.appendChild(platformGroup);

  /* Ad goal */
  var goalLabel = document.createElement('label');
  goalLabel.className = 'tg-ai5-label';
  goalLabel.textContent = 'Ad Goal';
  var goalSelect = document.createElement('select');
  goalSelect.className = 'tg-ai5-select';
  ['Brand Awareness', 'Lead Generation', 'Sales', 'App Downloads', 'Website Traffic', 'Event Promotion'].forEach(function (g) {
    var opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    goalSelect.appendChild(opt);
  });

  var goalGroup = document.createElement('div');
  goalGroup.appendChild(goalLabel);
  goalGroup.appendChild(goalSelect);
  form.appendChild(goalGroup);

  /* Audience + USP row */
  var row1 = document.createElement('div');
  row1.className = 'tg-ai5-row';

  var audienceCol = document.createElement('div');
  audienceCol.className = 'tg-ai5-col';
  var audienceLabel = document.createElement('label');
  audienceLabel.className = 'tg-ai5-label';
  audienceLabel.textContent = 'Target Audience';
  var audienceInput = document.createElement('input');
  audienceInput.type = 'text';
  audienceInput.className = 'tg-ai5-input';
  audienceInput.placeholder = 'e.g. coffee lovers aged 25-45';
  audienceCol.appendChild(audienceLabel);
  audienceCol.appendChild(audienceInput);

  var uspCol = document.createElement('div');
  uspCol.className = 'tg-ai5-col';
  var uspLabel = document.createElement('label');
  uspLabel.className = 'tg-ai5-label';
  uspLabel.textContent = 'Key Benefit / USP';
  var uspInput = document.createElement('input');
  uspInput.type = 'text';
  uspInput.className = 'tg-ai5-input';
  uspInput.placeholder = 'e.g. 50% off first month, premium quality';
  uspCol.appendChild(uspLabel);
  uspCol.appendChild(uspInput);

  row1.appendChild(audienceCol);
  row1.appendChild(uspCol);
  form.appendChild(row1);

  /* Tone */
  var toneLabel = document.createElement('label');
  toneLabel.className = 'tg-ai5-label';
  toneLabel.textContent = 'Tone';
  var toneToggles = document.createElement('div');
  toneToggles.className = 'tg-ai5-toggles';
  makeToggles(toneToggles, ['Urgent', 'Inspiring', 'Professional', 'Humorous', 'Emotional', 'Bold'], 'Inspiring', false);

  var toneGroup = document.createElement('div');
  toneGroup.appendChild(toneLabel);
  toneGroup.appendChild(toneToggles);
  form.appendChild(toneGroup);

  /* Generate sections */
  var genLabel = document.createElement('label');
  genLabel.className = 'tg-ai5-label';
  genLabel.textContent = 'Generate (select all that apply)';
  var genToggles = document.createElement('div');
  genToggles.className = 'tg-ai5-toggles';
  makeToggles(genToggles, ['Headlines', 'Body copy', 'Call to action', 'Display URL'], null, true);
  genToggles.querySelectorAll('.tg-ai5-toggle').forEach(function (b) { b.classList.add('active'); });

  var genGroup = document.createElement('div');
  genGroup.appendChild(genLabel);
  genGroup.appendChild(genToggles);
  form.appendChild(genGroup);

  /* Submit button */
  var submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'tg-ai5-btn';
  submitBtn.textContent = 'Generate Ad Copy';
  submitBtn.disabled = true;
  form.appendChild(submitBtn);

  /* Loading */
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Crafting your ad copy…</span>';
  form.appendChild(loading);

  /* Error */
  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  /* Result area */
  var resultWrap = document.createElement('div');
  resultWrap.id = 'tg-adcopy-results';

  box.appendChild(form);
  box.appendChild(resultWrap);

  /* Enable/disable button */
  productInput.addEventListener('input', function () {
    submitBtn.disabled = productInput.value.trim() === '';
  });

  /* ── Section parser ── */
  function parseSections(text) {
    var sections = { HEADLINES: '', 'BODY COPY': '', 'CALL TO ACTION': '', 'DISPLAY URL': '' };
    var current = null;
    text.split('\n').forEach(function (line) {
      var upper = line.trim().toUpperCase();
      if (upper.indexOf('HEADLINE') !== -1) { current = 'HEADLINES'; return; }
      if (upper.indexOf('BODY COPY') !== -1 || upper.indexOf('BODY:') !== -1) { current = 'BODY COPY'; return; }
      if (upper.indexOf('CALL TO ACTION') !== -1 || upper.indexOf('CTA') !== -1) { current = 'CALL TO ACTION'; return; }
      if (upper.indexOf('DISPLAY URL') !== -1) { current = 'DISPLAY URL'; return; }
      if (current) { sections[current] += line + '\n'; }
    });
    return sections;
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text.trim()).then(function () {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    });
  }

  function renderResults(result) {
    resultWrap.innerHTML = '';
    var sections = parseSections(result);
    var hasSection = Object.values(sections).some(function (v) { return v.trim(); });

    if (hasSection) {
      Object.keys(sections).forEach(function (key) {
        if (!sections[key].trim()) return;
        var card = document.createElement('div');
        card.style.cssText = 'background:#fff;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:16px;margin-bottom:12px';

        var heading = document.createElement('div');
        heading.style.cssText = 'font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-primary,#6366f1);margin-bottom:8px';
        heading.textContent = key;

        var content = document.createElement('div');
        content.style.cssText = 'font-size:14px;line-height:1.7;white-space:pre-wrap;color:var(--color-gray-700,#374151)';
        content.textContent = sections[key].trim();

        var copyBtn = document.createElement('button');
        copyBtn.className = 'tg-ai5-action-btn';
        copyBtn.textContent = 'Copy ' + key;
        copyBtn.style.marginTop = '10px';
        copyBtn.addEventListener('click', function () { copyText(sections[key], copyBtn); });

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

    /* Action row */
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
    var product = productInput.value.trim();
    if (!product) return;

    loading.classList.add('show');
    submitBtn.disabled = true;
    errorDiv.classList.remove('show');
    resultWrap.innerHTML = '';

    var payload = {
      product: product,
      platform: getActiveToggle(platformToggles),
      goal: goalSelect.value,
      audience: audienceInput.value.trim(),
      usp: uspInput.value.trim(),
      tone: getActiveToggle(toneToggles),
      generate: getActiveToggles(genToggles).join(', ')
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

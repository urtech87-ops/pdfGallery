(function () {
  'use strict';

  var HANDLER = 'slogan-generator';
  window.TGTools = window.TGTools || {};

  var box = document.querySelector('.tg-tool-box[data-handler="' + HANDLER + '"]');
  if (!box) return;

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
      '.tg-sl-card{background:#fff;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:20px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.tg-sl-text{font-size:18px;font-weight:600;color:var(--color-gray-900,#111827);flex:1}',
      '.tg-sl-meta{display:flex;align-items:center;gap:8px;flex-shrink:0}',
      '.tg-sl-chars{font-size:11px;color:var(--color-gray-500,#6b7280)}'
    ].join('');
    document.head.appendChild(style);
  }

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

  function makeToggleGroup(options, defaultValue) {
    var wrap = document.createElement('div');
    wrap.className = 'tg-ai5-toggles';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tg-ai5-toggle' + (opt.value === defaultValue ? ' active' : '');
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;
      btn.addEventListener('click', function () {
        wrap.querySelectorAll('.tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
      wrap.appendChild(btn);
    });
    wrap.getValue = function () {
      var active = wrap.querySelector('.tg-ai5-toggle.active');
      return active ? active.dataset.value : defaultValue;
    };
    return wrap;
  }

  var form = document.createElement('div');
  form.className = 'tg-ai5-form';

  // Brand
  var brandLabel = document.createElement('label');
  brandLabel.className = 'tg-ai5-label';
  brandLabel.textContent = 'Brand / company name *';
  var brandInput = document.createElement('input');
  brandInput.type = 'text';
  brandInput.className = 'tg-ai5-input';
  brandInput.placeholder = 'e.g. Nike, Apple, Your Brand';
  var brandWrap = document.createElement('div');
  brandWrap.appendChild(brandLabel);
  brandWrap.appendChild(brandInput);
  form.appendChild(brandWrap);

  // Product/service
  var productLabel = document.createElement('label');
  productLabel.className = 'tg-ai5-label';
  productLabel.textContent = 'Product / service *';
  var productInput = document.createElement('input');
  productInput.type = 'text';
  productInput.className = 'tg-ai5-input';
  productInput.placeholder = 'e.g. running shoes, smartphones, consulting';
  var productWrap = document.createElement('div');
  productWrap.appendChild(productLabel);
  productWrap.appendChild(productInput);
  form.appendChild(productWrap);

  // Key value
  var valueLabel = document.createElement('label');
  valueLabel.className = 'tg-ai5-label';
  valueLabel.textContent = 'Key brand value / benefit';
  var valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'tg-ai5-input';
  valueInput.placeholder = 'e.g. speed, quality, innovation, simplicity';
  var valueWrap = document.createElement('div');
  valueWrap.appendChild(valueLabel);
  valueWrap.appendChild(valueInput);
  form.appendChild(valueWrap);

  // Tone
  var toneLabel = document.createElement('label');
  toneLabel.className = 'tg-ai5-label';
  toneLabel.textContent = 'Tone';
  var toneToggle = makeToggleGroup([
    { label: 'Inspiring', value: 'Inspiring' },
    { label: 'Witty', value: 'Witty' },
    { label: 'Bold', value: 'Bold' },
    { label: 'Professional', value: 'Professional' },
    { label: 'Friendly', value: 'Friendly' },
    { label: 'Luxury', value: 'Luxury' },
    { label: 'Minimal', value: 'Minimal' },
    { label: 'Action-oriented', value: 'Action-oriented' }
  ], 'Inspiring');
  var toneWrap = document.createElement('div');
  toneWrap.appendChild(toneLabel);
  toneWrap.appendChild(toneToggle);
  form.appendChild(toneWrap);

  // Slogan length
  var lenLabel = document.createElement('label');
  lenLabel.className = 'tg-ai5-label';
  lenLabel.textContent = 'Slogan length';
  var lenToggle = makeToggleGroup([
    { label: 'Very short (2-4 words)', value: '2-4' },
    { label: 'Short (5-7 words)', value: '5-7' },
    { label: 'Medium (8-12 words)', value: '8-12' }
  ], '5-7');
  var lenWrap = document.createElement('div');
  lenWrap.appendChild(lenLabel);
  lenWrap.appendChild(lenToggle);
  form.appendChild(lenWrap);

  // Count
  var countLabel = document.createElement('label');
  countLabel.className = 'tg-ai5-label';
  countLabel.textContent = 'Number of slogans';
  var countToggle = makeToggleGroup([
    { label: '5', value: '5' },
    { label: '10', value: '10' },
    { label: '15', value: '15' }
  ], '10');
  var countWrap = document.createElement('div');
  countWrap.appendChild(countLabel);
  countWrap.appendChild(countToggle);
  form.appendChild(countWrap);

  // Button
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tg-ai5-btn';
  btn.textContent = 'Generate Slogans';
  btn.disabled = true;
  form.appendChild(btn);

  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Crafting your slogans...</span>';
  form.appendChild(loading);

  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  var resultsContainer = document.createElement('div');
  resultsContainer.style.display = 'none';
  form.appendChild(resultsContainer);

  var metaDiv = document.createElement('div');
  metaDiv.className = 'tg-ai5-meta';
  metaDiv.style.display = 'none';
  metaDiv.textContent = 'Powered by AI ✨';
  form.appendChild(metaDiv);

  box.appendChild(form);

  function updateBtn() {
    btn.disabled = brandInput.value.trim() === '';
  }
  brandInput.addEventListener('input', updateBtn);

  function parseSlogans(raw) {
    var slogans = [];
    var lines = raw.split('\n');
    lines.forEach(function (line) {
      // Match numbered list: 1. / 1) patterns, strip leading number
      var m = line.match(/^\d+[\.\)]\s*(.+)/);
      if (m) {
        slogans.push(m[1].trim().replace(/^["']|["']$/g, ''));
      }
    });
    if (slogans.length === 0) {
      // Fallback: non-empty lines
      lines.forEach(function (line) {
        var t = line.trim();
        if (t) slogans.push(t);
      });
    }
    return slogans;
  }

  function renderSlogans(raw) {
    var slogans = parseSlogans(raw);
    resultsContainer.innerHTML = '';

    if (slogans.length === 0) {
      var pre = document.createElement('div');
      pre.className = 'tg-ai5-result show';
      pre.textContent = raw;
      resultsContainer.appendChild(pre);
      resultsContainer.style.display = 'block';
      return;
    }

    var topBar = document.createElement('div');
    topBar.className = 'tg-ai5-actions';
    topBar.style.marginBottom = '8px';

    var copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'tg-ai5-action-btn';
    copyAllBtn.textContent = 'Copy All';
    copyAllBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(slogans.join('\n')).then(function () {
        copyAllBtn.textContent = 'Copied!';
        setTimeout(function () { copyAllBtn.textContent = 'Copy All'; }, 2000);
      });
    });
    topBar.appendChild(copyAllBtn);
    resultsContainer.appendChild(topBar);

    slogans.forEach(function (slogan) {
      var card = document.createElement('div');
      card.className = 'tg-sl-card';

      var textEl = document.createElement('div');
      textEl.className = 'tg-sl-text';
      textEl.textContent = slogan;

      var metaEl = document.createElement('div');
      metaEl.className = 'tg-sl-meta';

      var charsEl = document.createElement('span');
      charsEl.className = 'tg-sl-chars';
      charsEl.textContent = slogan.length + ' chars';

      var copyBtn = document.createElement('button');
      copyBtn.className = 'tg-ai5-action-btn';
      copyBtn.style.padding = '6px 12px';
      copyBtn.style.fontSize = '12px';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(slogan).then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
        });
      });

      metaEl.appendChild(charsEl);
      metaEl.appendChild(copyBtn);
      card.appendChild(textEl);
      card.appendChild(metaEl);
      resultsContainer.appendChild(card);
    });

    resultsContainer.style.display = 'block';
  }

  btn.addEventListener('click', function () {
    var brand = brandInput.value.trim();
    if (!brand) return;

    btn.disabled = true;
    loading.classList.add('show');
    errorDiv.classList.remove('show');
    resultsContainer.style.display = 'none';
    metaDiv.style.display = 'none';

    callAI(HANDLER, {
      brand: brand,
      product: productInput.value.trim(),
      value: valueInput.value.trim(),
      tone: toneToggle.getValue(),
      length: lenToggle.getValue(),
      count: countToggle.getValue()
    }, function (result) {
      loading.classList.remove('show');
      btn.disabled = false;
      renderSlogans(result);
      metaDiv.style.display = 'block';
    }, function (err) {
      loading.classList.remove('show');
      btn.disabled = false;
      errorDiv.textContent = err;
      errorDiv.classList.add('show');
    });
  });

  window.TGTools[HANDLER] = { box: box };
})();

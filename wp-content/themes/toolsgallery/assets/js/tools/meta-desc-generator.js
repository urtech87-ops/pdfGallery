(function () {
  'use strict';

  var HANDLER = 'meta-desc-generator';
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
      /* Meta desc specific */
      '.tg-meta-card{border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:16px;margin-bottom:12px;background:#fff}',
      '.tg-meta-text{font-size:14px;line-height:1.6;margin-bottom:10px}',
      '.tg-meta-count{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;margin-bottom:10px}',
      '.tg-meta-count-ok{background:#f0fdf4;color:#16a34a}',
      '.tg-meta-count-low{background:#fefce8;color:#ca8a04}',
      '.tg-meta-count-high{background:#fef2f2;color:#dc2626}',
      '.tg-serp-preview{background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-top:8px;font-family:arial,sans-serif}',
      '.tg-serp-title{color:#1a0dab;font-size:18px;text-decoration:none;display:block;margin-bottom:2px}',
      '.tg-serp-url{color:#188038;font-size:13px;margin-bottom:4px}',
      '.tg-serp-desc{color:#4d5156;font-size:13px;line-height:1.5}'
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

  /* Page title */
  var pageTitleLabel = document.createElement('label');
  pageTitleLabel.className = 'tg-ai5-label';
  pageTitleLabel.textContent = 'Page Title *';
  var pageTitleInput = document.createElement('input');
  pageTitleInput.type = 'text';
  pageTitleInput.className = 'tg-ai5-input';
  pageTitleInput.placeholder = 'e.g. Best Coffee Shops in New York';
  var pageTitleGroup = document.createElement('div');
  pageTitleGroup.appendChild(pageTitleLabel);
  pageTitleGroup.appendChild(pageTitleInput);
  form.appendChild(pageTitleGroup);

  /* Summary textarea */
  var summaryLabel = document.createElement('label');
  summaryLabel.className = 'tg-ai5-label';
  summaryLabel.textContent = 'Page Content Summary';
  var summaryTextarea = document.createElement('textarea');
  summaryTextarea.className = 'tg-ai5-textarea';
  summaryTextarea.placeholder = 'Brief description of page content…';
  summaryTextarea.style.minHeight = '100px';
  var summaryGroup = document.createElement('div');
  summaryGroup.appendChild(summaryLabel);
  summaryGroup.appendChild(summaryTextarea);
  form.appendChild(summaryGroup);

  /* Keyword row */
  var row1 = document.createElement('div');
  row1.className = 'tg-ai5-row';

  var kwCol = document.createElement('div');
  kwCol.className = 'tg-ai5-col';
  var kwLabel = document.createElement('label');
  kwLabel.className = 'tg-ai5-label';
  kwLabel.textContent = 'Target Keyword *';
  var kwInput = document.createElement('input');
  kwInput.type = 'text';
  kwInput.className = 'tg-ai5-input';
  kwInput.placeholder = 'e.g. coffee shops NYC';
  kwCol.appendChild(kwLabel);
  kwCol.appendChild(kwInput);

  var secKwCol = document.createElement('div');
  secKwCol.className = 'tg-ai5-col';
  var secKwLabel = document.createElement('label');
  secKwLabel.className = 'tg-ai5-label';
  secKwLabel.textContent = 'Secondary Keywords (optional)';
  var secKwInput = document.createElement('input');
  secKwInput.type = 'text';
  secKwInput.className = 'tg-ai5-input';
  secKwInput.placeholder = 'comma-separated';
  secKwCol.appendChild(secKwLabel);
  secKwCol.appendChild(secKwInput);

  row1.appendChild(kwCol);
  row1.appendChild(secKwCol);
  form.appendChild(row1);

  /* CTA toggles */
  var ctaLabel = document.createElement('label');
  ctaLabel.className = 'tg-ai5-label';
  ctaLabel.textContent = 'Call to Action';
  var ctaToggles = document.createElement('div');
  ctaToggles.className = 'tg-ai5-toggles';
  makeToggles(ctaToggles, ['Learn More', 'Buy Now', 'Sign Up', 'Get Started', 'Discover', 'Custom'], 'Learn More', false);

  var customCtaWrap = document.createElement('div');
  customCtaWrap.style.marginTop = '8px';
  customCtaWrap.style.display = 'none';
  var customCtaInput = document.createElement('input');
  customCtaInput.type = 'text';
  customCtaInput.className = 'tg-ai5-input';
  customCtaInput.placeholder = 'Enter custom CTA text';
  customCtaWrap.appendChild(customCtaInput);

  ctaToggles.addEventListener('click', function (e) {
    if (e.target && e.target.dataset.value === 'Custom') {
      customCtaWrap.style.display = 'block';
    } else if (e.target && e.target.classList.contains('tg-ai5-toggle')) {
      customCtaWrap.style.display = 'none';
    }
  });

  var ctaGroup = document.createElement('div');
  ctaGroup.appendChild(ctaLabel);
  ctaGroup.appendChild(ctaToggles);
  ctaGroup.appendChild(customCtaWrap);
  form.appendChild(ctaGroup);

  /* Count */
  var countLabel = document.createElement('label');
  countLabel.className = 'tg-ai5-label';
  countLabel.textContent = 'Number of Options';
  var countToggles = document.createElement('div');
  countToggles.className = 'tg-ai5-toggles';
  makeToggles(countToggles, ['3', '5'], '3', false);
  var countGroup = document.createElement('div');
  countGroup.appendChild(countLabel);
  countGroup.appendChild(countToggles);
  form.appendChild(countGroup);

  /* Submit */
  var submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'tg-ai5-btn';
  submitBtn.textContent = 'Generate Meta Descriptions';
  submitBtn.disabled = true;
  form.appendChild(submitBtn);

  /* Loading */
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Crafting meta descriptions…</span>';
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
    submitBtn.disabled = pageTitleInput.value.trim() === '' || kwInput.value.trim() === '';
  }
  pageTitleInput.addEventListener('input', checkValid);
  kwInput.addEventListener('input', checkValid);

  /* ── Parser ── */
  function parseDescriptions(text) {
    var descs = [];
    /* Try numbered patterns */
    var parts = text.split(/\n(?=\d+[\.\):])/);
    if (parts.length > 1) {
      parts.forEach(function (p) {
        var clean = p.replace(/^\d+[\.\):]\s*/, '').trim();
        /* Extract char count in brackets if present */
        var charMatch = clean.match(/\[(\d+)\s*(?:chars?)?\]\s*$/i);
        var charCount = charMatch ? parseInt(charMatch[1], 10) : null;
        var descText = charMatch ? clean.slice(0, clean.lastIndexOf(charMatch[0])).trim() : clean;
        if (descText) descs.push({ text: descText, count: charCount !== null ? charCount : descText.length });
      });
    }
    if (descs.length === 0) {
      text.split(/\n\n+/).forEach(function (p) {
        var clean = p.trim();
        if (clean.length > 20) descs.push({ text: clean, count: clean.length });
      });
    }
    if (descs.length === 0) {
      descs.push({ text: text.trim(), count: text.trim().length });
    }
    return descs;
  }

  function countClass(count) {
    if (count >= 120 && count <= 158) return 'tg-meta-count-ok';
    if (count < 120) return 'tg-meta-count-low';
    return 'tg-meta-count-high';
  }

  function countLabel2(count) {
    if (count >= 120 && count <= 158) return count + ' chars ✓ Optimal';
    if (count < 120) return count + ' chars — Too short';
    return count + ' chars — Too long';
  }

  function renderResults(result, pageTitle) {
    resultWrap.innerHTML = '';
    var descs = parseDescriptions(result);

    var wrap = document.createElement('div');
    wrap.style.marginTop = '16px';

    descs.forEach(function (desc, i) {
      var card = document.createElement('div');
      card.className = 'tg-meta-card';

      /* Option heading */
      var heading = document.createElement('div');
      heading.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-primary,#6366f1);margin-bottom:8px';
      heading.textContent = 'Option ' + (i + 1);

      /* Description text */
      var textEl = document.createElement('div');
      textEl.className = 'tg-meta-text';
      textEl.textContent = desc.text;

      /* Char count badge */
      var countBadge = document.createElement('span');
      countBadge.className = 'tg-meta-count ' + countClass(desc.count);
      countBadge.textContent = countLabel2(desc.count);

      /* SERP preview */
      var serp = document.createElement('div');
      serp.className = 'tg-serp-preview';

      var serpTitle = document.createElement('span');
      serpTitle.className = 'tg-serp-title';
      serpTitle.textContent = pageTitle || 'Page Title';

      var serpUrl = document.createElement('div');
      serpUrl.className = 'tg-serp-url';
      serpUrl.textContent = (window.location.hostname || 'yourwebsite.com') + ' › page';

      var serpDesc = document.createElement('div');
      serpDesc.className = 'tg-serp-desc';
      /* Truncate to 158 chars for SERP simulation */
      serpDesc.textContent = desc.text.length > 158 ? desc.text.slice(0, 158) + '…' : desc.text;

      serp.appendChild(serpTitle);
      serp.appendChild(serpUrl);
      serp.appendChild(serpDesc);

      /* Copy button */
      var copyBtn = document.createElement('button');
      copyBtn.className = 'tg-ai5-action-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.style.marginTop = '10px';
      (function (t, b) {
        b.addEventListener('click', function () { copyText(t, b); });
      }(desc.text, copyBtn));

      card.appendChild(heading);
      card.appendChild(textEl);
      card.appendChild(countBadge);
      card.appendChild(serp);
      card.appendChild(copyBtn);
      wrap.appendChild(card);
    });

    resultWrap.appendChild(wrap);

    var actions = document.createElement('div');
    actions.className = 'tg-ai5-actions';

    var copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'tg-ai5-action-btn';
    copyAllBtn.textContent = 'Copy All';
    copyAllBtn.addEventListener('click', function () {
      var all = descs.map(function (d, i) { return 'Option ' + (i + 1) + ':\n' + d.text; }).join('\n\n');
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
    meta.textContent = 'Powered by AI ✨  |  Optimal length: 120–158 characters';
    resultWrap.appendChild(meta);
  }

  /* ── Submit ── */
  submitBtn.addEventListener('click', function () {
    var pageTitle = pageTitleInput.value.trim();
    var keyword = kwInput.value.trim();
    if (!pageTitle || !keyword) return;

    loading.classList.add('show');
    submitBtn.disabled = true;
    errorDiv.classList.remove('show');
    resultWrap.innerHTML = '';

    var ctaVal = getActiveToggle(ctaToggles);
    if (ctaVal === 'Custom') ctaVal = customCtaInput.value.trim() || 'Learn More';

    var payload = {
      title: pageTitle,
      summary: summaryTextarea.value.trim(),
      keyword: keyword,
      secondary: secKwInput.value.trim(),
      cta: ctaVal,
      count: getActiveToggle(countToggles)
    };

    callAI(HANDLER, payload, function (result) {
      loading.classList.remove('show');
      submitBtn.disabled = false;
      renderResults(result, pageTitle);
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

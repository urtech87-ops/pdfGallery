(function () {
  'use strict';

  var HANDLER = 'blog-post-generator';
  var box = document.querySelector('.tg-tool-box[data-handler="' + HANDLER + '"]');
  if (!box) return;

  if (!document.getElementById('tg-ai5-css')) {
    var style = document.createElement('style');
    style.id = 'tg-ai5-css';
    style.textContent = '.tg-ai5-form{display:flex;flex-direction:column;gap:16px}.tg-ai5-label{display:block;font-size:13px;font-weight:600;color:var(--color-gray-700,#374151);margin-bottom:6px}.tg-ai5-textarea{width:100%;min-height:180px;padding:12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:15px;font-family:inherit;resize:vertical;box-sizing:border-box}.tg-ai5-textarea:focus{outline:none;border-color:var(--color-primary,#6366f1);box-shadow:0 0 0 3px rgba(99,102,241,.1)}.tg-ai5-input{width:100%;padding:10px 12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:14px;font-family:inherit;box-sizing:border-box}.tg-ai5-select{width:100%;padding:10px 12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:14px;font-family:inherit;background:#fff;box-sizing:border-box}.tg-ai5-row{display:flex;gap:12px;flex-wrap:wrap}.tg-ai5-col{flex:1;min-width:140px}.tg-ai5-toggles{display:flex;gap:8px;flex-wrap:wrap}.tg-ai5-toggle{padding:6px 14px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:20px;font-size:13px;cursor:pointer;background:#fff;transition:all .2s}.tg-ai5-toggle.active{background:var(--color-primary,#6366f1);color:#fff;border-color:var(--color-primary,#6366f1)}.tg-ai5-btn{padding:12px 28px;background:var(--color-primary,#6366f1);color:#fff;border:none;border-radius:var(--radius-md,8px);font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s}.tg-ai5-btn:hover{opacity:.9}.tg-ai5-btn:disabled{opacity:.5;cursor:not-allowed}.tg-ai5-loading{display:none;align-items:center;gap:10px;padding:16px 0;color:var(--color-gray-500,#6b7280)}.tg-ai5-loading.show{display:flex}.tg-ai5-dot{width:8px;height:8px;background:var(--color-primary,#6366f1);border-radius:50%;display:inline-block;animation:tg5bounce 1.2s infinite}.tg-ai5-dot:nth-child(2){animation-delay:.2s}.tg-ai5-dot:nth-child(3){animation-delay:.4s}@keyframes tg5bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}.tg-ai5-result{background:var(--color-gray-50,#f9fafb);border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:20px;font-size:15px;line-height:1.7;white-space:pre-wrap;max-height:500px;overflow-y:auto;margin-top:16px;display:none}.tg-ai5-result.show{display:block}.tg-ai5-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.tg-ai5-action-btn{padding:8px 16px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:13px;cursor:pointer;background:#fff;transition:all .2s}.tg-ai5-action-btn:hover{border-color:var(--color-primary,#6366f1);color:var(--color-primary,#6366f1)}.tg-ai5-meta{font-size:12px;color:var(--color-gray-500,#6b7280);margin-top:8px}.tg-ai5-error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:var(--radius-md,8px);padding:12px;margin-top:12px;display:none}.tg-ai5-error.show{display:block}';
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
      if (!data.success) { onError((data.data && data.data.message) || 'An error occurred. Please try again.'); return; }
      var _r = (data.data && data.data.result != null) ? data.data.result : '';
      if (!_r.trim()) { onError('AI returned an empty response. Please try again or rephrase your input.'); return; }
      onSuccess(_r);
    }).catch(function () { onError('Network error. Please try again.'); });
  }

  function makeSingleToggleGroup(options, defaultVal) {
    var wrap = document.createElement('div');
    wrap.className = 'tg-ai5-toggles';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tg-ai5-toggle' + (opt === defaultVal ? ' active' : '');
      btn.textContent = opt;
      btn.addEventListener('click', function () {
        wrap.querySelectorAll('.tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
      wrap.appendChild(btn);
    });
    wrap.getValue = function () {
      var a = wrap.querySelector('.tg-ai5-toggle.active');
      return a ? a.textContent : defaultVal;
    };
    return wrap;
  }

  /* ── Build UI ── */
  box.innerHTML = '';
  var form = document.createElement('div');
  form.className = 'tg-ai5-form';

  /* Topic */
  var lbl1 = document.createElement('label'); lbl1.className = 'tg-ai5-label'; lbl1.textContent = 'Blog Post Topic';
  var topicInput = document.createElement('input');
  topicInput.className = 'tg-ai5-input'; topicInput.type = 'text';
  topicInput.placeholder = 'Enter your blog post topic...'; topicInput.required = true;
  var w1 = document.createElement('div'); w1.appendChild(lbl1); w1.appendChild(topicInput);
  form.appendChild(w1);

  /* Niche */
  var lbl2 = document.createElement('label'); lbl2.className = 'tg-ai5-label'; lbl2.textContent = 'Blog Niche / Category';
  var nicheInput = document.createElement('input');
  nicheInput.className = 'tg-ai5-input'; nicheInput.type = 'text';
  nicheInput.placeholder = 'e.g. tech, food, travel';
  var w2 = document.createElement('div'); w2.appendChild(lbl2); w2.appendChild(nicheInput);
  form.appendChild(w2);

  /* Writing style */
  var lbl3 = document.createElement('label'); lbl3.className = 'tg-ai5-label'; lbl3.textContent = 'Writing Style';
  var styleGroup = makeSingleToggleGroup(['Storytelling', 'Educational', 'Listicle', 'How-To', 'Opinion', 'Review'], 'Educational');
  var w3 = document.createElement('div'); w3.appendChild(lbl3); w3.appendChild(styleGroup);
  form.appendChild(w3);

  /* Word count */
  var lbl4 = document.createElement('label'); lbl4.className = 'tg-ai5-label'; lbl4.textContent = 'Word Count';
  var wordGroup = makeSingleToggleGroup(['500', '800', '1000', '1500'], '800');
  var w4 = document.createElement('div'); w4.appendChild(lbl4); w4.appendChild(wordGroup);
  form.appendChild(w4);

  /* SEO keywords */
  var lbl5 = document.createElement('label'); lbl5.className = 'tg-ai5-label'; lbl5.textContent = 'SEO Keywords (optional)';
  var kwInput = document.createElement('input');
  kwInput.className = 'tg-ai5-input'; kwInput.type = 'text';
  kwInput.placeholder = 'comma-separated, optional';
  var w5 = document.createElement('div'); w5.appendChild(lbl5); w5.appendChild(kwInput);
  form.appendChild(w5);

  /* Call to action */
  var lbl6 = document.createElement('label'); lbl6.className = 'tg-ai5-label'; lbl6.textContent = 'Call to Action';
  var ctaGroup = makeSingleToggleGroup(['Yes', 'No'], 'No');
  var w6 = document.createElement('div'); w6.appendChild(lbl6); w6.appendChild(ctaGroup);
  form.appendChild(w6);

  /* CTA text (conditionally shown) */
  var ctaWrap = document.createElement('div');
  ctaWrap.style.display = 'none';
  var lblCta = document.createElement('label'); lblCta.className = 'tg-ai5-label'; lblCta.textContent = 'CTA Text';
  var ctaInput = document.createElement('input');
  ctaInput.className = 'tg-ai5-input'; ctaInput.type = 'text';
  ctaInput.placeholder = 'e.g. Sign up for our newsletter';
  ctaWrap.appendChild(lblCta); ctaWrap.appendChild(ctaInput);
  form.appendChild(ctaWrap);

  /* Toggle CTA visibility */
  ctaGroup.querySelectorAll('.tg-ai5-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      ctaWrap.style.display = btn.textContent === 'Yes' ? '' : 'none';
    });
  });

  /* Generate meta description */
  var lbl7 = document.createElement('label'); lbl7.className = 'tg-ai5-label'; lbl7.textContent = 'Generate Meta Description';
  var metaGroup = makeSingleToggleGroup(['Yes', 'No'], 'No');
  var w7 = document.createElement('div'); w7.appendChild(lbl7); w7.appendChild(metaGroup);
  form.appendChild(w7);

  /* Submit */
  var submitBtn = document.createElement('button');
  submitBtn.type = 'button'; submitBtn.className = 'tg-ai5-btn';
  submitBtn.textContent = 'Generate Blog Post'; submitBtn.disabled = true;
  form.appendChild(submitBtn);
  box.appendChild(form);

  /* Loading */
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Generating blog post…</span>';
  box.appendChild(loading);

  var errorEl = document.createElement('div'); errorEl.className = 'tg-ai5-error'; box.appendChild(errorEl);
  var resultEl = document.createElement('div'); resultEl.className = 'tg-ai5-result'; box.appendChild(resultEl);

  var actionsEl = document.createElement('div');
  actionsEl.className = 'tg-ai5-actions'; actionsEl.style.display = 'none';
  var copyBtn = document.createElement('button'); copyBtn.className = 'tg-ai5-action-btn'; copyBtn.textContent = 'Copy';
  var dlBtn = document.createElement('button'); dlBtn.className = 'tg-ai5-action-btn'; dlBtn.textContent = 'Download';
  var tryBtn = document.createElement('button'); tryBtn.className = 'tg-ai5-action-btn'; tryBtn.textContent = 'Try Again';
  var wordCount = document.createElement('span'); wordCount.className = 'tg-ai5-meta';
  actionsEl.appendChild(copyBtn); actionsEl.appendChild(dlBtn); actionsEl.appendChild(tryBtn); actionsEl.appendChild(wordCount);
  box.appendChild(actionsEl);

  var poweredBy = document.createElement('div');
  poweredBy.className = 'tg-ai5-meta'; poweredBy.style.marginTop = '12px'; poweredBy.textContent = 'Powered by AI';
  box.appendChild(poweredBy);

  /* ── Logic ── */
  topicInput.addEventListener('input', function () { submitBtn.disabled = topicInput.value.trim() === ''; });

  copyBtn.addEventListener('click', function () {
    var t = resultEl.textContent; if (!t) return;
    navigator.clipboard.writeText(t).then(function () {
      var o = copyBtn.textContent; copyBtn.textContent = 'Copied!';
      setTimeout(function () { copyBtn.textContent = o; }, 2000);
    });
  });
  dlBtn.addEventListener('click', function () {
    var t = resultEl.textContent; if (!t) return;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' }));
    a.download = HANDLER + '-output.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });
  tryBtn.addEventListener('click', function () {
    resultEl.classList.remove('show'); actionsEl.style.display = 'none';
    errorEl.classList.remove('show'); form.style.display = '';
  });

  submitBtn.addEventListener('click', function () {
    var topic = topicInput.value.trim(); if (!topic) return;
    var ctaVal = ctaGroup.getValue();
    var ctaInstruction = ctaVal === 'Yes'
      ? 'End with a call to action: ' + (ctaInput.value.trim() || 'engage with our content')
      : '';
    var generateMeta = metaGroup.getValue() === 'Yes';
    var payload = {
      topic: topic,
      niche: nicheInput.value.trim(),
      style: styleGroup.getValue(),
      length: wordGroup.getValue(),
      keywords: kwInput.value.trim(),
      cta_instruction: ctaInstruction,
      meta_description: generateMeta ? 'Also generate a meta description for this blog post.' : ''
    };
    form.style.display = 'none';
    errorEl.classList.remove('show'); resultEl.classList.remove('show'); actionsEl.style.display = 'none';
    loading.classList.add('show');

    callAI(HANDLER, payload, function (result) {
      loading.classList.remove('show');
      resultEl.textContent = result; resultEl.classList.add('show');
      actionsEl.style.display = 'flex';
      wordCount.textContent = result.trim().split(/\s+/).filter(Boolean).length + ' words';
    }, function (msg) {
      loading.classList.remove('show'); form.style.display = '';
      errorEl.textContent = msg; errorEl.classList.add('show');
    });
  });

  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { box: box };
})();

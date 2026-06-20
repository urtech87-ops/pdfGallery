(function () {
  'use strict';

  var HANDLER = 'faq-generator';
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
      /* FAQ accordion specific */
      '.tg-faq-item{border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);margin-bottom:8px;overflow:hidden}',
      '.tg-faq-q{padding:14px 16px;font-weight:600;font-size:14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:#fff;transition:background .2s}',
      '.tg-faq-q:hover{background:var(--color-gray-50,#f9fafb)}',
      '.tg-faq-q.open{background:var(--color-primary-light,#eef2ff)}',
      '.tg-faq-arrow{transition:transform .2s;font-style:normal}',
      '.tg-faq-q.open .tg-faq-arrow{transform:rotate(180deg)}',
      '.tg-faq-a{padding:0 16px;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s;font-size:14px;line-height:1.7;color:var(--color-gray-700,#374151)}',
      '.tg-faq-a.open{max-height:500px;padding:14px 16px}'
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

  /* Topic */
  var topicLabel = document.createElement('label');
  topicLabel.className = 'tg-ai5-label';
  topicLabel.textContent = 'Topic / Product / Service *';
  var topicTextarea = document.createElement('textarea');
  topicTextarea.className = 'tg-ai5-textarea';
  topicTextarea.placeholder = 'Describe your topic, product or service…';
  topicTextarea.style.minHeight = '120px';
  var topicGroup = document.createElement('div');
  topicGroup.appendChild(topicLabel);
  topicGroup.appendChild(topicTextarea);
  form.appendChild(topicGroup);

  /* Count */
  var countLabel = document.createElement('label');
  countLabel.className = 'tg-ai5-label';
  countLabel.textContent = 'Number of FAQs';
  var countToggles = document.createElement('div');
  countToggles.className = 'tg-ai5-toggles';
  makeToggles(countToggles, ['5', '10', '15', '20'], '10', false);
  var countGroup = document.createElement('div');
  countGroup.appendChild(countLabel);
  countGroup.appendChild(countToggles);
  form.appendChild(countGroup);

  /* Type + Audience row */
  var row1 = document.createElement('div');
  row1.className = 'tg-ai5-row';

  var typeCol = document.createElement('div');
  typeCol.className = 'tg-ai5-col';
  var typeLabel = document.createElement('label');
  typeLabel.className = 'tg-ai5-label';
  typeLabel.textContent = 'FAQ Type';
  var typeToggles = document.createElement('div');
  typeToggles.className = 'tg-ai5-toggles';
  makeToggles(typeToggles, ['General', 'Technical', 'Sales/Pricing', 'Support/Troubleshooting', 'Mixed'], 'Mixed', false);
  typeCol.appendChild(typeLabel);
  typeCol.appendChild(typeToggles);

  row1.appendChild(typeCol);
  form.appendChild(row1);

  /* Audience */
  var audLabel = document.createElement('label');
  audLabel.className = 'tg-ai5-label';
  audLabel.textContent = 'Audience Level';
  var audToggles = document.createElement('div');
  audToggles.className = 'tg-ai5-toggles';
  makeToggles(audToggles, ['Beginner', 'Intermediate', 'Expert', 'Mixed'], 'Mixed', false);
  var audGroup = document.createElement('div');
  audGroup.appendChild(audLabel);
  audGroup.appendChild(audToggles);
  form.appendChild(audGroup);

  /* Answer length + Schema row */
  var row2 = document.createElement('div');
  row2.className = 'tg-ai5-row';

  var lengthCol = document.createElement('div');
  lengthCol.className = 'tg-ai5-col';
  var lengthLabel = document.createElement('label');
  lengthLabel.className = 'tg-ai5-label';
  lengthLabel.textContent = 'Answer Length';
  var lengthToggles = document.createElement('div');
  lengthToggles.className = 'tg-ai5-toggles';
  makeToggles(lengthToggles, ['Brief', 'Detailed'], 'Brief', false);
  lengthCol.appendChild(lengthLabel);
  lengthCol.appendChild(lengthToggles);

  var schemaCol = document.createElement('div');
  schemaCol.className = 'tg-ai5-col';
  var schemaLabel = document.createElement('label');
  schemaLabel.className = 'tg-ai5-label';
  schemaLabel.textContent = 'Include JSON-LD Schema Hint';
  var schemaToggles = document.createElement('div');
  schemaToggles.className = 'tg-ai5-toggles';
  makeToggles(schemaToggles, ['Yes', 'No'], 'No', false);
  schemaCol.appendChild(schemaLabel);
  schemaCol.appendChild(schemaToggles);

  row2.appendChild(lengthCol);
  row2.appendChild(schemaCol);
  form.appendChild(row2);

  /* Submit */
  var submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'tg-ai5-btn';
  submitBtn.textContent = 'Generate FAQs';
  submitBtn.disabled = true;
  form.appendChild(submitBtn);

  /* Loading */
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Generating FAQs…</span>';
  form.appendChild(loading);

  /* Error */
  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  /* Result */
  var resultWrap = document.createElement('div');

  box.appendChild(form);
  box.appendChild(resultWrap);

  topicTextarea.addEventListener('input', function () {
    submitBtn.disabled = topicTextarea.value.trim() === '';
  });

  /* ── FAQ parser ── */
  function parseFAQs(text) {
    var faqs = [];
    /* Split on Q: prefix */
    var parts = text.split(/\n(?=Q:|Question\s*\d*:)/i);
    parts.forEach(function (part) {
      var clean = part.trim();
      if (!clean) return;
      /* Remove leading Q: or Question N: */
      clean = clean.replace(/^Q:|^Question\s*\d*:\s*/i, '').trim();
      /* Split into question and answer on A: */
      var aIdx = clean.search(/\nA:|\nAnswer:/i);
      if (aIdx !== -1) {
        var q = clean.slice(0, aIdx).trim();
        var a = clean.slice(aIdx).replace(/^A:|^Answer:/i, '').trim();
        if (q && a) faqs.push({ q: q, a: a });
      } else if (clean.length > 10) {
        /* Try splitting on double newline */
        var lines = clean.split(/\n\n/);
        if (lines.length >= 2) {
          faqs.push({ q: lines[0].trim(), a: lines.slice(1).join('\n\n').trim() });
        }
      }
    });
    return faqs;
  }

  /* ── Schema generators ── */
  function buildJsonLd(faqs) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(function (f) {
        return {
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        };
      })
    }, null, 2);
  }

  function buildPlainText(faqs) {
    return faqs.map(function (f, i) {
      return 'Q' + (i + 1) + ': ' + f.q + '\nA: ' + f.a;
    }).join('\n\n');
  }

  function buildHtmlAccordion(faqs) {
    var items = faqs.map(function (f, i) {
      return [
        '<div class="faq-item">',
        '  <button class="faq-question" onclick="this.nextElementSibling.classList.toggle(\'open\')">',
        '    ' + f.q,
        '  </button>',
        '  <div class="faq-answer">',
        '    <p>' + f.a + '</p>',
        '  </div>',
        '</div>'
      ].join('\n');
    }).join('\n');
    return '<div class="faq-accordion">\n' + items + '\n</div>';
  }

  function renderResults(result) {
    resultWrap.innerHTML = '';
    var faqs = parseFAQs(result);

    var wrap = document.createElement('div');
    wrap.style.marginTop = '16px';

    if (faqs.length > 0) {
      faqs.forEach(function (faq) {
        var item = document.createElement('div');
        item.className = 'tg-faq-item';

        var qEl = document.createElement('div');
        qEl.className = 'tg-faq-q';
        qEl.innerHTML = '<span>' + faq.q + '</span><span class="tg-faq-arrow">▼</span>';

        var aEl = document.createElement('div');
        aEl.className = 'tg-faq-a';
        aEl.textContent = faq.a;

        qEl.addEventListener('click', function () {
          var isOpen = qEl.classList.contains('open');
          /* Close all others */
          wrap.querySelectorAll('.tg-faq-q.open').forEach(function (q) {
            q.classList.remove('open');
            q.nextElementSibling.classList.remove('open');
          });
          if (!isOpen) {
            qEl.classList.add('open');
            aEl.classList.add('open');
          }
        });

        item.appendChild(qEl);
        item.appendChild(aEl);
        wrap.appendChild(item);
      });
    } else {
      /* Fallback raw */
      var raw = document.createElement('div');
      raw.className = 'tg-ai5-result show';
      raw.textContent = result;
      wrap.appendChild(raw);
    }

    resultWrap.appendChild(wrap);

    /* Action buttons */
    var actions = document.createElement('div');
    actions.className = 'tg-ai5-actions';

    var copyPlainBtn = document.createElement('button');
    copyPlainBtn.className = 'tg-ai5-action-btn';
    copyPlainBtn.textContent = 'Copy as Plain Text';
    copyPlainBtn.addEventListener('click', function () {
      var text = faqs.length > 0 ? buildPlainText(faqs) : result;
      copyText(text, copyPlainBtn);
    });

    var copySchemaBtn = document.createElement('button');
    copySchemaBtn.className = 'tg-ai5-action-btn';
    copySchemaBtn.textContent = 'Copy as JSON-LD Schema';
    copySchemaBtn.addEventListener('click', function () {
      if (faqs.length === 0) { copyText(result, copySchemaBtn); return; }
      var schema = '<script type="application/ld+json">\n' + buildJsonLd(faqs) + '\n<\/script>';
      copyText(schema, copySchemaBtn);
    });

    var copyHtmlBtn = document.createElement('button');
    copyHtmlBtn.className = 'tg-ai5-action-btn';
    copyHtmlBtn.textContent = 'Copy as HTML Accordion';
    copyHtmlBtn.addEventListener('click', function () {
      var html = faqs.length > 0 ? buildHtmlAccordion(faqs) : result;
      copyText(html, copyHtmlBtn);
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

    actions.appendChild(copyPlainBtn);
    actions.appendChild(copySchemaBtn);
    actions.appendChild(copyHtmlBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(tryAgainBtn);
    resultWrap.appendChild(actions);

    var meta = document.createElement('div');
    meta.className = 'tg-ai5-meta';
    meta.textContent = 'Powered by AI ✨  |  ' + (faqs.length > 0 ? faqs.length + ' FAQs parsed' : 'Click questions to expand');
    resultWrap.appendChild(meta);
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
      count: getActiveToggle(countToggles),
      type: getActiveToggle(typeToggles),
      audience: getActiveToggle(audToggles),
      length: getActiveToggle(lengthToggles),
      schema: getActiveToggle(schemaToggles)
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

(function () {
  'use strict';

  var HANDLER = 'business-name-generator';
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
      '.tg-bn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:16px}',
      '.tg-bn-card{background:#fff;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:16px;transition:box-shadow .2s}',
      '.tg-bn-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.08)}',
      '.tg-bn-name{font-size:18px;font-weight:700;color:var(--color-gray-900,#111827);margin-bottom:6px}',
      '.tg-bn-tagline{font-size:12px;color:var(--color-gray-500,#6b7280);line-height:1.5;margin-bottom:10px}',
      '.tg-bn-actions{display:flex;gap:6px}',
      '.tg-bn-action{padding:4px 10px;font-size:11px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:6px;cursor:pointer;background:#fff;text-decoration:none;color:inherit;transition:all .2s}',
      '.tg-bn-action:hover{border-color:var(--color-primary,#6366f1);color:var(--color-primary,#6366f1)}'
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

  // Industry
  var industryLabel = document.createElement('label');
  industryLabel.className = 'tg-ai5-label';
  industryLabel.textContent = 'Business type / industry *';
  var industryInput = document.createElement('input');
  industryInput.type = 'text';
  industryInput.className = 'tg-ai5-input';
  industryInput.placeholder = 'e.g. coffee shop, software company, yoga studio';
  var industryWrap = document.createElement('div');
  industryWrap.appendChild(industryLabel);
  industryWrap.appendChild(industryInput);
  form.appendChild(industryWrap);

  // Keywords
  var kwLabel = document.createElement('label');
  kwLabel.className = 'tg-ai5-label';
  kwLabel.textContent = 'Keywords to include (optional)';
  var kwInput = document.createElement('input');
  kwInput.type = 'text';
  kwInput.className = 'tg-ai5-input';
  kwInput.placeholder = 'e.g. swift, green, connect';
  var kwWrap = document.createElement('div');
  kwWrap.appendChild(kwLabel);
  kwWrap.appendChild(kwInput);
  form.appendChild(kwWrap);

  // Name style
  var styleLabel = document.createElement('label');
  styleLabel.className = 'tg-ai5-label';
  styleLabel.textContent = 'Name style';
  var styleToggle = makeToggleGroup([
    { label: 'Modern & Catchy', value: 'Modern & Catchy' },
    { label: 'Professional', value: 'Professional' },
    { label: 'Creative', value: 'Creative' },
    { label: 'Descriptive', value: 'Descriptive' },
    { label: 'Abstract', value: 'Abstract' },
    { label: 'Location-based', value: 'Location-based' }
  ], 'Modern & Catchy');
  var styleWrap = document.createElement('div');
  styleWrap.appendChild(styleLabel);
  styleWrap.appendChild(styleToggle);
  form.appendChild(styleWrap);

  // Name length
  var lengthLabel = document.createElement('label');
  lengthLabel.className = 'tg-ai5-label';
  lengthLabel.textContent = 'Name length';
  var lengthToggle = makeToggleGroup([
    { label: 'Short (1-2 words)', value: 'Short (1-2 words)' },
    { label: 'Medium (2-3 words)', value: 'Medium (2-3 words)' },
    { label: 'Any length', value: 'Any length' }
  ], 'Short (1-2 words)');
  var lengthWrap = document.createElement('div');
  lengthWrap.appendChild(lengthLabel);
  lengthWrap.appendChild(lengthToggle);
  form.appendChild(lengthWrap);

  // Target market
  var marketLabel = document.createElement('label');
  marketLabel.className = 'tg-ai5-label';
  marketLabel.textContent = 'Target market';
  var marketInput = document.createElement('input');
  marketInput.type = 'text';
  marketInput.className = 'tg-ai5-input';
  marketInput.placeholder = 'e.g. young professionals, families, fitness enthusiasts';
  var marketWrap = document.createElement('div');
  marketWrap.appendChild(marketLabel);
  marketWrap.appendChild(marketInput);
  form.appendChild(marketWrap);

  // Count
  var countLabel = document.createElement('label');
  countLabel.className = 'tg-ai5-label';
  countLabel.textContent = 'Number of names';
  var countToggle = makeToggleGroup([
    { label: '10', value: '10' },
    { label: '20', value: '20' },
    { label: '30', value: '30' }
  ], '10');
  var countWrap = document.createElement('div');
  countWrap.appendChild(countLabel);
  countWrap.appendChild(countToggle);
  form.appendChild(countWrap);

  // Button
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tg-ai5-btn';
  btn.textContent = 'Generate Names';
  btn.disabled = true;
  form.appendChild(btn);

  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Generating business names...</span>';
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

  industryInput.addEventListener('input', function () {
    btn.disabled = industryInput.value.trim() === '';
  });

  function parseNames(raw) {
    // Try to parse NAME: / TAGLINE: pattern
    var entries = [];
    var lines = raw.split('\n');
    var current = null;
    lines.forEach(function (line) {
      var nameMatch = line.match(/^NAME:\s*(.+)/i);
      var taglineMatch = line.match(/^TAGLINE:\s*(.+)/i);
      if (nameMatch) {
        if (current) entries.push(current);
        current = { name: nameMatch[1].trim(), tagline: '' };
      } else if (taglineMatch && current) {
        current.tagline = taglineMatch[1].trim();
      }
    });
    if (current) entries.push(current);

    // Fallback: numbered list
    if (entries.length === 0) {
      lines.forEach(function (line) {
        var m = line.match(/^\d+[\.\)]\s*(.+)/);
        if (m) entries.push({ name: m[1].trim(), tagline: '' });
      });
    }
    return entries;
  }

  function renderResults(raw) {
    var entries = parseNames(raw);
    resultsContainer.innerHTML = '';

    if (entries.length === 0) {
      // Show raw
      var pre = document.createElement('div');
      pre.className = 'tg-ai5-result show';
      pre.textContent = raw;
      resultsContainer.appendChild(pre);
      resultsContainer.style.display = 'block';
      return;
    }

    // Top bar
    var topBar = document.createElement('div');
    topBar.className = 'tg-ai5-actions';
    topBar.style.marginBottom = '8px';

    var copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'tg-ai5-action-btn';
    copyAllBtn.textContent = 'Copy All Names';
    copyAllBtn.addEventListener('click', function () {
      var allNames = entries.map(function (e) { return e.name + (e.tagline ? ' – ' + e.tagline : ''); }).join('\n');
      navigator.clipboard.writeText(allNames).then(function () {
        copyAllBtn.textContent = 'Copied!';
        setTimeout(function () { copyAllBtn.textContent = 'Copy All Names'; }, 2000);
      });
    });
    topBar.appendChild(copyAllBtn);

    var domainNote = document.createElement('div');
    domainNote.className = 'tg-ai5-meta';
    domainNote.textContent = '💡 Check domain availability at namecheap.com or godaddy.com';

    resultsContainer.appendChild(topBar);
    resultsContainer.appendChild(domainNote);

    var grid = document.createElement('div');
    grid.className = 'tg-bn-grid';

    entries.forEach(function (entry) {
      var card = document.createElement('div');
      card.className = 'tg-bn-card';

      var nameEl = document.createElement('div');
      nameEl.className = 'tg-bn-name';
      nameEl.textContent = entry.name;

      var tagEl = document.createElement('div');
      tagEl.className = 'tg-bn-tagline';
      tagEl.textContent = entry.tagline || ' ';

      var actions = document.createElement('div');
      actions.className = 'tg-bn-actions';

      var copyBtn = document.createElement('button');
      copyBtn.className = 'tg-bn-action';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(entry.name).then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
        });
      });

      var domainLink = document.createElement('a');
      domainLink.className = 'tg-bn-action';
      domainLink.textContent = 'Check Domain';
      domainLink.href = 'https://www.namecheap.com/?q=' + encodeURIComponent(entry.name.replace(/\s+/g, '') + '.com');
      domainLink.target = '_blank';
      domainLink.rel = 'noopener noreferrer';

      actions.appendChild(copyBtn);
      actions.appendChild(domainLink);
      card.appendChild(nameEl);
      card.appendChild(tagEl);
      card.appendChild(actions);
      grid.appendChild(card);
    });

    resultsContainer.appendChild(grid);
    resultsContainer.style.display = 'block';
  }

  btn.addEventListener('click', function () {
    var industry = industryInput.value.trim();
    if (!industry) return;

    btn.disabled = true;
    loading.classList.add('show');
    errorDiv.classList.remove('show');
    resultsContainer.style.display = 'none';
    metaDiv.style.display = 'none';

    callAI(HANDLER, {
      industry: industry,
      keywords: kwInput.value.trim(),
      style: styleToggle.getValue(),
      length: lengthToggle.getValue(),
      market: marketInput.value.trim(),
      count: countToggle.getValue()
    }, function (result) {
      loading.classList.remove('show');
      btn.disabled = false;
      renderResults(result);
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

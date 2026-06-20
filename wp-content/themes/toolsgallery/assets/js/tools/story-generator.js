(function () {
  'use strict';

  var HANDLER = 'story-generator';
  window.TGTools = window.TGTools || {};

  var box = document.querySelector('.tg-tool-box[data-handler="' + HANDLER + '"]');
  if (!box) return;

  // Inject common CSS once
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

  function makeToggleGroup(options, defaultValue) {
    var wrap = document.createElement('div');
    wrap.className = 'tg-ai5-toggles';
    var current = defaultValue;
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tg-ai5-toggle' + (opt.value === current ? ' active' : '');
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;
      btn.addEventListener('click', function () {
        wrap.querySelectorAll('.tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        current = opt.value;
      });
      wrap.appendChild(btn);
    });
    wrap.getValue = function () {
      var active = wrap.querySelector('.tg-ai5-toggle.active');
      return active ? active.dataset.value : current;
    };
    return wrap;
  }

  // Build form
  var form = document.createElement('div');
  form.className = 'tg-ai5-form';

  // Premise
  var premiseLabel = document.createElement('label');
  premiseLabel.className = 'tg-ai5-label';
  premiseLabel.textContent = 'Story premise / idea *';
  var premiseTA = document.createElement('textarea');
  premiseTA.className = 'tg-ai5-textarea';
  premiseTA.style.minHeight = '150px';
  premiseTA.placeholder = 'A detective in 2087 discovers that memories can be stolen...';
  premiseTA.required = true;
  var premiseWrap = document.createElement('div');
  premiseWrap.appendChild(premiseLabel);
  premiseWrap.appendChild(premiseTA);
  form.appendChild(premiseWrap);

  // Genre
  var genreLabel = document.createElement('label');
  genreLabel.className = 'tg-ai5-label';
  genreLabel.textContent = 'Genre';
  var genreSelect = document.createElement('select');
  genreSelect.className = 'tg-ai5-select';
  ['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Adventure', 'Thriller', 'Historical', 'Comedy', 'Drama', 'Children', 'Literary Fiction'].forEach(function (g) {
    var opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    genreSelect.appendChild(opt);
  });
  var genreWrap = document.createElement('div');
  genreWrap.appendChild(genreLabel);
  genreWrap.appendChild(genreSelect);
  form.appendChild(genreWrap);

  // Story length
  var lengthLabel = document.createElement('label');
  lengthLabel.className = 'tg-ai5-label';
  lengthLabel.textContent = 'Story length';
  var lengthToggle = makeToggleGroup([
    { label: 'Flash (~200w)', value: '200' },
    { label: 'Short (~500w)', value: '500' },
    { label: 'Medium (~1000w)', value: '1000' },
    { label: 'Long (~2000w)', value: '2000' }
  ], '500');
  var lengthWrap = document.createElement('div');
  lengthWrap.appendChild(lengthLabel);
  lengthWrap.appendChild(lengthToggle);
  form.appendChild(lengthWrap);

  // POV
  var povLabel = document.createElement('label');
  povLabel.className = 'tg-ai5-label';
  povLabel.textContent = 'Point of view';
  var povToggle = makeToggleGroup([
    { label: 'First Person', value: 'First Person' },
    { label: 'Third Person Limited', value: 'Third Person Limited' },
    { label: 'Third Person Omniscient', value: 'Third Person Omniscient' }
  ], 'Third Person Limited');
  var povWrap = document.createElement('div');
  povWrap.appendChild(povLabel);
  povWrap.appendChild(povToggle);
  form.appendChild(povWrap);

  // Row: setting + character
  var row = document.createElement('div');
  row.className = 'tg-ai5-row';

  var settingCol = document.createElement('div');
  settingCol.className = 'tg-ai5-col';
  var settingLabel = document.createElement('label');
  settingLabel.className = 'tg-ai5-label';
  settingLabel.textContent = 'Setting details (optional)';
  var settingInput = document.createElement('input');
  settingInput.type = 'text';
  settingInput.className = 'tg-ai5-input';
  settingInput.placeholder = 'e.g. Victorian London, space station, small town';
  settingCol.appendChild(settingLabel);
  settingCol.appendChild(settingInput);

  var charCol = document.createElement('div');
  charCol.className = 'tg-ai5-col';
  var charLabel = document.createElement('label');
  charLabel.className = 'tg-ai5-label';
  charLabel.textContent = 'Main character (optional)';
  var charInput = document.createElement('input');
  charInput.type = 'text';
  charInput.className = 'tg-ai5-input';
  charInput.placeholder = 'e.g. Sarah, 30s, detective';
  charCol.appendChild(charLabel);
  charCol.appendChild(charInput);

  row.appendChild(settingCol);
  row.appendChild(charCol);
  form.appendChild(row);

  // Tone
  var toneLabel = document.createElement('label');
  toneLabel.className = 'tg-ai5-label';
  toneLabel.textContent = 'Tone';
  var toneToggle = makeToggleGroup([
    { label: 'Dark', value: 'Dark' },
    { label: 'Light', value: 'Light' },
    { label: 'Suspenseful', value: 'Suspenseful' },
    { label: 'Humorous', value: 'Humorous' },
    { label: 'Emotional', value: 'Emotional' },
    { label: 'Epic', value: 'Epic' },
    { label: 'Mysterious', value: 'Mysterious' }
  ], 'Suspenseful');
  var toneWrap = document.createElement('div');
  toneWrap.appendChild(toneLabel);
  toneWrap.appendChild(toneToggle);
  form.appendChild(toneWrap);

  // Button
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tg-ai5-btn';
  btn.textContent = 'Generate Story';
  btn.disabled = true;
  form.appendChild(btn);

  // Loading
  var loading = document.createElement('div');
  loading.className = 'tg-ai5-loading';
  loading.innerHTML = '<span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span>Crafting your story...</span>';
  form.appendChild(loading);

  // Error
  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  // Result
  var resultDiv = document.createElement('div');
  resultDiv.className = 'tg-ai5-result';
  form.appendChild(resultDiv);

  var actionsDiv = document.createElement('div');
  actionsDiv.className = 'tg-ai5-actions';
  actionsDiv.style.display = 'none';
  form.appendChild(actionsDiv);

  var metaDiv = document.createElement('div');
  metaDiv.className = 'tg-ai5-meta';
  metaDiv.style.display = 'none';
  metaDiv.textContent = 'Powered by AI ✨';
  form.appendChild(metaDiv);

  box.appendChild(form);

  // Enable/disable button based on premise
  premiseTA.addEventListener('input', function () {
    btn.disabled = premiseTA.value.trim() === '';
  });

  btn.addEventListener('click', function () {
    var premise = premiseTA.value.trim();
    if (!premise) return;

    btn.disabled = true;
    loading.classList.add('show');
    errorDiv.classList.remove('show');
    resultDiv.classList.remove('show');
    actionsDiv.style.display = 'none';
    metaDiv.style.display = 'none';

    callAI(HANDLER, {
      premise: premise,
      genre: genreSelect.value,
      length: lengthToggle.getValue(),
      pov: povToggle.getValue(),
      setting: settingInput.value.trim(),
      character: charInput.value.trim(),
      tone: toneToggle.getValue()
    }, function (result) {
      loading.classList.remove('show');
      btn.disabled = false;
      resultDiv.textContent = result;
      resultDiv.classList.add('show');

      actionsDiv.innerHTML = '';
      var copyBtn = document.createElement('button');
      copyBtn.className = 'tg-ai5-action-btn';
      copyBtn.textContent = 'Copy Story';
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(result).then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy Story'; }, 2000);
        });
      });

      var dlBtn = document.createElement('button');
      dlBtn.className = 'tg-ai5-action-btn';
      dlBtn.textContent = 'Download .txt';
      dlBtn.addEventListener('click', function () {
        var blob = new Blob([result], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'story.txt';
        a.click();
        URL.revokeObjectURL(a.href);
      });

      actionsDiv.appendChild(copyBtn);
      actionsDiv.appendChild(dlBtn);
      actionsDiv.style.display = 'flex';
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

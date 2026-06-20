(function () {
  'use strict';

  var HANDLER = 'resume-writer';
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
      '.tg-wc-word-count{color:var(--color-primary,#6366f1);font-weight:600}',
      /* resume extras */
      '.rw-section{border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#fff}',
      '.rw-section-title{font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin:0 0 14px}',
      '.rw-pos-card{border:1px solid #e5e7eb;border-radius:6px;padding:14px;margin-bottom:12px;background:#f9fafb;position:relative}',
      '.rw-remove-btn{position:absolute;top:10px;right:10px;padding:3px 10px;font-size:12px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;border-radius:4px;cursor:pointer}',
      '.rw-add-btn{padding:8px 16px;border:1px dashed var(--color-primary,#6366f1);border-radius:6px;font-size:13px;color:var(--color-primary,#6366f1);background:transparent;cursor:pointer;width:100%;transition:background .2s}',
      '.rw-add-btn:hover{background:#eff6ff}'
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
  var styles = ['Modern','Classic','Minimal','ATS-Friendly'];
  var selectedStyle = 'ATS-Friendly';
  var lastRawResult = '';
  var positionCount = 0;
  var educationCount = 0;

  /* ── Build UI ── */
  box.innerHTML = [
    '<div class="tg-ai5-form" id="rw-form">',

    /* Section 1: Personal Info */
    '  <div class="rw-section">',
    '    <div class="rw-section-title">Personal Information</div>',
    '    <div class="tg-ai5-row">',
    '      <div class="tg-ai5-col"><label class="tg-ai5-label">Full Name <span style="color:#dc2626">*</span></label><input class="tg-ai5-input" id="rw-name" type="text" placeholder="e.g. Jane Doe"></div>',
    '      <div class="tg-ai5-col"><label class="tg-ai5-label">Job Title</label><input class="tg-ai5-input" id="rw-title" type="text" placeholder="e.g. Software Engineer"></div>',
    '    </div>',
    '    <div class="tg-ai5-row" style="margin-top:10px">',
    '      <div class="tg-ai5-col"><label class="tg-ai5-label">Email</label><input class="tg-ai5-input" id="rw-email" type="email" placeholder="jane@example.com"></div>',
    '      <div class="tg-ai5-col"><label class="tg-ai5-label">Phone</label><input class="tg-ai5-input" id="rw-phone" type="text" placeholder="+1 555 123 4567"></div>',
    '    </div>',
    '    <div class="tg-ai5-row" style="margin-top:10px">',
    '      <div class="tg-ai5-col"><label class="tg-ai5-label">Location</label><input class="tg-ai5-input" id="rw-location" type="text" placeholder="New York, NY"></div>',
    '      <div class="tg-ai5-col"><label class="tg-ai5-label">LinkedIn URL</label><input class="tg-ai5-input" id="rw-linkedin" type="text" placeholder="linkedin.com/in/janedoe"></div>',
    '    </div>',
    '  </div>',

    /* Section 2: Summary */
    '  <div class="rw-section">',
    '    <div class="rw-section-title">Professional Summary</div>',
    '    <textarea class="tg-ai5-textarea" id="rw-summary" style="min-height:100px" placeholder="Write a 2-3 sentence professional summary..."></textarea>',
    '  </div>',

    /* Section 3: Experience */
    '  <div class="rw-section">',
    '    <div class="rw-section-title">Work Experience</div>',
    '    <div id="rw-positions"></div>',
    '    <button class="rw-add-btn" id="rw-add-pos">+ Add Position</button>',
    '  </div>',

    /* Section 4: Education */
    '  <div class="rw-section">',
    '    <div class="rw-section-title">Education</div>',
    '    <div id="rw-educations"></div>',
    '    <button class="rw-add-btn" id="rw-add-edu">+ Add Education</button>',
    '  </div>',

    /* Section 5: Skills */
    '  <div class="rw-section">',
    '    <div class="rw-section-title">Skills &amp; Languages</div>',
    '    <div class="tg-ai5-row">',
    '      <div class="tg-ai5-col"><label class="tg-ai5-label">Skills</label><input class="tg-ai5-input" id="rw-skills" type="text" placeholder="JavaScript, React, Node.js, ..."></div>',
    '      <div class="tg-ai5-col"><label class="tg-ai5-label">Languages</label><input class="tg-ai5-input" id="rw-langs" type="text" placeholder="English (Native), Spanish (Intermediate)"></div>',
    '    </div>',
    '  </div>',

    /* Section 6: Style */
    '  <div class="rw-section">',
    '    <div class="rw-section-title">Resume Style</div>',
    '    <div class="tg-ai5-toggles" id="rw-styles">',
    styles.map(function (s) {
      return '<button class="tg-ai5-toggle' + (s === 'ATS-Friendly' ? ' active' : '') + '" data-val="' + s + '">' + s + '</button>';
    }).join(''),
    '    </div>',
    '  </div>',

    '  <div><button class="tg-ai5-btn" id="rw-btn" disabled>Generate Resume</button></div>',
    '</div>',

    '<div class="tg-ai5-loading" id="rw-loading">',
    '  <span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span><span class="tg-ai5-dot"></span>',
    '  <span>Generating your resume...</span>',
    '</div>',
    '<div class="tg-ai5-result" id="rw-result"></div>',
    '<div class="tg-ai5-actions" id="rw-actions" style="display:none">',
    '  <button class="tg-ai5-action-btn" id="rw-copy-md">Copy as Markdown</button>',
    '  <button class="tg-ai5-action-btn" id="rw-download">Download .txt</button>',
    '  <button class="tg-ai5-action-btn" id="rw-again">Try Again</button>',
    '</div>',
    '<div class="tg-ai5-error" id="rw-error"></div>',
    '<div class="tg-ai5-meta" id="rw-meta"></div>'
  ].join('');

  /* style toggle */
  box.querySelector('#rw-styles').addEventListener('click', function (e) {
    var btn = e.target.closest('.tg-ai5-toggle');
    if (!btn) return;
    box.querySelectorAll('#rw-styles .tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    selectedStyle = btn.dataset.val;
  });

  /* Add/remove positions */
  function addPosition() {
    if (positionCount >= 5) return;
    positionCount++;
    var idx = positionCount;
    var card = document.createElement('div');
    card.className = 'rw-pos-card';
    card.dataset.posIdx = idx;
    card.innerHTML = [
      '<button class="rw-remove-btn" type="button">Remove</button>',
      '<div class="tg-ai5-row">',
      '  <div class="tg-ai5-col"><label class="tg-ai5-label">Company</label><input class="tg-ai5-input rw-pos-company" type="text" placeholder="Company name"></div>',
      '  <div class="tg-ai5-col"><label class="tg-ai5-label">Job Title</label><input class="tg-ai5-input rw-pos-jobtitle" type="text" placeholder="Your title"></div>',
      '</div>',
      '<div class="tg-ai5-row" style="margin-top:10px">',
      '  <div class="tg-ai5-col"><label class="tg-ai5-label">Start Date</label><input class="tg-ai5-input rw-pos-start" type="text" placeholder="Jan 2020"></div>',
      '  <div class="tg-ai5-col"><label class="tg-ai5-label">End Date</label><input class="tg-ai5-input rw-pos-end" type="text" placeholder="Dec 2023 / Present"></div>',
      '</div>',
      '<div style="margin-top:10px"><label class="tg-ai5-label">Key Responsibilities</label>',
      '<textarea class="tg-ai5-textarea rw-pos-resp" style="min-height:80px" placeholder="Describe key responsibilities and achievements..."></textarea></div>'
    ].join('');
    card.querySelector('.rw-remove-btn').addEventListener('click', function () {
      card.remove();
    });
    box.querySelector('#rw-positions').appendChild(card);
    if (positionCount >= 5) {
      box.querySelector('#rw-add-pos').disabled = true;
      box.querySelector('#rw-add-pos').style.opacity = '.4';
    }
  }

  function addEducation() {
    if (educationCount >= 3) return;
    educationCount++;
    var card = document.createElement('div');
    card.className = 'rw-pos-card';
    card.innerHTML = [
      '<button class="rw-remove-btn" type="button">Remove</button>',
      '<div class="tg-ai5-row">',
      '  <div class="tg-ai5-col"><label class="tg-ai5-label">Institution</label><input class="tg-ai5-input rw-edu-inst" type="text" placeholder="University name"></div>',
      '  <div class="tg-ai5-col"><label class="tg-ai5-label">Degree</label><input class="tg-ai5-input rw-edu-degree" type="text" placeholder="e.g. Bachelor\'s"></div>',
      '</div>',
      '<div class="tg-ai5-row" style="margin-top:10px">',
      '  <div class="tg-ai5-col"><label class="tg-ai5-label">Field of Study</label><input class="tg-ai5-input rw-edu-field" type="text" placeholder="e.g. Computer Science"></div>',
      '  <div class="tg-ai5-col"><label class="tg-ai5-label">Year</label><input class="tg-ai5-input rw-edu-year" type="text" placeholder="e.g. 2019"></div>',
      '</div>'
    ].join('');
    card.querySelector('.rw-remove-btn').addEventListener('click', function () {
      card.remove();
      educationCount--;
      if (educationCount < 3) {
        box.querySelector('#rw-add-edu').disabled = false;
        box.querySelector('#rw-add-edu').style.opacity = '1';
      }
    });
    box.querySelector('#rw-educations').appendChild(card);
    if (educationCount >= 3) {
      box.querySelector('#rw-add-edu').disabled = true;
      box.querySelector('#rw-add-edu').style.opacity = '.4';
    }
  }

  box.querySelector('#rw-add-pos').addEventListener('click', addPosition);
  box.querySelector('#rw-add-edu').addEventListener('click', addEducation);

  /* Enable/disable submit */
  var nameInput = box.querySelector('#rw-name');
  var submitBtn = box.querySelector('#rw-btn');
  nameInput.addEventListener('input', function () {
    submitBtn.disabled = !nameInput.value.trim();
  });

  var loading = box.querySelector('#rw-loading');
  var resultEl = box.querySelector('#rw-result');
  var actions = box.querySelector('#rw-actions');
  var errorEl = box.querySelector('#rw-error');
  var metaEl = box.querySelector('#rw-meta');

  function showError(msg) { errorEl.textContent = msg; errorEl.classList.add('show'); }
  function hideError() { errorEl.classList.remove('show'); }

  function buildExperienceString() {
    var cards = box.querySelectorAll('#rw-positions .rw-pos-card');
    var parts = [];
    cards.forEach(function (card, i) {
      var company = (card.querySelector('.rw-pos-company').value || '').trim();
      var title = (card.querySelector('.rw-pos-jobtitle').value || '').trim();
      var start = (card.querySelector('.rw-pos-start').value || '').trim();
      var end = (card.querySelector('.rw-pos-end').value || '').trim();
      var resp = (card.querySelector('.rw-pos-resp').value || '').trim();
      if (company || title) {
        parts.push('Position ' + (i + 1) + ': ' + title + ' at ' + company + ' (' + start + '-' + end + '): ' + resp);
      }
    });
    return parts.join('\n');
  }

  function buildEducationString() {
    var cards = box.querySelectorAll('#rw-educations .rw-pos-card');
    var parts = [];
    cards.forEach(function (card, i) {
      var inst = (card.querySelector('.rw-edu-inst').value || '').trim();
      var degree = (card.querySelector('.rw-edu-degree').value || '').trim();
      var field = (card.querySelector('.rw-edu-field').value || '').trim();
      var year = (card.querySelector('.rw-edu-year').value || '').trim();
      if (inst || degree) {
        parts.push('Education ' + (i + 1) + ': ' + degree + ' in ' + field + ' at ' + inst + ' (' + year + ')');
      }
    });
    return parts.join('\n');
  }

  submitBtn.addEventListener('click', function () {
    var name = nameInput.value.trim();
    if (!name) { showError('Please enter your full name.'); return; }
    hideError();
    resultEl.classList.remove('show');
    actions.style.display = 'none';
    metaEl.textContent = '';
    submitBtn.disabled = true;
    loading.classList.add('show');

    callAI(HANDLER, {
      name: name,
      job_title: box.querySelector('#rw-title').value.trim(),
      summary: box.querySelector('#rw-summary').value.trim(),
      experience: buildExperienceString(),
      education: buildEducationString(),
      skills: box.querySelector('#rw-skills').value.trim(),
      languages: box.querySelector('#rw-langs').value.trim(),
      style: selectedStyle
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

  box.querySelector('#rw-copy-md').addEventListener('click', function () {
    navigator.clipboard && navigator.clipboard.writeText(lastRawResult);
    this.textContent = 'Copied!';
    var self = this;
    setTimeout(function () { self.textContent = 'Copy as Markdown'; }, 1500);
  });

  box.querySelector('#rw-download').addEventListener('click', function () {
    var blob = new Blob([lastRawResult], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = HANDLER + '-output.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  box.querySelector('#rw-again').addEventListener('click', function () {
    resultEl.classList.remove('show');
    actions.style.display = 'none';
    metaEl.textContent = '';
    hideError();
  });

  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { handler: HANDLER, box: box };
})();

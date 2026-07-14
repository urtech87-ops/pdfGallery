/**
 * ToolsGallery — Text to Speech
 * Handler: tts-prep
 *
 * Server-generated speech via the tg_tts_proxy AJAX action (OpenAI TTS,
 * gpt-4o-mini-tts). Returns real MP3 audio: playable in-page and
 * downloadable. Voice, vibe/emotion presets, custom instructions, tone
 * and speed controls.
 */
(function () {
  'use strict';

  var HANDLER = 'tts-prep';
  var box = document.querySelector('.tg-tool-box[data-handler="' + HANDLER + '"]');
  if (!box) return;

  /* ── Shared CSS ── */
  if (!document.getElementById('tg-ai5-css')) {
    var style = document.createElement('style');
    style.id = 'tg-ai5-css';
    style.textContent = '.tg-ai5-form{display:flex;flex-direction:column;gap:16px}.tg-ai5-label{display:block;font-size:13px;font-weight:600;color:var(--color-gray-700,#374151);margin-bottom:6px}.tg-ai5-textarea{width:100%;min-height:180px;padding:12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:15px;font-family:inherit;resize:vertical;box-sizing:border-box}.tg-ai5-textarea:focus{outline:none;border-color:var(--color-primary,#6366f1);box-shadow:0 0 0 3px rgba(99,102,241,.1)}.tg-ai5-input{width:100%;padding:10px 12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:14px;font-family:inherit;box-sizing:border-box}.tg-ai5-select{width:100%;padding:10px 12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:14px;font-family:inherit;background:#fff;box-sizing:border-box}.tg-ai5-row{display:flex;gap:12px;flex-wrap:wrap}.tg-ai5-col{flex:1;min-width:140px}.tg-ai5-toggles{display:flex;gap:8px;flex-wrap:wrap}.tg-ai5-toggle{padding:6px 14px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:20px;font-size:13px;cursor:pointer;background:#fff;transition:all .2s}.tg-ai5-toggle.active{background:var(--color-primary,#6366f1);color:#fff;border-color:var(--color-primary,#6366f1)}.tg-ai5-btn{padding:12px 28px;background:var(--color-primary,#6366f1);color:#fff;border:none;border-radius:var(--radius-md,8px);font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s}.tg-ai5-btn:hover{opacity:.9}.tg-ai5-btn:disabled{opacity:.5;cursor:not-allowed}.tg-ai5-error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:var(--radius-md,8px);padding:12px;margin-top:12px;display:none}.tg-ai5-error.show{display:block}';
    document.head.appendChild(style);
  }

  /* ── TTS-specific CSS ── */
  if (!document.getElementById('tg-tts-css')) {
    var ttsStyle = document.createElement('style');
    ttsStyle.id = 'tg-tts-css';
    ttsStyle.textContent = '.tg-tts-slider-row{display:flex;align-items:center;gap:12px;margin-bottom:6px}.tg-tts-slider{flex:1;accent-color:var(--color-primary,#6366f1)}.tg-tts-slider-val{font-size:13px;font-weight:600;color:var(--color-primary,#6366f1);min-width:110px}.tg-tts-char-count{font-size:12px;color:var(--color-gray-500,#6b7280);text-align:right;margin-top:4px}.tg-tts-word-count{font-size:12px;color:var(--color-gray-500,#6b7280);margin-top:4px}.tg-tts-loading{display:none;align-items:center;gap:10px;padding:14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--radius-md,8px);color:#1e40af;font-size:14px;font-weight:600}.tg-tts-loading.show{display:flex}.tg-tts-spinner{width:18px;height:18px;border:3px solid #bfdbfe;border-top-color:#2563eb;border-radius:50%;animation:tg-tts-spin .8s linear infinite}@keyframes tg-tts-spin{to{transform:rotate(360deg)}}.tg-tts-result{display:none;flex-direction:column;gap:12px;background:var(--color-gray-50,#f9fafb);border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:16px}.tg-tts-result.show{display:flex}.tg-tts-audio{width:100%}.tg-tts-download{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;background:#16a34a;color:#fff;border:none;border-radius:var(--radius-md,8px);font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .2s}.tg-tts-download:hover{opacity:.9}';
    document.head.appendChild(ttsStyle);
  }

  var MAX_CHARS = 12000;

  var VOICES = [
    { id: 'alloy',   label: 'Alloy — neutral, balanced' },
    { id: 'ash',     label: 'Ash — male, warm and clear' },
    { id: 'ballad',  label: 'Ballad — male, British, expressive' },
    { id: 'coral',   label: 'Coral — female, bright and upbeat' },
    { id: 'echo',    label: 'Echo — male, calm and steady' },
    { id: 'fable',   label: 'Fable — British, animated storyteller' },
    { id: 'onyx',    label: 'Onyx — male, deep and authoritative' },
    { id: 'nova',    label: 'Nova — female, friendly and energetic' },
    { id: 'sage',    label: 'Sage — female, soft and gentle' },
    { id: 'shimmer', label: 'Shimmer — female, crisp and clear' },
    { id: 'verse',   label: 'Verse — male, versatile and expressive' }
  ];

  var VIBES = {
    'Neutral':    '',
    'Cheerful':   'Speak in a cheerful, upbeat, positive tone with a smile in your voice.',
    'Calm':       'Speak in a calm, soothing, relaxed tone with gentle pacing.',
    'Serious':    'Speak in a serious, measured, authoritative tone.',
    'Excited':    'Speak with high energy and genuine excitement, enthusiastic delivery.',
    'Storyteller': 'Narrate like a warm storyteller: expressive, engaging pacing, subtle dramatic pauses.',
    'Newscaster': 'Speak like a professional news anchor: clear, confident, formal delivery.',
    'Whisper':    'Speak in a soft whisper: hushed, intimate and quiet.'
  };

  var TONE_HINTS = {
    1: 'Deliver it in a very soft, low-key, understated way.',
    2: 'Deliver it in a slightly soft, relaxed way.',
    3: '',
    4: 'Deliver it with slightly elevated energy and emphasis.',
    5: 'Deliver it with strong energy, bold emphasis and dynamic intonation.'
  };
  var TONE_LABELS = { 1: 'Very soft', 2: 'Soft', 3: 'Balanced', 4: 'Energetic', 5: 'Very energetic' };

  /* ── Render UI ── */
  box.innerHTML = '<div class="tg-ai5-form" id="tts-form">' +

    '<div>' +
      '<label class="tg-ai5-label">Text to Convert</label>' +
      '<textarea class="tg-ai5-textarea" id="tts-text" placeholder="Enter text to convert to speech..." maxlength="' + MAX_CHARS + '" style="min-height:150px"></textarea>' +
      '<div class="tg-tts-char-count"><span id="tts-char-count">0</span> / ' + MAX_CHARS + ' characters</div>' +
      '<div class="tg-tts-word-count" id="tts-word-count">0 words</div>' +
    '</div>' +

    '<div>' +
      '<label class="tg-ai5-label">Voice</label>' +
      '<select class="tg-ai5-select" id="tts-voice">' +
        VOICES.map(function (v) { return '<option value="' + v.id + '">' + v.label + '</option>'; }).join('') +
      '</select>' +
    '</div>' +

    '<div>' +
      '<label class="tg-ai5-label">Vibe / Emotion</label>' +
      '<div class="tg-ai5-toggles" id="tts-vibe">' +
        Object.keys(VIBES).map(function (v, i) {
          return '<button type="button" class="tg-ai5-toggle' + (i === 0 ? ' active' : '') + '" data-vibe="' + v + '">' + v + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +

    '<div>' +
      '<label class="tg-ai5-label">Custom instructions (optional)</label>' +
      '<input type="text" class="tg-ai5-input" id="tts-custom" maxlength="300" placeholder="e.g. Speak with a slight French accent, pause before key points...">' +
    '</div>' +

    '<div class="tg-ai5-row">' +
      '<div class="tg-ai5-col">' +
        '<label class="tg-ai5-label">Tone</label>' +
        '<div class="tg-tts-slider-row">' +
          '<input type="range" class="tg-tts-slider" id="tts-tone" min="1" max="5" step="1" value="3">' +
          '<span class="tg-tts-slider-val" id="tts-tone-val">Balanced</span>' +
        '</div>' +
      '</div>' +
      '<div class="tg-ai5-col">' +
        '<label class="tg-ai5-label">Speed</label>' +
        '<div class="tg-tts-slider-row">' +
          '<input type="range" class="tg-tts-slider" id="tts-rate" min="0.5" max="2" step="0.1" value="1">' +
          '<span class="tg-tts-slider-val" id="tts-rate-val">1.0&times;</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<button type="button" class="tg-ai5-btn" id="tts-generate">Generate Speech</button>' +

    '<div class="tg-tts-loading" id="tts-loading"><span class="tg-tts-spinner"></span> Generating audio... this can take a few seconds.</div>' +

    '<div class="tg-tts-result" id="tts-result">' +
      '<audio controls class="tg-tts-audio" id="tts-audio"></audio>' +
      '<div><a class="tg-tts-download" id="tts-download" download="speech.mp3">&#11015; Download MP3</a></div>' +
    '</div>' +

    '<div class="tg-ai5-error" id="tts-error"></div>' +

  '</div>';

  /* ── Elements ── */
  var textEl    = box.querySelector('#tts-text');
  var charCount = box.querySelector('#tts-char-count');
  var wordCount = box.querySelector('#tts-word-count');
  var voiceEl   = box.querySelector('#tts-voice');
  var vibeWrap  = box.querySelector('#tts-vibe');
  var customEl  = box.querySelector('#tts-custom');
  var toneEl    = box.querySelector('#tts-tone');
  var toneVal   = box.querySelector('#tts-tone-val');
  var rateEl    = box.querySelector('#tts-rate');
  var rateVal   = box.querySelector('#tts-rate-val');
  var genBtn    = box.querySelector('#tts-generate');
  var loadingEl = box.querySelector('#tts-loading');
  var resultEl  = box.querySelector('#tts-result');
  var audioEl   = box.querySelector('#tts-audio');
  var dlLink    = box.querySelector('#tts-download');
  var errorEl   = box.querySelector('#tts-error');

  var selectedVibe = 'Neutral';
  var blobUrl = null;

  /* ── Text stats ── */
  textEl.addEventListener('input', function () {
    var val = textEl.value;
    charCount.textContent = val.length;
    var wc = val.trim() ? val.trim().split(/\s+/).filter(Boolean).length : 0;
    wordCount.textContent = wc + ' word' + (wc !== 1 ? 's' : '');
  });

  /* ── Vibe toggles ── */
  vibeWrap.addEventListener('click', function (e) {
    var btn = e.target.closest('.tg-ai5-toggle');
    if (!btn) return;
    vibeWrap.querySelectorAll('.tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    selectedVibe = btn.dataset.vibe;
  });

  /* ── Sliders ── */
  toneEl.addEventListener('input', function () { toneVal.textContent = TONE_LABELS[toneEl.value] || 'Balanced'; });
  rateEl.addEventListener('input', function () { rateVal.innerHTML = parseFloat(rateEl.value).toFixed(1) + '&times;'; });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('show');
  }

  function buildInstructions() {
    var parts = [];
    if (VIBES[selectedVibe]) parts.push(VIBES[selectedVibe]);
    var toneHint = TONE_HINTS[toneEl.value];
    if (toneHint) parts.push(toneHint);
    var custom = customEl.value.trim();
    if (custom) parts.push(custom);
    return parts.join(' ');
  }

  function base64ToBlob(b64, mime) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime || 'audio/mpeg' });
  }

  /* ── Generate ── */
  genBtn.addEventListener('click', function () {
    var text = textEl.value.trim();
    errorEl.classList.remove('show');

    if (!text) { showError('Please enter some text to convert to speech.'); return; }

    genBtn.disabled = true;
    loadingEl.classList.add('show');
    resultEl.classList.remove('show');

    var formData = new URLSearchParams();
    formData.append('action', 'tg_tts_proxy');
    formData.append('nonce', (window.tgAiConfig && window.tgAiConfig.nonce) || (document.getElementById('tg_nonce') ? document.getElementById('tg_nonce').value : ''));
    formData.append('text', text);
    formData.append('voice', voiceEl.value);
    formData.append('instructions', buildInstructions());
    formData.append('speed', rateEl.value);
    formData.append('format', 'mp3');

    fetch((window.tgAiConfig && window.tgAiConfig.ajaxUrl) || '/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    }).then(function (r) { return r.json(); }).then(function (data) {
      genBtn.disabled = false;
      loadingEl.classList.remove('show');

      if (!data.success) {
        showError((data.data && data.data.message) || 'Speech generation failed. Please try again.');
        return;
      }
      var b64 = data.data && data.data.audio;
      if (!b64) {
        showError('No audio was returned. Please try again.');
        return;
      }

      if (blobUrl) URL.revokeObjectURL(blobUrl);
      var blob = base64ToBlob(b64, (data.data && data.data.mime) || 'audio/mpeg');
      blobUrl = URL.createObjectURL(blob);

      audioEl.src = blobUrl;
      dlLink.href = blobUrl;
      resultEl.classList.add('show');
      audioEl.play().catch(function () { /* autoplay may be blocked — user can press play */ });
    }).catch(function () {
      genBtn.disabled = false;
      loadingEl.classList.remove('show');
      showError('Network error. Please try again.');
    });
  });

  /* ── Register ── */
  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { init: function () {} };
})();

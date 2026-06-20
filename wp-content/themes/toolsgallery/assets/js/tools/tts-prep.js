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
    ttsStyle.textContent = '.tg-tts-controls{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}.tg-tts-ctrl-btn{padding:10px 20px;border:none;border-radius:var(--radius-md,8px);font-size:15px;cursor:pointer;font-weight:600;transition:all .2s}.tg-tts-play{background:var(--color-primary,#6366f1);color:#fff}.tg-tts-pause{background:#f59e0b;color:#fff}.tg-tts-stop{background:#ef4444;color:#fff}.tg-tts-ctrl-btn:hover{opacity:.9}.tg-tts-ctrl-btn:disabled{opacity:.4;cursor:not-allowed}.tg-tts-status{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-top:10px}.tg-tts-status-ready{background:#f0fdf4;color:#16a34a}.tg-tts-status-speaking{background:#eff6ff;color:#2563eb}.tg-tts-status-paused{background:#fefce8;color:#ca8a04}.tg-tts-slider-row{display:flex;align-items:center;gap:12px;margin-bottom:6px}.tg-tts-slider{flex:1;accent-color:var(--color-primary,#6366f1)}.tg-tts-slider-val{font-size:13px;font-weight:600;color:var(--color-primary,#6366f1);min-width:70px}.tg-tts-char-count{font-size:12px;color:var(--color-gray-500,#6b7280);text-align:right;margin-top:4px}.tg-tts-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--radius-md,8px);padding:12px;font-size:13px;color:#1e40af;margin-top:12px}.tg-tts-word-count{font-size:12px;color:var(--color-gray-500,#6b7280);margin-top:4px}';
    document.head.appendChild(ttsStyle);
  }

  var MAX_CHARS = 5000;

  /* ── Render UI ── */
  box.innerHTML = '<div class="tg-ai5-form" id="tts-form">' +

    '<div>' +
      '<label class="tg-ai5-label">Text to Convert</label>' +
      '<textarea class="tg-ai5-textarea" id="tts-text" placeholder="Enter text to convert to speech..." maxlength="' + MAX_CHARS + '" style="min-height:150px"></textarea>' +
      '<div class="tg-tts-char-count"><span id="tts-char-count">0</span> / ' + MAX_CHARS + ' characters</div>' +
      '<div class="tg-tts-word-count" id="tts-word-count">0 words</div>' +
    '</div>' +

    '<div>' +
      '<label class="tg-ai5-label">Language Filter</label>' +
      '<div class="tg-ai5-toggles" id="tts-lang-filter">' +
        ['All','English','Spanish','French','German','Arabic','Chinese','Japanese','Portuguese','Russian'].map(function(l, i) {
          return '<button type="button" class="tg-ai5-toggle' + (i === 0 ? ' active' : '') + '" data-lang="' + l + '">' + l + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +

    '<div>' +
      '<label class="tg-ai5-label">Voice</label>' +
      '<select class="tg-ai5-select" id="tts-voice"><option>Loading voices...</option></select>' +
    '</div>' +

    '<div>' +
      '<label class="tg-ai5-label">Speed</label>' +
      '<div class="tg-tts-slider-row">' +
        '<input type="range" class="tg-tts-slider" id="tts-rate" min="0.5" max="2" step="0.1" value="1">' +
        '<span class="tg-tts-slider-val" id="tts-rate-val">Speed: 1.0×</span>' +
      '</div>' +
    '</div>' +

    '<div>' +
      '<label class="tg-ai5-label">Pitch</label>' +
      '<div class="tg-tts-slider-row">' +
        '<input type="range" class="tg-tts-slider" id="tts-pitch" min="0.5" max="2" step="0.1" value="1">' +
        '<span class="tg-tts-slider-val" id="tts-pitch-val">Pitch: 1.0</span>' +
      '</div>' +
    '</div>' +

    '<div>' +
      '<label class="tg-ai5-label">Volume</label>' +
      '<div class="tg-tts-slider-row">' +
        '<input type="range" class="tg-tts-slider" id="tts-volume" min="0" max="1" step="0.1" value="1">' +
        '<span class="tg-tts-slider-val" id="tts-vol-val">Volume: 100%</span>' +
      '</div>' +
    '</div>' +

    '<div class="tg-tts-controls">' +
      '<button type="button" class="tg-tts-ctrl-btn tg-tts-play" id="tts-play">&#9654; Play</button>' +
      '<button type="button" class="tg-tts-ctrl-btn tg-tts-pause" id="tts-pause" disabled>&#9646;&#9646; Pause</button>' +
      '<button type="button" class="tg-tts-ctrl-btn tg-tts-stop" id="tts-stop" disabled>&#9646; Stop</button>' +
    '</div>' +

    '<div><span class="tg-tts-status tg-tts-status-ready" id="tts-status">&#9679; Ready</span></div>' +

    '<div class="tg-tts-info">' +
      'ℹ️ <strong>Audio download:</strong> Use your browser\'s built-in recording feature or system audio recorder to capture the speech output. Direct audio download is not available in all browsers.' +
    '</div>' +

    '<div class="tg-ai5-error" id="tts-error"></div>' +

  '</div>';

  /* ── Elements ── */
  var textEl     = box.querySelector('#tts-text');
  var charCount  = box.querySelector('#tts-char-count');
  var wordCount  = box.querySelector('#tts-word-count');
  var voiceEl    = box.querySelector('#tts-voice');
  var rateEl     = box.querySelector('#tts-rate');
  var rateVal    = box.querySelector('#tts-rate-val');
  var pitchEl    = box.querySelector('#tts-pitch');
  var pitchVal   = box.querySelector('#tts-pitch-val');
  var volEl      = box.querySelector('#tts-volume');
  var volVal     = box.querySelector('#tts-vol-val');
  var playBtn    = box.querySelector('#tts-play');
  var pauseBtn   = box.querySelector('#tts-pause');
  var stopBtn    = box.querySelector('#tts-stop');
  var statusEl   = box.querySelector('#tts-status');
  var errorEl    = box.querySelector('#tts-error');
  var langFilter = box.querySelector('#tts-lang-filter');

  var allVoices  = [];
  var selectedLang = 'All';

  /* ── Voice loading ── */
  function populateVoices() {
    allVoices = window.speechSynthesis.getVoices();
    filterVoices();
  }

  function filterVoices() {
    var filtered = allVoices;
    if (selectedLang !== 'All') {
      var langMap = {
        'English': 'en', 'Spanish': 'es', 'French': 'fr', 'German': 'de',
        'Arabic': 'ar', 'Chinese': 'zh', 'Japanese': 'ja', 'Portuguese': 'pt', 'Russian': 'ru'
      };
      var code = langMap[selectedLang] || selectedLang.toLowerCase();
      filtered = allVoices.filter(function(v) { return v.lang.toLowerCase().indexOf(code) === 0; });
    }

    voiceEl.innerHTML = '';
    if (!filtered.length) {
      voiceEl.innerHTML = '<option value="">No voices available for this language</option>';
      return;
    }
    filtered.forEach(function(v, i) {
      var opt = document.createElement('option');
      opt.value = i + '__' + v.name;
      opt.textContent = v.name + ' (' + v.lang + ')';
      voiceEl.appendChild(opt);
    });
  }

  if (typeof speechSynthesis !== 'undefined') {
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoices;
    }
    populateVoices();
    setTimeout(populateVoices, 500);
  } else {
    voiceEl.innerHTML = '<option>Text-to-Speech not supported in this browser</option>';
  }

  /* ── Language filter toggles ── */
  langFilter.addEventListener('click', function(e) {
    var btn = e.target.closest('.tg-ai5-toggle');
    if (!btn) return;
    langFilter.querySelectorAll('.tg-ai5-toggle').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    selectedLang = btn.dataset.lang;
    filterVoices();
  });

  /* ── Text stats ── */
  textEl.addEventListener('input', function() {
    var val = textEl.value;
    charCount.textContent = val.length;
    var wc = val.trim() ? val.trim().split(/\s+/).filter(Boolean).length : 0;
    wordCount.textContent = wc + ' word' + (wc !== 1 ? 's' : '');
  });

  /* ── Sliders ── */
  rateEl.addEventListener('input', function() { rateVal.textContent = 'Speed: ' + parseFloat(rateEl.value).toFixed(1) + '×'; });
  pitchEl.addEventListener('input', function() { pitchVal.textContent = 'Pitch: ' + parseFloat(pitchEl.value).toFixed(1); });
  volEl.addEventListener('input', function() { volVal.textContent = 'Volume: ' + Math.round(parseFloat(volEl.value) * 100) + '%'; });

  /* ── Status helper ── */
  function setStatus(state) {
    statusEl.className = 'tg-tts-status';
    if (state === 'speaking') {
      statusEl.classList.add('tg-tts-status-speaking');
      statusEl.innerHTML = '&#9679; Speaking...';
      playBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
    } else if (state === 'paused') {
      statusEl.classList.add('tg-tts-status-paused');
      statusEl.innerHTML = '&#9679; Paused';
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      statusEl.classList.add('tg-tts-status-ready');
      statusEl.innerHTML = '&#9679; Ready';
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
    }
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('show');
    setTimeout(function() { errorEl.classList.remove('show'); }, 5000);
  }

  /* ── Playback ── */
  function getSelectedVoice() {
    var val = voiceEl.value;
    if (!val || val === '') return null;
    var idx = parseInt(val.split('__')[0], 10);
    var filtered = allVoices;
    if (selectedLang !== 'All') {
      var langMap = { 'English': 'en', 'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Arabic': 'ar', 'Chinese': 'zh', 'Japanese': 'ja', 'Portuguese': 'pt', 'Russian': 'ru' };
      var code = langMap[selectedLang] || selectedLang.toLowerCase();
      filtered = allVoices.filter(function(v) { return v.lang.toLowerCase().indexOf(code) === 0; });
    }
    return filtered[idx] || null;
  }

  playBtn.addEventListener('click', function() {
    if (typeof speechSynthesis === 'undefined') { showError('Text-to-Speech is not supported in this browser.'); return; }
    var text = textEl.value.trim();
    if (!text) { showError('Please enter some text to speak.'); return; }

    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setStatus('speaking');
      return;
    }

    speechSynthesis.cancel();

    var utterance = new SpeechSynthesisUtterance(text);
    var voice = getSelectedVoice();
    if (voice) utterance.voice = voice;
    utterance.rate   = parseFloat(rateEl.value);
    utterance.pitch  = parseFloat(pitchEl.value);
    utterance.volume = parseFloat(volEl.value);

    utterance.onstart = function() { setStatus('speaking'); };
    utterance.onend   = function() { setStatus('ready'); };
    utterance.onerror = function(e) { setStatus('ready'); showError('Speech error: ' + (e.error || 'unknown')); };

    speechSynthesis.speak(utterance);
  });

  pauseBtn.addEventListener('click', function() {
    if (typeof speechSynthesis === 'undefined') return;
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setStatus('paused');
    }
  });

  stopBtn.addEventListener('click', function() {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    setStatus('ready');
  });

  /* ── Init state ── */
  setStatus('ready');

  /* ── Register ── */
  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { init: function() {} };
})();

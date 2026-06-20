(function () {
  'use strict';

  var HANDLER = 'word-counter';
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
      '.tg-wc-word-count{color:var(--color-primary,#6366f1);font-weight:600}'
    ].join('');
    document.head.appendChild(style);
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  var STOP_WORDS = new Set([
    'the','a','an','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','will','would','could','should','may','might','shall','can',
    'to','of','and','or','but','in','on','at','by','for','with','about','from',
    'as','into','through','during','before','after','above','below','between',
    'this','that','these','those','it','its','i','you','he','she','we','they',
    'me','him','her','us','them','my','your','his','our','their'
  ]);

  /* ── Build UI ── */
  box.innerHTML = [
    '<div class="tg-ai5-form">',
    '  <div>',
    '    <label class="tg-ai5-label">Paste or Type Your Text</label>',
    '    <textarea class="tg-ai5-textarea" id="wc-text" style="min-height:250px" placeholder="Paste or type your text here..."></textarea>',
    '  </div>',
    '</div>',
    '<div class="tg-wc-grid" id="wc-grid">',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-words">0</div><div class="tg-wc-lbl">Words</div></div>',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-chars">0</div><div class="tg-wc-lbl">Characters (with spaces)</div></div>',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-chars-ns">0</div><div class="tg-wc-lbl">Characters (no spaces)</div></div>',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-sentences">0</div><div class="tg-wc-lbl">Sentences</div></div>',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-paras">0</div><div class="tg-wc-lbl">Paragraphs</div></div>',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-read">0 min</div><div class="tg-wc-lbl">Reading Time</div></div>',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-speak">0 min</div><div class="tg-wc-lbl">Speaking Time</div></div>',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-unique">0</div><div class="tg-wc-lbl">Unique Words</div></div>',
    '  <div class="tg-wc-card"><div class="tg-wc-val" id="wc-avglen">0</div><div class="tg-wc-lbl">Avg Word Length</div></div>',
    '</div>',
    '<div id="wc-extras" style="display:none">',
    '  <div class="tg-wc-words" id="wc-top-words">',
    '    <h4>Top 10 Most Used Words</h4>',
    '    <div id="wc-top-list"></div>',
    '  </div>',
    '  <div class="tg-wc-words" style="margin-top:12px">',
    '    <h4>Readability</h4>',
    '    <div id="wc-readability" style="font-size:15px;font-weight:600"></div>',
    '  </div>',
    '  <div class="tg-wc-words" style="margin-top:12px">',
    '    <h4>Longest Sentence</h4>',
    '    <div id="wc-longest" style="font-size:14px;line-height:1.7;background:#eff6ff;border-left:3px solid var(--color-primary,#6366f1);padding:10px 14px;border-radius:4px"></div>',
    '  </div>',
    '</div>'
  ].join('');

  var textarea = box.querySelector('#wc-text');
  var extrasEl = box.querySelector('#wc-extras');

  function getWords(text) {
    return text.match(/\b[a-zA-Z'-]+\b/g) || [];
  }

  function countSentences(text) {
    var matches = text.match(/[^.!?]*[.!?]+/g);
    return matches ? matches.length : (text.trim().length > 0 ? 1 : 0);
  }

  function readabilityLabel(score) {
    if (score >= 70) return { label: 'Easy', color: '#16a34a' };
    if (score >= 50) return { label: 'Standard', color: '#d97706' };
    if (score >= 30) return { label: 'Difficult', color: '#ea580c' };
    return { label: 'Very Difficult', color: '#dc2626' };
  }

  function fleschScore(text, wordList, sentenceCount) {
    if (!wordList.length || !sentenceCount) return 0;
    var syllableCount = wordList.reduce(function (acc, w) {
      return acc + countSyllables(w);
    }, 0);
    var asl = wordList.length / sentenceCount;
    var asw = syllableCount / wordList.length;
    return 206.835 - (1.015 * asl) - (84.6 * asw);
  }

  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return 1;
    word = word.replace(/e$/, '');
    var m = word.match(/[aeiou]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
  }

  function getLongestSentence(text) {
    var sentences = text.match(/[^.!?]+[.!?]*/g) || [];
    if (!sentences.length) return '';
    return sentences.reduce(function (a, b) { return a.trim().length >= b.trim().length ? a : b; }, '').trim();
  }

  function update() {
    var text = textarea.value;
    if (!text.trim()) {
      ['wc-words','wc-chars','wc-chars-ns','wc-sentences','wc-paras','wc-unique','wc-avglen'].forEach(function (id) {
        box.querySelector('#' + id).textContent = '0';
      });
      box.querySelector('#wc-read').textContent = '0 min';
      box.querySelector('#wc-speak').textContent = '0 min';
      extrasEl.style.display = 'none';
      return;
    }

    var wordList = getWords(text);
    var wordCount = wordList.length;
    var charsWith = text.length;
    var charsNo = text.replace(/\s/g, '').length;
    var sentences = countSentences(text);
    var paras = text.split(/\n{2,}/).filter(function (p) { return p.trim().length > 0; }).length || (text.trim().length > 0 ? 1 : 0);
    var readTime = Math.ceil(wordCount / 200);
    var speakTime = Math.ceil(wordCount / 130);
    var lowerWords = wordList.map(function (w) { return w.toLowerCase(); });
    var uniqueSet = new Set(lowerWords);
    var uniqueCount = uniqueSet.size;
    var totalChars = lowerWords.reduce(function (a, w) { return a + w.length; }, 0);
    var avgLen = wordCount ? (totalChars / wordCount).toFixed(1) : '0';

    box.querySelector('#wc-words').textContent = wordCount.toLocaleString();
    box.querySelector('#wc-chars').textContent = charsWith.toLocaleString();
    box.querySelector('#wc-chars-ns').textContent = charsNo.toLocaleString();
    box.querySelector('#wc-sentences').textContent = sentences.toLocaleString();
    box.querySelector('#wc-paras').textContent = paras.toLocaleString();
    box.querySelector('#wc-read').textContent = readTime + ' min';
    box.querySelector('#wc-speak').textContent = speakTime + ' min';
    box.querySelector('#wc-unique').textContent = uniqueCount.toLocaleString();
    box.querySelector('#wc-avglen').textContent = avgLen;

    /* top words */
    var freq = {};
    lowerWords.forEach(function (w) {
      if (!STOP_WORDS.has(w) && w.length > 1) { freq[w] = (freq[w] || 0) + 1; }
    });
    var topWords = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 10);
    box.querySelector('#wc-top-list').innerHTML = topWords.map(function (w) {
      return '<span class="tg-wc-word-item"><span>' + escHtml(w) + '</span><span class="tg-wc-word-count">' + freq[w] + '</span></span>';
    }).join('') || '<span style="color:#9ca3af;font-size:13px">No significant words yet</span>';

    /* readability */
    var flesch = fleschScore(text, lowerWords, sentences);
    var rl = readabilityLabel(flesch);
    box.querySelector('#wc-readability').innerHTML =
      '<span style="color:' + rl.color + '">' + rl.label + '</span>' +
      '<span style="font-size:12px;font-weight:400;color:#6b7280;margin-left:8px">(Flesch score: ' + Math.round(flesch) + ')</span>';

    /* longest sentence */
    var longest = getLongestSentence(text);
    box.querySelector('#wc-longest').textContent = longest || '—';

    extrasEl.style.display = 'block';
  }

  textarea.addEventListener('input', update);

  window.TGTools = window.TGTools || {};
  window.TGTools[HANDLER] = { handler: HANDLER, box: box };
})();

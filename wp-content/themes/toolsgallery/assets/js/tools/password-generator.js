(function () {
  'use strict';

  var HANDLER = 'password-generator';
  window.TGTools = window.TGTools || {};

  var box = document.querySelector('.tg-tool-box[data-handler="' + HANDLER + '"]');
  if (!box) return;

  if (!document.getElementById('tg-ai5-css')) {
    var style = document.createElement('style');
    style.id = 'tg-ai5-css';
    style.textContent = [
      '.tg-ai5-form{display:flex;flex-direction:column;gap:16px}',
      '.tg-ai5-label{display:block;font-size:13px;font-weight:600;color:var(--color-gray-700,#374151);margin-bottom:6px}',
      '.tg-ai5-input{width:100%;padding:10px 12px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:14px;font-family:inherit;box-sizing:border-box}',
      '.tg-ai5-toggles{display:flex;gap:8px;flex-wrap:wrap}',
      '.tg-ai5-toggle{padding:6px 14px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:20px;font-size:13px;cursor:pointer;background:#fff;transition:all .2s}',
      '.tg-ai5-toggle.active{background:var(--color-primary,#6366f1);color:#fff;border-color:var(--color-primary,#6366f1)}',
      '.tg-ai5-btn{padding:12px 28px;background:var(--color-primary,#6366f1);color:#fff;border:none;border-radius:var(--radius-md,8px);font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s}',
      '.tg-ai5-btn:hover{opacity:.9}',
      '.tg-ai5-error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:var(--radius-md,8px);padding:12px;margin-top:12px;display:none}',
      '.tg-ai5-error.show{display:block}',
      '.tg-pw-output{font-family:monospace;font-size:18px;background:var(--color-gray-50,#f9fafb);border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);padding:16px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;word-break:break-all}',
      '.tg-pw-strength{margin-top:12px}',
      '.tg-pw-bar{height:6px;border-radius:3px;background:var(--color-gray-200,#e5e7eb);margin-top:6px;overflow:hidden}',
      '.tg-pw-fill{height:100%;border-radius:3px;transition:width .3s,background .3s}',
      '.tg-pw-slider{width:100%;accent-color:var(--color-primary,#6366f1)}',
      '.tg-pw-len-display{font-size:20px;font-weight:700;color:var(--color-primary,#6366f1);min-width:30px;text-align:center}',
      '.tg-pw-check{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:14px;cursor:pointer}',
      '.tg-pw-check input{width:16px;height:16px;accent-color:var(--color-primary,#6366f1)}'
    ].join('');
    document.head.appendChild(style);
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
        if (opt.onChange) opt.onChange(opt.value);
      });
      wrap.appendChild(btn);
    });
    wrap.getValue = function () {
      var active = wrap.querySelector('.tg-ai5-toggle.active');
      return active ? active.dataset.value : defaultValue;
    };
    return wrap;
  }

  var WORDS = [
    'correct', 'horse', 'battery', 'staple', 'cloud', 'river', 'mountain', 'forest',
    'ocean', 'thunder', 'silver', 'golden', 'brave', 'swift', 'quiet', 'bright',
    'dark', 'red', 'blue', 'green', 'strong', 'light', 'heavy', 'small', 'large',
    'old', 'new', 'high', 'low', 'fast', 'warm', 'cool', 'bold', 'soft', 'rough',
    'smooth', 'clear', 'deep', 'wide', 'sharp', 'hard', 'wild', 'plain', 'tall',
    'round', 'flat', 'calm', 'still', 'free'
  ];

  var AMBIGUOUS = /[Il1O0]/g;
  var UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var LOWER = 'abcdefghijklmnopqrstuvwxyz';
  var DIGITS = '0123456789';
  var SYMBOLS = '!@#$%^&*()-_=+[]{};:\'",.<>?/|';
  var EXT_SYMBOLS = '~`\\^';

  function calcEntropy(poolSize, length) {
    return Math.floor(length * Math.log2(poolSize));
  }

  function strengthLabel(bits) {
    if (bits < 28) return { label: 'Weak', color: '#ef4444', pct: 15 };
    if (bits < 36) return { label: 'Fair', color: '#f97316', pct: 35 };
    if (bits < 60) return { label: 'Good', color: '#eab308', pct: 60 };
    if (bits < 128) return { label: 'Strong', color: '#3b82f6', pct: 80 };
    return { label: 'Very Strong', color: '#22c55e', pct: 100 };
  }

  function rand(max) {
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }

  function generatePassword(opts) {
    if (opts.memorable) {
      var count = opts.count || 4;
      var parts = [];
      for (var i = 0; i < count; i++) {
        parts.push(WORDS[rand(WORDS.length)]);
      }
      return parts.join('-');
    }

    var pool = '';
    if (opts.upper) pool += UPPER;
    if (opts.lower) pool += LOWER;
    if (opts.digits) pool += DIGITS;
    if (opts.symbols) pool += SYMBOLS;
    if (opts.extSymbols) pool += EXT_SYMBOLS;
    if (opts.custom) pool += opts.custom;

    if (opts.noAmbiguous) {
      pool = pool.replace(AMBIGUOUS, '');
    }

    if (!pool) return null;

    var pwd = '';
    for (var j = 0; j < opts.length; j++) {
      pwd += pool[rand(pool.length)];
    }
    return { password: pwd, poolSize: pool.length };
  }

  // Build form
  var form = document.createElement('div');
  form.className = 'tg-ai5-form';

  // Length slider
  var lenLabel = document.createElement('label');
  lenLabel.className = 'tg-ai5-label';
  lenLabel.textContent = 'Password length';
  var lenRow = document.createElement('div');
  lenRow.style.cssText = 'display:flex;align-items:center;gap:12px;';
  var slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'tg-pw-slider';
  slider.min = '8';
  slider.max = '64';
  slider.value = '16';
  slider.style.flex = '1';
  var lenDisplay = document.createElement('span');
  lenDisplay.className = 'tg-pw-len-display';
  lenDisplay.textContent = '16';
  slider.addEventListener('input', function () {
    lenDisplay.textContent = slider.value;
    generate();
  });
  lenRow.appendChild(slider);
  lenRow.appendChild(lenDisplay);
  var lenWrap = document.createElement('div');
  lenWrap.appendChild(lenLabel);
  lenWrap.appendChild(lenRow);
  form.appendChild(lenWrap);

  // Checkboxes
  var checksLabel = document.createElement('label');
  checksLabel.className = 'tg-ai5-label';
  checksLabel.textContent = 'Include characters';
  form.appendChild(checksLabel);

  function makeCheck(labelText, checked) {
    var wrap = document.createElement('label');
    wrap.className = 'tg-pw-check';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', generate);
    wrap.appendChild(cb);
    wrap.appendChild(document.createTextNode(labelText));
    form.appendChild(wrap);
    return cb;
  }

  var cbUpper = makeCheck('Uppercase letters (A-Z)', true);
  var cbLower = makeCheck('Lowercase letters (a-z)', true);
  var cbDigits = makeCheck('Numbers (0-9)', true);
  var cbSymbols = makeCheck('Symbols (!@#$%^&*()-_=+[]{};:\'",.<>?/|)', true);
  var cbExt = makeCheck('Extended symbols (~`\\^)', false);

  // Ambiguous
  var ambigLabel = document.createElement('label');
  ambigLabel.className = 'tg-ai5-label';
  ambigLabel.textContent = 'Exclude ambiguous characters (I, l, 1, O, 0)';
  var ambigToggle = makeToggleGroup([
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ], 'no');
  ambigToggle.addEventListener('click', function () { setTimeout(generate, 0); });
  var ambigWrap = document.createElement('div');
  ambigWrap.appendChild(ambigLabel);
  ambigWrap.appendChild(ambigToggle);
  form.appendChild(ambigWrap);

  // Number of passwords
  var countLabel = document.createElement('label');
  countLabel.className = 'tg-ai5-label';
  countLabel.textContent = 'Number of passwords';
  var countToggle = makeToggleGroup([
    { label: '1', value: '1' },
    { label: '5', value: '5' },
    { label: '10', value: '10' }
  ], '1');
  countToggle.addEventListener('click', function () { setTimeout(generate, 0); });
  var countWrap = document.createElement('div');
  countWrap.appendChild(countLabel);
  countWrap.appendChild(countToggle);
  form.appendChild(countWrap);

  // Memorable
  var memLabel = document.createElement('label');
  memLabel.className = 'tg-ai5-label';
  memLabel.textContent = 'Memorable mode (passphrase)';
  var memToggle = makeToggleGroup([
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ], 'no');
  memToggle.addEventListener('click', function () { setTimeout(generate, 0); });
  var memWrap = document.createElement('div');
  memWrap.appendChild(memLabel);
  memWrap.appendChild(memToggle);
  form.appendChild(memWrap);

  // Custom include
  var customLabel = document.createElement('label');
  customLabel.className = 'tg-ai5-label';
  customLabel.textContent = 'Custom characters to include (optional)';
  var customInput = document.createElement('input');
  customInput.type = 'text';
  customInput.className = 'tg-ai5-input';
  customInput.placeholder = 'Add specific characters';
  customInput.addEventListener('input', generate);
  var customWrap = document.createElement('div');
  customWrap.appendChild(customLabel);
  customWrap.appendChild(customInput);
  form.appendChild(customWrap);

  // Generate button
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tg-ai5-btn';
  btn.textContent = 'Generate Password';
  btn.addEventListener('click', generate);
  form.appendChild(btn);

  // Error
  var errorDiv = document.createElement('div');
  errorDiv.className = 'tg-ai5-error';
  form.appendChild(errorDiv);

  // Results area
  var resultsDiv = document.createElement('div');
  resultsDiv.style.display = 'none';
  form.appendChild(resultsDiv);

  // Strength meter
  var strengthDiv = document.createElement('div');
  strengthDiv.className = 'tg-pw-strength';
  strengthDiv.style.display = 'none';
  var strengthLabel2 = document.createElement('div');
  strengthLabel2.style.cssText = 'display:flex;justify-content:space-between;font-size:13px;font-weight:600;';
  var strengthText = document.createElement('span');
  var entropyText = document.createElement('span');
  entropyText.style.color = 'var(--color-gray-500,#6b7280)';
  strengthLabel2.appendChild(strengthText);
  strengthLabel2.appendChild(entropyText);
  var bar = document.createElement('div');
  bar.className = 'tg-pw-bar';
  var fill = document.createElement('div');
  fill.className = 'tg-pw-fill';
  bar.appendChild(fill);
  strengthDiv.appendChild(strengthLabel2);
  strengthDiv.appendChild(bar);
  form.appendChild(strengthDiv);

  box.appendChild(form);

  function generate() {
    var memorable = memToggle.getValue() === 'yes';
    var noAmbiguous = ambigToggle.getValue() === 'yes';
    var count = parseInt(countToggle.getValue(), 10);
    var length = parseInt(slider.value, 10);

    if (!memorable && !cbUpper.checked && !cbLower.checked && !cbDigits.checked && !cbSymbols.checked && !cbExt.checked && !customInput.value) {
      errorDiv.textContent = 'Please select at least one character type.';
      errorDiv.classList.add('show');
      resultsDiv.style.display = 'none';
      strengthDiv.style.display = 'none';
      return;
    }
    errorDiv.classList.remove('show');

    var passwords = [];
    var poolSize = 0;

    for (var i = 0; i < count; i++) {
      if (memorable) {
        var pw = generatePassword({ memorable: true, count: 4 });
        passwords.push({ password: pw, poolSize: WORDS.length });
        poolSize = WORDS.length;
      } else {
        var result = generatePassword({
          upper: cbUpper.checked,
          lower: cbLower.checked,
          digits: cbDigits.checked,
          symbols: cbSymbols.checked,
          extSymbols: cbExt.checked,
          custom: customInput.value,
          noAmbiguous: noAmbiguous,
          length: length
        });
        if (!result) {
          errorDiv.textContent = 'Please select at least one character type.';
          errorDiv.classList.add('show');
          return;
        }
        passwords.push(result);
        poolSize = result.poolSize;
      }
    }

    resultsDiv.innerHTML = '';
    passwords.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'tg-pw-output';

      var pwText = document.createElement('span');
      pwText.style.flex = '1';
      pwText.textContent = item.password;

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.style.cssText = 'padding:6px 14px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:6px;font-size:12px;cursor:pointer;background:#fff;white-space:nowrap;flex-shrink:0;';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(item.password).then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
        });
      });

      row.appendChild(pwText);
      row.appendChild(copyBtn);
      resultsDiv.appendChild(row);
    });

    resultsDiv.style.display = 'block';

    // Strength based on first password
    var pwLen = memorable ? passwords[0].password.length : length;
    var bits = memorable ? Math.floor(4 * Math.log2(WORDS.length)) : calcEntropy(poolSize, pwLen);
    var s = strengthLabel(bits);
    strengthText.textContent = s.label;
    strengthText.style.color = s.color;
    entropyText.textContent = '~' + bits + ' bits of entropy';
    fill.style.width = s.pct + '%';
    fill.style.background = s.color;
    strengthDiv.style.display = 'block';
  }

  // Generate on load
  generate();

  window.TGTools[HANDLER] = { box: box, generate: generate };
})();

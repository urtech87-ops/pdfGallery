/**
 * ToolsGallery — Lorem Ipsum Generator
 * Handler: lorem-ipsum-generator
 * Input type: data (no file upload) — self-contained init() tool.
 */
(function () {
  'use strict';

  var CONFIG = { handler: 'lorem-ipsum-generator', inputType: 'data' };

  window.TGTools = window.TGTools || {};

  function injectCSS() {
    if (document.getElementById('tg-ai5-css')) return;
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
      '.tg-ai5-action-btn{padding:8px 16px;border:1px solid var(--color-gray-200,#e5e7eb);border-radius:var(--radius-md,8px);font-size:13px;cursor:pointer;background:#fff;transition:all .2s}',
      '.tg-ai5-action-btn:hover{border-color:var(--color-primary,#6366f1);color:var(--color-primary,#6366f1)}',
      '.tg-ai5-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}',
      '.tg-ai5-meta{font-size:12px;color:var(--color-gray-500,#6b7280);margin-top:8px}'
    ].join('');
    document.head.appendChild(style);
  }

  var WORDS = {
    classic: [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
      'consequat', 'duis', 'aute', 'irure', 'reprehenderit', 'voluptate', 'velit',
      'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat',
      'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
      'mollit', 'anim', 'id', 'est', 'laborum'
    ],
    business: [
      'synergy', 'leverage', 'paradigm', 'scalable', 'agile', 'disruption', 'innovation',
      'ecosystem', 'bandwidth', 'velocity', 'monetize', 'optimize', 'stakeholder',
      'deliverable', 'onboarding', 'roadmap', 'pivot', 'benchmark', 'workflow',
      'pipeline', 'empower', 'holistic', 'cross-functional', 'data-driven', 'proactive',
      'value-add', 'best-practices', 'ROI', 'strategic', 'touchpoint', 'capacity-build',
      'KPIs', 'alignment', 'synergize', 'ideate', 'actionable', 'robust', 'scalability',
      'frictionless', 'seamless', 'growth-hack', 'mission-critical', 'disruptive'
    ],
    tech: [
      'blockchain', 'API', 'machine-learning', 'iterate', 'microservices', 'kubernetes',
      'docker', 'containerize', 'deploy', 'CI/CD', 'agile', 'scrum', 'sprint',
      'refactor', 'codebase', 'repository', 'endpoint', 'authentication', 'middleware',
      'cache', 'latency', 'scalability', 'infrastructure', 'cloud', 'serverless',
      'algorithm', 'recursion', 'framework', 'library', 'async', 'callback', 'promise',
      'webhook', 'integration', 'pipeline', 'query', 'schema', 'migration', 'devops',
      'orchestrate', 'containerized', 'stateless', 'idempotent', 'throughput'
    ]
  };

  var CLASSIC_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* Returns a nextWord() function for the chosen lorem type.
     Classic walks the canonical word list in order (traditional passage feel);
     Random Latin picks latin words at random; Business/Tech pick from their banks. */
  function makeWordSource(type) {
    if (type === 'Classic') {
      var idx = 0;
      return function () {
        var w = WORDS.classic[idx % WORDS.classic.length];
        idx++;
        return w;
      };
    }
    var pool = WORDS.classic;
    if (type === 'Business') pool = WORDS.business;
    if (type === 'Tech') pool = WORDS.tech;
    return function () { return pick(pool); };
  }

  function makeSentence(nextWord, minWords, maxWords) {
    var len = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
    var words = [];
    for (var i = 0; i < len; i++) {
      words.push(nextWord());
    }
    return capitalize(words.join(' ')) + '.';
  }

  function makeParagraph(nextWord, minSent, maxSent) {
    var count = minSent + Math.floor(Math.random() * (maxSent - minSent + 1));
    var sentences = [];
    for (var i = 0; i < count; i++) {
      sentences.push(makeSentence(nextWord, 5, 15));
    }
    return sentences.join(' ');
  }

  function generateText(opts) {
    var nextWord = makeWordSource(opts.type);
    var result = '';
    var startLorem = opts.startLorem;
    var htmlTag = opts.htmlTag; // 'none', 'p', 'div'

    function wrapTag(content) {
      if (htmlTag === 'p') return '<p>' + content + '</p>';
      if (htmlTag === 'div') return '<div>' + content + '</div>';
      return content;
    }

    if (opts.mode === 'Paragraphs') {
      var paragraphs = [];
      for (var i = 0; i < opts.amount; i++) {
        var para;
        if (i === 0 && startLorem && opts.type === 'Classic') {
          // First paragraph starts with classic Lorem ipsum
          var rest = makeParagraph(nextWord, 2, 5);
          para = CLASSIC_START + ' ' + rest;
        } else {
          para = makeParagraph(nextWord, 3, 7);
        }
        paragraphs.push(wrapTag(para));
      }
      result = paragraphs.join(htmlTag === 'none' ? '\n\n' : '\n');

    } else if (opts.mode === 'Words') {
      var words = [];
      if (startLorem && opts.type === 'Classic') {
        words = words.concat(['Lorem', 'ipsum', 'dolor', 'sit', 'amet,']);
      }
      while (words.length < opts.amount) {
        words.push(nextWord());
      }
      result = words.slice(0, opts.amount).join(' ');

    } else if (opts.mode === 'Sentences') {
      var sentences = [];
      if (startLorem && opts.type === 'Classic') {
        sentences.push(CLASSIC_START);
      }
      while (sentences.length < opts.amount) {
        sentences.push(makeSentence(nextWord, 5, 15));
      }
      sentences = sentences.slice(0, opts.amount);
      result = htmlTag === 'none' ? sentences.join(' ') : sentences.map(wrapTag).join('\n');

    } else if (opts.mode === 'Bytes') {
      var raw = '';
      if (startLorem && opts.type === 'Classic') {
        raw = CLASSIC_START + ' ';
      }
      while (raw.length < opts.amount) {
        raw += makeSentence(nextWord, 5, 10) + ' ';
      }
      result = raw.slice(0, opts.amount);
    }

    return result;
  }

  function init(box) {
    injectCSS();

    var container = box.querySelector('.tg-options') || box;
    if (container !== box) container.hidden = false;

    // ---- Build form ----
    var form = document.createElement('div');
    form.className = 'tg-ai5-form';

    // Mode + amount row
    var modeRow = document.createElement('div');
    modeRow.className = 'tg-ai5-row';

    var modeCol = document.createElement('div');
    modeCol.className = 'tg-ai5-col';
    var modeLabel = document.createElement('label');
    modeLabel.className = 'tg-ai5-label';
    modeLabel.textContent = 'Generate';
    var modeSelect = document.createElement('select');
    modeSelect.className = 'tg-ai5-select';
    ['Paragraphs', 'Words', 'Sentences', 'Bytes'].forEach(function (m) {
      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      modeSelect.appendChild(opt);
    });
    modeCol.appendChild(modeLabel);
    modeCol.appendChild(modeSelect);

    var amountCol = document.createElement('div');
    amountCol.className = 'tg-ai5-col';
    var amountLabel = document.createElement('label');
    amountLabel.className = 'tg-ai5-label';
    amountLabel.textContent = 'Amount';
    var amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'tg-ai5-input';
    amountInput.value = '5';
    amountInput.min = '1';
    amountCol.appendChild(amountLabel);
    amountCol.appendChild(amountInput);

    modeRow.appendChild(modeCol);
    modeRow.appendChild(amountCol);
    form.appendChild(modeRow);

    modeSelect.addEventListener('change', function () {
      var defaults = { Paragraphs: 5, Words: 100, Sentences: 10, Bytes: 500 };
      amountInput.value = defaults[modeSelect.value] || 5;
      generate();
    });

    function makeToggleGroup(items, defaultVal) {
      var wrap = document.createElement('div');
      wrap.className = 'tg-ai5-toggles';
      items.forEach(function (o) {
        var label = typeof o === 'string' ? o : o.label;
        var value = typeof o === 'string' ? o : o.value;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tg-ai5-toggle' + (value === defaultVal ? ' active' : '');
        btn.textContent = label;
        btn.dataset.value = value;
        btn.addEventListener('click', function () {
          wrap.querySelectorAll('.tg-ai5-toggle').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          generate();
        });
        wrap.appendChild(btn);
      });
      wrap.getValue = function () {
        var a = wrap.querySelector('.tg-ai5-toggle.active');
        return a ? a.dataset.value : defaultVal;
      };
      return wrap;
    }

    // Lorem type
    var typeLabel = document.createElement('label');
    typeLabel.className = 'tg-ai5-label';
    typeLabel.textContent = 'Lorem type';
    var typeToggle = makeToggleGroup(['Classic', 'Random Latin', 'Business', 'Tech'], 'Classic');
    var typeWrap = document.createElement('div');
    typeWrap.appendChild(typeLabel);
    typeWrap.appendChild(typeToggle);
    form.appendChild(typeWrap);

    // Start with Lorem ipsum
    var startLabel = document.createElement('label');
    startLabel.className = 'tg-ai5-label';
    startLabel.textContent = 'Start with "Lorem ipsum..."';
    var startToggle = makeToggleGroup(['Yes', 'No'], 'Yes');
    var startWrap = document.createElement('div');
    startWrap.appendChild(startLabel);
    startWrap.appendChild(startToggle);
    form.appendChild(startWrap);

    // HTML tags
    var htmlLabel = document.createElement('label');
    htmlLabel.className = 'tg-ai5-label';
    htmlLabel.textContent = 'HTML tags';
    var htmlToggle = makeToggleGroup(
      [{ label: 'None', value: 'none' }, { label: '<p> tags', value: 'p' }, { label: '<div> tags', value: 'div' }],
      'none'
    );
    var htmlWrap = document.createElement('div');
    htmlWrap.appendChild(htmlLabel);
    htmlWrap.appendChild(htmlToggle);
    form.appendChild(htmlWrap);

    // Button
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tg-ai5-btn';
    btn.textContent = 'Generate';
    btn.addEventListener('click', generate);
    form.appendChild(btn);

    // Output textarea
    var outputTA = document.createElement('textarea');
    outputTA.className = 'tg-ai5-textarea';
    outputTA.style.minHeight = '220px';
    outputTA.readOnly = false;
    form.appendChild(outputTA);

    // Stats
    var statsDiv = document.createElement('div');
    statsDiv.className = 'tg-ai5-meta';
    form.appendChild(statsDiv);

    // Actions
    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'tg-ai5-actions';

    var copyBtn = document.createElement('button');
    copyBtn.className = 'tg-ai5-action-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(outputTA.value).then(function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
      });
    });

    var clearBtn = document.createElement('button');
    clearBtn.className = 'tg-ai5-action-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', function () {
      outputTA.value = '';
      statsDiv.textContent = '';
    });

    var regenBtn = document.createElement('button');
    regenBtn.className = 'tg-ai5-action-btn';
    regenBtn.textContent = 'Regenerate';
    regenBtn.addEventListener('click', generate);

    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(clearBtn);
    actionsDiv.appendChild(regenBtn);
    form.appendChild(actionsDiv);

    container.appendChild(form);

    amountInput.addEventListener('input', generate);

    function generate() {
      var amount = parseInt(amountInput.value, 10) || 1;
      var text = generateText({
        mode: modeSelect.value,
        amount: amount,
        type: typeToggle.getValue(),
        startLorem: startToggle.getValue() === 'Yes',
        htmlTag: htmlToggle.getValue()
      });
      outputTA.value = text;
      var words = text.trim() ? text.trim().split(/\s+/).length : 0;
      var chars = text.length;
      statsDiv.textContent = words + ' words, ' + chars + ' characters';
    }

    generate();
  }

  window.TGTools[CONFIG.handler] = { init: init, CONFIG: CONFIG };
})();

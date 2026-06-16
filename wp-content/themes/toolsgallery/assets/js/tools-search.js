/* ToolsGallery — tools-search.js */
(function () {
  'use strict';

  var input       = document.getElementById('tg-search-input');
  var tabsWrap    = document.getElementById('tg-tools-tabs');
  var sectionsWrap = document.getElementById('tg-tools-sections');
  var resultsWrap = document.getElementById('tg-search-results');
  var countEl     = document.getElementById('tg-search-count');
  var cardsEl     = document.getElementById('tg-search-cards');
  var emptyEl     = document.getElementById('tg-search-empty');
  var tabs        = document.querySelectorAll('.tg-tools-tab');
  var sections    = document.querySelectorAll('.tg-tools-section');

  if (!input || !window.TGTools) return;

  // Generic document SVG used when no SVG icon is stored
  var FALLBACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildCard(tool) {
    return '<div class="tg-tool-card tg-tool-card--featured">'
      + '<span class="tg-tool-card__badge tg-tool-card__badge--green">FREE</span>'
      + '<div class="tg-tool-card__svg" aria-hidden="true">' + FALLBACK_SVG + '</div>'
      + '<h3 class="tg-tool-card__title">' + escapeHtml(tool.name) + '</h3>'
      + '<p class="tg-tool-card__desc">' + escapeHtml(tool.desc) + '</p>'
      + '<a class="tg-tool-card__cta" href="' + escapeHtml(tool.url) + '">Use Free →</a>'
      + '</div>';
  }

  var debounceTimer;

  function doSearch(query) {
    var q = query.trim();

    if (!q) {
      // Restore normal view
      resultsWrap.hidden = true;
      sectionsWrap.hidden = false;
      if (tabsWrap) tabsWrap.hidden = false;
      return;
    }

    // Hide normal sections and tabs during search
    sectionsWrap.hidden = true;
    if (tabsWrap) tabsWrap.hidden = true;
    resultsWrap.hidden = false;

    var lower = q.toLowerCase();
    var matches = window.TGTools.filter(function (t) {
      return t.name.toLowerCase().indexOf(lower) !== -1
        || t.desc.toLowerCase().indexOf(lower) !== -1;
    });

    if (matches.length === 0) {
      cardsEl.innerHTML = '';
      countEl.textContent = '';
      emptyEl.textContent = 'No tools found for “' + q + '”. Try a different search term.';
      emptyEl.hidden = false;
    } else {
      emptyEl.hidden = true;
      var plural = matches.length === 1 ? 'result' : 'results';
      countEl.textContent = matches.length + ' ' + plural + ' for “' + q + '”';
      cardsEl.innerHTML = matches.map(buildCard).join('');
    }
  }

  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    var val = input.value;
    debounceTimer = setTimeout(function () { doSearch(val); }, 200);
  });

  // Category tab filtering
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var cat = tab.getAttribute('data-cat');

      // Update active tab
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      // Show/hide sections
      sections.forEach(function (sec) {
        if (cat === 'all' || sec.getAttribute('data-category') === cat) {
          sec.classList.remove('is-hidden');
        } else {
          sec.classList.add('is-hidden');
        }
      });

      // Support ?cat= URL param on initial load
      try {
        var url = new URL(window.location.href);
        if (cat === 'all') {
          url.searchParams.delete('cat');
        } else {
          url.searchParams.set('cat', cat);
        }
        history.replaceState(null, '', url.toString());
      } catch (e) { /* ignore */ }
    });
  });

  // Activate tab matching ?cat= URL param on page load
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var catParam  = urlParams.get('cat');
    if (catParam) {
      var matchTab = document.querySelector('.tg-tools-tab[data-cat="' + catParam + '"]');
      if (matchTab) matchTab.click();
    }
  } catch (e) { /* ignore */ }
})();

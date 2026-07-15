/* Tool Acadmy — main.js */
(function () {
  'use strict';

  /* --- Mobile menu drawer --- */
  (function () {
    var btn      = document.getElementById('tg-mobile-menu-btn');
    var menu     = document.getElementById('tg-mobile-menu');
    var overlay  = document.getElementById('tg-mobile-overlay');
    var closeBtn = document.getElementById('tg-mobile-close-btn');

    if (!btn || !menu) return;

    function openMenu() {
      menu.classList.add('tg-open');
      if (overlay) overlay.classList.add('tg-open');
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      var firstLink = menu.querySelector('.tg-mobile-nav-link');
      if (firstLink) firstLink.focus();
    }

    function closeMenu() {
      menu.classList.remove('tg-open');
      if (overlay) overlay.classList.remove('tg-open');
      menu.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      btn.focus();
    }

    btn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('tg-open')) closeMenu();
    });

    menu.querySelectorAll('.tg-mobile-nav-link').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) closeMenu();
    });
  }());

  /* FAQ accordions use native <details>[open] — no JS needed; styling lives in main.css. */

  /* --- Search field enhancements (Cmd+K, suggestions, clear) --- */
  var searchInput = document.getElementById('tg-search-input');
  var searchClear = document.getElementById('tg-search-clear');
  var searchSuggestions = document.getElementById('tg-search-suggestions');

  if (searchInput) {
    // Cmd+K / Ctrl+K focuses search
    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    // Show suggestions on focus (when empty)
    searchInput.addEventListener('focus', function() {
      if (searchSuggestions && !searchInput.value.trim()) {
        searchSuggestions.style.display = 'block';
      }
    });

    // Hide suggestions on blur
    searchInput.addEventListener('blur', function() {
      setTimeout(function() {
        if (searchSuggestions) searchSuggestions.style.display = 'none';
      }, 200);
    });

    // Show/hide clear button
    searchInput.addEventListener('input', function() {
      if (searchClear) {
        searchClear.style.display = searchInput.value ? 'flex' : 'none';
      }
      if (searchSuggestions) {
        searchSuggestions.style.display = searchInput.value ? 'none' : 'block';
      }
    });

    // Clear button action
    if (searchClear) {
      searchClear.addEventListener('click', function() {
        searchInput.value = '';
        searchClear.style.display = 'none';
        searchInput.focus();
        // Trigger input event for search reset
        searchInput.dispatchEvent(new Event('input'));
      });
    }

    // Quick search pill click
    document.querySelectorAll('.tg-search-quick').forEach(function(btn) {
      btn.addEventListener('click', function() {
        searchInput.value = btn.dataset.query || btn.textContent;
        if (searchSuggestions) searchSuggestions.style.display = 'none';
        searchInput.dispatchEvent(new Event('input'));
        if (searchClear) searchClear.style.display = 'flex';
      });
    });
  }

  /* --- Category filter pills --- */
  document.querySelectorAll('.tg-filter-pill').forEach(function(pill) {
    pill.addEventListener('click', function() {
      document.querySelectorAll('.tg-filter-pill').forEach(function(p) {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      var filter = this.dataset.filter || this.dataset.cat;
      document.querySelectorAll('.tg-tools-section').forEach(function(s) {
        if (filter === 'all') {
          s.style.display = 'block';
        } else {
          s.style.display = s.dataset.category === filter ? 'block' : 'none';
        }
      });
      var gridWrapper = document.querySelector('#tg-tools-sections');
      if (gridWrapper) gridWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

// Mobile category accordion
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.tg-mobile-cat__btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tools = this.nextElementSibling;
      var expanded = this.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.tg-mobile-cat__btn').forEach(function(b) {
        b.setAttribute('aria-expanded', 'false');
        b.nextElementSibling.setAttribute('hidden', '');
      });
      if (!expanded) {
        this.setAttribute('aria-expanded', 'true');
        tools.removeAttribute('hidden');
      }
    });
  });

  // Mobile search filter
  var mobileSearch = document.getElementById('tg-mobile-search');
  if (mobileSearch) {
    mobileSearch.addEventListener('input', function() {
      var q = this.value.toLowerCase();
      document.querySelectorAll('.tg-mobile-cat__tool').forEach(function(link) {
        link.style.display = link.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      if (q.length > 1) {
        document.querySelectorAll('.tg-mobile-cat').forEach(function(cat) {
          var hasMatch = Array.from(cat.querySelectorAll('.tg-mobile-cat__tool')).some(function(l) {
            return l.style.display !== 'none';
          });
          var btn = cat.querySelector('.tg-mobile-cat__btn');
          var toolsPanel = cat.querySelector('.tg-mobile-cat__tools');
          if (hasMatch) {
            btn.setAttribute('aria-expanded', 'true');
            toolsPanel.removeAttribute('hidden');
          } else {
            btn.setAttribute('aria-expanded', 'false');
            toolsPanel.setAttribute('hidden', '');
          }
        });
      }
    });
  }
});

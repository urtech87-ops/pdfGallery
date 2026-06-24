/* Tool Acadmy — main.js */
(function () {
  'use strict';

  /* --- Mobile nav toggle --- */
  var hamburger = document.querySelector('.tg-header__hamburger');
  var mobileNav = document.querySelector('.tg-mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  /* --- FAQ accordion (legacy .tg-faq__item) --- */
  var faqItems = document.querySelectorAll('.tg-faq__item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.tg-faq__question');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (i) { i.classList.remove('is-open'); });
      if (!isOpen) item.classList.add('is-open');
    });
  });

  /* --- FAQ accordion (.tg-faq-item) — max-height animation --- */
  var tgFaqItems = document.querySelectorAll('.tg-faq-item');
  tgFaqItems.forEach(function (item) {
    var question = item.querySelector('.tg-faq-question');
    var icon     = item.querySelector('.tg-faq-icon');
    if (!question) return;
    if (icon && !icon.textContent.trim()) icon.textContent = '+';
    question.addEventListener('click', function () {
      var isOpen = item.classList.contains('tg-faq-open');
      // Close all
      tgFaqItems.forEach(function (other) {
        var otherIcon = other.querySelector('.tg-faq-icon');
        other.classList.remove('tg-faq-open');
        if (otherIcon && !other.classList.contains('tg-faq-open')) {
          otherIcon.textContent = '+';
        }
      });
      // Open clicked if was closed
      if (!isOpen) {
        item.classList.add('tg-faq-open');
        if (icon) icon.textContent = '+'; // CSS rotate handles visual
      }
    });
  });

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
